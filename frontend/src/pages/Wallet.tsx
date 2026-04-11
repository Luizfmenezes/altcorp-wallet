import React, { useState, useMemo } from 'react';
import { Plus, CreditCard, ChevronRight, CalendarDays, Info, Search, ArrowLeft, Check } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { BottomNav } from '@/components/BottomNav';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { useFinance, Card } from '@/contexts/FinanceContext';
import { useToast } from '@/hooks/use-toast';
import { BRAZILIAN_BANKS, getBankById, BankInfo } from '@/lib/banks';
import BankLogo from '@/components/BankLogo';

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

const MONTH_NAMES = [
  'Janeiro', 'Fevereiro', 'Março', 'Abril', 'Maio', 'Junho',
  'Julho', 'Agosto', 'Setembro', 'Outubro', 'Novembro', 'Dezembro',
];

/* ─── Form Data ─── */
type FormData = {
  name: string;
  type: Card['type'];
  color: string;
  icon: string;
  closingDay: string;
  dueDay: string;
  creditLimit: string;
};

const EMPTY_FORM: FormData = {
  name: '',
  type: 'credit',
  color: CARD_COLORS[0].value,
  icon: '',
  closingDay: '',
  dueDay: '',
  creditLimit: '',
};

/* ─── Invoice Preview ─── */
const getInvoicePeriod = (closingDay: number) => {
  const today = new Date();
  const todayDay = today.getDate();
  const month = today.getMonth();
  const year = today.getFullYear();

  let startMonth = month - 1;
  let startYear = year;
  if (startMonth < 0) { startMonth = 11; startYear -= 1; }
  const startDay = closingDay + 1;
  const startDate = new Date(startYear, startMonth, startDay);
  const endDate = new Date(year, month, closingDay);

  if (todayDay > closingDay) {
    startDate.setMonth(startDate.getMonth() + 1);
    endDate.setMonth(endDate.getMonth() + 1);
  }

  const fmtDate = (d: Date) =>
    `${String(d.getDate()).padStart(2, '0')}/${String(d.getMonth() + 1).padStart(2, '0')}`;

  const invoiceMonthName = MONTH_NAMES[endDate.getMonth()];
  return { start: fmtDate(startDate), end: fmtDate(endDate), invoiceMonthName };
};

const InvoicePreview: React.FC<{ closingDay: number; dueDay?: number }> = ({ closingDay, dueDay }) => {
  const period = useMemo(() => getInvoicePeriod(closingDay), [closingDay]);
  return (
    <div className="mt-3 rounded-xl border border-primary/20 bg-primary/5 p-3 space-y-3">
      <div className="flex items-center gap-2 text-primary">
        <CalendarDays className="w-4 h-4 flex-shrink-0" />
        <span className="text-sm font-semibold">Previa do ciclo de fatura</span>
      </div>
      <div className="flex items-center gap-1">
        <div className="flex flex-col items-center">
          <div className="w-2.5 h-2.5 rounded-full bg-green-500" />
          <div className="text-[10px] text-muted-foreground mt-1 text-center leading-tight">
            Inicio<br/>{period.start}
          </div>
        </div>
        <div className="flex-1 h-px bg-border mx-1 relative top-[-6px]" />
        <div className="flex flex-col items-center">
          <div className="w-2.5 h-2.5 rounded-full bg-red-500" />
          <div className="text-[10px] text-muted-foreground mt-1 text-center leading-tight">
            Fechamento<br/>{period.end}
          </div>
        </div>
        {!!dueDay && (
          <>
            <div className="flex-1 h-px bg-border mx-1 relative top-[-6px]" />
            <div className="flex flex-col items-center">
              <div className="w-2.5 h-2.5 rounded-full bg-blue-500" />
              <div className="text-[10px] text-muted-foreground mt-1 text-center leading-tight">
                Vencimento<br/>dia {dueDay}
              </div>
            </div>
          </>
        )}
      </div>
      <div className="flex gap-2 text-xs text-muted-foreground bg-background/60 rounded-lg p-2">
        <Info className="w-3.5 h-3.5 flex-shrink-0 mt-0.5 text-primary" />
        <span>
          Compras de <strong>{period.start}</strong> ate <strong>{period.end}</strong> entram na fatura de{' '}
          <strong>{period.invoiceMonthName}</strong>.
          {!!dueDay && <> O pagamento vence no dia <strong>{dueDay}</strong>.</>}
        </span>
      </div>
    </div>
  );
};

