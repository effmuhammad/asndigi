import { NextRequest, NextResponse } from "next/server"
import { auth } from "../../../../../../../auth"
import { prisma } from "@/lib/prisma"
import { z } from "zod"

// Schema validation untuk update SKP Monthly Behavior
const updateSkpMonthlyBehaviorSchema = z.object({
  behavior: z.string().min(1, "Perilaku harus diisi").optional(),
  feedback: z.string().min(1, "Feedback harus diisi").optional(),
  behavior_category: z.string().optional(),
  assessment_score: z.number().min(1).max(5).optional(),
  improvement_notes: z.string().optional(),
})

// GET - Ambil data Perilaku SKP Bulanan berdasarkan ID
export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const session = await auth()
    if (!session?.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const behavior = await prisma.skpMonthlyBehavior.findUnique({
      where: { id: params.id },
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

    if (!behavior) {
      return NextResponse.json({ error: "Data perilaku tidak ditemukan" }, { status: 404 })
    }

    // Check authorization
    const currentUser = await prisma.user.findUnique({
      where: { id: session.user.id },
      select: { role: true, supervisor_id: true }
    })

    const canAccess = 
      behavior.user_id === session.user.id || // Own data
      currentUser?.role === "ADMIN" || // Admin can see all
      (currentUser?.role === "SUPERVISOR" && behavior.supervisor_id === session.user.id) // Supervisor can see subordinates

    if (!canAccess) {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 })
    }

    return NextResponse.json({
      success: true,
      data: behavior
    })

  } catch (error) {
    console.error("Error fetching SKP monthly behavior:", error)
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    )
  }
}

// PUT - Update data Perilaku SKP Bulanan
export async function PUT(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const session = await auth()
    if (!session?.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const body = await request.json()
    const validatedData = updateSkpMonthlyBehaviorSchema.parse(body)

    // Check if behavior exists and user has permission
    const existingBehavior = await prisma.skpMonthlyBehavior.findUnique({
      where: { id: params.id },
      select: { 
        user_id: true, 
        supervisor_id: true,
        created_by: true 
      }
    })

    if (!existingBehavior) {
      return NextResponse.json({ error: "Data perilaku tidak ditemukan" }, { status: 404 })
    }

    // Check authorization
    const currentUser = await prisma.user.findUnique({
      where: { id: session.user.id },
      select: { role: true }
    })

    const canEdit = 
      existingBehavior.user_id === session.user.id || // Own data
      existingBehavior.created_by === session.user.id || // Created by user
      currentUser?.role === "ADMIN" || // Admin can edit all
      (currentUser?.role === "SUPERVISOR" && existingBehavior.supervisor_id === session.user.id) // Supervisor can edit subordinates

    if (!canEdit) {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 })
    }

    const updatedBehavior = await prisma.skpMonthlyBehavior.update({
      where: { id: params.id },
      data: {
        ...validatedData,
        updated_at: new Date()
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
      data: updatedBehavior,
      message: "Data perilaku berhasil diperbarui"
    })

  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: "Validation error", details: error.issues },
        { status: 400 }
      )
    }

    console.error("Error updating SKP monthly behavior:", error)
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    )
  }
}

// DELETE - Hapus data Perilaku SKP Bulanan
export async function DELETE(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const session = await auth()
    if (!session?.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    // Check if behavior exists and user has permission
    const existingBehavior = await prisma.skpMonthlyBehavior.findUnique({
      where: { id: params.id },
      select: { 
        user_id: true, 
        supervisor_id: true,
        created_by: true 
      }
    })

    if (!existingBehavior) {
      return NextResponse.json({ error: "Data perilaku tidak ditemukan" }, { status: 404 })
    }

    // Check authorization
    const currentUser = await prisma.user.findUnique({
      where: { id: session.user.id },
      select: { role: true }
    })

    const canDelete = 
      existingBehavior.user_id === session.user.id || // Own data
      existingBehavior.created_by === session.user.id || // Created by user
      currentUser?.role === "ADMIN" || // Admin can delete all
      (currentUser?.role === "SUPERVISOR" && existingBehavior.supervisor_id === session.user.id) // Supervisor can delete subordinates

    if (!canDelete) {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 })
    }

    await prisma.skpMonthlyBehavior.delete({
      where: { id: params.id }
    })

    return NextResponse.json({
      success: true,
      message: "Data perilaku berhasil dihapus"
    })

  } catch (error) {
    console.error("Error deleting SKP monthly behavior:", error)
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    )
  }
}