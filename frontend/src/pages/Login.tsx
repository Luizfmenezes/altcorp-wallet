import React, { useState, useEffect, useCallback, useRef } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { Eye, EyeOff, LogIn, LogOut, User, Mail, Lock, ArrowLeft, UserPlus, KeyRound, CheckCircle2, RefreshCw, Loader2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { useAuth } from '@/contexts/AuthContext';
import { useToast } from '@/hooks/use-toast';
import authService from '@/services/authService';

const INTRO_IMAGES = ['/intro1.png', '/intro2.png', '/intro3.png'];

type AuthView = 'welcome' | 'login' | 'register' | 'verify-email' | 'forgot-password' | 'reset-password';

const VERIFY_SESSION_KEY = 'altcorp_verify_pending';
const VERIFY_SESSION_TTL_MS = 30 * 60 * 1000;

const Login: React.FC = () => {
  const { login, verifyEmail: ctxVerifyEmail, logout, setAuthenticatedUser } = useAuth();
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const { toast } = useToast();

  // Estados de visualização e campos
  const [view, setView] = useState<AuthView>('welcome');
  const [loginIdentifier, setLoginIdentifier] = useState('');
  const [loginPassword, setLoginPassword] = useState('');
  const [showLoginPassword, setShowLoginPassword] = useState(false);
  const [regName, setRegName] = useState('');
  const [regEmail, setRegEmail] = useState('');
  const [regUsername, setRegUsername] = useState('');
  const [regPassword, setRegPassword] = useState('');
  const [regConfirmPassword, setRegConfirmPassword] = useState('');
  const [showRegPassword, setShowRegPassword] = useState(false);
  const [verifyEmail, setVerifyEmail] = useState('');
  const [verifyCode, setVerifyCode] = useState('');
  const [resetEmail, setResetEmail] = useState('');
  const [resetCode, setResetCode] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmNewPassword, setConfirmNewPassword] = useState('');
  const [showNewPassword, setShowNewPassword] = useState(false);
  const [resetStep, setResetStep] = useState<'email' | 'code'>('email');
  
  // Estados de animação e carrossel
  const [isLoading, setIsLoading] = useState(false);
  const [resendCooldown, setResendCooldown] = useState(0);
  const [animPhase, setAnimPhase] = useState<'center' | 'rising' | 'top'>('center');
  const [contentVisible, setContentVisible] = useState(false);
  const [currentImage, setCurrentImage] = useState(0);
  const [nextImage, setNextImage] = useState(1);
  const [transitioning, setTransitioning] = useState(false);
  const [keyboardOpen, setKeyboardOpen] = useState(false);
  const [isSyncing, setIsSyncing] = useState(false);

  const lastUser = authService.getLastLoginUser();
  const googleRedirectHandledRef = useRef(false);

  // Recuperar sessão de verificação pendente
  useEffect(() => {
    const raw = sessionStorage.getItem(VERIFY_SESSION_KEY);
    if (raw) {
      try {
        const { email, expiresAt } = JSON.parse(raw);
        if (Date.now() < expiresAt) {
          setVerifyEmail(email);
          setView('verify-email');
          setAnimPhase('top');
          setContentVisible(true);
        }
      } catch (e) {
        sessionStorage.removeItem(VERIFY_SESSION_KEY);
      }
    }
  }, []);

  // Visual Viewport para teclado mobile
  useEffect(() => {
    const updateVh = () => {
      const vv = window.visualViewport;
      const vh = vv?.height ?? window.innerHeight;
      document.documentElement.style.setProperty('--vh', `${vh * 0.01}px`);
      if (vv) setKeyboardOpen(vv.height < window.innerHeight * 0.75);
    };
    updateVh();
    window.visualViewport?.addEventListener('resize', updateVh);
    return () => window.visualViewport?.removeEventListener('resize', updateVh);
  }, []);

  // Animações da Intro
  useEffect(() => {
    if (view === 'verify-email') return;
    const riseTimer = setTimeout(() => setAnimPhase('rising'), 1200);
    const topTimer = setTimeout(() => {
      setAnimPhase('top');
      setTimeout(() => setContentVisible(true), 200);
    }, 2200);
    return () => { clearTimeout(riseTimer); clearTimeout(topTimer); };
  }, [view]);

  // Ciclo do carrossel de fundo
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

  // Timer de reenvio de código
  useEffect(() => {
    if (resendCooldown > 0) {
      const timer = setTimeout(() => setResendCooldown(resendCooldown - 1), 1000);
      return () => clearTimeout(timer);
    }
  }, [resendCooldown]);

  const performNativeSync = useCallback(async (token: string) => {
    setIsSyncing(true);
    try {
      const apiUser = await authService.nativeGoogleLogin(token);
      setAuthenticatedUser(apiUser);

      toast({
        title: 'Sincronizacao concluida',
        description: 'Acesso liberado via biometria Android.',
      });

      navigate('/dashboard');
    } catch (error: any) {
      setIsSyncing(false);
      toast({
        variant: 'destructive',
        title: 'Erro de sincronizacao',
        description: error?.message || 'Nao foi possivel validar o acesso nativo.',
      });
    }
  }, [navigate, setAuthenticatedUser, toast]);

  useEffect(() => {
    const nativeToken = searchParams.get('native_google_token');
    if (!nativeToken) {
      return;
    }

    void performNativeSync(nativeToken);
  }, [searchParams, performNativeSync]);

  // --- LÓGICA GOOGLE WEB ---
  useEffect(() => {
    if (googleRedirectHandledRef.current) return;

    const url = new URL(globalThis.location.href);
    const authToken = url.searchParams.get('auth_token');
    const authError = url.searchParams.get('auth_error');
    const authProvider = url.searchParams.get('auth_provider');

    if (authProvider !== 'google' || (!authToken && !authError)) {
      return;
    }

    googleRedirectHandledRef.current = true;

    const clearAuthParams = () => {
      url.searchParams.delete('auth_token');
      url.searchParams.delete('auth_error');
      url.searchParams.delete('auth_provider');
      const nextUrl = `${url.pathname}${url.search}${url.hash}`;
      globalThis.history.replaceState({}, document.title, nextUrl);
    };

    if (authError) {
      clearAuthParams();
      toast({ title: 'Erro', description: authError, variant: 'destructive' });
      return;
    }

    if (!authToken) {
      clearAuthParams();
      toast({ title: 'Erro', description: 'Resposta de login Google inválida.', variant: 'destructive' });
      return;
    }

    setIsLoading(true);
    void authService.completeGoogleRedirectLogin(authToken)
      .then((apiUser) => {
        // Atualiza o estado React do AuthContext ANTES de navegar.
        // Sem isso, ProtectedRoute vê isAuthenticated=false e redireciona de volta ao login.
        setAuthenticatedUser(apiUser);
        clearAuthParams();
        toast({ title: 'Bem-vindo!', description: 'Login concluído com sucesso.' });
        navigate('/dashboard');
      })
      .catch(() => {
        clearAuthParams();
        toast({ title: 'Erro', description: 'Falha ao concluir login com Google.', variant: 'destructive' });
      })
      .finally(() => {
        setIsLoading(false);
      });
  }, [navigate, toast]);

  const startGoogleSignIn = useCallback(async () => {
    setIsLoading(true);
    try {
      const authUrl = await authService.getGoogleRedirectUrl();
      globalThis.location.href = authUrl;
    } catch {
      toast({ title: 'Erro', description: 'Falha ao iniciar login com Google.', variant: 'destructive' });
      setIsLoading(false);
    }
  }, [toast]);

  // Handlers Gerais
  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    try {
      const success = await login(loginIdentifier, loginPassword);
      if (success) navigate('/dashboard');
    } catch (err: any) {
      if (err?.response?.status === 403 && err?.response?.headers?.['x-email-unverified']) {
        setVerifyEmail(loginIdentifier);
        setView('verify-email');
      } else {
        toast({ title: 'Erro', description: 'Credenciais inválidas.', variant: 'destructive' });
      }
    } finally { setIsLoading(false); }
  };

  const handleRegister = async (e: React.FormEvent) => {
    e.preventDefault();
    if (regPassword !== regConfirmPassword) { toast({ title: 'Erro', description: 'Senhas não coincidem.', variant: 'destructive' }); return; }
    setIsLoading(true);
    try {
      const result = await authService.register({
        name: regName, email: regEmail, username: regUsername, 
        password: regPassword, confirm_password: regConfirmPassword 
      });
      if (result.requires_verification) {
        setVerifyEmail(regEmail);
        sessionStorage.setItem(VERIFY_SESSION_KEY, JSON.stringify({ email: regEmail, expiresAt: Date.now() + VERIFY_SESSION_TTL_MS }));
        setView('verify-email');
      } else {
        await login(regUsername, regPassword);
        navigate('/dashboard');
      }
    } catch (err: any) {
      toast({ title: 'Erro', description: err?.response?.data?.detail || 'Falha ao criar conta.', variant: 'destructive' });
    } finally { setIsLoading(false); }
  };

  const handleVerifyEmail = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    try {
      const success = await ctxVerifyEmail(verifyEmail, verifyCode);
      if (success) {
        sessionStorage.removeItem(VERIFY_SESSION_KEY);
        toast({ title: 'Sucesso', description: 'Email verificado!' });
        navigate('/dashboard');
      }
    } catch {
      toast({ title: 'Erro', description: 'Código inválido.', variant: 'destructive' });
    } finally { setIsLoading(false); }
  };

  const goBack = () => {
    if (view === 'verify-email') { sessionStorage.removeItem(VERIFY_SESSION_KEY); setView('login'); }
    else if (view === 'forgot-password' || view === 'reset-password') setView('login');
    else setView('welcome');
  };

  const inputClass = "h-12 rounded-xl bg-white/10 border-white/10 text-white placeholder:text-white/40 focus:border-white/30 focus:ring-white/20";
  const Spinner = () => <div className="w-5 h-5 border-2 border-black/30 border-t-black rounded-full animate-spin" />;

  const renderGoogleAction = (label = 'Continuar com Google') => (
    <Button
      type="button"
      onClick={startGoogleSignIn}
      disabled={isLoading}
      className="w-full h-12 rounded-2xl font-semibold text-base bg-white text-black hover:bg-white/90 shadow-lg flex items-center justify-center gap-2"
    >
      {isLoading ? <Spinner /> : (
        <>
          <svg className="w-5 h-5 shrink-0" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
            <path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" fill="#4285F4" />
            <path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" fill="#34A853" />
            <path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" fill="#FBBC05" />
            <path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" fill="#EA4335" />
          </svg>
          <span className="truncate">{label}</span>
        </>
      )}
    </Button>
  );

  const renderWelcome = () => (
    <div className="w-full max-w-sm flex flex-col items-center gap-4">
      {lastUser ? (
        <>
          <div className="w-24 h-24 rounded-full bg-white/10 border-2 border-white/30 flex items-center justify-center overflow-hidden backdrop-blur-sm shadow-xl">
            {lastUser.profile_photo ? (
              <img src={lastUser.profile_photo} alt="P" className="w-full h-full object-cover" />
            ) : <span className="text-3xl font-bold text-white">{lastUser.name.charAt(0)}</span>}
          </div>
          <p className="text-white text-xl font-semibold">Olá, {lastUser.name}</p>
          <Button onClick={() => setView('login')} className="w-full h-12 rounded-2xl bg-white text-black font-semibold">Entrar</Button>
          <div className="w-full flex items-center gap-3 my-1">
            <div className="flex-1 h-px bg-white/20" /><span className="text-white/40 text-xs">ou</span><div className="flex-1 h-px bg-white/20" />
          </div>
          {renderGoogleAction()}
          <Button onClick={() => { authService.clearLastLoginUser(); logout(); }} variant="ghost" className="text-red-400 text-sm">Sair da conta</Button>
        </>
      ) : (
        <>
          <p className="text-white/70 text-sm mb-2 text-center">Gerencie suas finanças com inteligência</p>
          <Button onClick={() => setView('login')} className="w-full h-12 rounded-2xl bg-white text-black font-semibold"><LogIn className="w-4 h-4 mr-2" /> Entrar na conta</Button>
          <Button onClick={() => setView('register')} variant="ghost" className="w-full h-11 rounded-2xl text-white border border-white/20"><UserPlus className="w-4 h-4 mr-2" /> Criar conta</Button>
          <div className="w-full flex items-center gap-3 my-1">
            <div className="flex-1 h-px bg-white/20" /><span className="text-white/40 text-xs">ou</span><div className="flex-1 h-px bg-white/20" />
          </div>
          {renderGoogleAction()}
        </>
      )}
    </div>
  );

  if (isSyncing) {
    return (
      <div className="flex min-h-screen flex-col items-center justify-center bg-background">
        <div className="space-y-4 p-8 text-center">
          <Loader2 className="mx-auto h-12 w-12 animate-spin text-primary" />
          <h2 className="text-2xl font-bold">AltCorp Wallet</h2>
          <p className="animate-pulse text-muted-foreground">Sincronizando sua identidade segura...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="relative min-h-screen w-full overflow-hidden select-none">
      {/* Background Slideshow */}
      <div className="absolute inset-0 z-0">
        <div className="absolute inset-0"><img src={INTRO_IMAGES[currentImage]} alt="" className="w-full h-full object-cover" /></div>
        <div className="absolute inset-0 transition-opacity duration-[1200ms]" style={{ opacity: transitioning ? 1 : 0 }}><img src={INTRO_IMAGES[nextImage]} alt="" className="w-full h-full object-cover" /></div>
        <div className="absolute inset-0 bg-gradient-to-b from-black/60 via-black/40 to-black/80" />
      </div>
      
      {/* Paginação do carrossel */}
      <div className="absolute bottom-4 left-1/2 -translate-x-1/2 z-20 flex gap-2">
        {INTRO_IMAGES.map((_, idx) => <span key={idx} className={`block rounded-full transition-all duration-500 ${idx === currentImage ? 'w-6 h-2 bg-white' : 'w-2 h-2 bg-white/40'}`} />)}
      </div>

      {/* Logotipo Central que sobe */}
      <div className="absolute left-0 right-0 z-10 flex flex-col items-center transition-all ease-[cubic-bezier(0.22,1,0.36,1)]" 
           style={{ top: animPhase === 'center' ? '50%' : animPhase === 'rising' ? '12%' : '8%', transform: animPhase === 'center' ? 'translateY(-50%)' : 'translateY(0)', transitionDuration: animPhase === 'rising' ? '1200ms' : '600ms' }}>
        <div className={`transition-all duration-700 ${animPhase === 'center' ? 'w-28 h-28 opacity-100' : 'w-16 h-16 opacity-100'}`}><img src="/altcorp-logo.png" alt="L" className="w-full h-full object-contain drop-shadow-2xl" /></div>
        <div className="mt-3 text-center">
          <h1 className={`font-bold tracking-[0.25em] text-white transition-all duration-700 ${animPhase === 'center' ? 'text-3xl' : 'text-lg'}`}>ALTCORP</h1>
          <p className={`font-light tracking-[0.5em] text-white/80 transition-all duration-700 ${animPhase === 'center' ? 'text-sm' : 'text-[10px]'}`}>WALLET</p>
        </div>
      </div>

      {/* Conteúdo dos Formulários */}
      <div className={`relative z-10 flex flex-col items-center px-6 overflow-y-auto transition-all duration-700 ${contentVisible ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-8'} ${keyboardOpen ? 'justify-start pt-6' : 'justify-end pb-12 pt-40 md:justify-center'}`} 
           style={{ minHeight: 'calc(var(--vh, 1vh) * 100)' }}>
        
        {view === 'welcome' && renderWelcome()}

        {view === 'login' && (
          <div className="w-full max-w-sm">
            <form onSubmit={handleLogin} className="flex flex-col gap-3">
              <div className="bg-white/10 backdrop-blur-xl rounded-2xl p-5 border border-white/10 space-y-3">
                <div className="relative"><Mail className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-white/40" /><Input type="text" placeholder="Email ou username" value={loginIdentifier} onChange={(e) => setLoginIdentifier(e.target.value)} className={`${inputClass} pl-10`} required /></div>
                <div className="relative"><Lock className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-white/40" /><Input type={showLoginPassword ? 'text' : 'password'} placeholder="Senha" value={loginPassword} onChange={(e) => setLoginPassword(e.target.value)} className={`${inputClass} pl-10 pr-12`} required />
                  <button type="button" onClick={() => setShowLoginPassword(!showLoginPassword)} className="absolute right-4 top-1/2 -translate-y-1/2 text-white/40">{showLoginPassword ? <EyeOff size={18} /> : <Eye size={18} />}</button>
                </div>
              </div>
              <Button type="submit" className="w-full h-12 rounded-2xl bg-white text-black font-semibold" disabled={isLoading}>{isLoading ? <Spinner /> : 'Entrar'}</Button>
              {renderGoogleAction()}
              <Button type="button" variant="ghost" onClick={goBack} className="w-full h-10 text-white/60">Voltar</Button>
            </form>
          </div>
        )}

        {view === 'register' && (
          <div className="w-full max-w-sm">
            <form onSubmit={handleRegister} className="flex flex-col gap-3">
              <div className="bg-white/10 backdrop-blur-xl rounded-2xl p-5 border border-white/10 space-y-3">
                <Input placeholder="Nome completo" value={regName} onChange={(e) => setRegName(e.target.value)} className={inputClass} required />
                <Input placeholder="E-mail" type="email" value={regEmail} onChange={(e) => setRegEmail(e.target.value)} className={inputClass} required />
                <Input placeholder="Nome de usuário" value={regUsername} onChange={(e) => setRegUsername(e.target.value.toLowerCase().replace(/[^a-z0-9_]/g, ''))} className={inputClass} required />
                <Input placeholder="Senha" type="password" value={regPassword} onChange={(e) => setRegPassword(e.target.value)} className={inputClass} required />
                <Input placeholder="Confirmar Senha" type="password" value={regConfirmPassword} onChange={(e) => setRegConfirmPassword(e.target.value)} className={inputClass} required />
              </div>
              <Button type="submit" className="w-full h-12 rounded-2xl bg-white text-black font-semibold" disabled={isLoading}>Criar conta</Button>
              <Button type="button" variant="ghost" onClick={goBack} className="w-full h-10 text-white/60">Voltar</Button>
            </form>
          </div>
        )}

        {view === 'verify-email' && (
          <div className="w-full max-w-sm">
            <form onSubmit={handleVerifyEmail} className="flex flex-col gap-3">
              <div className="bg-white/10 backdrop-blur-xl rounded-2xl p-5 border border-white/10 text-center space-y-4">
                <CheckCircle2 className="w-12 h-12 text-emerald-400 mx-auto" />
                <h2 className="text-white font-semibold">Verificar E-mail</h2>
                <p className="text-white/60 text-xs">Enviamos um código para {verifyEmail}</p>
                <Input placeholder="• • • • • •" value={verifyCode} onChange={(e) => setVerifyCode(e.target.value.slice(0,6))} className="text-center text-2xl tracking-widest bg-white/10 text-white border-white/20" required />
              </div>
              <Button type="submit" className="w-full h-12 rounded-2xl bg-white text-black font-semibold" disabled={isLoading}>Verificar Código</Button>
              <Button type="button" variant="ghost" onClick={goBack} className="w-full h-10 text-white/60">Cancelar</Button>
            </form>
          </div>
        )}
      </div>
    </div>
  );
};

export default Login;