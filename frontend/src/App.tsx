import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import { AuthProvider, useAuth } from "@/contexts/AuthContext";
import { ThemeProvider } from "@/contexts/ThemeContext";
import { FinanceProvider, useFinance } from "@/contexts/FinanceContext";
import { OnboardingWizard, OnboardingData } from "@/components/onboarding/OnboardingWizard";
import { useEffect, useRef } from "react";
import Index from "./pages/Index";
import Dashboard from "./pages/Dashboard";
import Incomes from "./pages/Incomes";
import Expenses from "./pages/Expenses";
import Wallet from "./pages/Wallet";
import CardDetail from "./pages/CardDetail";
import Settings from "./pages/Settings";
import UserManagement from "./pages/UserManagement";
import History from "./pages/History";
import MonthlyAnalysisPage from "./pages/MonthlyAnalysisPage";
import QuickAdd from "./pages/QuickAdd";
import VoiceAdd from "./pages/VoiceAdd";
import NotFound from "./pages/NotFound";
import { AppLayout } from "./components/AppLayout";

const queryClient = new QueryClient();

// Component to load finance data when authenticated
const FinanceDataLoader: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const { isAuthenticated, isLoading: authLoading } = useAuth();
  const { loadFinanceData, clearFinanceData } = useFinance();
  const hasLoadedRef = useRef(false);

  useEffect(() => {
    if (authLoading) return;
    
    if (isAuthenticated && !hasLoadedRef.current) {
      hasLoadedRef.current = true;
      loadFinanceData();
    } else if (!isAuthenticated && hasLoadedRef.current) {
      hasLoadedRef.current = false;
      clearFinanceData();
    }
  }, [isAuthenticated, authLoading, loadFinanceData, clearFinanceData]);

  return <>{children}</>;
};

const ProtectedRoute: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const { isAuthenticated } = useAuth();
  
  if (!isAuthenticated) {
    return <Navigate to="/" replace />;
  }
  
  return <>{children}</>;
};

const OnboardingWrapper: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const { hasCompletedOnboarding, completeOnboarding, isAuthenticated, isLoading, updateProfilePhoto, user } = useAuth();
  const { setInitialIncome, setInitialCards, setPeople, loadFinanceData } = useFinance();

  const handleOnboardingComplete = async (data: OnboardingData) => {
    // Set people first (this is sync and uses localStorage)
    setPeople(data.people);

    // Set initial income (async - waits for API)
    if (data.monthlyIncome > 0) {
      await setInitialIncome(data.monthlyIncome);
    }

    if (data.cards.length > 0) {
      await setInitialCards(data.cards);
    }

    if (data.profilePhoto) {
      // Só envia para o backend se for base64 (foto local), não se for URL do Google
      const isBase64 = data.profilePhoto.startsWith('data:');
      if (isBase64) {
        try {
          const authService = (await import('@/services/authService')).default;
          await authService.updateProfilePhoto(data.profilePhoto);
          updateProfilePhoto(data.profilePhoto);
        } catch { /* silent */ }
      }
    }

    const fullName = `${data.firstName} ${data.lastName}`;
    const emailToSend = data.email.trim() !== '' && data.email.includes('@') && data.email.includes('.') 
      ? data.email.trim() 
      : undefined;
    await completeOnboarding(fullName, emailToSend);
    
    await loadFinanceData();
  };

  // Wait for auth to load before deciding
  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
      </div>
    );
  }

  // Only show onboarding if authenticated and not completed
  if (isAuthenticated && !hasCompletedOnboarding) {
    // Pré-preenche com dados do usuário (Google traz nome, email e avatar)
    const nameParts = (user?.name || '').split(' ');
    const initialData = {
      firstName: nameParts[0] || '',
      lastName: nameParts.slice(1).join(' ') || '',
      email: user?.profile?.email || user?.apiUser?.email || '',
      profilePhoto: user?.avatar_url || user?.profile_photo || undefined,
    };
    return <OnboardingWizard onComplete={handleOnboardingComplete} initialData={initialData} />;
  }

  return <>{children}</>;
};

const AppRoutes = () => {
  return (
    <OnboardingWrapper>
      <Routes>
        <Route path="/" element={<Index />} />
        <Route
          path="/dashboard"
          element={
            <ProtectedRoute>
              <AppLayout>
                <Dashboard />
              </AppLayout>
            </ProtectedRoute>
          }
        />
        <Route
          path="/incomes"
          element={
            <ProtectedRoute>
              <AppLayout>
                <Incomes />
              </AppLayout>
            </ProtectedRoute>
          }
        />
        <Route
          path="/expenses"
          element={
            <ProtectedRoute>
              <AppLayout>
                <Expenses />
              </AppLayout>
            </ProtectedRoute>
          }
        />
        <Route
          path="/wallet"
          element={
            <ProtectedRoute>
              <AppLayout>
                <Wallet />
              </AppLayout>
            </ProtectedRoute>
          }
        />
        <Route
          path="/wallet/:id"
          element={
            <ProtectedRoute>
              <AppLayout>
                <CardDetail />
              </AppLayout>
            </ProtectedRoute>
          }
        />
        <Route
          path="/settings"
          element={
            <ProtectedRoute>
              <AppLayout>
                <Settings />
              </AppLayout>
            </ProtectedRoute>
          }
        />
        <Route
          path="/users"
          element={
            <ProtectedRoute>
              <AppLayout>
                <UserManagement />
              </AppLayout>
            </ProtectedRoute>
          }
        />
        <Route
          path="/history"
          element={
            <ProtectedRoute>
              <AppLayout>
                <History />
              </AppLayout>
            </ProtectedRoute>
          }
        />
        <Route
          path="/monthly-analysis"
          element={
            <ProtectedRoute>
              <AppLayout>
                <MonthlyAnalysisPage />
              </AppLayout>
            </ProtectedRoute>
          }
        />
        <Route
          path="/add"
          element={
            <ProtectedRoute>
              <AppLayout>
                <QuickAdd />
              </AppLayout>
            </ProtectedRoute>
          }
        />
        <Route
          path="/add-voice"
          element={
            <ProtectedRoute>
              <AppLayout>
                <VoiceAdd />
              </AppLayout>
            </ProtectedRoute>
          }
        />
        <Route path="*" element={<NotFound />} />
      </Routes>
    </OnboardingWrapper>
  );
};

const App = () => (
  <QueryClientProvider client={queryClient}>
    <ThemeProvider>
      <AuthProvider>
        <FinanceProvider>
          <FinanceDataLoader>
            <TooltipProvider>
              <Toaster />
              <Sonner />
              <BrowserRouter>
                <AppRoutes />
              </BrowserRouter>
            </TooltipProvider>
          </FinanceDataLoader>
        </FinanceProvider>
      </AuthProvider>
    </ThemeProvider>
  </QueryClientProvider>
);

export default App;
