import React, { useState, useRef, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { ArrowLeft, Calendar as CalendarIcon, Check, ChevronDown, CreditCard, RefreshCw, User, Tag, FileText } from 'lucide-react';
import { useFinance } from '@/contexts/FinanceContext';
import { useToast } from '@/hooks/use-toast';
import { motion, AnimatePresence } from 'framer-motion';
import { format } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import { Calendar } from '@/components/ui/calendar';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import CategoryIcon from '@/components/CategoryIcon';

const CATEGORIES = [
  'Alimentação',
  'Transporte',
  'Moradia',
  'Lazer',
  'Saúde',
  'Educação',
  'Compras',
  'Serviços',
  'Outros',
];

const INCOME_CATEGORIES = [
  { label: 'Salário' },
  { label: 'Freelance' },
  { label: 'Investimentos' },
  { label: 'Presente' },
  { label: 'Outros' },
];

type TabType = 'despesa' | 'receita';
type PaymentType = 'avulso' | 'cartao';

const QuickAdd: React.FC = () => {
  const navigate = useNavigate();
  const { people, cards, addExpense, addInvoiceItem, addIncome, addPerson } = useFinance();
  const { toast } = useToast();
  const inputRef = useRef<HTMLInputElement>(null);

  const [tab, setTab] = useState<TabType>('despesa');
  const [amount, setAmount] = useState('');
  const [description, setDescription] = useState('');
  const [category, setCategory] = useState('');
  const [owner, setOwner] = useState('Eu');
  const [paymentType, setPaymentType] = useState<PaymentType>('avulso');
  const [selectedCardId, setSelectedCardId] = useState('');
  const [date, setDate] = useState<Date>(new Date());
  const [isRecurring, setIsRecurring] = useState(false);
  const [frequency, setFrequency] = useState<'monthly' | 'weekly'>('monthly');
  const [installments, setInstallments] = useState('');
  const [incomeType, setIncomeType] = useState<'fixed' | 'extra'>('extra');

  // Seções expandíveis
  const [showCategoryPicker, setShowCategoryPicker] = useState(false);
  const [showPersonPicker, setShowPersonPicker] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [newPersonName, setNewPersonName] = useState('');

  // Foco no input de valor ao abrir
  useEffect(() => {
    setTimeout(() => inputRef.current?.focus(), 300);
  }, []);

  // Formatar valor em reais
  const formatCurrency = (value: string) => {
    const num = value.replace(/\D/g, '');
    const cents = parseInt(num || '0', 10);
    return (cents / 100).toLocaleString('pt-BR', { minimumFractionDigits: 2, maximumFractionDigits: 2 });
  };

  const handleAmountChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const raw = e.target.value.replace(/\D/g, '');
    setAmount(raw);
  };

  const getNumericAmount = () => {
    return parseInt(amount || '0', 10) / 100;
  };

  const creditCards = cards.filter(c => c.type === 'credit');

  const handleSubmit = async () => {
    const numAmount = getNumericAmount();
    if (numAmount <= 0) {
      toast({ title: 'Valor inválido', description: 'Informe um valor maior que zero.', variant: 'destructive' });
      return;
    }

    setIsSubmitting(true);

    try {
      if (tab === 'despesa') {
        const expenseCategory = category || 'Outros';

        if (paymentType === 'cartao') {
          if (!selectedCardId) {
            toast({ title: 'Selecione um cartão', variant: 'destructive' });
            setIsSubmitting(false);
            return;
          }
          const inst = installments ? parseInt(installments, 10) : undefined;
          await addInvoiceItem(selectedCardId, {
            date: date.toISOString().split('T')[0],
            description: description || expenseCategory,
            category: expenseCategory,
            amount: numAmount,
            owner,
            isRecurring,
            frequency: isRecurring ? frequency : undefined,
          }, inst && inst > 1 ? inst : undefined);
        } else {
          await addExpense({
            date: date.toISOString().split('T')[0],
            description: description || expenseCategory,
            category: expenseCategory,
            amount: numAmount,
            owner,
            isRecurring,
            frequency: isRecurring ? frequency : undefined,
          });
        }

        toast({ title: '✅ Despesa adicionada!', description: `R$ ${formatCurrency(amount)} - ${description || expenseCategory}` });
      } else {
        // Receita
        await addIncome({
          description: description || 'Renda',
          amount: numAmount,
          type: incomeType,
          month: date.getMonth(),
          year: date.getFullYear(),
          isRecurring,
        });

        toast({ title: '✅ Receita adicionada!', description: `R$ ${formatCurrency(amount)} - ${description || 'Renda'}` });
      }

      navigate(-1);
    } catch {
      toast({ title: 'Erro ao salvar', variant: 'destructive' });
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleAddPerson = () => {
    const name = newPersonName.trim();
    if (name && !people.includes(name)) {
      addPerson(name);
      setOwner(name);
      setNewPersonName('');
      setShowPersonPicker(false);
    }
  };

  return (
    <div className="min-h-screen bg-background flex flex-col">
      {/* Header com gradiente */}
      <motion.div
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        className="bg-gradient-to-br from-[#0D1A6E] to-[#1A2FA8] dark:from-[#0D1A6E] dark:to-[#1A2FA8] text-white"
      >
        {/* Botão voltar + título */}
        <div className="flex items-center gap-3 px-4 pt-4 pb-2">
          <button onClick={() => navigate(-1)} className="w-10 h-10 rounded-full bg-white/15 flex items-center justify-center">
            <ArrowLeft className="w-5 h-5" />
          </button>
          <h1 className="text-lg font-semibold">Novo lançamento</h1>
        </div>

        {/* Tabs Despesa / Receita */}
        <div className="flex mx-4 mb-4 bg-white/15 rounded-xl p-1">
          {(['despesa', 'receita'] as TabType[]).map((t) => (
            <button
              key={t}
              onClick={() => setTab(t)}
              className={`flex-1 py-2.5 rounded-lg text-sm font-semibold transition-all duration-200 ${
                tab === t ? 'bg-white text-[#0D1A6E] shadow-md' : 'text-white/70 hover:text-white'
              }`}
            >
              {t === 'despesa' ? 'Despesa' : 'Receita'}
            </button>
          ))}
        </div>

        {/* Input de valor */}
        <div className="px-6 pb-6">
          <p className="text-white/60 text-sm mb-1">Valor</p>
          <div className="flex items-center gap-2">
            <span className="text-3xl font-bold">R$</span>
            <input
              ref={inputRef}
              type="text"
              inputMode="numeric"
              value={formatCurrency(amount)}
              onChange={handleAmountChange}
              placeholder="0,00"
              className="text-4xl font-bold bg-transparent border-none outline-none text-white placeholder-white/30 w-full"
            />
          </div>
        </div>
      </motion.div>

      {/* Formulário */}
      <motion.div
        initial={{ opacity: 0, y: 30 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.1 }}
        className="flex-1 px-4 py-4 space-y-3 overflow-y-auto pb-32"
      >
        {/* Descrição */}
        <div className="bg-card rounded-2xl border border-border/50 overflow-hidden">
          <div className="flex items-center gap-3 px-4 py-3.5">
            <FileText className="w-5 h-5 text-muted-foreground shrink-0" />
            <input
              type="text"
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="Descrição"
              className="flex-1 bg-transparent outline-none text-foreground placeholder-muted-foreground text-sm"
            />
          </div>
        </div>

        {/* Categoria */}
        <div className="bg-card rounded-2xl border border-border/50 overflow-hidden">
          <button
            onClick={() => setShowCategoryPicker(!showCategoryPicker)}
            className="w-full flex items-center gap-3 px-4 py-3.5"
          >
            <Tag className="w-5 h-5 text-muted-foreground shrink-0" />
            <span className={`flex-1 text-left text-sm flex items-center gap-2 ${category ? 'text-foreground' : 'text-muted-foreground'}`}>
              {category ? (
                <>
                  <CategoryIcon category={category} size={22} iconSize={13} />
                  {category}
                </>
              ) : 'Categoria'}
            </span>
            <ChevronDown className={`w-4 h-4 text-muted-foreground transition-transform ${showCategoryPicker ? 'rotate-180' : ''}`} />
          </button>

          <AnimatePresence>
            {showCategoryPicker && (
              <motion.div
                initial={{ height: 0, opacity: 0 }}
                animate={{ height: 'auto', opacity: 1 }}
                exit={{ height: 0, opacity: 0 }}
                transition={{ duration: 0.2 }}
                className="overflow-hidden"
              >
                <div className="px-4 pb-3 grid grid-cols-3 gap-2">
                  {tab === 'despesa'
                    ? CATEGORIES.map((cat) => (
                        <button
                          key={cat}
                          onClick={() => { setCategory(cat); setShowCategoryPicker(false); }}
                          className={`flex flex-col items-center gap-1 p-2.5 rounded-xl text-xs font-medium transition-all ${
                            category === cat
                              ? 'bg-primary/15 text-primary ring-1 ring-primary/30'
                              : 'bg-secondary/50 text-muted-foreground hover:bg-secondary'
                          }`}
                        >
                          <CategoryIcon category={cat} size={28} iconSize={16} />
                          <span className="truncate w-full text-center">{cat}</span>
                        </button>
                      ))
                    : INCOME_CATEGORIES.map((cat) => (
                        <button
                          key={cat.label}
                          onClick={() => { setCategory(cat.label); setShowCategoryPicker(false); }}
                          className={`flex flex-col items-center gap-1 p-2.5 rounded-xl text-xs font-medium transition-all ${
                            category === cat.label
                              ? 'bg-primary/15 text-primary ring-1 ring-primary/30'
                              : 'bg-secondary/50 text-muted-foreground hover:bg-secondary'
                          }`}
                        >
                          <CategoryIcon category={cat.label} size={28} iconSize={16} />
                          <span className="truncate w-full text-center">{cat.label}</span>
                        </button>
                      ))
                  }
                </div>
              </motion.div>
            )}
          </AnimatePresence>
        </div>

        {/* Pessoa */}
        <div className="bg-card rounded-2xl border border-border/50 overflow-hidden">
          <button
            onClick={() => setShowPersonPicker(!showPersonPicker)}
            className="w-full flex items-center gap-3 px-4 py-3.5"
          >
            <User className="w-5 h-5 text-muted-foreground shrink-0" />
            <span className={`flex-1 text-left text-sm ${owner !== 'Eu' ? 'text-foreground' : 'text-muted-foreground'}`}>
              {owner || 'Pessoa'}
            </span>
            <ChevronDown className={`w-4 h-4 text-muted-foreground transition-transform ${showPersonPicker ? 'rotate-180' : ''}`} />
          </button>

          <AnimatePresence>
            {showPersonPicker && (
              <motion.div
                initial={{ height: 0, opacity: 0 }}
                animate={{ height: 'auto', opacity: 1 }}
                exit={{ height: 0, opacity: 0 }}
                transition={{ duration: 0.2 }}
                className="overflow-hidden"
              >
                <div className="px-4 pb-3 space-y-2">
                  <div className="flex flex-wrap gap-2">
                    {people.map((p) => (
                      <button
                        key={p}
                        onClick={() => { setOwner(p); setShowPersonPicker(false); }}
                        className={`px-3 py-1.5 rounded-full text-xs font-medium transition-all ${
                          owner === p
                            ? 'bg-primary/15 text-primary ring-1 ring-primary/30'
                            : 'bg-secondary/50 text-muted-foreground hover:bg-secondary'
                        }`}
                      >
                        {p}
                      </button>
                    ))}
                  </div>
                  <div className="flex gap-2 pt-1">
                    <input
                      type="text"
                      value={newPersonName}
                      onChange={(e) => setNewPersonName(e.target.value)}
                      placeholder="Nova pessoa..."
                      className="flex-1 bg-secondary/50 rounded-lg px-3 py-1.5 text-xs outline-none text-foreground placeholder-muted-foreground"
                      onKeyDown={(e) => e.key === 'Enter' && handleAddPerson()}
                    />
                    <button
                      onClick={handleAddPerson}
                      className="px-3 py-1.5 rounded-lg bg-primary/15 text-primary text-xs font-medium"
                    >
                      Adicionar
                    </button>
                  </div>
                </div>
              </motion.div>
            )}
          </AnimatePresence>
        </div>

        {/* Pagamento (só para despesa) */}
        {tab === 'despesa' && (
          <div className="bg-card rounded-2xl border border-border/50 overflow-hidden">
            <div className="flex items-center gap-3 px-4 py-3.5">
              <CreditCard className="w-5 h-5 text-muted-foreground shrink-0" />
              <div className="flex-1 flex bg-secondary/50 rounded-lg p-0.5">
                <button
                  onClick={() => { setPaymentType('avulso'); setSelectedCardId(''); }}
                  className={`flex-1 py-2 rounded-md text-xs font-semibold transition-all ${
                    paymentType === 'avulso' ? 'bg-card text-foreground shadow-sm' : 'text-muted-foreground'
                  }`}
                >
                  Avulso
                </button>
                <button
                  onClick={() => setPaymentType('cartao')}
                  className={`flex-1 py-2 rounded-md text-xs font-semibold transition-all ${
                    paymentType === 'cartao' ? 'bg-card text-foreground shadow-sm' : 'text-muted-foreground'
                  }`}
                >
                  Cartão
                </button>
              </div>
            </div>

            {/* Seletor de cartão */}
            <AnimatePresence>
              {paymentType === 'cartao' && (
                <motion.div
                  initial={{ height: 0, opacity: 0 }}
                  animate={{ height: 'auto', opacity: 1 }}
                  exit={{ height: 0, opacity: 0 }}
                  transition={{ duration: 0.2 }}
                  className="overflow-hidden"
                >
                  <div className="px-4 pb-3">
                    {creditCards.length === 0 ? (
                      <p className="text-xs text-muted-foreground text-center py-2">
                        Nenhum cartão de crédito cadastrado
                      </p>
                    ) : (
                      <div className="space-y-2">
                        <div className="flex flex-wrap gap-2">
                          {creditCards.map((card) => (
                            <button
                              key={card.id}
                              onClick={() => setSelectedCardId(card.id)}
                              className={`flex items-center gap-2 px-3 py-2 rounded-xl text-xs font-medium transition-all ${
                                selectedCardId === card.id
                                  ? 'ring-1 ring-primary/30 bg-primary/10 text-primary'
                                  : 'bg-secondary/50 text-muted-foreground hover:bg-secondary'
                              }`}
                            >
                              <div className="w-3 h-3 rounded-full" style={{ backgroundColor: card.color }} />
                              {card.name}
                            </button>
                          ))}
                        </div>

                        {/* Parcelas */}
                        <div className="flex items-center gap-2 pt-1">
                          <span className="text-xs text-muted-foreground">Parcelas:</span>
                          <input
                            type="number"
                            inputMode="numeric"
                            min="1"
                            max="48"
                            value={installments}
                            onChange={(e) => setInstallments(e.target.value)}
                            placeholder="1x"
                            className="w-16 bg-secondary/50 rounded-lg px-2 py-1.5 text-xs text-center outline-none text-foreground placeholder-muted-foreground"
                          />
                        </div>
                      </div>
                    )}
                  </div>
                </motion.div>
              )}
            </AnimatePresence>
          </div>
        )}

        {/* Tipo de receita (só para receita) */}
        {tab === 'receita' && (
          <div className="bg-card rounded-2xl border border-border/50 overflow-hidden">
            <div className="flex items-center gap-3 px-4 py-3.5">
              <Tag className="w-5 h-5 text-muted-foreground shrink-0" />
              <div className="flex-1 flex bg-secondary/50 rounded-lg p-0.5">
                <button
                  onClick={() => setIncomeType('fixed')}
                  className={`flex-1 py-2 rounded-md text-xs font-semibold transition-all ${
                    incomeType === 'fixed' ? 'bg-card text-foreground shadow-sm' : 'text-muted-foreground'
                  }`}
                >
                  Fixo
                </button>
                <button
                  onClick={() => setIncomeType('extra')}
                  className={`flex-1 py-2 rounded-md text-xs font-semibold transition-all ${
                    incomeType === 'extra' ? 'bg-card text-foreground shadow-sm' : 'text-muted-foreground'
                  }`}
                >
                  Extra
                </button>
              </div>
            </div>
          </div>
        )}

        {/* Data */}
        <div className="bg-card rounded-2xl border border-border/50 overflow-hidden">
          <Popover>
            <PopoverTrigger asChild>
              <button className="w-full flex items-center gap-3 px-4 py-3.5">
                <CalendarIcon className="w-5 h-5 text-muted-foreground shrink-0" />
                <span className="flex-1 text-left text-sm text-foreground">
                  {format(date, "dd 'de' MMMM, yyyy", { locale: ptBR })}
                </span>
                <ChevronDown className="w-4 h-4 text-muted-foreground" />
              </button>
            </PopoverTrigger>
            <PopoverContent className="w-auto p-0" align="center">
              <Calendar
                mode="single"
                selected={date}
                onSelect={(d) => d && setDate(d)}
                locale={ptBR}
                initialFocus
              />
            </PopoverContent>
          </Popover>
        </div>

        {/* Recorrente */}
        <div className="bg-card rounded-2xl border border-border/50 overflow-hidden">
          <button
            onClick={() => setIsRecurring(!isRecurring)}
            className="w-full flex items-center gap-3 px-4 py-3.5"
          >
            <RefreshCw className={`w-5 h-5 shrink-0 transition-colors ${isRecurring ? 'text-primary' : 'text-muted-foreground'}`} />
            <span className="flex-1 text-left text-sm text-foreground">Recorrente</span>
            <div className={`w-11 h-6 rounded-full p-0.5 transition-colors duration-200 ${isRecurring ? 'bg-primary' : 'bg-secondary'}`}>
              <motion.div
                layout
                className="w-5 h-5 rounded-full bg-white shadow-sm"
                animate={{ x: isRecurring ? 20 : 0 }}
                transition={{ type: 'spring', stiffness: 500, damping: 30 }}
              />
            </div>
          </button>

          <AnimatePresence>
            {isRecurring && tab === 'despesa' && (
              <motion.div
                initial={{ height: 0, opacity: 0 }}
                animate={{ height: 'auto', opacity: 1 }}
                exit={{ height: 0, opacity: 0 }}
                transition={{ duration: 0.2 }}
                className="overflow-hidden"
              >
                <div className="px-4 pb-3 flex gap-2">
                  <button
                    onClick={() => setFrequency('monthly')}
                    className={`flex-1 py-2 rounded-lg text-xs font-semibold transition-all ${
                      frequency === 'monthly'
                        ? 'bg-primary/15 text-primary ring-1 ring-primary/30'
                        : 'bg-secondary/50 text-muted-foreground'
                    }`}
                  >
                    Mensal
                  </button>
                  <button
                    onClick={() => setFrequency('weekly')}
                    className={`flex-1 py-2 rounded-lg text-xs font-semibold transition-all ${
                      frequency === 'weekly'
                        ? 'bg-primary/15 text-primary ring-1 ring-primary/30'
                        : 'bg-secondary/50 text-muted-foreground'
                    }`}
                  >
                    Semanal
                  </button>
                </div>
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      </motion.div>

      {/* Botão confirmar - fixo embaixo */}
      <motion.div
        initial={{ opacity: 0, y: 40 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.2 }}
        className="fixed bottom-0 left-0 right-0 p-4 bg-gradient-to-t from-background via-background to-transparent pt-8"
      >
        <button
          onClick={handleSubmit}
          disabled={isSubmitting || getNumericAmount() <= 0}
          className={`w-full py-4 rounded-2xl font-bold text-lg flex items-center justify-center gap-2 transition-all duration-200 ${
            getNumericAmount() > 0
              ? tab === 'despesa'
                ? 'bg-gradient-to-r from-[#0D1A6E] to-[#1A2FA8] text-white shadow-lg shadow-blue-500/25 hover:shadow-xl active:scale-[0.98]'
                : 'bg-gradient-to-r from-emerald-600 to-emerald-500 text-white shadow-lg shadow-emerald-500/25 hover:shadow-xl active:scale-[0.98]'
              : 'bg-secondary text-muted-foreground'
          }`}
        >
          {isSubmitting ? (
            <motion.div
              animate={{ rotate: 360 }}
              transition={{ duration: 1, repeat: Infinity, ease: 'linear' }}
            >
              <RefreshCw className="w-5 h-5" />
            </motion.div>
          ) : (
            <>
              <Check className="w-5 h-5" />
              {tab === 'despesa' ? 'Adicionar despesa' : 'Adicionar receita'}
            </>
          )}
        </button>
      </motion.div>
    </div>
  );
};

export default QuickAdd;
