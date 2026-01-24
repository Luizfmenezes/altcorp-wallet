import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import api from '../services/api';
import { useToast } from '@/hooks/use-toast';

// Interfaces
interface User {
  id: number;
  username: string;
  name: string;
  email?: string;
  role: string;
  onboarding_completed: boolean;
  profile_photo?: string;
}

interface AuthContextType {
  isAuthenticated: boolean;
  user: User | null;
  login: (username: string, password: string) => Promise<boolean>;
  logout: () => void;
  // AQUI: Adicionamos a função que estava faltando
  updateUser: (data: Partial<User>) => Promise<void>; 
  isLoading: boolean;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<User | null>(null);
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const { toast } = useToast();

  // Verificar token ao iniciar
  useEffect(() => {
    const token = localStorage.getItem('token');
    if (token) {
      api.defaults.headers.common['Authorization'] = `Bearer ${token}`;
      fetchCurrentUser();
    } else {
      setIsLoading(false);
    }
  }, []);

  const fetchCurrentUser = async () => {
    try {
      const response = await api.get('/users/me');
      setUser(response.data);
      setIsAuthenticated(true);
    } catch (error) {
      console.error('Erro ao buscar usuário:', error);
      logout();
    } finally {
      setIsLoading(false);
    }
  };
  const login = async (username: string, password: string) => {
    try {
      // CORREÇÃO: Usar URLSearchParams em vez de FormData
      // O FastAPI espera 'application/x-www-form-urlencoded'
      const params = new URLSearchParams();
      params.append('username', username);
      params.append('password', password);

      // Enviamos params e forçamos o cabeçalho correto
      const response = await api.post('/auth/login', params, {
        headers: {
          'Content-Type': 'application/x-www-form-urlencoded'
        }
      });

      const { access_token } = response.data;

      localStorage.setItem('token', access_token);
      api.defaults.headers.common['Authorization'] = `Bearer ${access_token}`;
      
      await fetchCurrentUser();
      return true;
    } catch (error) {
      console.error('Login error:', error);
      toast({
        title: "Erro no login",
        description: "Usuário ou senha incorretos",
        variant: "destructive"
      });
      return false;
    }
  };
  const logout = () => {
    localStorage.removeItem('token');
    delete api.defaults.headers.common['Authorization'];
    setUser(null);
    setIsAuthenticated(false);
  };

  // === NOVA FUNÇÃO ===
  const updateUser = async (updates: Partial<User>) => {
    try {
      // Chama o backend para salvar a alteração
      const response = await api.put('/users/me', updates);
      
      // Atualiza o estado local com os dados novos que voltaram do servidor
      setUser(response.data);
      
    } catch (error) {
      console.error('Erro ao atualizar usuário:', error);
      throw error; // Lança o erro para o Onboarding tratar se precisar
    }
  };

  return (
    <AuthContext.Provider value={{ 
      isAuthenticated, 
      user, 
      login, 
      logout, 
      updateUser, // Exportando a função
      isLoading 
    }}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth deve ser usado dentro de um AuthProvider');
  }
  return context;
};
