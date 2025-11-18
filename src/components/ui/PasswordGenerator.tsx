'use client';

import { useState } from 'react';
import { RefreshCw, Copy, Check } from 'lucide-react';
import { generatePassword } from '@/lib/encryption';
import PasswordStrengthMeter from './PasswordStrengthMeter';
import toast from 'react-hot-toast';

interface PasswordGeneratorProps {
  onGenerate?: (password: string) => void;
  onClose?: () => void;
}

export default function PasswordGenerator({ onGenerate, onClose }: PasswordGeneratorProps) {
  const [password, setPassword] = useState('');
  const [copied, setCopied] = useState(false);
  const [options, setOptions] = useState({
    length: 16,
    useUppercase: true,
    useLowercase: true,
    useNumbers: true,
    useSymbols: true
  });

  const handleGenerate = () => {
    try {
      const newPassword = generatePassword(options);
      setPassword(newPassword);
      setCopied(false);
    } catch (error: any) {
      toast.error(error.message || 'Failed to generate password');
    }
  };

  const handleCopy = async () => {
    if (!password) return;
    
    try {
      await navigator.clipboard.writeText(password);
      setCopied(true);
      toast.success('Password copied to clipboard!');
      setTimeout(() => setCopied(false), 2000);
    } catch (error) {
      toast.error('Failed to copy password');
    }
  };

  const handleUsePassword = () => {
    if (password && onGenerate) {
      onGenerate(password);
      toast.success('Password applied!');
    }
  };

  const handleOptionChange = (option: keyof typeof options, value: boolean | number) => {
    setOptions(prev => ({ ...prev, [option]: value }));
  };

  // Generate initial password on mount
  useState(() => {
    handleGenerate();
  });

  return (
    <div className="space-y-6">
      <div className="text-center">
        <h3 className="text-xl font-bold text-gray-900 mb-2">Password Generator</h3>
        <p className="text-sm text-gray-600">Create a strong, random password</p>
      </div>

      {/* Generated Password Display */}
      <div className="relative">
        <div className="bg-gray-50 border-2 border-gray-200 rounded-lg p-4 font-mono text-lg break-all text-center">
          {password || 'Click generate to create a password'}
        </div>
        <div className="absolute right-3 top-1/2 -translate-y-1/2 flex space-x-2">
          <button
            onClick={handleGenerate}
            className="p-2 bg-white border border-gray-300 rounded-lg hover:bg-gray-50 transition"
            title="Generate new password"
          >
            <RefreshCw className="w-5 h-5 text-gray-600" />
          </button>
          <button
            onClick={handleCopy}
            className="p-2 bg-white border border-gray-300 rounded-lg hover:bg-gray-50 transition"
            title="Copy to clipboard"
          >
            {copied ? (
              <Check className="w-5 h-5 text-green-600" />
            ) : (
              <Copy className="w-5 h-5 text-gray-600" />
            )}
          </button>
        </div>
      </div>

      {password && <PasswordStrengthMeter password={password} />}

      {/* Options */}
      <div className="space-y-4">
        {/* Length */}
        <div>
          <div className="flex items-center justify-between mb-2">
            <label className="text-sm font-medium text-gray-700">
              Length: {options.length}
            </label>
          </div>
          <input
            type="range"
            min="8"
            max="64"
            value={options.length}
            onChange={(e) => handleOptionChange('length', parseInt(e.target.value))}
            className="w-full h-2 bg-gray-200 rounded-lg appearance-none cursor-pointer accent-indigo-600"
          />
          <div className="flex justify-between text-xs text-gray-500 mt-1">
            <span>8</span>
            <span>64</span>
          </div>
        </div>

        {/* Checkboxes */}
        <div className="space-y-2">
          <label className="flex items-center space-x-3 cursor-pointer">
            <input
              type="checkbox"
              checked={options.useUppercase}
              onChange={(e) => handleOptionChange('useUppercase', e.target.checked)}
              className="w-5 h-5 text-indigo-600 rounded focus:ring-indigo-500"
            />
            <span className="text-sm text-gray-700">
              Uppercase (A-Z)
            </span>
          </label>

          <label className="flex items-center space-x-3 cursor-pointer">
            <input
              type="checkbox"
              checked={options.useLowercase}
              onChange={(e) => handleOptionChange('useLowercase', e.target.checked)}
              className="w-5 h-5 text-indigo-600 rounded focus:ring-indigo-500"
            />
            <span className="text-sm text-gray-700">
              Lowercase (a-z)
            </span>
          </label>

          <label className="flex items-center space-x-3 cursor-pointer">
            <input
              type="checkbox"
              checked={options.useNumbers}
              onChange={(e) => handleOptionChange('useNumbers', e.target.checked)}
              className="w-5 h-5 text-indigo-600 rounded focus:ring-indigo-500"
            />
            <span className="text-sm text-gray-700">
              Numbers (0-9)
            </span>
          </label>

          <label className="flex items-center space-x-3 cursor-pointer">
            <input
              type="checkbox"
              checked={options.useSymbols}
              onChange={(e) => handleOptionChange('useSymbols', e.target.checked)}
              className="w-5 h-5 text-indigo-600 rounded focus:ring-indigo-500"
            />
            <span className="text-sm text-gray-700">
              Symbols (!@#$%...)
            </span>
          </label>
        </div>
      </div>

      {/* Actions */}
      <div className="flex items-center justify-end space-x-3 pt-4 border-t border-gray-200">
        {onClose && (
          <button
            onClick={onClose}
            className="btn-secondary px-6 py-2"
          >
            Cancel
          </button>
        )}
        {onGenerate && (
          <button
            onClick={handleUsePassword}
            className="btn-primary px-6 py-2"
            disabled={!password}
          >
            Use Password
          </button>
        )}
      </div>
    </div>
  );
}