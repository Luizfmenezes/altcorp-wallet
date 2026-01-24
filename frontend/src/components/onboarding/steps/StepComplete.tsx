import React, { useEffect, useState } from 'react';
import { motion } from 'framer-motion';
import { CheckCircle2, Sparkles } from 'lucide-react';
import { OnboardingData } from '../OnboardingWizard';

interface StepCompleteProps {
  data: OnboardingData;
}

// Simple confetti component
const Confetti: React.FC = () => {
  const [particles] = useState(() =>
    Array.from({ length: 50 }, (_, i) => ({
      id: i,
      x: Math.random() * 100,
      delay: Math.random() * 0.5,
      duration: 2 + Math.random() * 2,
      color: ['#8B5CF6', '#3B82F6', '#10B981', '#F59E0B', '#EF4444'][
        Math.floor(Math.random() * 5)
      ],
    }))
  );

  return (
    <div className="fixed inset-0 pointer-events-none overflow-hidden z-50">
      {particles.map((particle) => (
        <motion.div
          key={particle.id}
          initial={{
            x: `${particle.x}vw`,
            y: -20,
            opacity: 1,
            scale: 1,
            rotate: 0,
          }}
          animate={{
            y: '110vh',
            opacity: [1, 1, 0],
            rotate: 360 * (Math.random() > 0.5 ? 1 : -1),
          }}
          transition={{
            duration: particle.duration,
            delay: particle.delay,
            ease: 'linear',
          }}
          className="absolute w-3 h-3 rounded-sm"
          style={{ backgroundColor: particle.color }}
        />
      ))}
    </div>
  );
};

export const StepComplete: React.FC<StepCompleteProps> = ({ data }) => {
  const [showConfetti, setShowConfetti] = useState(true);

  useEffect(() => {
    const timer = setTimeout(() => setShowConfetti(false), 3000);
    return () => clearTimeout(timer);
  }, []);

  return (
    <div className="fixed inset-0 bg-background z-50 flex items-center justify-center px-6">
      {showConfetti && <Confetti />}

      <motion.div
        initial={{ scale: 0.8, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        transition={{ type: 'spring', duration: 0.6 }}
        className="text-center"
      >
        {/* Success icon */}
        <motion.div
          initial={{ scale: 0 }}
          animate={{ scale: 1 }}
          transition={{ type: 'spring', delay: 0.2, stiffness: 200 }}
          className="relative inline-flex mb-8"
        >
          <div className="w-24 h-24 rounded-full bg-success/10 flex items-center justify-center">
            <CheckCircle2 className="w-14 h-14 text-success" />
          </div>
          <motion.div
            initial={{ scale: 0, rotate: -45 }}
            animate={{ scale: 1, rotate: 0 }}
            transition={{ delay: 0.5 }}
            className="absolute -top-2 -right-2"
          >
            <Sparkles className="w-8 h-8 text-warning" />
          </motion.div>
        </motion.div>

        {/* Title */}
        <motion.h1
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.3 }}
          className="text-3xl font-bold text-foreground mb-3"
        >
          Tudo Pronto!
        </motion.h1>

        {/* Subtitle */}
        <motion.p
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.4 }}
          className="text-lg text-muted-foreground mb-2"
        >
          Bem-vindo, {data.firstName}!
        </motion.p>

        <motion.p
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.5 }}
          className="text-sm text-muted-foreground"
        >
          Preparando seu painel...
        </motion.p>

        {/* Loading indicator */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.6 }}
          className="mt-8"
        >
          <div className="w-8 h-8 mx-auto border-2 border-primary border-t-transparent rounded-full animate-spin" />
        </motion.div>
      </motion.div>
    </div>
  );
};
