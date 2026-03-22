import React from 'react';
import { DesktopSidebar } from '@/components/DesktopSidebar';
import { BottomNav } from '@/components/BottomNav';

interface AppLayoutProps {
  children: React.ReactNode;
  /** Se true, não mostra a BottomNav (útil para páginas fullscreen como Login) */
  hideNav?: boolean;
}

/**
 * Layout principal da aplicação.
 * - Desktop (lg+): Sidebar lateral + conteúdo principal
 * - Mobile (<lg): Conteúdo + BottomNav fixa embaixo
 */
export const AppLayout: React.FC<AppLayoutProps> = ({ children, hideNav = false }) => {
  return (
    <div className="flex min-h-screen bg-background">
      {/* Sidebar — visível apenas no desktop (lg+) */}
      {!hideNav && <DesktopSidebar />}

      {/* Conteúdo principal */}
      <main className="flex-1 min-w-0">
        {children}
      </main>

      {/* BottomNav — visível apenas no mobile (<lg) */}
      {!hideNav && (
        <div className="lg:hidden">
          <BottomNav />
        </div>
      )}
    </div>
  );
};
