'use client';

import { useState, useEffect } from 'react';
import { useSession } from 'next-auth/react';
import { useRouter } from 'next/navigation';
import { 
  Upload, 
  Server, 
  Shield, 
  Clock, 
  CheckCircle, 
  XCircle, 
  AlertTriangle,
  Eye,
  EyeOff,
  Download,
  RefreshCw
} from 'lucide-react';
import { toast } from 'sonner';

interface FTPConfig {
  host: string;
  username: string;
  password: string;
  remotePath: string;
  port: number;
}

interface DeploymentLog {
  id: string;
  createdAt: string;
  status: 'completed' | 'failed' | 'in_progress' | 'started';
  message: string;
  action: string;
  duration?: string;
  details?: any;
}

export default function DeploymentPage() {
  const { data: session, status } = useSession();
  const router = useRouter();
  const [ftpConfig, setFtpConfig] = useState<FTPConfig>({
    host: '',
    username: '',
    password: '',
    remotePath: '/public_html',
    port: 21
  });
  const [hasValidConfig, setHasValidConfig] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [isDeploying, setIsDeploying] = useState(false);
  const [deploymentLogs, setDeploymentLogs] = useState<DeploymentLog[]>([]);
  const [deploymentProgress, setDeploymentProgress] = useState(0);
  const [currentStep, setCurrentStep] = useState('');

  useEffect(() => {
    if (status === 'loading') return;
    if (!session || session.user?.role !== 'ADMIN') {
      router.push('/admin/login');
      return;
    }
    loadFTPConfig();
    loadDeploymentLogs();
  }, [session, status, router]);

  const loadFTPConfig = async () => {
    try {
      const response = await fetch('/api/admin/deployment/config');
      if (response.ok) {
        const data = await response.json();
        if (data.config) {
          const { config } = data;
          setFtpConfig(prev => ({ 
            ...prev, 
            host: config.host || '',
            username: config.username || '',
            remotePath: config.remotePath || '/public_html',
            port: config.port || 21,
            password: '' // Don't show password for security
          }));
          // Check if we have valid config (all required fields exist in DB)
          setHasValidConfig(!!(config.host && config.username && config.password));
        } else {
          setHasValidConfig(false);
        }
      }
    } catch (error) {
      console.error('Failed to load FTP config:', error);
      setHasValidConfig(false);
    }
  };

  const loadDeploymentLogs = async () => {
    try {
      const response = await fetch('/api/admin/deployment/logs');
      if (response.ok) {
        const data = await response.json();
        setDeploymentLogs(data.logs || []);
      }
    } catch (error) {
      console.error('Failed to load deployment logs:', error);
    }
  };

  const saveFTPConfig = async () => {
    try {
      const response = await fetch('/api/admin/deployment/config', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(ftpConfig)
      });

      if (response.ok) {
        toast.success('FTP configuration saved successfully');
        // Update hasValidConfig state after successful save
        if (ftpConfig.host && ftpConfig.username && ftpConfig.password) {
          setHasValidConfig(true);
          // Clear password field for security after saving
          setFtpConfig(prev => ({ ...prev, password: '' }));
        }
      } else {
        throw new Error('Failed to save configuration');
      }
    } catch (error) {
      toast.error('Failed to save FTP configuration');
      console.error('Save config error:', error);
    }
  };

  const testFTPConnection = async () => {
    try {
      setCurrentStep('Testing FTP connection...');
      const response = await fetch('/api/admin/deployment/test', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(ftpConfig)
      });

      const result = await response.json();
      if (response.ok) {
        toast.success('FTP connection successful!');
      } else {
        toast.error(`Connection failed: ${result.error}`);
      }
    } catch (error) {
      toast.error('Failed to test FTP connection');
      console.error('Test connection error:', error);
    } finally {
      setCurrentStep('');
    }
  };

  const deployToProduction = async () => {
    if (!hasValidConfig) {
      toast.error('Please configure FTP settings first');
      return;
    }

    setIsDeploying(true);
    setDeploymentProgress(0);
    setCurrentStep('Preparing deployment...');

    try {
      // Start deployment
      const response = await fetch('/api/admin/deployment', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          createBackup: true,
          runMigrations: true
        })
      });

      const result = await response.json();

      if (!response.ok) {
        throw new Error(result.details || result.error || 'Deployment failed');
      }

      toast.success(`Deployment completed successfully! ${result.filesUploaded} files uploaded.`);
      loadDeploymentLogs();
    } catch (error) {
      toast.error(`Deployment failed: ${error instanceof Error ? error.message : 'Unknown error'}`);
      console.error('Deployment error:', error);
    } finally {
      setIsDeploying(false);
      setDeploymentProgress(0);
      setCurrentStep('');
    }
  };

  const createBackup = async () => {
    if (!hasValidConfig) {
      toast.error('Please configure FTP settings first');
      return;
    }

    try {
      setCurrentStep('Creating backup...');
      
      // Get the current config from database (with decrypted password)
      const configResponse = await fetch('/api/admin/deployment/config');
      if (!configResponse.ok) {
        throw new Error('Failed to load FTP configuration');
      }
      
      const { config } = await configResponse.json();
      if (!config) {
        throw new Error('No FTP configuration found');
      }

      const response = await fetch('/api/admin/deployment/backup', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(config)
      });

      if (response.ok) {
        const blob = await response.blob();
        const url = window.URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = `backup-${new Date().toISOString().split('T')[0]}.zip`;
        document.body.appendChild(a);
        a.click();
        window.URL.revokeObjectURL(url);
        document.body.removeChild(a);
        toast.success('Backup created successfully!');
      } else {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Backup failed');
      }
    } catch (error) {
      toast.error(`Failed to create backup: ${error instanceof Error ? error.message : 'Unknown error'}`);
      console.error('Backup error:', error);
    } finally {
      setCurrentStep('');
    }
  };

  if (status === 'loading') {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <RefreshCw className="h-8 w-8 animate-spin text-pink-600" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
        <div className="flex items-center space-x-3">
          <Server className="h-8 w-8 text-pink-600" />
          <div>
            <h1 className="text-2xl font-bold text-gray-900">Production Deployment</h1>
            <p className="text-gray-600">Deploy your application to production server via FTP</p>
          </div>
        </div>
      </div>

      {/* FTP Configuration */}
      <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center space-x-2">
            <Shield className="h-5 w-5 text-pink-600" />
            <h2 className="text-lg font-semibold text-gray-900">FTP Configuration</h2>
          </div>
          {hasValidConfig && (
            <div className="flex items-center space-x-2 text-sm text-green-600">
              <CheckCircle className="h-4 w-4" />
              <span>Configuration loaded from database</span>
            </div>
          )}
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">Host</label>
            <input
              type="text"
              value={ftpConfig.host}
              onChange={(e) => setFtpConfig(prev => ({ ...prev, host: e.target.value }))}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-pink-500 focus:border-transparent"
              placeholder="ftp.yourserver.com"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">Port</label>
            <input
              type="number"
              value={ftpConfig.port}
              onChange={(e) => setFtpConfig(prev => ({ ...prev, port: parseInt(e.target.value) || 21 }))}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-pink-500 focus:border-transparent"
              placeholder="21"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">Username</label>
            <input
              type="text"
              value={ftpConfig.username}
              onChange={(e) => setFtpConfig(prev => ({ ...prev, username: e.target.value }))}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-pink-500 focus:border-transparent"
              placeholder="FTP username"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">Password</label>
            <div className="relative">
              <input
                type={showPassword ? 'text' : 'password'}
                value={ftpConfig.password}
                onChange={(e) => setFtpConfig(prev => ({ ...prev, password: e.target.value }))}
                className="w-full px-3 py-2 pr-10 border border-gray-300 rounded-md focus:ring-2 focus:ring-pink-500 focus:border-transparent"
                placeholder={hasValidConfig ? "Password saved (hidden for security)" : "FTP password"}
              />
              <button
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                className="absolute inset-y-0 right-0 pr-3 flex items-center"
              >
                {showPassword ? (
                  <EyeOff className="h-4 w-4 text-gray-400" />
                ) : (
                  <Eye className="h-4 w-4 text-gray-400" />
                )}
              </button>
            </div>
          </div>

          <div className="md:col-span-2">
            <label className="block text-sm font-medium text-gray-700 mb-2">Remote Path</label>
            <input
              type="text"
              value={ftpConfig.remotePath}
              onChange={(e) => setFtpConfig(prev => ({ ...prev, remotePath: e.target.value }))}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-pink-500 focus:border-transparent"
              placeholder="/public_html"
            />
          </div>
        </div>

        <div className="flex space-x-3 mt-6">
          <button
            onClick={saveFTPConfig}
            className="px-4 py-2 bg-gray-600 text-white rounded-md hover:bg-gray-700 transition-colors"
          >
            Save Configuration
          </button>
          <button
            onClick={testFTPConnection}
            disabled={!ftpConfig.host || !ftpConfig.username}
            className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 disabled:bg-gray-300 disabled:cursor-not-allowed transition-colors"
          >
            Test Connection
          </button>
        </div>
      </div>

      {/* Deployment Actions */}
      <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
        <div className="flex items-center space-x-2 mb-4">
          <Upload className="h-5 w-5 text-pink-600" />
          <h2 className="text-lg font-semibold text-gray-900">Deployment Actions</h2>
        </div>

        {isDeploying && (
          <div className="mb-6">
            <div className="flex items-center space-x-2 mb-2">
              <RefreshCw className="h-4 w-4 animate-spin text-pink-600" />
              <span className="text-sm font-medium text-gray-700">{currentStep}</span>
            </div>
            <div className="w-full bg-gray-200 rounded-full h-2">
              <div 
                className="bg-pink-600 h-2 rounded-full transition-all duration-300"
                style={{ width: `${deploymentProgress}%` }}
              />
            </div>
            <div className="text-xs text-gray-500 mt-1">{deploymentProgress}% complete</div>
          </div>
        )}

        <div className="flex space-x-3">
          <button
            onClick={createBackup}
            disabled={isDeploying || !hasValidConfig}
            className="flex items-center space-x-2 px-4 py-2 bg-yellow-600 text-white rounded-md hover:bg-yellow-700 disabled:bg-gray-300 disabled:cursor-not-allowed transition-colors"
          >
            <Download className="h-4 w-4" />
            <span>Create Backup</span>
          </button>
          <button
            onClick={deployToProduction}
            disabled={isDeploying || !hasValidConfig}
            className="flex items-center space-x-2 px-6 py-2 bg-pink-600 text-white rounded-md hover:bg-pink-700 disabled:bg-gray-300 disabled:cursor-not-allowed transition-colors"
          >
            <Upload className="h-4 w-4" />
            <span>{isDeploying ? 'Deploying...' : 'Deploy to Production'}</span>
          </button>
        </div>
      </div>

      {/* Deployment History */}
      <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center space-x-2">
            <Clock className="h-5 w-5 text-pink-600" />
            <h2 className="text-lg font-semibold text-gray-900">Deployment History</h2>
          </div>
          <button
            onClick={loadDeploymentLogs}
            className="p-2 text-gray-400 hover:text-gray-600 rounded-lg hover:bg-gray-100 transition-colors"
          >
            <RefreshCw className="h-4 w-4" />
          </button>
        </div>

        <div className="space-y-3">
          {deploymentLogs.length === 0 ? (
            <p className="text-gray-500 text-center py-8">No deployment history available</p>
          ) : (
            deploymentLogs.map((log) => (
              <div key={log.id} className="flex items-center space-x-3 p-3 border border-gray-200 rounded-lg">
                {log.status === 'completed' && <CheckCircle className="h-5 w-5 text-green-500" />}
                {log.status === 'failed' && <XCircle className="h-5 w-5 text-red-500" />}
                {(log.status === 'in_progress' || log.status === 'started') && <RefreshCw className="h-5 w-5 text-blue-500 animate-spin" />}
                
                <div className="flex-1">
                  <div className="flex items-center space-x-2">
                    <span className="text-sm font-medium text-gray-900">{log.message}</span>
                    {log.details?.files_uploaded && (
                      <span className="text-xs text-gray-500">({log.details.files_uploaded} files)</span>
                    )}
                  </div>
                  <div className="flex items-center space-x-4 text-xs text-gray-500">
                    <span>{new Date(log.createdAt).toLocaleString()}</span>
                    {log.duration && <span>Duration: {log.duration}</span>}
                    {log.details?.duration && <span>Duration: {Math.round(log.details.duration / 1000)}s</span>}
                  </div>
                </div>
              </div>
            ))
          )}
        </div>
      </div>
    </div>
  );
}