/* ─────────────────────────────────────────────
   ETAPA 1: Escolher Banco  (tela cheia)
   ───────────────────────────────────────────── */
const BankPickerScreen: React.FC<{
  onSelect: (bank: BankInfo) => void;
  onSkip: () => void;
  onBack: () => void;
}> = ({ onSelect, onSkip, onBack }) => {
  const [search, setSearch] = useState('');
  const filtered = BRAZILIAN_BANKS.filter(b =>
    b.name.toLowerCase().includes(search.toLowerCase())
  );

  return (
    <div className="fixed inset-0 z-[60] bg-background flex flex-col animate-fade-in">
      {/* Top bar */}
      <div className="flex items-center gap-3 p-4 border-b">
        <Button variant="ghost" size="icon" onClick={onBack} className="rounded-full">
          <ArrowLeft className="w-5 h-5" />
        </Button>
        <h2 className="text-lg font-bold flex-1">Escolha o banco</h2>
      </div>

      {/* Search */}
      <div className="px-4 pt-4 pb-2">
        <div className="relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
          <Input
            placeholder="Buscar banco..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="pl-9 h-11 rounded-xl"
          />
        </div>
      </div>

      {/* Bank grid */}
      <div className="flex-1 overflow-y-auto px-4 pb-6">
        <div className="grid grid-cols-3 sm:grid-cols-4 gap-3 mt-2">
          {filtered.map((bank) => (
            <button
              key={bank.id}
              type="button"
              onClick={() => onSelect(bank)}
              className="flex flex-col items-center gap-2 p-3 rounded-2xl bg-card border border-border hover:border-primary hover:bg-primary/5 transition-all active:scale-95"
            >
              <div className="w-12 h-12 rounded-xl bg-white flex items-center justify-center overflow-hidden shadow-sm">
                <BankLogo bankId={bank.id} size={40} />
              </div>
              <span className="text-xs font-medium text-foreground text-center leading-tight truncate w-full">
                {bank.name}
              </span>
            </button>
          ))}
        </div>
      </div>

      {/* Skip */}
      <div className="p-4 border-t">
        <Button variant="ghost" onClick={onSkip} className="w-full text-muted-foreground">
          Pular — configurar sem banco
        </Button>
      </div>
    </div>
  );
};

/* ─────────────────────────────────────────────
   ETAPA 2: Configurar Cartao  (tela cheia)
   ───────────────────────────────────────────── */
