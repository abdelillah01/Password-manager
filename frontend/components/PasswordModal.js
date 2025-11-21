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

  useEffect(() => {
    if (item) {
      const loadItem = async () => {
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
        }
      };
      loadItem();
    }
  }, [item, masterKey]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!masterKey) return;

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
    }
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center">
      <div className="bg-white p-8 rounded-lg shadow-lg w-96">
        <h2 className="text-2xl font-bold mb-6">{item ? 'Edit' : 'New'} Password</h2>
        <form onSubmit={handleSubmit} className="space-y-4">
          <input
            type="text"
            placeholder="Website"
            className="w-full p-3 border rounded-lg"
            value={formData.website}
            onChange={(e) => setFormData({ ...formData, website: e.target.value })}
          />
          <input
            type="text"
            placeholder="Username"
            className="w-full p-3 border rounded-lg"
            value={formData.username}
            onChange={(e) => setFormData({ ...formData, username: e.target.value })}
          />
          <input
            type="password"
            placeholder="Password"
            className="w-full p-3 border rounded-lg"
            value={formData.password}
            onChange={(e) => setFormData({ ...formData, password: e.target.value })}
            required
          />
          <input
            type="text"
            placeholder="Folder"
            className="w-full p-3 border rounded-lg"
            value={formData.folder}
            onChange={(e) => setFormData({ ...formData, folder: e.target.value })}
          />
          <label className="flex items-center gap-2">
            <input
              type="checkbox"
              checked={formData.favorite}
              onChange={(e) => setFormData({ ...formData, favorite: e.target.checked })}
            />
            <span>Mark as favorite</span>
          </label>
          <div className="flex gap-4">
            <button
              type="submit"
              className="flex-1 bg-blue-600 text-white p-3 rounded-lg hover:bg-blue-700"
            >
              Save
            </button>
            <button
              type="button"
              onClick={onClose}
              className="flex-1 bg-gray-300 p-3 rounded-lg hover:bg-gray-400"
            >
              Cancel
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
