import React, { useState, useMemo, useCallback } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import {
  ArrowLeft, Pencil, Trash2, CreditCard, CalendarDays, Info,
  Search, Check, ChevronLeft, ChevronRight,
  Plus, DollarSign, Upload, FileText, Users,
} from 'lucide-react';
import { BottomNav } from '@/components/BottomNav';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import { useFinance, Card, InvoiceItem } from '@/contexts/FinanceContext';
import { useToast } from '@/hooks/use-toast';
import { BRAZILIAN_BANKS, getBankById } from '@/lib/banks';
import BankLogo from '@/components/BankLogo';
import PDFExportDialog from '@/components/PDFExportDialog';
import InvoiceImportDialog from '@/components/InvoiceImportDialog';

/* ─── Cores ─── */
const CARD_COLORS = [
  { name: 'Roxo', value: '#8B5CF6' },
  { name: 'Azul', value: '#3B82F6' },
  { name: 'Verde', value: '#22C55E' },
  { name: 'Laranja', value: '#F97316' },
  { name: 'Rosa', value: '#EC4899' },
  { name: 'Cinza', value: '#6B7280' },
  { name: 'Vermelho', value: '#EF4444' },
  { name: 'Amarelo', value: '#EAB308' },
  { name: 'Preto', value: '#1F2937' },
];

const CATEGORIES = [
  'Alimentacao', 'Transporte', 'Moradia', 'Lazer',
  'Saude', 'Educacao', 'Compras', 'Servicos', 'Outros',
];

const CATEGORY_LABELS: Record<string, string> = {
  Alimentacao: 'Alimentação',
  Transporte: 'Transporte',
  Moradia: 'Moradia',
  Lazer: 'Lazer',
  Saude: 'Saúde',
  Educacao: 'Educação',
  Compras: 'Compras',
  Servicos: 'Serviços',
  Outros: 'Outros',
};

const CATEGORY_CHIP_COLORS: Record<string, string> = {
  Alimentacao: 'bg-orange-500/20 text-orange-400',
  Transporte: 'bg-blue-500/20 text-blue-400',
  Moradia: 'bg-yellow-500/20 text-yellow-400',
  Lazer: 'bg-purple-500/20 text-purple-400',
  Saude: 'bg-green-500/20 text-green-400',
  Educacao: 'bg-cyan-500/20 text-cyan-400',
  Compras: 'bg-amber-500/20 text-amber-400',
  Servicos: 'bg-indigo-500/20 text-indigo-400',
  Outros: 'bg-gray-500/20 text-gray-400',
};

const OWNER_COLORS = [
  'bg-red-500/20 text-red-400',
  'bg-amber-500/20 text-amber-400',
  'bg-green-500/20 text-green-400',
  'bg-blue-500/20 text-blue-400',
  'bg-purple-500/20 text-purple-400',
  'bg-pink-500/20 text-pink-400',
];

const MONTH_NAMES = [
  'Janeiro', 'Fevereiro', 'Março', 'Abril', 'Maio', 'Junho',
  'Julho', 'Agosto', 'Setembro', 'Outubro', 'Novembro', 'Dezembro',
];

/* ─── Format currency ─── */
const formatCurrency = (amount: number) =>
  new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(amount);

/* ─── Invoice period helper ─── */
const getInvoicePeriod = (closingDay: number, month: number, year: number) => {
  const startDay = closingDay + 1;
  let startMonth = month - 1;
  let startYear = year;
  if (startMonth < 0) { startMonth = 11; startYear -= 1; }
  const startDate = new Date(startYear, startMonth, startDay);
  const endDate = new Date(year, month, closingDay);

  const fmtDate = (d: Date) =>
    `${String(d.getDate()).padStart(2, '0')}/${String(d.getMonth() + 1).padStart(2, '0')}`;

  return { start: fmtDate(startDate), end: fmtDate(endDate) };
};

