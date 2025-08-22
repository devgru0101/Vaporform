import axios from 'axios';
import type { User } from '@shared/types';
import { API_BASE_ALT } from '../config/environment';

const API_BASE = API_BASE_ALT;

interface LoginCredentials {
  email: string;
  password: string;
}

interface RegisterCredentials {
  name: string;
  email: string;
  password: string;
}

interface AuthResponse {
  user: User;
  token: string;
}

class AuthService {
  private baseURL = `${API_BASE}`;

  async login(credentials: LoginCredentials): Promise<AuthResponse> {
    const response = await axios.post(`${this.baseURL}/auth/login`, credentials);
    return response.data;
  }

  async register(credentials: RegisterCredentials): Promise<AuthResponse> {
    const response = await axios.post(`${this.baseURL}/auth/register`, credentials);
    return response.data;
  }

  async validateToken(token: string): Promise<User | null> {
    try {
      const response = await axios.post(`${this.baseURL}/auth/verify`, {}, {
        headers: { Authorization: `Bearer ${token}` }
      });
      return response.data.valid ? response.data.user : null;
    } catch (error) {
      return null;
    }
  }

  async refreshToken(token: string): Promise<AuthResponse | null> {
    try {
      const response = await axios.post(`${this.baseURL}/auth/refresh`, {}, {
        headers: { Authorization: `Bearer ${token}` }
      });
      return response.data;
    } catch (error) {
      return null;
    }
  }

  async logout(token: string): Promise<void> {
    try {
      await axios.post(`${this.baseURL}/auth/logout`, {}, {
        headers: { Authorization: `Bearer ${token}` }
      });
    } catch (error) {
      // Ignore logout errors
      console.warn('Logout error:', error);
    }
  }

  async updateProfile(token: string, updates: Partial<User>): Promise<User> {
    const response = await axios.patch(`${this.baseURL}/auth/profile`, updates, {
      headers: { Authorization: `Bearer ${token}` }
    });
    return response.data.user;
  }

  async changePassword(token: string, oldPassword: string, newPassword: string): Promise<void> {
    await axios.post(`${this.baseURL}/auth/change-password`, {
      oldPassword,
      newPassword
    }, {
      headers: { Authorization: `Bearer ${token}` }
    });
  }

  async forgotPassword(email: string): Promise<void> {
    await axios.post(`${this.baseURL}/auth/forgot-password`, { email });
  }

  async resetPassword(token: string, newPassword: string): Promise<void> {
    await axios.post(`${this.baseURL}/auth/reset-password`, {
      token,
      password: newPassword
    });
  }
}

export const authService = new AuthService();

// Hook for using auth service
export const useAuthService = () => {
  return authService;
};