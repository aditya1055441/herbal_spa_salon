export interface CustomerUser {
  id: string;
  email: string;
  name: string;
  phone?: string;
  verified: boolean;
  memberTier?: 'Member' | 'Botanical Circle' | 'Herbal Artisan';
  createdAt?: string;
}

export interface VerificationCodeResponse {
  success: boolean;
  message: string;
  demoCode?: string;
  expiresAt?: number;
  errorMessage?: string;
}

export interface CustomerAuthResponse {
  success: boolean;
  token?: string;
  customer?: CustomerUser;
  errorMessage?: string;
}
