import React from 'react';
import { Home, TrendingUp, Wallet, Settings } from 'lucide-react';
import { useLocation, useNavigate } from 'react-router-dom';

const navItems = [
  { path: '/dashboard', label: 'Início', icon: Home },
  { path: '/incomes', label: 'Rendas', icon: TrendingUp },
  { path: '/wallet', label: 'Carteira', icon: Wallet },
  { path: '/settings', label: 'Config', icon: Settings },
];

export const BottomNav: React.FC = () => {
  const location = useLocation();
  const navigate = useNavigate();

  return (
    <nav className="fixed bottom-0 left-0 right-0 bg-nav shadow-nav border-t border-border/50 z-50 md:top-0 md:bottom-auto md:border-t-0 md:border-b">
      <div className="max-w-7xl mx-auto flex items-center justify-around md:justify-center md:gap-2 py-2 px-2">
        {navItems.map(({ path, label, icon: Icon }) => {
          const isActive = location.pathname.startsWith(path);
          return (
            <button
              key={path}
              onClick={() => navigate(path)}
              className={`nav-item flex-1 md:flex-none md:flex-row md:px-6 ${isActive ? 'nav-item-active' : 'text-nav-foreground hover:text-foreground'}`}
            >
              <Icon className={`w-5 h-5 ${isActive ? 'text-primary' : ''}`} />
              <span className={`text-xs md:text-sm font-medium ${isActive ? 'text-primary' : ''}`}>
                {label}
              </span>
            </button>
          );
        })}
      </div>
    </nav>
  );
};
