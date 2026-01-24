import React, { useEffect } from 'react';
import { motion } from 'framer-motion';
import { Check, Loader2 } from 'lucide-react';
import { useAuth } from '@/contexts/AuthContext';
import { Button } from '@/components/ui/button';

interface StepCompleteProps {
  onNext: () => void;
  isSaving?: boolean;
}

export const StepComplete: React.FC<StepCompleteProps> = ({ onNext, isSaving }) => {
  const { user } = useAuth();

  // Tenta rodar o onNext automaticamente após 2 segundos para experiência fluida
  // MAS apenas se não estiver salvando ainda
  useEffect(() => {
    if (!isSaving) {
        const timer = setTimeout(() => {
            onNext();
        }, 1500);
        return () => clearTimeout(timer);
    }
  }, [onNext, isSaving]);

  return (
    <div className="h-full flex flex-col items-center justify-center text-center px-6 py-12">
      <motion.div
        initial={{ scale: 0 }}
        animate={{ scale: 1 }}
        transition={{ type: "spring", stiffness: 260, damping: 20 }}
        className="w-24 h-24 bg-green-500/10 rounded-full flex items-center justify-center mb-8"
      >
        {isSaving ? (
             <Loader2 className="w-12 h-12 text-green-600 animate-spin" />
        ) : (
             <Check className="w-12 h-12 text-green-600" />
        )}
      </motion.div>

      <h1 className="text-3xl font-bold mb-4">Tudo Pronto!</h1>
      
      <p className="text-muted-foreground text-lg mb-8">
        Bem-vindo, {user?.name ? user.name.split(' ')[0] : 'Usuário'}!
        <br />
        <span className="text-sm">
            {isSaving ? "Salvando suas configurações..." : "Preparando seu painel..."}
        </span>
      </p>

      {/* Botão de segurança caso o timer falhe */}
      {!isSaving && (
        <Button onClick={onNext} className="mt-4" variant="outline">
          Acessar Painel Agora
        </Button>
      )}
    </div>
  );
};
