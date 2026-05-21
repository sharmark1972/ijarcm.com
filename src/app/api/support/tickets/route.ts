import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { prisma } from '@/lib/prisma';

export const dynamic = 'force-dynamic';

// GET /api/support/tickets - Fetch user's support tickets
export async function GET() {
  try {
    const session = await getServerSession();
    
    if (!session?.user?.email) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Get user from database
    const user = await prisma.user.findUnique({
      where: { email: session.user.email },
      select: { id: true, role: true }
    });

    if (!user) {
      return NextResponse.json({ error: 'User not found' }, { status: 404 });
    }

    // Fetch tickets based on user role
    const tickets = await prisma.supportTicket.findMany({
      where: user.role === 'ADMIN' ? {} : { userId: user.id },
      include: {
        user: {
          select: {
            id: true,
            firstName: true,
            lastName: true,
            email: true
          }
        },
        replies: {
          include: {
            user: {
              select: {
                id: true,
                firstName: true,
                lastName: true,
                role: true
              }
            }
          },
          orderBy: {
            createdAt: 'asc'
          }
        },
        _count: {
          select: {
            replies: true
          }
        }
      },
      orderBy: {
        createdAt: 'desc'
      }
    });

    // Format tickets for response
    const formattedTickets = tickets.map(ticket => ({
      id: ticket.id,
      subject: ticket.subject,
      category: ticket.category,
      priority: ticket.priority,
      status: ticket.status,
      description: ticket.description,
      createdAt: ticket.createdAt.toISOString(),
      updatedAt: ticket.updatedAt.toISOString(),
      replies: ticket._count.replies,
      user: ticket.user,
      repliesData: ticket.replies.map(reply => ({
        id: reply.id,
        message: reply.message,
        createdAt: reply.createdAt.toISOString(),
        user: reply.user,
        isInternal: reply.isInternal
      }))
    }));

    return NextResponse.json({
      success: true,
      tickets: formattedTickets
    });

  } catch (error) {
    console.error('Error fetching support tickets:', error);
    return NextResponse.json(
      { error: 'Failed to fetch support tickets' },
      { status: 500 }
    );
  }
}

// POST /api/support/tickets - Create a new support ticket
export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession();
    
    if (!session?.user?.email) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Get user from database
    const user = await prisma.user.findUnique({
      where: { email: session.user.email },
      select: { id: true, firstName: true, lastName: true, email: true }
    });

    if (!user) {
      return NextResponse.json({ error: 'User not found' }, { status: 404 });
    }

    const body = await request.json();
    const { subject, category, priority, description } = body;

    // Validate required fields
    if (!subject || !category || !priority || !description) {
      return NextResponse.json(
        { error: 'Missing required fields' },
        { status: 400 }
      );
    }

    // Validate category
    const validCategories = ['technical', 'account', 'submission', 'payment', 'copyright', 'general'];
    if (!validCategories.includes(category)) {
      return NextResponse.json(
        { error: 'Invalid category' },
        { status: 400 }
      );
    }

    // Validate priority
    const validPriorities = ['low', 'medium', 'high', 'urgent'];
    if (!validPriorities.includes(priority)) {
      return NextResponse.json(
        { error: 'Invalid priority' },
        { status: 400 }
      );
    }

    // Create support ticket
    const ticket = await prisma.supportTicket.create({
      data: {
        userId: user.id,
        subject,
        category,
        priority: priority.toUpperCase() as 'LOW' | 'MEDIUM' | 'HIGH' | 'URGENT',
        description,
        status: 'OPEN',
        ticketNumber: generateTicketNumber()
      },
      include: {
        user: {
          select: {
            id: true,
            firstName: true,
            lastName: true,
            email: true
          }
        }
      }
    });

    // Create initial automated response
    await prisma.ticketReply.create({
      data: {
        ticketId: ticket.id,
        userId: user.id,
        message: 'Thank you for contacting support. Your ticket has been created and our team will respond within 24 hours.',
        isInternal: false
      }
    });

    // Send notification email (in a real implementation, you would integrate with an email service)
    if (user.email) {
      await sendNotificationEmail(user.email, ticket.ticketNumber, subject);
    }

    return NextResponse.json({
      success: true,
      ticket: {
        id: ticket.id,
        ticketNumber: ticket.ticketNumber,
        subject: ticket.subject,
        category: ticket.category,
        priority: ticket.priority,
        status: ticket.status,
        createdAt: ticket.createdAt.toISOString(),
        user: ticket.user
      }
    });

  } catch (error) {
    console.error('Error creating support ticket:', error);
    return NextResponse.json(
      { error: 'Failed to create support ticket' },
      { status: 500 }
    );
  }
}

// Generate unique ticket number
function generateTicketNumber(): string {
  const timestamp = Date.now().toString(36).toUpperCase();
  const random = Math.random().toString(36).substring(2, 8).toUpperCase();
  return `TK-${timestamp}-${random}`;
}

// Send notification email (placeholder function)
async function sendNotificationEmail(email: string, ticketNumber: string, subject: string) {
  // In a real implementation, you would integrate with an email service like SendGrid, Nodemailer, etc.
  console.log(`Sending notification email to ${email} for ticket ${ticketNumber}: ${subject}`);
  
  // Example email content:
  /*
  await sendEmail({
    to: email,
    subject: `Support Ticket Created: ${ticketNumber}`,
    template: 'support-ticket-created',
    data: {
      ticketNumber,
      subject,
      supportUrl: `${process.env.NEXT_PUBLIC_APP_URL}/support`
    }
  });
  */
}
