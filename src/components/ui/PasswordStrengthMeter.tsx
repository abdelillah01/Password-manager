'use client';

import { useMemo } from 'react';
import { calculatePasswordStrength } from '@/lib/encryption';
import { Shield, AlertTriangle, CheckCircle } from 'lucide-react';

interface PasswordStrengthMeterProps {
  password: string;
}

export default function PasswordStrengthMeter({ password }: PasswordStrengthMeterProps) {
  const strength = useMemo(() => {
    return calculatePasswordStrength(password);
  }, [password]);

  const getStrengthLabel = (score: number): string => {
    if (score <= 1) return 'Very Weak';
    if (score === 2) return 'Weak';
    if (score === 3) return 'Fair';
    if (score === 4) return 'Strong';
    return 'Very Strong';
  };

  const getStrengthColor = (score: number): string => {
    if (score <= 1) return 'bg-red-500';
    if (score === 2) return 'bg-orange-500';
    if (score === 3) return 'bg-yellow-500';
    if (score === 4) return 'bg-lime-500';
    return 'bg-green-500';
  };

  const getTextColor = (score: number): string => {
    if (score <= 1) return 'text-red-600';
    if (score === 2) return 'text-orange-600';
    if (score === 3) return 'text-yellow-600';
    if (score === 4) return 'text-lime-600';
    return 'text-green-600';
  };

  const getIcon = (score: number) => {
    if (score <= 2) return <AlertTriangle className="w-4 h-4" />;
    if (score === 3) return <Shield className="w-4 h-4" />;
    return <CheckCircle className="w-4 h-4" />;
  };

  const strengthPercentage = (strength.score / 5) * 100;

  return (
    <div className="space-y-2">
      {/* Strength Bar */}
      <div className="flex items-center space-x-3">
        <div className="flex-1 h-2 bg-gray-200 rounded-full overflow-hidden">
          <div
            className={`h-full transition-all duration-300 ${getStrengthColor(strength.score)}`}
            style={{ width: `${strengthPercentage}%` }}
          />
        </div>
        <div className={`flex items-center space-x-1 text-sm font-medium ${getTextColor(strength.score)}`}>
          {getIcon(strength.score)}
          <span>{getStrengthLabel(strength.score)}</span>
        </div>
      </div>

      {/* Feedback */}
      {strength.feedback.length > 0 && (
        <div className="bg-blue-50 border border-blue-200 rounded-lg p-3">
          <p className="text-xs font-medium text-blue-900 mb-1">Suggestions:</p>
          <ul className="text-xs text-blue-800 space-y-1">
            {strength.feedback.map((item, index) => (
              <li key={index} className="flex items-start">
                <span className="mr-2">•</span>
                <span>{item}</span>
              </li>
            ))}
          </ul>
        </div>
      )}

      {/* Strong Password Checklist */}
      {strength.score >= 4 && (
        <div className="bg-green-50 border border-green-200 rounded-lg p-3">
          <p className="text-xs font-medium text-green-900 flex items-center">
            <CheckCircle className="w-4 h-4 mr-1" />
            Great! This password is strong.
          </p>
        </div>
      )}
    </div>
  );
}