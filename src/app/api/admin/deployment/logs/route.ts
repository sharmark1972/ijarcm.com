import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth/next'
import { authOptions } from '@/lib/auth'
import { PrismaClient } from '@prisma/client'

export const dynamic = 'force-dynamic';

const prisma = new PrismaClient()

export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions)
    if (!session || session.user.role !== 'ADMIN') {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { searchParams } = new URL(request.url)
    const page = parseInt(searchParams.get('page') || '1')
    const limit = parseInt(searchParams.get('limit') || '10')
    const offset = (page - 1) * limit

    const logs = await prisma.deploymentLog.findMany({
      orderBy: { createdAt: 'desc' },
      skip: offset,
      take: limit,
    })

    // Format logs for display
    const formattedLogs = logs.map(log => ({
      ...log,
      createdAt: log.createdAt.toLocaleString(),
    }))

    return NextResponse.json({ logs: formattedLogs })
  } catch (error) {
    console.error('Error fetching deployment logs:', error)
    return NextResponse.json(
      { error: 'Failed to fetch deployment logs' },
      { status: 500 }
    )
  } finally {
    await prisma.$disconnect()
  }
}

export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions)
    if (!session || session.user.role !== 'ADMIN') {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const body = await request.json()
    const { action, status, message, details } = body

    const logData: any = {
      type: action,
      status,
      message,
      details: typeof details === 'object' ? details : { message: details || '' },
    }

    const log = await prisma.deploymentLog.create({
      data: logData,
    })

    return NextResponse.json({ success: true, log })
  } catch (error) {
    console.error('Error creating deployment log:', error)
    return NextResponse.json(
      { error: 'Failed to create deployment log' },
      { status: 500 }
    )
  } finally {
    await prisma.$disconnect()
  }
}
