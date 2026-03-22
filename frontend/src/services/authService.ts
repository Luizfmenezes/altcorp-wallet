import api from './api';

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

class AuthService {
  async login(credentials: LoginCredentials): Promise<User> {
    const formData = new URLSearchParams();
    formData.append('username', credentials.username);
    formData.append('password', credentials.password);

    const { data } = await api.post<AuthResponse>('/auth/login', formData, {
      headers: {
        'Content-Type': 'application/x-www-form-urlencoded',
      },
    });

    localStorage.setItem('token', data.access_token);
    
    const user = await this.getCurrentUser();
    localStorage.setItem('user', JSON.stringify(user));

    // Salvar dados do último login para exibir na tela de login mesmo após logout
    localStorage.setItem('lastLoginUser', JSON.stringify({
      username: user.username,
      name: user.name,
      profile_photo: user.profile_photo || user.avatar_url || null,
    }));
    
    return user;
  }

  async register(userData: RegisterData): Promise<RegisterResponse> {
    const { data } = await api.post<RegisterResponse>('/auth/register', userData);
    return data;
  }

  async verifyEmail(verifyData: VerifyEmailData): Promise<User> {
    const { data } = await api.post<AuthResponse>('/auth/verify-email', verifyData);
    
    localStorage.setItem('token', data.access_token);
    
    const user = await this.getCurrentUser();
    localStorage.setItem('user', JSON.stringify(user));
    
    localStorage.setItem('lastLoginUser', JSON.stringify({
      username: user.username,
      name: user.name,
      profile_photo: user.profile_photo || user.avatar_url || null,
    }));
    
    return user;
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
    
    localStorage.setItem('token', data.access_token);
    
    const user = await this.getCurrentUser();
    localStorage.setItem('user', JSON.stringify(user));
    
    localStorage.setItem('lastLoginUser', JSON.stringify({
      username: user.username,
      name: user.name,
      profile_photo: user.profile_photo || user.avatar_url || null,
    }));
    
    return user;
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

  async updateProfile(name: string, email?: string): Promise<User> {
    const payload: { name: string; email?: string } = { name };
    if (email && email.trim() !== '') {
      payload.email = email;
    }
    const { data } = await api.put<User>('/users/me/onboarding', payload);
    localStorage.setItem('user', JSON.stringify(data));
    return data;
  }

  logout(): void {
    localStorage.removeItem('token');
    localStorage.removeItem('user');
    window.location.href = '/';
  }

  getToken(): string | null {
    return localStorage.getItem('token');
  }

  getUser(): User | null {
    const userStr = localStorage.getItem('user');
    return userStr ? JSON.parse(userStr) : null;
  }

  getLastLoginUser(): { username: string; name: string; profile_photo: string | null } | null {
    const str = localStorage.getItem('lastLoginUser');
    return str ? JSON.parse(str) : null;
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
