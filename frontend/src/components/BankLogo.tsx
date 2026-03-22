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

    // Fallback: sigla com cor do banco
    const fontSize = bank.icon.length <= 2 ? size * 0.42 : size * 0.32;
    return (
      <div
        className={`flex items-center justify-center rounded-lg font-extrabold select-none ${className}`}
        style={{
          width: size,
          height: size,
          backgroundColor: bank.color,
          color: bank.textColor,
          fontSize,
          letterSpacing: '-0.02em',
          lineHeight: 1,
        }}
        title={bank.name}
      >
        {bank.icon}
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
