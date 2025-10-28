import { NextRequest, NextResponse } from "next/server"
import { auth } from "../../../../../auth"
import { prisma } from "@/lib/prisma"
import { z } from "zod"
import { 
  calculatePerformancePredicate,
  determineWorkResultRating,
  determineBehaviorRating
} from "@/lib/performance-utils"
import { generateAnnualPerformanceSummary } from "@/lib/openai-annual-performance"

// Schema for updating annual performance report
const updateAnnualPerformanceReportSchema = z.object({
  self_assessment: z.string().optional(),
  achievements: z.string().optional(),
  challenges: z.string().optional(),
  improvement_plan: z.string().optional(),
  work_result_rating: z.enum(["DIATAS_EKSPEKTASI", "SESUAI_EKSPEKTASI", "DIBAWAH_EKSPEKTASI"]).optional(),
  behavior_rating: z.enum(["DIATAS_EKSPEKTASI", "SESUAI_EKSPEKTASI", "DIBAWAH_EKSPEKTASI"]).optional(),
  status: z.enum(["DRAFT", "SUBMITTED", "APPROVED", "REJECTED"]).optional(),
})

// GET - Fetch specific annual performance report
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params
  try {
    const session = await auth()
    if (!session?.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const report = await prisma.annualPerformanceReport.findUnique({
      where: { id },
      include: {
        user: {
          select: { name: true, nip: true, position: true, work_unit: true, supervisor_id: true }
        },
        supervisor_evaluation: {
          include: {
            supervisor: {
              select: { name: true, nip: true }
            }
          }
        },
        digital_signature: {
          include: {
            signer: {
              select: { name: true, nip: true }
            }
          }
        }
      }
    })

    if (!report) {
      return NextResponse.json({ error: "Report not found" }, { status: 404 })
    }

    // Check authorization
    const currentUser = await prisma.user.findUnique({
      where: { id: session.user.id },
      select: { role: true }
    })

    const canAccess = 
      report.user_id === session.user.id || // Own report
      currentUser?.role === "ADMIN" || // Admin can see all
      (currentUser?.role === "SUPERVISOR" && report.user.supervisor_id === session.user.id) // Supervisor can see subordinates

    if (!canAccess) {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 })
    }

    return NextResponse.json({
      success: true,
      data: report
    })

  } catch (error) {
    console.error("Error fetching annual performance report:", error)
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    )
  }
}

// PUT - Update annual performance report
export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params
  try {
    const session = await auth()
    if (!session?.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const body = await request.json()
    const validatedData = updateAnnualPerformanceReportSchema.parse(body)

    // Check if report exists
    const existingReport = await prisma.annualPerformanceReport.findUnique({
      where: { id },
      include: {
        user: {
          select: { supervisor_id: true }
        }
      }
    })

    if (!existingReport) {
      return NextResponse.json({ error: "Report not found" }, { status: 404 })
    }

    // Check authorization
    const currentUser = await prisma.user.findUnique({
      where: { id: session.user.id },
      select: { role: true }
    })

    const canEdit = 
      existingReport.user_id === session.user.id || // Own report
      currentUser?.role === "ADMIN" || // Admin can edit all
      (currentUser?.role === "SUPERVISOR" && existingReport.user.supervisor_id === session.user.id) // Supervisor can edit subordinates

    if (!canEdit) {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 })
    }

    // Prepare update data
    const updateData: Record<string, unknown> = {}
    
    if (validatedData.self_assessment !== undefined) updateData.self_assessment = validatedData.self_assessment
    if (validatedData.achievements !== undefined) updateData.achievements = validatedData.achievements
    if (validatedData.challenges !== undefined) updateData.challenges = validatedData.challenges
    if (validatedData.improvement_plan !== undefined) updateData.improvement_plan = validatedData.improvement_plan
    if (validatedData.status !== undefined) updateData.status = validatedData.status

    // Handle rating updates and recalculate predicate if needed
    let shouldRecalculatePredicate = false
    
    if (validatedData.work_result_rating !== undefined) {
      updateData.work_result_rating = validatedData.work_result_rating
      shouldRecalculatePredicate = true
    }
    
    if (validatedData.behavior_rating !== undefined) {
      updateData.behavior_rating = validatedData.behavior_rating
      shouldRecalculatePredicate = true
    }

    if (shouldRecalculatePredicate) {
      const workResultRating = validatedData.work_result_rating || existingReport.work_result_rating
      const behaviorRating = validatedData.behavior_rating || existingReport.behavior_rating
      updateData.performance_predicate = calculatePerformancePredicate(workResultRating, behaviorRating)
    }

    // Add timestamps for status changes
    if (validatedData.status === "SUBMITTED" && existingReport.status === "DRAFT") {
      updateData.submitted_at = new Date()
    } else if (validatedData.status === "APPROVED" && existingReport.status !== "APPROVED") {
      updateData.approved_at = new Date()
    }

    updateData.updated_at = new Date()

    // Update the report
    const updatedReport = await prisma.annualPerformanceReport.update({
      where: { id },
      data: updateData,
      include: {
        user: {
          select: { name: true, nip: true }
        },
        supervisor_evaluation: {
          include: {
            supervisor: {
              select: { name: true }
            }
          }
        },
        digital_signature: {
          include: {
            signer: {
              select: { name: true }
            }
          }
        }
      }
    })

    return NextResponse.json({
      success: true,
      data: updatedReport
    })

  } catch (error) {
    console.error("Error updating annual performance report:", error)
    
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

// DELETE - Delete annual performance report
export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params
  try {
    const session = await auth()
    if (!session?.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    // Check if report exists
    const existingReport = await prisma.annualPerformanceReport.findUnique({
      where: { id },
      select: { 
        user_id: true, 
        status: true,
        user: {
          select: { supervisor_id: true }
        }
      }
    })

    if (!existingReport) {
      return NextResponse.json({ error: "Report not found" }, { status: 404 })
    }

    // Check authorization
    const currentUser = await prisma.user.findUnique({
      where: { id: session.user.id },
      select: { role: true }
    })

    const canDelete = 
      (existingReport.user_id === session.user.id && existingReport.status === "DRAFT") || // Own draft report
      currentUser?.role === "ADMIN" // Admin can delete any

    if (!canDelete) {
      return NextResponse.json({ 
        error: "You can only delete your own draft reports" 
      }, { status: 403 })
    }

    // Delete the report (cascade will handle related records)
    await prisma.annualPerformanceReport.delete({
      where: { id }
    })

    return NextResponse.json({
      success: true,
      message: "Annual performance report deleted successfully"
    })

  } catch (error) {
    console.error("Error deleting annual performance report:", error)
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    )
  }
}