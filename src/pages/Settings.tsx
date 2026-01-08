import React from 'react';
import { User, Moon, Sun, LogOut, Palette } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { BottomNav } from '@/components/BottomNav';
import { Button } from '@/components/ui/button';
import { Switch } from '@/components/ui/switch';
import { useAuth } from '@/contexts/AuthContext';
import { useTheme } from '@/contexts/ThemeContext';
import { useToast } from '@/hooks/use-toast';

const Settings: React.FC = () => {
  const { user, logout } = useAuth();
  const { theme, toggleTheme } = useTheme();
  const navigate = useNavigate();
  const { toast } = useToast();

  const handleLogout = () => {
    logout();
    toast({
      title: 'Até logo!',
      description: 'Você foi desconectado.',
    });
    navigate('/');
  };

  return (
    <div className="min-h-screen bg-background pb-24">
      {/* Header */}
      <header className="bg-primary text-primary-foreground p-6 pb-8 rounded-b-3xl">
        <h1 className="text-xl font-bold text-center tracking-wide">
          CONFIGURAÇÕES
        </h1>
      </header>

      {/* Content */}
      <div className="px-4 -mt-4 space-y-4">
        {/* Profile Section */}
        <section className="card-finance animate-fade-in">
          <div className="flex items-center gap-2 mb-4">
            <User className="w-5 h-5 text-primary" />
            <h2 className="font-semibold text-foreground">Perfil</h2>
          </div>
          
          <div className="flex items-center gap-4">
            <div className="w-16 h-16 rounded-2xl bg-primary/10 flex items-center justify-center">
              <User className="w-8 h-8 text-primary" />
            </div>
            <div>
              <p className="font-semibold text-foreground text-lg">
                {user?.name || 'Usuário'}
              </p>
              <p className="text-sm text-muted-foreground">
                @{user?.username || 'usuario'}
              </p>
            </div>
          </div>
        </section>

        {/* Appearance Section */}
        <section className="card-finance animate-fade-in" style={{ animationDelay: '0.1s' }}>
          <div className="flex items-center gap-2 mb-4">
            <Palette className="w-5 h-5 text-primary" />
            <h2 className="font-semibold text-foreground">Aparência</h2>
          </div>
          
          <div className="flex items-center justify-between p-3 bg-secondary/50 rounded-xl">
            <div className="flex items-center gap-3">
              {theme === 'dark' ? (
                <Moon className="w-5 h-5 text-primary" />
              ) : (
                <Sun className="w-5 h-5 text-warning" />
              )}
              <div>
                <p className="font-medium text-foreground">Modo Escuro</p>
                <p className="text-xs text-muted-foreground">
                  {theme === 'dark' ? 'Ativado' : 'Desativado'}
                </p>
              </div>
            </div>
            <Switch
              checked={theme === 'dark'}
              onCheckedChange={toggleTheme}
            />
          </div>
        </section>

        {/* Logout Button */}
        <Button
          variant="destructive"
          onClick={handleLogout}
          className="w-full h-14 rounded-xl text-base font-semibold animate-fade-in"
          style={{ animationDelay: '0.2s' }}
        >
          <LogOut className="w-5 h-5 mr-2" />
          Sair
        </Button>

        {/* App Version */}
        <p className="text-center text-xs text-muted-foreground pt-4">
          ALTCORP WALLET v1.0.0
        </p>
      </div>

      <BottomNav />
    </div>
  );
};

export default Settings;
