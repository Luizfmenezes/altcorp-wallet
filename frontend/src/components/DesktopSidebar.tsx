import React, { useState } from 'react';
import {
  Home,
  TrendingUp,
  Receipt,
  Wallet,
  BarChart3,
  ScrollText,
  Settings,
  LogOut,
  Plus,
  PenLine,
  Mic,
  ChevronLeft,
  ChevronRight,
  X,
  Users,
} from 'lucide-react';
import { useLocation, useNavigate } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthContext';
import { useTheme } from '@/contexts/ThemeContext';

interface NavItem {
  path: string;
  label: string;
  icon: React.ElementType;
}

const mainNav: NavItem[] = [
  { path: '/dashboard', label: 'Visão Geral', icon: Home },
  { path: '/incomes', label: 'Receitas', icon: TrendingUp },
  { path: '/expenses', label: 'Despesas', icon: Receipt },
  { path: '/wallet', label: 'Carteira', icon: Wallet },
  { path: '/history', label: 'Extrato', icon: ScrollText },
  { path: '/monthly-analysis', label: 'Análise Mensal', icon: BarChart3 },
];

const bottomNav: NavItem[] = [
  { path: '/settings', label: 'Configurações', icon: Settings },
  { path: '/users', label: 'Usuários', icon: Users },
];

