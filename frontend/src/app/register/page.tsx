'use client';

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/hooks/useAuth';
import RegisterForm from '@/components/auth/RegisterForm';
import { Spinner } from '@/components/ui/Spinner';

export default function RegisterPage() {
  const router = useRouter();
  const { isAuthenticated, isLoading, hasCheckedAuth } = useAuth();

  useEffect(() => {
    // Only redirect when we've checked auth AND user is authenticated
    if (hasCheckedAuth && isAuthenticated && !isLoading) {
      router.push('/dashboard');
    }
  }, [isAuthenticated, isLoading, hasCheckedAuth, router]);

  // Show loading spinner while checking authentication
  if (isLoading || !hasCheckedAuth) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 flex items-center justify-center">
        <Spinner size="lg" />
        <span className="ml-2 text-gray-600">Loading...</span>
      </div>
    );
  }

  // Don't render the form if authenticated (will redirect)
  if (isAuthenticated) {
    return null;
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 flex items-center justify-center p-4">
      <RegisterForm />
    </div>
  );
}