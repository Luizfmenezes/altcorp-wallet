import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import { AuthProvider, useAuth } from "./contexts/AuthContext";
import { ThemeProvider } from "./contexts/ThemeContext";
import { FinanceProvider } from "./contexts/FinanceContext";
import { OnboardingWizard } from "@/components/onboarding/OnboardingWizard";
import Index from "./pages/Index";
import Dashboard from "./pages/Dashboard";
import Login from "./pages/Login";
import Settings from "./pages/Settings";
import Incomes from "./pages/Incomes";
import Expenses from "./pages/Expenses";
import Wallet from "./pages/Wallet";
import CardDetail from "./pages/CardDetail";
import UserManagement from "./pages/UserManagement";
import NotFound from "./pages/NotFound";

const queryClient = new QueryClient();

// Componente para proteger rotas e verificar Onboarding
const PrivateRoute = ({ children }: { children: React.ReactNode }) => {
  const { isAuthenticated, user, isLoading, updateUser } = useAuth();

  if (isLoading) {
    return <div className="flex h-screen items-center justify-center">Carregando...</div>;
  }

  if (!isAuthenticated) {
    return <Navigate to="/login" />;
  }

  // Se o usuário não completou o onboarding, mostra o Wizard
  if (user && !user.onboarding_completed) {
    return (
      <OnboardingWizard 
        onComplete={() => {
          // Apenas recarrega a página ou força atualização do estado
          window.location.reload(); 
        }} 
      />
    );
  }

  return <>{children}</>;
};

const App = () => (
  <QueryClientProvider client={queryClient}>
    <ThemeProvider>
      <TooltipProvider>
        <AuthProvider>
          <FinanceProvider>
            <Toaster />
            <Sonner />
            <BrowserRouter>
              <Routes>
                <Route path="/login" element={<Login />} />
                
                {/* Rotas Protegidas */}
                <Route
                  path="/"
                  element={
                    <PrivateRoute>
                      <Index />
                    </PrivateRoute>
                  }
                />
                <Route
                  path="/dashboard"
                  element={
                    <PrivateRoute>
                      <Dashboard />
                    </PrivateRoute>
                  }
                />
                <Route
                  path="/incomes"
                  element={
                    <PrivateRoute>
                      <Incomes />
                    </PrivateRoute>
                  }
                />
                <Route
                  path="/expenses"
                  element={
                    <PrivateRoute>
                      <Expenses />
                    </PrivateRoute>
                  }
                />
                <Route
                  path="/wallet"
                  element={
                    <PrivateRoute>
                      <Wallet />
                    </PrivateRoute>
                  }
                />
                <Route
                  path="/wallet/:id"
                  element={
                    <PrivateRoute>
                      <CardDetail />
                    </PrivateRoute>
                  }
                />
                <Route
                  path="/settings"
                  element={
                    <PrivateRoute>
                      <Settings />
                    </PrivateRoute>
                  }
                />
                <Route
                  path="/admin/users"
                  element={
                    <PrivateRoute>
                      <UserManagement />
                    </PrivateRoute>
                  }
                />
                
                <Route path="*" element={<NotFound />} />
              </Routes>
            </BrowserRouter>
          </FinanceProvider>
        </AuthProvider>
      </TooltipProvider>
    </ThemeProvider>
  </QueryClientProvider>
);

export default App;
