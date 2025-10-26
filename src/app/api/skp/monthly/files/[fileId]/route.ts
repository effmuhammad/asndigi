import { NextRequest, NextResponse } from "next/server"
import { auth } from "@/auth"
import { prisma } from "@/lib/prisma"
import { unlink } from "fs/promises"
import { join } from "path"
import { existsSync } from "fs"

// DELETE - Hapus file Sasaran Kinerja Pegawai
export async function DELETE(
  request: NextRequest,
  { params }: { params: { fileId: string } }
) {
  try {
    const session = await auth()
    if (!session?.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    // Get file info and check if it exists
    const file = await prisma.skpMonthlyFile.findUnique({
      where: { id: params.fileId },
      include: {
        entry: true
      }
    })

    if (!file) {
      return NextResponse.json({ error: "File not found" }, { status: 404 })
    }

    // Check authorization
    const currentUser = await prisma.user.findUnique({
      where: { id: session.user.id },
      select: { role: true }
    })

    const canDelete = 
      file.entry.user_id === session.user.id || // Own data
      currentUser?.role === "ADMIN" // Admin can delete any file

    if (!canDelete) {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 })
    }

    // Delete file from filesystem
    const filePath = join(process.cwd(), "public", file.file_path)
    if (existsSync(filePath)) {
      try {
        await unlink(filePath)
      } catch (error) {
        console.error("Error deleting file from filesystem:", error)
        // Continue with database deletion even if file deletion fails
      }
    }

    // Delete file record from database
    await prisma.skpMonthlyFile.delete({
      where: { id: params.fileId }
    })

    return NextResponse.json({
      success: true,
      message: "File berhasil dihapus"
    })

  } catch (error) {
    console.error("Error deleting file:", error)
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    )
  }
}