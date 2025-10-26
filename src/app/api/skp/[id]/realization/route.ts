import { NextRequest, NextResponse } from "next/server"
import { auth } from "@/../auth"

import { PrismaClient } from "@prisma/client"

const prisma = new PrismaClient()

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await auth()
    const { id } = await params
    if (!session?.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const body = await request.json()
    const { realization, progress_percentage, notes, evidence_files } = body

    if (!realization || progress_percentage === undefined) {
      return NextResponse.json(
        { error: "Missing required fields" },
        { status: 400 }
      )
    }

    // Verify the SKP item belongs to the current user
    const skpItem = await prisma.skpItem.findFirst({
      where: {
        id: id,
        user_id: session.user.id
      }
    })

    if (!skpItem) {
      return NextResponse.json(
        { error: "SKP item not found" },
        { status: 404 }
      )
    }

    const realizationRecord = await prisma.skpRealization.create({
      data: {
        skp_item_id: id,
        realization,
        progress_percentage,
        notes,
        evidence_files: evidence_files || []
      }
    })

    return NextResponse.json(realizationRecord, { status: 201 })
  } catch (error) {
    console.error("Error creating SKP realization:", error)
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    )
  }
}

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await auth()
    const { id } = await params
    if (!session?.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    // Verify the SKP item belongs to the current user
    const skpItem = await prisma.skpItem.findFirst({
      where: {
        id: id,
        user_id: session.user.id
      }
    })

    if (!skpItem) {
      return NextResponse.json(
        { error: "SKP item not found" },
        { status: 404 }
      )
    }

    const realizations = await prisma.skpRealization.findMany({
      where: { skp_item_id: id },
      orderBy: { created_at: "desc" }
    })

    return NextResponse.json(realizations)
  } catch (error) {
    console.error("Error fetching SKP realizations:", error)
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    )
  }
}