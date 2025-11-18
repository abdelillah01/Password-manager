import { create } from 'zustand';
import { useEffect, useRef } from 'react';
import { authAPI, twoFactorAPI, type User } from '@/lib/api';
import {
  keyStore,
  deriveKey,
  generateSalt,
  arrayBufferToBase64
} from '@/lib/encryption';
import Cookies from 'js-cookie';

/**
 * Converts any buffer to a proper ArrayBuffer (required by WebCrypto)
 */
function toArrayBuffer(input: ArrayBuffer | SharedArrayBuffer | Uint8Array): ArrayBuffer {
  if (input instanceof ArrayBuffer) return input;
  if (input instanceof SharedArrayBuffer) {
    const copy = new Uint8Array(input.byteLength);
    copy.set(new Uint8Array(input));
    return copy.buffer;
  }
  if (input instanceof Uint8Array) {
    return input.slice().buffer;
  }
  throw new Error('Invalid buffer type');
}

interface AuthState {
  user: User | null;
  isAuthenticated: boolean;
  isLoading: boolean;
  requires2FA: boolean;
  hasCheckedAuth: boolean;

  login: (email: string, password: string) => Promise<{ requires2FA: boolean }>;
  register: (data: {
    email: string;
    username: string;
    password: string;
    passwordConfirm: string;
    masterPasswordHint?: string;
  }) => Promise<void>;

  logout: () => Promise<void>;
  verify2FA: (token: string, backupCode?: boolean) => Promise<void>;
  loadUser: () => Promise<void>;
  clearAuth: () => void;
}

export const useAuthStore = create<AuthState>((set, get) => ({
  user: null,
  isAuthenticated: false,
  isLoading: false,
  requires2FA: false,
  hasCheckedAuth: false,

  login: async (email, password) => {
    set({ isLoading: true });
    try {
      const response = await authAPI.login({ email, password });

      if (response.requires_2fa) {
        set({
          user: response.user,
          requires2FA: true,
          isLoading: false,
          hasCheckedAuth: true
        });
        return { requires2FA: true };
      }

      // Get KDF parameters from server
      const kdf = await authAPI.getKdfParams();
      const saltBytes = Uint8Array.from(atob(kdf.kdf_salt), c => c.charCodeAt(0));
      const saltBuffer = toArrayBuffer(saltBytes);

      const encryptionKey = await deriveKey(password, saltBuffer, kdf.kdf_iterations);
      keyStore.setKey(encryptionKey);

      set({
        user: response.user,
        isAuthenticated: true,
        requires2FA: false,
        isLoading: false,
        hasCheckedAuth: true
      });

      return { requires2FA: false };
    } catch (error: any) {
      set({ isLoading: false, hasCheckedAuth: true });
      throw new Error(error.response?.data?.detail || 'Login failed');
    }
  },

  register: async (data) => {
    set({ isLoading: true });
    try {
      const salt = generateSalt();
      const saltBuffer = toArrayBuffer(salt);

      const encryptionKey = await deriveKey(data.password, saltBuffer);

      const registerData = {
        email: data.email,
        username: data.username,
        password: data.password,
        password_confirm: data.passwordConfirm,
        kdf_salt: arrayBufferToBase64(saltBuffer),
        kdf_iterations: 100000,
        master_password_hint: data.masterPasswordHint
      };

      const response = await authAPI.register(registerData);
      keyStore.setKey(encryptionKey);

      set({
        user: response.user,
        isAuthenticated: true,
        isLoading: false,
        hasCheckedAuth: true
      });
    } catch (error: any) {
      set({ isLoading: false, hasCheckedAuth: true });
      const msg =
        error.response?.data?.email?.[0] ||
        error.response?.data?.password?.[0] ||
        'Registration failed';
      throw new Error(msg);
    }
  },

  logout: async () => {
    try {
      await authAPI.logout();
    } catch (_) {}
    keyStore.clearKey();
    set({ 
      user: null, 
      isAuthenticated: false, 
      requires2FA: false,
      hasCheckedAuth: true 
    });
  },

  verify2FA: async (token: string, backupCode = false) => {
    set({ isLoading: true });
    try {
      await twoFactorAPI.verifyLogin(token, backupCode);
      set({ 
        isAuthenticated: true, 
        requires2FA: false, 
        isLoading: false,
        hasCheckedAuth: true 
      });
    } catch (error: any) {
      set({ isLoading: false, hasCheckedAuth: true });
      throw new Error(error.response?.data?.error || 'Invalid 2FA code');
    }
  },

  loadUser: async () => {
    set({ isLoading: true });
    const token = Cookies.get('access_token');
    if (!token) {
      set({ 
        isAuthenticated: false, 
        user: null, 
        isLoading: false,
        hasCheckedAuth: true 
      });
      return;
    }
    try {
      const user = await authAPI.getCurrentUser();
      set({ 
        user, 
        isAuthenticated: true, 
        isLoading: false,
        hasCheckedAuth: true 
      });
    } catch (_) {
      set({ 
        isAuthenticated: false, 
        user: null, 
        isLoading: false,
        hasCheckedAuth: true 
      });
      Cookies.remove('access_token');
      Cookies.remove('refresh_token');
    }
  },

  clearAuth: () => {
    keyStore.clearKey();
    set({ 
      user: null, 
      isAuthenticated: false, 
      requires2FA: false,
      hasCheckedAuth: true 
    });
  }
}));

export function useAuth() {
  const store = useAuthStore();
  const hasLoadedRef = useRef(false);

  // Auto-load user on mount - ONLY ONCE
  useEffect(() => {
    if (!hasLoadedRef.current && !store.hasCheckedAuth && !store.isLoading) {
      hasLoadedRef.current = true;
      store.loadUser();
    }
  }, []); // Empty deps - only run once

  return {
    user: store.user,
    isAuthenticated: store.isAuthenticated,
    isLoading: store.isLoading,
    requires2FA: store.requires2FA,
    hasCheckedAuth: store.hasCheckedAuth,
    login: store.login,
    register: store.register,
    logout: store.logout,
    verify2FA: store.verify2FA,
    loadUser: store.loadUser,
    clearAuth: store.clearAuth,
    hasEncryptionKey: keyStore.hasKey()
  };
}