export const DesktopSidebar: React.FC = () => {
  const location = useLocation();
  const navigate = useNavigate();
  const { user, logout } = useAuth();
  const { theme } = useTheme();
  const [collapsed, setCollapsed] = useState(false);
  const [showAddMenu, setShowAddMenu] = useState(false);

  const getFirstName = () => {
    if (user?.profile?.firstName) return user.profile.firstName;
    if (user?.name) return user.name.split(' ')[0];
    return 'Usuário';
  };

  const getFullName = () => {
    if (user?.profile?.firstName && user?.profile?.lastName) {
      return `${user.profile.firstName} ${user.profile.lastName}`;
    }
    if (user?.name) return user.name;
    return 'Usuário';
  };

  const getEmail = () => {
    if (user?.apiUser?.email) return user.apiUser.email;
    if (user?.profile?.email) return user.profile.email;
    return '';
  };

  const isActive = (path: string) => {
    if (path === '/dashboard') return location.pathname === '/dashboard';
    if (path === '/wallet') return location.pathname === '/wallet' || location.pathname.startsWith('/wallet/');
    return location.pathname.startsWith(path);
  };

  const handleLogout = () => {
    logout();
    navigate('/');
  };

  // Cores para o sidebar baseadas no tema
  const sidebarBg = theme === 'dark'
    ? 'bg-[#0a0a0a] border-r border-[#1e1e1e]'
    : 'bg-white border-r border-gray-200';

  return (
    <aside
      className={`hidden lg:flex flex-col h-screen sticky top-0 transition-all duration-300 z-40 ${sidebarBg} ${
        collapsed ? 'w-[72px]' : 'w-[260px]'
      }`}
    >
      {/* Logo / Brand */}
      <div className={`flex items-center h-16 px-4 border-b border-border/50 ${collapsed ? 'justify-center' : 'gap-3'}`}>
        <div className="w-9 h-9 rounded-xl flex items-center justify-center flex-shrink-0 overflow-hidden">
          <img src="/altcorp-logo.png" alt="AltCorp" className="w-9 h-9 object-contain" />
        </div>
        {!collapsed && (
          <div className="min-w-0">
            <h1 className="text-base font-bold text-foreground truncate">AltCorp Wallet</h1>
          </div>
        )}
        <button
          onClick={() => setCollapsed(!collapsed)}
          className={`ml-auto w-7 h-7 rounded-lg flex items-center justify-center text-muted-foreground hover:text-foreground hover:bg-accent transition-colors ${collapsed ? 'ml-0' : ''}`}
        >
          {collapsed ? <ChevronRight className="w-4 h-4" /> : <ChevronLeft className="w-4 h-4" />}
        </button>
      </div>

      {/* Quick Add Button */}
      <div className={`px-3 pt-4 pb-2 relative ${collapsed ? 'px-2' : ''}`}>
        <button
          onClick={() => setShowAddMenu(!showAddMenu)}
          className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-xl text-white font-medium transition-all duration-200 hover:shadow-lg ${
            showAddMenu ? 'bg-red-500 hover:bg-red-600' : ''
          } ${collapsed ? 'justify-center px-0' : ''}`}
          style={
            !showAddMenu
              ? {
                  background: theme === 'dark'
                    ? 'linear-gradient(135deg, #2B4BF2, #1A2FA8)'
                    : 'linear-gradient(135deg, #3B82F6, #2563EB)',
                }
              : undefined
          }
        >
          {showAddMenu ? (
            <X className="w-5 h-5 flex-shrink-0" />
          ) : (
            <Plus className="w-5 h-5 flex-shrink-0" />
          )}
          {!collapsed && <span className="text-sm">{showAddMenu ? 'Cancelar' : 'Novo Registro'}</span>}
        </button>

        {/* Add Menu Dropdown */}
        {showAddMenu && (
          <div className={`absolute top-full mt-1 z-50 ${collapsed ? 'left-full ml-2 top-0' : 'left-3 right-3'}`}>
            <div className="bg-card border border-border rounded-xl shadow-xl overflow-hidden">
              <button
                onClick={() => {
                  setShowAddMenu(false);
                  navigate('/add');
                }}
                className="flex items-center gap-3 w-full px-4 py-3 hover:bg-accent transition-colors text-left"
              >
                <div className="w-9 h-9 rounded-full bg-blue-500/10 flex items-center justify-center flex-shrink-0">
                  <PenLine className="w-4 h-4 text-blue-500" />
                </div>
                <div className="min-w-0">
                  <p className="text-sm font-medium text-foreground">Registro Manual</p>
                  <p className="text-[11px] text-muted-foreground">Preencher formulário</p>
                </div>
              </button>
              <div className="h-px bg-border" />
              <button
                onClick={() => {
                  setShowAddMenu(false);
                  navigate('/add-voice');
                }}
                className="flex items-center gap-3 w-full px-4 py-3 hover:bg-accent transition-colors text-left"
              >
                <div className="w-9 h-9 rounded-full bg-purple-500/10 flex items-center justify-center flex-shrink-0">
                  <Mic className="w-4 h-4 text-purple-500" />
                </div>
                <div className="min-w-0">
                  <p className="text-sm font-medium text-foreground">Registro por Áudio</p>
                  <p className="text-[11px] text-muted-foreground">Usar IA por voz</p>
                </div>
              </button>
            </div>
          </div>
        )}
      </div>

      {/* Main Navigation */}
      <nav className="flex-1 px-3 py-2 space-y-1 overflow-y-auto">
        <p className={`text-[10px] uppercase tracking-widest text-muted-foreground font-semibold mb-2 ${collapsed ? 'text-center' : 'px-3'}`}>
          {collapsed ? '—' : 'Menu'}
        </p>
        {mainNav.map((item) => {
          const active = isActive(item.path);
          return (
            <button
              key={item.path}
              onClick={() => navigate(item.path)}
              className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium transition-all duration-200 group ${
                active
                  ? 'bg-primary/10 text-primary'
                  : 'text-muted-foreground hover:text-foreground hover:bg-accent'
              } ${collapsed ? 'justify-center px-0' : ''}`}
              title={collapsed ? item.label : undefined}
            >
              <item.icon className={`w-5 h-5 flex-shrink-0 ${active ? 'text-primary' : 'group-hover:text-foreground'}`} />
              {!collapsed && <span className="truncate">{item.label}</span>}
              {active && !collapsed && (
                <div className="ml-auto w-1.5 h-1.5 rounded-full bg-primary" />
              )}
            </button>
          );
        })}
      </nav>

      {/* Bottom Section */}
      <div className="px-3 py-2 space-y-1 border-t border-border/50">
        {bottomNav.map((item) => {
          const active = isActive(item.path);
          return (
            <button
              key={item.path}
              onClick={() => navigate(item.path)}
              className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium transition-all duration-200 group ${
                active
                  ? 'bg-primary/10 text-primary'
                  : 'text-muted-foreground hover:text-foreground hover:bg-accent'
              } ${collapsed ? 'justify-center px-0' : ''}`}
              title={collapsed ? item.label : undefined}
            >
              <item.icon className={`w-5 h-5 flex-shrink-0 ${active ? 'text-primary' : 'group-hover:text-foreground'}`} />
              {!collapsed && <span className="truncate">{item.label}</span>}
            </button>
          );
        })}

        {/* Logout */}
        <button
          onClick={handleLogout}
          className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium text-muted-foreground hover:text-red-500 hover:bg-red-500/10 transition-all duration-200 ${collapsed ? 'justify-center px-0' : ''}`}
          title={collapsed ? 'Sair' : undefined}
        >
          <LogOut className="w-5 h-5 flex-shrink-0" />
          {!collapsed && <span>Sair</span>}
        </button>
      </div>

      {/* User Info */}
      <div className={`px-3 py-3 border-t border-border/50 ${collapsed ? 'flex justify-center' : ''}`}>
        <button
          onClick={() => navigate('/settings')}
          className={`flex items-center gap-3 w-full rounded-xl hover:bg-accent px-2 py-2 transition-colors ${collapsed ? 'justify-center px-0' : ''}`}
          title={collapsed ? getFullName() : undefined}
        >
          <div className="w-9 h-9 rounded-full bg-primary/10 flex items-center justify-center flex-shrink-0 overflow-hidden border border-primary/20">
            {user?.profile_photo ? (
              <img src={user.profile_photo} alt="Foto" className="w-full h-full object-cover" />
            ) : user?.avatar_url ? (
              <img src={user.avatar_url} alt="Avatar" className="w-full h-full object-cover" />
            ) : (
              <span className="text-sm font-semibold text-primary">
                {getFirstName().charAt(0).toUpperCase()}
              </span>
            )}
          </div>
          {!collapsed && (
            <div className="min-w-0 text-left">
              <p className="text-sm font-medium text-foreground truncate">{getFullName()}</p>
              {getEmail() && (
                <p className="text-[11px] text-muted-foreground truncate">{getEmail()}</p>
              )}
            </div>
          )}
        </button>
      </div>
    </aside>
  );
};
