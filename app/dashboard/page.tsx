'use client';

import { useEffect, useState, Suspense } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { useSession } from 'next-auth/react';
import { User, BookOpen, FileText, Shield, CheckCircle, X, Loader2 } from 'lucide-react';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';

interface UserRole {
  role: string;
  name: string;
  email: string;
}

function DashboardContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const { data: session, status } = useSession();
  const [userRole, setUserRole] = useState<UserRole | null>(null);
  const [loading, setLoading] = useState(true);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);

  // Check for success messages from URL parameters
  useEffect(() => {
    const submitted = searchParams.get('submitted');
    const drafted = searchParams.get('drafted');
    
    if (submitted === 'true') {
      setSuccessMessage('Paper submitted successfully!');
    } else if (drafted === 'true') {
      setSuccessMessage('Paper saved as draft successfully!');
    }
  }, [searchParams]);

  useEffect(() => {
    if (status === 'loading') return;
    
    if (!session) {
      router.push('/auth/login');
      return;
    }

    // Get user role and redirect accordingly
    const fetchUserRole = async () => {
      try {
        const response = await fetch('/api/auth/user');
        if (response.ok) {
          const userData = await response.json();
          setUserRole(userData);
          
          // Redirect based on role
          switch (userData.role?.toLowerCase()) {
            case 'student':
              router.push('/dashboard/student');
              break;
            case 'author':
              router.push('/dashboard/author');
              break;
            case 'reviewer':
              router.push('/dashboard/reviewer');
              break;
            case 'admin':
              router.push('/admin');
              break;
            default:
              // If no specific role, show dashboard selection
              setLoading(false);
          }
        } else {
          setLoading(false);
        }
      } catch (error) {
        console.error('Error fetching user role:', error);
        setLoading(false);
      }
    };

    fetchUserRole();
  }, [session, status, router]);

  if (loading) {
    return (
      <div className="min-h-[60vh] flex items-center justify-center">
        <div className="text-center">
          <Loader2 className="h-10 w-10 animate-spin text-slate-400 mx-auto" />
          <p className="mt-4 text-slate-600">Loading dashboard...</p>
        </div>
      </div>
    );
  }

  // If user has no specific role, show dashboard selection
  return (
    <div className="min-h-[80vh] py-12 bg-slate-50">
      <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Success Message */}
        {successMessage && (
          <Alert className="mb-8 bg-green-50 border-green-200 text-green-900">
            <CheckCircle className="h-4 w-4 text-green-600" />
            <AlertTitle>Success</AlertTitle>
            <AlertDescription className="flex justify-between items-center">
              {successMessage}
              <button
                onClick={() => setSuccessMessage(null)}
                className="text-green-600 hover:text-green-800"
              >
                <X className="h-4 w-4" />
              </button>
            </AlertDescription>
          </Alert>
        )}
        
        <div className="text-center mb-12">
          <h1 className="text-3xl font-serif font-bold text-slate-900 mb-4">Welcome to Your Dashboard</h1>
          <p className="text-lg text-slate-600">Select your role to access the appropriate dashboard</p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {/* Student Dashboard */}
          <Card 
            onClick={() => router.push('/dashboard/student')}
            className="cursor-pointer hover:shadow-lg transition-all duration-200 border-slate-200 hover:border-blue-500 group"
          >
            <CardHeader>
              <div className="flex items-center justify-center w-12 h-12 bg-blue-100 rounded-lg mb-4 group-hover:bg-blue-600 transition-colors">
                <User className="h-6 w-6 text-blue-600 group-hover:text-white" />
              </div>
              <CardTitle>Student Dashboard</CardTitle>
              <CardDescription>Access your courses, assignments, and academic progress</CardDescription>
            </CardHeader>
          </Card>

          {/* Author Dashboard */}
          <Card 
            onClick={() => router.push('/dashboard/author')}
            className="cursor-pointer hover:shadow-lg transition-all duration-200 border-slate-200 hover:border-green-500 group"
          >
            <CardHeader>
              <div className="flex items-center justify-center w-12 h-12 bg-green-100 rounded-lg mb-4 group-hover:bg-green-600 transition-colors">
                <FileText className="h-6 w-6 text-green-600 group-hover:text-white" />
              </div>
              <CardTitle>Author Dashboard</CardTitle>
              <CardDescription>Manage your publications, submissions, and writing projects</CardDescription>
            </CardHeader>
          </Card>

          {/* Reviewer Dashboard */}
          <Card 
            onClick={() => router.push('/dashboard/reviewer')}
            className="cursor-pointer hover:shadow-lg transition-all duration-200 border-slate-200 hover:border-purple-500 group"
          >
            <CardHeader>
              <div className="flex items-center justify-center w-12 h-12 bg-purple-100 rounded-lg mb-4 group-hover:bg-purple-600 transition-colors">
                <BookOpen className="h-6 w-6 text-purple-600 group-hover:text-white" />
              </div>
              <CardTitle>Reviewer Dashboard</CardTitle>
              <CardDescription>Review submissions, provide feedback, and manage reviews</CardDescription>
            </CardHeader>
          </Card>

          {/* Admin Dashboard */}
          {session?.user?.email && (
            <Card 
              onClick={() => router.push('/admin')}
              className="cursor-pointer hover:shadow-lg transition-all duration-200 border-slate-200 hover:border-red-500 group"
            >
              <CardHeader>
                <div className="flex items-center justify-center w-12 h-12 bg-red-100 rounded-lg mb-4 group-hover:bg-red-600 transition-colors">
                  <Shield className="h-6 w-6 text-red-600 group-hover:text-white" />
                </div>
                <CardTitle>Admin Dashboard</CardTitle>
                <CardDescription>Manage users, content, and system settings</CardDescription>
              </CardHeader>
            </Card>
          )}
        </div>

        {userRole && (
          <div className="mt-12 text-center">
            <div className="inline-block px-4 py-2 bg-white rounded-full border border-slate-200 shadow-sm">
              <p className="text-slate-600 text-sm">
                Logged in as: <span className="font-semibold text-slate-900">{userRole.name}</span> <span className="text-slate-400">|</span> <span className="capitalize">{userRole.role}</span>
              </p>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

export default function MainDashboard() {
  return (
    <Suspense fallback={
      <div className="min-h-[60vh] flex items-center justify-center">
        <div className="text-center">
          <Loader2 className="h-10 w-10 animate-spin text-slate-400 mx-auto" />
          <p className="mt-4 text-slate-600">Loading dashboard...</p>
        </div>
      </div>
    }>
      <DashboardContent />
    </Suspense>
  );
}