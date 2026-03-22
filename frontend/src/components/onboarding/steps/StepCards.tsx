import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { ChevronLeft, CreditCard, Plus, X, Search, ArrowLeft } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { OnboardingData } from '../OnboardingWizard';
import { BRAZILIAN_BANKS, getBankById, BankInfo } from '@/lib/banks';
import BankLogo from '@/components/BankLogo';

interface StepCardsProps {
  data: OnboardingData;
  updateData: (updates: Partial<OnboardingData>) => void;
  onNext: () => void;
  onPrev: () => void;
}

// ── Seletor de banco (overlay animado sobre o step) ─────────────────────────
const BankPickerSheet: React.FC<{
  onSelect: (bank: BankInfo) => void;
  onSkip: () => void;
  onClose: () => void;
}> = ({ onSelect, onSkip, onClose }) => {
  const [search, setSearch] = useState('');
  const filtered = BRAZILIAN_BANKS.filter(b =>
    b.name.toLowerCase().includes(search.toLowerCase())
  );

  return (
    <motion.div
      initial={{ opacity: 0, y: 40 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: 40 }}
      transition={{ type: 'spring', damping: 25, stiffness: 300 }}
      className="absolute inset-0 z-10 bg-background flex flex-col rounded-3xl overflow-hidden"
    >
      <div className="flex items-center gap-3 px-5 py-4 border-b flex-shrink-0">
        <button type="button" onClick={onClose} className="text-muted-foreground">
          <ArrowLeft className="w-5 h-5" />
        </button>
        <h3 className="text-base font-bold flex-1">Escolha o banco</h3>
      </div>

      <div className="px-4 pt-3 pb-2 flex-shrink-0">
        <div className="relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
          <Input
            placeholder="Buscar banco..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="pl-9 h-10 rounded-xl"
            autoFocus
          />
        </div>
      </div>

      <div className="flex-1 overflow-y-auto px-4 pb-4">
        <div className="grid grid-cols-3 gap-2 mt-1">
          {filtered.map((bank) => (
            <button
              key={bank.id}
              type="button"
              onClick={() => onSelect(bank)}
              className="flex flex-col items-center gap-1.5 p-2.5 rounded-2xl bg-card border border-border hover:border-primary hover:bg-primary/5 transition-all active:scale-95"
            >
              <div className="w-11 h-11 rounded-xl bg-white flex items-center justify-center overflow-hidden shadow-sm">
                <BankLogo bankId={bank.id} size={36} />
              </div>
              <span className="text-[11px] font-medium text-foreground text-center leading-tight truncate w-full">
                {bank.name}
              </span>
            </button>
          ))}
        </div>
        {filtered.length === 0 && (
          <p className="text-center text-muted-foreground text-sm py-8">Nenhum banco encontrado</p>
        )}
      </div>

      <div className="px-4 pb-4 pt-2 border-t flex-shrink-0">
        <Button variant="ghost" onClick={onSkip} className="w-full text-muted-foreground text-sm">
          Pular — configurar sem banco
        </Button>
      </div>
    </motion.div>
  );
};