/* ─── InvoicePreview ─── */
const InvoicePreview: React.FC<{
  closingDay: number;
  dueDay?: number;
  month: number;
  year: number;
}> = ({ closingDay, dueDay, month, year }) => {
  const period = useMemo(
    () => getInvoicePeriod(closingDay, month, year),
    [closingDay, month, year],
  );
  return (
    <div className="rounded-xl border border-primary/20 bg-primary/5 p-3 space-y-2">
      <div className="flex items-center gap-2 text-primary">
        <CalendarDays className="w-4 h-4 flex-shrink-0" />
        <span className="text-sm font-semibold">
          Ciclo da fatura de {MONTH_NAMES[month]}
        </span>
      </div>
      <div className="flex items-center gap-1">
        <div className="flex flex-col items-center">
          <div className="w-2.5 h-2.5 rounded-full bg-green-500" />
          <div className="text-[10px] text-muted-foreground mt-1 text-center leading-tight">
            Início<br />{period.start}
          </div>
        </div>
        <div className="flex-1 h-px bg-border mx-1 relative top-[-6px]" />
        <div className="flex flex-col items-center">
          <div className="w-2.5 h-2.5 rounded-full bg-red-500" />
          <div className="text-[10px] text-muted-foreground mt-1 text-center leading-tight">
            Fechamento<br />{period.end}
          </div>
        </div>
        {typeof dueDay === 'number' && (
          <>
            <div className="flex-1 h-px bg-border mx-1 relative top-[-6px]" />
            <div className="flex flex-col items-center">
              <div className="w-2.5 h-2.5 rounded-full bg-blue-500" />
              <div className="text-[10px] text-muted-foreground mt-1 text-center leading-tight">
                Vencimento<br />dia {dueDay}
              </div>
            </div>
          </>
        )}
      </div>
      <div className="flex gap-2 text-xs text-muted-foreground bg-background/60 rounded-lg p-2">
        <Info className="w-3.5 h-3.5 flex-shrink-0 mt-0.5 text-primary" />
        <span>
          Compras de <strong>{period.start}</strong> até <strong>{period.end}</strong> — fatura de{' '}
          <strong>{MONTH_NAMES[month]}/{year}</strong>.
          {typeof dueDay === 'number' && <> Vence dia <strong>{dueDay}</strong>.</>}
        </span>
      </div>
    </div>
  );
};

/* ─── BankSelectorMini ─── */
const BankSelectorMini: React.FC<{
  value: string;
  onChange: (id: string) => void;
}> = ({ value, onChange }) => {
  const [search, setSearch] = useState('');
  const filtered = BRAZILIAN_BANKS.filter(b =>
    b.name.toLowerCase().includes(search.toLowerCase()),
  );
  return (
    <div className="space-y-2">
      <p className="text-sm font-medium text-foreground">Banco</p>
      <div className="relative">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-muted-foreground" />
        <Input
          placeholder="Buscar banco..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          className="pl-8 h-9 text-sm rounded-lg"
        />
      </div>
      <div className="grid grid-cols-4 gap-2 max-h-40 overflow-y-auto pr-1">
        {filtered.map((bank) => (
          <button
            key={bank.id}
            type="button"
            onClick={() => onChange(bank.id)}
            className={`flex flex-col items-center gap-1 p-2 rounded-xl border transition-all ${
              value === bank.id
                ? 'border-primary bg-primary/10 ring-1 ring-primary'
                : 'border-border hover:border-primary/40'
            }`}
          >
            <BankLogo bankId={bank.id} size={28} />
            <span className="text-[10px] text-foreground text-center leading-tight truncate w-full">
              {bank.shortName}
            </span>
          </button>
        ))}
      </div>
    </div>
  );
};

/* ─── Types ─── */
type EditCardForm = {
  name: string;
  type: Card['type'];
  color: string;
  icon: string;
  closingDay: string;
  dueDay: string;
  creditLimit: string;
};

type EditItemForm = {
  description: string;
  amount: string;
  date: string;
  category: string;
  owner: string;
  installments: string;
  splitBetween: string[];
};

/* ═══════════════════════════════════════════
   MAIN: CardDetail
   ═══════════════════════════════════════════ */
