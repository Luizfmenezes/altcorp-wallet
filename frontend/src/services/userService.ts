import api from './api';
import type { User } from './authService';

export interface UserCreate {
  username: string;
  name: string;
  password: string;
  email?: string;
  role: 'admin' | 'user' | 'temp';
}

export interface UserUpdate {
  username?: string;
  name?: string;
  email?: string;
  password?: string;
  role?: 'admin' | 'user' | 'temp';
  is_active?: boolean;
}

class UserService {
  async getAllUsers(): Promise<User[]> {
    const { data } = await api.get<User[]>('/users');
    return data;
  }

  async getUser(id: number): Promise<User> {
    const { data } = await api.get<User>(`/users/${id}`);
    return data;
  }

  async createUser(userData: UserCreate): Promise<User> {
    const { data } = await api.post<User>('/users', userData);
    return data;
  }

  async updateUser(id: number, userData: UserUpdate): Promise<User> {
    const { data } = await api.put<User>(`/users/${id}`, userData);
    return data;
  }

  async deleteUser(id: number): Promise<void> {
    await api.delete(`/users/${id}`);
  }
}

export default new UserService();
