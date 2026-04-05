import React, { useState, useEffect } from 'react';
import { User, Moon, Sun, LogOut, Palette, Users, Plus, Trash2, Camera, Save, Shield, ImageIcon, Check, Mail, AtSign, KeyRound } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { BottomNav } from '@/components/BottomNav';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { useAuth } from '@/contexts/AuthContext';
import { useTheme } from '@/contexts/ThemeContext';
import { useFinance } from '@/contexts/FinanceContext';
import { useToast } from '@/hooks/use-toast';
import authService from '@/services/authService';

const Settings: React.FC = () => {
  const { user, logout, updateProfile, updateProfilePhoto } = useAuth();
  const { theme, setTheme } = useTheme();
  const { people, addPerson, removePerson } = useFinance();
  const navigate = useNavigate();
  const { toast } = useToast();

  const [isAddPersonOpen, setIsAddPersonOpen] = useState(false);
  const [newPersonName, setNewPersonName] = useState('');
  const [isUploadingPhoto, setIsUploadingPhoto] = useState(false);
  const [isPhotoMenuOpen, setIsPhotoMenuOpen] = useState(false);
  const cameraInputRef = React.useRef<HTMLInputElement>(null);
  const galleryInputRef = React.useRef<HTMLInputElement>(null);
  
  // Profile edit state
  const [profileFirstName, setProfileFirstName] = useState('');
  const [profileLastName, setProfileLastName] = useState('');
  const [profileUsername, setProfileUsername] = useState('');
  const [profileEmail, setProfileEmail] = useState('');
  const profileImage = user?.profile_photo || user?.avatar_url || null;
  const accountProviderLabel = user?.apiUser?.google_id ? 'Conta conectada com Google' : 'Conta local AltCorp';
  const fullDisplayName = `${profileFirstName} ${profileLastName}`.trim() || user?.name || 'Seu perfil';

  // Update profile fields when user data changes
  useEffect(() => {
    if (user) {
      // First name
      if (user.profile?.firstName) {
        setProfileFirstName(user.profile.firstName);
      } else if (user.name) {
        setProfileFirstName(user.name.split(' ')[0] || '');
      }
      
      // Last name
      if (user.profile?.lastName) {
        setProfileLastName(user.profile.lastName);
      } else if (user.name) {
        const nameParts = user.name.split(' ');
        setProfileLastName(nameParts.slice(1).join(' ') || '');
      }
      
      // Email - prioritize apiUser.email (from database)
      if (user.apiUser?.email) {
        setProfileEmail(user.apiUser.email);
      } else if (user.profile?.email) {
        setProfileEmail(user.profile.email);
      }

      if (user.apiUser?.username) {
        setProfileUsername(user.apiUser.username);
      } else if (user.username) {
        setProfileUsername(user.username);
      }
    }
  }, [user]);

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
    const trimmedFirstName = profileFirstName.trim();
    const trimmedLastName = profileLastName.trim();
    const normalizedUsername = profileUsername.trim().toLowerCase();

    if (!trimmedFirstName) {
      toast({
        title: 'Erro',
        description: 'Preencha seu nome.',
        variant: 'destructive',
      });
      return;
    }

    if (!normalizedUsername) {
      toast({
        title: 'Erro',
        description: 'Preencha seu username.',
        variant: 'destructive',
      });
      return;
    }

    if (normalizedUsername.length < 3 || normalizedUsername.length > 30) {
      toast({
        title: 'Erro',
        description: 'Username deve ter entre 3 e 30 caracteres.',
        variant: 'destructive',
      });
      return;
    }

    if (!/^[a-z0-9_]+$/.test(normalizedUsername)) {
      toast({
        title: 'Erro',
        description: 'Username só pode conter letras minúsculas, números e _.',
        variant: 'destructive',
      });
      return;
    }

    try {
      await updateProfile(trimmedFirstName, trimmedLastName, normalizedUsername);
      toast({
        title: 'Perfil atualizado',
        description: 'Dados pessoais atualizados com sucesso.',
      });
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Falha ao atualizar perfil.';
      toast({
        title: 'Erro',
        description: message,
        variant: 'destructive',
      });
    }
  };

  const handlePhotoClick = () => {
    setIsPhotoMenuOpen(true);
  };

  const handleCameraClick = () => {
    setIsPhotoMenuOpen(false);
    setTimeout(() => cameraInputRef.current?.click(), 100);
  };

  const handleGalleryClick = () => {
    setIsPhotoMenuOpen(false);
    setTimeout(() => galleryInputRef.current?.click(), 100);
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
      const reader = new FileReader();
      reader.onloadend = async () => {
        try {
          const base64 = reader.result as string;
          await authService.updateProfilePhoto(base64);
          updateProfilePhoto(base64);
          toast({
            title: 'Sucesso',
            description: 'Foto de perfil atualizada!',
          });
        } catch {
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
    } catch {
      toast({
        title: 'Erro',
        description: 'Falha ao ler arquivo.',
        variant: 'destructive',
      });
      setIsUploadingPhoto(false);
    }
  };

  return (
    <div className="min-h-screen bg-[radial-gradient(circle_at_top,#1d4ed81a,transparent_35%),linear-gradient(180deg,#07111f_0%,#0b1220_14%,hsl(var(--background))_38%)] pb-24 lg:pb-8">
      {/* Header */}
      <header className="px-4 pt-5 md:px-6 lg:px-8">
        <div className="max-w-3xl mx-auto rounded-[28px] border border-white/10 bg-slate-950/80 text-white p-6 shadow-[0_20px_70px_rgba(2,8,23,0.45)] backdrop-blur">
          <div className="flex items-start justify-between gap-4">
            <div>
              <p className="text-[11px] uppercase tracking-[0.28em] text-cyan-300/80">Configurações</p>
              <h1 className="text-2xl lg:text-3xl font-semibold mt-2">Sua conta e preferências</h1>
              <p className="text-sm text-slate-300 mt-2 max-w-xl">
                Atualize seus dados pessoais, personalize a aparência e gerencie as pessoas usadas nas divisões de gastos.
              </p>
            </div>
            <div className="hidden sm:flex h-12 w-12 items-center justify-center rounded-2xl bg-cyan-400/10 border border-cyan-300/20">
              <User className="w-5 h-5 text-cyan-300" />
            </div>
          </div>
        </div>
      </header>

      {/* Content */}
      <div className="px-4 md:px-6 lg:px-8 mt-4 space-y-4 max-w-3xl mx-auto">
        <section className="rounded-[28px] border border-border/60 bg-card/95 shadow-[0_14px_40px_rgba(15,23,42,0.12)] p-5 md:p-6 animate-fade-in">
          <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
            <div className="flex items-center gap-4 min-w-0">
              <div className="relative shrink-0">
                <div className="w-20 h-20 rounded-3xl overflow-hidden border border-primary/20 bg-primary/10 flex items-center justify-center">
                  {profileImage ? (
                    <img src={profileImage} alt="Foto de perfil" className="w-full h-full object-cover" />
                  ) : (
                    <User className="w-9 h-9 text-primary" />
                  )}
                </div>
                <div className="absolute -bottom-1 -right-1 rounded-full border border-background bg-emerald-500 px-2 py-0.5 text-[10px] font-semibold text-white">
                  Ativo
                </div>
              </div>

              <div className="min-w-0">
                <h2 className="text-xl font-semibold text-foreground truncate">{fullDisplayName}</h2>
                <div className="flex flex-wrap gap-2 mt-2">
                  <span className="inline-flex items-center gap-1 rounded-full bg-primary/10 px-3 py-1 text-xs font-medium text-primary">
                    <AtSign className="w-3.5 h-3.5" />
                    {profileUsername || 'sem_username'}
                  </span>
                  <span className="inline-flex items-center gap-1 rounded-full bg-muted px-3 py-1 text-xs font-medium text-muted-foreground">
                    <Mail className="w-3.5 h-3.5" />
                    {profileEmail || 'sem email'}
                  </span>
                </div>
                <p className="text-xs text-muted-foreground mt-3">{accountProviderLabel}</p>
              </div>
            </div>

            <div className="grid grid-cols-2 gap-2 text-xs min-w-[180px]">
              <div className="rounded-2xl border border-border bg-muted/40 p-3">
                <p className="text-muted-foreground">Username</p>
                <p className="font-semibold text-foreground mt-1 truncate">{profileUsername || 'pendente'}</p>
              </div>
              <div className="rounded-2xl border border-border bg-muted/40 p-3">
                <p className="text-muted-foreground">Login</p>
                <p className="font-semibold text-foreground mt-1">{user?.apiUser?.google_id ? 'Google' : 'Email/Senha'}</p>
              </div>
            </div>
          </div>
        </section>

        <section className="rounded-[28px] border border-border/60 bg-card/95 shadow-[0_14px_40px_rgba(15,23,42,0.12)] p-5 md:p-6 animate-fade-in" style={{ animationDelay: '0.03s' }}>
          <div className="flex items-center gap-2 mb-4">
            <KeyRound className="w-5 h-5 text-primary" />
            <h2 className="font-semibold text-foreground">Segurança da Conta</h2>
          </div>

          <div className="mb-5 rounded-2xl border border-amber-500/20 bg-amber-500/5 p-4 text-xs text-amber-700 dark:text-amber-300">
            Para manter sua segurança, a redefinição de senha fica em uma tela dedicada.
          </div>

          <Button
            type="button"
            variant="outline"
            onClick={() => navigate('/settings/change-password')}
            className="w-full h-11 rounded-2xl"
          >
            <KeyRound className="w-4 h-4 mr-2" />
            Ir para alteração de senha
          </Button>
        </section>

        {/* Profile Section */}
        <section className="rounded-[28px] border border-border/60 bg-card/95 shadow-[0_14px_40px_rgba(15,23,42,0.12)] p-5 md:p-6 animate-fade-in">
          <div className="flex items-center gap-2 mb-4">
            <User className="w-5 h-5 text-primary" />
            <h2 className="font-semibold text-foreground">Dados Pessoais</h2>
          </div>

          <div className="mb-5 rounded-2xl border border-primary/20 bg-primary/5 p-4 text-xs text-primary/90">
            Você pode alterar foto, nome, sobrenome e username. O email da conta é fixo e não pode ser alterado.
          </div>
          
          {/* Avatar */}
          <div className="flex justify-center mb-6">
            <div className="relative">
              <button
                type="button"
                className="w-24 h-24 md:w-28 md:h-28 rounded-full bg-primary/10 flex items-center justify-center border-4 border-primary/20 overflow-hidden cursor-pointer"
                onClick={handlePhotoClick}
              >
                {profileImage ? (
                  <img
                    src={profileImage}
                    alt="Foto de perfil"
                    className="w-full h-full object-cover"
                  />
                ) : (
                  <User className="w-12 h-12 md:w-14 md:h-14 text-primary" />
                )}
              </button>
              <button 
                type="button"
                onClick={handlePhotoClick}
                disabled={isUploadingPhoto}
                className="absolute bottom-0 right-0 w-8 h-8 bg-primary rounded-full flex items-center justify-center shadow-lg hover:bg-primary/90 transition-colors disabled:opacity-50"
              >
                <Camera className="w-4 h-4 text-primary-foreground" />
              </button>

              {/* Input câmera (capture=environment abre câmera traseira em mobile) */}
              <input
                ref={cameraInputRef}
                type="file"
                accept="image/*"
                capture="environment"
                onChange={handlePhotoChange}
                className="hidden"
              />
              {/* Input galeria (sem capture = abre seletor de arquivos/galeria) */}
              <input
                ref={galleryInputRef}
                type="file"
                accept="image/*"
                onChange={handlePhotoChange}
                className="hidden"
              />

              {/* Menu de escolha: Câmera / Galeria */}
              {isPhotoMenuOpen && (
                <>
                  <button
                    type="button"
                    aria-label="Fechar menu"
                    className="fixed inset-0 z-40 cursor-default bg-transparent border-none"
                    onClick={() => setIsPhotoMenuOpen(false)}
                  />
                  <div className="absolute left-1/2 -translate-x-1/2 top-full mt-2 z-50 bg-card border border-border rounded-xl shadow-lg overflow-hidden min-w-[180px] animate-fade-in">
                    <button
                      type="button"
                      className="w-full flex items-center gap-3 px-4 py-3 text-sm hover:bg-muted transition-colors"
                      onClick={handleCameraClick}
                    >
                      <Camera className="w-4 h-4 text-primary" />
                      <span>Tirar foto</span>
                    </button>
                    <button
                      type="button"
                      className="w-full flex items-center gap-3 px-4 py-3 text-sm hover:bg-muted transition-colors border-t border-border"
                      onClick={handleGalleryClick}
                    >
                      <ImageIcon className="w-4 h-4 text-primary" />
                      <span>Galeria</span>
                    </button>
                  </div>
                </>
              )}
            </div>
          </div>
          
          {/* Profile Form */}
          <div className="space-y-5">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
              <div>
                <label htmlFor="profile-first-name" className="text-sm text-muted-foreground mb-1 block">Nome</label>
                <Input
                  id="profile-first-name"
                  value={profileFirstName}
                  onChange={(e) => setProfileFirstName(e.target.value)}
                  className="input-finance"
                  placeholder="Nome"
                />
              </div>
              <div>
                <label htmlFor="profile-last-name" className="text-sm text-muted-foreground mb-1 block">Sobrenome</label>
                <Input
                  id="profile-last-name"
                  value={profileLastName}
                  onChange={(e) => setProfileLastName(e.target.value)}
                  className="input-finance"
                  placeholder="Sobrenome"
                />
              </div>
            </div>

            <div>
              <label htmlFor="profile-username" className="text-sm text-muted-foreground mb-1 block">Username único</label>
              <Input
                id="profile-username"
                value={profileUsername}
                onChange={(e) => setProfileUsername(e.target.value.toLowerCase())}
                className="input-finance text-sm"
                placeholder="seu_username"
                autoCapitalize="none"
              />
              <p className="text-[11px] text-muted-foreground mt-1">
                Cada usuário tem um username exclusivo no sistema.
              </p>
            </div>
            
            <div>
              <label htmlFor="profile-email" className="text-sm text-muted-foreground mb-1 block">Email</label>
              <Input
                id="profile-email"
                type="email"
                value={profileEmail}
                readOnly
                disabled
                className="input-finance text-sm opacity-80 cursor-not-allowed"
                placeholder="seu@email.com"
              />
              <p className="text-[11px] text-muted-foreground mt-1">
                Email bloqueado por segurança da conta.
              </p>
            </div>
            
            <Button onClick={handleSaveProfile} className="w-full h-12 rounded-2xl text-sm font-semibold">
              <Save className="w-4 h-4 mr-2" />
              Salvar Alterações
            </Button>
          </div>
        </section>

        {/* Admin Section - User Management */}
        {authService.isAdmin() && (
          <section className="rounded-[28px] border border-red-500/20 bg-card/95 shadow-[0_14px_40px_rgba(15,23,42,0.12)] p-5 md:p-6 animate-fade-in" style={{ animationDelay: '0.05s' }}>
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
        <section className="rounded-[28px] border border-border/60 bg-card/95 shadow-[0_14px_40px_rgba(15,23,42,0.12)] p-5 md:p-6 animate-fade-in" style={{ animationDelay: '0.05s' }}>
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
        <section className="rounded-[28px] border border-border/60 bg-card/95 shadow-[0_14px_40px_rgba(15,23,42,0.12)] p-5 md:p-6 animate-fade-in" style={{ animationDelay: '0.1s' }}>
          <div className="flex items-center gap-2 mb-4">
            <Palette className="w-5 h-5 text-primary" />
            <h2 className="font-semibold text-foreground">Aparência</h2>
          </div>

          {/* Seletor de Tema — 2 opções em cards */}
          <div className="grid grid-cols-2 gap-3 mt-1">
            {/* Tema Claro */}
            <button
              type="button"
              onClick={() => setTheme('light')}
              className={`relative flex flex-col items-center gap-2 p-3 rounded-xl border-2 transition-all duration-200 cursor-pointer
                ${theme === 'light'
                  ? 'border-primary bg-primary/10'
                  : 'border-border bg-secondary/40 hover:bg-secondary/70'}`}
            >
              {/* Preview miniatura */}
              <div className="w-full h-12 rounded-lg overflow-hidden border border-border/40"
                style={{ background: '#f8f8f8' }}>
                <div className="h-2 w-full" style={{ background: '#ffffff' }} />
                <div className="flex gap-1 m-1">
                  <div className="rounded w-4/5 h-2" style={{ background: '#e0e7ef' }} />
                  <div className="rounded w-1/5 h-2" style={{ background: '#2B4BF2' }} />
                </div>
              </div>
              <Sun className="w-4 h-4 text-warning" />
              <span className="text-xs font-medium text-foreground leading-none">Claro</span>
              {theme === 'light' && (
                <span className="absolute top-1.5 right-1.5 w-4 h-4 rounded-full bg-primary flex items-center justify-center">
                  <Check className="w-2.5 h-2.5 text-primary-foreground" />
                </span>
              )}
            </button>

            {/* Tema Escuro (C6) */}
            <button
              type="button"
              onClick={() => setTheme('dark')}
              className={`relative flex flex-col items-center gap-2 p-3 rounded-xl border-2 transition-all duration-200 cursor-pointer
                ${theme === 'dark'
                  ? 'border-[#2B4BF2] bg-[#2B4BF2]/10'
                  : 'border-border bg-secondary/40 hover:bg-secondary/70'}`}
            >
              <div className="w-full h-12 rounded-lg overflow-hidden border border-border/40"
                style={{ background: '#111111' }}>
                <div className="h-2 w-full" style={{ background: '#0D1A6E' }} />
                <div className="flex gap-1 m-1">
                  <div className="rounded w-4/5 h-2" style={{ background: '#242424' }} />
                  <div className="rounded w-1/5 h-2" style={{ background: '#2B4BF2' }} />
                </div>
              </div>
              <Moon className="w-4 h-4" style={{ color: '#2B4BF2' }} />
              <span className="text-xs font-medium text-foreground leading-none">Escuro</span>
              {theme === 'dark' && (
                <span className="absolute top-1.5 right-1.5 w-4 h-4 rounded-full flex items-center justify-center"
                  style={{ background: '#2B4BF2' }}>
                  <Check className="w-2.5 h-2.5 text-white" />
                </span>
              )}
            </button>
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