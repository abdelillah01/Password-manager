'use client';

import { useState } from 'react';
import { X, Plus, AlertCircle } from 'lucide-react';
import { passwordAPI } from '@/lib/api';
import { encrypt, keyStore } from '@/lib/encryption';
import PasswordGenerator from '@/components/ui/PasswordGenerator';
import PasswordStrengthMeter from '@/components/ui/PasswordStrengthMeter';
import toast from 'react-hot-toast';
import { useRouter } from 'next/navigation';

interface AddPasswordModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: () => void;
}

export default function AddPasswordModal({ isOpen, onClose, onSuccess }: AddPasswordModalProps) {
  const router = useRouter();
  const [formData, setFormData] = useState({
    name: '',
    username: '',
    password: '',
    website: '',
    folder: 'personal' as const,
    notes: ''
  });
  const [error, setError] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [showGenerator, setShowGenerator] = useState(false);

  if (!isOpen) return null;

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');

    const key = keyStore.getKey();
    if (!key) {
      toast.error('Session expired. Please log in again.');
      router.push('/login');
      return;
    }

    try {
      setIsLoading(true);

      // Encrypt password
      const encryptedPassword = await encrypt(formData.password, key);

      // Encrypt notes if provided
      let encryptedNotes = null;
      if (formData.notes.trim()) {
        encryptedNotes = await encrypt(formData.notes, key);
      }

      // Prepare data for API
      const passwordData = {
        name: formData.name,
        username: formData.username,
        website: formData.website,
        folder: formData.folder,
        encrypted_password: encryptedPassword.ciphertext,
        encryption_iv: encryptedPassword.iv,
        encryption_tag: encryptedPassword.tag,
        ...(encryptedNotes && {
          encrypted_notes: encryptedNotes.ciphertext,
          notes_iv: encryptedNotes.iv,
          notes_tag: encryptedNotes.tag
        })
      };

      await passwordAPI.create(passwordData);
      toast.success('Password added successfully!');
      onSuccess();
      onClose();
      
      // Reset form
      setFormData({
        name: '',
        username: '',
        password: '',
        website: '',
        folder: 'personal',
        notes: ''
      });
    } catch (err: any) {
      const errorMessage = err.response?.data?.detail || 'Failed to add password';
      setError(errorMessage);
      toast.error(errorMessage);
    } finally {
      setIsLoading(false);
    }
  };

  const handleBackdropClick = (e: React.MouseEvent) => {
    if (e.target === e.currentTarget) {
      onClose();
    }
  };

  const handleGeneratedPassword = (password: string) => {
    setFormData(prev => ({ ...prev, password }));
    setShowGenerator(false);
  };

  return (
    <div 
      className="fixed inset-0 z-50 flex items-center justify-center modal-backdrop overflow-y-auto py-8"
      onClick={handleBackdropClick}
    >
      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-2xl m-4 max-h-[90vh] overflow-y-auto fade-in">
        <div className="sticky top-0 bg-white border-b border-gray-200 p-6 rounded-t-2xl">
          <div className="flex items-center justify-between">
            <h2 className="text-2xl font-bold text-gray-900 flex items-center space-x-2">
              <Plus className="w-6 h-6 text-indigo-600" />
              <span>Add New Password</span>
            </h2>
            <button
              onClick={onClose}
              className="text-gray-400 hover:text-gray-600 transition"
            >
              <X className="w-6 h-6" />
            </button>
          </div>
        </div>

        <form onSubmit={handleSubmit} className="p-6 space-y-5">
          {error && (
            <div className="p-4 bg-red-50 border border-red-200 rounded-lg flex items-start">
              <AlertCircle className="w-5 h-5 text-red-600 mt-0.5 mr-3 flex-shrink-0" />
              <p className="text-sm text-red-800">{error}</p>
            </div>
          )}

          {/* Name */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Name <span className="text-red-500">*</span>
            </label>
            <input
              type="text"
              name="name"
              value={formData.name}
              onChange={handleChange}
              className="input-field"
              placeholder="e.g., Gmail Account, Bank Login"
              required
            />
          </div>

          {/* Username */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Username / Email
            </label>
            <input
              type="text"
              name="username"
              value={formData.username}
              onChange={handleChange}
              className="input-field"
              placeholder="username@example.com"
            />
          </div>

          {/* Password */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Password <span className="text-red-500">*</span>
            </label>
            <div className="flex space-x-2">
              <input
                type="text"
                name="password"
                value={formData.password}
                onChange={handleChange}
                className="input-field flex-1 font-mono"
                placeholder="Enter password"
                required
              />
              <button
                type="button"
                onClick={() => setShowGenerator(true)}
                className="btn-secondary whitespace-nowrap"
              >
                Generate
              </button>
            </div>
            {formData.password && (
              <div className="mt-2">
                <PasswordStrengthMeter password={formData.password} />
              </div>
            )}
          </div>

          {/* Website */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Website URL
            </label>
            <input
              type="url"
              name="website"
              value={formData.website}
              onChange={handleChange}
              className="input-field"
              placeholder="https://example.com"
            />
          </div>

          {/* Folder */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Folder <span className="text-red-500">*</span>
            </label>
            <select
              name="folder"
              value={formData.folder}
              onChange={handleChange}
              className="input-field"
              required
            >
              <option value="personal">Personal</option>
              <option value="work">Work</option>
              <option value="finance">Finance</option>
              <option value="social">Social</option>
              <option value="other">Other</option>
            </select>
          </div>

          {/* Notes */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Notes (Optional)
            </label>
            <textarea
              name="notes"
              value={formData.notes}
              onChange={handleChange}
              className="input-field resize-none"
              rows={3}
              placeholder="Add any additional notes..."
            />
            <p className="mt-1 text-xs text-gray-500">
              Notes are encrypted just like your password
            </p>
          </div>

          {/* Actions */}
          <div className="flex items-center justify-end space-x-3 pt-4">
            <button
              type="button"
              onClick={onClose}
              className="btn-secondary px-6 py-2"
              disabled={isLoading}
            >
              Cancel
            </button>
            <button
              type="submit"
              className="btn-primary px-6 py-2"
              disabled={isLoading}
            >
              {isLoading ? 'Adding...' : 'Add Password'}
            </button>
          </div>
        </form>
      </div>

      {/* Password Generator Modal */}
      {showGenerator && (
        <div className="fixed inset-0 z-[60] flex items-center justify-center bg-black bg-opacity-50">
          <div className="bg-white rounded-xl p-6 w-full max-w-md m-4">
            <PasswordGenerator
              onGenerate={handleGeneratedPassword}
              onClose={() => setShowGenerator(false)}
            />
          </div>
        </div>
      )}
    </div>
  );
}