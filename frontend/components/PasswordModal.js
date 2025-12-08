'use client';
import { useState, useEffect } from 'react';
import axios from 'axios';
import { CryptoService } from '@/lib/crypto';
import { useAuthStore } from '@/lib/store';

axios.defaults.withCredentials = true;

export default function PasswordModal({ item, onClose }) {
  const masterKey = useAuthStore(state => state.masterKey);
  const [formData, setFormData] = useState({
    website: '',
    username: '',
    password: '',
    folder: '',
    favorite: false,
  });
  const [isLoading, setIsLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [passwordStrength, setPasswordStrength] = useState('');

  useEffect(() => {
    if (item) {
      const loadItem = async () => {
        setIsLoading(true);
        try {
          if (!masterKey) return;
          const decrypted = await CryptoService.decrypt(item.encrypted_data, item.iv, masterKey);
          setFormData({
            website: item.website,
            username: item.username,
            password: decrypted,
            folder: item.folder,
            favorite: item.favorite,
          });
        } catch (err) {
          console.error('Failed to decrypt:', err);
        } finally {
          setIsLoading(false);
        }
      };
      loadItem();
    }
  }, [item, masterKey]);

  const checkPasswordStrength = (password) => {
    if (password.length === 0) return '';
    if (password.length < 8) return 'weak';
    
    const hasUpperCase = /[A-Z]/.test(password);
    const hasLowerCase = /[a-z]/.test(password);
    const hasNumbers = /\d/.test(password);
    const hasSpecialChar = /[!@#$%^&*(),.?":{}|<>]/.test(password);
    
    const strength = [hasUpperCase, hasLowerCase, hasNumbers, hasSpecialChar].filter(Boolean).length;
    
    if (strength === 4) return 'strong';
    if (strength >= 2) return 'medium';
    return 'weak';
  };

  const handlePasswordChange = (e) => {
    const newPassword = e.target.value;
    setFormData({ ...formData, password: newPassword });
    setPasswordStrength(checkPasswordStrength(newPassword));
  };

  const generateStrongPassword = () => {
    const length = 16;
    const charset = "abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789!@#$%^&*";
    let password = "";
    for (let i = 0; i < length; i++) {
      password += charset.charAt(Math.floor(Math.random() * charset.length));
    }
    setFormData({ ...formData, password });
    setPasswordStrength('strong');
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!masterKey) return;
    
    setIsLoading(true);

    try {
      const { encrypted, iv } = await CryptoService.encrypt(formData.password, masterKey);

      const payload = {
        encrypted_data: encrypted,
        iv: iv,
        website: formData.website,
        username: formData.username,
        folder: formData.folder,
        favorite: formData.favorite,
      };

      if (item) {
        await axios.put(`http://localhost:8000/api/items/${item.id}/`, payload);
      } else {
        await axios.post('http://localhost:8000/api/items/', payload);
      }

      onClose();
    } catch (err) {
      console.error('Save failed:', err);
    } finally {
      setIsLoading(false);
    }
  };

  // SVG Icons
  const WebsiteIcon = () => (
    <svg className="w-5 h-5 text-slate-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 12a9 9 0 01-9 9m9-9a9 9 0 00-9-9m9 9H3m9 9a9 9 0 01-9-9m9 9c1.657 0 3-4.03 3-9s-1.343-9-3-9m0 18c-1.657 0-3-4.03-3-9s1.343-9 3-9m-9 9a9 9 0 019-9" />
    </svg>
  );

  const UserIcon = () => (
    <svg className="w-5 h-5 text-slate-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
    </svg>
  );

  const LockIcon = () => (
    <svg className="w-5 h-5 text-slate-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
    </svg>
  );

  const FolderIcon = () => (
    <svg className="w-5 h-5 text-slate-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 7v10a2 2 0 002 2h14a2 2 0 002-2V9a2 2 0 00-2-2h-6l-2-2H5a2 2 0 00-2 2z" />
    </svg>
  );

  const StarIcon = () => (
    <svg className="w-5 h-5 text-amber-500" fill="currentColor" viewBox="0 0 24 24">
      <path d="M12 2l3.09 6.26L22 9.27l-5 4.87 1.18 6.88L12 17.77l-6.18 3.25L7 14.14 2 9.27l6.91-1.01L12 2z" />
    </svg>
  );

  const EyeIcon = () => (
    <svg className="w-5 h-5 text-slate-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
    </svg>
  );

  const EyeOffIcon = () => (
    <svg className="w-5 h-5 text-slate-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13.875 18.825A10.05 10.05 0 0112 19c-4.478 0-8.268-2.943-9.543-7a9.97 9.97 0 011.563-3.029m5.858.908a3 3 0 114.243 4.243M9.878 9.878l4.242 4.242M9.88 9.88l-3.29-3.29m7.532 7.532l3.29 3.29M3 3l3.59 3.59m0 0A9.953 9.953 0 0112 5c4.478 0 8.268 2.943 9.543 7a10.025 10.025 0 01-4.132 5.411m0 0L21 21" />
    </svg>
  );

  const KeyIcon = () => (
    <svg className="w-5 h-5 text-slate-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 7a2 2 0 012 2m4 0a6 6 0 01-7.743 5.743L11 17H9v2H7v2H4a1 1 0 01-1-1v-2.586a1 1 0 01.293-.707l5.964-5.964A6 6 0 1121 9z" />
    </svg>
  );

  const LoadingSpinner = () => (
    <svg className="w-5 h-5 animate-spin" fill="none" viewBox="0 0 24 24">
      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
      <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
    </svg>
  );

  const getStrengthColor = () => {
    switch (passwordStrength) {
      case 'weak': return 'bg-red-500';
      case 'medium': return 'bg-amber-500';
      case 'strong': return 'bg-green-500';
      default: return 'bg-slate-200';
    }
  };

  const getStrengthText = () => {
    switch (passwordStrength) {
      case 'weak': return 'Weak password';
      case 'medium': return 'Medium strength';
      case 'strong': return 'Strong password';
      default: return 'Enter a password';
    }
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
      <div className="card w-full max-w-md max-h-[90vh] overflow-y-auto">
        <div className="p-6 border-b border-slate-200 dark:border-slate-700">
          <h2 className="text-2xl font-bold text-slate-800 dark:text-slate-100">
            {item ? 'Edit Password' : 'Add New Password'}
          </h2>
          <p className="text-slate-600 dark:text-slate-400 text-sm mt-1">
            {item ? 'Update your password details' : 'Store a new secure password'}
          </p>
        </div>

        <form onSubmit={handleSubmit} className="p-6 space-y-6">
          {/* Website Field */}
          <div>
            <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-2">
              Website
            </label>
            <div className="relative">
              <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                <WebsiteIcon />
              </div>
              <input
                type="text"
                placeholder="example.com"
                className="input-field pl-10"
                value={formData.website}
                onChange={(e) => setFormData({ ...formData, website: e.target.value })}
                disabled={isLoading}
              />
            </div>
          </div>

          {/* Username Field */}
          <div>
            <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-2">
              Username / Email
            </label>
            <div className="relative">
              <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                <UserIcon />
              </div>
              <input
                type="text"
                placeholder="your@email.com"
                className="input-field pl-10"
                value={formData.username}
                onChange={(e) => setFormData({ ...formData, username: e.target.value })}
                disabled={isLoading}
              />
            </div>
          </div>

          {/* Password Field */}
          <div>
            <div className="flex items-center justify-between mb-2">
              <label className="block text-sm font-medium text-slate-700 dark:text-slate-300">
                Password
              </label>
              <button
                type="button"
                onClick={generateStrongPassword}
                className="text-xs text-blue-600 dark:text-blue-400 hover:text-blue-700 dark:hover:text-blue-300 font-medium"
                disabled={isLoading}
              >
                Generate Strong
              </button>
            </div>
            <div className="relative">
              <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                <LockIcon />
              </div>
              <input
                type={showPassword ? "text" : "password"}
                placeholder="Enter password"
                className="input-field pl-10 pr-20"
                value={formData.password}
                onChange={handlePasswordChange}
                required
                disabled={isLoading}
              />
              <div className="absolute inset-y-0 right-0 flex items-center pr-3">
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="text-slate-400 hover:text-slate-600 dark:hover:text-slate-300 transition-colors"
                  disabled={isLoading}
                >
                  {showPassword ? <EyeOffIcon /> : <EyeIcon />}
                </button>
              </div>
            </div>
            
            {/* Password Strength Indicator */}
            {formData.password && (
              <div className="mt-3">
                <div className="flex justify-between text-xs mb-1">
                  <span className="text-slate-600 dark:text-slate-400">Password strength</span>
                  <span className={`font-medium ${
                    passwordStrength === 'weak' ? 'text-red-500' :
                    passwordStrength === 'medium' ? 'text-amber-500' :
                    passwordStrength === 'strong' ? 'text-green-500' :
                    'text-slate-400'
                  }`}>
                    {getStrengthText()}
                  </span>
                </div>
                <div className="w-full bg-slate-200 dark:bg-slate-700 rounded-full h-2">
                  <div 
                    className={`h-2 rounded-full transition-all duration-300 ${
                      passwordStrength === 'weak' ? 'w-1/3 bg-red-500' :
                      passwordStrength === 'medium' ? 'w-2/3 bg-amber-500' :
                      passwordStrength === 'strong' ? 'w-full bg-green-500' :
                      'w-0'
                    }`}
                  />
                </div>
              </div>
            )}
          </div>

          {/* Folder Field */}
          <div>
            <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-2">
              Folder (Optional)
            </label>
            <div className="relative">
              <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                <FolderIcon />
              </div>
              <input
                type="text"
                placeholder="Personal, Work, etc."
                className="input-field pl-10"
                value={formData.folder}
                onChange={(e) => setFormData({ ...formData, folder: e.target.value })}
                disabled={isLoading}
              />
            </div>
          </div>

          {/* Favorite Toggle */}
          <label className="flex items-center gap-3 p-4 bg-slate-50 dark:bg-slate-800 rounded-xl cursor-pointer transition-colors hover:bg-slate-100 dark:hover:bg-slate-700">
            <input
              type="checkbox"
              checked={formData.favorite}
              onChange={(e) => setFormData({ ...formData, favorite: e.target.checked })}
              className="rounded text-blue-500 focus:ring-blue-500"
              disabled={isLoading}
            />
            <StarIcon />
            <span className="text-sm font-medium text-slate-700 dark:text-slate-300">
              Mark as favorite
            </span>
          </label>

          {/* Action Buttons */}
          <div className="flex gap-4 pt-4">
            <button
              type="button"
              onClick={onClose}
              className="btn-secondary flex-1"
              disabled={isLoading}
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={isLoading}
              className="btn-primary flex-1 flex items-center justify-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {isLoading ? (
                <>
                  <LoadingSpinner />
                  Saving...
                </>
              ) : (
                <>
                  <KeyIcon />
                  {item ? 'Update Password' : 'Save Password'}
                </>
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}