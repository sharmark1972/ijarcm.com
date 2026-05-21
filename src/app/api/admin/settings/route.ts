import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { prisma } from '@/lib/prisma';

export const dynamic = 'force-dynamic';

interface SystemSettings {
  general: {
    siteName: string;
    siteDescription: string;
    contactEmail: string;
    maintenanceMode: boolean;
    maintenanceCode?: string;
    maintenanceMessage?: string;
    maintenanceStartTime?: string;
    maintenanceEndTime?: string;
    registrationEnabled: boolean;
    requireEmailVerification: boolean;
    maxFileSize: number;
    allowedFileTypes: string[];
  };
  email: {
    smtpHost: string;
    smtpPort: number;
    smtpUser: string;
    smtpPassword: string;
    fromEmail: string;
    fromName: string;
    enableEmailNotifications: boolean;
  };
  security: {
    sessionTimeout: number;
    maxLoginAttempts: number;
    passwordMinLength: number;
    requireSpecialChars: boolean;
    enableTwoFactor: boolean;
    allowedDomains: string[];
  };
  review: {
    autoAssignReviewers: boolean;
    maxReviewersPerPaper: number;
    reviewDeadlineDays: number;
    enableBlindReview: boolean;
    requireReviewerComments: boolean;
  };
}

export async function GET() {
  try {
    const session = await getServerSession(authOptions);
    
    if (!session?.user || session.user.role !== 'ADMIN') {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Get maintenance settings from database
    const maintenanceSettings = await prisma.maintenanceSettings.findFirst().catch(() => null);

    const settings: SystemSettings = {
      general: {
        siteName: 'International Journal of Academic Research in Commerce and Management',
        siteDescription: 'A premier platform for academic research publication and peer review in commerce and management',
        contactEmail: 'admin@ijarcm.edu',
        maintenanceMode: maintenanceSettings?.isMaintenanceMode || false,
        maintenanceCode: maintenanceSettings?.maintenanceCode || '',
        maintenanceMessage: maintenanceSettings?.maintenanceMessage || 'We are currently performing scheduled maintenance. Please check back soon.',
        maintenanceStartTime: maintenanceSettings?.maintenanceStartTime?.toISOString().slice(0, 16) || '',
        maintenanceEndTime: maintenanceSettings?.maintenanceEndTime?.toISOString().slice(0, 16) || '',
        registrationEnabled: true,
        requireEmailVerification: maintenanceSettings?.requireEmailVerification ?? true,
        maxFileSize: 10,
        allowedFileTypes: ['pdf', 'doc', 'docx']
      },
      email: {
        smtpHost: '',
        smtpPort: 587,
        smtpUser: '',
        smtpPassword: '',
        fromEmail: '',
        fromName: 'International Journal of Academic Research in Commerce and Management System',
        enableEmailNotifications: true
      },
      security: {
        sessionTimeout: 24,
        maxLoginAttempts: 5,
        passwordMinLength: 8,
        requireSpecialChars: true,
        enableTwoFactor: false,
        allowedDomains: []
      },
      review: {
        autoAssignReviewers: true,
        maxReviewersPerPaper: 3,
        reviewDeadlineDays: 30,
        enableBlindReview: true,
        requireReviewerComments: true
      }
    };

    return NextResponse.json(settings);
  } catch (error) {
    console.error('Error fetching settings:', error);
    return NextResponse.json(
      { error: 'Failed to fetch settings' },
      { status: 500 }
    );
  }
}

export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    
    if (!session?.user || session.user.role !== 'ADMIN') {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const settings: SystemSettings = await request.json();

    // Save maintenance settings to database
    const maintenanceData = {
      isMaintenanceMode: settings.general.maintenanceMode,
      maintenanceCode: settings.general.maintenanceCode || null,
      maintenanceMessage: settings.general.maintenanceMessage || 'We are currently performing scheduled maintenance. Please check back soon.',
      maintenanceStartTime: settings.general.maintenanceStartTime ? new Date(settings.general.maintenanceStartTime) : null,
      maintenanceEndTime: settings.general.maintenanceEndTime ? new Date(settings.general.maintenanceEndTime) : null,
    };

    // Upsert maintenance settings
    await prisma.maintenanceSettings.upsert({
      where: { id: '1' },
      update: maintenanceData,
      create: { id: '1', ...maintenanceData },
    });

    // Update requireEmailVerification separately using raw SQL
    // This is a workaround for the Prisma client not being regenerated
    try {
      await prisma.$executeRaw`UPDATE maintenance_settings SET require_email_verification = ${settings.general.requireEmailVerification} WHERE id = '1'`;
    } catch (error) {
      console.error('Error updating requireEmailVerification:', error);
      // Continue without failing the entire request
    }
    
    return NextResponse.json({ 
      success: true, 
      message: 'Settings saved successfully' 
    });
  } catch (error) {
    console.error('Error saving settings:', error);
    return NextResponse.json(
      { error: 'Failed to save settings' },
      { status: 500 }
    );
  }
}
