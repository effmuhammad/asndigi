import { NextRequest, NextResponse } from "next/server"
import { auth } from "@/../auth"

import { PrismaClient } from "@prisma/client"

const prisma = new PrismaClient()

export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await auth()
    const { id } = await params
    if (!session?.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const body = await request.json()
    const { status, feedback } = body

    if (!status || !["approved", "rejected"].includes(status)) {
      return NextResponse.json(
        { error: "Invalid status" },
        { status: 400 }
      )
    }

    // Verify the approval belongs to the current user (approver)
    const existingApproval = await prisma.approval.findFirst({
      where: {
        id: id,
        approver_id: session.user.id
      },
      include: {
        report: true
      }
    })

    if (!existingApproval) {
      return NextResponse.json(
        { error: "Approval not found" },
        { status: 404 }
      )
    }

    // Only allow updates if status is pending
    if (existingApproval.status !== "pending") {
      return NextResponse.json(
        { error: "Approval already processed" },
        { status: 400 }
      )
    }

    // Update approval
    const updatedApproval = await prisma.approval.update({
      where: { id: id },
      data: {
        status,
        comments: feedback,
        approved_at: new Date()
      }
    })

    // Update the related performance report status
    await prisma.performanceReport.update({
      where: { id: existingApproval.report_id },
      data: {
        status
      }
    })

    return NextResponse.json(updatedApproval)
  } catch (error) {
    console.error("Error updating approval:", error)
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    )
  }
}