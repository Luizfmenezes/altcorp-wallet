import React from 'react';
import {
  Utensils,
  Car,
  Home,
  Gamepad2,
  HeartPulse,
  GraduationCap,
  ShoppingBag,
  Wrench,
  FileText,
  Wallet,
  Laptop,
  TrendingUp,
  Gift,
} from 'lucide-react';

/* ─── Mapeamento categoria → ícone Lucide ─── */
const CATEGORY_ICON_MAP: Record<string, React.ElementType> = {
  // Despesas
  Alimentacao: Utensils,
  Transporte: Car,
  Moradia: Home,
  Lazer: Gamepad2,
  Saude: HeartPulse,
  Educacao: GraduationCap,
  Compras: ShoppingBag,
  Servicos: Wrench,
  Outros: FileText,
  // Receitas
  'Salário': Wallet,
  'Freelance': Laptop,
  'Investimentos': TrendingUp,
  'Presente': Gift,
};

/* ─── Mapeamento categoria → cor de fundo / ícone ─── */
const CATEGORY_COLOR_MAP: Record<string, { bg: string; text: string }> = {
  // Despesas
  Alimentacao: { bg: 'bg-orange-500/15', text: 'text-orange-500' },
  Transporte:  { bg: 'bg-blue-500/15',   text: 'text-blue-500'   },
  Moradia:     { bg: 'bg-yellow-500/15', text: 'text-yellow-500' },
  Lazer:       { bg: 'bg-purple-500/15', text: 'text-purple-500' },
  Saude:       { bg: 'bg-green-500/15',  text: 'text-green-500'  },
  Educacao:    { bg: 'bg-cyan-500/15',   text: 'text-cyan-500'   },
  Compras:     { bg: 'bg-amber-500/15',  text: 'text-amber-500'  },
  Servicos:    { bg: 'bg-indigo-500/15', text: 'text-indigo-500' },
  Outros:      { bg: 'bg-gray-500/15',   text: 'text-gray-400'   },
  // Receitas
  'Salário':       { bg: 'bg-emerald-500/15', text: 'text-emerald-500' },
  'Freelance':     { bg: 'bg-sky-500/15',     text: 'text-sky-500'     },
  'Investimentos': { bg: 'bg-teal-500/15',    text: 'text-teal-500'    },
  'Presente':      { bg: 'bg-pink-500/15',    text: 'text-pink-500'    },
};

interface CategoryIconProps {
  /** Chave da categoria (ex: "Alimentacao", "Transporte") */
  category: string;
  /** Tamanho do container quadrado em pixels (default 40) */
  size?: number;
  /** Tamanho do ícone interno em pixels (default 20) */
  iconSize?: number;
  className?: string;
}

const CategoryIcon: React.FC<CategoryIconProps> = ({
  category,
  size = 40,
  iconSize = 20,
  className = '',
}) => {
  // Suporta tanto chave pura ("Alimentacao") quanto label acentuado ("Alimentação")
  const normalizeKey = (cat: string) => {
    const map: Record<string, string> = {
      'Alimentação': 'Alimentacao',
      'Saúde': 'Saude',
      'Educação': 'Educacao',
      'Serviços': 'Servicos',
    };
    return map[cat] ?? cat;
  };

  const key = normalizeKey(category);
  const Icon = CATEGORY_ICON_MAP[key] ?? FileText;
  const colors = CATEGORY_COLOR_MAP[key] ?? CATEGORY_COLOR_MAP['Outros'];

  return (
    <div
      className={`rounded-xl flex items-center justify-center flex-shrink-0 ${colors.bg} ${className}`}
      style={{ width: size, height: size }}
    >
      <Icon style={{ width: iconSize, height: iconSize }} className={colors.text} />
    </div>
  );
};

export default CategoryIcon;

/** Retorna o ícone Lucide como componente (para uso inline fora do container) */
export const getCategoryIconComponent = (category: string): React.ElementType => {
  const map: Record<string, string> = {
    'Alimentação': 'Alimentacao',
    'Saúde': 'Saude',
    'Educação': 'Educacao',
    'Serviços': 'Servicos',
  };
  const key = map[category] ?? category;
  return CATEGORY_ICON_MAP[key] ?? FileText;
};

export { CATEGORY_COLOR_MAP, CATEGORY_ICON_MAP };
