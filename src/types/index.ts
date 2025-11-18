// User types
export interface User {
  id: number;
  email: string;
  first_name: string;
  last_name: string;
  is_2fa_enabled: boolean;
  created_at: string;
  updated_at: string;
}

export interface LoginCredentials {
  email: string;
  password: string;
  totp_code?: string;
}

export interface RegisterData {
  first_name: string;
  last_name: string;
  email: string;
  password: string;
  confirm_password: string;
}

// Password types
export interface PasswordEntry {
  id: number;
  title?: string;        // Make optional since API might not provide it
  name: string;          // API probably uses this
  website?: string;
  username: string;
  encrypted_password: string;
  notes?: string;
  category?: string;
  folder?: string;
  is_favorite: boolean;
  encryption_iv: string;
  encryption_tag: string;
  last_accessed?: string;
  created_at: string;
  updated_at: string;
}

// Helper to get display name
export const getPasswordDisplayName = (entry: PasswordEntry): string => {
  return entry.title || entry.name || 'Untitled';
};
export interface CreatePasswordData {
  title: string;
  website?: string;
  username: string;
  password: string;
  notes?: string;
  category?: string;
}

export interface UpdatePasswordData extends Partial<CreatePasswordData> {
  id: number;
}

export interface DecryptedPassword {
  id: number;
  password: string;
}

// 2FA types
export interface TwoFactorSetup {
  secret: string;
  qr_code_url: string;
}

export interface TwoFactorVerify {
  totp_code: string;
}

export interface TwoFactorBackupCode {
  code: string;
  used: boolean;
}

// API response types
export interface ApiResponse<T = any> {
  data?: T;
  message?: string;
  error?: string;
  status: number;
}

export interface PaginatedResponse<T> {
  count: number;
  next: string | null;
  previous: string | null;
  results: T[];
}

// Auth context types
export interface AuthContextType {
  user: User | null;
  isLoading: boolean;
  login: (credentials: LoginCredentials) => Promise<void>;
  register: (data: RegisterData) => Promise<void>;
  logout: () => void;
  refreshUser: () => Promise<void>;
}

// Form types
export interface FormState {
  isLoading: boolean;
  error: string | null;
  success: string | null;
}

// Password generator types
export interface PasswordOptions {
  length: number;
  includeUppercase: boolean;
  includeLowercase: boolean;
  includeNumbers: boolean;
  includeSymbols: boolean;
}

// Encryption types
export interface EncryptionKeys {
  publicKey?: string;
  privateKey?: string;
}

// Error types
export interface ApiError {
  code: string;
  message: string;
  details?: any;
}

export interface ValidationError {
  [field: string]: string[];
}