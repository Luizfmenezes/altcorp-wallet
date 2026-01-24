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
import NotFound from "./pages/NotFound";

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
  const { hasCompletedOnboarding, completeOnboarding, isAuthenticated, isLoading, updateProfilePhoto } = useAuth();
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
      try {
        const authService = (await import('@/services/authService')).default;
        await authService.updateProfilePhoto(data.profilePhoto);
        updateProfilePhoto(data.profilePhoto);
      } catch { /* silent */ }
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
    return <OnboardingWizard onComplete={handleOnboardingComplete} />;
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
              <Dashboard />
            </ProtectedRoute>
          }
        />
        <Route
          path="/incomes"
          element={
            <ProtectedRoute>
              <Incomes />
            </ProtectedRoute>
          }
        />
        <Route
          path="/expenses"
          element={
            <ProtectedRoute>
              <Expenses />
            </ProtectedRoute>
          }
        />
        <Route
          path="/wallet"
          element={
            <ProtectedRoute>
              <Wallet />
            </ProtectedRoute>
          }
        />
        <Route
          path="/wallet/:id"
          element={
            <ProtectedRoute>
              <CardDetail />
            </ProtectedRoute>
          }
        />
        <Route
          path="/settings"
          element={
            <ProtectedRoute>
              <Settings />
            </ProtectedRoute>
          }
        />
        <Route
          path="/users"
          element={
            <ProtectedRoute>
              <UserManagement />
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
