import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { ChevronLeft, CreditCard, Plus, X } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { OnboardingData } from '../OnboardingWizard';

interface StepCardsProps {
  data: OnboardingData;
  updateData: (updates: Partial<OnboardingData>) => void;
  onNext: () => void;
  onPrev: () => void;
}

const cardColors = [
  '#8B5CF6', // Purple (Nubank)
  '#F97316', // Orange (Itaú)
  '#EF4444', // Red (Santander)
  '#3B82F6', // Blue (Caixa)
  '#10B981', // Green (C6)
  '#6366F1', // Indigo (Inter)
];

export const StepCards: React.FC<StepCardsProps> = ({ data, updateData, onNext, onPrev }) => {
  const [newCardName, setNewCardName] = useState('');
  const [newCardLimit, setNewCardLimit] = useState('');

  const addCard = () => {
    if (newCardName.trim() && newCardLimit) {
      const limit = parseInt(newCardLimit.replace(/\D/g, '')) || 0;
      if (limit > 0) {
        updateData({
          cards: [...data.cards, { name: newCardName.trim(), limit }],
        });
        setNewCardName('');
        setNewCardLimit('');
      }
    }
  };

  const removeCard = (index: number) => {
    updateData({
      cards: data.cards.filter((_, i) => i !== index),
    });
  };

  const handleLimitChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value.replace(/\D/g, '');
    const numValue = parseInt(value) || 0;
    setNewCardLimit(numValue > 0 ? numValue.toLocaleString('pt-BR') : '');
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
        className="flex-1 flex flex-col overflow-hidden"
      >
        {/* Icon */}
        <motion.div
          initial={{ scale: 0 }}
          animate={{ scale: 1 }}
          transition={{ type: 'spring', delay: 0.3 }}
          className="w-16 h-16 rounded-2xl bg-primary/10 flex items-center justify-center mb-6"
        >
          <CreditCard className="w-8 h-8 text-primary" />
        </motion.div>

        {/* Title */}
        <h1 className="text-3xl font-bold text-foreground mb-2">Seus Cartões</h1>
        <p className="text-muted-foreground mb-6">
          Quais cartões você utiliza?
        </p>

        {/* Card list */}
        <div className="flex-1 overflow-y-auto -mx-6 px-6 space-y-3 mb-4">
          <AnimatePresence>
            {data.cards.map((card, index) => (
              <motion.div
                key={`${card.name}-${index}`}
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: 20 }}
                className="flex items-center gap-3 p-4 rounded-2xl bg-card border border-border"
              >
                <div
                  className="w-10 h-10 rounded-xl flex items-center justify-center"
                  style={{ backgroundColor: cardColors[index % cardColors.length] + '20' }}
                >
                  <CreditCard
                    className="w-5 h-5"
                    style={{ color: cardColors[index % cardColors.length] }}
                  />
                </div>
                <div className="flex-1">
                  <p className="font-semibold text-foreground">{card.name}</p>
                  <p className="text-sm text-muted-foreground">
                    Limite: R$ {card.limit.toLocaleString('pt-BR')}
                  </p>
                </div>
                <Button
                  variant="ghost"
                  size="icon"
                  onClick={() => removeCard(index)}
                  className="h-8 w-8 text-muted-foreground hover:text-destructive"
                >
                  <X className="w-4 h-4" />
                </Button>
              </motion.div>
            ))}
          </AnimatePresence>

          {data.cards.length === 0 && (
            <div className="text-center py-8 text-muted-foreground">
              <CreditCard className="w-12 h-12 mx-auto mb-3 opacity-30" />
              <p>Nenhum cartão adicionado</p>
            </div>
          )}
        </div>

        {/* Add card form */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.4 }}
          className="bg-muted/50 rounded-2xl p-4 space-y-3"
        >
          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-1">
              <Label className="text-xs">Nome do Cartão</Label>
              <Input
                placeholder="Nubank"
                value={newCardName}
                onChange={(e) => setNewCardName(e.target.value)}
                className="h-11 rounded-xl"
              />
            </div>
            <div className="space-y-1">
              <Label className="text-xs">Limite (R$)</Label>
              <Input
                placeholder="5.000"
                value={newCardLimit}
                onChange={handleLimitChange}
                inputMode="numeric"
                className="h-11 rounded-xl"
              />
            </div>
          </div>
          <Button
            onClick={addCard}
            variant="outline"
            disabled={!newCardName.trim() || !newCardLimit}
            className="w-full h-11 rounded-xl"
          >
            <Plus className="w-4 h-4 mr-2" />
            Adicionar Cartão
          </Button>
        </motion.div>

        {/* Spacer */}
        <div className="h-4" />

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
