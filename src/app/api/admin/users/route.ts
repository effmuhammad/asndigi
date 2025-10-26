import { NextRequest, NextResponse } from 'next/server'
import { auth } from '@/auth'
import { prisma } from '@/lib/prisma'
import bcrypt from 'bcryptjs'

// GET - Mengambil daftar semua user (hanya admin)
export async function GET() {
  try {
    const session = await auth()
    
    if (!session || session.user.role !== 'ADMIN') {
      return NextResponse.json(
        { error: 'Unauthorized. Admin access required.' },
        { status: 401 }
      )
    }

    const users = await prisma.user.findMany({
      select: {
        id: true,
        nip: true,
        name: true,
        email: true,
        role: true,
        work_unit: true,
        position: true,
        created_at: true,
        updated_at: true,
      },
      orderBy: {
        created_at: 'desc'
      }
    })

    return NextResponse.json(users)
  } catch (error) {
    console.error('Error fetching users:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}

// POST - Membuat user baru (hanya admin)
export async function POST(request: NextRequest) {
  try {
    const session = await auth()
    
    if (!session || session.user.role !== 'ADMIN') {
      return NextResponse.json(
        { error: 'Unauthorized. Admin access required.' },
        { status: 401 }
      )
    }

    const body = await request.json()
    const { nip, name, email, password, role, work_unit, position } = body

    // Validasi input
    if (!nip || !name || !email || !password || !role) {
      return NextResponse.json(
        { error: 'NIP, nama, email, password, dan role wajib diisi' },
        { status: 400 }
      )
    }

    // Cek apakah NIP atau email sudah ada
    const existingUser = await prisma.user.findFirst({
      where: {
        OR: [
          { nip },
          { email }
        ]
      }
    })

    if (existingUser) {
      return NextResponse.json(
        { error: 'NIP atau email sudah terdaftar' },
        { status: 400 }
      )
    }

    // Hash password
    const hashedPassword = await bcrypt.hash(password, 10)

    // Buat user baru
    const newUser = await prisma.user.create({
      data: {
        nip,
        name,
        email,
        password: hashedPassword,
        role,
        work_unit,
        position,
      },
      select: {
        id: true,
        nip: true,
        name: true,
        email: true,
        role: true,
        work_unit: true,
        position: true,
        created_at: true,
        updated_at: true,
      }
    })

    return NextResponse.json(newUser, { status: 201 })
  } catch (error) {
    console.error('Error creating user:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}