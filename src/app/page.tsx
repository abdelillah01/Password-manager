'use client';

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/hooks/useAuth';
import { Lock } from 'lucide-react';

export default function Home() {
  const router = useRouter();
  const { isAuthenticated, isLoading } = useAuth();

  useEffect(() => {
    // Load user on mount
    const checkAuth = async () => {
      if (!isLoading) {
        if (isAuthenticated) {
          router.push('/dashboard');
        } else {
          router.push('/login');
        }
      }
    };
    
    checkAuth();
  }, [isAuthenticated, isLoading, router]);

  return (
    <div className="min-h-screen bg-linear-to-br from-blue-50 to-indigo-100 flex items-center justify-center">
      <div className="text-center">
        <div className="bg-indigo-100 w-20 h-20 rounded-full flex items-center justify-center mx-auto mb-6 animate-pulse">
          <Lock className="w-10 h-10 text-indigo-600" />
        </div>
        <div className="flex items-center justify-center space-x-2">
          <div className="w-2 h-2 bg-indigo-600 rounded-full animate-bounce"></div>
          <div className="w-2 h-2 bg-indigo-600 rounded-full animate-bounce" style={{ animationDelay: '0.2s' }}></div>
          <div className="w-2 h-2 bg-indigo-600 rounded-full animate-bounce" style={{ animationDelay: '0.4s' }}></div>
        </div>
        <p className="mt-4 text-gray-600">Loading your secure vault...</p>
      </div>
    </div>
  );
}