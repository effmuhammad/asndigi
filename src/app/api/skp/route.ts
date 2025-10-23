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
    const year = searchParams.get("year")

    const where: any = {
      user_id: session.user.id
    }

    if (year) {
      where.year = parseInt(year)
    }

    const skpItems = await prisma.skpItem.findMany({
      where,
      include: {
        skp_realizations: {
          orderBy: {
            created_at: "desc"
          }
        }
      },
      orderBy: {
        no: "asc"
      }
    })

    return NextResponse.json(skpItems)
  } catch (error) {
    console.error("Error fetching SKP items:", error)
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
    const { indikator, rencana_aksi, target, satuan, bobot, year } = body

    if (!indikator || !rencana_aksi || !target || !satuan || bobot === undefined) {
      return NextResponse.json(
        { error: "Missing required fields" },
        { status: 400 }
      )
    }

    // Get the next sequence number for this user and year
    const lastItem = await prisma.skpItem.findFirst({
      where: {
        user_id: session.user.id,
        year: year || new Date().getFullYear()
      },
      orderBy: {
        no: "desc"
      }
    })

    const nextNo = lastItem ? lastItem.no + 1 : 1

    const skpItem = await prisma.skpItem.create({
      data: {
        user_id: session.user.id,
        no: nextNo,
        indikator,
        rencana_aksi,
        target,
        satuan,
        bobot,
        year: year || new Date().getFullYear()
      }
    })

    return NextResponse.json(skpItem, { status: 201 })
  } catch (error) {
    console.error("Error creating SKP item:", error)
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    )
  }
}