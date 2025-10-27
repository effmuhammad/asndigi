import { NextRequest, NextResponse } from "next/server"
import { auth } from "@/auth"
import { prisma } from "@/lib/prisma"
import { z } from "zod"

// Schema for attendance check-in/check-out
const attendanceSchema = z.object({
  location_data: z.object({
    latitude: z.number(),
    longitude: z.number(),
    address: z.string().optional(),
  }).optional(),
  photo_url: z.string().optional(),
})

export async function GET(request: NextRequest) {
  try {
    const session = await auth()
    if (!session?.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const { searchParams } = new URL(request.url)
    const date = searchParams.get("date")
    const limit = searchParams.get("limit")

    let whereClause: any = {
      user_id: session.user.id,
    }

    // If date is provided, filter by specific date
    if (date) {
      const targetDate = new Date(date)
      whereClause.attendance_date = targetDate
    }

    const attendances = await prisma.attendance.findMany({
      where: whereClause,
      orderBy: {
        attendance_date: "desc",
      },
      take: limit ? parseInt(limit) : undefined,
      include: {
        user: {
          select: {
            name: true,
            nip: true,
          },
        },
      },
    })

    return NextResponse.json({
      success: true,
      attendance: attendances,
    })
  } catch (error) {
    console.error("Error fetching attendance:", error)
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
    const { action } = body

    if (action === "check-in") {
      return await handleCheckIn(session.user.id, body)
    } else if (action === "check-out") {
      return await handleCheckOut(session.user.id, body)
    } else {
      return NextResponse.json(
        { error: "Invalid action. Use 'check-in' or 'check-out'" },
        { status: 400 }
      )
    }
  } catch (error) {
    console.error("Error processing attendance:", error)
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    )
  }
}

async function handleCheckIn(userId: string, data: any) {
  try {
    const validatedData = attendanceSchema.parse(data)
    const today = new Date()
    today.setHours(0, 0, 0, 0)

    // Check if user already checked in today
    const existingAttendance = await prisma.attendance.findFirst({
      where: {
        user_id: userId,
        attendance_date: today,
      },
    })

    if (existingAttendance) {
      return NextResponse.json(
        { error: "Already checked in today" },
        { status: 400 }
      )
    }

    // Determine attendance status based on check-in time
    const now = new Date()
    const workStartTime = new Date()
    workStartTime.setHours(8, 0, 0, 0) // 8:00 AM

    let status = "PRESENT"
    if (now > workStartTime) {
      status = "LATE"
    }

    const attendance = await prisma.attendance.create({
      data: {
        user_id: userId,
        attendance_date: today,
        check_in: now,
        status: status as any,
        location_data: validatedData.location_data,
        photo_url: validatedData.photo_url,
      },
      include: {
        user: {
          select: {
            name: true,
            nip: true,
          },
        },
      },
    })

    return NextResponse.json({
      success: true,
      message: "Check-in successful",
      attendance,
    })
  } catch (error) {
    console.error("Error during check-in:", error)
    return NextResponse.json(
      { error: "Failed to check in" },
      { status: 500 }
    )
  }
}

async function handleCheckOut(userId: string, data: any) {
  try {
    const validatedData = attendanceSchema.parse(data)
    const today = new Date()
    today.setHours(0, 0, 0, 0)

    // Find today's attendance record
    const existingAttendance = await prisma.attendance.findFirst({
      where: {
        user_id: userId,
        attendance_date: today,
      },
    })

    if (!existingAttendance) {
      return NextResponse.json(
        { error: "No check-in record found for today" },
        { status: 400 }
      )
    }

    if (existingAttendance.check_out) {
      return NextResponse.json(
        { error: "Already checked out today" },
        { status: 400 }
      )
    }

    // Determine if it's early leave
    const now = new Date()
    const workEndTime = new Date()
    workEndTime.setHours(17, 0, 0, 0) // 5:00 PM

    let status = existingAttendance.status
    if (now < workEndTime && status === "PRESENT") {
      status = "EARLY_LEAVE"
    }

    const updatedAttendance = await prisma.attendance.update({
      where: {
        id: existingAttendance.id,
      },
      data: {
        check_out: now,
        status: status as any,
        location_data: validatedData.location_data || (existingAttendance.location_data as any),
        photo_url: validatedData.photo_url || existingAttendance.photo_url,
      },
      include: {
        user: {
          select: {
            name: true,
            nip: true,
          },
        },
      },
    })

    return NextResponse.json({
      success: true,
      message: "Check-out successful",
      attendance: updatedAttendance,
    })
  } catch (error) {
    console.error("Error during check-out:", error)
    return NextResponse.json(
      { error: "Failed to check out" },
      { status: 500 }
    )
  }
}