const CardConfigScreen: React.FC<{
  selectedBank: BankInfo | null;
  onBack: () => void;
  onDone: () => void;
  formData: FormData;
  setFormData: React.Dispatch<React.SetStateAction<FormData>>;
}> = ({ selectedBank, onBack, onDone, formData, setFormData }) => {
  const closingDayNum = Number.parseInt(formData.closingDay, 10);
  const dueDayNum = Number.parseInt(formData.dueDay, 10);
  const showPreview = formData.type === 'credit' && closingDayNum >= 1 && closingDayNum <= 31;

  return (
    <div className="fixed inset-0 z-[60] bg-background flex flex-col">
      {/* Top bar */}
      <div className="flex items-center gap-3 px-4 py-3 border-b flex-shrink-0">
        <Button variant="ghost" size="icon" onClick={onBack} className="rounded-full">
          <ArrowLeft className="w-5 h-5" />
        </Button>
        <div className="flex items-center gap-2 flex-1">
          {selectedBank && (
            <div className="w-7 h-7 rounded-lg bg-white flex items-center justify-center overflow-hidden shadow-sm">
              <BankLogo bankId={selectedBank.id} size={24} />
            </div>
          )}
          <h2 className="text-base font-bold">Configurar cartão</h2>
        </div>
      </div>

      {/* Form scrollable — ocupa o espaco restante */}
      <div className="flex-1 overflow-y-auto overscroll-contain px-4 py-3 space-y-3 pb-2">
        <Input
          placeholder="Nome (ex: Cartão Nubank)"
          value={formData.name}
          onChange={(e) => setFormData((p) => ({ ...p, name: e.target.value }))}
          className="input-finance"
        />

        <Select
          value={formData.type}
          onValueChange={(v: Card['type']) => setFormData((p) => ({ ...p, type: v }))}
        >
          <SelectTrigger className="input-finance"><SelectValue placeholder="Tipo" /></SelectTrigger>
          <SelectContent>
            <SelectItem value="credit">Cartão de Crédito</SelectItem>
            <SelectItem value="debit">Cartão de Débito</SelectItem>
            <SelectItem value="bank">Conta Bancária</SelectItem>
          </SelectContent>
        </Select>

        {formData.type === 'credit' && (
          <div className="space-y-3">
            <div className="grid grid-cols-2 gap-3">
              <div>
                <p className="text-xs font-medium text-foreground mb-1">Fechamento (dia)</p>
                <Input
                  type="number" min={1} max={31} placeholder="Ex: 6"
                  value={formData.closingDay}
                  onChange={(e) => setFormData((p) => ({ ...p, closingDay: e.target.value }))}
                  className="input-finance"
                />
              </div>
              <div>
                <p className="text-xs font-medium text-foreground mb-1">Vencimento (dia)</p>
                <Input
                  type="number" min={1} max={31} placeholder="Ex: 15"
                  value={formData.dueDay}
                  onChange={(e) => setFormData((p) => ({ ...p, dueDay: e.target.value }))}
                  className="input-finance"
                />
              </div>
            </div>
            {showPreview && (
              <InvoicePreview
                closingDay={closingDayNum}
                dueDay={dueDayNum >= 1 && dueDayNum <= 31 ? dueDayNum : undefined}
              />
            )}
            <div>
              <p className="text-xs font-medium text-foreground mb-1">Limite do cartão (R$)</p>
              <Input
                placeholder="Ex: 5.000" inputMode="numeric"
                value={formData.creditLimit}
                onChange={(e) => {
                  // eslint-disable-next-line prefer-string-replace-all
                  const raw = e.target.value.replace(/\D/g, '');
                  const num = Number.parseInt(raw, 10) || 0;
                  setFormData((p) => ({ ...p, creditLimit: num > 0 ? num.toLocaleString('pt-BR') : '' }));
                }}
                className="input-finance"
              />
            </div>
          </div>
        )}

        {/* Cor */}
        <div>
          <p className="text-xs text-muted-foreground mb-2">Cor do cartão</p>
          <div className="flex gap-2 flex-wrap">
            {CARD_COLORS.map((c) => (
              <button
                key={c.value}
                type="button"
                onClick={() => setFormData((p) => ({ ...p, color: c.value }))}
                className={`w-9 h-9 rounded-xl transition-transform ${
                  formData.color === c.value ? 'scale-110 ring-2 ring-foreground' : ''
                }`}
                style={{ backgroundColor: c.value }}
              />
            ))}
          </div>
        </div>
      </div>

      {/* Bottom action — sempre visivel, fora do scroll */}
      <div className="flex-shrink-0 px-4 py-4 border-t bg-background" style={{ paddingBottom: 'max(1rem, env(safe-area-inset-bottom))' }}>
        <Button onClick={onDone} className="w-full h-12 rounded-xl text-base font-semibold shadow-lg">
          <Check className="w-5 h-5 mr-2" /> Cadastrar Cartão
        </Button>
      </div>
    </div>
  );
};

