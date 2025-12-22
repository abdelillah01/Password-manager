'use client';
import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import axios from 'axios';
import { useAuthStore, usePasswordStore } from '@/lib/store';
import PasswordList from '@/components/PasswordList';
import PasswordModal from '@/components/PasswordModal';

axios.defaults.withCredentials = true;

export default function Dashboard() {
  const router = useRouter();
  const { user, masterKey, clearAuth } = useAuthStore();
  const { passwords, setPasswords } = usePasswordStore();
  const [showModal, setShowModal] = useState(false);
  const [editItem, setEditItem] = useState(null);
  const [search, setSearch] = useState('');
  const [filter, setFilter] = useState({ folder: '', favorite: false });
  const [isLoading, setIsLoading] = useState(false);

  useEffect(() => {
    if (!user || !masterKey) {
      router.push('/login');
      return;
    }
    fetchPasswords();

    let timeout;
    const resetTimeout = () => {
      clearTimeout(timeout);
      timeout = setTimeout(() => {
        handleLogout();
      }, 600000);
    };

    window.addEventListener('mousemove', resetTimeout);
    window.addEventListener('keypress', resetTimeout);
    resetTimeout();

    return () => {
      clearTimeout(timeout);
      window.removeEventListener('mousemove', resetTimeout);
      window.removeEventListener('keypress', resetTimeout);
    };
  }, [user, masterKey]);

  const fetchPasswords = async () => {
    setIsLoading(true);
    try {
      const params = new URLSearchParams();
      if (search) params.append('search', search);
      if (filter.folder) params.append('folder', filter.folder);
      if (filter.favorite) params.append('favorite', 'true');

      const res = await axios.get(`http://localhost:8000/api/items/?${params}`);
      setPasswords(res.data);
    } catch (err) {
      console.error('Failed to fetch passwords:', err);
    } finally {
      setIsLoading(false);
    }
  };

  const handleLogout = async () => {
    try {
      await axios.post('http://localhost:8000/api/logout/');
    } catch (err) {
      console.error('Logout error:', err);
    }
    clearAuth();
    router.push('/login');
  };

  const handleEdit = (item) => {
    setEditItem(item);
    setShowModal(true);
  };

  const handleCloseModal = () => {
    setShowModal(false);
    setEditItem(null);
    fetchPasswords();
  };

  const totalPasswords = passwords.length;
  const favoriteCount = passwords.filter(p => p.favorite).length;
  const strongPasswordCount = passwords.filter(p => p.strength === 'strong').length;

  // Simple SVG Icons as components
  const ShieldIcon = () => (
    <svg className="w-8 h-8 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
    </svg>
  );

  const SearchIcon = () => (
    <svg className="w-5 h-5 text-slate-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
    </svg>
  );

  const UserIcon = () => (
    <svg className="w-5 h-5 text-slate-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
    </svg>
  );

  const LogoutIcon = () => (
    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1" />
    </svg>
  );

  const PlusIcon = () => (
    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
    </svg>
  );

  const StarIcon = () => (
    <svg className="w-4 h-4 text-amber-500" fill="currentColor" viewBox="0 0 24 24">
      <path d="M12 2l3.09 6.26L22 9.27l-5 4.87 1.18 6.88L12 17.77l-6.18 3.25L7 14.14 2 9.27l6.91-1.01L12 2z" />
    </svg>
  );

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50 to-indigo-50 dark:from-slate-900 dark:via-slate-800 dark:to-slate-900 p-4 md:p-8">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="card p-6 mb-8">
          <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
            <div className="flex items-center gap-4">
              <div className="p-3 bg-gradient-to-r from-blue-500 to-blue-600 rounded-2xl shadow-lg">
                <ShieldIcon />
              </div>
              <div>
                <h1 className="text-3xl font-bold bg-gradient-to-r from-blue-600 to-blue-800 dark:from-blue-400 dark:to-blue-600 bg-clip-text text-transparent">
                  CipherVault
                </h1>
                <p className="text-slate-600 dark:text-slate-400 text-sm mt-1">
                  Zero-Knowledge Password Manager
                </p>
              </div>
            </div>
            
            <div className="flex items-center gap-4">
              <div className="flex items-center gap-2 text-slate-600 dark:text-slate-400">
                <UserIcon />
                <span className="font-medium">{user?.email}</span>
              </div>
              <button
                onClick={handleLogout}
                className="btn-danger flex items-center gap-2"
              >
                <LogoutIcon />
                Logout
              </button>
            </div>
          </div>
        </div>

        {/* Stats Cards */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
          <div className="card p-6 text-center">
            <div className="text-3xl font-bold text-blue-600 dark:text-blue-400 mb-2">
              {totalPasswords}
            </div>
            <div className="text-slate-600 dark:text-slate-400 text-sm">
              Total Passwords
            </div>
          </div>
          <div className="card p-6 text-center">
            <div className="text-3xl font-bold text-amber-500 dark:text-amber-400 mb-2">
              {favoriteCount}
            </div>
            <div className="text-slate-600 dark:text-slate-400 text-sm">
              Favorites
            </div>
          </div>
          <div className="card p-6 text-center">
            <div className="text-3xl font-bold text-green-500 dark:text-green-400 mb-2">
              {strongPasswordCount}
            </div>
            <div className="text-slate-600 dark:text-slate-400 text-sm">
              Strong Passwords
            </div>
          </div>
        </div>

        {/* Search and Actions */}
        <div className="card p-6 mb-8">
          <div className="flex flex-col lg:flex-row gap-4 items-start lg:items-center">
            <div className="flex-1 w-full">
              <div className="relative">
                <div className="absolute left-4 top-1/2 transform -translate-y-1/2">
                  <SearchIcon />
                </div>
                <input
                  type="text"
                  placeholder="Search passwords, websites, or usernames..."
                  className="input-field pl-12 pr-4"
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                  onKeyPress={(e) => e.key === 'Enter' && fetchPasswords()}
                />
              </div>
            </div>
            
            <div className="flex flex-wrap gap-3 items-center w-full lg:w-auto">
              <label className="flex items-center gap-2 px-4 py-2 bg-slate-100 dark:bg-slate-700 rounded-xl cursor-pointer transition-colors hover:bg-slate-200 dark:hover:bg-slate-600">
                <input
                  type="checkbox"
                  checked={filter.favorite}
                  onChange={(e) => setFilter({ ...filter, favorite: e.target.checked })}
                  className="rounded text-blue-500 focus:ring-blue-500"
                />
                <StarIcon />
                <span className="text-sm font-medium">Favorites</span>
              </label>
              
              <button
                onClick={fetchPasswords}
                disabled={isLoading}
                className="btn-secondary flex items-center gap-2 disabled:opacity-50"
              >
                <SearchIcon />
                {isLoading ? 'Searching...' : 'Search'}
              </button>
              
              <button
                onClick={() => setShowModal(true)}
                className="btn-primary flex items-center gap-2"
              >
                <PlusIcon />
                New Password
              </button>
            </div>
          </div>
        </div>

        {/* Password List */}
        <PasswordList 
          passwords={passwords} 
          onEdit={handleEdit} 
          onRefresh={fetchPasswords}
          isLoading={isLoading}
        />

        {/* Modal */}
        {showModal && (
          <PasswordModal item={editItem} onClose={handleCloseModal} />
        )}
      </div>
    </div>
  );
}
