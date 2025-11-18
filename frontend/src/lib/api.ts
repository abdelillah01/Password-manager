import axios, { type AxiosError, type AxiosInstance, type InternalAxiosRequestConfig } from 'axios';
import Cookies from 'js-cookie';
import type {
  User,
  PasswordEntry,
  RegisterData,
  LoginCredentials,
  LoginResponse,
  TwoFactorSetupResponse,
  TwoFactorStatus,
  PasswordGeneratorOptions,
  FolderCount,
  PasswordStats,
  KdfParams
} from '@/types';

// Types
// export type { User, PasswordEntry, LoginCredentials, RegisterData, LoginResponse } from '@/types';

const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000';
// Create axios instance
const api: AxiosInstance = axios.create({
  baseURL: API_BASE_URL,
  headers: {
    'Content-Type': 'application/json',
  },
  withCredentials: true, // Important for CSRF cookies
});

// Request interceptor to add auth token
api.interceptors.request.use(
  (config: InternalAxiosRequestConfig) => {
    const token = Cookies.get('access_token');
    if (token && config.headers) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    
    // Add CSRF token if available
    const csrfToken = Cookies.get('csrftoken');
    if (csrfToken && config.headers) {
      config.headers['X-CSRFToken'] = csrfToken;
    }
    
    return config;
  },
  (error) => Promise.reject(error)
);

// Response interceptor to handle token refresh
api.interceptors.response.use(
  (response) => {
    console.log('📥 API Response:', {
      method: response.config.method?.toUpperCase(),
      url: response.config.url,
      status: response.status,
      statusText: response.statusText,
      hasData: !!response.data,
      timestamp: new Date().toISOString()
    });
    return response;
  },
  async (error: AxiosError) => {
    console.error('❌ API Error:', {
      message: error.message,
      code: error.code,
      status: error.response?.status,
      statusText: error.response?.statusText,
      url: error.config?.url,
      method: error.config?.method?.toUpperCase(),
      responseData: error.response?.data,
      timestamp: new Date().toISOString()
    });
    
    const originalRequest = error.config as InternalAxiosRequestConfig & { _retry?: boolean };
    
    // If 401 and not already retried, try to refresh token
    if (error.response?.status === 401 && !originalRequest._retry) {
      originalRequest._retry = true;
      
      try {
        const refreshToken = Cookies.get('refresh_token');
        if (refreshToken) {
          console.log('🔄 Attempting token refresh...');
          const response = await axios.post(`${API_BASE_URL}/api/auth/token/refresh/`, {
            refresh: refreshToken
          });
          
          const { access } = response.data;
          Cookies.set('access_token', access, { secure: true, sameSite: 'strict' });
          console.log('✅ Token refreshed successfully');
          
          if (originalRequest.headers) {
            originalRequest.headers.Authorization = `Bearer ${access}`;
          }
          return api(originalRequest);
        }
      } catch (refreshError) {
        console.error('❌ Token refresh failed:', refreshError);
        // Refresh failed, clear tokens and redirect to login
        Cookies.remove('access_token');
        Cookies.remove('refresh_token');
        window.location.href = '/login';
        return Promise.reject(refreshError);
      }
    }
    
    return Promise.reject(error);
  }
);

// Types
export interface User {
  id: string;
  email: string;
  username: string;
  email_verified: boolean;
  two_factor_enabled: boolean;
  kdf_salt: string;
  kdf_iterations: number;
  master_password_hint?: string;
  created_at: string;
  last_password_change: string;
}

export interface PasswordEntry {
  id: string;
  name: string;
  username: string;
  website: string;
  folder: string;
  encrypted_password: string;
  encryption_iv: string;
  encryption_tag: string;
  encrypted_notes?: string;
  notes_iv?: string;
  notes_tag?: string;
  is_favorite: boolean;
  created_at: string;
  updated_at: string;
  last_accessed?: string;
}

export interface RegisterData {
  email: string;
  username: string;
  password: string;
  password_confirm: string;
  kdf_salt: string;
  kdf_iterations: number;
  master_password_hint?: string;
}

export interface LoginData {
  email: string;
  password: string;
}

export interface LoginResponse {
  access: string;
  refresh: string;
  user: User;
  requires_2fa: boolean;
}

