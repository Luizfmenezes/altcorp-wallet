import React, { useRef, useState } from 'react';
import { motion } from 'framer-motion';
import { Camera, ArrowLeft } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { OnboardingData } from '../OnboardingWizard';

interface StepPhotoProps {
  data: OnboardingData;
  updateData: (updates: Partial<OnboardingData>) => void;
  onNext: () => void;
  onPrev: () => void;
}

export const StepPhoto: React.FC<StepPhotoProps> = ({ data, updateData, onNext, onPrev }) => {
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [isProcessing, setIsProcessing] = useState(false);

  const handlePhotoClick = () => {
    fileInputRef.current?.click();
  };

  const handlePhotoChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    // Validate file type
    if (!file.type.startsWith('image/')) {
      return;
    }

    // Validate file size (max 2MB)
    if (file.size > 2 * 1024 * 1024) {
      return;
    }

    setIsProcessing(true);

    try {
      // Create a canvas to resize the image
      const img = new Image();
      const reader = new FileReader();

      reader.onload = (event) => {
        img.onload = () => {
          const canvas = document.createElement('canvas');
          const maxSize = 200;
          let { width, height } = img;

          if (width > height) {
            if (width > maxSize) {
              height *= maxSize / width;
              width = maxSize;
            }
          } else {
            if (height > maxSize) {
              width *= maxSize / height;
              height = maxSize;
            }
          }

          canvas.width = width;
          canvas.height = height;
          const ctx = canvas.getContext('2d');
          ctx?.drawImage(img, 0, 0, width, height);

          const base64 = canvas.toDataURL('image/jpeg', 0.8);
          updateData({ profilePhoto: base64 });
          setIsProcessing(false);
        };
        img.src = event.target?.result as string;
      };

      reader.readAsDataURL(file);
    } catch {
      setIsProcessing(false);
    }
  };

  const handleRemovePhoto = () => {
    updateData({ profilePhoto: undefined });
  };

  const getInitials = () => {
    const first = data.firstName?.[0] || '';
    const last = data.lastName?.[0] || '';
    return (first + last).toUpperCase() || 'U';
  };

  return (
    <div className="h-full flex flex-col px-6 py-8">
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.2 }}
        className="flex-1 flex flex-col"
      >
        {/* Back button */}
        <motion.button
          initial={{ opacity: 0, x: -20 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ delay: 0.1 }}
          onClick={onPrev}
          className="flex items-center gap-2 text-muted-foreground hover:text-foreground transition-colors mb-6 self-start"
        >
          <ArrowLeft className="w-4 h-4" />
          <span>Voltar</span>
        </motion.button>

        {/* Icon */}
        <motion.div
          initial={{ scale: 0 }}
          animate={{ scale: 1 }}
          transition={{ type: 'spring', delay: 0.3 }}
          className="w-16 h-16 rounded-2xl bg-primary/10 flex items-center justify-center mx-auto mb-6"
        >
          <Camera className="w-8 h-8 text-primary" />
        </motion.div>

        {/* Title */}
        <motion.h2
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.4 }}
          className="text-2xl font-bold text-center text-foreground mb-2"
        >
          Foto de Perfil
        </motion.h2>
        <motion.p
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.5 }}
          className="text-muted-foreground text-center mb-8"
        >
          Adicione uma foto para personalizar seu perfil (opcional)
        </motion.p>

        {/* Photo upload area */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.6 }}
          className="flex flex-col items-center space-y-4"
        >
          <input
            ref={fileInputRef}
            type="file"
            accept="image/*"
            onChange={handlePhotoChange}
            className="hidden"
          />

          <div 
            onClick={handlePhotoClick}
            className="relative cursor-pointer group"
          >
            <Avatar className="w-32 h-32 border-4 border-primary/20 group-hover:border-primary/40 transition-colors">
              {data.profilePhoto ? (
                <AvatarImage src={data.profilePhoto} alt="Profile" />
              ) : (
                <AvatarFallback className="bg-primary/10 text-primary text-3xl font-bold">
                  {getInitials()}
                </AvatarFallback>
              )}
            </Avatar>
            <div className="absolute inset-0 flex items-center justify-center bg-black/50 rounded-full opacity-0 group-hover:opacity-100 transition-opacity">
              <Camera className="w-8 h-8 text-white" />
            </div>
            {isProcessing && (
              <div className="absolute inset-0 flex items-center justify-center bg-black/50 rounded-full">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-white"></div>
              </div>
            )}
          </div>

          <p className="text-sm text-muted-foreground">
            Clique para {data.profilePhoto ? 'alterar' : 'adicionar'} foto
          </p>

          {data.profilePhoto && (
            <Button
              variant="ghost"
              size="sm"
              onClick={handleRemovePhoto}
              className="text-destructive hover:text-destructive"
            >
              Remover foto
            </Button>
          )}
        </motion.div>

        {/* Spacer */}
        <div className="flex-1" />

        {/* Buttons */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.7 }}
          className="space-y-3"
        >
          <Button
            onClick={onNext}
            className="w-full h-14 text-lg font-semibold rounded-2xl"
          >
            {data.profilePhoto ? 'Continuar' : 'Pular'}
          </Button>
        </motion.div>
      </motion.div>
    </div>
  );
};
