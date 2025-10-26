import { NextRequest, NextResponse } from "next/server"
import { auth } from "@/auth"
import { prisma } from "@/lib/prisma"
import { z } from "zod"

// Schema validation untuk SKP Monthly Entry
const skpMonthlySchema = z.object({
  month: z.number().min(1).max(12),
  year: z.number().min(2020).max(2030),
  indicator: z.string().min(1, "Indikator harus diisi"),
  actionPlan: z.string().min(1, "Rencana aksi harus diisi"),
  targetRealization: z.string().min(1, "Realisasi target harus diisi"),
  supportingData: z.string().optional(),
  feedback: z.string().optional(),
})

// GET - Ambil data Sasaran Kinerja Pegawai
export async function GET(request: NextRequest) {
  try {
    const session = await auth()
    if (!session?.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const { searchParams } = new URL(request.url)
    const year = searchParams.get("year") ? parseInt(searchParams.get("year")!) : new Date().getFullYear()
    const month = searchParams.get("month") ? parseInt(searchParams.get("month")!) : undefined
    const userId = searchParams.get("userId") || session.user.id

    // Check if user can access the requested data
    const currentUser = await prisma.user.findUnique({
      where: { id: session.user.id },
      select: { role: true, supervisor_id: true }
    })

    if (!currentUser) {
      return NextResponse.json({ error: "User not found" }, { status: 404 })
    }

    // Authorization check
    const canAccessData = 
      userId === session.user.id || // Own data
      currentUser.role === "ADMIN" || // Admin can see all
      (currentUser.role === "SUPERVISOR" && await prisma.user.findFirst({
        where: { id: userId, supervisor_id: session.user.id }
      })) // Supervisor can see subordinates

    if (!canAccessData) {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 })
    }

    const whereClause: any = {
      user_id: userId,
      year: year,
    }

    if (month) {
      whereClause.month = month
    }

    const entries = await prisma.skpMonthlyEntry.findMany({
      where: whereClause,
      include: {
        user: {
          select: { name: true, nip: true }
        },
        supervisor: {
          select: { name: true }
        },
        files: true
      },
      orderBy: [
        { year: "desc" },
        { month: "desc" },
        { sequence_no: "asc" }
      ]
    })

    const total = await prisma.skpMonthlyEntry.count({
      where: whereClause
    })

    return NextResponse.json({
      success: true,
      data: entries,
      total
    })

  } catch (error) {
    console.error("Error fetching SKP monthly entries:", error)
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    )
  }
}

// POST - Tambah data Sasaran Kinerja Pegawai baru
export async function POST(request: NextRequest) {
  try {
    const session = await auth()
    if (!session?.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const body = await request.json()
    const validatedData = skpMonthlySchema.parse(body)

    // Get user data for supervisor_id
    const user = await prisma.user.findUnique({
      where: { id: session.user.id },
      select: { supervisor_id: true }
    })

    // Get next sequence number for this user/month/year
    const lastEntry = await prisma.skpMonthlyEntry.findFirst({
      where: {
        user_id: session.user.id,
        year: validatedData.year,
        month: validatedData.month
      },
      orderBy: { sequence_no: "desc" }
    })

    const nextSequenceNo = (lastEntry?.sequence_no || 0) + 1

    const newEntry = await prisma.skpMonthlyEntry.create({
      data: {
        user_id: session.user.id,
        month: validatedData.month,
        year: validatedData.year,
        sequence_no: nextSequenceNo,
        indicator: validatedData.indicator,
        action_plan: validatedData.actionPlan,
        target_realization: validatedData.targetRealization,
        supporting_data: validatedData.supportingData,
        feedback: validatedData.feedback,
        created_by: session.user.id,
        supervisor_id: user?.supervisor_id,
        status: "DRAFT"
      },
      include: {
        user: {
          select: { name: true, nip: true }
        },
        supervisor: {
          select: { name: true }
        },
        files: true
      }
    })

    return NextResponse.json({
      success: true,
      data: newEntry,
      message: "Sasaran Kinerja Pegawai berhasil ditambahkan"
    }, { status: 201 })

  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: "Validation error", details: error.errors },
        { status: 400 }
      )
    }

    console.error("Error creating SKP monthly entry:", error)
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    )
  }
}