import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import { StepWelcome } from './steps/StepWelcome';
import { StepPeople } from './steps/StepPeople';
import { StepIncome } from './steps/StepIncome';
import { StepCards } from './steps/StepCards';
import { StepAppearance } from './steps/StepAppearance';
import { StepComplete } from './steps/StepComplete';
import { useFinance } from '@/contexts/FinanceContext';
import { useAuth } from '@/contexts/AuthContext';
import { useToast } from '@/hooks/use-toast';

// EXPORTAÇÃO DA INTERFACE (Obrigatória para o erro sumir)
export interface OnboardingData {
  people: string[];
  isShared: boolean;
  income: string;
  cards: Array<{ name: string; limit: string; type?: string; color?: string }>;
  theme: string;
}

// EXPORTAÇÃO DO COMPONENTE (Obrigatória para o erro sumir)
export const OnboardingWizard = ({ onComplete }: { onComplete: () => void }) => {
  const [step, setStep] = useState(0);
  const [isSaving, setIsSaving] = useState(false);
  
  const { addPerson, addIncome, addCard, setPeople } = useFinance();
  const { user, updateUser } = useAuth();
  const { toast } = useToast();

  const [data, setData] = useState<OnboardingData>({
    people: ['Eu'],
    isShared: false,
    income: '',
    cards: [],
    theme: 'system'
  });

  const steps = [
    { title: 'Bem-vindo', component: StepWelcome },
    { title: 'Pessoas', component: StepPeople },
    { title: 'Renda Inicial', component: StepIncome },
    { title: 'Cartões', component: StepCards },
    { title: 'Aparência', component: StepAppearance },
    { title: 'Conclusão', component: StepComplete },
  ];

  const CurrentStep = steps[step].component;
  const progress = ((step + 1) / steps.length) * 100;

  const handleNext = async () => {
    if (step === steps.length - 1) {
      await handleFinish();
    } else {
      setStep(step + 1);
    }
  };

  const handleBack = () => {
    if (step > 0) {
      setStep(step - 1);
    }
  };

  const updateData = (updates: Partial<OnboardingData>) => {
    setData(prev => ({ ...prev, ...updates }));
  };

  const handleFinish = async () => {
    setIsSaving(true);
    try {
      // 1. Pessoas
      const validPeople = data.people.filter(p => p && p.trim() !== '');
      if (validPeople.length > 0) {
        setPeople(validPeople);
      }

      // 2. Renda
      if (data.income) {
        const amountStr = data.income.toString().replace('R$', '').replace(/\./g, '').replace(',', '.').trim();
        const amount = parseFloat(amountStr);
        if (!isNaN(amount) && amount > 0) {
            await addIncome({
                description: 'Salário / Renda Inicial',
                amount: amount,
                type: 'fixed',
                month: new Date().getMonth(),
                year: new Date().getFullYear()
            });
        }
      }

      // 3. Cartões
      if (data.cards && data.cards.length > 0) {
        for (const card of data.cards) {
            await addCard({
                name: card.name || 'Cartão',
                type: (card.type as any) || 'credit',
                color: card.color || '#000000',
            });
        }
      }

      // 4. Update User
      if (user && typeof updateUser === 'function') {
        await updateUser({ onboarding_completed: true });
      }

      toast({ title: "Tudo pronto!", description: "Configuração concluída." });
      onComplete();

    } catch (error) {
      console.error("Erro no Wizard:", error);
      toast({ title: "Erro", description: "Falha ao salvar.", variant: "destructive" });
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-background z-50 flex items-center justify-center p-4">
      <Card className="w-full max-w-2xl shadow-xl flex flex-col max-h-[90vh]">
        <CardHeader className="flex-shrink-0 pb-2">
          <div className="flex justify-between items-center mb-4">
            <CardTitle className={step === 0 ? "sr-only" : ""}>{steps[step].title}</CardTitle>
            {step > 0 && (
              <span className="text-sm text-muted-foreground">Passo {step + 1} de {steps.length}</span>
            )}
          </div>
          <Progress value={progress} className="h-2 transition-all" />
        </CardHeader>
        <CardContent className="flex-1 overflow-y-auto py-4">
          {/* @ts-ignore */}
          <CurrentStep 
            data={data} 
            updateData={updateData} 
            onNext={handleNext}
            onPrev={handleBack}
            isSaving={isSaving} 
          />
        </CardContent>
      </Card>
    </div>
  );
};
