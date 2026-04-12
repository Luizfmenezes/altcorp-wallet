import api from './api';
import axios from 'axios';

export interface LoginCredentials {
  username: string; // Username or email for login
  password: string;
}

export interface RegisterData {
  name: string;
  email: string;
  username: string;
  password: string;
  confirm_password: string;
}

export interface RegisterResponse {
  message: string;
  email: string;
  requires_verification: boolean;
}

export interface VerifyEmailData {
  email: string;
  code: string;
}

export interface ForgotPasswordData {
  email: string;
}

export interface ResetPasswordData {
  email: string;
  code: string;
  new_password: string;
  confirm_password: string;
}

export interface GoogleLoginData {
  credential: string;
}

export interface User {
  id: number;
  username: string;
  email?: string;
  name: string;
  role: 'admin' | 'user' | 'temp';
  is_active: boolean;
  onboarding_completed: boolean;
  email_verified: boolean;
  google_id?: string;
  avatar_url?: string;
  profile_photo?: string;
  created_at: string;
}

export interface AuthResponse {
  access_token: string;
  token_type: string;
}

export interface GoogleRedirectUrlResponse {
  auth_url: string;
}

export interface UpdateProfileData {
  name: string;
  username: string;
}

export interface LastLoginUser {
  username: string;
  name: string;
  profile_photo: string | null;
  provider: 'google' | 'password';
}

class AuthService {
  private getErrorMessage(error: unknown, fallbackMessage: string): string {
    if (axios.isAxiosError(error)) {
      const detail = error.response?.data?.detail;
      if (typeof detail === 'string' && detail.trim()) {
        return detail;
      }
    }
    if (error instanceof Error && error.message.trim()) {
      return error.message;
    }
    return fallbackMessage;
  }

  private async persistSessionFromToken(accessToken: string, provider: 'google' | 'password' = 'password'): Promise<User> {
    localStorage.setItem('token', accessToken);

    const user = await this.getCurrentUser();
    localStorage.setItem('user', JSON.stringify(user));

    localStorage.setItem('lastLoginUser', JSON.stringify({
      username: user.username,
      name: user.name,
      profile_photo: user.profile_photo || user.avatar_url || null,
      provider,
    }));

    return user;
  }

  async login(credentials: LoginCredentials): Promise<User> {
    const formData = new URLSearchParams();
    formData.append('username', credentials.username);
    formData.append('password', credentials.password);

    const { data } = await api.post<AuthResponse>('/auth/login', formData, {
      headers: {
        'Content-Type': 'application/x-www-form-urlencoded',
      },
    });

    return this.persistSessionFromToken(data.access_token);
  }

  async register(userData: RegisterData): Promise<RegisterResponse> {
    const { data } = await api.post<RegisterResponse>('/auth/register', userData);
    return data;
  }

  async verifyEmail(verifyData: VerifyEmailData): Promise<User> {
    const { data } = await api.post<AuthResponse>('/auth/verify-email', verifyData);
    return this.persistSessionFromToken(data.access_token);
  }

  async resendCode(email: string): Promise<{ message: string }> {
    const { data } = await api.post<{ message: string }>('/auth/resend-code', { email });
    return data;
  }

  async forgotPassword(email: string): Promise<{ message: string }> {
    const { data } = await api.post<{ message: string }>('/auth/forgot-password', { email });
    return data;
  }

  async resetPassword(resetData: ResetPasswordData): Promise<{ message: string }> {
    const { data } = await api.post<{ message: string }>('/auth/reset-password', resetData);
    return data;
  }

  async googleLogin(credential: string): Promise<User> {
    const { data } = await api.post<AuthResponse>('/auth/google-login', { credential });
    return this.persistSessionFromToken(data.access_token, 'google');
  }

  async nativeGoogleLogin(idToken: string): Promise<User> {
    try {
      const { data } = await api.post<AuthResponse>('/auth/google-native', {
        id_token: idToken,
      });

      return this.persistSessionFromToken(data.access_token, 'google');
    } catch (error) {
      throw new Error(this.getErrorMessage(error, 'Erro ao sincronizar login nativo.'));
    }
  }

  async getGoogleRedirectUrl(): Promise<string> {
    const { data } = await api.post<GoogleRedirectUrlResponse>('/auth/google-login-redirect-url');
    return data.auth_url;
  }

  async completeGoogleRedirectLogin(accessToken: string): Promise<User> {
    return this.persistSessionFromToken(accessToken, 'google');
  }

  async getCurrentUser(): Promise<User> {
    const { data } = await api.get<User>('/users/me');
    return data;
  }

  async updateProfilePhoto(photoBase64: string): Promise<User> {
    const { data } = await api.put<User>('/users/me/photo', { profile_photo: photoBase64 });
    localStorage.setItem('user', JSON.stringify(data));
    return data;
  }

  async completeOnboarding(name: string, email?: string): Promise<User> {
    const payload: { name: string; email?: string } = { name };
    if (email && email.trim() !== '') {
      payload.email = email;
    }
    const { data } = await api.put<User>('/users/me/onboarding', payload);
    localStorage.setItem('user', JSON.stringify(data));
    return data;
  }

  async updateProfile(profileData: UpdateProfileData): Promise<User> {
    const payload: UpdateProfileData = {
      name: profileData.name,
      username: profileData.username,
    };
    try {
      const { data: updatedUser } = await api.put<User>('/users/me/onboarding', payload);
      localStorage.setItem('user', JSON.stringify(updatedUser));
      return updatedUser;
    } catch (error) {
      throw new Error(this.getErrorMessage(error, 'Falha ao atualizar perfil.'));
    }
  }

  logout(): void {
    localStorage.removeItem('token');
    localStorage.removeItem('user');
    globalThis.location.href = '/';
  }

  getToken(): string | null {
    return localStorage.getItem('token');
  }

  getUser(): User | null {
    const userStr = localStorage.getItem('user');
    return userStr ? JSON.parse(userStr) : null;
  }

  getLastLoginUser(): LastLoginUser | null {
    const str = localStorage.getItem('lastLoginUser');
    if (!str) return null;
    const parsed = JSON.parse(str) as Partial<LastLoginUser>;
    return {
      username: parsed.username || '',
      name: parsed.name || '',
      profile_photo: parsed.profile_photo ?? null,
      provider: parsed.provider === 'google' ? 'google' : 'password',
    };
  }

  clearLastLoginUser(): void {
    localStorage.removeItem('lastLoginUser');
  }

  isAuthenticated(): boolean {
    return !!this.getToken();
  }

  isAdmin(): boolean {
    const user = this.getUser();
    return user?.role === 'admin';
  }
}

export default new AuthService();
