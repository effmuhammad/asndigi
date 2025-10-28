import { NextRequest, NextResponse } from 'next/server';
import { auth } from '../../../../../../auth';
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

// PUT - Update SK record
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
    const validatedData = skHistorySchema.parse(body);

    // Verify ownership
    const profile = await prisma.profile.findUnique({
      where: { user_id: session.user.id },
    });

    if (!profile) {
      return NextResponse.json({ error: 'Profile not found' }, { status: 404 });
    }

    const skRecord = await prisma.skHistory.findFirst({
      where: {
        id,
        profile_id: profile.id,
      }
    });

    if (!skRecord) {
      return NextResponse.json({ error: 'SK record not found' }, { status: 404 });
    }

    const updatedRecord = await prisma.skHistory.update({
      where: { id },
      data: {
        sk_number: validatedData.sk_number,
        sk_type: validatedData.sk_type,
        position: validatedData.position,
        unit: validatedData.unit,
        effective_date: new Date(validatedData.effective_date),
        file_url: validatedData.file_url,
        description: validatedData.description,
      }
    });

    return NextResponse.json(updatedRecord);
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json({ error: 'Validation error', details: error.issues }, { status: 400 });
    }
    
    console.error('Error updating SK record:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

// DELETE - Delete SK record
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

    // Get user profile
    const profile = await prisma.profile.findUnique({
      where: { user_id: session.user.id }
    });

    if (!profile) {
      return NextResponse.json({ error: 'Profile not found' }, { status: 404 });
    }

    // Check if SK record exists and belongs to user
    const existingSK = await prisma.skHistory.findFirst({
      where: {
        id,
        profile_id: profile.id,
      }
    });

    if (!existingSK) {
      return NextResponse.json({ error: 'SK record not found' }, { status: 404 });
    }

    await prisma.skHistory.delete({
      where: { id }
    });

    return NextResponse.json({ message: 'SK record deleted successfully' });
  } catch (error) {
    console.error('Error deleting SK record:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}