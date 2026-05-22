'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Wrench, Clock, Mail, Phone } from 'lucide-react';

export default function MaintenancePage() {
  const [accessCode, setAccessCode] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState('');
  const [maintenanceInfo, setMaintenanceInfo] = useState({
    message: 'We are currently performing scheduled maintenance. Please check back soon.',
    endTime: null as string | null
  });
  const router = useRouter();

  useEffect(() => {
    // Fetch maintenance information
    const fetchMaintenanceInfo = async () => {
      try {
        const response = await fetch('/api/maintenance/info');
        if (response.ok) {
          const data = await response.json();
          setMaintenanceInfo({
            message: data.message || 'We are currently performing scheduled maintenance. Please check back soon.',
            endTime: data.endTime
          });
        }
      } catch (error) {
        console.error('Failed to fetch maintenance info:', error);
      }
    };

    fetchMaintenanceInfo();
  }, []);

  const handleCodeSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);
    setError('');

    try {
      const response = await fetch('/api/maintenance/verify', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ code: accessCode }),
      });

      if (response.ok) {
        // Redirect to home page with bypass code
        window.location.href = `/?code=${encodeURIComponent(accessCode)}`;
      } else {
        const data = await response.json();
        setError(data.message || 'Invalid access code');
      }
    } catch (error) {
      setError('An error occurred. Please try again.');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 flex items-center justify-center p-4">
      <div className="max-w-md w-full space-y-6">
        {/* Main Maintenance Card */}
        <Card className="text-center">
          <CardHeader className="space-y-4">
            <div className="mx-auto w-16 h-16 bg-orange-100 rounded-full flex items-center justify-center">
              <Wrench className="w-8 h-8 text-orange-600" />
            </div>
            <CardTitle className="text-2xl font-bold text-gray-900">
              Site Under Maintenance
            </CardTitle>
            <CardDescription className="text-gray-600">
              {maintenanceInfo.message}
            </CardDescription>
            
            {maintenanceInfo.endTime && (
              <div className="flex items-center justify-center gap-2 text-blue-600">
                <Clock className="h-5 w-5" />
                <span>Expected completion: {new Date(maintenanceInfo.endTime).toLocaleString()}</span>
              </div>
            )}
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex items-center justify-center space-x-2 text-sm text-gray-500">
              <Clock className="w-4 h-4" />
              <span>Estimated completion: 2-4 hours</span>
            </div>
          </CardContent>
        </Card>

        {/* Access Code Card */}
        <Card>
          <CardHeader>
            <CardTitle className="text-lg">Authorized Access</CardTitle>
            <CardDescription>
              If you have an access code, enter it below to continue using the site.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleCodeSubmit} className="space-y-4">
              <div>
                <Input
                  type="text"
                  placeholder="Enter access code"
                  value={accessCode}
                  onChange={(e) => setAccessCode(e.target.value)}
                  className="w-full"
                  required
                />
              </div>
              
              {error && (
                <Alert variant="destructive">
                  <AlertDescription>{error}</AlertDescription>
                </Alert>
              )}
              
              <Button 
                type="submit" 
                className="w-full" 
                disabled={isSubmitting || !accessCode.trim()}
              >
                {isSubmitting ? 'Verifying...' : 'Access Site'}
              </Button>
            </form>
          </CardContent>
        </Card>

        {/* Contact Information */}
        <Card>
          <CardHeader>
            <CardTitle className="text-lg">Need Help?</CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            <div className="flex items-center space-x-3 text-sm">
              <Mail className="w-4 h-4 text-gray-500" />
              <span>support@ijrcam.com</span>
            </div>
            <div className="flex items-center space-x-3 text-sm">
              <Phone className="w-4 h-4 text-gray-500" />
              <span>+1 (555) 123-4567</span>
            </div>
          </CardContent>
        </Card>

        {/* Footer */}
        <div className="text-center text-sm text-gray-500">
          <p>Thank you for your patience!</p>
         158: <p className="mt-1">© 2025 IJARCM. All rights reserved.</p>
        </div>
      </div>
    </div>
  );
}