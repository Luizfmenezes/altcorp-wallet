import React, { useState, useEffect, useCallback, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { Eye, EyeOff, LogIn, LogOut, User, Mail, Lock, ArrowLeft, UserPlus, KeyRound, CheckCircle2, RefreshCw } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { useAuth } from '@/contexts/AuthContext';
import { useToast } from '@/hooks/use-toast';
import authService from '@/services/authService';

const INTRO_IMAGES = ['/intro1.png', '/intro2.png', '/intro3.png'];

type AuthView = 'welcome' | 'login' | 'register' | 'verify-email' | 'forgot-password' | 'reset-password';

declare global {
  interface Window {
    google?: {
      accounts: {
        id: {
          initialize: (config: Record<string, unknown>) => void;
          renderButton: (element: HTMLElement, config: Record<string, unknown>) => void;
          prompt: () => void;
        };
      };
    };
  }
}

const VERIFY_SESSION_KEY = 'altcorp_verify_pending';
const VERIFY_SESSION_TTL_MS = 30 * 60 * 1000; // 30 minutos

function shouldUseGoogleRedirectFlow() {
  const ua = navigator.userAgent.toLowerCase();
  const isStandalone = globalThis.matchMedia('(display-mode: standalone)').matches || (globalThis.navigator as Navigator & { standalone?: boolean }).standalone === true;
  const isWebView = ua.includes('wv') || ua.includes('webview') || ua.includes('capacitor');
  const isMobile = /android|iphone|ipad|ipod/.test(ua);
  return isStandalone || (isMobile && isWebView);
}

function saveVerifySession(email: string) {
  sessionStorage.setItem(VERIFY_SESSION_KEY, JSON.stringify({
    email,
    expiresAt: Date.now() + VERIFY_SESSION_TTL_MS,
  }));
}

function loadVerifySession(): string | null {
  try {
    const raw = sessionStorage.getItem(VERIFY_SESSION_KEY);
    if (!raw) return null;
    const { email, expiresAt } = JSON.parse(raw);
    if (Date.now() > expiresAt) {
      sessionStorage.removeItem(VERIFY_SESSION_KEY);
      return null;
    }
    return email as string;
  } catch {
    return null;
  }
}

function clearVerifySession() {
  sessionStorage.removeItem(VERIFY_SESSION_KEY);
}

const Login: React.FC = () => {
  // Restaurar sessão de verificação pendente (se houver)
  const pendingVerify = loadVerifySession();

  // Auth view state
  const [view, setView] = useState<AuthView>(pendingVerify ? 'verify-email' : 'welcome');
  
  // Login fields
  const [loginIdentifier, setLoginIdentifier] = useState('');
  const [loginPassword, setLoginPassword] = useState('');
  const [showLoginPassword, setShowLoginPassword] = useState(false);
  
  // Register fields
  const [regName, setRegName] = useState('');
  const [regEmail, setRegEmail] = useState('');
  const [regUsername, setRegUsername] = useState('');
  const [regPassword, setRegPassword] = useState('');
  const [regConfirmPassword, setRegConfirmPassword] = useState('');
  const [showRegPassword, setShowRegPassword] = useState(false);
  
  // Verify email fields
  const [verifyEmail, setVerifyEmail] = useState(pendingVerify ?? '');
  const [verifyCode, setVerifyCode] = useState('');
  
  // Forgot / Reset password fields
  const [resetEmail, setResetEmail] = useState('');
  const [resetCode, setResetCode] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmNewPassword, setConfirmNewPassword] = useState('');
  const [showNewPassword, setShowNewPassword] = useState(false);
  const [resetStep, setResetStep] = useState<'email' | 'code'>('email');
  
  // Loading states
  const [isLoading, setIsLoading] = useState(false);
  const [resendCooldown, setResendCooldown] = useState(0);

  // Animation
  const [animPhase, setAnimPhase] = useState<'center' | 'rising' | 'top'>(pendingVerify ? 'top' : 'center');
  const [contentVisible, setContentVisible] = useState(Boolean(pendingVerify));

  // Carousel
  const [currentImage, setCurrentImage] = useState(0);
  const [nextImage, setNextImage] = useState(1);
  const [transitioning, setTransitioning] = useState(false);

  // User from last login
  const lastUser = authService.getLastLoginUser();

  // Keyboard detection
  const [keyboardOpen, setKeyboardOpen] = useState(false);
  const [googleReady, setGoogleReady] = useState(false);
  
  // Ref estável para o callback do Google
  const googleCallbackRef = useRef<(response: { credential: string }) => void>(() => {});

  // Viewport handling
  useEffect(() => {
    const updateVh = () => {
      const vv = window.visualViewport;
      const vh = vv?.height ?? window.innerHeight;
      document.documentElement.style.setProperty('--vh', `${vh * 0.01}px`);
      if (vv) {
        setKeyboardOpen(vv.height < window.innerHeight * 0.75);
      }
    };
    updateVh();
    window.visualViewport?.addEventListener('resize', updateVh);
    window.visualViewport?.addEventListener('scroll', updateVh);
    window.addEventListener('resize', updateVh);
    return () => {
      window.visualViewport?.removeEventListener('resize', updateVh);
      window.visualViewport?.removeEventListener('scroll', updateVh);
      window.removeEventListener('resize', updateVh);
    };
  }, []);

  const { login, verifyEmail: ctxVerifyEmail, googleLogin, logout } = useAuth();
  const navigate = useNavigate();
  const { toast } = useToast();

  // Animation phases
  useEffect(() => {
    const riseTimer = setTimeout(() => setAnimPhase('rising'), 1200);
    const topTimer = setTimeout(() => {
      setAnimPhase('top');
      setTimeout(() => setContentVisible(true), 200);
    }, 2200);
    return () => { clearTimeout(riseTimer); clearTimeout(topTimer); };
  }, []);

  // Carousel
  const advanceCarousel = useCallback(() => {
    setTransitioning(true);
    setNextImage((currentImage + 1) % INTRO_IMAGES.length);
    setTimeout(() => {
      setCurrentImage((prev) => (prev + 1) % INTRO_IMAGES.length);
      setTransitioning(false);
    }, 1200);
  }, [currentImage]);

  useEffect(() => {
    const interval = setInterval(advanceCarousel, 5000);
    return () => clearInterval(interval);
  }, [advanceCarousel]);

  // Resend cooldown timer
  useEffect(() => {
    if (resendCooldown > 0) {
      const timer = setTimeout(() => setResendCooldown(resendCooldown - 1), 1000);
      return () => clearTimeout(timer);
    }
  }, [resendCooldown]);

  // ====== GOOGLE LOGIN HANDLERS ======

  const handleGoogleCallback = useCallback(async (response: { credential: string }) => {
    setIsLoading(true);
    try {
      const success = await googleLogin(response.credential);
      if (success) {
        toast({ title: 'Bem-vindo!', description: 'Login com Google realizado.' });
        navigate('/dashboard');
      } else {
        toast({ title: 'Erro', description: 'Falha no login com Google.', variant: 'destructive' });
      }
    } catch {
      toast({ title: 'Erro', description: 'Falha no login com Google.', variant: 'destructive' });
    } finally {
      setIsLoading(false);
    }
  }, [googleLogin, navigate, toast]);

  useEffect(() => {
    googleCallbackRef.current = (response: { credential: string }) => {
      void handleGoogleCallback(response);
    };
  }, [handleGoogleCallback]);

  const googleClientId = import.meta.env.VITE_GOOGLE_CLIENT_ID || '';
  const googleEnabled = Boolean(googleClientId);
  const useGoogleRedirectFlow = shouldUseGoogleRedirectFlow();

  useEffect(() => {
    if (!googleEnabled) {
      setGoogleReady(false);
      return;
    }

    let cancelled = false;
    let attempts = 0;
    const maxAttempts = 80;

    const pollGoogle = () => {
      if (cancelled) return;
      if (globalThis.google?.accounts?.id) {
        setGoogleReady(true);
        return;
      }

      attempts += 1;
      if (attempts < maxAttempts) {
        globalThis.setTimeout(pollGoogle, 250);
      }
    };

    pollGoogle();
    return () => {
      cancelled = true;
    };
  }, [googleEnabled]);

  useEffect(() => {
    const params = new URLSearchParams(globalThis.location.search);
    const provider = params.get('auth_provider');
    const redirectToken = params.get('auth_token');
    const redirectError = params.get('auth_error');
    if (provider !== 'google') return;

    const cleanUrl = () => {
      globalThis.history.replaceState({}, document.title, globalThis.location.pathname);
    };

    if (redirectError) {
      cleanUrl();
      toast({ title: 'Erro', description: redirectError, variant: 'destructive' });
      return;
    }

    if (!redirectToken) return;

    let isMounted = true;
    setIsLoading(true);
    authService.completeGoogleRedirectLogin(redirectToken)
      .then(() => {
        if (!isMounted) return;
        cleanUrl();
        toast({ title: 'Bem-vindo!', description: 'Login com Google realizado.' });
        navigate('/dashboard');
      })
      .catch(() => {
        if (!isMounted) return;
        cleanUrl();
        toast({ title: 'Erro', description: 'Falha no login com Google.', variant: 'destructive' });
      })
      .finally(() => {
        if (isMounted) setIsLoading(false);
      });

    return () => {
      isMounted = false;
    };
  }, [navigate, toast]);

  const handleGoogleRedirectLogin = useCallback(async () => {
    setIsLoading(true);
    try {
      const redirectUrl = await authService.getGoogleRedirectUrl();
      globalThis.location.href = redirectUrl;
    } catch {
      toast({ title: 'Erro', description: 'Falha ao iniciar login com Google.', variant: 'destructive' });
      setIsLoading(false);
    }
  }, [toast]);

  // Inicializa o GSI
  useEffect(() => {
    if (!googleEnabled || useGoogleRedirectFlow || !googleReady || !globalThis.google) return;
    try {
      globalThis.google.accounts.id.initialize({
        client_id: googleClientId,
        callback: (resp: { credential: string }) => googleCallbackRef.current(resp),
        ux_mode: 'popup',
        auto_select: true,
        cancel_on_tap_outside: false,
        itp_support: true,
      });
    } catch (e) {
      console.warn('Google login not configured:', e);
    }
  }, [googleEnabled, googleClientId, useGoogleRedirectFlow, googleReady]);

  useEffect(() => {
    if (!googleEnabled || useGoogleRedirectFlow || !googleReady || !globalThis.google) return;
    if (view !== 'welcome' && view !== 'login') return;

    const timer = globalThis.setTimeout(() => {
      try {
        globalThis.google?.accounts.id.prompt();
      } catch (error) {
        console.warn('Google prompt failed:', error);
      }
    }, 250);

    return () => globalThis.clearTimeout(timer);
  }, [googleEnabled, googleReady, useGoogleRedirectFlow, view]);

  const startGoogleSignIn = useCallback(async () => {
    if (useGoogleRedirectFlow) {
      await handleGoogleRedirectLogin();
      return;
    }

    if (!googleReady || !globalThis.google) {
      toast({ title: 'Erro', description: 'Google Login ainda está carregando. Tente novamente em alguns segundos.', variant: 'destructive' });
      return;
    }

    try {
      globalThis.google.accounts.id.prompt();
    } catch {
      toast({ title: 'Erro', description: 'Não foi possível iniciar o login com Google.', variant: 'destructive' });
    }
  }, [googleReady, handleGoogleRedirectLogin, toast, useGoogleRedirectFlow]);

  // ====== AUTH HANDLERS ======

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    try {
      const success = await login(loginIdentifier, loginPassword);
      if (success) {
        toast({ title: 'Bem-vindo!', description: 'Login realizado com sucesso.' });
        navigate('/dashboard');
      } else {
        toast({ title: 'Erro no login', description: 'Credenciais incorretas.', variant: 'destructive' });
      }
    } catch (err: unknown) {
      const error = err as { response?: { status?: number; headers?: Record<string, string> } };
      if (error?.response?.status === 403 && error?.response?.headers?.['x-email-unverified']) {
        setVerifyEmail(loginIdentifier);
        saveVerifySession(loginIdentifier);
        setView('verify-email');
        toast({ title: 'Email não verificado', description: 'Verifique seu email para continuar.' });
      } else {
        toast({ title: 'Erro', description: 'Credenciais incorretas.', variant: 'destructive' });
      }
    } finally {
      setIsLoading(false);
    }
  };

  const handleRegister = async (e: React.FormEvent) => {
    e.preventDefault();
    if (regUsername.length < 3) {
      toast({ title: 'Erro', description: 'Username deve ter pelo menos 3 caracteres.', variant: 'destructive' });
      return;
    }
    if (!/^[a-z0-9_]+$/.test(regUsername)) {
      toast({ title: 'Erro', description: 'Username só pode conter letras, números e _', variant: 'destructive' });
      return;
    }
    if (regPassword !== regConfirmPassword) {
      toast({ title: 'Erro', description: 'As senhas não conferem.', variant: 'destructive' });
      return;
    }
    if (regPassword.length < 6) {
      toast({ title: 'Erro', description: 'A senha deve ter pelo menos 6 caracteres.', variant: 'destructive' });
      return;
    }
    setIsLoading(true);
    try {
      const result = await authService.register({
        name: regName,
        email: regEmail,
        username: regUsername,
        password: regPassword,
        confirm_password: regConfirmPassword,
      });
      
      if (result.requires_verification) {
        setVerifyEmail(regEmail);
        saveVerifySession(regEmail);
        setView('verify-email');
        toast({ title: 'Conta criada!', description: 'Verifique o código enviado para seu email.' });
      } else {
        const success = await login(regUsername, regPassword);
        if (success) {
          toast({ title: 'Bem-vindo!', description: 'Conta de administrador criada.' });
          navigate('/dashboard');
        }
      }
    } catch (err: unknown) {
      const error = err as { response?: { data?: { detail?: string } } };
      toast({
        title: 'Erro no cadastro',
        description: error?.response?.data?.detail || 'Não foi possível criar a conta.',
        variant: 'destructive',
      });
    } finally {
      setIsLoading(false);
    }
  };

  const handleVerifyEmail = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    try {
      const success = await ctxVerifyEmail(verifyEmail, verifyCode);
      if (success) {
        clearVerifySession();
        toast({ title: 'Email verificado!', description: 'Sua conta está ativa.' });
        navigate('/dashboard');
      } else {
        toast({ title: 'Erro', description: 'Código inválido ou expirado.', variant: 'destructive' });
      }
    } catch {
      toast({ title: 'Erro', description: 'Código inválido ou expirado.', variant: 'destructive' });
    } finally {
      setIsLoading(false);
    }
  };

  const handleResendCode = async () => {
    if (resendCooldown > 0) return;
    try {
      await authService.resendCode(verifyEmail);
      setResendCooldown(60);
      toast({ title: 'Código reenviado', description: 'Verifique seu email.' });
    } catch {
      toast({ title: 'Erro', description: 'Não foi possível reenviar o código.', variant: 'destructive' });
    }
  };

  const handleForgotPassword = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    try {
      await authService.forgotPassword(resetEmail);
      setResetStep('code');
      toast({ title: 'Código enviado', description: 'Verifique seu email para o código de redefinição.' });
    } catch {
      toast({ title: 'Erro', description: 'Não foi possível enviar o código.', variant: 'destructive' });
    } finally {
      setIsLoading(false);
    }
  };

  const handleResetPassword = async (e: React.FormEvent) => {
    e.preventDefault();
    if (newPassword !== confirmNewPassword) {
      toast({ title: 'Erro', description: 'As senhas não conferem.', variant: 'destructive' });
      return;
    }
    if (newPassword.length < 6) {
      toast({ title: 'Erro', description: 'A senha deve ter pelo menos 6 caracteres.', variant: 'destructive' });
      return;
    }
    setIsLoading(true);
    try {
      await authService.resetPassword({
        email: resetEmail,
        code: resetCode,
        new_password: newPassword,
        confirm_password: confirmNewPassword,
      });
      toast({ title: 'Senha redefinida!', description: 'Faça login com sua nova senha.' });
      setView('login');
      setLoginIdentifier(resetEmail);
      setLoginPassword('');
    } catch (err: unknown) {
      const error = err as { response?: { data?: { detail?: string } } };
      toast({
        title: 'Erro',
        description: error?.response?.data?.detail || 'Código inválido ou expirado.',
        variant: 'destructive',
      });
    } finally {
      setIsLoading(false);
    }
  };

  const handleQuickLogin = () => {
    if (lastUser?.provider === 'google') {
      setView('login');
      void startGoogleSignIn();
      return;
    }
    setView('login');
    if (lastUser) {
      setLoginIdentifier(lastUser.username);
    }
  };

  const handleLogout = () => {
    authService.clearLastLoginUser();
    logout();
    toast({ title: 'Sessão encerrada', description: 'Você foi desconectado.' });
  };

  const goBack = () => {
    if (view === 'verify-email') {
      clearVerifySession();
      setVerifyCode('');
      setView('login');
    } else if (view === 'forgot-password' || view === 'reset-password') {
      setView('login');
    } else if (view === 'login' || view === 'register') {
      setView('welcome');
    }
  };

  const getInitial = (name: string) => name?.charAt(0)?.toUpperCase() || 'U';

  const inputClass = "h-12 rounded-xl bg-white/10 border-white/10 text-white placeholder:text-white/40 focus:border-white/30 focus:ring-white/20";
  const Spinner = () => <div className="w-5 h-5 border-2 border-black/30 border-t-black rounded-full animate-spin" />;

  const renderGoogleAction = (label = 'Continuar com Google') => (
    <Button
      type="button"
      onClick={() => void startGoogleSignIn()}
      disabled={isLoading}
      className="w-full h-12 rounded-2xl font-semibold text-base bg-white text-black hover:bg-white/90 shadow-lg"
    >
      {isLoading ? <Spinner /> : label}
    </Button>
  );

  // ====== RENDER VIEWS ======

  const renderWelcome = () => (
    <div className="w-full max-w-sm flex flex-col items-center gap-4">
      {lastUser ? (
        <>
          <div className="w-24 h-24 rounded-full bg-white/10 border-2 border-white/30 flex items-center justify-center overflow-hidden backdrop-blur-sm shadow-xl">
            {lastUser.profile_photo ? (
              <img src={lastUser.profile_photo} alt={lastUser.name} className="w-full h-full object-cover" />
            ) : (
              <span className="text-3xl font-bold text-white">{getInitial(lastUser.name)}</span>
            )}
          </div>
          <div className="text-center">
            <p className="text-white/60 text-xs uppercase tracking-widest mb-1">Bem-vindo de volta</p>
            <p className="text-white text-xl font-semibold">{lastUser.name}</p>
          </div>
          <Button onClick={handleQuickLogin} className="w-full h-12 rounded-2xl font-semibold text-base bg-white text-black hover:bg-white/90 shadow-lg mt-2">
            <LogIn className="w-5 h-5 mr-2" /> {lastUser.provider === 'google' ? 'Continuar com Google' : 'Entrar'}
          </Button>
          {googleEnabled && (
            <div className="w-full mt-1">
              <div className="flex items-center gap-3 mb-3">
                <div className="flex-1 h-px bg-white/20" />
                <span className="text-white/40 text-xs">ou</span>
                <div className="flex-1 h-px bg-white/20" />
              </div>
              {renderGoogleAction()}
            </div>
          )}
          <Button onClick={handleLogout} variant="ghost" className="w-full h-11 rounded-2xl font-medium text-sm text-red-400 hover:text-red-300 hover:bg-red-500/10 border border-red-500/30">
            <LogOut className="w-4 h-4 mr-2" /> Sair da conta
          </Button>
        </>
      ) : (
        <>
          <div className="text-center mb-2">
            <p className="text-white/70 text-sm">Gerencie suas finanças com inteligência</p>
          </div>
          <Button onClick={() => setView('login')} className="w-full h-12 rounded-2xl font-semibold text-base bg-white text-black hover:bg-white/90 shadow-lg">
            <LogIn className="w-5 h-5 mr-2" /> Entrar na conta
          </Button>
          <Button onClick={() => setView('register')} variant="ghost" className="w-full h-11 rounded-2xl font-medium text-sm text-white/70 hover:text-white hover:bg-white/10 border border-white/20">
            <UserPlus className="w-4 h-4 mr-2" /> Criar conta
          </Button>

          {/* Botão Oficial do Google (Nativo) */}
          {googleEnabled && (
            <div className="w-full mt-1">
              <div className="flex items-center gap-3 mb-3">
                <div className="flex-1 h-px bg-white/20" />
                <span className="text-white/40 text-xs">ou</span>
                <div className="flex-1 h-px bg-white/20" />
              </div>
              {renderGoogleAction()}
            </div>
          )}
        </>
      )}
    </div>
  );

  const renderLogin = () => (
    <div className="w-full max-w-sm">
      <form onSubmit={handleLogin} className="flex flex-col gap-3">
        <div className="bg-white/10 backdrop-blur-xl rounded-2xl p-5 border border-white/10 space-y-3">
          <div className="flex items-center justify-center mb-2">
            {lastUser?.profile_photo ? (
              <div className="w-16 h-16 rounded-full overflow-hidden border-2 border-white/20 shadow-lg">
                <img src={lastUser.profile_photo} alt={lastUser.name} className="w-full h-full object-cover" />
              </div>
            ) : (
              <div className="w-12 h-12 rounded-full bg-white/10 flex items-center justify-center">
                <User className="w-6 h-6 text-white/70" />
              </div>
            )}
          </div>

          <div className="relative">
            <Mail className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-white/40" />
            <Input
              type="text"
              placeholder="Email ou username"
              value={loginIdentifier}
              onChange={(e) => setLoginIdentifier(e.target.value)}
              className={`${inputClass} pl-10`}
              required
              autoFocus={!lastUser}
            />
          </div>

          <div className="relative">
            <Lock className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-white/40" />
            <Input
              type={showLoginPassword ? 'text' : 'password'}
              placeholder="Senha"
              value={loginPassword}
              onChange={(e) => setLoginPassword(e.target.value)}
              className={`${inputClass} pl-10 pr-12`}
              required
              autoFocus={!!lastUser}
            />
            <button type="button" onClick={() => setShowLoginPassword(!showLoginPassword)} className="absolute right-4 top-1/2 -translate-y-1/2 text-white/40 hover:text-white/70 transition-colors">
              {showLoginPassword ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
            </button>
          </div>

          <button type="button" onClick={() => { setView('forgot-password'); setResetStep('email'); }} className="text-xs text-white/50 hover:text-white/80 transition-colors text-right w-full">
            Esqueceu a senha?
          </button>
        </div>

        <Button type="submit" className="w-full h-12 rounded-2xl font-semibold text-base bg-white text-black hover:bg-white/90 shadow-lg" disabled={isLoading}>
          {isLoading ? <Spinner /> : <><LogIn className="w-5 h-5 mr-2" /> Entrar</>}
        </Button>

        {/* Botão Oficial do Google (Nativo) */}
        {googleEnabled && (
          <>
            <div className="flex items-center gap-3 mt-1 mb-1">
              <div className="flex-1 h-px bg-white/20" />
              <span className="text-white/40 text-xs">ou</span>
              <div className="flex-1 h-px bg-white/20" />
            </div>
            {renderGoogleAction()}
          </>
        )}

        <div className="flex items-center justify-center gap-1 mt-1">
          <span className="text-white/50 text-sm">Não tem conta?</span>
          <button type="button" onClick={() => setView('register')} className="text-white font-medium text-sm hover:underline">Criar conta</button>
        </div>

        <Button type="button" variant="ghost" onClick={goBack} className="w-full h-10 rounded-2xl text-white/60 hover:text-white hover:bg-white/10 text-sm">
          <ArrowLeft className="w-4 h-4 mr-2" /> Voltar
        </Button>
      </form>
    </div>
  );

  const renderRegister = () => (
    <div className="w-full max-w-sm">
      <form onSubmit={handleRegister} className="flex flex-col gap-3">
        <div className="bg-white/10 backdrop-blur-xl rounded-2xl p-5 border border-white/10 space-y-3">
          <div className="text-center mb-1">
            <h2 className="text-white text-lg font-semibold">Criar conta</h2>
            <p className="text-white/50 text-xs">Preencha os dados abaixo</p>
          </div>

          <div className="relative">
            <User className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-white/40" />
            <Input type="text" placeholder="Seu nome" value={regName} onChange={(e) => setRegName(e.target.value)} className={`${inputClass} pl-10`} required autoFocus />
          </div>

          <div className="relative">
            <Mail className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-white/40" />
            <Input type="email" placeholder="Email" value={regEmail} onChange={(e) => setRegEmail(e.target.value)} className={`${inputClass} pl-10`} required />
          </div>

          <div className="relative">
            <span className="absolute left-3 top-1/2 -translate-y-1/2 text-white/40 text-sm font-medium">@</span>
            <Input
              type="text"
              placeholder="username (ex: joao_silva)"
              value={regUsername}
              onChange={(e) => setRegUsername(e.target.value.toLowerCase().replaceAll(/[^a-z0-9_]/g, '').slice(0, 30))}
              className={`${inputClass} pl-10`}
              maxLength={30}
              required
            />
          </div>

          <div className="relative">
            <Lock className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-white/40" />
            <Input type={showRegPassword ? 'text' : 'password'} placeholder="Senha" value={regPassword} onChange={(e) => setRegPassword(e.target.value)} className={`${inputClass} pl-10 pr-12`} required />
            <button type="button" onClick={() => setShowRegPassword(!showRegPassword)} className="absolute right-4 top-1/2 -translate-y-1/2 text-white/40 hover:text-white/70 transition-colors">
              {showRegPassword ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
            </button>
          </div>

          <div className="relative">
            <Lock className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-white/40" />
            <Input type="password" placeholder="Confirmar senha" value={regConfirmPassword} onChange={(e) => setRegConfirmPassword(e.target.value)} className={`${inputClass} pl-10`} required />
          </div>
        </div>

        <Button type="submit" className="w-full h-12 rounded-2xl font-semibold text-base bg-white text-black hover:bg-white/90 shadow-lg" disabled={isLoading}>
          {isLoading ? <Spinner /> : <><UserPlus className="w-5 h-5 mr-2" /> Criar conta</>}
        </Button>

        <div className="flex items-center justify-center gap-1 mt-1">
          <span className="text-white/50 text-sm">Já tem conta?</span>
          <button type="button" onClick={() => setView('login')} className="text-white font-medium text-sm hover:underline">Entrar</button>
        </div>

        <Button type="button" variant="ghost" onClick={goBack} className="w-full h-10 rounded-2xl text-white/60 hover:text-white hover:bg-white/10 text-sm">
          <ArrowLeft className="w-4 h-4 mr-2" /> Voltar
        </Button>
      </form>
    </div>
  );

  const renderVerifyEmail = () => (
    <div className="w-full max-w-sm">
      <form onSubmit={handleVerifyEmail} className="flex flex-col gap-3">
        <div className="bg-white/10 backdrop-blur-xl rounded-2xl p-5 border border-white/10 space-y-4">
          <div className="text-center">
            <div className="w-14 h-14 rounded-full bg-emerald-500/20 flex items-center justify-center mx-auto mb-3">
              <CheckCircle2 className="w-7 h-7 text-emerald-400" />
            </div>
            <h2 className="text-white text-lg font-semibold">Verificar email</h2>
            <p className="text-white/50 text-xs mt-1">
              Enviamos um código para<br />
              <span className="text-white/80 font-medium">{verifyEmail}</span>
            </p>
          </div>

          {pendingVerify && (
            <div className="flex items-center gap-2 bg-amber-500/10 border border-amber-500/20 rounded-xl px-3 py-2">
              <RefreshCw className="w-3.5 h-3.5 text-amber-400 shrink-0" />
              <p className="text-amber-300/80 text-xs">Sessão restaurada. Se o código expirou, clique em reenviar.</p>
            </div>
          )}

          <Input
            type="text"
            inputMode="numeric"
            placeholder="• • • • • •"
            value={verifyCode}
            onChange={(e) => setVerifyCode(e.target.value.replaceAll(/\D/g, '').slice(0, 6))}
            className={`${inputClass} text-center text-2xl tracking-[0.5em] font-bold placeholder:tracking-[0.3em] placeholder:text-base placeholder:opacity-50`}
            maxLength={6}
            required
            autoFocus
          />

          <button type="button" onClick={handleResendCode} disabled={resendCooldown > 0} className="text-xs text-white/50 hover:text-white/80 transition-colors text-center w-full flex items-center justify-center gap-1 disabled:opacity-50">
            <RefreshCw className="w-3 h-3" />
            {resendCooldown > 0 ? `Reenviar em ${resendCooldown}s` : 'Reenviar código'}
          </button>
        </div>

        <Button type="submit" className="w-full h-12 rounded-2xl font-semibold text-base bg-white text-black hover:bg-white/90 shadow-lg" disabled={isLoading || verifyCode.length !== 6}>
          {isLoading ? <Spinner /> : <><CheckCircle2 className="w-5 h-5 mr-2" /> Verificar</>}
        </Button>

        <Button type="button" variant="ghost" onClick={goBack} className="w-full h-10 rounded-2xl text-white/60 hover:text-white hover:bg-white/10 text-sm">
          <ArrowLeft className="w-4 h-4 mr-2" /> Voltar
        </Button>
      </form>
    </div>
  );

  const renderForgotPassword = () => (
    <div className="w-full max-w-sm">
      {resetStep === 'email' ? (
        <form onSubmit={handleForgotPassword} className="flex flex-col gap-3">
          <div className="bg-white/10 backdrop-blur-xl rounded-2xl p-5 border border-white/10 space-y-4">
            <div className="text-center">
              <div className="w-14 h-14 rounded-full bg-amber-500/20 flex items-center justify-center mx-auto mb-3">
                <KeyRound className="w-7 h-7 text-amber-400" />
              </div>
              <h2 className="text-white text-lg font-semibold">Esqueceu a senha?</h2>
              <p className="text-white/50 text-xs mt-1">Informe seu email para receber o código</p>
            </div>

            <div className="relative">
              <Mail className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-white/40" />
              <Input type="email" placeholder="Seu email" value={resetEmail} onChange={(e) => setResetEmail(e.target.value)} className={`${inputClass} pl-10`} required autoFocus />
            </div>
          </div>

          <Button type="submit" className="w-full h-12 rounded-2xl font-semibold text-base bg-white text-black hover:bg-white/90 shadow-lg" disabled={isLoading}>
            {isLoading ? <Spinner /> : <><Mail className="w-5 h-5 mr-2" /> Enviar código</>}
          </Button>

          <Button type="button" variant="ghost" onClick={goBack} className="w-full h-10 rounded-2xl text-white/60 hover:text-white hover:bg-white/10 text-sm">
            <ArrowLeft className="w-4 h-4 mr-2" /> Voltar
          </Button>
        </form>
      ) : (
        <form onSubmit={handleResetPassword} className="flex flex-col gap-3">
          <div className="bg-white/10 backdrop-blur-xl rounded-2xl p-5 border border-white/10 space-y-3">
            <div className="text-center mb-1">
              <h2 className="text-white text-lg font-semibold">Nova senha</h2>
              <p className="text-white/50 text-xs mt-1">
                Código enviado para <span className="text-white/80">{resetEmail}</span>
              </p>
            </div>

            <Input
              type="text"
              inputMode="numeric"
              placeholder="• • • • • •"
              value={resetCode}
              onChange={(e) => setResetCode(e.target.value.replaceAll(/\D/g, '').slice(0, 6))}
              className={`${inputClass} text-center text-2xl tracking-[0.5em] font-bold placeholder:tracking-[0.3em] placeholder:text-base placeholder:opacity-50`}
              maxLength={6}
              required
              autoFocus
            />

            <div className="relative">
              <Lock className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-white/40" />
              <Input type={showNewPassword ? 'text' : 'password'} placeholder="Nova senha" value={newPassword} onChange={(e) => setNewPassword(e.target.value)} className={`${inputClass} pl-10 pr-12`} required />
              <button type="button" onClick={() => setShowNewPassword(!showNewPassword)} className="absolute right-4 top-1/2 -translate-y-1/2 text-white/40 hover:text-white/70 transition-colors">
                {showNewPassword ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
              </button>
            </div>

            <div className="relative">
              <Lock className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-white/40" />
              <Input type="password" placeholder="Confirmar nova senha" value={confirmNewPassword} onChange={(e) => setConfirmNewPassword(e.target.value)} className={`${inputClass} pl-10`} required />
            </div>
          </div>

          <Button type="submit" className="w-full h-12 rounded-2xl font-semibold text-base bg-white text-black hover:bg-white/90 shadow-lg" disabled={isLoading || resetCode.length !== 6}>
            {isLoading ? <Spinner /> : <><KeyRound className="w-5 h-5 mr-2" /> Redefinir senha</>}
          </Button>

          <Button type="button" variant="ghost" onClick={() => setResetStep('email')} className="w-full h-10 rounded-2xl text-white/60 hover:text-white hover:bg-white/10 text-sm">
            <ArrowLeft className="w-4 h-4 mr-2" /> Voltar
          </Button>
        </form>
      )}
    </div>
  );

  return (
    <div className="relative min-h-screen w-full overflow-hidden select-none">
      <div className="absolute inset-0 z-0">
        <div className="absolute inset-0">
          <img src={INTRO_IMAGES[currentImage]} alt="" className="w-full h-full object-cover object-center" draggable={false} />
        </div>
        <div className="absolute inset-0 transition-opacity duration-[1200ms] ease-in-out" style={{ opacity: transitioning ? 1 : 0 }}>
          <img src={INTRO_IMAGES[nextImage]} alt="" className="w-full h-full object-cover object-center" draggable={false} />
        </div>
        <div className="absolute inset-0 bg-gradient-to-b from-black/60 via-black/40 to-black/80" />
      </div>

      <div className="absolute bottom-4 left-1/2 -translate-x-1/2 z-20 flex gap-2">
        {INTRO_IMAGES.map((_, idx) => (
          <span key={idx} className={`block rounded-full transition-all duration-500 ${idx === currentImage ? 'w-6 h-2 bg-white' : 'w-2 h-2 bg-white/40'}`} />
        ))}
      </div>

      <div
        className="absolute left-0 right-0 z-10 flex flex-col items-center transition-all ease-[cubic-bezier(0.22,1,0.36,1)]"
        style={{
          top: animPhase === 'center' ? '50%' : animPhase === 'rising' ? '12%' : '8%',
          transform: animPhase === 'center' ? 'translateY(-50%)' : 'translateY(0)',
          transitionDuration: animPhase === 'rising' ? '1200ms' : '600ms',
        }}
      >
        <div className={`transition-all duration-700 ${animPhase === 'center' ? 'w-28 h-28 md:w-36 md:h-36 opacity-100' : 'w-16 h-16 md:w-20 md:h-20 opacity-100'}`}>
          <img src="/altcorp-logo.png" alt="AltCorp Logo" className="w-full h-full object-contain drop-shadow-2xl" draggable={false} />
        </div>
        <div className="mt-3 text-center overflow-hidden">
          <h1
            className={`font-bold tracking-[0.25em] text-white drop-shadow-lg transition-all duration-700 ${animPhase === 'center' ? 'text-3xl md:text-5xl' : 'text-lg md:text-2xl'}`}
            style={{ fontFamily: "'Inter', 'SF Pro Display', system-ui, sans-serif" }}
          >
            ALTCORP
          </h1>
          <p
            className={`font-light tracking-[0.5em] text-white/80 transition-all duration-700 ${animPhase === 'center' ? 'text-sm md:text-lg mt-1' : 'text-[10px] md:text-xs mt-0.5'}`}
            style={{ fontFamily: "'Inter', 'SF Pro Display', system-ui, sans-serif" }}
          >
            WALLET
          </p>
        </div>
      </div>

      <div
        className={`relative z-10 flex flex-col items-center px-6 overflow-y-auto transition-all duration-700 ${contentVisible ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-8'} ${keyboardOpen ? 'justify-start pt-6 pb-4' : 'justify-end pb-12 pt-40 md:justify-center md:pt-36 md:pb-16'}`}
        style={{ minHeight: 'calc(var(--vh, 1vh) * 100)' }}
      >
        {view === 'welcome' && renderWelcome()}
        {view === 'login' && renderLogin()}
        {view === 'register' && renderRegister()}
        {view === 'verify-email' && renderVerifyEmail()}
        {(view === 'forgot-password' || view === 'reset-password') && renderForgotPassword()}
      </div>
    </div>
  );
};

export default Login;
