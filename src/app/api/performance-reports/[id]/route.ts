import { NextRequest, NextResponse } from "next/server"
import { auth } from "../../../../../auth"

import { PrismaClient } from "@prisma/client"

const prisma = new PrismaClient()

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await auth()
    if (!session?.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const { id } = await params

    const report = await prisma.performanceReport.findFirst({
      where: {
        id,
        user_id: session.user.id
      },
      include: {
        approvals: {
          include: {
            approver: {
              select: {
                name: true,
                nip: true
              }
            }
          },
          orderBy: {
            created_at: "desc"
          }
        }
      }
    })

    if (!report) {
      return NextResponse.json(
        { error: "Performance report not found" },
        { status: 404 }
      )
    }

    return NextResponse.json(report)
  } catch (error) {
    console.error("Error fetching performance report:", error)
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    )
  }
}

export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await auth()
    if (!session?.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const { id } = await params
    const body = await request.json()
    const { 
      attendance_summary,
      skp_summary 
    } = body

    // Verify the report belongs to the current user
    const existingReport = await prisma.performanceReport.findFirst({
      where: {
        id,
        user_id: session.user.id
      }
    })

    if (!existingReport) {
      return NextResponse.json(
        { error: "Performance report not found" },
        { status: 404 }
      )
    }

    // Only allow updates if status is draft
    if (existingReport.status !== "DRAFT") {
      return NextResponse.json(
        { error: "Cannot update submitted report" },
        { status: 400 }
      )
    }

    const updatedReport = await prisma.performanceReport.update({
      where: { id },
      data: {
        attendance_summary: attendance_summary || existingReport.attendance_summary,
        skp_summary: skp_summary || existingReport.skp_summary
      }
    })

    return NextResponse.json(updatedReport)
  } catch (error) {
    console.error("Error updating performance report:", error)
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    )
  }
}

export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await auth()
    if (!session?.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const { id } = await params

    // Verify the report belongs to the current user
    const existingReport = await prisma.performanceReport.findFirst({
      where: {
        id,
        user_id: session.user.id
      }
    })

    if (!existingReport) {
      return NextResponse.json(
        { error: "Performance report not found" },
        { status: 404 }
      )
    }

    // Only allow deletion if status is draft
    if (existingReport.status !== "DRAFT") {
      return NextResponse.json(
        { error: "Cannot delete submitted report" },
        { status: 400 }
      )
    }

    // Delete related approvals first
    await prisma.approval.deleteMany({
      where: { report_id: id }
    })

    // Delete the report
    await prisma.performanceReport.delete({
      where: { id }
    })

    return NextResponse.json({ message: "Performance report deleted successfully" })
  } catch (error) {
    console.error("Error deleting performance report:", error)
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    )
  }
}