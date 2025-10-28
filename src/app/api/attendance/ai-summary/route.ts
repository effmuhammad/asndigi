import { NextRequest, NextResponse } from "next/server"
import { auth } from "../../../../../auth"
import { prisma } from "@/lib/prisma"
import { generateAttendanceSummary, AttendanceSummaryData } from "@/lib/openai"
import { z } from "zod"

// Schema for attendance summary request
const attendanceSummarySchema = z.object({
  month: z.string().optional(), // Format: MM (month number as string)
  year: z.string().optional(),  // Format: YYYY
  user_id: z.string().optional(), // For supervisor/admin to get subordinate summary
})

export async function POST(request: NextRequest) {
  try {
    const session = await auth()
    if (!session?.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const body = await request.json()
    const validatedData = attendanceSummarySchema.parse(body)

    // Determine target user ID
    let targetUserId = session.user.id
    
    // If user_id is provided, check if current user has permission
    if (validatedData.user_id) {
      if (session.user.role !== 'SUPERVISOR' && session.user.role !== 'ADMIN') {
        return NextResponse.json(
          { error: "Insufficient permissions to view other user's data" },
          { status: 403 }
        )
      }
      
      // For supervisors, verify they supervise the target user
      if (session.user.role === 'SUPERVISOR') {
        const targetUser = await prisma.user.findUnique({
          where: { id: validatedData.user_id },
          select: { supervisor_id: true }
        })
        
        if (!targetUser || targetUser.supervisor_id !== session.user.id) {
          return NextResponse.json(
            { error: "You can only view summaries for your subordinates" },
            { status: 403 }
          )
        }
      }
      
      targetUserId = validatedData.user_id
    }

    // Get target user info
    const targetUser = await prisma.user.findUnique({
      where: { id: targetUserId },
      select: { name: true, nip: true }
    })

    if (!targetUser) {
      return NextResponse.json({ error: "User not found" }, { status: 404 })
    }

    // Determine date range
    let startDate: Date
    let endDate: Date
    let periodLabel: string

    if (validatedData.month && validatedData.year) {
      // Use provided month and year
      const monthNum = parseInt(validatedData.month)
      const yearNum = parseInt(validatedData.year)
      startDate = new Date(yearNum, monthNum - 1, 1)
      endDate = new Date(yearNum, monthNum, 0)
      periodLabel = `${getMonthName(monthNum)} ${yearNum}`
    } else if (validatedData.year) {
      // Parse year format YYYY
      startDate = new Date(parseInt(validatedData.year), 0, 1)
      endDate = new Date(parseInt(validatedData.year), 11, 31)
      periodLabel = `Tahun ${validatedData.year}`
    } else {
      // Default to current month
      const now = new Date()
      startDate = new Date(now.getFullYear(), now.getMonth(), 1)
      endDate = new Date(now.getFullYear(), now.getMonth() + 1, 0)
      periodLabel = `${getMonthName(now.getMonth() + 1)} ${now.getFullYear()}`
    }

    // Fetch attendance data
    const attendanceRecords = await prisma.attendance.findMany({
      where: {
        user_id: targetUserId,
        attendance_date: {
          gte: startDate,
          lte: endDate,
        },
      },
      orderBy: {
        attendance_date: "asc",
      },
    })

    if (attendanceRecords.length === 0) {
      return NextResponse.json(
        { error: "No attendance data found for the specified period" },
        { status: 404 }
      )
    }

    // Transform data for OpenAI
    const attendanceData: AttendanceSummaryData[] = attendanceRecords.map(record => {
      let workingHours = 0
      if (record.check_in && record.check_out) {
        const checkIn = new Date(record.check_in)
        const checkOut = new Date(record.check_out)
        workingHours = (checkOut.getTime() - checkIn.getTime()) / (1000 * 60 * 60)
      }

      return {
        attendance_date: record.attendance_date.toISOString().split('T')[0],
        check_in: record.check_in ? record.check_in.toLocaleTimeString('id-ID') : null,
        check_out: record.check_out ? record.check_out.toLocaleTimeString('id-ID') : null,
        status: record.status,
        location_data: record.location_data as Record<string, unknown> | undefined,
        working_hours: Math.round(workingHours * 100) / 100
      }
    })

    // Generate AI summary
    const aiSummary = await generateAttendanceSummary(
      attendanceData,
      targetUser.name,
      periodLabel
    )

    return NextResponse.json({
      success: true,
      data: {
        user: {
          name: targetUser.name,
          nip: targetUser.nip
        },
        period: periodLabel,
        summary: aiSummary
      }
    })

  } catch (error) {
    console.error("Error generating attendance summary:", error)
    
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: "Invalid request data", details: error.issues },
        { status: 400 }
      )
    }

    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    )
  }
}

