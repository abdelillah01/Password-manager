
'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/hooks/useAuth';


export default function LoginPage() {
  const router = useRouter();
  const { login, verify2FA, isLoading } = useAuth();
  
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState('');
  
  const [requires2FA, setRequires2FA] = useState(false);
  const [twoFactorCode, setTwoFactorCode] = useState('');
  const [useBackupCode, setUseBackupCode] = useState(false);
  
  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    
    try {
      const result = await login(email, password);
      
      if (result.requires2FA) {
        setRequires2FA(true);
      } else {
        router.push('/dashboard');
      }
    } catch (err: any) {
      setError(err.message || 'Login failed');
    }
  };
  
  const handle2FAVerification = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    
    try {
      await verify2FA(twoFactorCode, useBackupCode);
      router.push('/dashboard');
    } catch (err: any) {
      setError(err.message || '2FA verification failed');
      setTwoFactorCode('');
    }
  };

  const containerStyle = {
    minHeight: '100vh',
    background: 'linear-gradient(135deg, #f0f4ff 0%, #e6f0ff 100%)',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    padding: '1rem'
  };

  const cardStyle = {
    background: 'white',
    borderRadius: '1rem',
    boxShadow: '0 10px 25px rgba(0,0,0,0.1)',
    padding: '2rem',
    width: '100%',
    maxWidth: '400px'
  };

  const inputStyle = {
    width: '100%',
    padding: '0.75rem 1rem',
    border: '1px solid #d1d5db',
    borderRadius: '0.5rem',
    marginBottom: '1rem'
  };

  const buttonStyle = {
    background: '#4f46e5',
    color: 'white',
    padding: '0.75rem 1.5rem',
    border: 'none',
    borderRadius: '0.5rem',
    width: '100%',
    cursor: 'pointer'
  };

  if (requires2FA) {
    return (
      <div style={containerStyle}>
        <div style={cardStyle}>
          <div style={{ textAlign: 'center', marginBottom: '2rem' }}>
            <div style={{ 
              background: '#e0e7ff', 
              width: '4rem', 
              height: '4rem', 
              borderRadius: '50%', 
              display: 'flex', 
              alignItems: 'center', 
              justifyContent: 'center',
              margin: '0 auto 1rem'
            }}>
              🔒
            </div>
            <h1 style={{ fontSize: '1.5rem', fontWeight: 'bold', marginBottom: '0.5rem' }}>
              Two-Factor Authentication
            </h1>
            <p style={{ color: '#6b7280' }}>
              {useBackupCode ? 'Enter a backup code' : 'Enter the code from your authenticator app'}
            </p>
          </div>
          
          {error && (
            <div style={{ 
              background: '#fef2f2', 
              border: '1px solid #fecaca',
              borderRadius: '0.5rem',
              padding: '1rem',
              marginBottom: '1.5rem',
              display: 'flex',
              alignItems: 'flex-start'
            }}>
              <span style={{ marginRight: '0.5rem' }}>⚠️</span>
              <p style={{ color: '#dc2626', fontSize: '0.875rem', margin: 0 }}>{error}</p>
            </div>
          )}
          
          <form onSubmit={handle2FAVerification} style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
            <div>
              <label style={{ display: 'block', fontSize: '0.875rem', fontWeight: '500', marginBottom: '0.5rem' }}>
                {useBackupCode ? 'Backup Code' : '6-Digit Code'}
              </label>
              <input
                type="text"
                value={twoFactorCode}
                onChange={(e) => setTwoFactorCode(e.target.value.replace(/\s/g, ''))}
                style={{
                  ...inputStyle,
                  textAlign: 'center',
                  fontSize: '1.5rem',
                  letterSpacing: '0.5rem'
                }}
                placeholder={useBackupCode ? 'XXXXXXXX' : '000000'}
                maxLength={useBackupCode ? 8 : 6}
                required
              />
            </div>
            
            <button
              type="submit"
              disabled={isLoading}
              style={{
                ...buttonStyle,
                opacity: isLoading ? 0.5 : 1
              }}
            >
              {isLoading ? 'Verifying...' : 'Verify'}
            </button>
            
            <button
              type="button"
              onClick={() => {
                setUseBackupCode(!useBackupCode);
                setTwoFactorCode('');
                setError('');
              }}
              style={{
                background: 'none',
                border: 'none',
                color: '#4f46e5',
                fontSize: '0.875rem',
                fontWeight: '500',
                cursor: 'pointer'
              }}
            >
              {useBackupCode ? 'Use authenticator code' : 'Use backup code'}
            </button>
          </form>
        </div>
      </div>
    );
  }
  
  return (
    <div style={containerStyle}>
      <div style={cardStyle}>
        <div style={{ textAlign: 'center', marginBottom: '2rem' }}>
          <div style={{ 
            background: '#e0e7ff', 
            width: '4rem', 
            height: '4rem', 
            borderRadius: '50%', 
            display: 'flex', 
            alignItems: 'center', 
            justifyContent: 'center',
            margin: '0 auto 1rem'
          }}>
            🔐
          </div>
          <h1 style={{ fontSize: '1.875rem', fontWeight: 'bold', marginBottom: '0.5rem' }}>Welcome Back</h1>
          <p style={{ color: '#6b7280' }}>Sign in to your secure vault</p>
        </div>
        
        {error && (
          <div style={{ 
            background: '#fef2f2', 
            border: '1px solid #fecaca',
            borderRadius: '0.5rem',
            padding: '1rem',
            marginBottom: '1.5rem',
            display: 'flex',
            alignItems: 'flex-start'
          }}>
            <span style={{ marginRight: '0.5rem' }}>⚠️</span>
            <p style={{ color: '#dc2626', fontSize: '0.875rem', margin: 0 }}>{error}</p>
          </div>
        )}
        
        <form onSubmit={handleLogin} style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
          <div>
            <label style={{ display: 'block', fontSize: '0.875rem', fontWeight: '500', marginBottom: '0.5rem' }}>
              Email Address
            </label>
            <input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              style={inputStyle}
              placeholder="you@example.com"
              required
            />
          </div>
          
          <div>
            <label style={{ display: 'block', fontSize: '0.875rem', fontWeight: '500', marginBottom: '0.5rem' }}>
              Master Password
            </label>
            <div style={{ position: 'relative' }}>
              <input
                type={showPassword ? 'text' : 'password'}
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                style={inputStyle}
                placeholder="Enter your master password"
                required
              />
              <button
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                style={{
                  position: 'absolute',
                  right: '0.75rem',
                  top: '50%',
                  transform: 'translateY(-50%)',
                  background: 'none',
                  border: 'none',
                  cursor: 'pointer'
                }}
              >
                {showPassword ? '🙈' : '👁️'}
              </button>
            </div>
          </div>
          
          <button
            type="submit"
            disabled={isLoading}
            style={{
              ...buttonStyle,
              opacity: isLoading ? 0.5 : 1
            }}
          >
            {isLoading ? 'Signing in...' : 'Sign In'}
          </button>
        </form>
        
        <div style={{ marginTop: '1.5rem', textAlign: 'center' }}>
          <p style={{ fontSize: '0.875rem', color: '#6b7280' }}>
            Don't have an account?{' '}
            <button
              onClick={() => router.push('/register')}
              style={{
                background: 'none',
                border: 'none',
                color: '#4f46e5',
                fontWeight: '500',
                cursor: 'pointer'
              }}
            >
              Create one
            </button>
          </p>
        </div>
        
        <div style={{ 
          marginTop: '2rem', 
          background: '#fffbeb', 
          border: '1px solid #fed7aa',
          borderRadius: '0.5rem',
          padding: '1rem'
        }}>
          <p style={{ fontSize: '0.75rem', color: '#92400e', margin: 0, display: 'flex', alignItems: 'flex-start' }}>
            <span style={{ marginRight: '0.5rem' }}>⚠️</span>
            Your master password is never stored or sent to our servers. If you forget it, you will lose access to your passwords.
          </p>
        </div>
      </div>
    </div>
  );
}