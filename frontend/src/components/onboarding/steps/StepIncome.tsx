import React from 'react';
import { motion } from 'framer-motion';
import { ChevronLeft, DollarSign } from 'lucide-react';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { OnboardingData } from '../OnboardingWizard';

interface StepIncomeProps {
  data: OnboardingData;
  updateData: (updates: Partial<OnboardingData>) => void;
  onNext: () => void;
  onPrev: () => void;
}

export const StepIncome: React.FC<StepIncomeProps> = ({ data, updateData, onNext, onPrev }) => {
  
  const handleAmountChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    // Remove tudo que não é número
    let value = e.target.value.replace(/\D/g, '');
    const amount = parseFloat(value) / 100;
    
    if (isNaN(amount)) {
      updateData({ income: '' });
      return;
    }

    // Formata para BRL (R$ 1.000,00)
    const formatted = amount.toLocaleString('pt-BR', {
      style: 'currency',
      currency: 'BRL',
    });

    // ATENÇÃO: Salvamos em 'income', removendo qualquer referência a 'monthlyIncome'
    updateData({ income: formatted });
  };

  return (
    <div className="h-full flex flex-col px-6 py-4 md:py-8">
      <motion.button
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        onClick={onPrev}
        className="flex items-center gap-1 text-muted-foreground mb-4 md:mb-8 -ml-1"
      >
        <ChevronLeft className="w-5 h-5" />
        <span>Voltar</span>
      </motion.button>

      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.2 }}
        className="flex-1"
      >
        <motion.div
          initial={{ scale: 0 }}
          animate={{ scale: 1 }}
          transition={{ type: 'spring', delay: 0.3 }}
          className="w-16 h-16 rounded-2xl bg-green-500/10 flex items-center justify-center mb-6"
        >
          <DollarSign className="w-8 h-8 text-green-600" />
        </motion.div>

        <h1 className="text-3xl font-bold mb-2">Renda Mensal</h1>
        <p className="text-muted-foreground mb-8">
          Qual é a sua renda mensal média?
        </p>

        <div className="space-y-4">
          <label className="text-sm font-medium mb-2 block">
            Valor Mensal
          </label>
          <Input
            type="text"
            placeholder="R$ 0,00"
            value={data.income || ''} // Usa data.income
            onChange={handleAmountChange}
            className="text-lg h-12"
          />
        </div>

        <div className="mt-8">
          <Button 
            onClick={onNext} 
            className="w-full h-12 text-lg rounded-xl"
            disabled={!data.income || data.income === 'R$ 0,00'}
          >
            Continuar
          </Button>
        </div>
      </motion.div>
    </div>
  );
};
