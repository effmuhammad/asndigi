import { NextRequest, NextResponse } from "next/server"
import { auth } from "../../../../../../auth"
import { prisma } from "@/lib/prisma"
import { z } from "zod"

// Schema validation untuk SKP Monthly Behavior
const skpMonthlyBehaviorSchema = z.object({
  month: z.number().min(1).max(12),
  year: z.number().min(2020).max(2030),
  behavior: z.string().min(1, "Perilaku harus diisi"),
  feedback: z.string().min(1, "Feedback harus diisi"),
  behavior_category: z.string().optional(),
  assessment_score: z.number().min(1).max(5).optional(),
  improvement_notes: z.string().optional(),
})

// GET - Ambil data Perilaku SKP Bulanan
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

    const whereClause: Record<string, unknown> = {
      user_id: userId,
      year: year,
    }

    if (month) {
      whereClause.month = month
    }

    const behaviors = await prisma.skpMonthlyBehavior.findMany({
      where: whereClause,
      include: {
        user: {
          select: { name: true, nip: true }
        },
        supervisor: {
          select: { name: true }
        },
        creator: {
          select: { name: true }
        }
      },
      orderBy: [
        { year: "desc" },
        { month: "desc" },
        { created_at: "desc" }
      ]
    })

    const total = await prisma.skpMonthlyBehavior.count({
      where: whereClause
    })

    return NextResponse.json({
      success: true,
      data: behaviors,
      total
    })

  } catch (error) {
    console.error("Error fetching SKP monthly behaviors:", error)
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    )
  }
}

// POST - Tambah data Perilaku SKP Bulanan baru
export async function POST(request: NextRequest) {
  try {
    const session = await auth()
    if (!session?.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const body = await request.json()
    const validatedData = skpMonthlyBehaviorSchema.parse(body)

    // Get user data for supervisor_id
    const user = await prisma.user.findUnique({
      where: { id: session.user.id },
      select: { supervisor_id: true }
    })

    const newBehavior = await prisma.skpMonthlyBehavior.create({
      data: {
        user_id: session.user.id,
        month: validatedData.month,
        year: validatedData.year,
        behavior: validatedData.behavior,
        feedback: validatedData.feedback,
        behavior_category: validatedData.behavior_category,
        assessment_score: validatedData.assessment_score,
        improvement_notes: validatedData.improvement_notes,
        created_by: session.user.id,
        supervisor_id: user?.supervisor_id,
      },
      include: {
        user: {
          select: { name: true, nip: true }
        },
        supervisor: {
          select: { name: true }
        },
        creator: {
          select: { name: true }
        }
      }
    })

    return NextResponse.json({
      success: true,
      data: newBehavior,
      message: "Data perilaku berhasil ditambahkan"
    }, { status: 201 })

  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: "Validation error", details: error.issues },
        { status: 400 }
      )
    }

    console.error("Error creating SKP monthly behavior:", error)
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    )
  }
}