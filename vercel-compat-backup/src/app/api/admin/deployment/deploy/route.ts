import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { Client } from 'basic-ftp';
import { PrismaClient } from '@prisma/client';
import fs from 'fs';
import path from 'path';
import { glob } from 'glob';
import CryptoJS from 'crypto-js';

const prisma = new PrismaClient();
const ENCRYPTION_KEY = process.env.ENCRYPTION_KEY || 'default-key-change-in-production';

// Decrypt sensitive data
function decrypt(encryptedText: string): string {
  try {
    const bytes = CryptoJS.AES.decrypt(encryptedText, ENCRYPTION_KEY);
    return bytes.toString(CryptoJS.enc.Utf8);
  } catch (error) {
    return '';
  }
}

// Get files to deploy (from .next/static and other build outputs)
function getDeploymentFiles(): string[] {
  const buildDir = path.join(process.cwd(), '.next');
  const publicDir = path.join(process.cwd(), 'public');
  
  const files: string[] = [];
  
  // Add static files from .next/static
  if (fs.existsSync(path.join(buildDir, 'static'))) {
    const staticFiles = glob.sync('**/*', { 
      cwd: path.join(buildDir, 'static'),
      nodir: true 
    });
    files.push(...staticFiles.map(f => path.join('.next/static', f)));
  }
  
  // Add public files
  if (fs.existsSync(publicDir)) {
    const publicFiles = glob.sync('**/*', { 
      cwd: publicDir,
      nodir: true 
    });
    files.push(...publicFiles.map(f => path.join('public', f)));
  }
  
  // Add server files if they exist
  const serverFiles = [
    '.next/server/app/**/*.js',
    '.next/server/pages/**/*.js',
    '.next/BUILD_ID',
    '.next/package.json'
  ];
  
  serverFiles.forEach(pattern => {
    const matches = glob.sync(pattern, { cwd: process.cwd() });
    files.push(...matches);
  });
  
  return files.filter(file => {
    const fullPath = path.join(process.cwd(), file);
    return fs.existsSync(fullPath) && fs.statSync(fullPath).isFile();
  });
}

export async function POST(request: NextRequest) {
  const encoder = new TextEncoder();
  const stream = new ReadableStream({
    async start(controller) {
      try {
        const session = await getServerSession(authOptions);
        
        if (!session || session.user?.role !== 'ADMIN') {
          controller.enqueue(encoder.encode(JSON.stringify({ error: 'Unauthorized' }) + '\n'));
          controller.close();
          return;
        }

        const deploymentConfig = await prisma.deploymentConfig.findFirst({
          where: { id: 'default' }
        });

        const { host, username, password, port, remotePath } = await request.json();

        if (!host || !username || !password) {
          controller.enqueue(encoder.encode(JSON.stringify({ error: 'Missing FTP credentials' }) + '\n'));
          controller.close();
          return;
        }

        const startTime = Date.now();
        let logId: string;

        // Create deployment log
        const deploymentLog = await prisma.deploymentLog.create({
          data: {
            type: 'deploy',
            status: 'IN_PROGRESS',
            message: 'Starting deployment...',
          },
        })
        logId = deploymentLog.id;

        const client = new Client();
        client.ftp.verbose = false;

        try {
          // Step 1: Connect to FTP
          controller.enqueue(encoder.encode(JSON.stringify({ 
            step: 'Connecting to FTP server...', 
            progress: 5 
          }) + '\n'));

          await client.access({
            host,
            user: username,
            password,
            port: port || 21,
            secure: false
          });

          // Step 2: Prepare remote directory
          controller.enqueue(encoder.encode(JSON.stringify({ 
            step: 'Preparing remote directory...', 
            progress: 10 
          }) + '\n'));

          if (remotePath) {
            await client.ensureDir(remotePath);
            await client.cd(remotePath);
          }

          // Step 3: Get files to deploy
          controller.enqueue(encoder.encode(JSON.stringify({ 
            step: 'Scanning files for deployment...', 
            progress: 15 
          }) + '\n'));

          const filesToDeploy = getDeploymentFiles();
          
          if (filesToDeploy.length === 0) {
            throw new Error('No files found to deploy. Please run build first.');
          }

          // Step 4: Upload files
          let uploadedCount = 0;
          const totalFiles = filesToDeploy.length;

          for (const file of filesToDeploy) {
            const localPath = path.join(process.cwd(), file);
            const remotePath = file.replace(/\\/g, '/'); // Convert Windows paths to Unix
            
            // Ensure remote directory exists
            const remoteDir = path.dirname(remotePath).replace(/\\/g, '/');
            if (remoteDir !== '.') {
              await client.ensureDir(remoteDir);
            }

            // Upload file
            await client.uploadFrom(localPath, remotePath);
            uploadedCount++;

            const progress = 15 + Math.floor((uploadedCount / totalFiles) * 80);
            controller.enqueue(encoder.encode(JSON.stringify({ 
              step: `Uploading files... (${uploadedCount}/${totalFiles})`, 
              progress 
            }) + '\n'));
          }

          await client.close();

          // Step 5: Complete
          const duration = Math.round((Date.now() - startTime) / 1000);
          const durationStr = `${Math.floor(duration / 60)}m ${duration % 60}s`;

          controller.enqueue(encoder.encode(JSON.stringify({ 
            step: 'Deployment completed successfully!', 
            progress: 100 
          }) + '\n'));

          // Update log entry
          await prisma.deploymentLog.update({
              where: { id: logId },
              data: {
                status: 'COMPLETED',
                message: 'Deployment completed successfully'
              }
            });

        } catch (error) {
          await client.close();
          
          const errorMessage = error instanceof Error ? error.message : 'Unknown error';
          
          controller.enqueue(encoder.encode(JSON.stringify({ 
            error: errorMessage 
          }) + '\n'));

          // Update log entry with error
          if (logId) {
            await prisma.deploymentLog.update({
              where: { id: logId },
              data: {
                status: 'FAILED',
                message: `Deployment failed: ${errorMessage}`
              }
            });
          }
        }
      } catch (error) {
        const errorMessage = error instanceof Error ? error.message : 'Unknown error';
        controller.enqueue(encoder.encode(JSON.stringify({ 
          error: errorMessage 
        }) + '\n'));
      } finally {
        controller.close();
      }
    }
  });

  return new Response(stream, {
    headers: {
      'Content-Type': 'text/plain; charset=utf-8',
      'Transfer-Encoding': 'chunked'
    }
  });
}