'use client';

import { useState } from 'react';
import { Shield, X, AlertCircle } from 'lucide-react';
import { twoFactorAPI } from '@/lib/api';
import toast from 'react-hot-toast';

interface TwoFactorModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: () => void;
}

export default function TwoFactorModal({ isOpen, onClose, onSuccess }: TwoFactorModalProps) {
  const [code, setCode] = useState('');
  const [useBackupCode, setUseBackupCode] = useState(false);
  const [error, setError] = useState('');
  const [isLoading, setIsLoading] = useState(false);

  if (!isOpen) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setIsLoading(true);

    try {
      await twoFactorAPI.verifyLogin(code, useBackupCode);
      toast.success('2FA verification successful!');
      onSuccess();
    } catch (err: any) {
      const errorMessage = err.response?.data?.error || '2FA verification failed';
      setError(errorMessage);
      toast.error(errorMessage);
      setCode('');
    } finally {
      setIsLoading(false);
    }
  };

  const handleBackdropClick = (e: React.MouseEvent) => {
    if (e.target === e.currentTarget) {
      onClose();
    }
  };

  return (
    <div 
      className="fixed inset-0 z-50 flex items-center justify-center modal-backdrop"
      onClick={handleBackdropClick}
    >
      <div className="bg-white rounded-2xl shadow-2xl p-8 w-full max-w-md m-4 fade-in">
        <div className="flex items-center justify-between mb-6">
          <div className="flex items-center space-x-3">
            <div className="bg-indigo-100 p-2 rounded-lg">
              <Shield className="w-6 h-6 text-indigo-600" />
            </div>
            <h2 className="text-2xl font-bold text-gray-900">
              Two-Factor Authentication
            </h2>
          </div>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-gray-600 transition"
          >
            <X className="w-6 h-6" />
          </button>
        </div>

        <p className="text-gray-600 mb-6">
          {useBackupCode 
            ? 'Enter one of your backup codes' 
            : 'Enter the 6-digit code from your authenticator app'}
        </p>

        {error && (
          <div className="mb-6 p-4 bg-red-50 border border-red-200 rounded-lg flex items-start">
            <AlertCircle className="w-5 h-5 text-red-600 mt-0.5 mr-3 shrink-0" />
            <p className="text-sm text-red-800">{error}</p>
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-6">
          <div>
            <input
              type="text"
              value={code}
              onChange={(e) => setCode(e.target.value.replace(/\s/g, ''))}
              className="input-field text-center text-2xl tracking-widest font-mono"
              placeholder={useBackupCode ? 'XXXXXXXX' : '000000'}
              maxLength={useBackupCode ? 8 : 6}
              required
              autoFocus
            />
          </div>

          <button
            type="submit"
            disabled={isLoading || code.length < (useBackupCode ? 8 : 6)}
            className="btn-primary w-full py-3"
          >
            {isLoading ? 'Verifying...' : 'Verify'}
          </button>

          <button
            type="button"
            onClick={() => {
              setUseBackupCode(!useBackupCode);
              setCode('');
              setError('');
            }}
            className="w-full text-sm text-indigo-600 hover:text-indigo-700 font-medium"
          >
            {useBackupCode ? 'Use authenticator code' : 'Use backup code'}
          </button>
        </form>

        <div className="mt-6 p-4 bg-blue-50 border border-blue-200 rounded-lg">
          <p className="text-xs text-blue-800">
            <strong>Tip:</strong> If you've lost access to your authenticator app, 
            use one of your backup codes that you saved during 2FA setup.
          </p>
        </div>
      </div>
    </div>
  );
}