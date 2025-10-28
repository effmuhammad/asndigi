import { NextRequest, NextResponse } from 'next/server';
import { auth } from '../../../../../../auth';
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

// PUT - Update training record
export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const session = await auth();
    
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const body = await request.json();
    const validatedData = trainingRecordSchema.parse(body);

    // Verify ownership
    const profile = await prisma.profile.findUnique({
      where: { user_id: session.user.id },
    });

    if (!profile) {
      return NextResponse.json({ error: 'Profile not found' }, { status: 404 });
    }

    // Check if training record exists and belongs to user
    const existingTraining = await prisma.trainingRecord.findFirst({
      where: {
        id,
        profile_id: profile.id,
      }
    });

    if (!existingTraining) {
      return NextResponse.json({ error: 'Training record not found' }, { status: 404 });
    }

    // Update the training record
    const updatedTraining = await prisma.trainingRecord.update({
      where: { id },
      data: {
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

    return NextResponse.json(updatedTraining);
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json({ error: 'Validation error', details: error.issues }, { status: 400 });
    }
    
    console.error('Error updating training record:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

// DELETE - Delete training record
export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const session = await auth();
    
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Verify ownership
    const profile = await prisma.profile.findUnique({
      where: { user_id: session.user.id },
    });

    if (!profile) {
      return NextResponse.json({ error: 'Profile not found' }, { status: 404 });
    }

    // Check if training record exists and belongs to user
    const existingTraining = await prisma.trainingRecord.findFirst({
      where: {
        id,
        profile_id: profile.id,
      }
    });

    if (!existingTraining) {
      return NextResponse.json({ error: 'Training record not found' }, { status: 404 });
    }

    // Delete the training record
    await prisma.trainingRecord.delete({
      where: { id }
    });

    return NextResponse.json({ message: 'Training record deleted successfully' });
  } catch (error) {
    console.error('Error deleting training record:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}