/* ─────────────────────────────────────────────
   MAIN: Wallet Page
   ───────────────────────────────────────────── */
const Wallet: React.FC = () => {
  const { cards, addCard } = useFinance();
  const navigate = useNavigate();
  const { toast } = useToast();

  // Fluxo de criacao em 2 etapas
  type CreateStep = 'idle' | 'pick-bank' | 'configure';
  const [createStep, setCreateStep] = useState<CreateStep>('idle');
  const [selectedBank, setSelectedBank] = useState<BankInfo | null>(null);
  const [formData, setFormData] = useState<FormData>(EMPTY_FORM);

  const formatCurrency = (amount: number) =>
    new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(amount);

  const getCardTotal = (card: Card) => {
    const today = new Date();
    const todayYear = today.getFullYear();
    const todayMonth = today.getMonth();

    return card.invoiceItems
      .filter(item => {
        const [y, m] = item.date.split('-');
        const itemYear = Number.parseInt(y, 10);
        const itemMonth = Number.parseInt(m, 10) - 1;
        const isPaid = (card.paidInvoices ?? []).some(
          p => p.month === itemMonth && p.year === itemYear
        );
        if (isPaid) return false;
        if (itemYear < todayYear) return false;
        if (itemYear === todayYear && itemMonth < todayMonth) return false;
        return true;
      })
      .reduce((sum, item) => sum + item.amount, 0);
  };

  const getCardTypeLabel = (type: Card['type']) => {
    switch (type) {
      case 'credit': return 'Crédito';
      case 'debit': return 'Débito';
      case 'bank': return 'Conta';
    }
  };

  /* — Fluxo de criacao — */
  const startCreate = () => {
    setFormData(EMPTY_FORM);
    setSelectedBank(null);
    setCreateStep('pick-bank');
  };

  const handleBankSelected = (bank: BankInfo) => {
    setSelectedBank(bank);
    setFormData({
      ...EMPTY_FORM,
      icon: bank.id,
      color: bank.color,
      name: bank.id === 'outro' ? '' : `Cartão ${bank.name}`,
    });
    setCreateStep('configure');
  };

  const handleSkipBank = () => {
    setSelectedBank(null);
    setFormData(EMPTY_FORM);
    setCreateStep('configure');
  };

  const handleCreate = async () => {
    if (!formData.name.trim()) {
      toast({ title: 'Erro', description: 'Informe o nome do cartão.', variant: 'destructive' });
      return;
    }
    const parseDayField = (val: string) => {
      const n = Number.parseInt(val, 10);
      return n >= 1 && n <= 31 ? n : undefined;
    };
    // eslint-disable-next-line prefer-string-replace-all
    const limitRaw = formData.creditLimit.replace(/\D/g, '');
    const limitNum = Number.parseInt(limitRaw, 10) || 0;
    await addCard({
      name: formData.name.trim(),
      type: formData.type,
      color: formData.color,
      icon: formData.icon || null,
      closingDay: parseDayField(formData.closingDay),
      dueDay: parseDayField(formData.dueDay),
      creditLimit: limitNum > 0 ? limitNum : null,
    });
    toast({ title: 'Sucesso', description: 'Cartão cadastrado!' });
    setCreateStep('idle');
  };

  return (
    <div className="min-h-screen bg-background pb-24 lg:pb-8">
      <header className="bg-primary text-primary-foreground p-6 pb-8 rounded-b-3xl lg:rounded-none">
        <div className="max-w-7xl mx-auto">
          <h1 className="text-xl lg:text-2xl font-bold text-center tracking-wide">
            CARTOES E BANCOS
          </h1>
        </div>
      </header>

      <div className="px-4 lg:px-8 -mt-4 max-w-7xl mx-auto">
        {cards.length === 0 ? (
          <div className="card-finance text-center py-8 animate-fade-in">
            <CreditCard className="w-12 h-12 text-muted-foreground mx-auto mb-3" />
            <p className="text-muted-foreground">Nenhum cartão cadastrado</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-3 md:gap-4">
            {cards.map((card, index) => {
              const total = getCardTotal(card);
              const limit = card.creditLimit ?? 0;
              const usagePercent = limit > 0 ? Math.min((total / limit) * 100, 100) : 0;
              let barColor = 'bg-emerald-500';
              if (usagePercent > 80) barColor = 'bg-destructive';
              else if (usagePercent > 50) barColor = 'bg-yellow-500';
              const bankInfo = getBankById(card.icon ?? undefined);
              const hasBankLogo = !!bankInfo?.logo;

              return (
                <div
                  key={card.id}
                  className="card-finance relative animate-fade-in group overflow-hidden"
                  style={{ animationDelay: `${index * 0.05}s` }}
                >
                  <button
                    type="button"
                    className="absolute inset-0 z-0 cursor-pointer"
                    aria-label={`Ver detalhes de ${card.name}`}
                    onClick={() => navigate(`/wallet/${card.id}`)}
                  />
                  <div className="flex items-center gap-3">
                    <div
                      className="w-11 h-11 rounded-xl flex items-center justify-center flex-shrink-0 overflow-hidden"
                      style={{ backgroundColor: hasBankLogo ? 'transparent' : card.color }}
                    >
                      <BankLogo bankId={card.icon} size={44} fallbackType={card.type} />
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="font-semibold text-foreground truncate text-sm">{card.name}</p>
                      <p className="text-xs text-muted-foreground">
                        {getCardTypeLabel(card.type)}
                        {bankInfo && <span> &bull; {bankInfo.name}</span>}
                        {card.type === 'credit' && !!card.dueDay && (
                          <span> &bull; Venc. dia {card.dueDay}</span>
                        )}
                      </p>
                    </div>
                    <div className="flex items-center gap-1 flex-shrink-0 z-10">
                      <p className={`font-bold text-sm ${total > 0 ? 'text-destructive' : 'text-foreground'}`}>
                        {formatCurrency(total)}
                      </p>
                      <ChevronRight className="w-4 h-4 text-muted-foreground" />
                    </div>
                  </div>

                  {card.type === 'credit' && limit > 0 && (
                    <div className="mt-3 z-10 relative">
                      <div className="flex justify-between text-[11px] text-muted-foreground mb-1">
                        <span>Usado: {formatCurrency(total)}</span>
                        <span>Limite: {formatCurrency(limit)}</span>
                      </div>
                      <div className="h-2 bg-muted rounded-full overflow-hidden">
                        <div
                          className={`h-full rounded-full transition-all duration-500 ${barColor}`}
                          style={{ width: `${usagePercent}%` }}
                        />
                      </div>
                      <p className="text-[10px] text-muted-foreground mt-1 text-right">
                        Disponivel: {formatCurrency(Math.max(limit - total, 0))}
                      </p>
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* FAB: Novo cartao */}
      <button onClick={startCreate} className="floating-button shadow-floating lg:bottom-8 lg:right-8">
        <Plus className="w-6 h-6" />
      </button>

      {/* ETAPA 1: Escolher banco */}
      {createStep === 'pick-bank' && (
        <BankPickerScreen
          onSelect={handleBankSelected}
          onSkip={handleSkipBank}
          onBack={() => setCreateStep('idle')}
        />
      )}

      {/* ETAPA 2: Configurar cartao */}
      {createStep === 'configure' && (
        <CardConfigScreen
          selectedBank={selectedBank}
          onBack={() => setCreateStep('pick-bank')}
          onDone={handleCreate}
          formData={formData}
          setFormData={setFormData}
        />
      )}

      <BottomNav />
    </div>
  );
};

export default Wallet;
