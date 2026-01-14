import React from 'react';
import { motion } from 'framer-motion';
import { Wallet } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { OnboardingData } from '../OnboardingWizard';

interface StepWelcomeProps {
  data: OnboardingData;
  updateData: (updates: Partial<OnboardingData>) => void;
  onNext: () => void;
}

export const StepWelcome: React.FC<StepWelcomeProps> = ({ data, updateData, onNext }) => {
  const isValid = data.firstName.trim() && data.lastName.trim() && data.email.trim();

  return (
    <div className="h-full flex flex-col px-6 py-8">
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.2 }}
        className="flex-1 flex flex-col"
      >
        {/* Logo */}
        <motion.div
          initial={{ scale: 0 }}
          animate={{ scale: 1 }}
          transition={{ type: 'spring', delay: 0.3 }}
          className="w-20 h-20 rounded-2xl bg-primary flex items-center justify-center mx-auto mb-8"
        >
          <Wallet className="w-10 h-10 text-primary-foreground" />
        </motion.div>

        {/* Title */}
        <motion.h1
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.4 }}
          className="text-3xl font-bold text-center text-foreground mb-2"
        >
          Seja bem-vindo ao
        </motion.h1>
        <motion.p
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.5 }}
          className="text-2xl font-semibold text-primary text-center mb-8"
        >
          ALTCORP Wallet
        </motion.p>

        <motion.p
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.6 }}
          className="text-muted-foreground text-center mb-8"
        >
          Vamos configurar seu perfil.
        </motion.p>

        {/* Form */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.7 }}
          className="space-y-4"
        >
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="firstName">Nome</Label>
              <Input
                id="firstName"
                placeholder="João"
                value={data.firstName}
                onChange={(e) => updateData({ firstName: e.target.value })}
                className="input-finance"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="lastName">Sobrenome</Label>
              <Input
                id="lastName"
                placeholder="Silva"
                value={data.lastName}
                onChange={(e) => updateData({ lastName: e.target.value })}
                className="input-finance"
              />
            </div>
          </div>

          <div className="space-y-2">
            <Label htmlFor="email">Email</Label>
            <Input
              id="email"
              type="email"
              placeholder="joao@email.com"
              value={data.email}
              onChange={(e) => updateData({ email: e.target.value })}
              className="input-finance"
            />
          </div>
        </motion.div>

        {/* Spacer */}
        <div className="flex-1" />

        {/* Button */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.8 }}
        >
          <Button
            onClick={onNext}
            disabled={!isValid}
            className="w-full h-14 text-lg font-semibold rounded-2xl"
          >
            Continuar
          </Button>
        </motion.div>
      </motion.div>
    </div>
  );
};
