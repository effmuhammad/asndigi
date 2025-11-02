import { NextRequest, NextResponse } from "next/server"
import { auth } from "../../../../../../auth"
import { prisma } from "@/lib/prisma"
import { z } from "zod"
import { calculateDeadline } from "@/lib/deadline-utils"

// Schema validation untuk update SKP Monthly Entry
const updateSkpMonthlySchema = z.object({
  indicator: z.string().min(1, "Indikator harus diisi").optional(),
  actionPlan: z.string().min(1, "Rencana aksi harus diisi").optional(),
  targetRealization: z.string().min(1, "Realisasi target harus diisi").optional(),
  supportingData: z.string().optional(),
  feedback: z.string().optional(),
  status: z.enum(["DRAFT", "SUBMITTED", "APPROVED", "REJECTED"]).optional(),
})

// GET - Ambil detail Sasaran Kinerja Pegawai berdasarkan ID
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const session = await auth()
    if (!session?.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const entry = await prisma.skpMonthlyEntry.findUnique({
      where: { id },
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

    if (!entry) {
      return NextResponse.json({ error: "SKP entry not found" }, { status: 404 })
    }

    // Check authorization
    const currentUser = await prisma.user.findUnique({
      where: { id: session.user.id },
      select: { role: true }
    })

    const canAccess = 
      entry.user_id === session.user.id || // Own data
      currentUser?.role === "ADMIN" || // Admin can see all
      (currentUser?.role === "SUPERVISOR" && entry.supervisor_id === session.user.id) // Supervisor can see subordinates

    if (!canAccess) {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 })
    }

    // Add deadline calculation to the entry
    const entryWithDeadline = {
      ...entry,
      deadline: calculateDeadline(entry.year, entry.month)
    }

    return NextResponse.json({
      success: true,
      data: entryWithDeadline
    })

  } catch (error) {
    console.error("Error fetching SKP monthly entry:", error)
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    )
  }
}

// PUT - Update Sasaran Kinerja Pegawai
export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const session = await auth()
    if (!session?.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const body = await request.json()
    const validatedData = updateSkpMonthlySchema.parse(body)

    // Check if entry exists and get current data
    const existingEntry = await prisma.skpMonthlyEntry.findUnique({
      where: { id },
      include: {
        user: {
          select: { role: true }
        }
      }
    })

    if (!existingEntry) {
      return NextResponse.json({ error: "SKP entry not found" }, { status: 404 })
    }

    // Check authorization
    const currentUser = await prisma.user.findUnique({
      where: { id: session.user.id },
      select: { role: true }
    })

    const canEdit = 
      existingEntry.user_id === session.user.id || // Own data
      currentUser?.role === "ADMIN" || // Admin can edit all
      (currentUser?.role === "SUPERVISOR" && existingEntry.supervisor_id === session.user.id) // Supervisor can edit subordinates

    if (!canEdit) {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 })
    }

    // Prepare update data
    const updateData: Record<string, unknown> = {}
    
    if (validatedData.indicator !== undefined) updateData.indicator = validatedData.indicator
    if (validatedData.actionPlan !== undefined) updateData.action_plan = validatedData.actionPlan
    if (validatedData.targetRealization !== undefined) updateData.target_realization = validatedData.targetRealization
    if (validatedData.supportingData !== undefined) {
      updateData.supporting_data = validatedData.supportingData
      // Automatically set submission date when supporting data is provided, clear it when removed
      updateData.supporting_data_submission_date = validatedData.supportingData ? new Date() : null
    }
    if (validatedData.feedback !== undefined) updateData.feedback = validatedData.feedback
    if (validatedData.status !== undefined) updateData.status = validatedData.status

    updateData.updated_at = new Date()

    const updatedEntry = await prisma.skpMonthlyEntry.update({
      where: { id },
      data: updateData,
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

    // Add deadline calculation to the updated entry
    const updatedEntryWithDeadline = {
      ...updatedEntry,
      deadline: calculateDeadline(updatedEntry.year, updatedEntry.month)
    }

    return NextResponse.json({
      success: true,
      data: updatedEntryWithDeadline,
      message: "Sasaran Kinerja Pegawai berhasil diperbarui"
    })

  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: "Validation error", details: error.issues },
        { status: 400 }
      )
    }

    console.error("Error updating SKP monthly entry:", error)
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    )
  }
}

// DELETE - Hapus Sasaran Kinerja Pegawai
export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const session = await auth()
    if (!session?.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    // Check if entry exists
    const existingEntry = await prisma.skpMonthlyEntry.findUnique({
      where: { id }
    })

    if (!existingEntry) {
      return NextResponse.json({ error: "SKP entry not found" }, { status: 404 })
    }

    // Check authorization
    const currentUser = await prisma.user.findUnique({
      where: { id: session.user.id },
      select: { role: true }
    })

    const canDelete = 
      existingEntry.user_id === session.user.id || // Own data
      currentUser?.role === "ADMIN" // Only admin and owner can delete

    if (!canDelete) {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 })
    }

    // Delete the entry (files will be deleted automatically due to cascade)
    await prisma.skpMonthlyEntry.delete({
      where: { id }
    })

    return NextResponse.json({
      success: true,
      message: "Sasaran Kinerja Pegawai berhasil dihapus"
    })

  } catch (error) {
    console.error("Error deleting SKP monthly entry:", error)
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    )
  }
}