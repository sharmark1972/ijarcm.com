import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth/next'
import { authOptions } from '@/lib/auth'
import { encrypt, decrypt } from '@/lib/encryption'
import { PrismaClient } from '@prisma/client'

const prisma = new PrismaClient()

export async function GET() {
  try {
    const session = await getServerSession(authOptions)
    if (!session || session.user.role !== 'ADMIN') {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const config = await prisma.deploymentConfig.findFirst()

    if (!config) {
      return NextResponse.json({ config: null })
    }

    // Decrypt sensitive data
    const decryptedConfig = {
      ...config,
      password: config.password ? decrypt(config.password) : '',
    }

    return NextResponse.json({ config: decryptedConfig })
  } catch (error) {
    console.error('Error fetching deployment config:', error)
    return NextResponse.json(
      { error: 'Failed to fetch deployment config' },
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
    const { host, port, username, password, remotePath } = body

    // Encrypt sensitive data
    const encryptedPassword = password ? encrypt(password) : ''

    const configData = {
      host,
      port: parseInt(port),
      username,
      password: encryptedPassword,
      remotePath,
      updatedAt: new Date(),
    }

    const config = await prisma.deploymentConfig.upsert({
      where: { id: 'default' },
      update: configData,
      create: { id: 'default', ...configData },
    })

    return NextResponse.json({ success: true, config })
  } catch (error) {
    console.error('Error saving deployment config:', error)
    return NextResponse.json(
      { error: 'Failed to save deployment config' },
      { status: 500 }
    )
  } finally {
    await prisma.$disconnect()
  }
}