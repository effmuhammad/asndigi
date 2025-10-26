import { NextRequest, NextResponse } from "next/server"
import { auth } from "@/../auth"

import { PrismaClient } from "@prisma/client"

const prisma = new PrismaClient()

export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await auth()
    if (!session?.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const { id } = await params
    const body = await request.json()
    const { indicator, action_plan, target, unit, weight } = body

    // Verify the SKP item belongs to the current user
    const existingItem = await prisma.skpItem.findFirst({
      where: {
        id,
        user_id: session.user.id
      }
    })

    if (!existingItem) {
      return NextResponse.json(
        { error: "SKP item not found" },
        { status: 404 }
      )
    }

    const updatedItem = await prisma.skpItem.update({
      where: { id },
      data: {
        indicator,
        action_plan,
        target,
        unit,
        weight
      }
    })

    return NextResponse.json(updatedItem)
  } catch (error) {
    console.error("Error updating SKP item:", error)
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    )
  }
}

export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await auth()
    if (!session?.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const { id } = await params

    // Verify the SKP item belongs to the current user
    const existingItem = await prisma.skpItem.findFirst({
      where: {
        id,
        user_id: session.user.id
      }
    })

    if (!existingItem) {
      return NextResponse.json(
        { error: "SKP item not found" },
        { status: 404 }
      )
    }

    // Delete related realizations first
    await prisma.skpRealization.deleteMany({
      where: { skp_item_id: id }
    })

    // Delete the SKP item
    await prisma.skpItem.delete({
      where: { id }
    })

    return NextResponse.json({ message: "SKP item deleted successfully" })
  } catch (error) {
    console.error("Error deleting SKP item:", error)
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    )
  }
}