import React from 'react';
import { motion } from 'framer-motion';
import { Sun, Moon, ChevronLeft } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { useTheme } from '@/contexts/ThemeContext';
import { OnboardingData } from '../OnboardingWizard';

interface StepAppearanceProps {
  data: OnboardingData;
  updateData: (updates: Partial<OnboardingData>) => void;
  onNext: () => void;
  onPrev: () => void;
}

export const StepAppearance: React.FC<StepAppearanceProps> = ({ data, updateData, onNext, onPrev }) => {
  const { theme, setTheme } = useTheme();

  const handleThemeSelect = (selectedTheme: 'light' | 'dark') => {
    updateData({ theme: selectedTheme });
    setTheme(selectedTheme);
  };

  return (
    <div className="h-full flex flex-col px-6 py-8">
      {/* Back button */}
      <motion.button
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        onClick={onPrev}
        className="flex items-center gap-1 text-muted-foreground mb-8 -ml-1"
      >
        <ChevronLeft className="w-5 h-5" />
        <span>Voltar</span>
      </motion.button>

      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.2 }}
        className="flex-1 flex flex-col"
      >
        {/* Title */}
        <h1 className="text-3xl font-bold text-foreground mb-2">Aparência</h1>
        <p className="text-muted-foreground mb-10">
          Como você prefere visualizar o app?
        </p>

        {/* Theme cards */}
        <div className="grid grid-cols-2 gap-4">
          {/* Light Mode */}
          <motion.button
            whileHover={{ scale: 1.02 }}
            whileTap={{ scale: 0.98 }}
            onClick={() => handleThemeSelect('light')}
            className={`relative p-6 rounded-3xl border-2 transition-all ${
              data.theme === 'light'
                ? 'border-primary bg-primary/5'
                : 'border-border bg-card hover:border-primary/50'
            }`}
          >
            <div className="flex flex-col items-center gap-4">
              <div className={`w-16 h-16 rounded-2xl flex items-center justify-center ${
                data.theme === 'light' ? 'bg-primary' : 'bg-muted'
              }`}>
                <Sun className={`w-8 h-8 ${
                  data.theme === 'light' ? 'text-primary-foreground' : 'text-muted-foreground'
                }`} />
              </div>
              <span className={`font-semibold ${
                data.theme === 'light' ? 'text-primary' : 'text-foreground'
              }`}>
                Claro
              </span>
            </div>
            {data.theme === 'light' && (
              <motion.div
                layoutId="theme-check"
                className="absolute top-3 right-3 w-6 h-6 rounded-full bg-primary flex items-center justify-center"
              >
                <svg className="w-4 h-4 text-primary-foreground" viewBox="0 0 20 20" fill="currentColor">
                  <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                </svg>
              </motion.div>
            )}
          </motion.button>

          {/* Dark Mode */}
          <motion.button
            whileHover={{ scale: 1.02 }}
            whileTap={{ scale: 0.98 }}
            onClick={() => handleThemeSelect('dark')}
            className={`relative p-6 rounded-3xl border-2 transition-all ${
              data.theme === 'dark'
                ? 'border-primary bg-primary/5'
                : 'border-border bg-card hover:border-primary/50'
            }`}
          >
            <div className="flex flex-col items-center gap-4">
              <div className={`w-16 h-16 rounded-2xl flex items-center justify-center ${
                data.theme === 'dark' ? 'bg-primary' : 'bg-muted'
              }`}>
                <Moon className={`w-8 h-8 ${
                  data.theme === 'dark' ? 'text-primary-foreground' : 'text-muted-foreground'
                }`} />
              </div>
              <span className={`font-semibold ${
                data.theme === 'dark' ? 'text-primary' : 'text-foreground'
              }`}>
                Escuro
              </span>
            </div>
            {data.theme === 'dark' && (
              <motion.div
                layoutId="theme-check"
                className="absolute top-3 right-3 w-6 h-6 rounded-full bg-primary flex items-center justify-center"
              >
                <svg className="w-4 h-4 text-primary-foreground" viewBox="0 0 20 20" fill="currentColor">
                  <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                </svg>
              </motion.div>
            )}
          </motion.button>
        </div>

        {/* Preview mock */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.4 }}
          className="mt-8 p-4 rounded-2xl bg-card border border-border"
        >
          <p className="text-sm text-muted-foreground text-center">
            A mudança é aplicada automaticamente
          </p>
        </motion.div>

        {/* Spacer */}
        <div className="flex-1" />

        {/* Button */}
        <Button
          onClick={onNext}
          className="w-full h-14 text-lg font-semibold rounded-2xl"
        >
          Continuar
        </Button>
      </motion.div>
    </div>
  );
};
