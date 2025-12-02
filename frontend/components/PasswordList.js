'use client';
import { useState } from 'react';
import axios from 'axios';
import { CryptoService } from '@/lib/crypto';
import { useAuthStore } from '@/lib/store';

axios.defaults.withCredentials = true;

export default function PasswordList({ passwords, onEdit, onRefresh, isLoading }) {
  const masterKey = useAuthStore(state => state.masterKey);
  const [revealed, setRevealed] = useState({});
  const [copyStatus, setCopyStatus] = useState({});

  const handleReveal = async (item) => {
    if (revealed[item.id]) {
      const newRevealed = { ...revealed };
      delete newRevealed[item.id];
      setRevealed(newRevealed);
      return;
    }

    try {
      if (!masterKey) return;
      const decrypted = await CryptoService.decrypt(item.encrypted_data, item.iv, masterKey);
      setRevealed({ ...revealed, [item.id]: decrypted });
    } catch (err) {
      console.error('Decryption failed:', err);
    }
  };

  const handleCopy = async (text, itemId) => {
    try {
      await navigator.clipboard.writeText(text);
      setCopyStatus({ ...copyStatus, [itemId]: true });
      setTimeout(() => {
        setCopyStatus(prev => {
          const newStatus = { ...prev };
          delete newStatus[itemId];
          return newStatus;
        });
      }, 2000);
    } catch (err) {
      console.error('Copy failed:', err);
    }
  };

  const handleDelete = async (id) => {
    if (!confirm('Are you sure you want to delete this password? This action cannot be undone.')) return;
    try {
      await axios.delete(`http://localhost:8000/api/items/${id}/`);
      onRefresh();
    } catch (err) {
      console.error('Delete failed:', err);
    }
  };

  const getPasswordStrength = (password) => {
    if (!password) return 'unknown';
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

  const getStrengthColor = (strength) => {
    switch (strength) {
      case 'strong': return 'bg-green-500';
      case 'medium': return 'bg-amber-500';
      case 'weak': return 'bg-red-500';
      default: return 'bg-slate-300';
    }
  };

  const getStrengthText = (strength) => {
    switch (strength) {
      case 'strong': return 'Strong';
      case 'medium': return 'Medium';
      case 'weak': return 'Weak';
      default: return 'Unknown';
    }
  };

  // SVG Icons
  const EyeIcon = () => (
    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
    </svg>
  );

  const EyeOffIcon = () => (
    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13.875 18.825A10.05 10.05 0 0112 19c-4.478 0-8.268-2.943-9.543-7a9.97 9.97 0 011.563-3.029m5.858.908a3 3 0 114.243 4.243M9.878 9.878l4.242 4.242M9.88 9.88l-3.29-3.29m7.532 7.532l3.29 3.29M3 3l3.59 3.59m0 0A9.953 9.953 0 0112 5c4.478 0 8.268 2.943 9.543 7a10.025 10.025 0 01-4.132 5.411m0 0L21 21" />
    </svg>
  );

  const CopyIcon = () => (
    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 16H6a2 2 0 01-2-2V6a2 2 0 012-2h8a2 2 0 012 2v2m-6 12h8a2 2 0 002-2v-8a2 2 0 00-2-2h-8a2 2 0 00-2 2v8a2 2 0 002 2z" />
    </svg>
  );

  const EditIcon = () => (
    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
    </svg>
  );

  const DeleteIcon = () => (
    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
    </svg>
  );

  const StarIcon = () => (
    <svg className="w-4 h-4 text-amber-500" fill="currentColor" viewBox="0 0 24 24">
      <path d="M12 2l3.09 6.26L22 9.27l-5 4.87 1.18 6.88L12 17.77l-6.18 3.25L7 14.14 2 9.27l6.91-1.01L12 2z" />
    </svg>
  );

  const FolderIcon = () => (
    <svg className="w-4 h-4 text-slate-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 7v10a2 2 0 002 2h14a2 2 0 002-2V9a2 2 0 00-2-2h-6l-2-2H5a2 2 0 00-2 2z" />
    </svg>
  );

  const UserIcon = () => (
    <svg className="w-4 h-4 text-slate-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
    </svg>
  );

  if (isLoading) {
    return (
      <div className="grid gap-4">
        {[1, 2, 3].map(i => (
          <div key={i} className="card p-6 animate-pulse">
            <div className="flex justify-between items-start">
              <div className="flex-1 space-y-3">
                <div className="h-4 bg-slate-200 dark:bg-slate-700 rounded w-1/4"></div>
                <div className="h-3 bg-slate-200 dark:bg-slate-700 rounded w-1/3"></div>
                <div className="h-3 bg-slate-200 dark:bg-slate-700 rounded w-1/2"></div>
              </div>
              <div className="flex gap-2">
                <div className="h-8 w-16 bg-slate-200 dark:bg-slate-700 rounded"></div>
                <div className="h-8 w-16 bg-slate-200 dark:bg-slate-700 rounded"></div>
                <div className="h-8 w-16 bg-slate-200 dark:bg-slate-700 rounded"></div>
              </div>
            </div>
          </div>
        ))}
      </div>
    );
  }

  if (passwords.length === 0) {
    return (
      <div className="card p-12 text-center">
        <div className="text-slate-400 dark:text-slate-500 text-6xl mb-4">🔒</div>
        <h3 className="text-lg font-medium text-slate-700 dark:text-slate-300 mb-2">
          No passwords yet
        </h3>
        <p className="text-slate-500 dark:text-slate-400 text-sm">
          Get started by adding your first secure password
        </p>
      </div>
    );
  }

  return (
    <div className="grid gap-4">
      {passwords.map((item) => {
        const passwordStrength = revealed[item.id] ? getPasswordStrength(revealed[item.id]) : 'unknown';
        
        return (
          <div key={item.id} className="card p-6 transition-all duration-300 hover:shadow-xl hover:shadow-slate-300/30 dark:hover:shadow-slate-900/70">
            <div className="flex justify-between items-start gap-4">
              {/* Content */}
              <div className="flex-1 min-w-0">
                {/* Header */}
                <div className="flex items-center gap-3 mb-3">
                  <div className="w-10 h-10 bg-gradient-to-br from-blue-500 to-blue-600 rounded-xl flex items-center justify-center text-white font-bold text-sm">
                    {item.website ? item.website.charAt(0).toUpperCase() : 'U'}
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2">
                      <h3 className="text-lg font-semibold text-slate-800 dark:text-slate-100 truncate">
                        {item.website || 'Untitled Website'}
                      </h3>
                      {item.favorite && <StarIcon />}
                    </div>
                    <div className="flex items-center gap-4 mt-1 text-sm text-slate-600 dark:text-slate-400">
                      {item.username && (
                        <div className="flex items-center gap-1">
                          <UserIcon />
                          <span className="truncate">{item.username}</span>
                        </div>
                      )}
                      {item.folder && (
                        <div className="flex items-center gap-1">
                          <FolderIcon />
                          <span className="truncate">{item.folder}</span>
                        </div>
                      )}
                    </div>
                  </div>
                </div>

                {/* Password Section */}
                <div className="bg-slate-50 dark:bg-slate-800/50 rounded-xl p-4">
                  <div className="flex items-center justify-between mb-2">
                    <span className="text-sm font-medium text-slate-700 dark:text-slate-300">
                      Password
                    </span>
                    <div className="flex items-center gap-2">
                      {revealed[item.id] && (
                        <div className="flex items-center gap-2">
                          <div className="flex items-center gap-1">
                            <div className={`w-2 h-2 rounded-full ${getStrengthColor(passwordStrength)}`}></div>
                            <span className={`text-xs font-medium ${
                              passwordStrength === 'strong' ? 'text-green-600 dark:text-green-400' :
                              passwordStrength === 'medium' ? 'text-amber-600 dark:text-amber-400' :
                              passwordStrength === 'weak' ? 'text-red-600 dark:text-red-400' :
                              'text-slate-400'
                            }`}>
                              {getStrengthText(passwordStrength)}
                            </span>
                          </div>
                          <div className="w-px h-4 bg-slate-300 dark:bg-slate-600"></div>
                        </div>
                      )}
                      <button
                        onClick={() => handleCopy(revealed[item.id] || item.username, item.id)}
                        className="text-xs text-blue-600 dark:text-blue-400 hover:text-blue-700 dark:hover:text-blue-300 font-medium transition-colors"
                      >
                        {copyStatus[item.id] ? 'Copied!' : 'Copy'}
                      </button>
                    </div>
                  </div>
                  <div className="flex items-center justify-between">
                    <code className={`font-mono text-sm ${
                      revealed[item.id] 
                        ? 'text-slate-800 dark:text-slate-100' 
                        : 'text-slate-500 dark:text-slate-400'
                    }`}>
                      {revealed[item.id] ? revealed[item.id] : '••••••••••••'}
                    </code>
                  </div>
                </div>
              </div>

              {/* Actions */}
              <div className="flex flex-col gap-2 flex-shrink-0">
                <button
                  onClick={() => handleReveal(item)}
                  className="btn-secondary flex items-center gap-2 px-3 py-2 text-sm"
                >
                  {revealed[item.id] ? <EyeOffIcon /> : <EyeIcon />}
                  {revealed[item.id] ? 'Hide' : 'Show'}
                </button>
                <button
                  onClick={() => onEdit(item)}
                  className="btn-primary flex items-center gap-2 px-3 py-2 text-sm"
                >
                  <EditIcon />
                  Edit
                </button>
                <button
                  onClick={() => handleDelete(item.id)}
                  className="bg-red-500 hover:bg-red-600 text-white flex items-center gap-2 px-3 py-2 text-sm rounded-xl transition-all duration-200 shadow-lg shadow-red-500/25"
                >
                  <DeleteIcon />
                  Delete
                </button>
              </div>
            </div>
          </div>
        );
      })}
    </div>
  );
}
