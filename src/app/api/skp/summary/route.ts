import { NextRequest, NextResponse } from "next/server"
import { auth } from "../../../../../auth"
import { prisma } from "@/lib/prisma"
import { generateSkpSummary, type SkpSummaryData } from "@/lib/openai"
import { z } from "zod"

// Schema validation untuk request
const summaryRequestSchema = z.object({
  year: z.number().min(2020).max(2030),
  month: z.number().min(1).max(12).optional(),
  userId: z.string().optional(), // For supervisors to generate summary for their subordinates
})

export async function POST(request: NextRequest) {
  try {
    const session = await auth()
    if (!session?.user?.id) {
      return NextResponse.json(
        { error: "Unauthorized" },
        { status: 401 }
      )
    }

    const body = await request.json()
    const validatedData = summaryRequestSchema.parse(body)
    const { year, month, userId } = validatedData

    // Determine which user's SKP to summarize
    let targetUserId = session.user.id
    let targetUser = session.user

    // If userId is provided and user is supervisor/admin, allow generating summary for subordinates
    if (userId && (session.user.role === 'SUPERVISOR' || session.user.role === 'ADMIN')) {
      // Verify the target user exists and is supervised by current user (for supervisors)
      const user = await prisma.user.findUnique({
        where: { id: userId },
        select: {
          id: true,
          name: true,
          nip: true,
          supervisor_id: true
        }
      })

      if (!user) {
        return NextResponse.json(
          { error: "User not found" },
          { status: 404 }
        )
      }

      // For supervisors, check if they supervise this user
      if (session.user.role === 'SUPERVISOR' && user.supervisor_id !== session.user.id) {
        return NextResponse.json(
          { error: "You can only generate summaries for your subordinates" },
          { status: 403 }
        )
      }

      targetUserId = userId
      targetUser = {
        ...session.user,
        id: user.id,
        name: user.name,
        nip: user.nip
      }
    }

    // Build where clause for SKP entries
    const whereClause: Record<string, unknown> = {
      user_id: targetUserId,
      year: year,
    }

    if (month) {
      whereClause.month = month
    }

    // Fetch SKP entries
    const skpEntries = await prisma.skpMonthlyEntry.findMany({
      where: whereClause,
      include: {
        user: {
          select: { name: true, nip: true }
        }
      },
      orderBy: [
        { month: "asc" },
        { sequence_no: "asc" }
      ]
    })

    if (skpEntries.length === 0) {
      return NextResponse.json(
        { error: "No SKP entries found for the specified period" },
        { status: 404 }
      )
    }

    // Transform data for OpenAI
    const skpData: SkpSummaryData[] = skpEntries.map(entry => ({
      indicator: entry.indicator,
      action_plan: entry.action_plan,
      target_realization: entry.target_realization,
      supporting_data: entry.supporting_data || undefined,
      feedback: entry.feedback || undefined,
      status: entry.status,
      month: entry.month,
      year: entry.year
    }))

    // Generate period description
    const periodDescription = month 
      ? `${getMonthName(month)} ${year}`
      : `Tahun ${year}`

    // Generate AI summary
    const aiSummary = await generateSkpSummary(
      skpData,
      targetUser.name,
      periodDescription
    )

    // Return the summary
    return NextResponse.json({
      success: true,
      data: {
        employee: {
          name: targetUser.name,
          nip: targetUser.nip
        },
        period: periodDescription,
        total_entries: skpEntries.length,
        summary: aiSummary,
        generated_at: new Date().toISOString()
      }
    })

  } catch (error) {
    console.error("Error generating SKP summary:", error)
    
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: "Invalid request data", details: error.issues },
        { status: 400 }
      )
    }

    if (error instanceof Error) {
      return NextResponse.json(
        { error: error.message },
        { status: 500 }
      )
    }

    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    )
  }
}

export async function GET(request: NextRequest) {
  try {
    const session = await auth()
    if (!session?.user?.id) {
      return NextResponse.json(
        { error: "Unauthorized" },
        { status: 401 }
      )
    }

    const { searchParams } = new URL(request.url)
    const year = parseInt(searchParams.get('year') || new Date().getFullYear().toString())
    const month = searchParams.get('month') ? parseInt(searchParams.get('month')!) : undefined
    const userId = searchParams.get('userId') || undefined

    // Validate parameters
    if (year < 2020 || year > 2030) {
      return NextResponse.json(
        { error: "Invalid year parameter" },
        { status: 400 }
      )
    }

    if (month && (month < 1 || month > 12)) {
      return NextResponse.json(
        { error: "Invalid month parameter" },
        { status: 400 }
      )
    }

    // Use the same logic as POST for user validation
    let targetUserId = session.user.id
    let targetUser = session.user

    if (userId && (session.user.role === 'SUPERVISOR' || session.user.role === 'ADMIN')) {
      const user = await prisma.user.findUnique({
        where: { id: userId },
        select: {
          id: true,
          name: true,
          nip: true,
          supervisor_id: true
        }
      })

      if (!user) {
        return NextResponse.json(
          { error: "User not found" },
          { status: 404 }
        )
      }

      if (session.user.role === 'SUPERVISOR' && user.supervisor_id !== session.user.id) {
        return NextResponse.json(
          { error: "You can only access summaries for your subordinates" },
          { status: 403 }
        )
      }

      targetUserId = userId
      targetUser = {
        ...session.user,
        id: user.id,
        name: user.name,
        nip: user.nip
      }
    }

    // Build where clause
    const whereClause: Record<string, unknown> = {
      user_id: targetUserId,
      year: year,
    }

    if (month) {
      whereClause.month = month
    }

    // Get basic statistics without generating AI summary
    const skpEntries = await prisma.skpMonthlyEntry.findMany({
      where: whereClause,
      select: {
        id: true,
        month: true,
        year: true,
        status: true,
        indicator: true,
        created_at: true
      },
      orderBy: [
        { month: "asc" },
        { sequence_no: "asc" }
      ]
    })

    const stats = {
      total_entries: skpEntries.length,
      by_status: {
        DRAFT: skpEntries.filter(e => e.status === 'DRAFT').length,
        SUBMITTED: skpEntries.filter(e => e.status === 'SUBMITTED').length,
        APPROVED: skpEntries.filter(e => e.status === 'APPROVED').length,
        REJECTED: skpEntries.filter(e => e.status === 'REJECTED').length,
      },
      by_month: skpEntries.reduce((acc, entry) => {
        acc[entry.month] = (acc[entry.month] || 0) + 1
        return acc
      }, {} as Record<number, number>)
    }

    return NextResponse.json({
      success: true,
      data: {
        employee: {
          name: targetUser.name,
          nip: targetUser.nip
        },
        period: month ? `${getMonthName(month)} ${year}` : `Tahun ${year}`,
        statistics: stats,
        entries: skpEntries
      }
    })

  } catch (error) {
    console.error("Error fetching SKP summary data:", error)
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    )
  }
}

// Helper function to get month name in Indonesian
function getMonthName(month: number): string {
  const months = [
    'Januari', 'Februari', 'Maret', 'April', 'Mei', 'Juni',
    'Juli', 'Agustus', 'September', 'Oktober', 'November', 'Desember'
  ]
  return months[month - 1] || 'Unknown'
}