import { create } from 'zustand';

export const useAuthStore = create((set) => ({
  user: null,
  masterKey: null,
  salt: null,
  setAuth: (user, key, salt) => set({ user, masterKey: key, salt }),
  clearAuth: () => set({ user: null, masterKey: null, salt: null }),
}));

export const usePasswordStore = create((set) => ({
  passwords: [],
  setPasswords: (passwords) => set({ passwords }),
  addPassword: (password) => set((state) => ({ passwords: [password, ...state.passwords] })),
  updatePassword: (id, password) => set((state) => ({
    passwords: state.passwords.map(p => p.id === id ? password : p)
  })),
  deletePassword: (id) => set((state) => ({
    passwords: state.passwords.filter(p => p.id !== id)
  })),
}));