// Auth API
export const authAPI = {
  async register(data: RegisterData) {
    console.log('🔐 Starting registration...', {
      email: data.email,
      username: data.username,
      hasSalt: !!data.kdf_salt,
      saltLength: data.kdf_salt?.length,
      iterations: data.kdf_iterations,
      timestamp: new Date().toISOString()
    });
    
    try {
      const response = await api.post<{
        user: User;
        tokens: { access: string; refresh: string };
        message: string;
      }>('/api/auth/register/', data);
      
      console.log('✅ Registration successful:', {
        userId: response.data.user.id,
        email: response.data.user.email,
        hasTokens: !!(response.data.tokens.access && response.data.tokens.refresh),
        timestamp: new Date().toISOString()
      });
      
      // Store tokens
      Cookies.set('access_token', response.data.tokens.access, { 
        secure: true, 
        sameSite: 'strict',
        expires: 0.01 // 15 minutes
      });
      Cookies.set('refresh_token', response.data.tokens.refresh, { 
        secure: true, 
        sameSite: 'strict',
        expires: 7 // 7 days
      });
      
      console.log('✅ Tokens stored in cookies');
      
      return response.data;
    } catch (error: any) {
      console.error('❌ Registration failed:', {
        status: error.response?.status,
        statusText: error.response?.statusText,
        data: error.response?.data,
        message: error.message,
        timestamp: new Date().toISOString()
      });
      throw error;
    }
  },
  
  async login(data: LoginCredentials) {
    const response = await api.post<LoginResponse>('/api/auth/login/', data);
    
    // Store tokens
    Cookies.set('access_token', response.data.access, { 
      secure: true, 
      sameSite: 'strict',
      expires: 0.01
    });
    Cookies.set('refresh_token', response.data.refresh, { 
      secure: true, 
      sameSite: 'strict',
      expires: 7
    });
    
    return response.data;
  },
  
  async logout() {
    const refreshToken = Cookies.get('refresh_token');
    await api.post('/api/auth/logout/', { refresh_token: refreshToken });
    
    Cookies.remove('access_token');
    Cookies.remove('refresh_token');
  },
  
  async verifyEmail(token: string) {
    const response = await api.post('/api/auth/verify-email/', { token });
    return response.data;
  },
  
  async getKdfParams(): Promise<KdfParams> {
    const response = await api.get<KdfParams>('/api/auth/kdf-params/');
    return response.data;
  },
  
  async getCurrentUser(): Promise<User> {
    const response = await api.get<User>('/api/user/');
    return response.data;
  },
  
  async changePassword(data: {
    old_password: string;
    new_password: string;
    new_kdf_salt: string;
  }) {
    const response = await api.post('/api/user/change-password/', data);
    return response.data;
  }
};

// Password API
export const passwordAPI = {
  async list(params?: { folder?: string; is_favorite?: boolean; search?: string }) {
    const response = await api.get<PasswordEntry[]>('/api/passwords/', { params });
    return response.data;
  },
  
  async get(id: string) {
    const response = await api.get<PasswordEntry>(`/api/passwords/${id}/`);
    return response.data;
  },
  
  async create(data: Omit<PasswordEntry, 'id' | 'created_at' | 'updated_at' | 'last_accessed'>) {
    const response = await api.post<PasswordEntry>('/api/passwords/', data);
    return response.data;
  },
  
  async update(id: string, data: Partial<PasswordEntry>) {
    const response = await api.patch<PasswordEntry>(`/api/passwords/${id}/`, data);
    return response.data;
  },
  
  async delete(id: string) {
    await api.delete(`/api/passwords/${id}/`);
  },
  
  async toggleFavorite(id: string) {
    const response = await api.post<{ is_favorite: boolean }>(`/api/passwords/${id}/toggle_favorite/`);
    return response.data;
  },
  
  async markAccessed(id: string) {
    await api.post(`/api/passwords/${id}/mark_accessed/`);
  },
  
  async getHistory(id: string) {
    const response = await api.get(`/api/passwords/${id}/history/`);
    return response.data;
  },
  
  async generate(options: PasswordGeneratorOptions) {
    const response = await api.post<{ password: string }>('/api/passwords/generate/', options);
    return response.data;
  },
  
  async getStats(): Promise<PasswordStats> {
    const response = await api.get<PasswordStats>('/api/passwords/stats/');
    return response.data;
  },
  
  async getFolders(): Promise<FolderCount[]> {
    const response = await api.get<FolderCount[]>('/api/passwords/folders/');
    return response.data;
  }
};

// 2FA API
export const twoFactorAPI = {
  async setup(): Promise<TwoFactorSetupResponse> {
    const response = await api.post<TwoFactorSetupResponse>('/api/2fa/setup/');
    return response.data;
  },
  
  async verifySetup(token: string) {
    const response = await api.post('/api/2fa/verify-setup/', { token });
    return response.data;
  },
  
  async verifyLogin(token: string, useBackupCode: boolean = false) {
    const response = await api.post('/api/2fa/verify/', {
      token,
      use_backup_code: useBackupCode
    });
    return response.data;
  },
  
  async disable(password: string) {
    const response = await api.post('/api/2fa/disable/', { password });
    return response.data;
  },
  
  async getStatus(): Promise<TwoFactorStatus> {
    const response = await api.get<TwoFactorStatus>('/api/2fa/status/');
    return response.data;
  }
};

export default api;