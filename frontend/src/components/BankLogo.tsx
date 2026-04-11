import React, { useState } from 'react';
import { CreditCard, Building2 } from 'lucide-react';
import { getBankById } from '@/lib/banks';

interface BankLogoProps {
  bankId?: string | null;
  size?: number;
  className?: string;
  fallbackType?: 'credit' | 'debit' | 'bank';
}

const BankLogo: React.FC<BankLogoProps> = ({
  bankId,
  size = 32,
  className = '',
  fallbackType = 'credit',
}) => {
  const [imgError, setImgError] = useState(false);
  const bank = getBankById(bankId ?? undefined);

  if (bank) {
    // Se tem SVG local e ainda nao deu erro, mostra a imagem
    if (bank.logo && !imgError) {
      return (
        <div
          className={`flex items-center justify-center rounded-lg overflow-hidden bg-white ${className}`}
          style={{ width: size, height: size }}
          title={bank.name}
        >
          <img
            src={bank.logo}
            alt={bank.name}
            width={size * 0.75}
            height={size * 0.75}
            className="object-contain"
            onError={() => setImgError(true)}
          />
        </div>
      );
    }

    // Fallback: monograma estilizado com cor do banco
    const len = bank.icon.length;
    const fontSize = len <= 2 ? size * 0.46 : len === 3 ? size * 0.34 : size * 0.26;
    const radius = Math.max(6, size * 0.22);
    return (
      <div
        className={`relative flex items-center justify-center select-none overflow-hidden ${className}`}
        style={{
          width: size,
          height: size,
          borderRadius: radius,
          background: `linear-gradient(135deg, ${bank.color} 0%, ${bank.color} 55%, rgba(0,0,0,0.18) 100%)`,
          boxShadow: `inset 0 1px 0 rgba(255,255,255,0.22), inset 0 -1px 0 rgba(0,0,0,0.18), 0 1px 2px rgba(0,0,0,0.18)`,
        }}
        title={bank.name}
      >
        <span
          style={{
            color: bank.textColor,
            fontSize,
            fontWeight: 800,
            letterSpacing: len <= 2 ? '-0.04em' : '-0.02em',
            lineHeight: 1,
            textShadow: '0 1px 0 rgba(0,0,0,0.12)',
            fontFamily: '"SF Pro Display", "Inter", system-ui, sans-serif',
          }}
        >
          {bank.icon}
        </span>
        <span
          aria-hidden
          style={{
            position: 'absolute',
            inset: 0,
            borderRadius: radius,
            boxShadow: 'inset 0 0 0 1px rgba(255,255,255,0.08)',
            pointerEvents: 'none',
          }}
        />
      </div>
    );
  }

  // Sem banco selecionado
  const iconSize = size * 0.55;
  if (fallbackType === 'bank') {
    return <Building2 style={{ width: iconSize, height: iconSize }} className={className} />;
  }
  return <CreditCard style={{ width: iconSize, height: iconSize }} className={className} />;
};

export default BankLogo;
