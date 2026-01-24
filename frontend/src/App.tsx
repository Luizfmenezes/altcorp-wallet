import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import { AuthProvider, useAuth } from "@/contexts/AuthContext";
import { ThemeProvider } from "@/contexts/ThemeContext";
import { FinanceProvider, useFinance } from "@/contexts/FinanceContext";
import { OnboardingWizard, OnboardingData } from "@/components/onboarding/OnboardingWizard";
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

const ProtectedRoute: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const { isAuthenticated } = useAuth();
  
  if (!isAuthenticated) {
    return <Navigate to="/" replace />;
  }
  
  return <>{children}</>;
};

const OnboardingWrapper: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const { hasCompletedOnboarding, completeOnboarding, isAuthenticated, isLoading } = useAuth();
  const { setInitialIncome, setInitialCards, setPeople } = useFinance();

  const handleOnboardingComplete = async (data: OnboardingData) => {
    // Set initial income
    if (data.monthlyIncome > 0) {
      setInitialIncome(data.monthlyIncome);
    }

    // Set initial cards
    if (data.cards.length > 0) {
      setInitialCards(data.cards);
    }

    // Set people
    setPeople(data.people);

    // Complete onboarding in the database with name and email
    const fullName = `${data.firstName} ${data.lastName}`;
    // Only send email if it's valid (contains @ and .)
    const emailToSend = data.email.trim() !== '' && data.email.includes('@') && data.email.includes('.') 
      ? data.email.trim() 
      : undefined;
    await completeOnboarding(fullName, emailToSend);
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
          <TooltipProvider>
            <Toaster />
            <Sonner />
            <BrowserRouter>
              <AppRoutes />
            </BrowserRouter>
          </TooltipProvider>
        </FinanceProvider>
      </AuthProvider>
    </ThemeProvider>
  </QueryClientProvider>
);

export default App;
