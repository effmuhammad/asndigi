import { NextRequest, NextResponse } from 'next/server'
import { z } from 'zod'
import { prisma } from '@/lib/prisma'
import { auth } from '@/auth'
import { UserRole, WorkResultRating, BehaviorRating, PerformancePredicate } from '@prisma/client'
import { 
  calculateSkpCompletionPercentage,
  calculatePerformancePredicate,
  calculateAttendancePercentage,
  determineWorkResultRating,
  determineBehaviorRating,
  generatePerformanceSummaryText
} from '@/lib/performance-utils'

// Validation schemas
const createAnnualPerformanceReportSchema = z.object({
  user_id: z.string(),
  year: z.number().int().min(2020).max(2030),
  self_assessment: z.string().optional(),
  achievements: z.string().optional(),
  challenges: z.string().optional(),
  improvement_plan: z.string().optional()
})

const updateAnnualPerformanceReportSchema = z.object({
  self_assessment: z.string().optional(),
  achievements: z.string().optional(),
  challenges: z.string().optional(),
  improvement_plan: z.string().optional()
})

// GET - Fetch annual performance reports
export async function GET(request: NextRequest) {
  try {
    const session = await auth()
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { searchParams } = new URL(request.url)
    const year = searchParams.get('year')
    const userId = searchParams.get('user_id')

    // Authorization check
    const isAdmin = session.user.role === UserRole.ADMIN
    const isSupervisor = session.user.role === UserRole.SUPERVISOR
    const isOwnData = userId === session.user.id

    if (!isAdmin && !isSupervisor && !isOwnData) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
    }

    const whereClause: any = {}
    
    if (year) {
      whereClause.year = parseInt(year)
    }
    
    if (userId) {
      whereClause.user_id = userId
    } else if (!isAdmin && !isSupervisor) {
      whereClause.user_id = session.user.id
    }

    const reports = await prisma.annualPerformanceReport.findMany({
      where: whereClause,
      include: {
        user: {
          select: {
            id: true,
            name: true,
            email: true,
            nip: true,
            position: true,
            work_unit: true
          }
        },
        supervisor_evaluation: {
          include: {
            supervisor: {
              select: {
                name: true,
                nip: true
              }
            }
          }
        },
        digital_signature: {
          include: {
            signer: {
              select: {
                name: true,
                nip: true
              }
            }
          }
        }
      },
      orderBy: [
        { year: 'desc' },
        { created_at: 'desc' }
      ]
    })

    return NextResponse.json({ reports })
  } catch (error) {
    console.error('Error fetching annual performance reports:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}

// POST - Create new annual performance report
export async function POST(request: NextRequest) {
  try {
    const session = await auth()
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const body = await request.json()
    const validatedData = createAnnualPerformanceReportSchema.parse(body)

    // Authorization check - only admin or the user themselves can create
    if (session.user.role !== UserRole.ADMIN && validatedData.user_id !== session.user.id) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
    }

    // Check if report already exists for this user and year
    const existingReport = await prisma.annualPerformanceReport.findUnique({
      where: {
        user_id_year: {
          user_id: validatedData.user_id,
          year: validatedData.year
        }
      }
    })

    if (existingReport) {
      return NextResponse.json(
        { error: 'Annual performance report already exists for this year' },
        { status: 409 }
      )
    }

    // Fetch attendance data for the year
    const startDate = new Date(validatedData.year, 0, 1)
    const endDate = new Date(validatedData.year, 11, 31)

    const attendanceRecords = await prisma.attendance.findMany({
      where: {
        user_id: validatedData.user_id,
        attendance_date: {
          gte: startDate,
          lte: endDate
        }
      }
    })

    // Fetch SKP data for the year
    const skpEntries = await prisma.skpMonthlyEntry.findMany({
      where: {
        user_id: validatedData.user_id,
        created_at: {
          gte: startDate,
          lte: endDate
        }
      }
    })

    // Calculate performance metrics
    const attendancePercentage = calculateAttendancePercentage(attendanceRecords)
    const skpCompletionPercentage = calculateSkpCompletionPercentage(skpEntries)
    
    const workResultRating = determineWorkResultRating(skpCompletionPercentage)
    const behaviorRating = determineBehaviorRating(attendancePercentage)
    const performancePredicate = calculatePerformancePredicate(workResultRating, behaviorRating)

    // Generate AI summary
    const aiSummary = generatePerformanceSummaryText(
      workResultRating,
      behaviorRating,
      performancePredicate,
      attendancePercentage,
      skpCompletionPercentage
    )

    // Create attendance and SKP summaries
    const attendanceSummary = {
      totalDays: attendanceRecords.length,
      presentDays: attendanceRecords.filter(a => a.status === 'PRESENT').length,
      percentage: attendancePercentage
    }

    const skpSummary = {
      totalEntries: skpEntries.length,
      completedEntries: skpEntries.filter(e => e.status === 'APPROVED').length,
      percentage: skpCompletionPercentage
    }

    const report = await prisma.annualPerformanceReport.create({
      data: {
        user_id: validatedData.user_id,
        year: validatedData.year,
        attendance_summary: attendanceSummary,
        skp_summary: skpSummary,
        work_result_rating: workResultRating,
        behavior_rating: behaviorRating,
        performance_predicate: performancePredicate,
        ai_generated_summary: aiSummary,
        self_assessment: validatedData.self_assessment,
        achievements: validatedData.achievements,
        challenges: validatedData.challenges,
        improvement_plan: validatedData.improvement_plan
      },
      include: {
        user: {
          select: {
            id: true,
            name: true,
            email: true,
            nip: true,
            position: true,
            work_unit: true
          }
        }
      }
    })

    return NextResponse.json({ report }, { status: 201 })
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: 'Validation failed', details: error.issues },
        { status: 400 }
      )
    }

    console.error('Error creating annual performance report:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}