'use client';

import { useState } from 'react';
import { signIn, getSession } from 'next-auth/react';
import { useRouter } from 'next/navigation';
import { Eye, EyeOff, Loader2 } from 'lucide-react';
import Link from 'next/link';
import DynamicSEO from '@/components/DynamicSEO';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Button } from '@/components/ui/button';
import { Alert, AlertDescription } from '@/components/ui/alert';
import type { Session } from 'next-auth';

export default function LoginPage() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');
  const router = useRouter();

  // Simplified session establishment with reduced retry logic
  const waitForSession = async (maxRetries = 5, initialDelay = 300): Promise<Session | null> => {
    let delay = initialDelay;
    
    for (let i = 0; i < maxRetries; i++) {
      console.log(`Login: Checking session, attempt ${i + 1}/${maxRetries}`);
      
      // Wait before checking session (except first attempt)
      if (i > 0) {
        await new Promise(resolve => setTimeout(resolve, delay));
      }
      
      try {
        const session = await getSession();
        
        if (session?.user) {
          // Validate session has required fields
          if (session.user.id && session.user.email && session.user.role) {
            console.log('Login: Valid session established for user:', session.user.email);
            return session;
          } else {
            console.warn('Login: Session found but missing required fields');
          }
        } else {
          console.log('Login: No session found yet');
        }
      } catch (error) {
        console.error(`Login: Error checking session on attempt ${i + 1}:`, error);
      }
      
      // Simple linear backoff
      delay = Math.min(delay * 1.2, 1000);
    }
    
    console.warn('Login: Session establishment timed out, but login may have succeeded');
    return null;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    setError('');

    try {
      console.log('Starting login process for:', email);
      
      const result = await signIn('credentials', {
        email,
        password,
        redirect: false,
      });

      console.log('SignIn result:', result);

      if (result?.error) {
        console.error('SignIn error:', result.error);
        setError('Invalid email or password');
      } else if (result?.ok) {
        console.log('Login: SignIn successful, waiting for session...');
        
        // Wait for session to be established
        await new Promise(resolve => setTimeout(resolve, 800));
        
        // Get the session with simplified retry logic
        const session = await waitForSession();
        
        // Check if user is banned (only if session exists)
        if (session?.user?.banned) {
          console.log('Login: User is banned:', session.user.bannedReason);
          setError(`Account banned: ${session.user.bannedReason || 'No reason provided'}`);
          return;
        }
        
        // Proceed with redirect if we have a valid session, or try anyway if login succeeded
        if (session?.user) {
          console.log('Login: Session established successfully, redirecting user with role:', session.user.role);
          
          // Store session metadata for persistence
          try {
            sessionStorage.setItem('login_success', 'true');
            sessionStorage.setItem('login_timestamp', Date.now().toString());
          } catch (error) {
            console.warn('Failed to store login metadata:', error);
          }
          
          // Redirect based on role
          const redirectPath = (() => {
            switch (session.user.role) {
              case 'ADMIN': return '/admin';
              case 'STUDENT': return '/student/dashboard';
              case 'REVIEWER': return '/reviewer/dashboard';
              case 'AUTHOR': return '/author/dashboard';
              default: return '/dashboard';
            }
          })();
          
          console.log('Login: Redirecting to:', redirectPath);
          router.push(redirectPath);
        } else {
          // If no session but signIn was successful, try redirecting anyway
          console.log('Login: No session immediately available, but proceeding with redirect');
          
          // Store login attempt metadata
          try {
            sessionStorage.setItem('login_success', 'true');
            sessionStorage.setItem('login_timestamp', Date.now().toString());
          } catch (error) {
            console.warn('Failed to store login metadata:', error);
          }
          
          router.push('/dashboard');
        }
      } else {
        console.error('Unexpected signIn result:', result);
        setError('Login failed. Please try again.');
      }
    } catch (error) {
      console.error('Login error:', error);
      setError('An error occurred. Please try again.');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <>
      <DynamicSEO
        title="Login - IJARCM"
        description="Sign in to your International Journal of Academic Research account."
        keywords={["login", "sign in", "IJARCM", "academic journal"]}
        canonicalUrl="/auth/login"
      />
      
      <div className="min-h-[80vh] flex items-center justify-center py-12 px-4 sm:px-6 lg:px-8 bg-slate-50">
        <Card className="w-full max-w-md shadow-lg border-slate-200">
          <CardHeader className="space-y-1 text-center">
            <CardTitle className="text-2xl font-serif font-bold text-slate-900">Welcome Back</CardTitle>
            <CardDescription className="text-slate-500">
              Sign in to your account to access the journal platform
            </CardDescription>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleSubmit} className="space-y-4">
              {error && (
                <Alert variant="destructive" className="bg-red-50 text-red-900 border-red-200">
                  <AlertDescription>{error}</AlertDescription>
                </Alert>
              )}
              
              <div className="space-y-2">
                <Label htmlFor="email">Email Address</Label>
                <Input
                  id="email"
                  type="email"
                  placeholder="name@institution.edu"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  required
                  className="bg-white"
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="password">Password</Label>
                <div className="relative">
                  <Input
                    id="password"
                    type={showPassword ? 'text' : 'password'}
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    required
                    className="bg-white pr-10"
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600"
                  >
                    {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                  </button>
                </div>
              </div>

              <div className="flex items-center justify-between text-sm">
                <label className="flex items-center gap-2 cursor-pointer">
                  <input type="checkbox" className="rounded border-slate-300 text-slate-900 focus:ring-slate-900" />
                  <span className="text-slate-600">Remember me</span>
                </label>
                <Link 
                  href="/auth/forgot-password" 
                  className="font-medium text-slate-900 hover:text-slate-700 hover:underline"
                >
                  Forgot password?
                </Link>
              </div>

              <Button type="submit" className="w-full bg-slate-900 hover:bg-slate-800" disabled={isLoading}>
                {isLoading ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Signing in...
                  </>
                ) : (
                  'Sign In'
                )}
              </Button>
            </form>
          </CardContent>
          <CardFooter className="justify-center border-t border-slate-100 pt-6">
            <p className="text-sm text-slate-600">
              Don&apos;t have an account?{' '}
              <Link href="/auth/register" className="font-semibold text-slate-900 hover:underline">
                Sign up
              </Link>
            </p>
          </CardFooter>
        </Card>
      </div>
    </>
  );
}