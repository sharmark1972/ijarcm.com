import { NextRequest, NextResponse } from 'next/server';
import bcrypt from 'bcryptjs';
import { prisma } from '@/lib/prisma';
import { UserRole } from '@prisma/client';
import { z } from 'zod';

export const dynamic = 'force-dynamic';

const registerSchema = z.object({
  email: z.string().email('Invalid email address'),
  password: z.string().min(6, 'Password must be at least 6 characters'),
  firstName: z.string().min(1, 'First name is required'),
  lastName: z.string().min(1, 'Last name is required'),
  role: z.nativeEnum(UserRole),
  institution: z.string().min(1, 'Institution is required'),
});

// Helper function to get email verification setting
async function getEmailVerificationSetting(): Promise<boolean> {
  try {
    // Get maintenance settings from database
    const maintenanceSettings = await prisma.maintenanceSettings.findFirst().catch(() => null);
    
    // Default to requiring email verification if no settings found
    // We need to check if the field exists in the database
    // If not, we'll default to true (require email verification)
    if (!maintenanceSettings) return true;
    
    // Check if requireEmailVerification field exists
    const requireEmailVerification = (maintenanceSettings as any).requireEmailVerification;
    return requireEmailVerification ?? true;
  } catch (error) {
    console.error('Error fetching email verification setting:', error);
    // Default to requiring email verification on error
    return true;
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const validatedData = registerSchema.parse(body);

    // Check if user already exists
    const existingUser = await prisma.user.findUnique({
      where: { email: validatedData.email },
    });

    if (existingUser) {
      return NextResponse.json(
        { error: 'User with this email already exists' },
        { status: 400 }
      );
    }

    // Get email verification setting
    const requireEmailVerification = await getEmailVerificationSetting();

    // Hash password
    const hashedPassword = await bcrypt.hash(validatedData.password, 10);

    // Create user
    const user = await prisma.user.create({
      data: {
        email: validatedData.email,
        passwordHash: hashedPassword,
        firstName: validatedData.firstName,
        lastName: validatedData.lastName,
        role: validatedData.role,
        institution: validatedData.institution,
        isVerified: !requireEmailVerification, // Set based on admin setting
      },
    });

    // Remove password hash from response
    const { passwordHash, ...userWithoutPassword } = user;

    const message = requireEmailVerification 
      ? 'User registered successfully. Please check your email for verification.'
      : 'User registered successfully. You can now log in to your account.';
    
    return NextResponse.json(
      {
        message,
        user: userWithoutPassword,
        requireEmailVerification,
      },
      { status: 201 }
    );
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: 'Validation failed', details: error.errors },
        { status: 400 }
      );
    }

    console.error('Registration error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
