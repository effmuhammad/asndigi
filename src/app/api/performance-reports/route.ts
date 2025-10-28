import { NextRequest, NextResponse } from "next/server"
import { auth } from "../../../../auth"

import { PrismaClient } from "@prisma/client"

const prisma = new PrismaClient()

export async function GET(request: NextRequest) {
  try {
    const session = await auth()
    if (!session?.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const { searchParams } = new URL(request.url)
    const year = searchParams.get("year")

    const where: Record<string, unknown> = {
      user_id: session.user.id
    }

    if (year) {
      const startOfYear = new Date(parseInt(year), 0, 1)
      const endOfYear = new Date(parseInt(year), 11, 31)
      where.start_date = {
        gte: startOfYear,
        lte: endOfYear
      }
    }

    const reports = await prisma.performanceReport.findMany({
      where,
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
      },
      orderBy: {
        created_at: "desc"
      }
    })

    return NextResponse.json(reports)
  } catch (error) {
    console.error("Error fetching performance reports:", error)
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    )
  }
}

export async function POST(request: NextRequest) {
  try {
    const session = await auth()
    if (!session?.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const body = await request.json()
    const { 
      month, 
      year, 
      attendance_summary,
      skp_summary 
    } = body

    if (!month || !year) {
      return NextResponse.json(
        { error: "Missing required fields" },
        { status: 400 }
      )
    }

    // Create date range for the month
    const startDate = new Date(parseInt(year), parseInt(month) - 1, 1)
    const endDate = new Date(parseInt(year), parseInt(month), 0)

    // Check if report already exists for this period
    const existingReport = await prisma.performanceReport.findFirst({
      where: {
        user_id: session.user.id,
        start_date: startDate,
        end_date: endDate
      }
    })

    if (existingReport) {
      return NextResponse.json(
        { error: "Report already exists for this period" },
        { status: 400 }
      )
    }

    const report = await prisma.performanceReport.create({
      data: {
        user_id: session.user.id,
        period_type: "MONTHLY",
        start_date: startDate,
        end_date: endDate,
        attendance_summary: attendance_summary || {},
        skp_summary: skp_summary || {},
        status: "DRAFT"
      }
    })

    return NextResponse.json(report, { status: 201 })
  } catch (error) {
    console.error("Error creating performance report:", error)
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    )
  }
}