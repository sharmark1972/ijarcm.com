import { NextResponse, NextRequest } from 'next/server';
import { getServerSession } from 'next-auth';

// This will store fees configuration in memory
// In production, you should use a database
let feeConfiguration = {
  baseFee: 15000,
  perPageFee: 1000,
  plagiarismFee: 1000,
  rewritingFee: 2000,
  rapidPublicationFee: 30000,
  discountPercentage: 50
};

export async function GET() {
  try {
    return NextResponse.json({
      success: true,
      message: 'Fee configuration retrieved successfully',
      data: feeConfiguration
    });
  } catch (error) {
    console.error('Error fetching fees:', error);
    return NextResponse.json(
      {
        success: false,
        message: 'Failed to fetch fee configuration'
      },
      { status: 500 }
    );
  }
}

export async function POST(request: NextRequest) {
  try {
    // Check admin authorization
    const session = await getServerSession();

    if (!session) {
      return NextResponse.json(
        {
          success: false,
          message: 'Unauthorized: Please login'
        },
        { status: 401 }
      );
    }

    // In production, verify if user is admin
    // For now, just check if session exists

    const body = await request.json();

    // Validate input
    const {
      baseFee,
      perPageFee,
      plagiarismFee,
      rewritingFee,
      rapidPublicationFee,
      discountPercentage
    } = body;

    if (
      typeof baseFee !== 'number' ||
      typeof perPageFee !== 'number' ||
      typeof plagiarismFee !== 'number' ||
      typeof rewritingFee !== 'number' ||
      typeof rapidPublicationFee !== 'number' ||
      typeof discountPercentage !== 'number'
    ) {
      return NextResponse.json(
        {
          success: false,
          message: 'Invalid fee values: all fields must be numbers'
        },
        { status: 400 }
      );
    }

    // Validate ranges
    if (
      baseFee < 0 ||
      perPageFee < 0 ||
      plagiarismFee < 0 ||
      rewritingFee < 0 ||
      rapidPublicationFee < 0
    ) {
      return NextResponse.json(
        {
          success: false,
          message: 'Invalid fee values: fees cannot be negative'
        },
        { status: 400 }
      );
    }

    if (discountPercentage < 0 || discountPercentage > 100) {
      return NextResponse.json(
        {
          success: false,
          message: 'Invalid discount percentage: must be between 0 and 100'
        },
        { status: 400 }
      );
    }

    // Update configuration
    feeConfiguration = {
      baseFee,
      perPageFee,
      plagiarismFee,
      rewritingFee,
      rapidPublicationFee,
      discountPercentage
    };

    // In production, save to database here
    // await db.feeConfig.update({ ...feeConfiguration })

    return NextResponse.json({
      success: true,
      message: 'Fee configuration updated successfully',
      data: feeConfiguration
    });
  } catch (error) {
    console.error('Error updating fees:', error);
    return NextResponse.json(
      {
        success: false,
        message: 'Failed to update fee configuration'
      },
      { status: 500 }
    );
  }
}
