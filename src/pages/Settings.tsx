import React, { useState } from 'react';
import { User, Moon, Sun, LogOut, Palette, Users, Plus, Trash2 } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { BottomNav } from '@/components/BottomNav';
import { Button } from '@/components/ui/button';
import { Switch } from '@/components/ui/switch';
import { Input } from '@/components/ui/input';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { useAuth } from '@/contexts/AuthContext';
import { useTheme } from '@/contexts/ThemeContext';
import { useFinance } from '@/contexts/FinanceContext';
import { useToast } from '@/hooks/use-toast';

const Settings: React.FC = () => {
  const { user, logout } = useAuth();
  const { theme, toggleTheme } = useTheme();
  const { people, addPerson, removePerson } = useFinance();
  const navigate = useNavigate();
  const { toast } = useToast();

  const [isAddPersonOpen, setIsAddPersonOpen] = useState(false);
  const [newPersonName, setNewPersonName] = useState('');

  const handleLogout = () => {
    logout();
    toast({
      title: 'Até logo!',
      description: 'Você foi desconectado.',
    });
    navigate('/');
  };

  const handleAddPerson = () => {
    if (newPersonName.trim()) {
      addPerson(newPersonName.trim());
      setNewPersonName('');
      setIsAddPersonOpen(false);
      toast({
        title: 'Sucesso',
        description: 'Pessoa adicionada com sucesso!',
      });
    }
  };

  const handleRemovePerson = (name: string) => {
    if (name === 'Eu') {
      toast({
        title: 'Erro',
        description: 'Não é possível remover "Eu".',
        variant: 'destructive',
      });
      return;
    }
    removePerson(name);
    toast({
      title: 'Removido',
      description: 'Pessoa removida com sucesso.',
    });
  };

  return (
    <div className="min-h-screen bg-background pb-24 md:pt-16 md:pb-8">
      {/* Header */}
      <header className="bg-primary text-primary-foreground p-6 pb-8 rounded-b-3xl md:rounded-none">
        <div className="max-w-7xl mx-auto">
          <h1 className="text-xl md:text-2xl font-bold text-center tracking-wide">
            CONFIGURAÇÕES
          </h1>
        </div>
      </header>

      {/* Content */}
      <div className="px-4 md:px-6 lg:px-8 -mt-4 space-y-4 max-w-2xl mx-auto">
        {/* Profile Section */}
        <section className="card-finance animate-fade-in">
          <div className="flex items-center gap-2 mb-4">
            <User className="w-5 h-5 text-primary" />
            <h2 className="font-semibold text-foreground">Perfil</h2>
          </div>
          
          <div className="flex items-center gap-4">
            <div className="w-16 h-16 md:w-20 md:h-20 rounded-2xl bg-primary/10 flex items-center justify-center">
              <User className="w-8 h-8 md:w-10 md:h-10 text-primary" />
            </div>
            <div>
              <p className="font-semibold text-foreground text-lg md:text-xl">
                {user?.name || 'Usuário'}
              </p>
              <p className="text-sm text-muted-foreground">
                @{user?.username || 'usuario'}
              </p>
            </div>
          </div>
        </section>

        {/* People Management Section */}
        <section className="card-finance animate-fade-in" style={{ animationDelay: '0.05s' }}>
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center gap-2">
              <Users className="w-5 h-5 text-primary" />
              <h2 className="font-semibold text-foreground">Gerenciar Pessoas</h2>
            </div>
            <Dialog open={isAddPersonOpen} onOpenChange={setIsAddPersonOpen}>
              <DialogTrigger asChild>
                <Button variant="outline" size="sm" className="h-9 rounded-xl">
                  <Plus className="w-4 h-4 mr-1" />
                  Adicionar
                </Button>
              </DialogTrigger>
              <DialogContent className="sm:max-w-xs">
                <DialogHeader>
                  <DialogTitle>Adicionar Pessoa</DialogTitle>
                </DialogHeader>
                <div className="space-y-4 mt-4">
                  <Input
                    placeholder="Nome da pessoa"
                    value={newPersonName}
                    onChange={(e) => setNewPersonName(e.target.value)}
                    className="input-finance"
                    onKeyDown={(e) => e.key === 'Enter' && handleAddPerson()}
                  />
                  <Button onClick={handleAddPerson} className="w-full h-11 rounded-xl">
                    Adicionar
                  </Button>
                </div>
              </DialogContent>
            </Dialog>
          </div>
          
          <p className="text-xs text-muted-foreground mb-3">
            Pessoas cadastradas para usar como titular nas compras dos cartões.
          </p>
          
          <div className="space-y-2">
            {people.map((person, index) => (
              <div
                key={person}
                className="flex items-center justify-between p-3 bg-secondary/50 rounded-xl animate-fade-in"
                style={{ animationDelay: `${index * 0.05}s` }}
              >
                <div className="flex items-center gap-3">
                  <div className="w-8 h-8 rounded-full bg-primary/10 flex items-center justify-center">
                    <span className="text-sm font-medium text-primary">
                      {person.charAt(0).toUpperCase()}
                    </span>
                  </div>
                  <span className="font-medium text-foreground">{person}</span>
                </div>
                {person !== 'Eu' && (
                  <Button
                    variant="ghost"
                    size="icon"
                    onClick={() => handleRemovePerson(person)}
                    className="h-8 w-8 text-muted-foreground hover:text-destructive"
                  >
                    <Trash2 className="w-4 h-4" />
                  </Button>
                )}
              </div>
            ))}
          </div>
        </section>

        {/* Appearance Section */}
        <section className="card-finance animate-fade-in" style={{ animationDelay: '0.1s' }}>
          <div className="flex items-center gap-2 mb-4">
            <Palette className="w-5 h-5 text-primary" />
            <h2 className="font-semibold text-foreground">Aparência</h2>
          </div>
          
          <div className="flex items-center justify-between p-3 md:p-4 bg-secondary/50 rounded-xl">
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
          style={{ animationDelay: '0.15s' }}
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