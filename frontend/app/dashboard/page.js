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
  const [filter, setFilter] = useState({ folder: '', favorite: false, strength: '' });
  const [isLoading, setIsLoading] = useState(false);
  const [activeTab, setActiveTab] = useState('all');

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
      if (filter.strength) params.append('strength', filter.strength);

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

  // Calculate statistics
  const totalPasswords = passwords.length;
  const favoriteCount = passwords.filter(p => p.favorite).length;
  const weakPasswordCount = passwords.filter(p => p.strength === 'weak').length;
  const strongPasswordCount = passwords.filter(p => p.strength === 'strong').length;
  const folders = [...new Set(passwords.map(p => p.folder).filter(Boolean))];

  // SVG Icons
  const ShieldIcon = () => (
    <svg className="w-6 h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
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

  const FilterIcon = () => (
    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 4a1 1 0 011-1h16a1 1 0 011 1v2.586a1 1 0 01-.293.707l-6.414 6.414a1 1 0 00-.293.707V17l-4 4v-6.586a1 1 0 00-.293-.707L3.293 7.293A1 1 0 013 6.586V4z" />
    </svg>
  );

  const RefreshIcon = () => (
    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
    </svg>
  );

  return (
    <div className="min-h-screen bg-slate-50 dark:bg-slate-950">
      {/* Top Navigation */}
      <header className="sticky top-0 z-40 bg-white/80 dark:bg-slate-900/80 backdrop-blur-md border-b border-slate-200 dark:border-slate-800">
        <div className="container mx-auto px-6 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              <div className="p-2 bg-gradient-to-r from-blue-600 to-blue-500 rounded-lg">
                <ShieldIcon />
              </div>
              <div>
                <h1 className="text-xl font-semibold text-slate-900 dark:text-white">CipherVault</h1>
                <p className="text-xs text-slate-500 dark:text-slate-400">Secure Password Manager</p>
              </div>
            </div>
            
            <div className="flex items-center gap-6">
              {/* Search Bar */}
              <div className="relative hidden md:block">
                <div className="absolute inset-y-0 left-3 flex items-center pointer-events-none">
                  <SearchIcon />
                </div>
                <input
                  type="text"
                  placeholder="Search passwords..."
                  className="pl-10 pr-4 py-2 bg-slate-100 dark:bg-slate-800 border border-slate-300 dark:border-slate-700 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent w-64"
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                  onKeyPress={(e) => e.key === 'Enter' && fetchPasswords()}
                />
              </div>
              
              <div className="flex items-center gap-4">
                <div className="hidden sm:flex items-center gap-2 text-slate-600 dark:text-slate-400">
                  <UserIcon />
                  <span className="text-sm">{user?.email}</span>
                </div>
                <button
                  onClick={handleLogout}
                  className="px-4 py-2 text-sm bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-300 rounded-lg transition-colors flex items-center gap-2"
                >
                  <LogoutIcon />
                  <span className="hidden sm:inline">Logout</span>
                </button>
              </div>
            </div>
          </div>
        </div>
      </header>

      <div className="container mx-auto px-6 py-8">
        <div className="grid grid-cols-1 lg:grid-cols-4 gap-8">
          {/* Sidebar */}
          <div className="lg:col-span-1">
            <div className="space-y-6">
              {/* Quick Stats */}
              

              {/* Quick Actions */}
              <div className="bg-white dark:bg-slate-900 rounded-xl border border-slate-200 dark:border-slate-800 p-6">
                <h3 className="font-semibold text-slate-900 dark:text-white mb-4">Quick Actions</h3>
                <div className="space-y-3">
                  <button
                    onClick={() => setShowModal(true)}
                    className="w-full bg-blue-600 hover:bg-blue-700 text-white py-2.5 px-4 rounded-lg transition-colors flex items-center justify-center gap-2"
                  >
                    <PlusIcon />
                    Add New Password
                  </button>
                  <button
                    onClick={fetchPasswords}
                    disabled={isLoading}
                    className="w-full bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-300 py-2.5 px-4 rounded-lg transition-colors flex items-center justify-center gap-2 disabled:opacity-50"
                  >
                    <RefreshIcon />
                    {isLoading ? 'Refreshing...' : 'Refresh List'}
                  </button>
                </div>
              </div>

              {/* Filters */}
              <div className="bg-white dark:bg-slate-900 rounded-xl border border-slate-200 dark:border-slate-800 p-6">
                <div className="flex items-center gap-2 mb-4">
                  <FilterIcon />
                  <h3 className="font-semibold text-slate-900 dark:text-white">Filters</h3>
                </div>
                <div className="space-y-4">
                  <div>
                    <label className="block text-sm text-slate-600 dark:text-slate-400 mb-2">By Strength</label>
                    <select
                      className="w-full bg-slate-50 dark:bg-slate-800 border border-slate-300 dark:border-slate-700 rounded-lg px-3 py-2 text-sm"
                      value={filter.strength}
                      onChange={(e) => setFilter({ ...filter, strength: e.target.value })}
                    >
                      <option value="">All Strengths</option>
                      <option value="strong">Strong Only</option>
                      <option value="medium">Medium Only</option>
                      <option value="weak">Weak Only</option>
                    </select>
                  </div>
                  <div>
                    <label className="block text-sm text-slate-600 dark:text-slate-400 mb-2">By Folder</label>
                    <select
                      className="w-full bg-slate-50 dark:bg-slate-800 border border-slate-300 dark:border-slate-700 rounded-lg px-3 py-2 text-sm"
                      value={filter.folder}
                      onChange={(e) => setFilter({ ...filter, folder: e.target.value })}
                    >
                      <option value="">All Folders</option>
                      {folders.map((folder) => (
                        <option key={folder} value={folder}>{folder}</option>
                      ))}
                    </select>
                  </div>
                  <label className="flex items-center gap-2">
                    <input
                      type="checkbox"
                      checked={filter.favorite}
                      onChange={(e) => setFilter({ ...filter, favorite: e.target.checked })}
                      className="rounded border-slate-300 dark:border-slate-700 text-blue-600 focus:ring-blue-500"
                    />
                    <span className="text-sm text-slate-600 dark:text-slate-400">Favorites Only</span>
                  </label>
                  <button
                    onClick={() => setFilter({ folder: '', favorite: false, strength: '' })}
                    className="w-full text-sm text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white py-2"
                  >
                    Clear Filters
                  </button>
                </div>
              </div>
            </div>
          </div>

          {/* Main Content */}
          <div className="lg:col-span-3">
            {/* Header */}
            <div className="mb-8">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-6">
                <div>
                  <h2 className="text-2xl font-bold text-slate-900 dark:text-white">Your Passwords</h2>
                  <p className="text-slate-600 dark:text-slate-400 mt-1">
                    {totalPasswords} password{totalPasswords !== 1 ? 's' : ''} stored securely
                  </p>
                </div>
                
                {/* Mobile Search */}
                <div className="relative sm:hidden">
                  <div className="absolute inset-y-0 left-3 flex items-center pointer-events-none">
                    <SearchIcon />
                  </div>
                  <input
                    type="text"
                    placeholder="Search passwords..."
                    className="w-full pl-10 pr-4 py-2 bg-slate-100 dark:bg-slate-800 border border-slate-300 dark:border-slate-700 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    value={search}
                    onChange={(e) => setSearch(e.target.value)}
                    onKeyPress={(e) => e.key === 'Enter' && fetchPasswords()}
                  />
                </div>
              </div>

              {/* Tabs */}
              <div className="flex space-x-1 border-b border-slate-200 dark:border-slate-800">
                {['all', 'weak', 'favorites'].map((tab) => (
                  <button
                    key={tab}
                    className={`px-4 py-2 text-sm font-medium rounded-t-lg transition-colors ${
                      activeTab === tab
                        ? 'text-blue-600 dark:text-blue-400 border-b-2 border-blue-500'
                        : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-slate-300'
                    }`}
                    onClick={() => {
                      setActiveTab(tab);
                      if (tab === 'weak') setFilter({ ...filter, strength: 'weak' });
                      else if (tab === 'favorites') setFilter({ ...filter, favorite: true });
                      else setFilter({ ...filter, strength: '', favorite: false });
                    }}
                  >
                    {tab === 'all' && 'All Passwords'}
                    {tab === 'weak' && `Weak (${weakPasswordCount})`}
                    {tab === 'favorites' && `Favorites (${favoriteCount})`}
                  </button>
                ))}
              </div>
            </div>

            {/* Password List */}
            <PasswordList 
              passwords={passwords} 
              onEdit={handleEdit} 
              onRefresh={fetchPasswords}
              isLoading={isLoading}
            />

            {/* Empty State */}
            {!isLoading && passwords.length === 0 && (
              <div className="text-center py-12">
                <div className="w-16 h-16 bg-blue-100 dark:bg-blue-900/30 rounded-full flex items-center justify-center mx-auto mb-4">
                  <ShieldIcon className="w-8 h-8 text-blue-600 dark:text-blue-400" />
                </div>
                <h3 className="text-lg font-semibold text-slate-900 dark:text-white mb-2">
                  No passwords yet
                </h3>
                <p className="text-slate-600 dark:text-slate-400 mb-6">
                  Add your first password to get started
                </p>
                <button
                  onClick={() => setShowModal(true)}
                  className="bg-blue-600 hover:bg-blue-700 text-white py-2.5 px-6 rounded-lg transition-colors inline-flex items-center gap-2"
                >
                  <PlusIcon />
                  Add New Password
                </button>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Modal */}
      {showModal && (
        <PasswordModal item={editItem} onClose={handleCloseModal} />
      )}
    </div>
  );
}