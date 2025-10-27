import { NextRequest, NextResponse } from "next/server"
import { auth } from "@/auth"
import { prisma } from "@/lib/prisma"

export async function GET(request: NextRequest) {
  try {
    const session = await auth()
    if (!session?.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const { searchParams } = new URL(request.url)
    const month = searchParams.get("month") // Format: YYYY-MM
    const year = searchParams.get("year")

    let startDate: Date
    let endDate: Date

    if (month) {
      // Parse month format YYYY-MM
      const [yearStr, monthStr] = month.split("-")
      startDate = new Date(parseInt(yearStr), parseInt(monthStr) - 1, 1)
      endDate = new Date(parseInt(yearStr), parseInt(monthStr), 0)
    } else if (year) {
      // Parse year format YYYY
      startDate = new Date(parseInt(year), 0, 1)
      endDate = new Date(parseInt(year), 11, 31)
    } else {
      // Default to current month
      const now = new Date()
      startDate = new Date(now.getFullYear(), now.getMonth(), 1)
      endDate = new Date(now.getFullYear(), now.getMonth() + 1, 0)
    }

    // Get attendance records for the period
    const attendances = await prisma.attendance.findMany({
      where: {
        user_id: session.user.id,
        attendance_date: {
          gte: startDate,
          lte: endDate,
        },
      },
      orderBy: {
        attendance_date: "asc",
      },
    })

    // Calculate summary statistics
    const totalDays = Math.ceil((endDate.getTime() - startDate.getTime()) / (1000 * 60 * 60 * 24)) + 1
    const workingDays = getWorkingDays(startDate, endDate)
    
    const presentDays = attendances.filter(a => a.status === "PRESENT").length
    const lateDays = attendances.filter(a => a.status === "LATE").length
    const earlyLeaveDays = attendances.filter(a => a.status === "EARLY_LEAVE").length
    const absentDays = attendances.filter(a => a.status === "ABSENT").length
    const leaveDays = attendances.filter(a => a.status === "LEAVE").length
    const sickDays = attendances.filter(a => a.status === "SICK").length

    const attendedDays = presentDays + lateDays + earlyLeaveDays
    const attendancePercentage = workingDays > 0 ? (attendedDays / workingDays) * 100 : 0

    // Calculate average check-in and check-out times
    const checkInTimes = attendances
      .filter(a => a.check_in)
      .map(a => a.check_in!)
    
    const checkOutTimes = attendances
      .filter(a => a.check_out)
      .map(a => a.check_out!)

    const avgCheckInTime = checkInTimes.length > 0 
      ? new Date(checkInTimes.reduce((sum, time) => sum + time.getTime(), 0) / checkInTimes.length)
      : null

    const avgCheckOutTime = checkOutTimes.length > 0
      ? new Date(checkOutTimes.reduce((sum, time) => sum + time.getTime(), 0) / checkOutTimes.length)
      : null

    const summary = {
      period: {
        start: startDate.toISOString().split('T')[0],
        end: endDate.toISOString().split('T')[0],
      },
      total_days: totalDays,
      working_days: workingDays,
      present_days: presentDays,
      late_days: lateDays,
      early_leave_days: earlyLeaveDays,
      absent_days: absentDays,
      leave_days: leaveDays,
      sick_days: sickDays,
      attended_days: attendedDays,
      attendance_percentage: Math.round(attendancePercentage * 100) / 100,
      average_check_in: avgCheckInTime?.toTimeString().split(' ')[0] || null,
      average_check_out: avgCheckOutTime?.toTimeString().split(' ')[0] || null,
    }

    return NextResponse.json({
      success: true,
      summary,
      attendances,
    })
  } catch (error) {
    console.error("Error fetching attendance summary:", error)
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    )
  }
}

// Helper function to calculate working days (excluding weekends)
function getWorkingDays(startDate: Date, endDate: Date): number {
  let workingDays = 0
  const currentDate = new Date(startDate)

  while (currentDate <= endDate) {
    const dayOfWeek = currentDate.getDay()
    // Monday = 1, Tuesday = 2, ..., Friday = 5, Saturday = 6, Sunday = 0
    if (dayOfWeek >= 1 && dayOfWeek <= 5) {
      workingDays++
    }
    currentDate.setDate(currentDate.getDate() + 1)
  }

  return workingDays
}