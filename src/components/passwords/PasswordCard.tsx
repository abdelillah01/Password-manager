'use client';

import { useState } from 'react';
import type { PasswordEntry } from '@/types';
import { Eye, EyeOff, Copy, Edit, Trash2, Star, ExternalLink } from 'lucide-react';
import { decrypt, keyStore, type EncryptedData } from '@/lib/encryption';
import { passwordAPI } from '@/lib/api';
import toast from 'react-hot-toast';
import { useRouter } from 'next/navigation';

interface PasswordCardProps {
  entry: PasswordEntry;
  onEdit: () => void;
  onDelete: () => void;
  onToggleFavorite: () => void;
}

export default function PasswordCard({ entry, onEdit, onDelete, onToggleFavorite }: PasswordCardProps) {
  const router = useRouter();
  const [decryptedPassword, setDecryptedPassword] = useState<string | null>(null);
  const [isVisible, setIsVisible] = useState(false);
  const [isDecrypting, setIsDecrypting] = useState(false);

  const decryptPassword = async () => {
    const key = keyStore.getKey();
    if (!key) {
      toast.error('Session expired. Please log in again.');
      router.push('/login');
      return;
    }

    try {
      setIsDecrypting(true);
      const encryptedData: EncryptedData = {
        ciphertext: entry.encrypted_password,
        iv: entry.encryption_iv,
        tag: entry.encryption_tag
      };

      const plaintext = await decrypt(encryptedData, key);
      setDecryptedPassword(plaintext);

      // Mark as accessed
      await passwordAPI.markAccessed(entry.id);
    } catch (error) {
      console.error('Decryption failed:', error);
      toast.error('Failed to decrypt password. Session may have expired.');
      router.push('/login');
    } finally {
      setIsDecrypting(false);
    }
  };

  const handleToggleVisibility = async () => {
    if (!decryptedPassword) {
      await decryptPassword();
    }
    setIsVisible(!isVisible);
  };

  const handleCopy = async () => {
    if (!decryptedPassword) {
      await decryptPassword();
    }

    if (decryptedPassword) {
      try {
        await navigator.clipboard.writeText(decryptedPassword);
        toast.success('Password copied to clipboard!', {
          icon: '📋',
        });
      } catch (error) {
        toast.error('Failed to copy password');
      }
    }
  };

  const getFolderColor = (folder: string) => {
    const colors: Record<string, string> = {
      personal: 'bg-blue-100 text-blue-700',
      work: 'bg-purple-100 text-purple-700',
      finance: 'bg-green-100 text-green-700',
      social: 'bg-pink-100 text-pink-700',
      other: 'bg-gray-100 text-gray-700',
    };
    return colors[folder] || colors.other;
  };

  return (
    <div className="bg-white rounded-lg border border-gray-200 p-5 hover:shadow-lg transition-all duration-200 fade-in">
      <div className="flex items-start justify-between mb-3">
        <div className="flex-1">
          <div className="flex items-center space-x-3 mb-2">
            <h3 className="text-lg font-semibold text-gray-900">{entry.name}</h3>
            {entry.is_favorite && (
              <Star className="w-5 h-5 text-yellow-500 fill-current" />
            )}
            <span className={`px-2 py-1 text-xs rounded-full font-medium ${getFolderColor(entry.folder)}`}>
              {entry.folder}
            </span>
          </div>

          {entry.username && (
            <p className="text-sm text-gray-600 mb-1">
              <span className="font-medium">Username:</span> {entry.username}
            </p>
          )}

          {entry.website && (
            <a
              href={entry.website}
              target="_blank"
              rel="noopener noreferrer"
              className="text-sm text-indigo-600 hover:text-indigo-700 inline-flex items-center space-x-1"
            >
              <span>{entry.website}</span>
              <ExternalLink className="w-3 h-3" />
            </a>
          )}
        </div>

        <div className="flex items-center space-x-1">
          <button
            onClick={onToggleFavorite}
            className="p-2 text-gray-400 hover:text-yellow-500 rounded-lg transition"
            title="Toggle favorite"
          >
            <Star className={`w-5 h-5 ${entry.is_favorite ? 'fill-current text-yellow-500' : ''}`} />
          </button>
          <button
            onClick={onEdit}
            className="p-2 text-gray-400 hover:text-indigo-600 rounded-lg transition"
            title="Edit"
          >
            <Edit className="w-5 h-5" />
          </button>
          <button
            onClick={onDelete}
            className="p-2 text-gray-400 hover:text-red-600 rounded-lg transition"
            title="Delete"
          >
            <Trash2 className="w-5 h-5" />
          </button>
        </div>
      </div>

      <div className="flex items-center space-x-2">
        <div className="flex-1 bg-gray-50 rounded-lg px-4 py-3 font-mono text-sm">
          {isDecrypting ? (
            <span className="text-gray-400">Decrypting...</span>
          ) : isVisible && decryptedPassword ? (
            <span className="text-gray-900 select-all">{decryptedPassword}</span>
          ) : (
            <span className="text-gray-500">••••••••••••</span>
          )}
        </div>

        <button
          onClick={handleToggleVisibility}
          disabled={isDecrypting}
          className="p-3 text-gray-600 hover:text-gray-900 hover:bg-gray-100 rounded-lg transition disabled:opacity-50"
          title={isVisible ? 'Hide password' : 'Show password'}
        >
          {isVisible ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
        </button>

        <button
          onClick={handleCopy}
          disabled={isDecrypting}
          className="p-3 text-gray-600 hover:text-gray-900 hover:bg-gray-100 rounded-lg transition disabled:opacity-50"
          title="Copy password"
        >
          <Copy className="w-5 h-5" />
        </button>
      </div>

      {entry.last_accessed && (
        <p className="mt-3 text-xs text-gray-500">
          Last accessed: {new Date(entry.last_accessed).toLocaleString()}
        </p>
      )}
    </div>
  );
}