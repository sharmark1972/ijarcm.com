import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth/next'
import { authOptions } from '@/lib/auth'
import { PrismaClient } from '@prisma/client'
import * as ftp from 'basic-ftp'
import archiver from 'archiver'
import { Readable } from 'stream'
import { exec } from 'child_process'
import { promisify } from 'util'
import fs from 'fs'
import path from 'path'
import { decrypt } from '@/lib/encryption'

export const dynamic = 'force-dynamic';

const prisma = new PrismaClient()
const execAsync = promisify(exec)

export async function POST(request: NextRequest) {
  const startTime = Date.now()
  let deploymentLog: any = null

  try {
    const session = await getServerSession(authOptions)
    if (!session || session.user.role !== 'ADMIN') {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const body = await request.json()
    const { createBackup = true, runMigrations = false } = body

    // Get FTP configuration
    const ftpConfig = await prisma.deploymentConfig.findFirst({
      where: { id: 'default' }
    })

    if (!ftpConfig) {
      return NextResponse.json(
        { error: 'FTP configuration not found' },
        { status: 404 }
      )
    }

    // Use FTP configuration
    const config = {
      host: ftpConfig.host,
      port: ftpConfig.port,
      username: ftpConfig.username,
      password: decrypt(ftpConfig.password),
      remotePath: ftpConfig.remotePath
    }
    
    // Create deployment log
    deploymentLog = await prisma.deploymentLog.create({
      data: {
        type: 'deploy',
        status: 'IN_PROGRESS',
        message: 'Starting deployment...',
        details: {},
      },
    })

    // Build the project
    await updateDeploymentStatus(deploymentLog.id, 'IN_PROGRESS', 'Building project...')
    try {
      await execAsync('npm run build', { cwd: process.cwd() })
    } catch (buildError) {
      throw new Error(`Build failed: ${buildError.message}`)
    }

    // Run database migrations if requested
    if (runMigrations) {
      await updateDeploymentStatus(deploymentLog.id, 'IN_PROGRESS', 'Running database migrations...')
      try {
        await execAsync('npx prisma migrate deploy', { cwd: process.cwd() })
      } catch (migrationError) {
        console.warn('Migration warning:', migrationError.message)
        // Don't fail deployment for migration warnings
      }
    }

    // Create FTP client
    const client = new ftp.Client()
    client.ftp.verbose = true
    // Set timeout using available method
    if (client.ftp.socket) {
      client.ftp.socket.setTimeout(10000)
    }

    await updateDeploymentStatus(deploymentLog.id, 'IN_PROGRESS', 'Connecting to FTP server...')
    
    await client.access({
      host: config.host,
      port: config.port || 21,
      user: config.username,
      password: config.password
    })

    let backupPath: string | null = null
    
    // Create backup if requested
    if (createBackup) {
      await updateDeploymentStatus(deploymentLog.id, 'IN_PROGRESS', 'Creating backup...')
      
      const backupDir = `backup_${new Date().toISOString().replace(/[:.]/g, '-')}`
      backupPath = `${config.remotePath}/backups/${backupDir}`
      
      try {
        await client.ensureDir(`${config.remotePath}/backups`)
        await client.ensureDir(backupPath)
        
        // Copy current files to backup
        const files = await client.list(config.remotePath)
        for (const file of files) {
          if (file.name !== 'backups' && file.type === 1) { // file type
            await client.downloadTo(
              `./temp_backup/${file.name}`,
              `${config.remotePath}/${file.name}`
            )
            await client.uploadFrom(
              `./temp_backup/${file.name}`,
              `${backupPath}/${file.name}`
            )
          }
        }
      } catch (backupError) {
        console.warn('Backup creation failed:', backupError.message)
        backupPath = null
        // Continue with deployment even if backup fails
      }
    }

    // Upload build files
    await updateDeploymentStatus(deploymentLog.id, 'IN_PROGRESS', 'Uploading files...')
    
    const buildPath = path.join(process.cwd(), '.next')
    const publicPath = path.join(process.cwd(), 'public')
    
    let uploadedFiles = 0
    
    // Upload .next build files
    if (fs.existsSync(buildPath)) {
      await uploadDirectory(client, buildPath, `${config.remotePath}/.next`)
      uploadedFiles += await countFiles(buildPath)
    }
    
    // Upload public files
    if (fs.existsSync(publicPath)) {
      await uploadDirectory(client, publicPath, `${config.remotePath}/public`)
      uploadedFiles += await countFiles(publicPath)
    }
    
    // Upload package.json and other necessary files
    const essentialFiles = ['package.json', 'next.config.js', 'next.config.mjs']
    for (const file of essentialFiles) {
      const filePath = path.join(process.cwd(), file)
      if (fs.existsSync(filePath)) {
        await client.uploadFrom(filePath, `${config.remotePath}/${file}`)
        uploadedFiles++
      }
    }

    await client.close()

    // Update log with success
    await prisma.deploymentLog.update({
      where: { id: deploymentLog.id },
      data: {
        status: 'COMPLETED',
        message: `Deployment completed successfully. ${uploadedFiles} files uploaded.`,
        details: {
          files_uploaded: uploadedFiles,
          backup_created: backupPath || null,
          duration: Date.now() - startTime
        }
      },
    })

    return NextResponse.json({
      success: true,
      message: 'Deployment completed successfully',
      filesUploaded: uploadedFiles,
      backupPath,
      duration: Date.now() - startTime
    })

  } catch (error: any) {
    console.error('Deployment error:', error)

    // Update log with error
    if (deploymentLog) {
      await prisma.deploymentLog.update({
        where: { id: deploymentLog.id },
        data: {
          status: 'FAILED',
          message: `Deployment failed: ${error.message}`,
          details: {
            error: error.message,
            duration: Date.now() - startTime
          }
        },
      })
    }

    return NextResponse.json(
      { error: 'Deployment failed', details: error.message },
      { status: 500 }
    )
  } finally {
    await prisma.$disconnect()
  }
}

async function updateDeploymentStatus(logId: string, status: 'PENDING' | 'IN_PROGRESS' | 'COMPLETED' | 'FAILED', message: string, details?: any) {
  try {
    const updateData: any = { status, message }
    if (details) {
      updateData.details = details
    }
    await prisma.deploymentLog.update({
      where: { id: logId },
      data: updateData,
    })
  } catch (error) {
    console.error('Failed to update deployment status:', error)
  }
}

async function uploadDirectory(client: ftp.Client, localDir: string, remoteDir: string) {
  await client.ensureDir(remoteDir)
  
  const items = fs.readdirSync(localDir, { withFileTypes: true })
  
  for (const item of items) {
    const localPath = path.join(localDir, item.name)
    const remotePath = `${remoteDir}/${item.name}`
    
    if (item.isDirectory()) {
      await uploadDirectory(client, localPath, remotePath)
    } else {
      await client.uploadFrom(localPath, remotePath)
    }
  }
}

async function countFiles(dir: string): Promise<number> {
  let count = 0
  const items = fs.readdirSync(dir, { withFileTypes: true })
  
  for (const item of items) {
    if (item.isDirectory()) {
      count += await countFiles(path.join(dir, item.name))
    } else {
      count++
    }
  }
  
  return count
}
