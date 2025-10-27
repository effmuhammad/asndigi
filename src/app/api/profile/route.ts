import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@/auth';
import { prisma } from '@/lib/prisma';
import { z } from 'zod';

// Profile validation schema
const profileSchema = z.object({
  full_name: z.string().optional(),
  birth_place: z.string().optional(),
  birth_date: z.string().optional(),
  gender: z.string().optional(),
  religion: z.string().optional(),
  marital_status: z.string().optional(),
  address: z.string().optional(),
  phone: z.string().optional(),
  emergency_contact: z.string().optional(),
  emergency_phone: z.string().optional(),
  photo_url: z.string().optional(),
  education_level: z.string().optional(),
  education_institution: z.string().optional(),
  education_major: z.string().optional(),
  education_year: z.number().optional(),
  employment_start_date: z.string().optional(),
  years_of_service: z.number().optional(),
  skills: z.array(z.string()).optional(),
});

// GET - Fetch user profile
export async function GET() {
  try {
    const session = await auth();
    
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const profile = await prisma.profile.findUnique({
      where: { user_id: session.user.id },
      include: {
        user: {
          select: {
            nip: true,
            name: true,
            email: true,
            position: true,
            work_unit: true,
            grade: true,
            employment_status: true,
          }
        },
        sk_history: {
          orderBy: { effective_date: 'desc' }
        },
        training_records: {
          orderBy: { start_date: 'desc' }
        }
      }
    });

    if (!profile) {
      // Verify user exists before creating profile
      const userExists = await prisma.user.findUnique({
        where: { id: session.user.id }
      });

      if (!userExists) {
        return NextResponse.json(
          { error: 'User not found in database' }, 
          { status: 404 }
        );
      }

      // Create empty profile if doesn't exist
      const newProfile = await prisma.profile.create({
        data: {
          user_id: session.user.id,
          skills: [],
        },
        include: {
          user: {
            select: {
              nip: true,
              name: true,
              email: true,
              position: true,
              work_unit: true,
              grade: true,
              employment_status: true,
            }
          },
          sk_history: true,
          training_records: true,
        }
      });
      
      return NextResponse.json(newProfile);
    }

    return NextResponse.json(profile);
  } catch (error) {
    console.error('Error fetching profile:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

// PUT - Update user profile
export async function PUT(request: NextRequest) {
  try {
    const session = await auth();
    
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const body = await request.json();
    const validatedData = profileSchema.parse(body);

    // Convert date strings to Date objects
    const updateData: any = { ...validatedData };
    if (validatedData.birth_date) {
      updateData.birth_date = new Date(validatedData.birth_date);
    }
    if (validatedData.employment_start_date) {
      updateData.employment_start_date = new Date(validatedData.employment_start_date);
    }

    const profile = await prisma.profile.upsert({
      where: { user_id: session.user.id },
      update: updateData,
      create: {
        user_id: session.user.id,
        ...updateData,
        skills: updateData.skills || [],
      },
      include: {
        user: {
          select: {
            nip: true,
            name: true,
            email: true,
            position: true,
            work_unit: true,
            grade: true,
            employment_status: true,
          }
        },
        sk_history: {
          orderBy: { effective_date: 'desc' }
        },
        training_records: {
          orderBy: { start_date: 'desc' }
        }
      }
    });

    return NextResponse.json(profile);
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json({ error: 'Validation error', details: error.issues }, { status: 400 });
    }
    
    console.error('Error updating profile:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}