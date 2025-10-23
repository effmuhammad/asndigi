import { NextRequest, NextResponse } from "next/server"
import { auth } from "@/../auth"

import { PrismaClient } from "@prisma/client"

const prisma = new PrismaClient()

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await auth()
    const { id } = await params
    if (!session?.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    // Verify the report belongs to the current user
    const existingReport = await prisma.performanceReport.findFirst({
      where: {
        id: id,
        user_id: session.user.id
      }
    })

    if (!existingReport) {
      return NextResponse.json(
        { error: "Performance report not found" },
        { status: 404 }
      )
    }

    // Only allow submission if status is draft
    if (existingReport.status !== "draft") {
      return NextResponse.json(
        { error: "Report already submitted" },
        { status: 400 }
      )
    }

    // Get user's supervisor
    const user = await prisma.user.findUnique({
      where: { id: session.user.id },
      select: { supervisor_id: true }
    })

    if (!user?.supervisor_id) {
      return NextResponse.json(
        { error: "No supervisor assigned" },
        { status: 400 }
      )
    }

    // Update report status to submitted
    const updatedReport = await prisma.performanceReport.update({
      where: { id: id },
      data: {
        status: "submitted"
      }
    })

    // Create approval record
    await prisma.approval.create({
      data: {
        report_id: id,
        approver_id: user.supervisor_id,
        status: "pending"
      }
    })

    return NextResponse.json(updatedReport)
  } catch (error) {
    console.error("Error submitting performance report:", error)
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    )
  }
}