import React, { useState, useEffect } from 'react';
import {
  User, Moon, Sun, LogOut, Users, Plus, Trash2, Camera, Save, Shield,
  ImageIcon, Check, Mail, AtSign, KeyRound, ChevronRight,
} from 'lucide-react';
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

// ─── Shared input styles (theme-aware) ────────────────────────────────
const inputClass =
  'h-12 rounded-xl bg-slate-900/[0.04] border-slate-900/10 text-slate-900 placeholder:text-slate-400 focus-visible:border-slate-900/25 focus-visible:ring-1 focus-visible:ring-slate-900/10 dark:bg-white/[0.04] dark:border-white/10 dark:text-white dark:placeholder:text-white/30 dark:focus-visible:border-white/30 dark:focus-visible:ring-white/10';

// ─── Helper: labeled field ────────────────────────────────────────────
const FieldWrap: React.FC<{ label: string; hint?: string; children: React.ReactNode }> = ({
  label,
  hint,
  children,
}) => (
  <div>
    <label className="mb-2 block text-[10px] uppercase tracking-[0.3em] text-slate-500 dark:text-white/40">
      {label}
    </label>
    {children}
    {hint && <p className="mt-1.5 text-[11px] text-slate-400 dark:text-white/30">{hint}</p>}
  </div>
);

// ─── Helper: numbered section header ──────────────────────────────────
const SectionHeader: React.FC<{
  number: string;
  title: string;
  subtitle?: string;
  accent?: 'amber' | 'red';
}> = ({ number, title, subtitle, accent = 'amber' }) => {
  const accentColor =
    accent === 'red'
      ? 'text-red-600/80 dark:text-red-300/70'
      : 'text-amber-600/90 dark:text-amber-200/80';
  return (
    <div className="mt-14 flex items-end gap-5">
      <span className={`font-mono text-[11px] tracking-wider ${accentColor}`}>{number} /</span>
      <div className="min-w-0">
        <h2 className="font-serif text-[26px] leading-none text-slate-900 dark:text-white">
          {title}
        </h2>
        {subtitle && (
          <p className="mt-1.5 text-[10px] uppercase tracking-[0.28em] text-slate-400 dark:text-white/35">
            {subtitle}
          </p>
        )}
      </div>
      <div className="mb-2 h-px flex-1 bg-gradient-to-r from-slate-900/15 to-transparent dark:from-white/15" />
    </div>
  );
};

// ─── Helper: theme preview card ───────────────────────────────────────
const ThemeCard: React.FC<{
  active: boolean;
  onClick: () => void;
  label: string;
  icon: React.ReactNode;
  palette: [string, string, string, string];
}> = ({ active, onClick, label, icon, palette }) => (
  <button
    type="button"
    onClick={onClick}
    className={`group relative flex flex-col gap-4 rounded-2xl border p-4 text-left transition-all duration-300 ${
      active
        ? 'border-amber-500/40 bg-amber-50/50 shadow-[0_0_40px_-10px_rgba(217,119,6,0.25)] dark:border-amber-200/50 dark:bg-white/[0.06] dark:shadow-[0_0_40px_-10px_rgba(253,230,138,0.4)]'
        : 'border-slate-900/10 bg-slate-900/[0.02] hover:border-slate-900/20 hover:bg-slate-900/[0.04] dark:border-white/10 dark:bg-white/[0.02] dark:hover:border-white/20 dark:hover:bg-white/[0.04]'
    }`}
  >
    <div
      className="h-16 w-full overflow-hidden rounded-lg border border-slate-900/10 dark:border-white/10"
      style={{ background: palette[0] }}
    >
      <div className="h-3 w-full" style={{ background: palette[1] }} />
      <div className="flex gap-1 p-1.5">
        <div className="h-2 w-4/5 rounded" style={{ background: palette[2] }} />
        <div className="h-2 w-1/5 rounded" style={{ background: palette[3] }} />
      </div>
      <div className="mt-1 flex gap-1 px-1.5">
        <div className="h-1.5 w-1/3 rounded" style={{ background: palette[2] }} />
        <div className="h-1.5 w-1/4 rounded opacity-60" style={{ background: palette[2] }} />
      </div>
    </div>
    <div className="flex items-center justify-between">
      <div className="flex items-center gap-2 text-slate-900 dark:text-white">
        {icon}
        <span className="text-sm font-medium">{label}</span>
      </div>
      <span
        className={`flex h-5 w-5 items-center justify-center rounded-full transition ${
          active
            ? 'bg-amber-500 text-white dark:bg-amber-200 dark:text-[#0a0d14]'
            : 'bg-slate-900/5 text-transparent dark:bg-white/5'
        }`}
      >
        <Check className="h-3 w-3" />
      </span>
    </div>
  </button>
);

