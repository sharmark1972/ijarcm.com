'use client';

import { useEffect, useState } from 'react';
import { useSession } from 'next-auth/react';
import { usePathname, useRouter } from 'next/navigation';
import {
  LayoutDashboard,
  Users,
  FileText,
  Calendar,
  Archive,
  Settings,
  BarChart3,
  LogOut,
  Menu,
  X,
  Book,
  DollarSign,
  Award,
  Eye,
  Globe,
  Sparkles
} from 'lucide-react';
import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import { signOut } from 'next-auth/react';
import Navbar from '@/components/layout/Navbar';

export default function AdminLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const { data: session, status } = useSession();
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const router = useRouter();
  const pathname = usePathname();

  useEffect(() => {
    if (status === 'loading') return;
    if (!session?.user || session.user.role !== 'ADMIN') {
      router.replace('/');
    }
  }, [router, session, status]);

  if (status === 'loading') {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  if (!session?.user || session.user.role !== 'ADMIN') {
    return null;
  }

  const navigation = [
    {
      name: 'Dashboard',
      href: '/admin',
      icon: LayoutDashboard,
      current: false,
    },
    {
      name: 'Users',
      href: '/admin/users',
      icon: Users,
      current: false,
    },
    {
      name: 'Team Members',
      href: '/admin/team-members',
      icon: Users,
      current: false,
    },
    {
      name: 'Editorial Board',
      href: '/admin/editorial-board',
      icon: Users,
      current: false,
    },
    {
      name: 'Advisory Board',
      href: '/admin/advisory-board',
      icon: Award,
      current: false,
    },
    {
      name: 'Reviewer Board',
      href: '/admin/reviewer-board',
      icon: Eye,
      current: false,
    },
    {
      name: 'Papers',
      href: '/admin/papers',
      icon: FileText,
      current: false,
    },
    {
      name: 'Research Papers',
      href: '/admin/research-papers',
      icon: FileText,
      current: false,
    },
    {
      name: 'Ebooks',
      href: '/admin/ebooks',
      icon: Book,
      current: false,
    },
    {
      name: 'Conferences',
      href: '/admin/conferences',
      icon: Calendar,
      current: false,
    },
    {
      name: 'Archives',
      href: '/admin/archives',
      icon: Archive,
      current: false,
    },
    {
      name: 'Publication Fees',
      href: '/admin/fees',
      icon: DollarSign,
      current: false,
    },
    {
      name: 'Certificates',
      href: '/admin/certificates',
      icon: Award,
      current: false,
    },
    {
      name: 'Sites / Journals',
      href: '/admin/journals',
      icon: Globe,
      current: false,
    },
    {
      name: 'Statistics',
      href: '/admin/statistics',
      icon: BarChart3,
      current: false,
    },
    {
      name: 'Settings',
      href: '/admin/settings',
      icon: Settings,
      current: false,
    },
  ];

  const handleSignOut = () => {
    signOut({ callbackUrl: '/' });
  };

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Navbar */}
      <Navbar />
      
      {/* Admin Content */}
      <div className="flex">
        {/* Sidebar */}
        <div className={`fixed inset-y-0 left-0 z-50 w-64 bg-white shadow-lg transform ${sidebarOpen ? 'translate-x-0' : '-translate-x-full'} transition-transform duration-300 ease-in-out lg:translate-x-0 lg:static lg:inset-0`}>
          <div className="flex items-center justify-between h-16 px-6 border-b border-gray-200">
            <h2 className="text-xl font-semibold text-gray-900">Admin Panel</h2>
            <Button
              variant="ghost"
              size="sm"
              className="lg:hidden"
              onClick={() => setSidebarOpen(false)}
            >
              <X className="h-5 w-5" />
            </Button>
          </div>
          
          <nav className="mt-6 px-3">
            <div className="space-y-1">
              {navigation.map((item) => {
                const isActive = pathname === item.href;
                return (
                  <Link
                    key={item.name}
                    href={item.href}
                    className={`group flex items-center px-3 py-2 text-sm font-medium rounded-md transition-colors ${
                      isActive
                        ? 'bg-blue-100 text-blue-700'
                        : 'text-gray-700 hover:bg-gray-100 hover:text-gray-900'
                    }`}
                  >
                    <item.icon
                      className={`mr-3 h-5 w-5 flex-shrink-0 ${
                        isActive ? 'text-blue-500' : 'text-gray-400 group-hover:text-gray-500'
                      }`}
                    />
                    {item.name}
                  </Link>
                );
              })}
            </div>
          </nav>
        </div>

        {/* Main Content */}
        <div className="flex-1 lg:ml-0">
          {/* Mobile Header */}
          <div className="lg:hidden flex items-center justify-between h-16 px-4 bg-white border-b border-gray-200">
            <Button
              variant="ghost"
              size="sm"
              onClick={() => setSidebarOpen(true)}
            >
              <Menu className="h-5 w-5" />
            </Button>
            
            <Button
              variant="ghost"
              onClick={handleSignOut}
              className="flex items-center gap-2"
            >
              <Avatar className="h-8 w-8">
                <AvatarFallback>
                  {session.user.name?.charAt(0).toUpperCase()}
                </AvatarFallback>
              </Avatar>
              <LogOut className="h-4 w-4" />
            </Button>
          </div>

          {/* Page Content */}
          <main className="flex-1">
            {children}
          </main>
        </div>
      </div>

      {/* Mobile Sidebar Overlay */}
      {sidebarOpen && (
        <div
          className="fixed inset-0 z-40 bg-gray-600 bg-opacity-75 lg:hidden"
          onClick={() => setSidebarOpen(false)}
        />
      )}
    </div>
  );
}
