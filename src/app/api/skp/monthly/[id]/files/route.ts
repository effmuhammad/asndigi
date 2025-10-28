import { NextRequest, NextResponse } from "next/server"
import { auth } from "../../../../../../../auth"
import { prisma } from "@/lib/prisma"
import { writeFile, mkdir } from "fs/promises"
import { join } from "path"
import { existsSync } from "fs"

// POST - Upload file untuk Sasaran Kinerja Pegawai
export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const session = await auth()
    if (!session?.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    // Check if SKP entry exists and user has permission
    const entry = await prisma.skpMonthlyEntry.findUnique({
      where: { id }
    })

    if (!entry) {
      return NextResponse.json({ error: "SKP entry not found" }, { status: 404 })
    }

    // Check authorization
    const currentUser = await prisma.user.findUnique({
      where: { id: session.user.id },
      select: { role: true }
    })

    const canUpload = 
      entry.user_id === session.user.id || // Own data
      currentUser?.role === "ADMIN" // Admin can upload to any entry

    if (!canUpload) {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 })
    }

    const formData = await request.formData()
    const file = formData.get("file") as File

    if (!file) {
      return NextResponse.json({ error: "No file provided" }, { status: 400 })
    }

    // Validate file size (max 10MB)
    const maxSize = 10 * 1024 * 1024 // 10MB
    if (file.size > maxSize) {
      return NextResponse.json({ error: "File size too large (max 10MB)" }, { status: 400 })
    }

    // Validate file type
    const allowedTypes = [
      "application/pdf",
      "image/jpeg",
      "image/png",
      "image/jpg",
      "application/msword",
      "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
      "application/vnd.ms-excel",
      "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet"
    ]

    if (!allowedTypes.includes(file.type)) {
      return NextResponse.json({ 
        error: "File type not allowed. Only PDF, images, and Office documents are allowed." 
      }, { status: 400 })
    }

    // Create upload directory if it doesn't exist
    const uploadDir = join(process.cwd(), "public", "uploads", "skp-monthly")
    if (!existsSync(uploadDir)) {
      await mkdir(uploadDir, { recursive: true })
    }

    // Generate unique filename
    const timestamp = Date.now()
    const fileExtension = file.name.split('.').pop()
    const fileName = `${id}_${timestamp}.${fileExtension}`
    const filePath = join(uploadDir, fileName)
    const publicPath = `/uploads/skp-monthly/${fileName}`

    // Save file to disk
    const bytes = await file.arrayBuffer()
    const buffer = Buffer.from(bytes)
    await writeFile(filePath, buffer)

    // Save file info to database
    const fileRecord = await prisma.skpMonthlyFile.create({
      data: {
        entry_id: id,
        file_name: fileName,
        original_name: file.name,
        file_path: publicPath,
        file_type: file.type,
        file_size: file.size
      }
    })

    return NextResponse.json({
      success: true,
      data: fileRecord,
      message: "File berhasil diupload"
    }, { status: 201 })

  } catch (error) {
    console.error("Error uploading file:", error)
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    )
  }
}

// GET - Ambil daftar file untuk Sasaran Kinerja Pegawai
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

    // Check if SKP entry exists and user has permission
    const entry = await prisma.skpMonthlyEntry.findUnique({
      where: { id }
    })

    if (!entry) {
      return NextResponse.json({ error: "SKP entry not found" }, { status: 404 })
    }

    // Check authorization
    const currentUser = await prisma.user.findUnique({
      where: { id: session.user.id },
      select: { role: true }
    })

    const canView = 
      entry.user_id === session.user.id || // Own data
      currentUser?.role === "ADMIN" || // Admin can view all
      (currentUser?.role === "SUPERVISOR" && entry.supervisor_id === session.user.id) // Supervisor can view subordinates

    if (!canView) {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 })
    }

    const files = await prisma.skpMonthlyFile.findMany({
      where: { entry_id: id },
      orderBy: { uploaded_at: "desc" }
    })

    return NextResponse.json({
      success: true,
      data: files
    })

  } catch (error) {
    console.error("Error fetching files:", error)
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    )
  }
}