// ─── Main component ───────────────────────────────────────────────────
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
  const accountProviderLabel = user?.apiUser?.google_id
    ? 'Conta conectada com Google'
    : 'Conta local AltCorp';
  const fullDisplayName = `${profileFirstName} ${profileLastName}`.trim() || user?.name || 'Seu perfil';

  useEffect(() => {
    if (user) {
      if (user.profile?.firstName) {
        setProfileFirstName(user.profile.firstName);
      } else if (user.name) {
        setProfileFirstName(user.name.split(' ')[0] || '');
      }

      if (user.profile?.lastName) {
        setProfileLastName(user.profile.lastName);
      } else if (user.name) {
        const nameParts = user.name.split(' ');
        setProfileLastName(nameParts.slice(1).join(' ') || '');
      }

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
    toast({ title: 'Até logo!', description: 'Você foi desconectado.' });
    navigate('/');
  };

  const handleAddPerson = () => {
    if (newPersonName.trim()) {
      addPerson(newPersonName.trim());
      setNewPersonName('');
      setIsAddPersonOpen(false);
      toast({ title: 'Sucesso', description: 'Pessoa adicionada com sucesso!' });
    }
  };

  const handleRemovePerson = (name: string) => {
    if (name === 'Eu') {
      toast({ title: 'Erro', description: 'Não é possível remover "Eu".', variant: 'destructive' });
      return;
    }
    removePerson(name);
    toast({ title: 'Removido', description: 'Pessoa removida com sucesso.' });
  };

  const handleSaveProfile = async () => {
    const trimmedFirstName = profileFirstName.trim();
    const trimmedLastName = profileLastName.trim();
    const normalizedUsername = profileUsername.trim().toLowerCase();

    if (!trimmedFirstName) {
      toast({ title: 'Erro', description: 'Preencha seu nome.', variant: 'destructive' });
      return;
    }
    if (!normalizedUsername) {
      toast({ title: 'Erro', description: 'Preencha seu username.', variant: 'destructive' });
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
      toast({ title: 'Perfil atualizado', description: 'Dados pessoais atualizados com sucesso.' });
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Falha ao atualizar perfil.';
      toast({ title: 'Erro', description: message, variant: 'destructive' });
    }
  };

  const handlePhotoClick = () => setIsPhotoMenuOpen(true);
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

    if (!file.type.startsWith('image/')) {
      toast({ title: 'Erro', description: 'Por favor, selecione uma imagem.', variant: 'destructive' });
      return;
    }
    if (file.size > 2 * 1024 * 1024) {
      toast({ title: 'Erro', description: 'A imagem deve ter no máximo 2MB.', variant: 'destructive' });
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
          toast({ title: 'Sucesso', description: 'Foto de perfil atualizada!' });
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
      toast({ title: 'Erro', description: 'Falha ao ler arquivo.', variant: 'destructive' });
      setIsUploadingPhoto(false);
    }
  };

  return (
    <div className="relative min-h-screen overflow-hidden bg-[#faf8f3] pb-28 text-slate-900 dark:bg-[#07090f] dark:text-white lg:pb-16">
      {/* ── Ambient backdrop ────────────────────────────────────────── */}
      <div aria-hidden className="pointer-events-none absolute inset-0">
        {/* Light mode gradients */}
        <div className="absolute inset-0 dark:hidden bg-[radial-gradient(ellipse_80%_60%_at_82%_-10%,rgba(253,186,116,0.35),transparent_60%),radial-gradient(ellipse_60%_50%_at_-10%_35%,rgba(191,219,254,0.45),transparent_60%),radial-gradient(ellipse_80%_50%_at_50%_115%,rgba(251,207,232,0.25),transparent_60%)]" />
        {/* Dark mode gradients */}
        <div className="absolute inset-0 hidden dark:block bg-[radial-gradient(ellipse_80%_60%_at_82%_-10%,rgba(253,230,138,0.10),transparent_60%),radial-gradient(ellipse_60%_50%_at_-10%_35%,rgba(59,130,246,0.12),transparent_60%),radial-gradient(ellipse_80%_50%_at_50%_115%,rgba(244,114,182,0.05),transparent_60%)]" />

        <div className="absolute inset-0 bg-[linear-gradient(180deg,transparent_0%,rgba(250,248,243,0.4)_50%,rgba(250,248,243,0.9)_100%)] dark:bg-[linear-gradient(180deg,rgba(7,9,15,0)_0%,rgba(7,9,15,0.35)_45%,rgba(7,9,15,0.9)_100%)]" />

        <div
          className="absolute inset-0 opacity-[0.04] mix-blend-multiply dark:opacity-[0.035] dark:mix-blend-overlay"
          style={{
            backgroundImage:
              "url(\"data:image/svg+xml,%3Csvg viewBox='0 0 200 200' xmlns='http://www.w3.org/2000/svg'%3E%3Cfilter id='n'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.9' numOctaves='3' stitchTiles='stitch'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23n)'/%3E%3C/svg%3E\")",
          }}
        />
      </div>

      {/* ── Content ─────────────────────────────────────────────────── */}
      <div className="relative z-10 mx-auto max-w-5xl px-5 md:px-8 pt-10 md:pt-14">
        {/* Editorial header */}
        <div className="flex items-start justify-between gap-6 border-b border-slate-900/10 pb-10 dark:border-white/10">
          <div className="min-w-0">
            <div className="flex items-center gap-2 text-[10px] uppercase tracking-[0.35em] text-slate-500 dark:text-white/40">
              <span className="inline-block h-[1px] w-7 bg-slate-900/30 dark:bg-white/30" />
              <span>AltCorp · Wallet</span>
              <span className="text-slate-400 dark:text-white/20">/</span>
              <span className="text-slate-700 dark:text-white/60">Configurações</span>
            </div>
            <h1 className="mt-6 font-serif text-[44px] md:text-[64px] leading-[0.92] tracking-[-0.02em] text-slate-900 dark:text-white">
              Sua conta<span className="text-amber-600 dark:text-amber-200">.</span>
            </h1>
            <p className="mt-5 max-w-md text-sm leading-relaxed text-slate-600 dark:text-white/50">
              Dados pessoais, segurança, pessoas e preferências — tudo em um só painel, com o cuidado de um cofre.
            </p>
          </div>
          <div className="hidden md:flex flex-col items-end gap-1.5 text-right text-[10px] uppercase tracking-[0.3em] text-slate-400 dark:text-white/30">
            <span className="text-slate-600 dark:text-white/50">v1.0.0</span>
            <span>
              {new Date().toLocaleDateString('pt-BR', {
                day: '2-digit',
                month: 'short',
                year: 'numeric',
              })}
            </span>
            <div className="mt-2 h-1 w-1 rounded-full bg-emerald-500 dark:bg-emerald-400" />
          </div>
        </div>

        {/* ── Profile hero ──────────────────────────────────────────── */}
        <section className="mt-10 overflow-hidden rounded-[32px] border border-slate-900/10 bg-white/60 p-6 backdrop-blur-2xl shadow-[0_30px_80px_-20px_rgba(15,23,42,0.15)] dark:border-white/10 dark:bg-white/[0.04] dark:shadow-[0_30px_80px_-20px_rgba(0,0,0,0.6)] md:p-8">
          <div className="flex flex-col gap-6 md:flex-row md:items-center md:gap-8">
            <div className="relative shrink-0 self-start md:self-center">
              <div className="absolute -inset-1 rounded-full bg-gradient-to-br from-amber-400/50 via-slate-900/5 to-transparent blur-md dark:from-amber-200/40 dark:via-white/10" />
              <div className="relative flex h-24 w-24 items-center justify-center overflow-hidden rounded-full border border-slate-900/15 bg-slate-900/5 dark:border-white/20 dark:bg-white/5 md:h-28 md:w-28">
                {profileImage ? (
                  <img src={profileImage} alt="Perfil" className="h-full w-full object-cover" />
                ) : (
                  <User className="h-10 w-10 text-slate-400 dark:text-white/50" />
                )}
              </div>
              <span className="absolute -bottom-1 right-0 flex h-5 items-center gap-1 rounded-full border border-emerald-500/30 bg-emerald-500 px-2 text-[9px] font-semibold uppercase tracking-wider text-white dark:border-emerald-300/30 dark:bg-emerald-400/90 dark:text-emerald-950">
                <span className="h-1.5 w-1.5 rounded-full bg-white/70 dark:bg-emerald-950/70" />
                Ativo
              </span>
            </div>

            <div className="min-w-0 flex-1">
              <p className="text-[10px] uppercase tracking-[0.3em] text-slate-500 dark:text-white/40">
                Bem-vindo de volta
              </p>
              <h2 className="mt-2 truncate font-serif text-[28px] leading-tight text-slate-900 dark:text-white md:text-[32px]">
                {fullDisplayName}
              </h2>
              <div className="mt-4 flex flex-wrap gap-2">
                <span className="inline-flex items-center gap-1.5 rounded-full border border-slate-900/10 bg-slate-900/5 px-3 py-1 text-xs text-slate-700 dark:border-white/10 dark:bg-white/[0.05] dark:text-white/80">
                  <AtSign className="h-3 w-3 text-slate-400 dark:text-white/50" />
                  {profileUsername || 'sem_username'}
                </span>
                <span className="inline-flex items-center gap-1.5 rounded-full border border-slate-900/10 bg-slate-900/5 px-3 py-1 text-xs text-slate-700 dark:border-white/10 dark:bg-white/[0.05] dark:text-white/80">
                  <Mail className="h-3 w-3 text-slate-400 dark:text-white/50" />
                  {profileEmail || 'sem email'}
                </span>
              </div>
              <p className="mt-4 text-[11px] text-slate-500 dark:text-white/35">{accountProviderLabel}</p>
            </div>

            <div className="hidden h-20 w-px bg-slate-900/10 dark:bg-white/10 md:block" />

            <div className="grid grid-cols-2 gap-2 md:min-w-[170px] md:grid-cols-1 md:gap-3">
              <div className="rounded-2xl border border-slate-900/10 bg-slate-900/[0.03] px-3 py-2.5 dark:border-white/5 dark:bg-white/[0.03]">
                <p className="text-[9px] uppercase tracking-[0.25em] text-slate-500 dark:text-white/30">
                  Provedor
                </p>
                <p className="mt-1 text-sm font-medium text-slate-900 dark:text-white">
                  {user?.apiUser?.google_id ? 'Google' : 'Email'}
                </p>
              </div>
              <div className="rounded-2xl border border-slate-900/10 bg-slate-900/[0.03] px-3 py-2.5 dark:border-white/5 dark:bg-white/[0.03]">
                <p className="text-[9px] uppercase tracking-[0.25em] text-slate-500 dark:text-white/30">
                  Carteira
                </p>
                <p className="mt-1 text-sm font-medium text-slate-900 dark:text-white">AltCorp</p>
              </div>
            </div>
          </div>
        </section>

        {/* ── 01 · Dados Pessoais ───────────────────────────────────── */}
        <SectionHeader number="01" title="Dados Pessoais" subtitle="Identidade no sistema" />
        <section className="mt-5 rounded-[28px] border border-slate-900/10 bg-white/60 p-6 backdrop-blur-xl dark:border-white/10 dark:bg-white/[0.04] md:p-8">
          <div className="rounded-2xl border border-amber-500/25 bg-amber-50/80 px-4 py-3 text-[11px] leading-relaxed text-amber-900 dark:border-amber-200/15 dark:bg-amber-200/[0.04] dark:text-amber-100/80">
            Foto, nome, sobrenome e username são editáveis. O email é fixo por segurança da conta.
          </div>

          {/* Avatar uploader */}
          <div className="mt-8 flex flex-col items-center">
            <div className="relative">
              <button
                type="button"
                onClick={handlePhotoClick}
                className="group relative flex h-28 w-28 items-center justify-center overflow-hidden rounded-full border border-slate-900/15 bg-slate-900/5 transition hover:border-slate-900/30 dark:border-white/15 dark:bg-white/[0.04] dark:hover:border-white/30 md:h-32 md:w-32"
              >
                {profileImage ? (
                  <img
                    src={profileImage}
                    alt="Foto"
                    className="h-full w-full object-cover transition duration-500 group-hover:scale-105"
                  />
                ) : (
                  <User className="h-12 w-12 text-slate-400 dark:text-white/40" />
                )}
                <div className="absolute inset-0 bg-black/0 transition group-hover:bg-black/15 dark:group-hover:bg-black/25" />
              </button>
              <button
                type="button"
                onClick={handlePhotoClick}
                disabled={isUploadingPhoto}
                className="absolute -bottom-1 -right-1 flex h-9 w-9 items-center justify-center rounded-full border border-slate-900/15 bg-slate-900 text-white shadow-xl transition hover:bg-slate-800 disabled:opacity-50 dark:border-white/15 dark:bg-white dark:text-black dark:hover:bg-white/90"
              >
                <Camera className="h-4 w-4" />
              </button>

              <input
                ref={cameraInputRef}
                type="file"
                accept="image/*"
                capture="environment"
                onChange={handlePhotoChange}
                className="hidden"
              />
              <input
                ref={galleryInputRef}
                type="file"
                accept="image/*"
                onChange={handlePhotoChange}
                className="hidden"
              />

              {isPhotoMenuOpen && (
                <>
                  <button
                    type="button"
                    aria-label="Fechar menu"
                    className="fixed inset-0 z-40 cursor-default border-none bg-transparent"
                    onClick={() => setIsPhotoMenuOpen(false)}
                  />
                  <div className="absolute left-1/2 top-full z-50 mt-3 min-w-[200px] -translate-x-1/2 overflow-hidden rounded-2xl border border-slate-900/10 bg-white/95 shadow-2xl backdrop-blur-xl dark:border-white/10 dark:bg-[#0a0d14]/95">
                    <button
                      type="button"
                      className="flex w-full items-center gap-3 px-4 py-3 text-sm text-slate-800 transition hover:bg-slate-900/5 dark:text-white/90 dark:hover:bg-white/5"
                      onClick={handleCameraClick}
                    >
                      <Camera className="h-4 w-4 text-amber-600 dark:text-amber-200" />
                      Tirar foto
                    </button>
                    <button
                      type="button"
                      className="flex w-full items-center gap-3 border-t border-slate-900/5 px-4 py-3 text-sm text-slate-800 transition hover:bg-slate-900/5 dark:border-white/5 dark:text-white/90 dark:hover:bg-white/5"
                      onClick={handleGalleryClick}
                    >
                      <ImageIcon className="h-4 w-4 text-amber-600 dark:text-amber-200" />
                      Da galeria
                    </button>
                  </div>
                </>
              )}
            </div>
            <p className="mt-4 text-[10px] uppercase tracking-[0.28em] text-slate-400 dark:text-white/30">
              Toque para alterar
            </p>
          </div>

          {/* Form */}
          <div className="mt-8 space-y-5">
            <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
              <FieldWrap label="Nome">
                <Input
                  id="profile-first-name"
                  value={profileFirstName}
                  onChange={(e) => setProfileFirstName(e.target.value)}
                  className={inputClass}
                  placeholder="Nome"
                />
              </FieldWrap>
              <FieldWrap label="Sobrenome">
                <Input
                  id="profile-last-name"
                  value={profileLastName}
                  onChange={(e) => setProfileLastName(e.target.value)}
                  className={inputClass}
                  placeholder="Sobrenome"
                />
              </FieldWrap>
            </div>

            <FieldWrap
              label="Username único"
              hint="Letras minúsculas, números e _. Exclusivo no sistema."
            >
              <Input
                id="profile-username"
                value={profileUsername}
                onChange={(e) => setProfileUsername(e.target.value.toLowerCase())}
                className={inputClass}
                placeholder="seu_username"
                autoCapitalize="none"
              />
            </FieldWrap>

            <FieldWrap label="Email" hint="Bloqueado por segurança da conta.">
              <Input
                id="profile-email"
                type="email"
                value={profileEmail}
                readOnly
                disabled
                className={`${inputClass} cursor-not-allowed opacity-60`}
                placeholder="seu@email.com"
              />
            </FieldWrap>

            <Button
              onClick={handleSaveProfile}
              className="h-12 w-full rounded-2xl bg-slate-900 text-sm font-semibold text-white shadow-[0_10px_40px_-15px_rgba(15,23,42,0.5)] transition hover:bg-slate-800 dark:bg-white dark:text-black dark:shadow-[0_10px_40px_-15px_rgba(255,255,255,0.4)] dark:hover:bg-white/90"
            >
              <Save className="mr-2 h-4 w-4" />
              Salvar alterações
            </Button>
          </div>
        </section>

        {/* ── 02 · Segurança ────────────────────────────────────────── */}
        <SectionHeader number="02" title="Segurança" subtitle="Credenciais e acesso" />
        <section className="mt-5 rounded-[28px] border border-slate-900/10 bg-white/60 p-6 backdrop-blur-xl dark:border-white/10 dark:bg-white/[0.04] md:p-8">
          <div className="flex items-start gap-4">
            <div className="hidden h-12 w-12 shrink-0 items-center justify-center rounded-2xl border border-slate-900/10 bg-slate-900/[0.04] dark:border-white/10 dark:bg-white/[0.04] md:flex">
              <KeyRound className="h-5 w-5 text-amber-600 dark:text-amber-200" />
            </div>
            <div className="min-w-0 flex-1">
              <h3 className="text-base font-semibold text-slate-900 dark:text-white">
                Alteração de senha
              </h3>
              <p className="mt-1.5 text-sm leading-relaxed text-slate-600 dark:text-white/50">
                Para manter sua conta segura, a redefinição de senha acontece em uma tela dedicada com validação adicional.
              </p>
              <Button
                variant="outline"
                onClick={() => navigate('/settings/change-password')}
                className="mt-5 h-11 rounded-2xl border-slate-900/15 bg-slate-900/[0.03] px-5 text-slate-900 hover:border-slate-900/25 hover:bg-slate-900/[0.08] dark:border-white/15 dark:bg-white/[0.03] dark:text-white dark:hover:border-white/25 dark:hover:bg-white/[0.08]"
              >
                Ir para alteração de senha
                <ChevronRight className="ml-1 h-4 w-4" />
              </Button>
            </div>
          </div>
        </section>

        {/* ── 03 · Aparência ────────────────────────────────────────── */}
        <SectionHeader number="03" title="Aparência" subtitle="Tema e visual" />
        <section className="mt-5 rounded-[28px] border border-slate-900/10 bg-white/60 p-6 backdrop-blur-xl dark:border-white/10 dark:bg-white/[0.04] md:p-8">
          <div className="grid grid-cols-2 gap-4">
            <ThemeCard
              active={theme === 'light'}
              onClick={() => setTheme('light')}
              label="Claro"
              icon={<Sun className="h-4 w-4 text-amber-500 dark:text-amber-200" />}
              palette={['#f4f4f5', '#ffffff', '#e4e4e7', '#2B4BF2']}
            />
            <ThemeCard
              active={theme === 'dark'}
              onClick={() => setTheme('dark')}
              label="Escuro"
              icon={<Moon className="h-4 w-4 text-indigo-500 dark:text-indigo-300" />}
              palette={['#0a0d14', '#0D1A6E', '#1a1a1a', '#2B4BF2']}
            />
          </div>
        </section>

        {/* ── 04 · Pessoas ──────────────────────────────────────────── */}
        <SectionHeader number="04" title="Pessoas" subtitle="Titulares de gastos" />
        <section className="mt-5 rounded-[28px] border border-slate-900/10 bg-white/60 p-6 backdrop-blur-xl dark:border-white/10 dark:bg-white/[0.04] md:p-8">
          <div className="flex items-start justify-between gap-4">
            <p className="max-w-sm text-sm leading-relaxed text-slate-600 dark:text-white/50">
              Pessoas cadastradas para usar como titular nas divisões de compras e gastos.
            </p>
            <Dialog open={isAddPersonOpen} onOpenChange={setIsAddPersonOpen}>
              <DialogTrigger asChild>
                <Button
                  size="sm"
                  className="h-9 shrink-0 rounded-xl bg-slate-900 px-4 text-white hover:bg-slate-800 dark:bg-white dark:text-black dark:hover:bg-white/90"
                >
                  <Plus className="mr-1 h-4 w-4" />
                  Adicionar
                </Button>
              </DialogTrigger>
              <DialogContent className="sm:max-w-xs">
                <DialogHeader>
                  <DialogTitle>Adicionar Pessoa</DialogTitle>
                </DialogHeader>
                <div className="mt-4 space-y-4">
                  <Input
                    placeholder="Nome da pessoa"
                    value={newPersonName}
                    onChange={(e) => setNewPersonName(e.target.value)}
                    className="input-finance"
                    onKeyDown={(e) => e.key === 'Enter' && handleAddPerson()}
                  />
                  <Button onClick={handleAddPerson} className="h-11 w-full rounded-xl">
                    Adicionar
                  </Button>
                </div>
              </DialogContent>
            </Dialog>
          </div>

          <div className="mt-6 divide-y divide-slate-900/5 overflow-hidden rounded-2xl border border-slate-900/10 bg-slate-900/[0.02] dark:divide-white/5 dark:border-white/5 dark:bg-white/[0.02]">
            {people.map((person) => (
              <div
                key={person}
                className="flex items-center justify-between px-4 py-3.5 transition hover:bg-slate-900/[0.03] dark:hover:bg-white/[0.03]"
              >
                <div className="flex items-center gap-3">
                  <div className="flex h-9 w-9 items-center justify-center rounded-full border border-slate-900/10 bg-gradient-to-br from-slate-900/10 to-slate-900/[0.02] text-sm font-semibold text-slate-900 dark:border-white/10 dark:from-white/15 dark:to-white/[0.02] dark:text-white">
                    {person.charAt(0).toUpperCase()}
                  </div>
                  <span className="text-sm text-slate-800 dark:text-white/90">{person}</span>
                </div>
                {person !== 'Eu' ? (
                  <Button
                    variant="ghost"
                    size="icon"
                    onClick={() => handleRemovePerson(person)}
                    className="h-8 w-8 text-slate-400 hover:bg-red-500/10 hover:text-red-500 dark:text-white/40 dark:hover:text-red-400"
                  >
                    <Trash2 className="h-4 w-4" />
                  </Button>
                ) : (
                  <span className="text-[9px] uppercase tracking-[0.28em] text-slate-400 dark:text-white/30">
                    Você
                  </span>
                )}
              </div>
            ))}
          </div>
        </section>

        {/* ── 05 · Administração (condicional) ──────────────────────── */}
        {authService.isAdmin() && (
          <>
            <SectionHeader number="05" title="Administração" subtitle="Restrito" accent="red" />
            <section className="mt-5 rounded-[28px] border border-red-500/25 bg-gradient-to-br from-red-500/10 to-transparent p-6 backdrop-blur-xl dark:border-red-400/20 dark:from-red-500/[0.06] md:p-8">
              <div className="flex items-start gap-4">
                <div className="hidden h-12 w-12 shrink-0 items-center justify-center rounded-2xl border border-red-500/25 bg-red-500/10 dark:border-red-400/20 dark:bg-red-500/10 md:flex">
                  <Shield className="h-5 w-5 text-red-600 dark:text-red-300" />
                </div>
                <div className="min-w-0 flex-1">
                  <h3 className="text-base font-semibold text-slate-900 dark:text-white">
                    Gestão de usuários
                  </h3>
                  <p className="mt-1.5 text-sm leading-relaxed text-slate-600 dark:text-white/50">
                    Área exclusiva para administradores. Controle de contas, permissões e políticas.
                  </p>
                  <Button
                    variant="outline"
                    onClick={() => navigate('/users')}
                    className="mt-5 h-11 rounded-2xl border-red-500/30 bg-red-500/[0.08] px-5 text-red-700 hover:border-red-500/50 hover:bg-red-500/15 dark:border-red-400/25 dark:bg-red-500/[0.06] dark:text-red-100 dark:hover:border-red-400/40 dark:hover:bg-red-500/10"
                  >
                    <Users className="mr-2 h-4 w-4" />
                    Gerenciar usuários e permissões
                  </Button>
                </div>
              </div>
            </section>
          </>
        )}

        {/* ── Danger zone ───────────────────────────────────────────── */}
        <div className="mt-20 border-t border-slate-900/10 pt-10 dark:border-white/10">
          <div className="flex items-center gap-2 text-[10px] uppercase tracking-[0.32em] text-red-600/70 dark:text-red-300/60">
            <span className="inline-block h-[1px] w-7 bg-red-500/50 dark:bg-red-300/40" />
            Zona de encerramento
          </div>
          <div className="mt-5 flex flex-col items-start justify-between gap-4 rounded-[28px] border border-red-500/20 bg-red-500/[0.05] p-6 dark:border-red-400/15 dark:bg-red-500/[0.04] md:flex-row md:items-center md:p-8">
            <div className="min-w-0">
              <h3 className="font-serif text-[22px] text-slate-900 dark:text-white">
                Encerrar sessão
              </h3>
              <p className="mt-1 text-sm text-slate-600 dark:text-white/50">
                Desconectar este dispositivo. Você pode voltar a qualquer momento.
              </p>
            </div>
            <Button
              onClick={handleLogout}
              className="h-12 rounded-2xl bg-red-500/90 px-6 text-white shadow-[0_10px_30px_-10px_rgba(239,68,68,0.6)] hover:bg-red-500"
            >
              <LogOut className="mr-2 h-4 w-4" />
              Sair da conta
            </Button>
          </div>
        </div>

        {/* ── Footer ────────────────────────────────────────────────── */}
        <footer className="mt-14 flex flex-col items-center gap-2.5 text-[10px] uppercase tracking-[0.3em] text-slate-400 dark:text-white/25">
          <div className="h-px w-20 bg-slate-900/10 dark:bg-white/10" />
          <span>AltCorp Wallet · v1.0.0</span>
        </footer>
      </div>

      <BottomNav />
    </div>
  );
};

export default Settings;
