import { NextRequest, NextResponse } from "next/server"
import { auth } from "@/../auth"

import { prisma } from "@/lib/prisma"

export async function GET(request: NextRequest) {
  try {
    const session = await auth()
    if (!session?.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const { searchParams } = new URL(request.url)
    const month = searchParams.get("month")
    const year = searchParams.get("year")

    if (!month || !year) {
      return NextResponse.json(
        { error: "Month and year are required" },
        { status: 400 }
      )
    }

    const startDate = new Date(parseInt(year), parseInt(month) - 1, 1)
    const endDate = new Date(parseInt(year), parseInt(month), 0)

    const attendances = await prisma.attendance.findMany({
      where: {
        user_id: session.user.id,
        attendance_date: {
          gte: startDate,
          lte: endDate
        }
      }
    })

    // Calculate working days in the month (excluding weekends)
    const totalWorkingDays = getWorkingDaysInMonth(parseInt(year), parseInt(month) - 1)
    
    const presentDays = attendances.filter((a: any) => a.status === "hadir").length
    const lateDays = attendances.filter((a: any) => a.status === "terlambat").length
    const absentDays = totalWorkingDays - attendances.length

    const summary = {
      total_days: totalWorkingDays,
      present_days: presentDays,
      late_days: lateDays,
      absent_days: absentDays,
      attendance_percentage: totalWorkingDays > 0 ? ((presentDays + lateDays) / totalWorkingDays) * 100 : 0
    }

    return NextResponse.json(summary)
  } catch (error) {
    console.error("Error fetching attendance summary:", error)
    
    // Handle specific database connection errors
    if (error instanceof Error) {
      if (error.message.includes('connect') || error.message.includes('ECONNREFUSED')) {
        return NextResponse.json(
          { error: "Database connection failed" },
          { status: 503 }
        )
      }
    }
    
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    )
  }
}

function getWorkingDaysInMonth(year: number, month: number): number {
  const date = new Date(year, month, 1)
  let workingDays = 0

  while (date.getMonth() === month) {
    const dayOfWeek = date.getDay()
    // Count Monday to Friday as working days (1-5)
    if (dayOfWeek >= 1 && dayOfWeek <= 5) {
      workingDays++
    }
    date.setDate(date.getDate() + 1)
  }

  return workingDays
}