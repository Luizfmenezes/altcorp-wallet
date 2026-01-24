import React, { useState } from 'react';
import { motion } from 'framer-motion';
import { ChevronLeft, DollarSign } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { OnboardingData } from '../OnboardingWizard';

interface StepIncomeProps {
  data: OnboardingData;
  updateData: (updates: Partial<OnboardingData>) => void;
  onNext: () => void;
  onPrev: () => void;
}

export const StepIncome: React.FC<StepIncomeProps> = ({ data, updateData, onNext, onPrev }) => {
  const [inputValue, setInputValue] = useState(
    data.monthlyIncome ? data.monthlyIncome.toLocaleString('pt-BR') : ''
  );

  const handleIncomeChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value.replace(/\D/g, '');
    const numValue = parseInt(value) || 0;
    setInputValue(numValue.toLocaleString('pt-BR'));
    updateData({ monthlyIncome: numValue });
  };

  const isValid = data.monthlyIncome > 0;

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
        {/* Icon */}
        <motion.div
          initial={{ scale: 0 }}
          animate={{ scale: 1 }}
          transition={{ type: 'spring', delay: 0.3 }}
          className="w-16 h-16 rounded-2xl bg-success/10 flex items-center justify-center mb-6"
        >
          <DollarSign className="w-8 h-8 text-success" />
        </motion.div>

        {/* Title */}
        <h1 className="text-3xl font-bold text-foreground mb-2">Renda Inicial</h1>
        <p className="text-muted-foreground mb-10">
          Qual é sua renda mensal média?
        </p>

        {/* Income input */}
        <div className="space-y-3">
          <Label htmlFor="income" className="text-base">Valor em Reais</Label>
          <div className="relative">
            <span className="absolute left-4 top-1/2 -translate-y-1/2 text-muted-foreground text-lg font-medium">
              R$
            </span>
            <Input
              id="income"
              type="text"
              inputMode="numeric"
              placeholder="5.000"
              value={inputValue}
              onChange={handleIncomeChange}
              className="h-16 pl-12 text-2xl font-semibold rounded-2xl bg-secondary border-0 focus:ring-2 focus:ring-primary/50"
            />
          </div>
          <p className="text-sm text-muted-foreground">
            Este valor será usado como sua renda fixa mensal.
          </p>
        </div>

        {/* Quick select */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.4 }}
          className="grid grid-cols-3 gap-2 mt-6"
        >
          {[3000, 5000, 8000, 10000, 15000, 20000].map((value) => (
            <Button
              key={value}
              variant={data.monthlyIncome === value ? 'default' : 'outline'}
              onClick={() => {
                setInputValue(value.toLocaleString('pt-BR'));
                updateData({ monthlyIncome: value });
              }}
              className="h-12 rounded-xl text-sm font-medium"
            >
              {value.toLocaleString('pt-BR')}
            </Button>
          ))}
        </motion.div>

        {/* Spacer */}
        <div className="flex-1" />

        {/* Button */}
        <Button
          onClick={onNext}
          disabled={!isValid}
          className="w-full h-14 text-lg font-semibold rounded-2xl"
        >
          Continuar
        </Button>
      </motion.div>
    </div>
  );
};
