import axios from 'axios';
import type { User } from '@shared/types';

const API_BASE = process.env.NODE_ENV === 'production' ? '' : 'http://localhost:4000';

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
  private baseURL = `${API_BASE}/api/auth`;

  async login(credentials: LoginCredentials): Promise<AuthResponse> {
    const response = await axios.post(`${this.baseURL}/login`, credentials);
    return response.data;
  }

  async register(credentials: RegisterCredentials): Promise<AuthResponse> {
    const response = await axios.post(`${this.baseURL}/register`, credentials);
    return response.data;
  }

  async validateToken(token: string): Promise<User | null> {
    try {
      const response = await axios.get(`${this.baseURL}/validate`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      return response.data.user;
    } catch (error) {
      return null;
    }
  }

  async refreshToken(token: string): Promise<AuthResponse | null> {
    try {
      const response = await axios.post(`${this.baseURL}/refresh`, {}, {
        headers: { Authorization: `Bearer ${token}` }
      });
      return response.data;
    } catch (error) {
      return null;
    }
  }

  async logout(token: string): Promise<void> {
    try {
      await axios.post(`${this.baseURL}/logout`, {}, {
        headers: { Authorization: `Bearer ${token}` }
      });
    } catch (error) {
      // Ignore logout errors
      console.warn('Logout error:', error);
    }
  }

  async updateProfile(token: string, updates: Partial<User>): Promise<User> {
    const response = await axios.patch(`${this.baseURL}/profile`, updates, {
      headers: { Authorization: `Bearer ${token}` }
    });
    return response.data.user;
  }

  async changePassword(token: string, oldPassword: string, newPassword: string): Promise<void> {
    await axios.post(`${this.baseURL}/change-password`, {
      oldPassword,
      newPassword
    }, {
      headers: { Authorization: `Bearer ${token}` }
    });
  }

  async forgotPassword(email: string): Promise<void> {
    await axios.post(`${this.baseURL}/forgot-password`, { email });
  }

  async resetPassword(token: string, newPassword: string): Promise<void> {
    await axios.post(`${this.baseURL}/reset-password`, {
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