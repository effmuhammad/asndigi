import { NextRequest, NextResponse } from 'next/server';
import { auth } from '../../../../../auth';
import { prisma } from '@/lib/prisma';
import { z } from 'zod';

// Training Record validation schema
const trainingRecordSchema = z.object({
  training_name: z.string().min(1, 'Nama pelatihan wajib diisi'),
  category: z.enum(['TEKNIS', 'MANAJERIAL', 'SOSIAL_KULTURAL', 'FUNGSIONAL', 'KEPEMIMPINAN']),
  organizer: z.string().min(1, 'Penyelenggara wajib diisi'),
  start_date: z.string().min(1, 'Tanggal mulai wajib diisi'),
  end_date: z.string().min(1, 'Tanggal selesai wajib diisi'),
  duration_hours: z.number().optional(),
  certificate_url: z.string().optional(),
  description: z.string().optional(),
});

// GET - Fetch training records
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

    const trainingRecords = await prisma.trainingRecord.findMany({
      where: { profile_id: profile.id },
      orderBy: { start_date: 'desc' }
    });

    return NextResponse.json(trainingRecords);
  } catch (error) {
    console.error('Error fetching training records:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

// POST - Create new training record
export async function POST(request: NextRequest) {
  try {
    const session = await auth();
    
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const body = await request.json();
    const validatedData = trainingRecordSchema.parse(body);

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

    const trainingRecord = await prisma.trainingRecord.create({
      data: {
        profile_id: profile.id,
        training_name: validatedData.training_name,
        category: validatedData.category,
        organizer: validatedData.organizer,
        start_date: new Date(validatedData.start_date),
        end_date: new Date(validatedData.end_date),
        duration_hours: validatedData.duration_hours,
        certificate_url: validatedData.certificate_url,
        description: validatedData.description,
      }
    });

    return NextResponse.json(trainingRecord, { status: 201 });
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json({ error: 'Validation error', details: error.issues }, { status: 400 });
    }
    
    console.error('Error creating training record:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}