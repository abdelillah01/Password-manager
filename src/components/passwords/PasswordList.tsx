'use client';

import { useState, useEffect } from 'react';
import { passwordAPI } from '@/lib/api';
import type { PasswordEntry } from '@/lib/api';
import PasswordCard from './PasswordCard';
import { Lock, Plus } from 'lucide-react';
import toast from 'react-hot-toast';

interface PasswordListProps {
  searchQuery: string;
  selectedFolder: string;
  onAddClick: () => void;
  onEditClick: (entry: PasswordEntry) => void;
  refreshTrigger?: number;
}

export default function PasswordList({ 
  searchQuery, 
  selectedFolder, 
  onAddClick,
  onEditClick,
  refreshTrigger 
}: PasswordListProps) {
  const [passwords, setPasswords] = useState<PasswordEntry[]>([]);
  const [filteredPasswords, setFilteredPasswords] = useState<PasswordEntry[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    loadPasswords();
  }, [refreshTrigger]);

  useEffect(() => {
    filterPasswords();
  }, [passwords, searchQuery, selectedFolder]);

  const loadPasswords = async () => {
    try {
      setIsLoading(true);
      const data = await passwordAPI.list();
      // FIX 1: Handle potential undefined data
      setPasswords(data || []);
    } catch (error) {
      console.error('Failed to load passwords:', error);
      toast.error('Failed to load passwords');
    } finally {
      setIsLoading(false);
    }
  };

  const filterPasswords = () => {
    let filtered = passwords;

    // Filter by folder - FIX 3: Consistent type comparison
    if (selectedFolder !== 'all') {
      filtered = filtered.filter(p => p.folder?.toString() === selectedFolder?.toString());
    }

    // Filter by search query - FIX 2: Safe website access
    if (searchQuery) {
      const query = searchQuery.toLowerCase();
      filtered = filtered.filter(p =>
        p.name.toLowerCase().includes(query) ||
        p.username.toLowerCase().includes(query) ||
        p.website?.toLowerCase().includes(query)
      );
    }

    setFilteredPasswords(filtered);
  };

  const handleDelete = async (id: string) => {
    if (!confirm('Are you sure you want to delete this password?')) {
      return;
    }

    try {
      await passwordAPI.delete(id);
      setPasswords(prev => prev.filter(p => p.id.toString() !== id));
      toast.success('Password deleted successfully');
    } catch (error) {
      console.error('Failed to delete password:', error);
      toast.error('Failed to delete password');
    }
  };

  const handleToggleFavorite = async (id: string) => {
    try {
      const result = await passwordAPI.toggleFavorite(id);
      setPasswords(prev =>
        prev.map(p => p.id.toString() === id ? { ...p, is_favorite: result.is_favorite } : p)
      );
    } catch (error) {
      console.error('Failed to toggle favorite:', error);
      toast.error('Failed to update favorite');
    }
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-20">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-indigo-600 mx-auto mb-4"></div>
          <p className="text-gray-600">Loading your passwords...</p>
        </div>
      </div>
    );
  }

  if (passwords.length === 0) {
    return (
      <div className="bg-white rounded-lg p-12 text-center fade-in">
        <div className="bg-indigo-100 w-20 h-20 rounded-full flex items-center justify-center mx-auto mb-6">
          <Lock className="w-10 h-10 text-indigo-600" />
        </div>
        <h3 className="text-xl font-bold text-gray-900 mb-2">No passwords yet</h3>
        <p className="text-gray-600 mb-6">
          Start securing your accounts by adding your first password.
        </p>
        <button
          onClick={onAddClick}
          className="btn-primary inline-flex items-center space-x-2"
        >
          <Plus className="w-5 h-5" />
          <span>Add Your First Password</span>
        </button>
      </div>
    );
  }

  if (filteredPasswords.length === 0) {
    return (
      <div className="bg-white rounded-lg p-12 text-center fade-in">
        <div className="text-gray-400 text-6xl mb-4">🔍</div>
        <h3 className="text-xl font-bold text-gray-900 mb-2">No passwords found</h3>
        <p className="text-gray-600">
          Try adjusting your search or filter criteria
        </p>
      </div>
    );
  }

  return (
    <div className="grid gap-4 fade-in">
      {filteredPasswords.map(entry => {
        // create a version of the entry with a numeric id to satisfy PasswordCard's expected type
        const cardEntry = { ...entry, id: Number(entry.id) } as any;

        return (
          <PasswordCard
            key={entry.id}
            entry={cardEntry}
            onEdit={() => onEditClick(entry)}
            // keep using the original string id for API calls
            onDelete={() => handleDelete(entry.id.toString())}
            onToggleFavorite={() => handleToggleFavorite(entry.id.toString())}
          />
        );
      })}
    </div>
  );
}