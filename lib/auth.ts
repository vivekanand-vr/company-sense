import { 
  LoginCredentials, 
  AuthResponse, 
  VerifyResponse, 
  UserResponse, 
  LogoutResponse, 
  RefreshResponse 
} from '@/types/auth';

const API_BASE = process.env.NEXT_PUBLIC_BACKEND_URL || 'http://localhost:8000';

// Storage keys
const AUTH_TOKEN_KEY = 'authToken';
const USER_KEY = 'user';

// Token management functions
export function getStoredToken(): string | null {
  if (typeof window === 'undefined') return null;
  return localStorage.getItem(AUTH_TOKEN_KEY);
}

export function getStoredUser() {
  if (typeof window === 'undefined') return null;
  const userStr = localStorage.getItem(USER_KEY);
  try {
    return userStr ? JSON.parse(userStr) : null;
  } catch {
    return null;
  }
}

export function setStoredAuth(token: string, user: any) {
  if (typeof window === 'undefined') return;
  localStorage.setItem(AUTH_TOKEN_KEY, token);
  localStorage.setItem(USER_KEY, JSON.stringify(user));
}

export function clearStoredAuth() {
  if (typeof window === 'undefined') return;
  localStorage.removeItem(AUTH_TOKEN_KEY);
  localStorage.removeItem(USER_KEY);
}

// API functions
export async function login(credentials: LoginCredentials): Promise<AuthResponse> {
  const response = await fetch(`${API_BASE}/api/auth/login`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify(credentials),
  });

  const data = await response.json();

  if (!response.ok) {
    throw new Error(data.message || 'Login failed');
  }

  if (data.success) {
    // Store token and user data
    setStoredAuth(data.data.token, data.data.user);
  }

  return data;
}

export async function verifyToken(): Promise<VerifyResponse> {
  const token = getStoredToken();
  
  if (!token) {
    throw new Error('No token found');
  }

  const response = await fetch(`${API_BASE}/api/auth/verify`, {
    method: 'GET',
    headers: {
      'Authorization': `Bearer ${token}`,
      'Content-Type': 'application/json',
    },
  });

  const data = await response.json();

  if (!response.ok) {
    throw new Error(data.message || 'Token verification failed');
  }

  return data;
}

export async function getCurrentUser(): Promise<UserResponse> {
  const token = getStoredToken();
  
  if (!token) {
    throw new Error('No token found');
  }

  const response = await fetch(`${API_BASE}/api/auth/me`, {
    method: 'GET',
    headers: {
      'Authorization': `Bearer ${token}`,
      'Content-Type': 'application/json',
    },
  });

  const data = await response.json();

  if (!response.ok) {
    throw new Error(data.message || 'Failed to get user info');
  }

  return data;
}

export async function refreshToken(): Promise<RefreshResponse> {
  const token = getStoredToken();
  
  if (!token) {
    throw new Error('No token found');
  }

  const response = await fetch(`${API_BASE}/api/auth/refresh`, {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${token}`,
      'Content-Type': 'application/json',
    },
  });

  const data = await response.json();

  if (!response.ok) {
    throw new Error(data.message || 'Token refresh failed');
  }

  if (data.success) {
    // Update stored token
    setStoredAuth(data.data.token, data.data.user);
  }

  return data;
}

export async function logout(): Promise<LogoutResponse> {
  const token = getStoredToken();
  
  try {
    if (token) {
      const response = await fetch(`${API_BASE}/api/auth/logout`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
      });

      // Don't throw on logout failure, just clear local storage
      const data = await response.json();
      return data;
    }
  } catch (error) {
    console.error('Logout request failed:', error);
  } finally {
    // Always clear local storage regardless of API response
    clearStoredAuth();
  }

  return { success: true, message: 'Logged out successfully' };
}

// Authenticated fetch wrapper
export async function authenticatedFetch(url: string, options: RequestInit = {}): Promise<Response> {
  const token = getStoredToken();
  
  if (!token) {
    throw new Error('No authentication token found');
  }

  const response = await fetch(url, {
    ...options,
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${token}`,
      ...options.headers,
    },
  });

  // If token is expired, try to refresh
  if (response.status === 401) {
    try {
      await refreshToken();
      const newToken = getStoredToken();
      
      if (newToken) {
        // Retry the original request with new token
        return fetch(url, {
          ...options,
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${newToken}`,
            ...options.headers,
          },
        });
      }
    } catch (refreshError) {
      // Refresh failed, clear auth and throw error
      clearStoredAuth();
      throw new Error('Session expired. Please log in again.');
    }
  }

  return response;
}

// Check if user is authenticated
export function isAuthenticated(): boolean {
  const token = getStoredToken();
  const user = getStoredUser();
  return !!(token && user);
}