import { NextRequest, NextResponse } from "next/server"
import { auth } from "@/../auth"

import { PrismaClient, AttendanceStatus } from "@prisma/client"

const prisma = new PrismaClient()

export async function GET(request: NextRequest) {
  try {
    const session = await auth()
    if (!session?.user?.id) {
      console.log("No user ID in session")
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const { searchParams } = new URL(request.url)
    const startDate = searchParams.get("startDate")
    const endDate = searchParams.get("endDate")
    const date = searchParams.get("date")
    const limit = searchParams.get("limit")
    const status = searchParams.get("status")

    const where: any = {
      user_id: session.user.id
    }

    // Handle single date query (for today's attendance)
    if (date) {
      const targetDate = new Date(date)
      const startOfDay = new Date(targetDate)
      startOfDay.setHours(0, 0, 0, 0)
      const endOfDay = new Date(targetDate)
      endOfDay.setHours(23, 59, 59, 999)
      
      where.attendance_date = {
        gte: startOfDay,
        lte: endOfDay
      }
    }
    // Handle date range query
    else if (startDate && endDate) {
      where.attendance_date = {
        gte: new Date(startDate),
        lte: new Date(endDate)
      }
    }

    if (status && status !== "all") {
      where.status = status
    }

    const queryOptions: any = {
      where,
      orderBy: {
        attendance_date: "desc"
      }
    }

    // Add limit if specified
    if (limit) {
      queryOptions.take = parseInt(limit)
    }

    const attendances = await prisma.attendance.findMany(queryOptions)

    // Return in the format expected by frontend
    return NextResponse.json({ attendance: attendances })
  } catch (error) {
    console.error("Error fetching attendances:", error)
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    )
  }
}

export async function POST(request: NextRequest) {
  console.log("POST /api/attendance - Request received")
  
  try {
    const session = await auth()
    console.log("Session check result:", { 
      hasSession: !!session, 
      hasUser: !!session?.user, 
      hasUserId: !!session?.user?.id,
      userId: session?.user?.id 
    })
    
    if (!session?.user?.id) {
      console.log("Authentication failed - No user ID in session")
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const body = await request.json()
    console.log("Request body:", body)
    const { type, latitude, longitude, photo_url, notes } = body

    if (!type || !latitude || !longitude) {
      console.log("Missing required fields:", { type, latitude, longitude })
      return NextResponse.json(
        { error: "Missing required fields" },
        { status: 400 }
      )
    }

    const today = new Date()
    today.setHours(0, 0, 0, 0)
    console.log("Today date:", today)

    // Check if user already has attendance record for today
    console.log("Checking existing attendance for user:", session.user.id)
    const existingAttendance = await prisma.attendance.findFirst({
      where: {
        user_id: session.user.id,
        attendance_date: today
      }
    })
    console.log("Existing attendance:", existingAttendance)

    const now = new Date()
    console.log("Current time:", now)

    if (type === "check_in") {
      if (existingAttendance) {
        console.log("User already checked in today")
        return NextResponse.json(
          { error: "Already checked in today" },
          { status: 400 }
        )
      }

      // Ambil konfigurasi waktu kerja dari database dengan error handling
      let workSettings
      try {
        console.log("Fetching work settings...")
        workSettings = await prisma.workSettings.findFirst({
          where: { is_active: true },
          orderBy: { updated_at: 'desc' }
        })
        console.log("Work settings found:", workSettings)
      } catch (error) {
        console.error("Error fetching work settings:", error)
        workSettings = null
      }
      
      // Fallback ke default jika tidak ada konfigurasi
      if (!workSettings) {
        console.log("Using default work settings")
        workSettings = { work_start_time: '08:00', late_tolerance_minutes: 0 }
      }

      // Parse waktu mulai kerja dari konfigurasi
      const [hours, minutes] = workSettings.work_start_time.split(':').map(Number)
      const workStartTime = new Date()
      workStartTime.setHours(hours, minutes, 0, 0)
      
      // Tambahkan toleransi keterlambatan
      const toleranceTime = new Date(workStartTime)
      toleranceTime.setMinutes(toleranceTime.getMinutes() + workSettings.late_tolerance_minutes)
      
      // Tentukan status berdasarkan waktu check-in dan toleransi
      const status = now > toleranceTime ? AttendanceStatus.LATE : AttendanceStatus.PRESENT
      console.log("Attendance status determined:", status)

      console.log("Creating attendance record with data:", {
        user_id: session.user.id,
        attendance_date: today,
        check_in: now,
        status,
        location_data: { latitude, longitude },
        photo_url
      })

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

      console.log("Attendance created successfully:", attendance)
      return NextResponse.json(attendance, { status: 201 })
    } else if (type === "check_out") {
      if (!existingAttendance) {
        console.log("No check-in record found for check-out")
        return NextResponse.json(
          { error: "No check-in record found for today" },
          { status: 400 }
        )
      }

      if (existingAttendance.check_out) {
        console.log("User already checked out today")
        return NextResponse.json(
          { error: "Already checked out today" },
          { status: 400 }
        )
      }

      console.log("Updating attendance for check-out")
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

      console.log("Check-out successful:", updatedAttendance)
      return NextResponse.json(updatedAttendance)
    } else {
      console.log("Invalid attendance type:", type)
      return NextResponse.json(
        { error: "Invalid attendance type" },
        { status: 400 }
      )
    }
  } catch (error) {
    console.error("Error in POST /api/attendance:", error)
    console.error("Error stack:", (error as Error).stack)
    return NextResponse.json(
      { error: "Internal server error", details: (error as Error).message },
      { status: 500 }
    )
  }
}