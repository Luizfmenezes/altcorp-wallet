import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { StepWelcome } from './steps/StepWelcome';
import { StepPhoto } from './steps/StepPhoto';
import { StepAppearance } from './steps/StepAppearance';
import { StepIncome } from './steps/StepIncome';
import { StepCards } from './steps/StepCards';
import { StepPeople } from './steps/StepPeople';
import { StepComplete } from './steps/StepComplete';

export interface OnboardingData {
  firstName: string;
  lastName: string;
  email: string;
  profilePhoto?: string;
  theme: 'light' | 'dark';
  monthlyIncome: number;
  cards: Array<{ name: string; limit: number }>;
  people: string[];
  isShared: boolean;
}

interface OnboardingWizardProps {
  onComplete: (data: OnboardingData) => void;
}

export const OnboardingWizard: React.FC<OnboardingWizardProps> = ({ onComplete }) => {
  const [currentStep, setCurrentStep] = useState(0);
  const [showComplete, setShowComplete] = useState(false);
  const [data, setData] = useState<OnboardingData>({
    firstName: '',
    lastName: '',
    email: '',
    profilePhoto: undefined,
    theme: 'dark',
    monthlyIncome: 0,
    cards: [],
    people: ['Eu'],
    isShared: false,
  });

  const updateData = (updates: Partial<OnboardingData>) => {
    setData(prev => ({ ...prev, ...updates }));
  };

  const totalSteps = 6; // Welcome, Photo, Appearance, Income, Cards, People

  const nextStep = () => {
    if (currentStep < totalSteps - 1) {
      setCurrentStep(prev => prev + 1);
    } else {
      setShowComplete(true);
      setTimeout(() => {
        onComplete(data);
      }, 2500);
    }
  };

  const prevStep = () => {
    if (currentStep > 0) {
      setCurrentStep(prev => prev - 1);
    }
  };

  const slideVariants = {
    enter: (direction: number) => ({
      x: direction > 0 ? 300 : -300,
      opacity: 0,
    }),
    center: {
      x: 0,
      opacity: 1,
    },
    exit: (direction: number) => ({
      x: direction < 0 ? 300 : -300,
      opacity: 0,
    }),
  };

  const steps = [
    <StepWelcome key="welcome" data={data} updateData={updateData} onNext={nextStep} />,
    <StepPhoto key="photo" data={data} updateData={updateData} onNext={nextStep} onPrev={prevStep} />,
    <StepAppearance key="appearance" data={data} updateData={updateData} onNext={nextStep} onPrev={prevStep} />,
    <StepIncome key="income" data={data} updateData={updateData} onNext={nextStep} onPrev={prevStep} />,
    <StepCards key="cards" data={data} updateData={updateData} onNext={nextStep} onPrev={prevStep} />,
    <StepPeople key="people" data={data} updateData={updateData} onNext={nextStep} onPrev={prevStep} />,
  ];

  if (showComplete) {
    return <StepComplete data={data} />;
  }

  return (
    <div className="fixed inset-0 bg-background z-50 flex flex-col">
      {/* Progress indicator */}
      <div className="pt-safe px-6 pt-8">
        <div className="flex gap-2">
          {Array.from({ length: totalSteps }).map((_, step) => (
            <motion.div
              key={step}
              className={`h-1 flex-1 rounded-full ${
                step <= currentStep ? 'bg-primary' : 'bg-muted'
              }`}
              initial={{ scaleX: 0 }}
              animate={{ scaleX: step <= currentStep ? 1 : 0.3 }}
              transition={{ duration: 0.3 }}
            />
          ))}
        </div>
      </div>

      {/* Step content */}
      <div className="flex-1 overflow-hidden relative">
        <AnimatePresence mode="wait" custom={1}>
          <motion.div
            key={currentStep}
            custom={1}
            variants={slideVariants}
            initial="enter"
            animate="center"
            exit="exit"
            transition={{
              x: { type: 'spring', stiffness: 300, damping: 30 },
              opacity: { duration: 0.2 },
            }}
            className="absolute inset-0"
          >
            {steps[currentStep]}
          </motion.div>
        </AnimatePresence>
      </div>
    </div>
  );
};
