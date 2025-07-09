export interface User {
  user_id: string;
  email: string;
  full_name: string;
  phone?: string;
  is_active: boolean;
  is_verified: boolean;
  tenant_id?: string;
  roles: Role[];
  permissions: string[];
  created_at: string;
  updated_at: string;
  last_login?: string;
}

export interface Role {
  role_id: string;
  role_name: string;
  description: string;
  permissions: string[];
}

export interface LoginCredentials {
  email: string;
  password: string;
  remember_me?: boolean;
}

export interface AuthResponse {
  user: User;
  token: string;
  refresh_token: string;
  expires_in: number;
}

export interface TokenPayload {
  user_id: string;
  email: string;
  roles: string[];
  permissions: string[];
  tenant_id?: string;
  exp: number;
  iat: number;
}