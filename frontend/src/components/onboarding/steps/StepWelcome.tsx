import React from 'react';
import { motion } from 'framer-motion';
import { Wallet, ArrowRight } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { useAuth } from '@/contexts/AuthContext';

interface StepWelcomeProps {
  onNext: () => void;
}

export const StepWelcome: React.FC<StepWelcomeProps> = ({ onNext }) => {
  const { user } = useAuth();

  // 🛡️ BLINDAGEM: Garante que firstName nunca quebre, mesmo se user.name for undefined
  const getFirstName = () => {
    if (!user || !user.name) return 'Visitante';
    try {
      return String(user.name).trim().split(' ')[0];
    } catch (e) {
      return 'Visitante';
    }
  };

  return (
    <div className="h-full flex flex-col px-6 py-8 items-center text-center">
      <motion.div
        initial={{ scale: 0 }}
        animate={{ scale: 1 }}
        transition={{ type: "spring", stiffness: 260, damping: 20 }}
        className="w-20 h-20 bg-primary/10 rounded-3xl flex items-center justify-center mb-8"
      >
        <Wallet className="w-10 h-10 text-primary" />
      </motion.div>

      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.2 }}
      >
        <h1 className="text-3xl font-bold mb-3">
          Olá, {getFirstName()}! 👋
        </h1>
        <p className="text-muted-foreground text-lg mb-8 max-w-sm mx-auto">
          Vamos configurar sua carteira digital para você ter controle total das suas finanças em poucos minutos.
        </p>
      </motion.div>

      <div className="flex-1" />

      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.4 }}
        className="w-full"
      >
        <Button 
          onClick={onNext} 
          className="w-full h-14 text-lg font-semibold rounded-2xl group"
        >
          Começar Configuração
          <ArrowRight className="w-5 h-5 ml-2 group-hover:translate-x-1 transition-transform" />
        </Button>
      </motion.div>
    </div>
  );
};
