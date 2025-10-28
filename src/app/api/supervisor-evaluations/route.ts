import { NextRequest, NextResponse } from "next/server"
import { auth } from "../../../../auth"
import { prisma } from "@/lib/prisma"
import { z } from "zod"
import { generateSupervisorRecommendations } from "@/lib/openai-annual-performance"

// Schema for creating supervisor evaluation
const createSupervisorEvaluationSchema = z.object({
  annual_report_id: z.string(),
  work_quality_score: z.number().min(1).max(5),
  work_quantity_score: z.number().min(1).max(5),
  punctuality_score: z.number().min(1).max(5),
  cooperation_score: z.number().min(1).max(5),
  initiative_score: z.number().min(1).max(5),
  leadership_score: z.number().min(1).max(5).optional(),
  overall_rating: z.number().min(1).max(5),
  supervisor_comments: z.string().optional(),
  recommendations: z.string().optional(),
  development_areas: z.string().optional(),
  strengths: z.string().optional(),
})

// Schema for updating supervisor evaluation
const updateSupervisorEvaluationSchema = z.object({
  work_quality_score: z.number().min(1).max(5).optional(),
  work_quantity_score: z.number().min(1).max(5).optional(),
  punctuality_score: z.number().min(1).max(5).optional(),
  cooperation_score: z.number().min(1).max(5).optional(),
  initiative_score: z.number().min(1).max(5).optional(),
  leadership_score: z.number().min(1).max(5).optional(),
  overall_rating: z.number().min(1).max(5).optional(),
  supervisor_comments: z.string().optional(),
  recommendations: z.string().optional(),
  development_areas: z.string().optional(),
  strengths: z.string().optional(),
})

// GET - Fetch supervisor evaluations
export async function GET(request: NextRequest) {
  try {
    const session = await auth()
    if (!session?.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const { searchParams } = new URL(request.url)
    const reportId = searchParams.get("report_id")
    const supervisorId = searchParams.get("supervisor_id")
    const employeeId = searchParams.get("employee_id")

    // Check user role
    const currentUser = await prisma.user.findUnique({
      where: { id: session.user.id },
      select: { role: true }
    })

    const whereClause: Record<string, any> = {}

    if (reportId) {
      whereClause.annual_report_id = reportId
    }

    if (supervisorId) {
      whereClause.supervisor_id = supervisorId
    }

    if (employeeId) {
      whereClause.annual_report = {
        user_id: employeeId
      }
    }

    // Apply authorization filters
    if (currentUser?.role === "STAFF") {
      // Users can only see evaluations of their own reports
      whereClause.annual_report = {
        ...whereClause.annual_report,
        user_id: session.user.id
      }
    } else if (currentUser?.role === "SUPERVISOR") {
      // Supervisors can see evaluations they created or for their subordinates
      whereClause.OR = [
        { supervisor_id: session.user.id },
        {
          annual_report: {
            user: {
              supervisor_id: session.user.id
            }
          }
        }
      ]
    }
    // ADMIN can see all evaluations (no additional filters)

    const evaluations = await prisma.supervisorEvaluation.findMany({
      where: whereClause,
      include: {
        supervisor: {
          select: { name: true, nip: true, position: true }
        },
        employee: {
          select: { name: true, nip: true, position: true }
        },
        annual_report: {
          select: { 
            year: true, 
            performance_predicate: true,
            status: true
          }
        }
      },
      orderBy: { created_at: "desc" }
    })

    return NextResponse.json({
      success: true,
      data: evaluations
    })

  } catch (error) {
    console.error("Error fetching supervisor evaluations:", error)
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    )
  }
}

// POST - Create supervisor evaluation
export async function POST(request: NextRequest) {
  try {
    const session = await auth()
    if (!session?.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const body = await request.json()
    const validatedData = createSupervisorEvaluationSchema.parse(body)

    // Check if user is supervisor or admin
    const currentUser = await prisma.user.findUnique({
      where: { id: session.user.id },
      select: { role: true }
    })

    if (currentUser?.role !== "SUPERVISOR" && currentUser?.role !== "ADMIN") {
      return NextResponse.json({ 
        error: "Only supervisors and admins can create evaluations" 
      }, { status: 403 })
    }

    // Check if annual performance report exists and get employee info
    const annualReport = await prisma.annualPerformanceReport.findUnique({
      where: { id: validatedData.annual_report_id },
      include: {
        user: {
          select: { 
            id: true, 
            name: true, 
            supervisor_id: true
          }
        }
      }
    })

    if (!annualReport) {
      return NextResponse.json({ 
        error: "Annual performance report not found" 
      }, { status: 404 })
    }

    // Check if supervisor is authorized to evaluate this employee
    if (currentUser?.role === "SUPERVISOR" && annualReport.user.supervisor_id !== session.user.id) {
      return NextResponse.json({ 
        error: "You can only evaluate your direct subordinates" 
      }, { status: 403 })
    }

    // Check if evaluation already exists
    const existingEvaluation = await prisma.supervisorEvaluation.findFirst({
      where: {
        annual_report_id: validatedData.annual_report_id,
        supervisor_id: session.user.id
      }
    })

    if (existingEvaluation) {
      return NextResponse.json({ 
        error: "Evaluation already exists for this report" 
      }, { status: 409 })
    }

    // Generate AI recommendations if not provided
    let recommendations = validatedData.recommendations
    if (!recommendations) {
      try {
        const performanceData = {
          employeeName: annualReport.user.name,
          year: annualReport.year,
          performancePredicate: annualReport.performance_predicate,
          strengths: validatedData.strengths,
          developmentAreas: validatedData.development_areas,
          overallRating: validatedData.overall_rating
        }

        recommendations = await generateSupervisorRecommendations(performanceData)
      } catch (aiError) {
        console.error("Error generating AI recommendations:", aiError)
        recommendations = "Rekomendasi akan diperbarui kemudian."
      }
    }

    // Create supervisor evaluation
    const evaluation = await prisma.supervisorEvaluation.create({
      data: {
        annual_report_id: validatedData.annual_report_id,
        supervisor_id: session.user.id,
        employee_id: annualReport.user.id,
        work_quality_score: validatedData.work_quality_score,
        work_quantity_score: validatedData.work_quantity_score,
        punctuality_score: validatedData.punctuality_score,
        cooperation_score: validatedData.cooperation_score,
        initiative_score: validatedData.initiative_score,
        leadership_score: validatedData.leadership_score,
        overall_rating: validatedData.overall_rating,
        supervisor_comments: validatedData.supervisor_comments,
        recommendations: recommendations,
        development_areas: validatedData.development_areas,
        strengths: validatedData.strengths,
      },
      include: {
        supervisor: {
          select: { name: true, nip: true }
        },
        employee: {
          select: { name: true, nip: true }
        },
        annual_report: {
          select: { year: true }
        }
      }
    })

    return NextResponse.json({
      success: true,
      data: evaluation,
      message: "Supervisor evaluation created successfully"
    }, { status: 201 })

  } catch (error) {
    console.error("Error creating supervisor evaluation:", error)
    
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