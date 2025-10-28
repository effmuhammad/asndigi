import { NextRequest, NextResponse } from 'next/server';
import { auth } from '../../../../../auth';
import { prisma } from '@/lib/prisma';
import { z } from 'zod';

// SK History validation schema
const skHistorySchema = z.object({
  sk_number: z.string().min(1, 'Nomor SK wajib diisi'),
  sk_type: z.enum(['PENGANGKATAN', 'MUTASI', 'PROMOSI', 'PEMBERHENTIAN']),
  position: z.string().min(1, 'Jabatan wajib diisi'),
  unit: z.string().min(1, 'Unit kerja wajib diisi'),
  effective_date: z.string().min(1, 'Tanggal efektif wajib diisi'),
  file_url: z.string().optional(),
  description: z.string().optional(),
});

// GET - Fetch SK history
export async function GET() {
  try {
    const session = await auth();
    
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Get or create profile
    let profile = await prisma.profile.findUnique({
      where: { user_id: session.user.id },
    });

    if (!profile) {
      profile = await prisma.profile.create({
        data: {
          user_id: session.user.id,
          skills: [],
        },
      });
    }

    const skHistory = await prisma.skHistory.findMany({
      where: { profile_id: profile.id },
      orderBy: { effective_date: 'desc' }
    });

    return NextResponse.json(skHistory);
  } catch (error) {
    console.error('Error fetching SK history:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

// POST - Create new SK record
export async function POST(request: NextRequest) {
  try {
    const session = await auth();
    
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const body = await request.json();
    const validatedData = skHistorySchema.parse(body);

    // Get or create profile
    let profile = await prisma.profile.findUnique({
      where: { user_id: session.user.id },
    });

    if (!profile) {
      profile = await prisma.profile.create({
        data: {
          user_id: session.user.id,
          skills: [],
        },
      });
    }

    const skRecord = await prisma.skHistory.create({
      data: {
        profile_id: profile.id,
        sk_number: validatedData.sk_number,
        sk_type: validatedData.sk_type,
        position: validatedData.position,
        unit: validatedData.unit,
        effective_date: new Date(validatedData.effective_date),
        file_url: validatedData.file_url,
        description: validatedData.description,
      }
    });

    return NextResponse.json(skRecord, { status: 201 });
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json({ error: 'Validation error', details: error.issues }, { status: 400 });
    }
    
    console.error('Error creating SK record:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}