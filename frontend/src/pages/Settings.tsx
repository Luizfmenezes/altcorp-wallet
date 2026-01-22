import React, { useState } from 'react';
import { User, Moon, Sun, LogOut, Palette, Users, Plus, Trash2, Camera, Save, Shield } from 'lucide-react';
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
import authService from '@/services/authService';

const Settings: React.FC = () => {
  const { user, logout, updateProfile, updateProfilePhoto } = useAuth();
  const { theme, toggleTheme } = useTheme();
  const { people, addPerson, removePerson } = useFinance();
  const navigate = useNavigate();
  const { toast } = useToast();

  const [isAddPersonOpen, setIsAddPersonOpen] = useState(false);
  const [newPersonName, setNewPersonName] = useState('');
  const [isUploadingPhoto, setIsUploadingPhoto] = useState(false);
  const fileInputRef = React.useRef<HTMLInputElement>(null);
  
  // Profile edit state - load from user data (from database)
  const [profileFirstName, setProfileFirstName] = useState(() => {
    if (user?.profile?.firstName) return user.profile.firstName;
    if (user?.name) return user.name.split(' ')[0] || '';
    return '';
  });
  const [profileLastName, setProfileLastName] = useState(() => {
    if (user?.profile?.lastName) return user.profile.lastName;
    if (user?.name) {
      const nameParts = user.name.split(' ');
      return nameParts.slice(1).join(' ') || '';
    }
    return '';
  });
  const [profileEmail, setProfileEmail] = useState(() => {
    if (user?.profile?.email) return user.profile.email;
    return user?.apiUser?.email || '';
  });

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

  const handleSaveProfile = async () => {
    try {
      await updateProfile(profileFirstName, profileLastName, profileEmail);
      toast({
        title: 'Perfil atualizado',
        description: 'Suas alterações foram salvas no banco.',
      });
    } catch (error) {
      console.error('Error updating profile:', error);
      toast({
        title: 'Erro',
        description: 'Falha ao atualizar perfil.',
        variant: 'destructive',
      });
    }
  };

  const handlePhotoClick = () => {
    fileInputRef.current?.click();
  };

  const handlePhotoChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    // Validate file type
    if (!file.type.startsWith('image/')) {
      toast({
        title: 'Erro',
        description: 'Por favor, selecione uma imagem.',
        variant: 'destructive',
      });
      return;
    }

    // Validate file size (max 2MB)
    if (file.size > 2 * 1024 * 1024) {
      toast({
        title: 'Erro',
        description: 'A imagem deve ter no máximo 2MB.',
        variant: 'destructive',
      });
      return;
    }

    setIsUploadingPhoto(true);
    try {
      // Convert to base64
      const reader = new FileReader();
      reader.onloadend = async () => {
        try {
          const base64 = reader.result as string;
          await authService.updateProfilePhoto(base64);
          // Update local state without page reload
          updateProfilePhoto(base64);
          toast({
            title: 'Sucesso',
            description: 'Foto de perfil atualizada!',
          });
        } catch (err) {
          console.error('Error uploading photo:', err);
          toast({
            title: 'Erro',
            description: 'Falha ao atualizar foto de perfil.',
            variant: 'destructive',
          });
        } finally {
          setIsUploadingPhoto(false);
        }
      };
      reader.readAsDataURL(file);
    } catch (err) {
      console.error('Error reading file:', err);
      toast({
        title: 'Erro',
        description: 'Falha ao ler arquivo.',
        variant: 'destructive',
      });
      setIsUploadingPhoto(false);
    }
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
          
          {/* Avatar */}
          <div className="flex justify-center mb-6">
            <div className="relative">
              <div 
                role="button"
                tabIndex={0}
                className="w-24 h-24 md:w-28 md:h-28 rounded-full bg-primary/10 flex items-center justify-center border-4 border-primary/20 overflow-hidden cursor-pointer"
                onClick={handlePhotoClick}
                onKeyDown={(e) => e.key === 'Enter' && handlePhotoClick()}
              >
                {user?.profile_photo ? (
                  <img 
                    src={user.profile_photo} 
                    alt="Foto de perfil" 
                    className="w-full h-full object-cover"
                  />
                ) : (
                  <User className="w-12 h-12 md:w-14 md:h-14 text-primary" />
                )}
              </div>
              <button 
                onClick={handlePhotoClick}
                disabled={isUploadingPhoto}
                className="absolute bottom-0 right-0 w-8 h-8 bg-primary rounded-full flex items-center justify-center shadow-lg hover:bg-primary/90 transition-colors disabled:opacity-50"
              >
                <Camera className="w-4 h-4 text-primary-foreground" />
              </button>
              <input
                ref={fileInputRef}
                type="file"
                accept="image/*"
                onChange={handlePhotoChange}
                className="hidden"
              />
            </div>
          </div>
          
          {/* Profile Form */}
          <div className="space-y-4">
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="text-sm text-muted-foreground mb-1 block">Nome</label>
                <Input
                  value={profileFirstName}
                  onChange={(e) => setProfileFirstName(e.target.value)}
                  className="input-finance"
                  placeholder="Nome"
                />
              </div>
              <div>
                <label className="text-sm text-muted-foreground mb-1 block">Sobrenome</label>
                <Input
                  value={profileLastName}
                  onChange={(e) => setProfileLastName(e.target.value)}
                  className="input-finance"
                  placeholder="Sobrenome"
                />
              </div>
            </div>
            
            <div>
              <label className="text-sm text-muted-foreground mb-1 block">Email</label>
              <Input
                type="email"
                value={profileEmail}
                onChange={(e) => setProfileEmail(e.target.value)}
                className="input-finance text-sm"
                placeholder="seu@email.com"
              />
            </div>
            
            <Button onClick={handleSaveProfile} className="w-full h-11 rounded-xl">
              <Save className="w-4 h-4 mr-2" />
              Salvar Alterações
            </Button>
          </div>
        </section>

        {/* Admin Section - User Management */}
        {authService.isAdmin() && (
          <section className="card-finance animate-fade-in" style={{ animationDelay: '0.05s' }}>
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center gap-2">
                <Shield className="w-5 h-5 text-red-500" />
                <h2 className="font-semibold text-foreground">Administração</h2>
              </div>
            </div>
            
            <p className="text-xs text-muted-foreground mb-3">
              Área exclusiva para administradores do sistema.
            </p>
            
            <Button 
              onClick={() => navigate('/users')} 
              variant="outline" 
              className="w-full h-11 rounded-xl"
            >
              <Users className="w-4 h-4 mr-2" />
              Gerenciar Usuários e Permissões
            </Button>
          </section>
        )}

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
            Pessoas cadastradas para usar como titular nas compras e gastos.
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