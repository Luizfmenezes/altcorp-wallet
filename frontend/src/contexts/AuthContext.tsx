import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import authService, { type User as ApiUser, type RegisterData, type RegisterResponse } from '@/services/authService';

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
  role?: 'admin' | 'user' | 'temp';
  profile_photo?: string;
  avatar_url?: string;
  email_verified?: boolean;
  apiUser?: ApiUser;
}

interface AuthContextType {
  user: User | null;
  login: (username: string, password: string) => Promise<boolean>;
  logout: () => void;
  register: (data: RegisterData) => Promise<RegisterResponse>;
  verifyEmail: (email: string, code: string) => Promise<boolean>;
  resendCode: (email: string) => Promise<string>;
  forgotPassword: (email: string) => Promise<string>;
  resetPassword: (email: string, code: string, newPassword: string, confirmPassword: string) => Promise<string>;
  googleLogin: (credential: string) => Promise<boolean>;
  isAuthenticated: boolean;
  isLoading: boolean;
  hasCompletedOnboarding: boolean;
  completeOnboarding: (name: string, email?: string) => Promise<void>;
  updateUserProfile: (profile: UserProfile) => void;
  updateProfile: (firstName: string, lastName: string, email?: string) => Promise<void>;
  updateProfilePhoto: (photo: string) => void;
  refreshUser: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

// Helper to get onboarding key for a specific user
const getOnboardingKey = (username: string) => `altcorp_onboarding_${username}`;
const getProfileKey = (username: string) => `altcorp_profile_${username}`;

export const AuthProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<User | null>(null);
  const [hasCompletedOnboarding, setHasCompletedOnboarding] = useState(false);
  const [isLoading, setIsLoading] = useState(true);

  // Check if user is already logged in on mount
  useEffect(() => {
    const apiUser = authService.getUser();
    if (apiUser) {
      setUser({
        username: apiUser.username,
        name: apiUser.name,
        role: apiUser.role,
        profile_photo: apiUser.profile_photo,
        avatar_url: apiUser.avatar_url,
        email_verified: apiUser.email_verified,
        apiUser,
      });
      // Use the onboarding status from the API user (from database)
      setHasCompletedOnboarding(apiUser.onboarding_completed);
    }
    setIsLoading(false);
  }, []);

  const login = async (username: string, password: string): Promise<boolean> => {
    try {
      const apiUser = await authService.login({ username, password });
      
      setUser({
        username: apiUser.username,
        name: apiUser.name,
        role: apiUser.role,
        profile_photo: apiUser.profile_photo,
        avatar_url: apiUser.avatar_url,
        email_verified: apiUser.email_verified,
        apiUser,
      });
      
      // Use the onboarding status from the API user (from database)
      setHasCompletedOnboarding(apiUser.onboarding_completed);
      
      return true;
    } catch {
      return false;
    }
  };

  const register = async (data: RegisterData): Promise<RegisterResponse> => {
    return await authService.register(data);
  };

  const verifyEmail = async (email: string, code: string): Promise<boolean> => {
    try {
      const apiUser = await authService.verifyEmail({ email, code });
      setUser({
        username: apiUser.username,
        name: apiUser.name,
        role: apiUser.role,
        profile_photo: apiUser.profile_photo,
        avatar_url: apiUser.avatar_url,
        email_verified: apiUser.email_verified,
        apiUser,
      });
      setHasCompletedOnboarding(apiUser.onboarding_completed);
      return true;
    } catch {
      return false;
    }
  };

  const resendCode = async (email: string): Promise<string> => {
    const result = await authService.resendCode(email);
    return result.message;
  };

  const forgotPassword = async (email: string): Promise<string> => {
    const result = await authService.forgotPassword(email);
    return result.message;
  };

  const resetPassword = async (email: string, code: string, newPassword: string, confirmPassword: string): Promise<string> => {
    const result = await authService.resetPassword({
      email,
      code,
      new_password: newPassword,
      confirm_password: confirmPassword,
    });
    return result.message;
  };

  const googleLogin = async (credential: string): Promise<boolean> => {
    try {
      const apiUser = await authService.googleLogin(credential);
      setUser({
        username: apiUser.username,
        name: apiUser.name,
        role: apiUser.role,
        profile_photo: apiUser.profile_photo,
        avatar_url: apiUser.avatar_url,
        email_verified: apiUser.email_verified,
        apiUser,
      });
      setHasCompletedOnboarding(apiUser.onboarding_completed);
      return true;
    } catch {
      return false;
    }
  };

  const logout = () => {
    authService.logout();
    setUser(null);
    setHasCompletedOnboarding(false);
  };

  const completeOnboarding = async (name: string, email?: string) => {
    try {
      const updatedUser = await authService.completeOnboarding(name, email);
      setUser(prev => prev ? {
        ...prev,
        name: updatedUser.name,
        apiUser: updatedUser,
      } : null);
      setHasCompletedOnboarding(true);
    } catch (error) {
      console.error('Failed to complete onboarding:', error);
    }
  };

  const updateUserProfile = (profile: UserProfile) => {
    if (user) {
      localStorage.setItem(getProfileKey(user.username), JSON.stringify(profile));
      setUser(prev => prev ? {
        ...prev,
        name: `${profile.firstName} ${profile.lastName}`,
        profile,
      } : null);
    }
  };

  const updateProfilePhoto = (photo: string) => {
    if (user) {
      setUser(prev => prev ? {
        ...prev,
        profile_photo: photo,
      } : null);
    }
  };

  const updateProfile = async (firstName: string, lastName: string, email?: string) => {
    try {
      const fullName = `${firstName} ${lastName}`.trim();
      const updatedUser = await authService.updateProfile(fullName, email);
      setUser(prev => prev ? {
        ...prev,
        name: updatedUser.name,
        apiUser: updatedUser,
      } : null);
    } catch (error) {
      console.error('Failed to update profile:', error);
    }
  };

  const refreshUser = async () => {
    try {
      const apiUser = await authService.getCurrentUser();
      localStorage.setItem('user', JSON.stringify(apiUser));
      setUser({
        username: apiUser.username,
        name: apiUser.name,
        role: apiUser.role,
        profile_photo: apiUser.profile_photo,
        avatar_url: apiUser.avatar_url,
        email_verified: apiUser.email_verified,
        apiUser,
      });
      setHasCompletedOnboarding(apiUser.onboarding_completed);
    } catch (error) {
      console.error('Failed to refresh user:', error);
    }
  };

  return (
    <AuthContext.Provider value={{ 
      user, 
      login,
      register,
      verifyEmail,
      resendCode,
      forgotPassword,
      resetPassword,
      googleLogin,
      logout, 
      isAuthenticated: !!user,
      isLoading,
      hasCompletedOnboarding,
      completeOnboarding,
      updateUserProfile,
      updateProfile,
      updateProfilePhoto,
      refreshUser,
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
