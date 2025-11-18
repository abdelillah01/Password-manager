'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/hooks/useAuth';
import { passwordAPI, PasswordEntry } from '@/lib/api';
import { decrypt, keyStore, EncryptedData } from '@/lib/encryption';

import { 
  Lock, Plus, Search, Star, Folder, Eye, EyeOff, 
  Copy, Edit, Trash2, LogOut, Settings, Shield 
} from 'lucide-react';

export default function DashboardPage() {
  const router = useRouter();
  const { user, logout, isAuthenticated, hasEncryptionKey } = useAuth();
  
  const [passwords, setPasswords] = useState<PasswordEntry[]>([]);
  const [filteredPasswords, setFilteredPasswords] = useState<PasswordEntry[]>([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedFolder, setSelectedFolder] = useState<string>('all');
  const [isLoading, setIsLoading] = useState(true);
  
  // Decryption state
  const [decryptedPasswords, setDecryptedPasswords] = useState<Map<string, string>>(new Map());
  const [visiblePasswords, setVisiblePasswords] = useState<Set<string>>(new Set());
  
  useEffect(() => {
    if (!isAuthenticated) {
      router.push('/login');
      return;
    }
    
    if (!hasEncryptionKey) {
      // Need to re-enter master password
      router.push('/unlock');
      return;
    }
    
    loadPasswords();
  }, [isAuthenticated, hasEncryptionKey]);
  
  useEffect(() => {
    filterPasswords();
  }, [searchQuery, selectedFolder, passwords]);
  
  const loadPasswords = async () => {
    try {
      const data = await passwordAPI.list();
      setPasswords(data);
      setFilteredPasswords(data);
    } catch (error) {
      console.error('Failed to load passwords:', error);
    } finally {
      setIsLoading(false);
    }
  };
  
  const filterPasswords = () => {
    let filtered = passwords;
    
    if (selectedFolder !== 'all') {
      filtered = filtered.filter(p => p.folder === selectedFolder);
    }
    
    if (searchQuery) {
      filtered = filtered.filter(p => 
        p.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
        p.username.toLowerCase().includes(searchQuery.toLowerCase()) ||
        p.website.toLowerCase().includes(searchQuery.toLowerCase())
      );
    }
    
    setFilteredPasswords(filtered);
  };
  
  const decryptPassword = async (entry: PasswordEntry) => {
    const key = keyStore.getKey();
    if (!key) {
      alert('Session expired. Please re-enter your master password.');
      router.push('/unlock');
      return;
    }
    
    try {
      const encryptedData: EncryptedData = {
        ciphertext: entry.encrypted_password,
        iv: entry.encryption_iv,
        tag: entry.encryption_tag
      };
      
      const decrypted = await decrypt(encryptedData, key);
      setDecryptedPasswords(prev => new Map(prev).set(entry.id, decrypted));
      
      // Mark as accessed
      await passwordAPI.markAccessed(entry.id);
    } catch (error) {
      alert('Failed to decrypt password. Your session may have expired.');
      console.error('Decryption error:', error);
    }
  };
  
  const togglePasswordVisibility = async (entry: PasswordEntry) => {
    if (!decryptedPasswords.has(entry.id)) {
      await decryptPassword(entry);
    }
    
    setVisiblePasswords(prev => {
      const newSet = new Set(prev);
      if (newSet.has(entry.id)) {
        newSet.delete(entry.id);
      } else {
        newSet.add(entry.id);
      }
      return newSet;
    });
  };
  
  const copyToClipboard = async (entry: PasswordEntry) => {
    if (!decryptedPasswords.has(entry.id)) {
      await decryptPassword(entry);
    }
    
    const password = decryptedPasswords.get(entry.id);
    if (password) {
      await navigator.clipboard.writeText(password);
      // Show toast notification (you can add a toast library)
      alert('Password copied to clipboard!');
    }
  };
  
  const toggleFavorite = async (entry: PasswordEntry) => {
    try {
      await passwordAPI.toggleFavorite(entry.id);
      setPasswords(prev => 
        prev.map(p => p.id === entry.id ? { ...p, is_favorite: !p.is_favorite } : p)
      );
    } catch (error) {
      console.error('Failed to toggle favorite:', error);
    }
  };
  
  const handleLogout = async () => {
    await logout();
    router.push('/login');
  };
  
  if (isLoading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <Lock className="w-16 h-16 text-indigo-600 mx-auto mb-4 animate-pulse" />
          <p className="text-gray-600">Loading your vault...</p>
        </div>
      </div>
    );
  }
  
  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <header className="bg-white border-b border-gray-200">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-3">
              <div className="bg-indigo-600 p-2 rounded-lg">
                <Lock className="w-6 h-6 text-white" />
              </div>
              <div>
                <h1 className="text-xl font-bold text-gray-900">Password Manager</h1>
                <p className="text-sm text-gray-600">{user?.email}</p>
              </div>
            </div>
            
            <div className="flex items-center space-x-2">
              <button
                onClick={() => router.push('/settings')}
                className="p-2 text-gray-600 hover:text-gray-900 hover:bg-gray-100 rounded-lg transition"
              >
                <Settings className="w-5 h-5" />
              </button>
              <button
                onClick={handleLogout}
                className="flex items-center space-x-2 px-4 py-2 text-gray-700 hover:text-gray-900 hover:bg-gray-100 rounded-lg transition"
              >
                <LogOut className="w-5 h-5" />
                <span>Logout</span>
              </button>
            </div>
          </div>
        </div>
      </header>
      
      {/* Main Content */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Search and Add */}
        <div className="flex items-center justify-between mb-6">
          <div className="flex-1 max-w-md relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search passwords..."
              className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
            />
          </div>
          
          <button
            onClick={() => router.push('/passwords/new')}
            className="ml-4 flex items-center space-x-2 bg-indigo-600 text-white px-4 py-2 rounded-lg hover:bg-indigo-700 transition"
          >
            <Plus className="w-5 h-5" />
            <span>Add Password</span>
          </button>
        </div>
        
        {/* Folder Filter */}
        <div className="flex items-center space-x-2 mb-6 overflow-x-auto pb-2">
          {['all', 'personal', 'work', 'finance', 'social', 'other'].map(folder => (
            <button
              key={folder}
              onClick={() => setSelectedFolder(folder)}
              className={`px-4 py-2 rounded-lg font-medium whitespace-nowrap transition ${
                selectedFolder === folder
                  ? 'bg-indigo-600 text-white'
                  : 'bg-white text-gray-700 hover:bg-gray-100'
              }`}
            >
              {folder === 'all' ? 'All' : folder.charAt(0).toUpperCase() + folder.slice(1)}
            </button>
          ))}
        </div>
        
        {/* Password List */}
        {filteredPasswords.length === 0 ? (
          <div className="bg-white rounded-lg p-12 text-center">
            <Lock className="w-16 h-16 text-gray-400 mx-auto mb-4" />
            <h3 className="text-lg font-medium text-gray-900 mb-2">No passwords yet</h3>
            <p className="text-gray-600 mb-6">Start securing your accounts by adding your first password.</p>
            <button
              onClick={() => router.push('/passwords/new')}
              className="bg-indigo-600 text-white px-6 py-2 rounded-lg hover:bg-indigo-700 transition"
            >
              Add Password
            </button>
          </div>
        ) : (
          <div className="grid gap-4">
            {filteredPasswords.map(entry => (
              <div key={entry.id} className="bg-white rounded-lg border border-gray-200 p-4 hover:shadow-md transition">
                <div className="flex items-start justify-between">
                  <div className="flex-1">
                    <div className="flex items-center space-x-3 mb-2">
                      <h3 className="text-lg font-semibold text-gray-900">{entry.name}</h3>
                      {entry.is_favorite && (
                        <Star className="w-5 h-5 text-yellow-500 fill-current" />
                      )}
                      <span className="px-2 py-1 bg-gray-100 text-gray-700 text-xs rounded-full">
                        {entry.folder}
                      </span>
                    </div>
                    
                    {entry.username && (
                      <p className="text-sm text-gray-600 mb-1">Username: {entry.username}</p>
                    )}
                    
                    {entry.website && (
                      <a 
                        href={entry.website}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="text-sm text-indigo-600 hover:text-indigo-700"
                      >
                        {entry.website}
                      </a>
                    )}
                    
                    <div className="mt-3 flex items-center space-x-2">
                      <div className="flex-1 flex items-center bg-gray-50 rounded-lg px-3 py-2">
                        {visiblePasswords.has(entry.id) ? (
                          <span className="text-sm font-mono text-gray-900">
                            {decryptedPasswords.get(entry.id) || '••••••••'}
                          </span>
                        ) : (
                          <span className="text-sm text-gray-500">••••••••••••</span>
                        )}
                      </div>
                      
                      <button
                        onClick={() => togglePasswordVisibility(entry)}
                        className="p-2 text-gray-600 hover:text-gray-900 hover:bg-gray-100 rounded-lg transition"
                        title={visiblePasswords.has(entry.id) ? 'Hide' : 'Show'}
                      >
                        {visiblePasswords.has(entry.id) ? (
                          <EyeOff className="w-5 h-5" />
                        ) : (
                          <Eye className="w-5 h-5" />
                        )}
                      </button>
                      
                      <button
                        onClick={() => copyToClipboard(entry)}
                        className="p-2 text-gray-600 hover:text-gray-900 hover:bg-gray-100 rounded-lg transition"
                        title="Copy"
                      >
                        <Copy className="w-5 h-5" />
                      </button>
                      
                      <button
                        onClick={() => toggleFavorite(entry)}
                        className="p-2 text-gray-600 hover:text-yellow-500 hover:bg-gray-100 rounded-lg transition"
                        title="Favorite"
                      >
                        <Star className={`w-5 h-5 ${entry.is_favorite ? 'fill-current text-yellow-500' : ''}`} />
                      </button>
                      
                      <button
                        onClick={() => router.push(`/passwords/edit/${entry.id}`)}
                        className="p-2 text-gray-600 hover:text-gray-900 hover:bg-gray-100 rounded-lg transition"
                        title="Edit"
                      >
                        <Edit className="w-5 h-5" />
                      </button>
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