export async function GET(request: NextRequest) {
  try {
    const session = await auth()
    if (!session?.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const { searchParams } = new URL(request.url)
    const month = searchParams.get("month") // Format: YYYY-MM
    const year = searchParams.get("year")   // Format: YYYY
    const userId = searchParams.get("user_id")

    // Determine target user ID
    let targetUserId = session.user.id
    
    // If user_id is provided, check permissions
    if (userId) {
      if (session.user.role !== 'SUPERVISOR' && session.user.role !== 'ADMIN') {
        return NextResponse.json(
          { error: "Insufficient permissions" },
          { status: 403 }
        )
      }
      
      // For supervisors, verify they supervise the target user
      if (session.user.role === 'SUPERVISOR') {
        const targetUser = await prisma.user.findUnique({
          where: { id: userId },
          select: { supervisor_id: true }
        })
        
        if (!targetUser || targetUser.supervisor_id !== session.user.id) {
          return NextResponse.json(
            { error: "You can only view data for your subordinates" },
            { status: 403 }
          )
        }
      }
      
      targetUserId = userId
    }

    // Determine date range
    let startDate: Date
    let endDate: Date

    if (month) {
      const [yearStr, monthStr] = month.split("-")
      startDate = new Date(parseInt(yearStr), parseInt(monthStr) - 1, 1)
      endDate = new Date(parseInt(yearStr), parseInt(monthStr), 0)
    } else if (year) {
      startDate = new Date(parseInt(year), 0, 1)
      endDate = new Date(parseInt(year), 11, 31)
    } else {
      const now = new Date()
      startDate = new Date(now.getFullYear(), now.getMonth(), 1)
      endDate = new Date(now.getFullYear(), now.getMonth() + 1, 0)
    }

    // Get attendance statistics
    const attendanceRecords = await prisma.attendance.findMany({
      where: {
        user_id: targetUserId,
        attendance_date: {
          gte: startDate,
          lte: endDate,
        },
      },
    })

    const totalDays = attendanceRecords.length
    const presentDays = attendanceRecords.filter(r => 
      ['PRESENT', 'LATE', 'EARLY_LEAVE'].includes(r.status)
    ).length
    const lateDays = attendanceRecords.filter(r => r.status === 'LATE').length
    const absentDays = attendanceRecords.filter(r => 
      ['ABSENT', 'SICK', 'LEAVE'].includes(r.status)
    ).length

    const attendanceRate = totalDays > 0 ? (presentDays / totalDays) * 100 : 0
    const punctualityRate = totalDays > 0 ? ((presentDays - lateDays) / totalDays) * 100 : 0

    // Group by status for detailed breakdown
    const statusBreakdown = attendanceRecords.reduce((acc, record) => {
      acc[record.status] = (acc[record.status] || 0) + 1
      return acc
    }, {} as Record<string, number>)

    return NextResponse.json({
      success: true,
      data: {
        period: {
          start_date: startDate.toISOString().split('T')[0],
          end_date: endDate.toISOString().split('T')[0]
        },
        statistics: {
          total_days: totalDays,
          present_days: presentDays,
          late_days: lateDays,
          absent_days: absentDays,
          attendance_rate: Math.round(attendanceRate * 100) / 100,
          punctuality_rate: Math.round(punctualityRate * 100) / 100
        },
        status_breakdown: statusBreakdown
      }
    })

  } catch (error) {
    console.error("Error fetching attendance statistics:", error)
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    )
  }
}

// Helper function to get Indonesian month names
function getMonthName(month: number): string {
  const months = [
    "Januari", "Februari", "Maret", "April", "Mei", "Juni",
    "Juli", "Agustus", "September", "Oktober", "November", "Desember"
  ]
  return months[month - 1] || "Unknown"
}