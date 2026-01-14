import React, { createContext, useContext, useState, ReactNode } from 'react';

interface UserProfile {
  firstName: string;
  lastName: string;
  email: string;
}

interface User {
  username: string;
  name: string;
  avatar?: string;
  profile?: UserProfile;
}

interface AuthContextType {
  user: User | null;
  login: (username: string, password: string) => boolean;
  logout: () => void;
  isAuthenticated: boolean;
  hasCompletedOnboarding: boolean;
  completeOnboarding: () => void;
  updateUserProfile: (profile: UserProfile) => void;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<User | null>(null);
  const [hasCompletedOnboarding, setHasCompletedOnboarding] = useState(() => {
    return localStorage.getItem('altcorp_onboarding_complete') === 'true';
  });

  const login = (username: string, password: string): boolean => {
    if (username === 'admin' && password === 'admin') {
      const savedProfile = localStorage.getItem('altcorp_user_profile');
      const profile = savedProfile ? JSON.parse(savedProfile) : undefined;
      
      setUser({
        username: 'admin',
        name: profile ? `${profile.firstName} ${profile.lastName}` : 'Administrador',
        avatar: undefined,
        profile,
      });
      return true;
    }
    return false;
  };

  const logout = () => {
    setUser(null);
  };

  const completeOnboarding = () => {
    setHasCompletedOnboarding(true);
    localStorage.setItem('altcorp_onboarding_complete', 'true');
  };

  const updateUserProfile = (profile: UserProfile) => {
    localStorage.setItem('altcorp_user_profile', JSON.stringify(profile));
    setUser(prev => prev ? {
      ...prev,
      name: `${profile.firstName} ${profile.lastName}`,
      profile,
    } : null);
  };

  return (
    <AuthContext.Provider value={{ 
      user, 
      login, 
      logout, 
      isAuthenticated: !!user,
      hasCompletedOnboarding,
      completeOnboarding,
      updateUserProfile,
    }}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};
