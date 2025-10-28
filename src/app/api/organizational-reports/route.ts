import { NextRequest, NextResponse } from 'next/server'
import { auth } from '../../../../auth'
import { prisma } from '@/lib/prisma'

// GET - Ambil semua laporan kinerja organisasi
export async function GET(request: NextRequest) {
  try {
    const session = await auth()
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { searchParams } = new URL(request.url)
    const year = searchParams.get('year')

    const where = year ? { year: parseInt(year) } : {}

    const reports = await prisma.organizationalPerformanceReport.findMany({
      where,
      include: {
        creator: {
          select: {
            id: true,
            name: true,
            nip: true
          }
        }
      },
      orderBy: {
        year: 'desc'
      }
    })

    return NextResponse.json(reports)
  } catch (error) {
    console.error('Error fetching organizational reports:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}

// POST - Buat laporan kinerja organisasi baru
export async function POST(request: NextRequest) {
  try {
    const session = await auth()
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const body = await request.json()
    const { year, summary, recommendations } = body

    // Validasi input
    if (!year || year < 2020 || year > new Date().getFullYear()) {
      return NextResponse.json(
        { error: 'Tahun tidak valid' },
        { status: 400 }
      )
    }

    // Cek apakah laporan untuk tahun tersebut sudah ada
    const existingReport = await prisma.organizationalPerformanceReport.findUnique({
      where: { year }
    })

    if (existingReport) {
      return NextResponse.json(
        { error: 'Laporan untuk tahun ini sudah ada' },
        { status: 400 }
      )
    }

    // Hitung statistik kinerja organisasi
    const stats = await calculateOrganizationalPerformance(year)

    // Tentukan predikat berdasarkan skor
    const predicate = determinePredicate(stats.overall_performance_score)

    // Buat laporan baru
    const report = await prisma.organizationalPerformanceReport.create({
      data: {
        year,
        total_employees: stats.total_employees,
        average_attendance_rate: stats.average_attendance_rate,
        average_skp_progress: stats.average_skp_progress,
        overall_performance_score: stats.overall_performance_score,
        predicate,
        summary,
        recommendations,
        created_by: session.user.id
      },
      include: {
        creator: {
          select: {
            id: true,
            name: true,
            nip: true
          }
        }
      }
    })

    return NextResponse.json(report, { status: 201 })
  } catch (error) {
    console.error('Error creating organizational report:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}

// Fungsi untuk menghitung kinerja organisasi
async function calculateOrganizationalPerformance(year: number) {
  // Hitung total pegawai aktif
  const totalEmployees = await prisma.user.count({
    where: {
      created_at: {
        lte: new Date(`${year}-12-31`)
      }
    }
  })

  // Hitung rata-rata tingkat kehadiran
  const attendanceStats = await prisma.attendance.groupBy({
    by: ['user_id'],
    where: {
      attendance_date: {
        gte: new Date(`${year}-01-01`),
        lte: new Date(`${year}-12-31`)
      }
    },
    _count: {
      id: true
    }
  })

  // Hitung persentase kehadiran rata-rata
  let totalAttendanceRate = 0
  let validUsers = 0

  for (const userAttendance of attendanceStats) {
    const presentDays = await prisma.attendance.count({
      where: {
        user_id: userAttendance.user_id,
        attendance_date: {
          gte: new Date(`${year}-01-01`),
          lte: new Date(`${year}-12-31`)
        },
        status: {
          in: ['PRESENT', 'LATE']
        }
      }
    })

    const totalDays = userAttendance._count.id
    if (totalDays > 0) {
      totalAttendanceRate += (presentDays / totalDays) * 100
      validUsers++
    }
  }

  const averageAttendanceRate = validUsers > 0 ? totalAttendanceRate / validUsers : 0

  // Hitung rata-rata progress SKP
  const skpStats = await prisma.skpMonthlyEntry.groupBy({
    by: ['user_id'],
    where: {
      year,
      status: 'APPROVED'
    },
    _count: {
      id: true
    }
  })

  // Estimasi progress SKP berdasarkan jumlah entry yang disetujui
  const totalSkpEntries = skpStats.reduce((sum, stat) => sum + stat._count.id, 0)
  const expectedEntriesPerUser = 12 // 12 bulan
  const totalExpectedEntries = totalEmployees * expectedEntriesPerUser
  const averageSkpProgress = totalExpectedEntries > 0 ? (totalSkpEntries / totalExpectedEntries) * 100 : 0

  // Hitung skor kinerja keseluruhan (rata-rata dari kehadiran dan SKP)
  const overallPerformanceScore = (averageAttendanceRate + averageSkpProgress) / 2

  return {
    total_employees: totalEmployees,
    average_attendance_rate: Math.round(averageAttendanceRate * 100) / 100,
    average_skp_progress: Math.round(averageSkpProgress * 100) / 100,
    overall_performance_score: Math.round(overallPerformanceScore * 100) / 100
  }
}

// Fungsi untuk menentukan predikat berdasarkan skor
function determinePredicate(score: number): 'SANGAT_BAIK' | 'BAIK' | 'CUKUP' | 'KURANG' {
  if (score >= 90) return 'SANGAT_BAIK'
  if (score >= 75) return 'BAIK'
  if (score >= 60) return 'CUKUP'
  return 'KURANG'
}