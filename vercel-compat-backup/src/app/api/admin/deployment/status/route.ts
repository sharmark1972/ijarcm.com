import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth/next'
import { authOptions } from '@/lib/auth'
import { PrismaClient } from '@prisma/client'

const prisma = new PrismaClient()

export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions)
    if (!session || session.user.role !== 'ADMIN') {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    // Get latest deployment status
    const latestDeployment = await prisma.deploymentLog.findFirst({
      orderBy: { createdAt: 'desc' },
    })

    const status = {
      isDeploying: latestDeployment?.status === 'IN_PROGRESS',
      lastDeployment: latestDeployment ? {
        id: latestDeployment.id,
        status: latestDeployment.status,
        message: latestDeployment.message,
        createdAt: latestDeployment.createdAt,
      } : null
    }

    return NextResponse.json(status)
  } catch (error) {
    console.error('Error fetching deployment status:', error)
    return NextResponse.json(
      { error: 'Failed to fetch deployment status' },
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
    const { status, message, logId } = body

    if (logId) {
      // Update existing log entry
      const updateData: any = { status, message }

      const log = await prisma.deploymentLog.update({
        where: { id: logId },
        data: updateData,
      })

      return NextResponse.json({ success: true, log })
    } else {
      // Create new log entry
      const logData: any = {
        type: 'deploy',
        status,
        message,
        details: {},
      }

      const log = await prisma.deploymentLog.create({
        data: logData,
      })

      return NextResponse.json({ success: true, log })
    }
  } catch (error) {
    console.error('Error updating deployment status:', error)
    return NextResponse.json(
      { error: 'Failed to update deployment status' },
      { status: 500 }
    )
  } finally {
    await prisma.$disconnect()
  }
}