// ── Componente principal ────────────────────────────────────────────────────
export const StepCards: React.FC<StepCardsProps> = ({ data, updateData, onNext, onPrev }) => {
  const [newCardName, setNewCardName] = useState('');
  const [newCardLimit, setNewCardLimit] = useState('');
  const [selectedBank, setSelectedBank] = useState<BankInfo | null>(null);
  const [showBankPicker, setShowBankPicker] = useState(false);

  const handleBankSelect = (bank: BankInfo) => {
    setSelectedBank(bank);
    if (!newCardName) setNewCardName(bank.name);
    setShowBankPicker(false);
  };

  const addCard = () => {
    if (newCardName.trim() && newCardLimit) {
      const limit = Number.parseInt(newCardLimit.replaceAll(/\D/g, ''), 10) || 0;
      if (limit > 0) {
        updateData({
          cards: [
            ...data.cards,
            {
              name: newCardName.trim(),
              limit,
              icon: selectedBank?.id,
              color: selectedBank?.color,
            },
          ],
        });
        setNewCardName('');
        setNewCardLimit('');
        setSelectedBank(null);
      }
    }
  };

  const removeCard = (index: number) => {
    updateData({ cards: data.cards.filter((_, i) => i !== index) });
  };

  const handleLimitChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value.replaceAll(/\D/g, '');
    const numValue = Number.parseInt(value, 10) || 0;
    setNewCardLimit(numValue > 0 ? numValue.toLocaleString('pt-BR') : '');
  };

  return (
    <div className="h-full flex flex-col px-6 py-8 relative overflow-hidden">
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

        <h1 className="text-3xl font-bold text-foreground mb-2">Seus Cartões</h1>
        <p className="text-muted-foreground mb-6">Quais cartões você utiliza?</p>

        {/* Lista de cartões */}
        <div className="flex-1 overflow-y-auto -mx-6 px-6 space-y-3 mb-4">
          <AnimatePresence>
            {data.cards.map((card, index) => {
              const bank = card.icon ? getBankById(card.icon) : null;
              return (
                <motion.div
                  key={`${card.name}-${index}`}
                  initial={{ opacity: 0, x: -20 }}
                  animate={{ opacity: 1, x: 0 }}
                  exit={{ opacity: 0, x: 20 }}
                  className="flex items-center gap-3 p-4 rounded-2xl bg-card border border-border"
                >
                  <div
                    className="w-10 h-10 rounded-xl flex items-center justify-center overflow-hidden"
                    style={{ backgroundColor: bank ? '#fff' : (card.color ?? '#8B5CF6') + '20' }}
                  >
                    {bank ? (
                      <BankLogo bankId={bank.id} size={32} />
                    ) : (
                      <CreditCard className="w-5 h-5" style={{ color: card.color ?? '#8B5CF6' }} />
                    )}
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
              );
            })}
          </AnimatePresence>

          {data.cards.length === 0 && (
            <div className="text-center py-8 text-muted-foreground">
              <CreditCard className="w-12 h-12 mx-auto mb-3 opacity-30" />
              <p>Nenhum cartão adicionado</p>
            </div>
          )}
        </div>

        {/* Formulário de novo cartão */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.4 }}
          className="bg-muted/50 rounded-2xl p-4 space-y-3"
        >
          {/* Seletor de banco */}
          <div className="space-y-1">
            <Label className="text-xs">Banco (opcional)</Label>
            <button
              type="button"
              onClick={() => setShowBankPicker(true)}
              className="w-full h-11 rounded-xl border border-input bg-background flex items-center gap-3 px-3 text-sm hover:border-primary transition-colors"
            >
              {selectedBank ? (
                <>
                  <div className="w-7 h-7 rounded-lg bg-white flex items-center justify-center overflow-hidden shadow-sm flex-shrink-0">
                    <BankLogo bankId={selectedBank.id} size={24} />
                  </div>
                  <span className="flex-1 text-left font-medium">{selectedBank.name}</span>
                  <button
                    type="button"
                    onClick={(e) => { e.stopPropagation(); setSelectedBank(null); }}
                    className="text-muted-foreground hover:text-destructive"
                  >
                    <X className="w-4 h-4" />
                  </button>
                </>
              ) : (
                <>
                  <div className="w-7 h-7 rounded-lg bg-muted flex items-center justify-center flex-shrink-0">
                    <Search className="w-4 h-4 text-muted-foreground" />
                  </div>
                  <span className="flex-1 text-left text-muted-foreground">Selecionar banco...</span>
                </>
              )}
            </button>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-1">
              <Label className="text-xs">Nome do Cartão</Label>
              <Input
                placeholder={selectedBank?.name ?? 'Nubank'}
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

        <div className="h-4" />

        <Button onClick={onNext} className="w-full h-14 text-lg font-semibold rounded-2xl">
          Continuar
        </Button>
      </motion.div>

      {/* Bank picker overlay */}
      <AnimatePresence>
        {showBankPicker && (
          <BankPickerSheet
            onSelect={handleBankSelect}
            onSkip={() => { setSelectedBank(null); setShowBankPicker(false); }}
            onClose={() => setShowBankPicker(false)}
          />
        )}
      </AnimatePresence>
    </div>
  );
};
