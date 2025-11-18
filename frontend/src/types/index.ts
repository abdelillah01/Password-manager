/**
 * Type definitions for the Password Manager application
 */

// User types
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

// Password Entry types
export interface PasswordEntry {
  id: string;
  name: string;
  username: string;
  website: string;
  folder: 'personal' | 'work' | 'finance' | 'social' | 'other';
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

// Authentication types
export interface LoginCredentials {
  email: string;
  password: string;
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

export interface LoginResponse {
  access: string;
  refresh: string;
  user: User;
  requires_2fa: boolean;
}

export interface TokenResponse {
  access: string;
  refresh: string;
}

// Encryption types
export interface EncryptedData {
  ciphertext: string;
  iv: string;
  tag: string;
}

export interface KdfParams {
  kdf_salt: string;
  kdf_iterations: number;
  master_password_hint?: string;
}

// 2FA types
export interface TwoFactorSetupResponse {
  qr_code: string;
  secret: string;
  backup_codes: string[];
  message: string;
}

export interface TwoFactorStatus {
  enabled: boolean;
  backup_codes_remaining: number;
}

// Password Generator types
export interface PasswordGeneratorOptions {
  length: number;
  use_symbols: boolean;
  use_numbers: boolean;
  use_uppercase: boolean;
  use_lowercase: boolean;
}

export interface PasswordStrength {
  score: number;
  feedback: string[];
}

// API Response types
export interface ApiError {
  detail?: string;
  message?: string;
  [key: string]: unknown;
}

export interface PaginatedResponse<T> {
  count: number;
  next: string | null;
  previous: string | null;
  results: T[];
}

// Folder types
export interface FolderCount {
  folder: string;
  count: number;
}

// Stats types
export interface PasswordStats {
  total_passwords: number;
  favorites: number;
  recently_accessed: PasswordEntry[];
}

// Password History types
export interface PasswordHistory {
  id: string;
  encrypted_password: string;
  encryption_iv: string;
  encryption_tag: string;
  changed_at: string;
}

// Export all types as a namespace as well for easier importing
export type {
  User as UserType,
  PasswordEntry as PasswordEntryType,
  LoginCredentials as LoginCredentialsType,
  RegisterData as RegisterDataType,
  LoginResponse as LoginResponseType,
  EncryptedData as EncryptedDataType,
  KdfParams as KdfParamsType,
  TwoFactorSetupResponse as TwoFactorSetupResponseType,
  TwoFactorStatus as TwoFactorStatusType,
  PasswordGeneratorOptions as PasswordGeneratorOptionsType,
  PasswordStrength as PasswordStrengthType,
  FolderCount as FolderCountType,
  PasswordStats as PasswordStatsType,
  PasswordHistory as PasswordHistoryType
};