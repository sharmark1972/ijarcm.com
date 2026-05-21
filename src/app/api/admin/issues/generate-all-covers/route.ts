import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { prisma } from '@/lib/prisma';
import { generateIssueCover } from '@/lib/issueCoverGenerator';

export const dynamic = 'force-dynamic';

interface GenerationResult {
  issueId: string;
  volume: string;
  issueNumber: string;
  success: boolean;
  coverImage?: string;
  error?: string;
}

export async function POST() {
  try {
    const session = await getServerSession(authOptions);
    
    if (!session?.user) {
      return NextResponse.json(
        { error: 'Authentication required' },
        { status: 401 }
      );
    }

    if (session.user.role !== 'ADMIN') {
      return NextResponse.json(
        { error: 'Admin access required' },
        { status: 403 }
      );
    }

    // Get all issues without cover images
    const issues = await prisma.issue.findMany({
      where: {
        OR: [
          { coverImage: null },
          { coverImage: '' },
        ],
      },
      include: {
        _count: {
          select: { papers: true },
        },
      },
    });

    if (issues.length === 0) {
      return NextResponse.json({
        success: true,
        message: 'All issues already have cover images',
        generated: 0,
      });
    }

    // Generate covers for all issues
    const results: GenerationResult[] = [];
    for (const issue of issues) {
      try {
        const coverImagePath = await generateIssueCover({
          volume: issue.volume,
          issueNumber: issue.issueNumber,
          year: issue.year,
          title: issue.title,
          paperCount: issue._count.papers,
        });

        // Update issue with new cover
        await prisma.issue.update({
          where: { id: issue.id },
          data: {
            coverImage: coverImagePath,
          },
        });

        results.push({
          issueId: issue.id,
          volume: issue.volume,
          issueNumber: issue.issueNumber,
          success: true,
          coverImage: coverImagePath,
        });
      } catch (error) {
        console.error(`Error generating cover for issue ${issue.id}:`, error);
        results.push({
          issueId: issue.id,
          volume: issue.volume,
          issueNumber: issue.issueNumber,
          success: false,
          error: error instanceof Error ? error.message : 'Unknown error',
        });
      }
    }

    const successCount = results.filter(r => r.success).length;
    const failureCount = results.filter(r => !r.success).length;

    return NextResponse.json({
      success: true,
      message: `Generated ${successCount} covers successfully. ${failureCount} failed.`,
      total: issues.length,
      generated: successCount,
      failed: failureCount,
      results,
    });
  } catch (error) {
    console.error('Error generating all covers:', error);
    return NextResponse.json(
      { error: 'Failed to generate covers' },
      { status: 500 }
    );
  }
}
