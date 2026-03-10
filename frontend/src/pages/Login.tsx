import React, { useState, useEffect, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { Eye, EyeOff, LogIn, LogOut, User } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { useAuth } from '@/contexts/AuthContext';
import { useToast } from '@/hooks/use-toast';
import authService from '@/services/authService';

const INTRO_IMAGES = ['/intro1.png', '/intro2.png', '/intro3.png'];

const Login: React.FC = () => {
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [showLoginForm, setShowLoginForm] = useState(false);

  // Animação
  const [animPhase, setAnimPhase] = useState<'center' | 'rising' | 'top'>('center');
  const [contentVisible, setContentVisible] = useState(false);

  // Carrossel
  const [currentImage, setCurrentImage] = useState(0);
  const [nextImage, setNextImage] = useState(1);
  const [transitioning, setTransitioning] = useState(false);

  // Usuário do último login (persiste mesmo após logout)
  const lastUser = authService.getLastLoginUser();

  // Ajustar --vh para o viewport real (exclui teclado virtual no mobile)
  useEffect(() => {
    const updateVh = () => {
      const vh = window.visualViewport?.height ?? window.innerHeight;
      document.documentElement.style.setProperty('--vh', `${vh * 0.01}px`);
    };
    updateVh();
    window.visualViewport?.addEventListener('resize', updateVh);
    window.addEventListener('resize', updateVh);
    return () => {
      window.visualViewport?.removeEventListener('resize', updateVh);
      window.removeEventListener('resize', updateVh);
    };
  }, []);

  const { login, logout } = useAuth();
  const navigate = useNavigate();
  const { toast } = useToast();

  // Fase de animação do logo
  useEffect(() => {
    const riseTimer = setTimeout(() => setAnimPhase('rising'), 1200);
    const topTimer = setTimeout(() => {
      setAnimPhase('top');
      setTimeout(() => setContentVisible(true), 200);
    }, 2200);
    return () => { clearTimeout(riseTimer); clearTimeout(topTimer); };
  }, []);

  // Carrossel de imagens de fundo
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

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    try {
      const success = await login(username, password);
      if (success) {
        toast({ title: 'Bem-vindo!', description: 'Login realizado com sucesso.' });
        navigate('/dashboard');
      } else {
        toast({ title: 'Erro no login', description: 'Usuário ou senha incorretos.', variant: 'destructive' });
      }
    } catch {
      toast({ title: 'Erro', description: 'Ocorreu um erro. Tente novamente.', variant: 'destructive' });
    } finally {
      setIsLoading(false);
    }
  };

  const handleQuickLogin = () => {
    setShowLoginForm(true);
    if (lastUser) {
      setUsername(lastUser.username);
    }
  };

  const handleLogout = () => {
    authService.clearLastLoginUser();
    logout();
    toast({ title: 'Sessão encerrada', description: 'Você foi desconectado.' });
  };

  // Primeira letra do nome
  const getInitial = (name: string) => name?.charAt(0)?.toUpperCase() || 'U';

  return (
    <div className="relative min-h-screen w-full overflow-hidden select-none">
      {/* ====== BACKGROUND CAROUSEL ====== */}
      <div className="absolute inset-0 z-0">
        {/* Imagem atual */}
        <div className="absolute inset-0">
          <img
            src={INTRO_IMAGES[currentImage]}
            alt=""
            className="w-full h-full object-cover object-center"
            draggable={false}
          />
        </div>
        {/* Imagem de transição (fade in) */}
        <div
          className="absolute inset-0 transition-opacity duration-[1200ms] ease-in-out"
          style={{ opacity: transitioning ? 1 : 0 }}
        >
          <img
            src={INTRO_IMAGES[nextImage]}
            alt=""
            className="w-full h-full object-cover object-center"
            draggable={false}
          />
        </div>
        {/* Overlay gradiente escuro */}
        <div className="absolute inset-0 bg-gradient-to-b from-black/60 via-black/40 to-black/80" />
      </div>

      {/* ====== INDICADORES DO CARROSSEL ====== */}
      <div className="absolute bottom-4 left-1/2 -translate-x-1/2 z-20 flex gap-2">
        {INTRO_IMAGES.map((_, idx) => (
          <span
            key={idx}
            className={`block rounded-full transition-all duration-500 ${
              idx === currentImage
                ? 'w-6 h-2 bg-white'
                : 'w-2 h-2 bg-white/40'
            }`}
          />
        ))}
      </div>

      {/* ====== LOGO ANIMADO ====== */}
      <div
        className="absolute left-0 right-0 z-10 flex flex-col items-center transition-all ease-[cubic-bezier(0.22,1,0.36,1)]"
        style={{
          top: animPhase === 'center' ? '50%' : animPhase === 'rising' ? '12%' : '8%',
          transform: animPhase === 'center' ? 'translateY(-50%)' : 'translateY(0)',
          transitionDuration: animPhase === 'rising' ? '1200ms' : '600ms',
        }}
      >
        {/* Logo */}
        <div
          className={`transition-all duration-700 ${
            animPhase === 'center' ? 'w-28 h-28 md:w-36 md:h-36 opacity-100' : 'w-16 h-16 md:w-20 md:h-20 opacity-100'
          }`}
        >
          <img
            src="/altcorp-logo.png"
            alt="AltCorp Logo"
            className="w-full h-full object-contain drop-shadow-2xl"
            draggable={false}
          />
        </div>

        {/* Título */}
        <div className="mt-3 text-center overflow-hidden">
          <h1
            className={`font-bold tracking-[0.25em] text-white drop-shadow-lg transition-all duration-700 ${
              animPhase === 'center'
                ? 'text-3xl md:text-5xl'
                : 'text-lg md:text-2xl'
            }`}
            style={{
              fontFamily: "'Inter', 'SF Pro Display', system-ui, sans-serif",
            }}
          >
            ALTCORP
          </h1>
          <p
            className={`font-light tracking-[0.5em] text-white/80 transition-all duration-700 ${
              animPhase === 'center'
                ? 'text-sm md:text-lg mt-1'
                : 'text-[10px] md:text-xs mt-0.5'
            }`}
            style={{
              fontFamily: "'Inter', 'SF Pro Display', system-ui, sans-serif",
            }}
          >
            WALLET
          </p>
        </div>
      </div>

      {/* ====== CONTEÚDO CENTRAL ====== */}
      <div
        className={`relative z-10 min-h-screen flex flex-col items-center justify-end px-6 pb-10 pt-40 md:justify-center md:pt-36 md:pb-16 overflow-y-auto transition-all duration-700 ${
          contentVisible ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-8'
        }`}
        style={{ minHeight: 'calc(var(--vh, 1vh) * 100)' }}
      >
        {/* CASO 1: Usuário salvo e não mostrando form */}
        {lastUser && !showLoginForm && (
          <div className="w-full max-w-sm flex flex-col items-center gap-4">
            {/* Avatar / Foto */}
            <div className="w-24 h-24 rounded-full bg-white/10 border-2 border-white/30 flex items-center justify-center overflow-hidden backdrop-blur-sm shadow-xl">
              {lastUser.profile_photo ? (
                <img
                  src={lastUser.profile_photo}
                  alt={lastUser.name}
                  className="w-full h-full object-cover"
                />
              ) : (
                <span className="text-3xl font-bold text-white">
                  {getInitial(lastUser.name)}
                </span>
              )}
            </div>

            {/* Nome */}
            <div className="text-center">
              <p className="text-white/60 text-xs uppercase tracking-widest mb-1">Bem-vindo de volta</p>
              <p className="text-white text-xl font-semibold">{lastUser.name}</p>
            </div>

            {/* Botão Entrar */}
            <Button
              onClick={handleQuickLogin}
              className="w-full h-12 rounded-2xl font-semibold text-base bg-white text-black hover:bg-white/90 shadow-lg mt-2"
            >
              <LogIn className="w-5 h-5 mr-2" />
              Entrar
            </Button>

            {/* Botão Sair */}
            <Button
              onClick={handleLogout}
              variant="ghost"
              className="w-full h-11 rounded-2xl font-medium text-sm text-red-400 hover:text-red-300 hover:bg-red-500/10 border border-red-500/30"
            >
              <LogOut className="w-4 h-4 mr-2" />
              Sair da conta
            </Button>
          </div>
        )}

        {/* CASO 2: Sem usuário salvo OU mostrando form de login */}
        {(!lastUser || showLoginForm) && (
          <div className="w-full max-w-sm">
            <form onSubmit={handleSubmit} className="flex flex-col gap-3">
              <div className="bg-white/10 backdrop-blur-xl rounded-2xl p-5 border border-white/10 space-y-3">
                {/* Avatar do user salvo OU ícone genérico */}
                <div className="flex items-center justify-center mb-2">
                  {lastUser?.profile_photo ? (
                    <div className="w-16 h-16 rounded-full overflow-hidden border-2 border-white/20 shadow-lg">
                      <img
                        src={lastUser.profile_photo}
                        alt={lastUser.name}
                        className="w-full h-full object-cover"
                      />
                    </div>
                  ) : (
                    <div className="w-12 h-12 rounded-full bg-white/10 flex items-center justify-center">
                      <User className="w-6 h-6 text-white/70" />
                    </div>
                  )}
                </div>

                <Input
                  type="text"
                  placeholder="Usuário"
                  value={username}
                  onChange={(e) => setUsername(e.target.value)}
                  onFocus={(e) => setTimeout(() => e.target.scrollIntoView({ behavior: 'smooth', block: 'center' }), 300)}
                  className="h-12 rounded-xl bg-white/10 border-white/10 text-white placeholder:text-white/40 focus:border-white/30 focus:ring-white/20"
                  required
                  autoFocus={!lastUser}
                />

                <div className="relative">
                  <Input
                    type={showPassword ? 'text' : 'password'}
                    placeholder="Senha"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    onFocus={(e) => setTimeout(() => e.target.scrollIntoView({ behavior: 'smooth', block: 'center' }), 300)}
                    className="h-12 rounded-xl bg-white/10 border-white/10 text-white placeholder:text-white/40 focus:border-white/30 focus:ring-white/20 pr-12"
                    required
                    autoFocus={!!lastUser}
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute right-4 top-1/2 -translate-y-1/2 text-white/40 hover:text-white/70 transition-colors"
                  >
                    {showPassword ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
                  </button>
                </div>
              </div>

              <Button
                type="submit"
                className="w-full h-12 rounded-2xl font-semibold text-base bg-white text-black hover:bg-white/90 shadow-lg"
                disabled={isLoading}
              >
                {isLoading ? (
                  <div className="w-5 h-5 border-2 border-black/30 border-t-black rounded-full animate-spin" />
                ) : (
                  <>
                    <LogIn className="w-5 h-5 mr-2" />
                    Entrar
                  </>
                )}
              </Button>

              {/* Botão Voltar se veio do usuário salvo */}
              {lastUser && showLoginForm && (
                <Button
                  type="button"
                  variant="ghost"
                  onClick={() => { setShowLoginForm(false); setPassword(''); }}
                  className="w-full h-10 rounded-2xl text-white/60 hover:text-white hover:bg-white/10 text-sm"
                >
                  Voltar
                </Button>
              )}
            </form>
          </div>
        )}
      </div>
    </div>
  );
};

export default Login;
