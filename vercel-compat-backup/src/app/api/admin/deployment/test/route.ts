import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { Client } from 'basic-ftp';

export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    
    if (!session || session.user?.role !== 'ADMIN') {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { host, username, password, port, remotePath } = await request.json();

    if (!host || !username || !password) {
      return NextResponse.json({ error: 'Missing required fields' }, { status: 400 });
    }

    const client = new Client();
    client.ftp.verbose = false;

    try {
      // Connect to FTP server
      await client.access({
        host,
        user: username,
        password,
        port: port || 21
      });

      // Set timeout after connection
      if (client.ftp.socket) {
        client.ftp.socket.setTimeout(10000);
      }

      // Test if remote path exists and is accessible
      if (remotePath) {
        try {
          await client.cd(remotePath);
        } catch (error) {
          // Try to create the directory if it doesn't exist
          try {
            await client.ensureDir(remotePath);
          } catch (createError) {
            return NextResponse.json({ 
              error: `Remote path '${remotePath}' is not accessible and cannot be created` 
            }, { status: 400 });
          }
        }
      }

      // Get server info
      const workingDir = await client.pwd();
      
      await client.close();

      return NextResponse.json({ 
        success: true, 
        message: 'FTP connection successful',
        workingDir
      });
    } catch (error) {
      await client.close();
      
      let errorMessage = 'Connection failed';
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
      
      return NextResponse.json({ error: errorMessage }, { status: 400 });
    }
  } catch (error) {
    console.error('Error testing FTP connection:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}