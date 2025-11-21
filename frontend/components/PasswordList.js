'use client';
import { useState } from 'react';
import axios from 'axios';
import { CryptoService } from '@/lib/crypto';
import { useAuthStore } from '@/lib/store';

axios.defaults.withCredentials = true;

export default function PasswordList({ passwords, onEdit, onRefresh }) {
  const masterKey = useAuthStore(state => state.masterKey);
  const [revealed, setRevealed] = useState({});

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

  const handleDelete = async (id) => {
    if (!confirm('Delete this password?')) return;
    try {
      await axios.delete(`http://localhost:8000/api/items/${id}/`);
      onRefresh();
    } catch (err) {
      console.error('Delete failed:', err);
    }
  };

  return (
    <div className="grid gap-4">
      {passwords.map((item) => (
        <div key={item.id} className="bg-white p-6 rounded-lg shadow-md">
          <div className="flex justify-between items-start">
            <div className="flex-1">
              <div className="flex items-center gap-2 mb-2">
                <h3 className="text-lg font-semibold">{item.website || 'Untitled'}</h3>
                {item.favorite && <span className="text-yellow-500">⭐</span>}
              </div>
              <p className="text-gray-600">Username: {item.username}</p>
              <p className="text-gray-600">Folder: {item.folder || 'None'}</p>
              <div className="mt-2">
                <p className="text-sm text-gray-500">
                  Password: {revealed[item.id] ? revealed[item.id] : '••••••••'}
                </p>
              </div>
            </div>
            <div className="flex gap-2">
              <button
                onClick={() => handleReveal(item)}
                className="bg-gray-200 px-4 py-2 rounded hover:bg-gray-300"
              >
                {revealed[item.id] ? 'Hide' : 'Show'}
              </button>
              <button
                onClick={() => onEdit(item)}
                className="bg-blue-500 text-white px-4 py-2 rounded hover:bg-blue-600"
              >
                Edit
              </button>
              <button
                onClick={() => handleDelete(item.id)}
                className="bg-red-500 text-white px-4 py-2 rounded hover:bg-red-600"
              >
                Delete
              </button>
            </div>
          </div>
        </div>
      ))}
    </div>
  );
}
