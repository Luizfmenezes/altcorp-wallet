import React, { useState, useRef, useEffect } from 'react';
import { Home, TrendingUp, Receipt, Wallet, Plus, PenLine, Mic, X } from 'lucide-react';
import { useLocation, useNavigate } from 'react-router-dom';

const leftItems = [
  { path: '/dashboard', label: 'Início', icon: Home },
  { path: '/incomes', label: 'Rendas', icon: TrendingUp },
];

const rightItems = [
  { path: '/expenses', label: 'Gastos', icon: Receipt },
  { path: '/wallet', label: 'Carteira', icon: Wallet },
];

export const BottomNav: React.FC = () => {
  const location = useLocation();
  const navigate = useNavigate();
  const [showMenu, setShowMenu] = useState(false);
  const menuRef = useRef<HTMLDivElement>(null);

  // Fechar menu ao clicar fora
  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (menuRef.current && !menuRef.current.contains(e.target as Node)) {
        setShowMenu(false);
      }
    };
    if (showMenu) {
      document.addEventListener('mousedown', handleClickOutside);
    }
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, [showMenu]);

  const renderNavButton = ({ path, label, icon: Icon }: typeof leftItems[0]) => {
    const isActive = location.pathname.startsWith(path);
    return (
      <button
        key={path}
        onClick={() => navigate(path)}
        className={`nav-item flex-1 ${isActive ? 'nav-item-active' : 'text-nav-foreground hover:text-foreground'}`}
      >
        <Icon className={`w-5 h-5 ${isActive ? 'text-primary' : ''}`} />
        <span className={`text-[10px] font-medium ${isActive ? 'text-primary' : ''}`}>
          {label}
        </span>
      </button>
    );
  };

  return (
    <nav className="fixed bottom-0 left-0 right-0 bg-nav shadow-nav border-t border-border/50 z-50 lg:hidden">
      <div className="max-w-7xl mx-auto flex items-center justify-around py-2 px-1">
        {leftItems.map(renderNavButton)}

        {/* Botão central "+" com menu de opções */}
        <div className="flex-1 flex items-center justify-center -mt-6 relative" ref={menuRef}>
          {/* Menu popup */}
          {showMenu && (
            <div className="absolute bottom-16 flex flex-col items-center gap-2 animate-in fade-in slide-in-from-bottom-4 duration-200">
              <div className="bg-card border border-border rounded-2xl shadow-xl overflow-hidden min-w-[180px]">
                <button
                  onClick={() => {
                    setShowMenu(false);
                    navigate('/add');
                  }}
                  className="flex items-center gap-3 w-full px-4 py-3 hover:bg-accent transition-colors text-left"
                >
                  <div className="w-9 h-9 rounded-full bg-blue-500/10 flex items-center justify-center">
                    <PenLine className="w-4 h-4 text-blue-500" />
                  </div>
                  <div>
                    <p className="text-sm font-medium text-foreground">Registro Manual</p>
                    <p className="text-[10px] text-muted-foreground">Preencher formulário</p>
                  </div>
                </button>
                <div className="h-px bg-border" />
                <button
                  onClick={() => {
                    setShowMenu(false);
                    navigate('/add-voice');
                  }}
                  className="flex items-center gap-3 w-full px-4 py-3 hover:bg-accent transition-colors text-left"
                >
                  <div className="w-9 h-9 rounded-full bg-purple-500/10 flex items-center justify-center">
                    <Mic className="w-4 h-4 text-purple-500" />
                  </div>
                  <div>
                    <p className="text-sm font-medium text-foreground">Registro por Áudio</p>
                    <p className="text-[10px] text-muted-foreground">Usar IA por voz</p>
                  </div>
                </button>
              </div>
            </div>
          )}

          <button
            onClick={() => setShowMenu((prev) => !prev)}
            className={`w-14 h-14 rounded-full text-white shadow-none flex items-center justify-center transition-all duration-200 hover:scale-110 active:scale-95 ${
              showMenu
                ? 'bg-gradient-to-br from-red-500 to-red-700 rotate-45'
                : 'bg-gradient-to-br from-[#2B4BF2] to-[#1A2FA8]'
            }`}
          >
            {showMenu ? <X className="w-7 h-7" /> : <Plus className="w-7 h-7" />}
          </button>
        </div>

        {rightItems.map(renderNavButton)}
      </div>
    </nav>
  );
};