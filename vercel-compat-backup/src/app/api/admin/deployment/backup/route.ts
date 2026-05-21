import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { Client } from 'basic-ftp';
import { PrismaClient } from '@prisma/client';
import archiver from 'archiver';
import { Readable } from 'stream';
import path from 'path';
import fs from 'fs';
import os from 'os';
import { decrypt } from '@/lib/encryption';

const prisma = new PrismaClient();

export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    
    if (!session || session.user?.role !== 'ADMIN') {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { host, username, password, port, remotePath } = await request.json();

    if (!host || !username || !password) {
      return NextResponse.json({ error: 'Missing FTP credentials' }, { status: 400 });
    }

    const client = new Client();
    client.ftp.verbose = false;

    try {
      // Connect to FTP server
      await client.access({
        host,
        user: username,
        password,
        port: port || 21,
        secure: false
      });

      // Navigate to remote path
      if (remotePath) {
        await client.cd(remotePath);
      }

      // Create temporary directory for backup
      const tempDir = path.join(os.tmpdir(), `backup-${Date.now()}`);
      fs.mkdirSync(tempDir, { recursive: true });

      try {
        // Download all files from remote server
        await client.downloadToDir(tempDir, '.');
        
        await client.close();

        // Create ZIP archive
        const archive = archiver('zip', {
          zlib: { level: 9 } // Maximum compression
        });

        // Create readable stream for the response
        const chunks: Buffer[] = [];
        
        archive.on('data', (chunk) => {
          chunks.push(chunk);
        });

        archive.on('error', (err) => {
          throw err;
        });

        // Add files to archive
        archive.directory(tempDir, false);
        
        // Finalize the archive
        await archive.finalize();

        // Wait for all chunks to be collected
        await new Promise((resolve) => {
          archive.on('end', resolve);
        });

        // Clean up temporary directory
        fs.rmSync(tempDir, { recursive: true, force: true });

        // Combine all chunks
        const buffer = Buffer.concat(chunks);

        // Log backup creation
        await prisma.deploymentLog.create({
          data: {
            type: 'backup',
            status: 'COMPLETED',
            message: 'Backup created successfully'
          }
        });

        // Return ZIP file
        return new NextResponse(buffer, {
          headers: {
            'Content-Type': 'application/zip',
            'Content-Disposition': `attachment; filename="backup-${new Date().toISOString().split('T')[0]}.zip"`,
            'Content-Length': buffer.length.toString()
          }
        });

      } catch (downloadError) {
        // Clean up temporary directory if it exists
        if (fs.existsSync(tempDir)) {
          fs.rmSync(tempDir, { recursive: true, force: true });
        }
        throw downloadError;
      }

    } catch (error) {
      await client.close();
      
      let errorMessage = 'Backup failed';
      if (error instanceof Error) {
        if (error.message.includes('ENOTFOUND')) {
          errorMessage = 'Host not found';
        } else if (error.message.includes('ECONNREFUSED')) {
          errorMessage = 'Connection refused - check host and port';
        } else if (error.message.includes('530')) {
          errorMessage = 'Authentication failed - check username and password';
        } else if (error.message.includes('timeout')) {
          errorMessage = 'Connection timeout';
        } else {
          errorMessage = error.message;
        }
      }
      
      // Log backup failure
      await prisma.deploymentLog.create({
        data: {
          type: 'backup',
          status: 'FAILED',
          message: `Backup failed: ${errorMessage}`
        }
      });
      
      return NextResponse.json({ error: errorMessage }, { status: 400 });
    }
  } catch (error) {
    console.error('Error creating backup:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}