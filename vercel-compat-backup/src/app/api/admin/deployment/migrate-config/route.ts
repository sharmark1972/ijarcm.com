import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth/next'
import { authOptions } from '@/lib/auth'
import { encrypt, decrypt } from '@/lib/encryption'
import { PrismaClient } from '@prisma/client'

const prisma = new PrismaClient()

export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions)
    if (!session || session.user.role !== 'ADMIN') {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    // Get existing config
    const config = await prisma.deploymentConfig.findFirst({
      where: { id: 'default' }
    })

    if (!config) {
      return NextResponse.json({ error: 'No config found to migrate' }, { status: 404 })
    }

    // Decrypt the password using the old method and re-encrypt with new method
    const decryptedPassword = decrypt(config.password)
    
    if (!decryptedPassword) {
      return NextResponse.json({ error: 'Failed to decrypt existing password' }, { status: 400 })
    }

    // Re-encrypt with new method
    const newEncryptedPassword = encrypt(decryptedPassword)
    
    // Update port if it's 25 (SMTP) to 21 (FTP)
    const newPort = config.port === 25 ? 21 : config.port
    
    // Update the config
    await prisma.deploymentConfig.update({
      where: { id: 'default' },
      data: {
        password: newEncryptedPassword,
        port: newPort,
        updatedAt: new Date()
      }
    })

    return NextResponse.json({ 
      success: true, 
      message: 'Configuration migrated successfully',
      changes: {
        passwordReEncrypted: true,
        portUpdated: config.port !== newPort ? `${config.port} → ${newPort}` : false
      }
    })
  } catch (error) {
    console.error('Error migrating deployment config:', error)
    return NextResponse.json(
      { error: 'Failed to migrate deployment config' },
      { status: 500 }
    )
  } finally {
    await prisma.$disconnect()
  }
}