const CardDetail: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const {
    cards, people, updateCard, removeCard,
    addInvoiceItem, updateInvoiceItem, removeInvoiceItem, toggleInvoicePaid,
  } = useFinance();
  const { toast } = useToast();

  // BLINDAGEM EXTRA CONTRA ERROS DE MAP
  const safePeople = Array.isArray(people) && people.length > 0 ? people : ['Eu'];

  const card = cards.find(c => c.id === id);

  /* ─── Mes visualizado ─── */
  const now = new Date();
  const [viewMonth, setViewMonth] = useState(now.getMonth());
  const [viewYear, setViewYear] = useState(now.getFullYear());

  const prevMonth = useCallback(() => {
    setViewMonth(m => {
      if (m === 0) { setViewYear(y => y - 1); return 11; }
      return m - 1;
    });
  }, []);

  const nextMonth = useCallback(() => {
    setViewMonth(m => {
      if (m === 11) { setViewYear(y => y + 1); return 0; }
      return m + 1;
    });
  }, []);

  /* ─── Edit card ─── */
  const [editCardOpen, setEditCardOpen] = useState(false);
  const [editCardForm, setEditCardForm] = useState<EditCardForm>({
    name: '', type: 'credit', color: CARD_COLORS[0].value,
    icon: '', closingDay: '', dueDay: '', creditLimit: '',
  });

  /* ─── Delete card ─── */
  const [deleteCardOpen, setDeleteCardOpen] = useState(false);

  /* ─── Item dialog ─── */
  const [itemDialogOpen, setItemDialogOpen] = useState(false);
  const [editingItem, setEditingItem] = useState<InvoiceItem | null>(null);
  const [itemForm, setItemForm] = useState<EditItemForm>({
    description: '', amount: '', date: '', category: 'Outros', owner: '', installments: '1', splitBetween: [],
  });
  const [importDialogOpen, setImportDialogOpen] = useState(false);
  const [exportDialogOpen, setExportDialogOpen] = useState(false);

  /* ─── Delete item ─── */
  const [deleteItemTarget, setDeleteItemTarget] = useState<InvoiceItem | null>(null);

  /* ─── Itens do mes selecionado ─── */
  const monthItems = useMemo(() => {
    if (!card) return [];
    return card.invoiceItems.filter(item => {
      const [iYear, iMonthStr] = item.date.split('-');
      return (
        Number.parseInt(iMonthStr, 10) - 1 === viewMonth &&
        Number.parseInt(iYear, 10) === viewYear
      );
    });
  }, [card, viewMonth, viewYear]);

  const monthTotal = monthItems.reduce((s, i) => s + i.amount, 0);

  const monthOwnerTotals = useMemo(() => {
    return monthItems.reduce<Record<string, number>>((acc, item) => {
      const owner = item.owner || 'Sem titular';
      acc[owner] = (acc[owner] ?? 0) + item.amount;
      return acc;
    }, {});
  }, [monthItems]);

  const isInvoicePaid = useMemo(() => {
    if (!card) return false;
    return (card.paidInvoices ?? []).some(
      p => p.month === viewMonth && p.year === viewYear,
    );
  }, [card, viewMonth, viewYear]);

  const bankInfo = getBankById(card?.icon ?? undefined);

  /* ─── Open edit card ─── */
  const openEditCard = useCallback(() => {
    if (!card) return;
    setEditCardForm({
      name: card.name,
      type: card.type,
      color: card.color,
      icon: card.icon ?? '',
      closingDay: card.closingDay ? String(card.closingDay) : '',
      dueDay: card.dueDay ? String(card.dueDay) : '',
      creditLimit: card.creditLimit ? card.creditLimit.toLocaleString('pt-BR') : '',
    });
    setEditCardOpen(true);
  }, [card]);

  /* ─── Save edit card ─── */
  const handleSaveCard = async () => {
    if (!card) return;
    if (!editCardForm.name.trim()) {
      toast({ title: 'Erro', description: 'Informe o nome.', variant: 'destructive' });
      return;
    }
    const parseDay = (v: string) => {
      const n = Number.parseInt(v, 10);
      return n >= 1 && n <= 31 ? n : undefined;
    };
    const rawLimit = editCardForm.creditLimit.replaceAll(/\D/g, '');
    const limitNum = Number.parseInt(rawLimit, 10) || 0;
    await updateCard(card.id, {
      name: editCardForm.name.trim(),
      type: editCardForm.type,
      color: editCardForm.color,
      icon: editCardForm.icon || null,
      closingDay: parseDay(editCardForm.closingDay),
      dueDay: parseDay(editCardForm.dueDay),
      creditLimit: limitNum > 0 ? limitNum : null,
    });
    toast({ title: 'Sucesso', description: 'Cartão atualizado!' });
    setEditCardOpen(false);
  };

  /* ─── Delete card ─── */
  const handleDeleteCard = async () => {
    if (!card) return;
    await removeCard(card.id);
    toast({ title: 'Removido', description: 'Cartão excluído.' });
    navigate('/wallet');
  };

  /* ─── Open add item ─── */
  const openAddItem = useCallback(() => {
    setEditingItem(null);
    const today = new Date();
    const dd = String(today.getDate()).padStart(2, '0');
    const mm = String(viewMonth + 1).padStart(2, '0');
    setItemForm({
      description: '',
      amount: '',
      date: `${viewYear}-${mm}-${dd}`,
      category: 'Outros',
      owner: safePeople[0] ?? '',
      installments: '1',
      splitBetween: safePeople[0] ? [safePeople[0]] : [],
    });
    setItemDialogOpen(true);
  }, [viewMonth, viewYear, safePeople]);

  /* ─── Open edit item ─── */
  const openEditItem = useCallback((item: InvoiceItem) => {
    const fallbackOwner = safePeople[0] ?? '';
    const splitBetween = item.owner ? [item.owner] : [];
    if (!item.owner && fallbackOwner) {
      splitBetween.push(fallbackOwner);
    }
    setEditingItem(item);
    setItemForm({
      description: item.description,
      amount: item.amount.toFixed(2).replace('.', ','),
      date: item.date,
      category: item.category ?? 'Outros',
      owner: item.owner ?? fallbackOwner,
      installments: '1',
      splitBetween,
    });
    setItemDialogOpen(true);
  }, [safePeople]);

  const toggleSplitPerson = (person: string) => {
    setItemForm(prev => {
      const exists = prev.splitBetween.includes(person);
      let next = exists
        ? prev.splitBetween.filter(p => p !== person)
        : [...prev.splitBetween, person];

      if (next.length === 0) {
        next = [person];
      }

      return {
        ...prev,
        splitBetween: next,
        owner: next[0] ?? prev.owner,
      };
    });
  };

  const parsedAmount = Number.parseFloat(itemForm.amount.replaceAll(',', '.').replaceAll(/[^\d.]/g, '')) || 0;
  const parsedInstallments = Math.max(1, Number.parseInt(itemForm.installments || '1', 10) || 1);
  const splitCount = Math.max(1, itemForm.splitBetween.length || 1);
  const installmentPreview = parsedAmount > 0 ? parsedAmount / parsedInstallments : 0;
  const perPersonPreview = installmentPreview > 0 ? installmentPreview / splitCount : 0;

  /* ─── Save item ─── */
  const handleSaveItem = async () => {
    if (!card) return;
    const desc = itemForm.description.trim();
    if (!desc) {
      toast({ title: 'Erro', description: 'Informe a descrição.', variant: 'destructive' });
      return;
    }
    const amtNum = Number.parseFloat(itemForm.amount.replaceAll(',', '.').replaceAll(/[^\d.]/g, ''));
    if (!amtNum || amtNum <= 0) {
      toast({ title: 'Erro', description: 'Informe um valor válido.', variant: 'destructive' });
      return;
    }

    const installments = Math.max(1, Number.parseInt(itemForm.installments || '1', 10) || 1);
    if (installments > 60) {
      toast({ title: 'Erro', description: 'Número de parcelas deve ser no máximo 60.', variant: 'destructive' });
      return;
    }

    const fallbackOwner = itemForm.owner || (safePeople[0] ?? 'Eu');
    let selectedPeople = itemForm.splitBetween.length > 0 ? itemForm.splitBetween : [fallbackOwner];
    if (editingItem) {
      selectedPeople = [fallbackOwner];
    }

    const payload = {
      description: desc,
      amount: amtNum,
      date: itemForm.date,
      category: itemForm.category,
      owner: selectedPeople[0] || (safePeople[0] ?? 'Eu'),
    };
    if (editingItem) {
      await updateInvoiceItem(card.id, editingItem.id, payload);
      toast({ title: 'Atualizado', description: 'Item atualizado.' });
    } else {
      await addInvoiceItem(card.id, payload, installments, selectedPeople);
      if (installments > 1 || selectedPeople.length > 1) {
        toast({
          title: 'Lançamento criado',
          description: `Compra distribuída em ${installments}x e ${selectedPeople.length} pessoa(s).`,
        });
      } else {
        toast({ title: 'Adicionado', description: 'Item adicionado.' });
      }
    }
    setItemDialogOpen(false);
  };

  /* ─── Delete item ─── */
  const handleDeleteItem = async () => {
    if (!card || !deleteItemTarget) return;
    await removeInvoiceItem(card.id, deleteItemTarget.id);
    toast({ title: 'Removido', description: 'Item excluído.' });
    setDeleteItemTarget(null);
  };

  /* ─── Toggle paid ─── */
  const handleTogglePaid = async () => {
    if (!card) return;
    await toggleInvoicePaid(card.id, viewMonth, viewYear);
  };

  const handleImportItems = async (items: Omit<InvoiceItem, 'id'>[]) => {
    if (!card) return;
    await Promise.all(
      items.map((item) => addInvoiceItem(card.id, item)),
    );
    toast({
      title: 'Importação concluída',
      description: `${items.length} lançamento(s) adicionados na fatura de ${MONTH_NAMES[viewMonth]}.`,
    });
  };

  /* ─── Edit card preview helpers ─── */
  const editClosingNum = Number.parseInt(editCardForm.closingDay, 10);
  const editDueNum = Number.parseInt(editCardForm.dueDay, 10);
  const showEditPreview = editCardForm.type === 'credit' && editClosingNum >= 1 && editClosingNum <= 31;

  /* ─── Not found ─── */
  if (!card) {
    return (
      <div className="min-h-screen bg-background flex flex-col items-center justify-center pb-24 lg:pb-8">
        <CreditCard className="w-16 h-16 text-muted-foreground mb-4" />
        <p className="text-muted-foreground mb-4">Cartão não encontrado.</p>
        <Button onClick={() => navigate('/wallet')}>Voltar</Button>
        <BottomNav />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background pb-24 lg:pb-8">

      {/* ═══ HEADER ═══ */}
      <header
        className="text-white px-5 pt-5 pb-6 rounded-b-[2rem] relative z-10"
        style={{ backgroundColor: card.color }}
      >
        <div className="max-w-4xl mx-auto">
          {/* Topo: voltar + nome + acoes */}
          <div className="flex items-center gap-3 mb-5">
            <Button
              variant="ghost" size="icon"
              className="text-white/80 hover:text-white rounded-full w-9 h-9 flex-shrink-0"
              onClick={() => navigate('/wallet')}
            >
              <ArrowLeft className="w-5 h-5" />
            </Button>
            <div className="flex-1 min-w-0">
              <h1 className="text-xl font-bold leading-tight truncate">
                {bankInfo ? bankInfo.name : card.name}
              </h1>
              <p className="text-white/70 text-sm mt-0.5">
                {card.closingDay ? `Fecha dia ${card.closingDay}` : ''}
                {card.closingDay && card.dueDay ? ' \u2022 ' : ''}
                {card.dueDay ? `Vence dia ${card.dueDay}` : ''}
              </p>
            </div>
            <div className="flex gap-1 flex-shrink-0">
              <Button
                variant="ghost" size="icon"
                className="text-white/80 hover:text-white rounded-full w-9 h-9"
                onClick={openEditCard}
              >
                <Pencil className="w-4 h-4" />
              </Button>
              <Button
                variant="ghost" size="icon"
                className="text-white/80 hover:text-white rounded-full w-9 h-9"
                onClick={() => setDeleteCardOpen(true)}
              >
                <Trash2 className="w-4 h-4" />
              </Button>
              <Button
                variant="ghost" size="icon"
                className="text-white/80 hover:text-white rounded-full w-9 h-9"
                onClick={() => navigate('/wallet')}
              >
                <CreditCard className="w-4 h-4" />
              </Button>
            </div>
          </div>

          {/* Card interno: total da fatura + marcar paga */}
          {card.type === 'credit' && (
            <div className="bg-white/15 backdrop-blur-sm rounded-2xl p-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-white/70 text-sm">
                    Total da Fatura - {MONTH_NAMES[viewMonth]}
                  </p>
                  <p className="text-3xl font-bold mt-1 leading-tight">
                    {formatCurrency(monthTotal)}
                  </p>
                </div>
                {monthItems.length > 0 && (
                  <button
                    type="button"
                    onClick={handleTogglePaid}
                    className={`px-4 py-2 rounded-xl text-sm font-semibold transition-all ${
                      isInvoicePaid
                        ? 'bg-green-400/30 text-green-100 hover:bg-green-400/40'
                        : 'bg-white/20 text-white hover:bg-white/30'
                    }`}
                  >
                    {isInvoicePaid ? 'Paga' : 'Marcar como Paga'}
                  </button>
                )}
              </div>
            </div>
          )}
        </div>
      </header>

      {/* ═══ BODY ═══ */}
      <div className="px-4 md:px-6 max-w-4xl mx-auto space-y-4 mt-4">

        {/* ─── Seletor de mes ─── */}
        <div className="card-finance flex items-center rounded-2xl overflow-hidden">
          <button
            type="button"
            onClick={prevMonth}
            className="flex items-center justify-center w-16 h-16 rounded-full bg-muted/80 text-foreground hover:bg-muted transition-colors flex-shrink-0"
          >
            <ChevronLeft className="w-5 h-5" />
          </button>

          <div className="flex-1 flex items-baseline justify-center gap-2 px-2">
            <span className="text-muted-foreground text-sm">Fatura de</span>
            <span className="font-bold text-xl text-foreground">
              {MONTH_NAMES[viewMonth]} {viewYear}
            </span>
          </div>

          <button
            type="button"
            onClick={nextMonth}
            className="flex items-center justify-center w-16 h-16 rounded-full bg-muted/80 text-foreground hover:bg-muted transition-colors flex-shrink-0"
          >
            <ChevronRight className="w-5 h-5" />
          </button>
        </div>

        {/* ─── Gastos por Titular ─── */}
        {monthItems.length > 0 && (
          <div className="card-finance">
            <div className="flex items-center gap-2 mb-3">
              <Users className="w-5 h-5 text-muted-foreground" />
              <h2 className="font-semibold text-foreground">Gastos por Titular</h2>
            </div>
            <div className="flex flex-wrap gap-2">
              {(() => {
                const ownerTotals: Record<string, number> = {};
                for (const item of monthItems) {
                  const owner = item.owner || 'Sem titular';
                  ownerTotals[owner] = (ownerTotals[owner] ?? 0) + item.amount;
                }
                return Object.entries(ownerTotals).map(([owner, total]) => (
                  <div
                    key={owner}
                    className="flex items-center gap-1.5 bg-muted/60 rounded-full px-3 py-1.5"
                  >
                    <span className="text-sm text-muted-foreground">{owner}:</span>
                    <span className="text-sm font-bold text-destructive">{formatCurrency(total)}</span>
                  </div>
                ));
              })()}
            </div>
          </div>
        )}

        {/* ─── Botoes de acao: Adicionar, Importar, Exportar ─── */}
        <div className="flex gap-2">
          <Button
            onClick={openAddItem}
            className="flex-1 h-11 rounded-xl gap-2 bg-blue-600 hover:bg-blue-700 text-white"
          >
            <Plus className="w-4 h-4" />
            <span className="text-sm font-semibold">Adicionar</span>
          </Button>
          <Button
            variant="outline"
            className="flex-1 h-11 rounded-xl gap-2"
            onClick={() => setImportDialogOpen(true)}
          >
            <Upload className="w-4 h-4" />
            <span className="text-sm">Importar</span>
          </Button>
          <Button
            variant="outline"
            className="flex-1 h-11 rounded-xl gap-2"
            onClick={() => setExportDialogOpen(true)}
          >
            <FileText className="w-4 h-4" />
            <span className="text-sm">Exportar</span>
          </Button>
        </div>

        {/* ─── Lista da Fatura ─── */}
        <div className="card-finance">
          <h2 className="font-semibold text-lg text-foreground mb-3">Fatura</h2>

          {monthItems.length === 0 ? (
            <div className="py-8 text-center">
              <DollarSign className="w-10 h-10 text-muted-foreground/40 mx-auto mb-2" />
              <p className="text-sm text-muted-foreground">
                Nenhum lançamento em {MONTH_NAMES[viewMonth]}.
              </p>
            </div>
          ) : (
            <div className="space-y-3">
              {monthItems.map((item) => {
                const dateParts = item.date.split('-');
                const fmtDate = `${dateParts[2]}/${dateParts[1]}/${dateParts[0]}`;
                const catLabel = CATEGORY_LABELS[item.category ?? ''] ?? item.category ?? '';
                const catChip = CATEGORY_CHIP_COLORS[item.category ?? ''] ?? 'bg-gray-500/20 text-gray-400';
                const hasInstallmentData =
                  typeof item.installmentInfo?.currentInstallment === 'number' &&
                  typeof item.installmentInfo?.totalInstallments === 'number';
                const installment = hasInstallmentData
                  ? ` (${item.installmentInfo.currentInstallment}/${item.installmentInfo.totalInstallments})`
                  : '';
                const showInstallmentSuffix = installment && !item.description.includes(installment);
                const ownerIdx = safePeople.indexOf(item.owner ?? '');
                const ownerChip = OWNER_COLORS[ownerIdx >= 0 ? ownerIdx % OWNER_COLORS.length : 0];

                return (
                  <div
                    key={item.id}
                    className="rounded-xl border border-border bg-card p-3 space-y-2"
                  >
                    {/* Linha 1: nome + valor + acoes */}
                    <div className="flex items-start justify-between gap-2">
                      <div className="min-w-0 flex-1">
                        <p className="text-base font-bold text-foreground truncate">
                          {item.description}{showInstallmentSuffix ? installment : ''}
                        </p>
                        <div className="flex items-center gap-1 mt-1 flex-wrap">
                          <span className="text-xs text-muted-foreground">{fmtDate}</span>
                          {catLabel && (
                            <>
                              <span className="text-xs text-muted-foreground">&bull;</span>
                              <span className={`text-xs font-medium px-2 py-0.5 rounded-md ${catChip}`}>
                                {catLabel}
                              </span>
                            </>
                          )}
                        </div>
                      </div>
                      <div className="flex items-center gap-1.5 flex-shrink-0">
                        <span className="text-base font-bold text-destructive">
                          {formatCurrency(item.amount)}
                        </span>
                        <button
                          type="button"
                          onClick={() => openEditItem(item)}
                          className="w-8 h-8 flex items-center justify-center rounded-lg text-muted-foreground hover:text-primary hover:bg-muted/50 transition-colors"
                        >
                          <Pencil className="w-4 h-4" />
                        </button>
                        <button
                          type="button"
                          onClick={() => setDeleteItemTarget(item)}
                          className="w-8 h-8 flex items-center justify-center rounded-lg text-muted-foreground hover:text-destructive hover:bg-muted/50 transition-colors"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </div>
                    </div>

                    {/* Linha 2: owner */}
                    {item.owner && (
                      <div className="flex items-center gap-1">
                        <span className={`text-xs font-medium px-2 py-0.5 rounded-md ${ownerChip}`}>
                          {item.owner}
                        </span>
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          )}
        </div>
      </div>

      {/* ═══ DIALOG: Editar cartao ═══ */}
      <Dialog open={editCardOpen} onOpenChange={setEditCardOpen}>
        <DialogContent className="max-w-md max-h-[85vh] overflow-y-auto">
          <DialogHeader><DialogTitle>Editar cartão</DialogTitle></DialogHeader>
          <div className="space-y-4 py-2">
            <BankSelectorMini
              value={editCardForm.icon}
              onChange={(bankId) => {
                const b = getBankById(bankId);
                setEditCardForm(prev => ({ ...prev, icon: bankId, color: b?.color ?? prev.color }));
              }}
            />
            <Input
              placeholder="Nome do cartão"
              value={editCardForm.name}
              onChange={(e) => setEditCardForm(p => ({ ...p, name: e.target.value }))}
              className="input-finance"
            />
            <Select
              value={editCardForm.type}
              onValueChange={(v: Card['type']) => setEditCardForm(p => ({ ...p, type: v }))}
            >
              <SelectTrigger className="input-finance"><SelectValue placeholder="Tipo" /></SelectTrigger>
              <SelectContent>
                <SelectItem value="credit">Crédito</SelectItem>
                <SelectItem value="debit">Débito</SelectItem>
                <SelectItem value="bank">Conta Bancária</SelectItem>
              </SelectContent>
            </Select>
            {editCardForm.type === 'credit' && (
              <div className="space-y-3">
                <div>
                  <p className="text-sm font-medium text-foreground mb-1">Dia de fechamento</p>
                  <Input
                    type="number" min={1} max={31} placeholder="Ex: 6"
                    value={editCardForm.closingDay}
                    onChange={(e) => setEditCardForm(p => ({ ...p, closingDay: e.target.value }))}
                    className="input-finance"
                  />
                </div>
                <div>
                  <p className="text-sm font-medium text-foreground mb-1">Dia de vencimento</p>
                  <Input
                    type="number" min={1} max={31} placeholder="Ex: 15"
                    value={editCardForm.dueDay}
                    onChange={(e) => setEditCardForm(p => ({ ...p, dueDay: e.target.value }))}
                    className="input-finance"
                  />
                </div>
                {showEditPreview && (
                  <InvoicePreview
                    closingDay={editClosingNum}
                    dueDay={editDueNum >= 1 && editDueNum <= 31 ? editDueNum : undefined}
                    month={viewMonth}
                    year={viewYear}
                  />
                )}
                <div>
                  <p className="text-sm font-medium text-foreground mb-1">Limite (R$)</p>
                  <Input
                    placeholder="Ex: 5000" inputMode="numeric"
                    value={editCardForm.creditLimit}
                    onChange={(e) => {
                      const raw = e.target.value.replaceAll(/\D/g, '');
                      const num = Number.parseInt(raw, 10) || 0;
                      setEditCardForm(p => ({ ...p, creditLimit: num > 0 ? num.toLocaleString('pt-BR') : '' }));
                    }}
                    className="input-finance"
                  />
                </div>
              </div>
            )}
            <div>
              <p className="text-sm text-muted-foreground mb-2">Cor do cartão</p>
              <div className="flex gap-2 flex-wrap">
                {CARD_COLORS.map((c) => (
                  <button
                    key={c.value} type="button"
                    onClick={() => setEditCardForm(p => ({ ...p, color: c.value }))}
                    className={`w-8 h-8 rounded-xl transition-transform ${
                      editCardForm.color === c.value ? 'scale-110 ring-2 ring-foreground' : ''
                    }`}
                    style={{ backgroundColor: c.value }}
                  />
                ))}
              </div>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setEditCardOpen(false)}>Cancelar</Button>
            <Button onClick={handleSaveCard}><Check className="w-4 h-4 mr-1" /> Salvar</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* ═══ DIALOG: Excluir cartao ═══ */}
      <Dialog open={deleteCardOpen} onOpenChange={setDeleteCardOpen}>
        <DialogContent className="max-w-sm">
          <DialogHeader><DialogTitle>Excluir cartão?</DialogTitle></DialogHeader>
          <p className="text-sm text-muted-foreground">
            O cartão <strong>{card.name}</strong> e todos os seus itens serão removidos permanentemente.
          </p>
          <DialogFooter>
            <Button variant="outline" onClick={() => setDeleteCardOpen(false)}>Cancelar</Button>
            <Button variant="destructive" onClick={handleDeleteCard}>
              <Trash2 className="w-4 h-4 mr-1" /> Excluir
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* ═══ DIALOG: Adicionar / Editar item ═══ */}
      <Dialog open={itemDialogOpen} onOpenChange={setItemDialogOpen}>
        <DialogContent className="max-w-md max-h-[85vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>{editingItem ? 'Editar lançamento' : 'Novo lançamento'}</DialogTitle>
          </DialogHeader>
          <div className="space-y-4 py-2">
            <div className="rounded-xl border border-blue-500/20 bg-blue-500/10 p-3 text-xs text-blue-200">
              Preencha descrição, valor e data. Em novo lançamento você pode parcelar e dividir automaticamente entre pessoas cadastradas.
            </div>

            <div className="space-y-2">
              <p className="text-sm font-medium text-foreground">Descrição da compra</p>
              <Input
                placeholder="Ex: Supermercado, Farmácia, Assinatura"
                value={itemForm.description}
                onChange={(e) => setItemForm(p => ({ ...p, description: e.target.value }))}
                className="input-finance"
              />
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-2">
                <p className="text-sm font-medium text-foreground">Valor total (R$)</p>
                <Input
                  placeholder="Ex: 150,00"
                  inputMode="decimal"
                  value={itemForm.amount}
                  onChange={(e) => {
                    const v = e.target.value.replaceAll(/[^\d,]/g, '');
                    setItemForm(p => ({ ...p, amount: v }));
                  }}
                  className="input-finance"
                />
              </div>
              <div className="space-y-2">
                <p className="text-sm font-medium text-foreground">Data da compra</p>
                <Input
                  type="date"
                  value={itemForm.date}
                  onChange={(e) => setItemForm(p => ({ ...p, date: e.target.value }))}
                  className="input-finance"
                />
              </div>
            </div>

            <div className="space-y-2">
              <p className="text-sm font-medium text-foreground">Categoria</p>
              <Select
                value={itemForm.category}
                onValueChange={(v) => setItemForm(p => ({ ...p, category: v }))}
              >
                <SelectTrigger className="input-finance"><SelectValue placeholder="Categoria" /></SelectTrigger>
                <SelectContent>
                  {CATEGORIES.map((cat) => (
                    <SelectItem key={cat} value={cat}>{CATEGORY_LABELS[cat]}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            {!editingItem && (
              <div className="space-y-2">
                <p className="text-sm font-medium text-foreground">Parcelamento</p>
                <Input
                  type="number"
                  min={1}
                  max={60}
                  value={itemForm.installments}
                  onChange={(e) => {
                    const next = String(Math.max(1, Math.min(60, Number.parseInt(e.target.value || '1', 10) || 1)));
                    setItemForm(p => ({ ...p, installments: next }));
                  }}
                  className="input-finance"
                />
                <p className="text-xs text-muted-foreground">
                  {parsedInstallments}x de {formatCurrency(installmentPreview || 0)}
                </p>
              </div>
            )}

            {safePeople.length > 0 && (
              <div className="space-y-2">
                {editingItem ? (
                  <>
                    <p className="text-sm font-medium text-foreground">Responsável</p>
                    <Select
                      value={itemForm.owner}
                      onValueChange={(v) => setItemForm(p => ({ ...p, owner: v, splitBetween: [v] }))}
                    >
                      <SelectTrigger className="input-finance"><SelectValue placeholder="Responsável" /></SelectTrigger>
                      <SelectContent>
                        {safePeople.map((person) => (
                          <SelectItem key={person} value={person}>{person}</SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </>
                ) : (
                  <>
                    <p className="text-sm font-medium text-foreground">Dividir entre pessoas</p>
                    <div className="flex flex-wrap gap-2">
                      {safePeople.map((person) => {
                        const selected = itemForm.splitBetween.includes(person);
                        return (
                          <button
                            key={person}
                            type="button"
                            onClick={() => toggleSplitPerson(person)}
                            className={`px-3 py-1.5 rounded-full text-sm border transition-all ${
                              selected
                                ? 'border-primary bg-primary/15 text-primary'
                                : 'border-border bg-background text-muted-foreground hover:border-primary/40'
                            }`}
                          >
                            {person}
                          </button>
                        );
                      })}
                    </div>
                    <p className="text-xs text-muted-foreground">
                      {splitCount > 1
                        ? `Cada pessoa paga ${formatCurrency(perPersonPreview || 0)} por parcela.`
                        : `Responsável único: ${itemForm.splitBetween[0] ?? itemForm.owner ?? safePeople[0]}`}
                    </p>
                  </>
                )}
              </div>
            )}
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setItemDialogOpen(false)}>Cancelar</Button>
            <Button onClick={handleSaveItem}>
              <Check className="w-4 h-4 mr-1" /> {editingItem ? 'Salvar' : 'Adicionar'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* ═══ DIALOG: Confirmar exclusao de item ═══ */}
      <Dialog
        open={!!deleteItemTarget}
        onOpenChange={(o) => { if (!o) setDeleteItemTarget(null); }}
      >
        <DialogContent className="max-w-sm">
          <DialogHeader><DialogTitle>Excluir lançamento?</DialogTitle></DialogHeader>
          <p className="text-sm text-muted-foreground">
            <strong>{deleteItemTarget?.description}</strong>{' '}
            {deleteItemTarget ? `\u2014 ${formatCurrency(deleteItemTarget.amount)}` : ''}
            <br />Esta ação não pode ser desfeita.
          </p>
          <DialogFooter>
            <Button variant="outline" onClick={() => setDeleteItemTarget(null)}>Cancelar</Button>
            <Button variant="destructive" onClick={handleDeleteItem}>
              <Trash2 className="w-4 h-4 mr-1" /> Excluir
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <InvoiceImportDialog
        open={importDialogOpen}
        onOpenChange={setImportDialogOpen}
        card={card}
        people={safePeople}
        month={viewMonth}
        year={viewYear}
        onImport={handleImportItems}
      />

      <PDFExportDialog
        open={exportDialogOpen}
        onOpenChange={setExportDialogOpen}
        card={card}
        items={monthItems}
        month={viewMonth}
        year={viewYear}
        ownerTotals={monthOwnerTotals}
      />

      <BottomNav />
    </div>
  );
};

export default CardDetail;
