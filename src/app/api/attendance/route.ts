import { NextRequest, NextResponse } from "next/server"
import { auth } from "@/../auth"

import { PrismaClient } from "@prisma/client"

const prisma = new PrismaClient()

export async function GET(request: NextRequest) {
  try {
    const session = await auth()
    if (!session?.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const { searchParams } = new URL(request.url)
    const startDate = searchParams.get("startDate")
    const endDate = searchParams.get("endDate")
    const status = searchParams.get("status")

    const where: any = {
      user_id: session.user.id
    }

    if (startDate && endDate) {
      where.attendance_date = {
        gte: new Date(startDate),
        lte: new Date(endDate)
      }
    }

    if (status && status !== "all") {
      where.status = status
    }

    const attendances = await prisma.attendance.findMany({
      where,
      orderBy: {
        attendance_date: "desc"
      }
    })

    return NextResponse.json(attendances)
  } catch (error) {
    console.error("Error fetching attendances:", error)
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
    const { type, latitude, longitude, photo_url, notes } = body

    if (!type || !latitude || !longitude) {
      return NextResponse.json(
        { error: "Missing required fields" },
        { status: 400 }
      )
    }

    const today = new Date()
    today.setHours(0, 0, 0, 0)

    // Check if user already has attendance record for today
    const existingAttendance = await prisma.attendance.findFirst({
      where: {
        user_id: session.user.id,
        attendance_date: today
      }
    })

    const now = new Date()

    if (type === "check_in") {
      if (existingAttendance) {
        return NextResponse.json(
          { error: "Already checked in today" },
          { status: 400 }
        )
      }

      // Determine status based on check-in time (assuming work starts at 08:00)
      const workStartTime = new Date()
      workStartTime.setHours(8, 0, 0, 0)
      const status = now > workStartTime ? "terlambat" : "hadir"

      const attendance = await prisma.attendance.create({
        data: {
          user_id: session.user.id,
          attendance_date: today,
          check_in: now,
          status,
          location_data: { latitude, longitude },
          photo_url
        }
      })

      return NextResponse.json(attendance, { status: 201 })
    } else if (type === "check_out") {
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

      const updatedAttendance = await prisma.attendance.update({
        where: { id: existingAttendance.id },
        data: {
          check_out: now,
          location_data: { 
            ...existingAttendance.location_data as any, 
            checkout_latitude: latitude, 
            checkout_longitude: longitude 
          }
        }
      })

      return NextResponse.json(updatedAttendance)
    } else {
      return NextResponse.json(
        { error: "Invalid attendance type" },
        { status: 400 }
      )
    }
  } catch (error) {
    console.error("Error creating attendance:", error)
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    )
  }
}