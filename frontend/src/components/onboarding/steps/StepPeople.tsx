import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { ChevronLeft, Users, User, UserPlus, X } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { OnboardingData } from '../OnboardingWizard';

interface StepPeopleProps {
  data: OnboardingData;
  updateData: (updates: Partial<OnboardingData>) => void;
  onNext: () => void;
  onPrev: () => void;
}

export const StepPeople: React.FC<StepPeopleProps> = ({ data, updateData, onNext, onPrev }) => {
  const [newPerson, setNewPerson] = useState('');

  const addPerson = () => {
    if (newPerson.trim() && !data.people.includes(newPerson.trim())) {
      updateData({
        people: [...data.people, newPerson.trim()],
      });
      setNewPerson('');
    }
  };

  const removePerson = (name: string) => {
    if (name !== 'Eu') {
      updateData({
        people: data.people.filter((p) => p !== name),
      });
    }
  };

  const handleSharedToggle = (shared: boolean) => {
    updateData({ isShared: shared });
    if (!shared) {
      updateData({ people: ['Eu'] });
    }
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
          className="w-16 h-16 rounded-2xl bg-accent flex items-center justify-center mb-6"
        >
          <Users className="w-8 h-8 text-primary" />
        </motion.div>

        {/* Title */}
        <h1 className="text-3xl font-bold text-foreground mb-2">Quem Usa?</h1>
        <p className="text-muted-foreground mb-8">
          Mais alguém utiliza estes cartões?
        </p>

        {/* Options */}
        <div className="grid grid-cols-2 gap-4 mb-6">
          <motion.button
            whileHover={{ scale: 1.02 }}
            whileTap={{ scale: 0.98 }}
            onClick={() => handleSharedToggle(false)}
            className={`relative p-5 rounded-2xl border-2 transition-all ${
              !data.isShared
                ? 'border-primary bg-primary/5'
                : 'border-border bg-card hover:border-primary/50'
            }`}
          >
            <div className="flex flex-col items-center gap-3">
              <User className={`w-8 h-8 ${!data.isShared ? 'text-primary' : 'text-muted-foreground'}`} />
              <span className={`font-semibold text-sm ${!data.isShared ? 'text-primary' : 'text-foreground'}`}>
                Apenas eu
              </span>
            </div>
          </motion.button>

          <motion.button
            whileHover={{ scale: 1.02 }}
            whileTap={{ scale: 0.98 }}
            onClick={() => handleSharedToggle(true)}
            className={`relative p-5 rounded-2xl border-2 transition-all ${
              data.isShared
                ? 'border-primary bg-primary/5'
                : 'border-border bg-card hover:border-primary/50'
            }`}
          >
            <div className="flex flex-col items-center gap-3">
              <Users className={`w-8 h-8 ${data.isShared ? 'text-primary' : 'text-muted-foreground'}`} />
              <span className={`font-semibold text-sm ${data.isShared ? 'text-primary' : 'text-foreground'}`}>
                Eu e outros
              </span>
            </div>
          </motion.button>
        </div>

        {/* People list (when shared) */}
        <AnimatePresence>
          {data.isShared && (
            <motion.div
              initial={{ opacity: 0, height: 0 }}
              animate={{ opacity: 1, height: 'auto' }}
              exit={{ opacity: 0, height: 0 }}
              className="flex-1 overflow-hidden"
            >
              <div className="space-y-3 mb-4 overflow-y-auto max-h-40">
                {data.people.map((person) => (
                  <motion.div
                    key={person}
                    initial={{ opacity: 0, x: -20 }}
                    animate={{ opacity: 1, x: 0 }}
                    exit={{ opacity: 0, x: 20 }}
                    className="flex items-center gap-3 p-3 rounded-xl bg-card border border-border"
                  >
                    <div className="w-10 h-10 rounded-full bg-primary/10 flex items-center justify-center">
                      <User className="w-5 h-5 text-primary" />
                    </div>
                    <span className="flex-1 font-medium">{person}</span>
                    {person !== 'Eu' && (
                      <Button
                        variant="ghost"
                        size="icon"
                        onClick={() => removePerson(person)}
                        className="h-8 w-8 text-muted-foreground hover:text-destructive"
                      >
                        <X className="w-4 h-4" />
                      </Button>
                    )}
                  </motion.div>
                ))}
              </div>

              {/* Add person */}
              <div className="flex gap-2">
                <Input
                  placeholder="Nome da pessoa (ex: Esposa)"
                  value={newPerson}
                  onChange={(e) => setNewPerson(e.target.value)}
                  onKeyDown={(e) => e.key === 'Enter' && addPerson()}
                  className="flex-1 h-12 rounded-xl"
                />
                <Button
                  onClick={addPerson}
                  disabled={!newPerson.trim()}
                  className="h-12 px-4 rounded-xl"
                >
                  <UserPlus className="w-5 h-5" />
                </Button>
              </div>
            </motion.div>
          )}
        </AnimatePresence>

        {/* Spacer */}
        <div className="flex-1" />

        {/* Button */}
        <Button
          onClick={onNext}
          className="w-full h-14 text-lg font-semibold rounded-2xl"
        >
          Finalizar Configuração
        </Button>
      </motion.div>
    </div>
  );
};
