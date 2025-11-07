export interface User {
  username: string;
  role: string;
}

export interface AuthState {
  isAuthenticated: boolean;
  user: User | null;
  token: string | null;
  loading: boolean;
}

export interface LoginCredentials {
  username: string;
  password: string;
}

export interface AuthResponse {
  success: boolean;
  message: string;
  data: {
    token: string;
    user: User;
  };
}

export interface VerifyResponse {
  success: boolean;
  message: string;
  data: {
    user: User;
    expiresAt: string;
  };
}

export interface UserResponse {
  success: boolean;
  data: {
    user: User;
  };
}

export interface LogoutResponse {
  success: boolean;
  message: string;
}

export interface RefreshResponse {
  success: boolean;
  message: string;
  data: {
    token: string;
    user: User;
  };
}