import { NextRequest, NextResponse } from 'next/server'
import { auth } from '../../../../../auth'
import { prisma } from '@/lib/prisma'

// GET - Mengambil konfigurasi waktu kerja
export async function GET() {
  try {
    const session = await auth()
    
    if (!session) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      )
    }

    // Ambil pengaturan waktu kerja yang aktif
    const workSettings = await prisma.workSettings.findFirst({
      where: {
        is_active: true
      },
      orderBy: {
        updated_at: 'desc'
      }
    })

    // Jika tidak ada pengaturan, buat default
    if (!workSettings) {
      const defaultSettings = await prisma.workSettings.create({
        data: {
          work_start_time: '08:00',
          work_end_time: '17:00',
          late_tolerance_minutes: 15,
          is_active: true
        }
      })
      
      return NextResponse.json(defaultSettings)
    }

    return NextResponse.json(workSettings)
  } catch (error) {
    console.error('Error fetching work settings:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}

// PUT - Memperbarui konfigurasi waktu kerja (hanya admin)
export async function PUT(request: NextRequest) {
  try {
    const session = await auth()
    
    if (!session || session.user.role !== 'ADMIN') {
      return NextResponse.json(
        { error: 'Unauthorized. Admin access required.' },
        { status: 401 }
      )
    }

    const body = await request.json()
    const { work_start_time, work_end_time, late_tolerance_minutes } = body

    // Validasi input
    if (!work_start_time || !work_end_time) {
      return NextResponse.json(
        { error: 'Waktu mulai dan waktu selesai kerja wajib diisi' },
        { status: 400 }
      )
    }

    // Validasi format waktu (HH:MM)
    const timeRegex = /^([01]\d|2[0-3]):([0-5]\d)$/
    if (!timeRegex.test(work_start_time) || !timeRegex.test(work_end_time)) {
      return NextResponse.json(
        { error: 'Format waktu harus HH:MM (contoh: 08:00)' },
        { status: 400 }
      )
    }

    // Nonaktifkan semua pengaturan yang ada
    await prisma.workSettings.updateMany({
      where: {
        is_active: true
      },
      data: {
        is_active: false
      }
    })

    // Buat pengaturan baru
    const newSettings = await prisma.workSettings.create({
      data: {
        work_start_time,
        work_end_time,
        late_tolerance_minutes: late_tolerance_minutes || 0,
        is_active: true
      }
    })

    return NextResponse.json({
      success: true,
      message: 'Pengaturan waktu kerja berhasil diperbarui',
      data: newSettings
    })
  } catch (error) {
    console.error('Error updating work settings:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}