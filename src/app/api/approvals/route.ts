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
    const status = searchParams.get("status")

    const where: any = {
      approver_id: session.user.id
    }

    if (status && status !== "all") {
      where.status = status
    }

    const approvals = await prisma.approval.findMany({
      where,
      include: {
        report: {
          include: {
            user: {
              select: {
                name: true,
                nip: true,
                email: true
              }
            }
          }
        }
      },
      orderBy: {
        created_at: "desc"
      }
    })

    return NextResponse.json(approvals)
  } catch (error) {
    console.error("Error fetching approvals:", error)
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    )
  }
}