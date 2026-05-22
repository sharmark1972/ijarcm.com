import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { uploadToR2 } from '@/lib/r2-upload';

export const dynamic = 'force-dynamic';

export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user || session.user.role !== 'ADMIN') {
      return NextResponse.json(
        { error: 'Admin access required' },
        { status: 403 }
      );
    }

    const formData = await request.formData();
    const file = formData.get('file') as File;
    const type = formData.get('type') as string;

    if (!file) {
      return NextResponse.json(
        { error: 'No file provided' },
        { status: 400 }
      );
    }

    // Determine folder based on type
    let folder: string;

    if (type === 'resume') {
      folder = 'resumes';
    } else if (type === 'image') {
      folder = 'images';
    } else {
      return NextResponse.json(
        { error: 'Invalid upload type. Must be "resume" or "image"' },
        { status: 400 }
      );
    }

    // Validate file type
    if (type === 'image') {
      const allowedTypes = ['image/jpeg', 'image/jpg', 'image/png', 'image/gif', 'image/webp'];
      if (!allowedTypes.includes(file.type)) {
        return NextResponse.json(
          { error: 'Invalid image format. Allowed formats: JPEG, PNG, GIF, WebP' },
          { status: 400 }
        );
      }
    } else if (type === 'resume') {
      if (file.type !== 'application/pdf') {
        return NextResponse.json(
          { error: 'Only PDF files are allowed for resumes' },
          { status: 400 }
        );
      }
    }

    // Upload to R2
    const bytes = await file.arrayBuffer();
    const buffer = Buffer.from(bytes);
    const url = await uploadToR2(buffer, file.name, folder);

    return NextResponse.json({
      success: true,
      url,
      message: 'File uploaded successfully'
    });
  } catch (error) {
    console.error('File upload error:', error);
    return NextResponse.json(
      { error: 'Failed to upload file' },
      { status: 500 }
    );
  }
}
