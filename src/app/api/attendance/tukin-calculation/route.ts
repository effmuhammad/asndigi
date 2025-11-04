import { NextRequest, NextResponse } from "next/server"
import { auth } from "../../../../../auth"
import { prisma } from "@/lib/prisma"

interface TukinCalculationResult {
  totalLateMinutes: number
  totalAbsentDays: number
  violationType: 'ringan' | 'sedang' | 'berat' | 'tidak ada'
  tukinScore: number
  breakdown: {
    lateAddition: number
    absentAddition: number
    disciplineAddition: number
    totalAddition: number
  }
}

export async function GET(request: NextRequest) {
  try {
    const session = await auth()
    if (!session?.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const { searchParams } = new URL(request.url)
    const monthParam = searchParams.get("month")
    const yearParam = searchParams.get("year")
    
    // Validate and parse parameters
    const currentDate = new Date()
    const month = monthParam ? parseInt(monthParam, 10) : currentDate.getMonth() + 1
    const year = yearParam ? parseInt(yearParam, 10) : currentDate.getFullYear()
    
    // Validate month and year ranges
    if (isNaN(month) || month < 1 || month > 12) {
      return NextResponse.json({ error: "Invalid month parameter" }, { status: 400 })
    }
    
    if (isNaN(year) || year < 2000 || year > 2100) {
      return NextResponse.json({ error: "Invalid year parameter" }, { status: 400 })
    }

    // Get work settings for late calculation
    const workSettings = await prisma.workSettings.findFirst({
      where: { is_active: true },
      orderBy: { created_at: 'desc' }
    })

    if (!workSettings) {
      return NextResponse.json({ error: "Work settings not found" }, { status: 404 })
    }

    // Calculate date range for the month
    const startDate = new Date(year, month - 1, 1)
    const endDate = new Date(year, month, 0)
    
    // Validate that dates are valid
    if (isNaN(startDate.getTime()) || isNaN(endDate.getTime())) {
      return NextResponse.json({ error: "Invalid date range" }, { status: 400 })
    }

    // Get attendance records for the month
    const attendances = await prisma.attendance.findMany({
      where: {
        user_id: session.user.id,
        attendance_date: {
          gte: startDate,
          lte: endDate
        }
      },
      orderBy: {
        attendance_date: 'asc'
      }
    })

    // Calculate tukin score
    const calculation = calculateTukinScore(attendances, workSettings)

    return NextResponse.json({
      success: true,
      data: {
        month: Number(month),
        year: Number(year),
        period: `${getMonthName(Number(month))} ${year}`,
        ...calculation
      }
    })
  } catch (error) {
    console.error("Error calculating tukin:", error)
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    )
  }
}

function calculateTukinScore(attendances: any[], workSettings: any): TukinCalculationResult {
  let totalLateMinutes = 0
  let totalAbsentDays = 0
  
  // Parse work start time
  const [workStartHour, workStartMinute] = workSettings.work_start_time.split(':').map(Number)
  
  attendances.forEach(attendance => {
    if (attendance.status === 'ABSENT') {
      totalAbsentDays++
    } else if (attendance.status === 'LATE' && attendance.check_in) {
      // Calculate late minutes
      const checkInTime = new Date(attendance.check_in)
      
      // Create work start time on the same date as attendance_date using UTC
      const attendanceDate = new Date(attendance.attendance_date)
      const workStartTime = new Date(Date.UTC(
        attendanceDate.getUTCFullYear(),
        attendanceDate.getUTCMonth(),
        attendanceDate.getUTCDate(),
        workStartHour,
        workStartMinute,
        0,
        0
      ))
      
      // Add tolerance minutes
      workStartTime.setMinutes(workStartTime.getMinutes() + workSettings.late_tolerance_minutes)
      
      if (checkInTime > workStartTime) {
        const lateMinutes = Math.floor((checkInTime.getTime() - workStartTime.getTime()) / (1000 * 60))
        totalLateMinutes += lateMinutes
      }
    }
  })

  // Calculate additions based on rules (inverted from deductions)
  const lateAddition = calculateLateAddition(totalLateMinutes)
  const absentAddition = calculateAbsentAddition(totalAbsentDays)
  
  // For now, assume no discipline violations (this could be extended with a separate table)
  const violationType: 'ringan' | 'sedang' | 'berat' | 'tidak ada' = 'tidak ada'
  const disciplineAddition = calculateDisciplineAddition(violationType)
  
  const totalAddition = lateAddition + absentAddition + disciplineAddition
  const tukinScore = Math.min(40, totalAddition) // Ensure score doesn't go above 40

  return {
    totalLateMinutes,
    totalAbsentDays,
    violationType,
    tukinScore,
    breakdown: {
      lateAddition,
      absentAddition,
      disciplineAddition,
      totalAddition
    }
  }
}

function calculateLateAddition(totalLateMinutes: number): number {
  // New lateness scoring rules (monthly total) - Addition based:
  // 0 minutes  -> score 10%
  // 0 <= 25    -> score 7.5%
  // 25 < 50    -> score 5%
  // 50 <= 75   -> score 2.5%
  // > 75       -> score 0%

  if (totalLateMinutes === 0) {
    return 10 // Perfect attendance gets full 10%
  } else if (totalLateMinutes <= 25) {
    return 7.5 // Minor lateness gets 7.5%
  } else if (totalLateMinutes < 50) {
    return 5 // Moderate lateness gets 5%
  } else if (totalLateMinutes <= 75) {
    return 2.5 // High lateness gets 2.5%
  } else {
    return 0 // Excessive lateness gets 0%
  }
}

function calculateAbsentAddition(totalAbsentDays: number): number {
  // New absent days rules:
  // 0 hari -> 15%
  // 1 hari atau lebih -> 0%
  if (totalAbsentDays === 0) {
    return 15 // Perfect attendance gets full 15%
  } else {
    return 0 // Any absent days result in 0%
  }
}

function calculateDisciplineAddition(violationType: 'ringan' | 'sedang' | 'berat' | 'tidak ada'): number {
  // New discipline violation rules:
  // Tidak dikenakan hukuman disiplin -> 15%
  // Dikenakan hukuman disiplin ringan -> 0% (1 bulan)
  // Dikenakan hukuman disiplin sedang -> 0% (2 bulan)
  // Dikenakan hukuman disiplin berat -> 0% (3 bulan)
  
  switch (violationType) {
    case 'ringan':
      return 0 // 0% for light disciplinary action (1 month)
    case 'sedang':
      return 0 // 0% for medium disciplinary action (2 months)
    case 'berat':
      return 0 // 0% for heavy disciplinary action (3 months)
    case 'tidak ada':
    default:
      return 15 // Full 15% when no disciplinary action
  }
}

function getMonthName(month: number): string {
  const months = [
    'Januari', 'Februari', 'Maret', 'April', 'Mei', 'Juni',
    'Juli', 'Agustus', 'September', 'Oktober', 'November', 'Desember'
  ]
  return months[month - 1] || 'Unknown'
}