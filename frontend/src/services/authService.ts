import api from './api';

export interface LoginCredentials {
  username: string; // Username for login
  password: string;
}

export interface RegisterData {
  username: string;
  name: string;
  password: string;
  email?: string; // Email is optional
}

export interface User {
  id: number;
  username: string;
  email?: string;
  name: string;
  role: 'admin' | 'user' | 'temp';
  is_active: boolean;
  onboarding_completed: boolean;
  profile_photo?: string;
  created_at: string;
}

export interface AuthResponse {
  access_token: string;
  token_type: string;
}

class AuthService {
  async login(credentials: LoginCredentials): Promise<User> {
    if (import.meta.env.DEV) {
      console.log('AuthService.login called with username:', credentials.username);
    }
    
    const formData = new URLSearchParams();
    formData.append('username', credentials.username);
    formData.append('password', credentials.password);

    if (import.meta.env.DEV) {
      console.log('Sending login request...');
    }
    const { data } = await api.post<AuthResponse>('/auth/login', formData, {
      headers: {
        'Content-Type': 'application/x-www-form-urlencoded',
      },
    });

    if (import.meta.env.DEV) {
      console.log('Login response received, token:', data.access_token.substring(0, 20) + '...');
    }
    localStorage.setItem('token', data.access_token);
    
    // Get user info
    if (import.meta.env.DEV) {
      console.log('Fetching current user...');
    }
    const user = await this.getCurrentUser();
    if (import.meta.env.DEV) {
      console.log('User fetched:', user);
    }
    localStorage.setItem('user', JSON.stringify(user));
    
    return user;
  }

  async register(userData: RegisterData): Promise<User> {
    const { data } = await api.post<User>('/auth/register', userData);
    return data;
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

  isAuthenticated(): boolean {
    return !!this.getToken();
  }

  isAdmin(): boolean {
    const user = this.getUser();
    return user?.role === 'admin';
  }
}

export default new AuthService();
