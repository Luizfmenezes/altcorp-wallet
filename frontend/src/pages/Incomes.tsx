import React, { useState } from 'react';
import {
  Plus, Trash2, Banknote, Gift, TrendingUp, ChevronLeft, ChevronRight,
  Pencil, RefreshCw, ArrowUpRight, CalendarDays, Wallet,
  CircleDollarSign, Sparkles,
} from 'lucide-react';
import { BottomNav } from '@/components/BottomNav';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { useFinance, getMonthName } from '@/contexts/FinanceContext';
import { useTheme } from '@/contexts/ThemeContext';
import { useToast } from '@/hooks/use-toast';
import { IncomeGrowthChart } from '@/components/charts/IncomeGrowthChart';
import { Switch } from '@/components/ui/switch';
import { motion } from 'framer-motion';

const MONTH_NAMES = [
  'Janeiro', 'Fevereiro', 'Mar�o', 'Abril', 'Maio', 'Junho',
  'Julho', 'Agosto', 'Setembro', 'Outubro', 'Novembro', 'Dezembro'
];
const YEARS = Array.from({ length: 10 }, (_, i) => new Date().getFullYear() - 5 + i);

const Incomes: React.FC = () => {
  const { incomes, selectedMonth, selectedYear, setSelectedMonth, setSelectedYear, addIncome, updateIncome, removeIncome, getTotalIncome } = useFinance();
  const { theme } = useTheme();
  const { toast } = useToast();
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [editingIncome, setEditingIncome] = useState<string | null>(null);
  const [isEditDialogOpen, setIsEditDialogOpen] = useState(false);

  const displayMonth = selectedMonth + 1;

  const [desc, setDesc] = useState('');
  const [amount, setAmount] = useState('');
  const [type, setType] = useState<'fixed' | 'extra'>('fixed');
  const [payDay, setPayDay] = useState('');
  const [accMonth, setAccMonth] = useState(String(displayMonth));
  const [accYear, setAccYear] = useState(String(selectedYear));
  const [isRecurring, setIsRecurring] = useState(true);

  const [editDesc, setEditDesc] = useState('');
  const [editAmount, setEditAmount] = useState('');
  const [editType, setEditType] = useState<'fixed' | 'extra'>('fixed');
  const [editPayDay, setEditPayDay] = useState('');
  const [editAccMonth, setEditAccMonth] = useState('');
  const [editAccYear, setEditAccYear] = useState('');
  const [editIsRecurring, setEditIsRecurring] = useState(false);

  const fixedIncomes = incomes.filter(i => {
    if (i.type !== 'fixed') return false;
    if (i.accountingMonth) return i.accountingMonth === displayMonth && i.accountingYear === selectedYear;
    return true;
  });

  const extraIncomes = incomes.filter(i => {
    if (i.type !== 'extra') return false;
    if (i.accountingMonth) return i.accountingMonth === displayMonth && i.accountingYear === selectedYear;
    return i.month === selectedMonth && i.year === selectedYear;
  });

  const totalFixed = fixedIncomes.reduce((s, i) => s + i.amount, 0);
  const totalExtra = extraIncomes.reduce((s, i) => s + i.amount, 0);
  const totalIncome = getTotalIncome();
  const allIncomes = [...fixedIncomes, ...extraIncomes];

  const formatCurrency = (v: number) =>
    new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(v);

  const goToPreviousMonth = () => {
    if (selectedMonth === 0) { setSelectedMonth(11); setSelectedYear(selectedYear - 1); }
    else { setSelectedMonth(selectedMonth - 1); }
  };

  const goToNextMonth = () => {
    if (selectedMonth === 11) { setSelectedMonth(0); setSelectedYear(selectedYear + 1); }
    else { setSelectedMonth(selectedMonth + 1); }
  };

  const resetForm = () => {
    setDesc(''); setAmount(''); setType('fixed'); setPayDay('');
    setAccMonth(String(displayMonth)); setAccYear(String(selectedYear)); setIsRecurring(true);
  };

  const handleAddIncome = () => {
    if (!desc || !amount) {
      toast({ title: 'Erro', description: 'Preencha descrição e valor.', variant: 'destructive' });
      return;
    }
    addIncome({
      description: desc, amount: Number(amount), type,
      month: displayMonth, year: selectedYear,
      payDay: payDay ? Number(payDay) : null,
      accountingMonth: Number(accMonth), accountingYear: Number(accYear),
      isRecurring,
    });
    toast({ title: 'Sucesso', description: 'Renda adicionada!' });
    resetForm(); setIsDialogOpen(false);
  };

  const handleOpenEdit = (income: typeof incomes[0]) => {
    setEditingIncome(income.id);
    setEditDesc(income.description);
    setEditAmount(String(income.amount));
    setEditType(income.type);
    setEditPayDay(income.payDay ? String(income.payDay) : '');
    setEditAccMonth(income.accountingMonth ? String(income.accountingMonth) : String(displayMonth));
    setEditAccYear(income.accountingYear ? String(income.accountingYear) : String(selectedYear));
    setEditIsRecurring(income.isRecurring || false);
    setIsEditDialogOpen(true);
  };

  const handleSaveEdit = () => {
    if (!editingIncome || !editDesc || !editAmount) {
      toast({ title: 'Erro', description: 'Preencha descrição e valor.', variant: 'destructive' });
      return;
    }
    updateIncome(editingIncome, {
      description: editDesc, amount: Number(editAmount), type: editType,
      month: Number(editAccMonth), year: Number(editAccYear),
      payDay: editPayDay ? Number(editPayDay) : null,
      accountingMonth: Number(editAccMonth), accountingYear: Number(editAccYear),
      isRecurring: editIsRecurring,
    });
    toast({ title: 'Atualizado', description: 'Renda atualizada!' });
    setIsEditDialogOpen(false); setEditingIncome(null);
  };

  const handleRemoveIncome = (id: string) => {
    removeIncome(id);
    toast({ title: 'Removido', description: 'Renda removida.' });
  };

  // Percentual da renda fixa vs extra
  const fixedPercent = totalIncome > 0 ? (totalFixed / totalIncome) * 100 : 0;
  const extraPercent = totalIncome > 0 ? (totalExtra / totalIncome) * 100 : 0;

  /* --- Shared income card item ------------------------ */
  const renderIncomeItem = (income: typeof incomes[0], variant: 'fixed' | 'extra') => {
    const colorClass = variant === 'fixed' ? 'text-emerald-600 dark:text-emerald-400' : 'text-amber-600 dark:text-amber-400';
    const iconBg = variant === 'fixed' ? 'bg-emerald-500/10' : 'bg-amber-500/10';
    const IconComponent = variant === 'fixed' ? Banknote : Gift;

    return (
      <motion.div
        key={income.id}
        initial={{ opacity: 0, y: 8 }}
        animate={{ opacity: 1, y: 0 }}
        className="group flex items-center gap-3 p-3.5 rounded-xl bg-secondary/40 hover:bg-secondary/70 transition-all duration-200"
      >
        <div className={`w-10 h-10 rounded-xl ${iconBg} flex items-center justify-center flex-shrink-0`}>
          <IconComponent className={`w-5 h-5 ${colorClass}`} />
        </div>
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-1.5">
            <p className="font-medium text-foreground text-sm truncate">{income.description}</p>
            {income.isRecurring && <RefreshCw className="w-3 h-3 text-primary flex-shrink-0" />}
          </div>
          {!!income.payDay && (
            <p className="text-xs text-muted-foreground mt-0.5 flex items-center gap-1">
              <CalendarDays className="w-3 h-3" />
              Dia {income.payDay} � {MONTH_NAMES[(income.accountingMonth || displayMonth) - 1]}
            </p>
          )}
        </div>
        <div className="flex items-center gap-1.5">
          <span className={`font-bold text-sm ${colorClass}`}>{formatCurrency(income.amount)}</span>
          <div className="flex items-center gap-0.5 opacity-0 group-hover:opacity-100 transition-opacity">
            <Button variant="ghost" size="icon" onClick={() => handleOpenEdit(income)} className="h-7 w-7 text-muted-foreground hover:text-primary">
              <Pencil className="w-3 h-3" />
            </Button>
            <Button variant="ghost" size="icon" onClick={() => handleRemoveIncome(income.id)} className="h-7 w-7 text-muted-foreground hover:text-destructive">
              <Trash2 className="w-3 h-3" />
            </Button>
          </div>
        </div>
      </motion.div>
    );
  };

  /* --- Shared form fields (add/edit) -------------------- */
  const renderFormFields = (opts: {
    desc: string; setDesc: (v: string) => void;
    amount: string; setAmount: (v: string) => void;
    type: 'fixed' | 'extra'; setType: (v: 'fixed' | 'extra') => void;
    payDay: string; setPayDay: (v: string) => void;
    accMonth: string; setAccMonth: (v: string) => void;
    accYear: string; setAccYear: (v: string) => void;
    isRecurring: boolean; setIsRecurring: (v: boolean) => void;
  }) => (
    <div className="space-y-3 mt-3">
      <Input placeholder="Descrição (ex: Salário)" value={opts.desc} onChange={(e) => opts.setDesc(e.target.value)} className="input-finance" />
      <Input type="number" placeholder="Valor (R$)" value={opts.amount} onChange={(e) => opts.setAmount(e.target.value)} className="input-finance" />
      <div className="grid grid-cols-2 gap-2">
        <Select value={opts.type} onValueChange={(v: 'fixed' | 'extra') => opts.setType(v)}>
          <SelectTrigger className="input-finance"><SelectValue /></SelectTrigger>
          <SelectContent className="bg-background border shadow-lg z-50">
            <SelectItem value="fixed">Mensal</SelectItem>
            <SelectItem value="extra">Extra</SelectItem>
          </SelectContent>
        </Select>
        <Input type="number" min={1} max={31} placeholder="Dia pgto (ex: 20)" value={opts.payDay} onChange={(e) => opts.setPayDay(e.target.value)} className="input-finance" />
      </div>
      <div className="bg-secondary/50 rounded-xl p-3 space-y-2">
        <p className="text-xs font-medium text-muted-foreground">Contabilizar para:</p>
        <div className="grid grid-cols-2 gap-2">
          <Select value={opts.accMonth} onValueChange={opts.setAccMonth}>
            <SelectTrigger className="input-finance text-sm"><SelectValue /></SelectTrigger>
            <SelectContent className="bg-background border shadow-lg z-50">
              {MONTH_NAMES.map((name, i) => (<SelectItem key={name} value={String(i + 1)}>{name}</SelectItem>))}
            </SelectContent>
          </Select>
          <Select value={opts.accYear} onValueChange={opts.setAccYear}>
            <SelectTrigger className="input-finance text-sm"><SelectValue /></SelectTrigger>
            <SelectContent className="bg-background border shadow-lg z-50">
              {YEARS.map((y) => (<SelectItem key={y} value={String(y)}>{y}</SelectItem>))}
            </SelectContent>
          </Select>
        </div>
      </div>
      <div className="flex items-center justify-between px-1">
        <div className="flex items-center gap-2">
          <RefreshCw className="w-4 h-4 text-primary" />
          <span className="text-sm">Recorrente</span>
        </div>
        <Switch checked={opts.isRecurring} onCheckedChange={opts.setIsRecurring} />
      </div>
    </div>
  );

  return (
    <div className="min-h-screen bg-background pb-24 lg:pb-8">

      {/* -------------------------------------------------------
          MOBILE LAYOUT (<lg)
         ------------------------------------------------------- */}
      <div className="lg:hidden">
        {/* Header gradiente compacto */}
        <header className="relative overflow-hidden bg-primary text-primary-foreground px-5 pt-5 pb-7 rounded-b-[2rem]">
          <div className="absolute -top-8 -right-8 w-32 h-32 rounded-full bg-white/5" />
          <div className="absolute -bottom-6 -left-6 w-24 h-24 rounded-full bg-white/5" />

          <div className="relative z-10">
            <h1 className="text-lg font-bold tracking-wide mb-3">Receitas</h1>

            {/* Mini stats lado a lado */}
            <div className="grid grid-cols-3 gap-2">
              <div className="bg-white/10 backdrop-blur-sm rounded-xl p-2.5 text-center">
                <p className="text-[9px] uppercase tracking-wider opacity-70 mb-0.5">Total</p>
                <p className="text-sm font-bold leading-tight">{formatCurrency(totalIncome)}</p>
              </div>
              <div className="bg-white/10 backdrop-blur-sm rounded-xl p-2.5 text-center">
                <div className="flex items-center justify-center gap-1 mb-0.5">
                  <Banknote className="w-3 h-3 opacity-70" />
                  <p className="text-[9px] uppercase tracking-wider opacity-70">Mensal</p>
                </div>
                <p className="text-sm font-bold leading-tight">{formatCurrency(totalFixed)}</p>
              </div>
              <div className="bg-white/10 backdrop-blur-sm rounded-xl p-2.5 text-center">
                <div className="flex items-center justify-center gap-1 mb-0.5">
                  <Gift className="w-3 h-3 opacity-70" />
                  <p className="text-[9px] uppercase tracking-wider opacity-70">Extra</p>
                </div>
                <p className="text-sm font-bold leading-tight">{formatCurrency(totalExtra)}</p>
              </div>
            </div>
          </div>
        </header>

        {/* Content */}
        <div className="px-4 mt-4 space-y-4">
          {/* Month selector */}
          <div className="card-finance">
            <div className="flex items-center justify-center gap-3">
              <Button variant="ghost" size="icon" onClick={goToPreviousMonth}
                className="h-9 w-9 rounded-full bg-primary/10 hover:bg-primary/20">
                <ChevronLeft className="w-4 h-4" />
              </Button>
              <div className="bg-primary/10 rounded-2xl px-5 py-2 min-w-[180px] text-center">
                <span className="text-sm font-semibold">{getMonthName(selectedMonth)} {selectedYear}</span>
              </div>
              <Button variant="ghost" size="icon" onClick={goToNextMonth}
                className="h-9 w-9 rounded-full bg-primary/10 hover:bg-primary/20">
                <ChevronRight className="w-4 h-4" />
              </Button>
            </div>
          </div>

          {/* Gráfico */}
          <div className="card-finance">
            <div className="flex items-center gap-2 mb-2">
              <TrendingUp className="w-4 h-4 text-success" />
              <h2 className="font-semibold text-sm text-foreground">Evolução</h2>
            </div>
            <IncomeGrowthChart />
          </div>

          {/* Lista de rendas - Fixas */}
          <div className="card-finance">
            <div className="flex items-center justify-between mb-3">
              <div className="flex items-center gap-2">
                <div className="w-8 h-8 rounded-lg bg-emerald-500/10 flex items-center justify-center">
                  <Banknote className="w-4 h-4 text-emerald-600 dark:text-emerald-400" />
                </div>
                <div>
                  <h2 className="font-semibold text-sm text-foreground">Renda Mensal</h2>
                  <p className="text-xs text-muted-foreground">{fixedIncomes.length} {fixedIncomes.length === 1 ? 'item' : 'itens'}</p>
                </div>
              </div>
              <span className="text-sm font-bold text-emerald-600 dark:text-emerald-400">{formatCurrency(totalFixed)}</span>
            </div>
            {fixedIncomes.length === 0 ? (
              <div className="text-center py-6">
                <Wallet className="w-8 h-8 text-muted-foreground/30 mx-auto mb-2" />
                <p className="text-xs text-muted-foreground">Nenhuma renda mensal</p>
              </div>
            ) : (
              <div className="space-y-2">
                {fixedIncomes.map((income) => renderIncomeItem(income, 'fixed'))}
              </div>
            )}
          </div>

          {/* Lista de rendas - Extras */}
          <div className="card-finance">
            <div className="flex items-center justify-between mb-3">
              <div className="flex items-center gap-2">
                <div className="w-8 h-8 rounded-lg bg-amber-500/10 flex items-center justify-center">
                  <Gift className="w-4 h-4 text-amber-600 dark:text-amber-400" />
                </div>
                <div>
                  <h2 className="font-semibold text-sm text-foreground">Renda Extra</h2>
                  <p className="text-xs text-muted-foreground">{extraIncomes.length} {extraIncomes.length === 1 ? 'item' : 'itens'}</p>
                </div>
              </div>
              <span className="text-sm font-bold text-amber-600 dark:text-amber-400">{formatCurrency(totalExtra)}</span>
            </div>
            {extraIncomes.length === 0 ? (
              <div className="text-center py-6">
                <Sparkles className="w-8 h-8 text-muted-foreground/30 mx-auto mb-2" />
                <p className="text-xs text-muted-foreground">Nenhuma renda extra</p>
              </div>
            ) : (
              <div className="space-y-2">
                {extraIncomes.map((income) => renderIncomeItem(income, 'extra'))}
              </div>
            )}
          </div>
        </div>
      </div>

      {/* -------------------------------------------------------
          DESKTOP LAYOUT (lg+)
         ------------------------------------------------------- */}
      <div className="hidden lg:block">
        {/* Desktop Header */}
        <div className="px-8 py-6 border-b border-border/50">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-2xl font-bold text-foreground">Receitas</h1>
              <p className="text-sm text-muted-foreground mt-0.5">
                Gerencie suas rendas em <span className="font-medium text-primary">{getMonthName(selectedMonth)} {selectedYear}</span>
              </p>
            </div>
            <div className="flex items-center gap-3">
              <Button onClick={() => setIsDialogOpen(true)} className="rounded-xl gap-2">
                <Plus className="w-4 h-4" />
                Nova Receita
              </Button>
            </div>
          </div>
        </div>

        <div className="p-8 max-w-7xl mx-auto">
          {/* Month Navigator */}
          <div className="flex items-center justify-center gap-4 mb-8">
            <Button variant="ghost" size="icon" onClick={goToPreviousMonth}
              className="h-10 w-10 rounded-full bg-primary/10 hover:bg-primary/20">
              <ChevronLeft className="w-5 h-5" />
            </Button>
            <div className="bg-primary/10 rounded-2xl px-8 py-2.5 min-w-[220px] text-center">
              <span className="text-lg font-semibold">{getMonthName(selectedMonth)} {selectedYear}</span>
            </div>
            <Button variant="ghost" size="icon" onClick={goToNextMonth}
              className="h-10 w-10 rounded-full bg-primary/10 hover:bg-primary/20">
              <ChevronRight className="w-5 h-5" />
            </Button>
          </div>

          {/* Stats Row */}
          <div className="grid grid-cols-3 gap-6 mb-8">
            {/* Total */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.1 }}
              className="bg-card rounded-2xl p-6 border border-border/50 shadow-sm"
            >
              <div className="flex items-center justify-between mb-4">
                <p className="text-muted-foreground text-xs uppercase tracking-wider font-semibold">Total de receitas</p>
                <div
                  className="w-10 h-10 rounded-xl flex items-center justify-center"
                  style={{
                    background: theme === 'dark'
                      ? 'linear-gradient(135deg, rgba(16,185,129,0.2), rgba(5,150,105,0.2))'
                      : 'linear-gradient(135deg, rgba(16,185,129,0.1), rgba(5,150,105,0.1))',
                  }}
                >
                  <CircleDollarSign className="w-5 h-5 text-emerald-500" />
                </div>
              </div>
              <p className="text-3xl font-bold text-emerald-600 dark:text-emerald-400 tracking-tight">{formatCurrency(totalIncome)}</p>
              <p className="text-xs text-muted-foreground mt-1">{allIncomes.length} {allIncomes.length === 1 ? 'receita' : 'receitas'} neste m�s</p>
            </motion.div>

            {/* Mensal */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.15 }}
              className="bg-card rounded-2xl p-6 border border-border/50 shadow-sm"
            >
              <div className="flex items-center justify-between mb-4">
                <p className="text-muted-foreground text-xs uppercase tracking-wider font-semibold">Renda mensal</p>
                <div className="w-10 h-10 rounded-xl bg-primary/10 flex items-center justify-center">
                  <Banknote className="w-5 h-5 text-primary" />
                </div>
              </div>
              <p className="text-3xl font-bold text-foreground tracking-tight">{formatCurrency(totalFixed)}</p>
              <div className="flex items-center gap-2 mt-2">
                <div className="flex-1 h-1.5 rounded-full bg-secondary">
                  <div className="h-full rounded-full bg-primary transition-all duration-500" style={{ width: `${fixedPercent}%` }} />
                </div>
                <span className="text-xs text-muted-foreground font-medium">{fixedPercent.toFixed(0)}%</span>
              </div>
            </motion.div>

            {/* Extra */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.2 }}
              className="bg-card rounded-2xl p-6 border border-border/50 shadow-sm"
            >
              <div className="flex items-center justify-between mb-4">
                <p className="text-muted-foreground text-xs uppercase tracking-wider font-semibold">Renda extra</p>
                <div className="w-10 h-10 rounded-xl bg-amber-500/10 flex items-center justify-center">
                  <Gift className="w-5 h-5 text-amber-500" />
                </div>
              </div>
              <p className="text-3xl font-bold text-foreground tracking-tight">{formatCurrency(totalExtra)}</p>
              <div className="flex items-center gap-2 mt-2">
                <div className="flex-1 h-1.5 rounded-full bg-secondary">
                  <div className="h-full rounded-full bg-amber-500 transition-all duration-500" style={{ width: `${extraPercent}%` }} />
                </div>
                <span className="text-xs text-muted-foreground font-medium">{extraPercent.toFixed(0)}%</span>
              </div>
            </motion.div>
          </div>

          {/* Two Column Layout */}
          <div className="grid grid-cols-5 gap-6">
            {/* Left (3/5) - Income Lists */}
            <div className="col-span-3 space-y-6">
              {/* Renda Mensal */}
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.25 }}
                className="bg-card rounded-2xl p-6 border border-border/50 shadow-sm"
              >
                <div className="flex items-center justify-between mb-5">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-xl bg-emerald-500/10 flex items-center justify-center">
                      <Banknote className="w-5 h-5 text-emerald-500" />
                    </div>
                    <div>
                      <h2 className="font-semibold text-foreground">Renda Mensal</h2>
                      <p className="text-xs text-muted-foreground">{fixedIncomes.length} {fixedIncomes.length === 1 ? 'entrada' : 'entradas'}</p>
                    </div>
                  </div>
                  <span className="text-lg font-bold text-emerald-600 dark:text-emerald-400">{formatCurrency(totalFixed)}</span>
                </div>
                {fixedIncomes.length === 0 ? (
                  <div className="text-center py-10 border-2 border-dashed border-border/50 rounded-xl">
                    <Wallet className="w-10 h-10 text-muted-foreground/20 mx-auto mb-3" />
                    <p className="text-sm text-muted-foreground">Nenhuma renda mensal cadastrada</p>
                    <p className="text-xs text-muted-foreground/60 mt-1">Clique em "Nova Receita" para adicionar</p>
                  </div>
                ) : (
                  <div className="space-y-2">
                    {fixedIncomes.map((income) => renderIncomeItem(income, 'fixed'))}
                  </div>
                )}
              </motion.div>

              {/* Renda Extra */}
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.3 }}
                className="bg-card rounded-2xl p-6 border border-border/50 shadow-sm"
              >
                <div className="flex items-center justify-between mb-5">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-xl bg-amber-500/10 flex items-center justify-center">
                      <Gift className="w-5 h-5 text-amber-500" />
                    </div>
                    <div>
                      <h2 className="font-semibold text-foreground">Renda Extra</h2>
                      <p className="text-xs text-muted-foreground">{extraIncomes.length} {extraIncomes.length === 1 ? 'entrada' : 'entradas'}</p>
                    </div>
                  </div>
                  <span className="text-lg font-bold text-amber-600 dark:text-amber-400">{formatCurrency(totalExtra)}</span>
                </div>
                {extraIncomes.length === 0 ? (
                  <div className="text-center py-10 border-2 border-dashed border-border/50 rounded-xl">
                    <Sparkles className="w-10 h-10 text-muted-foreground/20 mx-auto mb-3" />
                    <p className="text-sm text-muted-foreground">Nenhuma renda extra neste m�s</p>
                    <p className="text-xs text-muted-foreground/60 mt-1">Adicione b�nus, freelances, etc.</p>
                  </div>
                ) : (
                  <div className="space-y-2">
                    {extraIncomes.map((income) => renderIncomeItem(income, 'extra'))}
                  </div>
                )}
              </motion.div>
            </div>

            {/* Right (2/5) - Chart & Summary */}
            <div className="col-span-2 space-y-6">
              {/* Gr�fico de crescimento */}
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.25 }}
                className="bg-card rounded-2xl p-6 border border-border/50 shadow-sm"
              >
                <div className="flex items-center gap-2 mb-4">
                  <TrendingUp className="w-5 h-5 text-success" />
                  <h2 className="font-semibold text-foreground">Crescimento de Renda</h2>
                </div>
                <IncomeGrowthChart />
              </motion.div>

              {/* Resumo / Composição */}
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.3 }}
                className="bg-card rounded-2xl p-6 border border-border/50 shadow-sm"
              >
                <div className="flex items-center gap-2 mb-5">
                  <ArrowUpRight className="w-5 h-5 text-primary" />
                  <h2 className="font-semibold text-foreground">Composição da Renda</h2>
                </div>

                <div className="space-y-4">
                  {/* Barra visual de composição */}
                  <div className="h-3 rounded-full bg-secondary overflow-hidden flex">
                    {fixedPercent > 0 && (
                      <div
                        className="h-full bg-emerald-500 transition-all duration-700"
                        style={{ width: `${fixedPercent}%` }}
                      />
                    )}
                    {extraPercent > 0 && (
                      <div
                        className="h-full bg-amber-500 transition-all duration-700"
                        style={{ width: `${extraPercent}%` }}
                      />
                    )}
                  </div>

                  {/* Legenda */}
                  <div className="space-y-3">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <div className="w-3 h-3 rounded-full bg-emerald-500" />
                        <span className="text-sm text-muted-foreground">Renda Mensal</span>
                      </div>
                      <div className="text-right">
                        <span className="text-sm font-semibold text-foreground">{formatCurrency(totalFixed)}</span>
                        <span className="text-xs text-muted-foreground ml-2">({fixedPercent.toFixed(0)}%)</span>
                      </div>
                    </div>
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <div className="w-3 h-3 rounded-full bg-amber-500" />
                        <span className="text-sm text-muted-foreground">Renda Extra</span>
                      </div>
                      <div className="text-right">
                        <span className="text-sm font-semibold text-foreground">{formatCurrency(totalExtra)}</span>
                        <span className="text-xs text-muted-foreground ml-2">({extraPercent.toFixed(0)}%)</span>
                      </div>
                    </div>
                  </div>

                  <div className="border-t border-border/50 pt-3">
                    <div className="flex items-center justify-between">
                      <span className="text-sm font-medium text-muted-foreground">Total</span>
                      <span className="text-lg font-bold text-emerald-600 dark:text-emerald-400">{formatCurrency(totalIncome)}</span>
                    </div>
                  </div>

                  {/* Quick stats */}
                  <div className="grid grid-cols-2 gap-3 pt-2">
                    <div className="bg-secondary/50 rounded-xl p-3 text-center">
                      <p className="text-2xl font-bold text-foreground">{fixedIncomes.length}</p>
                      <p className="text-[10px] uppercase tracking-wider text-muted-foreground mt-0.5">Rendas fixas</p>
                    </div>
                    <div className="bg-secondary/50 rounded-xl p-3 text-center">
                      <p className="text-2xl font-bold text-foreground">{extraIncomes.length}</p>
                      <p className="text-[10px] uppercase tracking-wider text-muted-foreground mt-0.5">Rendas extras</p>
                    </div>
                  </div>
                </div>
              </motion.div>
            </div>
          </div>
        </div>
      </div>

      {/* -------------------------------------------------------
          DIALOGS (shared mobile + desktop)
         ------------------------------------------------------- */}

      {/* Add dialog */}
      <Dialog open={isDialogOpen} onOpenChange={(open) => { setIsDialogOpen(open); if (!open) resetForm(); }}>
        <DialogTrigger asChild>
          <button className="floating-button shadow-floating lg:hidden">
            <Plus className="w-6 h-6" />
          </button>
        </DialogTrigger>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Plus className="w-5 h-5 text-primary" />
              Adicionar Receita
            </DialogTitle>
          </DialogHeader>
          {renderFormFields({ desc, setDesc, amount, setAmount, type, setType, payDay, setPayDay, accMonth, setAccMonth, accYear, setAccYear, isRecurring, setIsRecurring })}
          <Button onClick={handleAddIncome} className="w-full h-12 rounded-xl font-semibold mt-2">Adicionar</Button>
        </DialogContent>
      </Dialog>

      {/* Edit dialog */}
      <Dialog open={isEditDialogOpen} onOpenChange={(open) => { setIsEditDialogOpen(open); if (!open) setEditingIncome(null); }}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Pencil className="w-5 h-5 text-primary" />
              Editar Receita
            </DialogTitle>
          </DialogHeader>
          {renderFormFields({ desc: editDesc, setDesc: setEditDesc, amount: editAmount, setAmount: setEditAmount, type: editType, setType: setEditType, payDay: editPayDay, setPayDay: setEditPayDay, accMonth: editAccMonth, setAccMonth: setEditAccMonth, accYear: editAccYear, setAccYear: setEditAccYear, isRecurring: editIsRecurring, setIsRecurring: setEditIsRecurring })}
          <Button onClick={handleSaveEdit} className="w-full h-12 rounded-xl font-semibold mt-2">Salvar</Button>
        </DialogContent>
      </Dialog>

      <BottomNav />
    </div>
  );
};

export default Incomes;
