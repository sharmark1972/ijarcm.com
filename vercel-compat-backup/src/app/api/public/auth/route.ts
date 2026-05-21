import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { z } from 'zod';
import { randomBytes } from 'crypto';

// Schema for API key generation
const createApiKeySchema = z.object({
  name: z.string().min(1, 'Name is required'),
  description: z.string().optional(),
  rateLimit: z.number().min(1).max(1000).default(100), // Custom rate limit per key
  allowedOrigins: z.array(z.string().url()).optional().default([]),
});

// Generate a secure API key
function generateApiKey(): string {
  const bytes = randomBytes(32);
  return `ijarcm_${bytes.toString('hex')}`;
}

// POST: Generate a new API key (admin only)
export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    
    if (!session?.user || session.user.role !== 'ADMIN') {
      return NextResponse.json(
        { error: 'Admin access required' },
        { status: 403 }
      );
    }

    const body = await request.json();
    const validatedData = createApiKeySchema.parse(body);
    const { name, description, rateLimit, allowedOrigins } = validatedData;

    // Generate API key
    const apiKey = generateApiKey();
    
    // Create API key record (for now, we'll use a simple approach)
    // TODO: Store in database when we add API keys table to schema
    const newApiKey = {
      id: `key_${Date.now()}`,
      name,
      description,
      apiKey,
      rateLimit,
      allowedOrigins,
      createdAt: new Date(),
      createdBy: session.user.id,
      isActive: true,
      lastUsed: null,
      usageCount: 0
    };
    
    return NextResponse.json({
      success: true,
      data: {
        id: newApiKey.id,
        name: newApiKey.name,
        description: newApiKey.description,
        apiKey: newApiKey.apiKey, // Only show this once
        rateLimit: newApiKey.rateLimit,
        allowedOrigins: newApiKey.allowedOrigins,
        createdAt: newApiKey.createdAt,
        isActive: newApiKey.isActive
      },
      message: 'API key created successfully. Save this key securely as it won\'t be shown again.'
    });

  } catch (error) {
    console.error('API key generation error:', error);
    
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { 
          success: false,
          error: 'Invalid input data', 
          details: error.errors 
        },
        { status: 400 }
      );
    }

    return NextResponse.json(
      { 
        success: false,
        error: 'Failed to create API key' 
      },
      { status: 500 }
    );
  }
}

// GET: Validate an API key
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const apiKey = searchParams.get('apiKey');

    if (!apiKey) {
      return NextResponse.json(
        { 
          success: false,
          error: 'API key is required' 
        },
        { status: 400 }
      );
    }

    // Check if it follows our format
    const isValidFormat = apiKey.startsWith('ijarcm_') && apiKey.length === 73; // ijarcm_ + 64 hex chars
    
    // Mock validation - in production, check against database
    const isValid = isValidFormat; // This would be a database lookup

    return NextResponse.json({
      success: true,
      data: {
        isValid,
        apiKey: apiKey.substring(0, 12) + '...' // Only return partial key for security
      }
    });

  } catch (error) {
    console.error('API key validation error:', error);
    
    return NextResponse.json(
      { 
        success: false,
        error: 'Failed to validate API key' 
      },
      { status: 500 }
    );
  }
}