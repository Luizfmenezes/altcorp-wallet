import React, { useState, useMemo } from 'react';
import { Plus, CreditCard, Building2, ChevronRight, Pencil, Trash2, CalendarDays, Info } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { BottomNav } from '@/components/BottomNav';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from '@/components/ui/alert-dialog';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { useFinance, Card } from '@/contexts/FinanceContext';
import { useToast } from '@/hooks/use-toast';

const CARD_COLORS = [
  { name: 'Roxo', value: '#8B5CF6' },
  { name: 'Azul', value: '#3B82F6' },
  { name: 'Verde', value: '#22C55E' },
  { name: 'Laranja', value: '#F97316' },
  { name: 'Rosa', value: '#EC4899' },
  { name: 'Cinza', value: '#6B7280' },
];

type FormData = {
  name: string;
  type: Card['type'];
  color: string;
  closingDay: string;
  dueDay: string;
};

const EMPTY_FORM: FormData = {
  name: '',
  type: 'credit',
  color: CARD_COLORS[0].value,
  closingDay: '',
  dueDay: '',
};

const MONTH_NAMES = [
  'Janeiro','Fevereiro','Março','Abril','Maio','Junho',
  'Julho','Agosto','Setembro','Outubro','Novembro','Dezembro',
];

/** Calcula o período da fatura com base no dia de fechamento */
const getInvoicePeriod = (closingDay: number) => {
  const today = new Date();
  const todayDay = today.getDate();
  const month = today.getMonth();
  const year = today.getFullYear();

  // Início = fechamento do mês anterior + 1 dia
  let startMonth = month - 1;
  let startYear = year;
  if (startMonth < 0) { startMonth = 11; startYear -= 1; }
  const startDay = closingDay + 1;
  // Normaliza start se closingDay == 31 e mês tem menos dias
  const startDate = new Date(startYear, startMonth, startDay);
  // Fim = fechamento atual
  const endDate = new Date(year, month, closingDay);

  // Se já passou do dia de fechamento, avança para o próximo ciclo
  if (todayDay > closingDay) {
    startDate.setMonth(startDate.getMonth() + 1);
    endDate.setMonth(endDate.getMonth() + 1);
  }

  const fmtDate = (d: Date) =>
    `${String(d.getDate()).padStart(2, '0')}/${String(d.getMonth() + 1).padStart(2, '0')}`;

  const invoiceMonthDate = new Date(endDate.getFullYear(), endDate.getMonth(), 1);
  const invoiceMonthName = MONTH_NAMES[invoiceMonthDate.getMonth()];

  return {
    start: fmtDate(startDate),
    end: fmtDate(endDate),
    invoiceMonthName,
    startDate,
    endDate,
  };
};

const InvoicePreview: React.FC<{ closingDay: number; dueDay?: number }> = ({ closingDay, dueDay }) => {
  const period = useMemo(() => getInvoicePeriod(closingDay), [closingDay]);

  return (
    <div className="mt-3 rounded-xl border border-primary/20 bg-primary/5 p-3 space-y-3">
      <div className="flex items-center gap-2 text-primary">
        <CalendarDays className="w-4 h-4 flex-shrink-0" />
        <span className="text-sm font-semibold">Prévia do ciclo de fatura</span>
      </div>

      {/* Timeline */}
      <div className="flex items-center gap-1">
        <div className="flex flex-col items-center">
          <div className="w-2.5 h-2.5 rounded-full bg-green-500" />
          <div className="text-[10px] text-muted-foreground mt-1 text-center leading-tight">
            Início<br/>{period.start}
          </div>
        </div>
        <div className="flex-1 h-px bg-border mx-1 relative top-[-6px]" />
        <div className="flex flex-col items-center">
          <div className="w-2.5 h-2.5 rounded-full bg-red-500" />
          <div className="text-[10px] text-muted-foreground mt-1 text-center leading-tight">
            Fechamento<br/>{period.end}
          </div>
        </div>
        {dueDay && (
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

      {/* Explicação */}
      <div className="flex gap-2 text-xs text-muted-foreground bg-background/60 rounded-lg p-2">
        <Info className="w-3.5 h-3.5 flex-shrink-0 mt-0.5 text-primary" />
        <span>
          Compras de <strong>{period.start}</strong> até <strong>{period.end}</strong> entram na fatura de{' '}
          <strong>{period.invoiceMonthName}</strong>.
          {dueDay && <> O pagamento vence no dia <strong>{dueDay}</strong>.</>}
        </span>
      </div>
    </div>
  );
};

const CardFormFields: React.FC<{ formData: FormData; setFormData: React.Dispatch<React.SetStateAction<FormData>> }> = ({ formData, setFormData }) => {
  const closingDayNum = Number.parseInt(formData.closingDay, 10);
  const dueDayNum = Number.parseInt(formData.dueDay, 10);
  const showPreview = formData.type === 'credit' && closingDayNum >= 1 && closingDayNum <= 31;

  return (
    <div className="space-y-4 mt-4">
      <Input
        placeholder="Nome (ex: Cartão Nubank)"
        value={formData.name}
        onChange={(e) => setFormData((prev) => ({ ...prev, name: e.target.value }))}
        className="input-finance"
      />
      <Select
        value={formData.type}
        onValueChange={(value: Card['type']) => setFormData((prev) => ({ ...prev, type: value }))}
      >
        <SelectTrigger className="input-finance">
          <SelectValue placeholder="Tipo" />
        </SelectTrigger>
        <SelectContent>
          <SelectItem value="credit">Cartão de Crédito</SelectItem>
          <SelectItem value="debit">Cartão de Débito</SelectItem>
          <SelectItem value="bank">Conta Bancária</SelectItem>
        </SelectContent>
      </Select>

      {formData.type === 'credit' && (
        <div className="space-y-3">
          <div>
            <p className="text-sm font-medium text-foreground mb-1">
              Dia de fechamento da fatura
            </p>
            <Input
              type="number"
              min={1}
              max={31}
              placeholder="Ex: 6"
              value={formData.closingDay}
              onChange={(e) => setFormData((prev) => ({ ...prev, closingDay: e.target.value }))}
              className="input-finance"
            />
            <p className="text-xs text-muted-foreground mt-1">
              Dia em que a fatura fecha e começa um novo ciclo de compras.
            </p>
          </div>

          <div>
            <p className="text-sm font-medium text-foreground mb-1">
              Dia de vencimento (pagamento)
            </p>
            <Input
              type="number"
              min={1}
              max={31}
              placeholder="Ex: 15"
              value={formData.dueDay}
              onChange={(e) => setFormData((prev) => ({ ...prev, dueDay: e.target.value }))}
              className="input-finance"
            />
            <p className="text-xs text-muted-foreground mt-1">
              Dia em que a fatura deve ser paga.
            </p>
          </div>

          {showPreview && (
            <InvoicePreview
              closingDay={closingDayNum}
              dueDay={dueDayNum >= 1 && dueDayNum <= 31 ? dueDayNum : undefined}
            />
          )}
        </div>
      )}

      <div>
        <p className="text-sm text-muted-foreground mb-2">Cor</p>
        <div className="flex gap-2 flex-wrap">
          {CARD_COLORS.map((color) => (
            <button
              key={color.value}
              onClick={() => setFormData((prev) => ({ ...prev, color: color.value }))}
              className={`w-10 h-10 rounded-xl transition-transform ${
                formData.color === color.value ? 'scale-110 ring-2 ring-foreground' : ''
              }`}
              style={{ backgroundColor: color.value }}
            />
          ))}
        </div>
      </div>
    </div>
  );
};

const Wallet: React.FC = () => {
  const { cards, addCard, updateCard, removeCard } = useFinance();
  const navigate = useNavigate();
  const { toast } = useToast();

  const [isCreateOpen, setIsCreateOpen] = useState(false);
  const [isEditOpen, setIsEditOpen] = useState(false);
  const [isDeleteOpen, setIsDeleteOpen] = useState(false);
  const [editingCard, setEditingCard] = useState<Card | null>(null);
  const [formData, setFormData] = useState(EMPTY_FORM);

  const formatCurrency = (amount: number) =>
    new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(amount);

  const getCardTotal = (card: Card) => {
    const today = new Date();
    const todayYear = today.getFullYear();
    const todayMonth = today.getMonth(); // 0-based

    return card.invoiceItems
      .filter(item => {
        const [itemYearStr, itemMonthStr] = item.date.split('-');
        const itemYear = parseInt(itemYearStr, 10);
        const itemMonth = parseInt(itemMonthStr, 10) - 1; // converter para 0-based

        // Verificar se a fatura desse mês/ano já foi paga
        const isPaid = (card.paidInvoices ?? []).some(
          p => p.month === itemMonth && p.year === itemYear
        );
        if (isPaid) return false;

        // Verificar se é um mês passado cuja fatura já venceu
        if (itemYear < todayYear) return false;
        if (itemYear === todayYear && itemMonth < todayMonth) {
          // Mês passado: só excluir se o dueDay já passou
          // Como é mês passado, a data de vencimento já passou com certeza
          return false;
        }
        // Mês atual ou futuro: incluir
        return true;
      })
      .reduce((sum, item) => sum + item.amount, 0);
  };

  const parseDayField = (val: string) => {
    const n = Number.parseInt(val, 10);
    return n >= 1 && n <= 31 ? n : undefined;
  };

  const handleCreate = async () => {
    if (!formData.name.trim()) {
      toast({ title: 'Erro', description: 'Informe o nome do cartão/banco.', variant: 'destructive' });
      return;
    }
    await addCard({
      name: formData.name.trim(),
      type: formData.type,
      color: formData.color,
      closingDay: parseDayField(formData.closingDay),
      dueDay: parseDayField(formData.dueDay),
    });
    toast({ title: 'Sucesso', description: 'Cartão cadastrado!' });
    setFormData(EMPTY_FORM);
    setIsCreateOpen(false);
  };

  const openEdit = (card: Card, e: React.MouseEvent) => {
    e.stopPropagation();
    setEditingCard(card);
    setFormData({
      name: card.name,
      type: card.type,
      color: card.color,
      closingDay: card.closingDay ? String(card.closingDay) : '',
      dueDay: card.dueDay ? String(card.dueDay) : '',
    });
    setIsEditOpen(true);
  };

  const handleEdit = async () => {
    if (!editingCard || !formData.name.trim()) return;
    await updateCard(editingCard.id, {
      name: formData.name.trim(),
      type: formData.type,
      color: formData.color,
      closingDay: parseDayField(formData.closingDay) ?? null,
      dueDay: parseDayField(formData.dueDay) ?? null,
    });
    toast({ title: 'Sucesso', description: 'Cartão atualizado!' });
    setIsEditOpen(false);
    setEditingCard(null);
    setFormData(EMPTY_FORM);
  };

  const openDelete = (card: Card, e: React.MouseEvent) => {
    e.stopPropagation();
    setEditingCard(card);
    setIsDeleteOpen(true);
  };

  const handleDelete = async () => {
    if (!editingCard) return;
    await removeCard(editingCard.id);
    toast({ title: 'Removido', description: `${editingCard.name} foi excluído.` });
    setIsDeleteOpen(false);
    setEditingCard(null);
  };

  const getCardIcon = (type: Card['type']) =>
    type === 'bank' ? <Building2 className="w-6 h-6" /> : <CreditCard className="w-6 h-6" />;

  const getCardTypeLabel = (type: Card['type']) => {
    switch (type) {
      case 'credit': return 'Crédito';
      case 'debit': return 'Débito';
      case 'bank': return 'Conta';
    }
  };

  return (
    <div className="min-h-screen bg-background pb-24 md:pt-16 md:pb-8">
      <header className="bg-primary text-primary-foreground p-6 pb-8 rounded-b-3xl md:rounded-none">
        <div className="max-w-7xl mx-auto">
          <h1 className="text-xl md:text-2xl font-bold text-center tracking-wide">
            CARTÕES E BANCOS
          </h1>
        </div>
      </header>

      <div className="px-4 md:px-6 lg:px-8 -mt-4 max-w-7xl mx-auto">
        {cards.length === 0 ? (
          <div className="card-finance text-center py-8 animate-fade-in">
            <CreditCard className="w-12 h-12 text-muted-foreground mx-auto mb-3" />
            <p className="text-muted-foreground">Nenhum cartão cadastrado</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-3 md:gap-4">
            {cards.map((card, index) => (
              <div
                key={card.id}
                className="card-finance relative flex items-center gap-4 animate-fade-in group"
                style={{ animationDelay: `${index * 0.05}s` }}
              >
                <button
                  type="button"
                  className="absolute inset-0 z-0 cursor-pointer"
                  aria-label={`Ver detalhes de ${card.name}`}
                  onClick={() => navigate(`/wallet/${card.id}`)}
                />
                <div
                  className="w-12 h-12 rounded-xl flex items-center justify-center text-white flex-shrink-0"
                  style={{ backgroundColor: card.color }}
                >
                  {getCardIcon(card.type)}
                </div>
                <div className="flex-1 text-left min-w-0">
                  <p className="font-semibold text-foreground truncate">{card.name}</p>
                  <p className="text-sm text-muted-foreground">
                    {getCardTypeLabel(card.type)}
                    {` • ${card.invoiceItems.length} ${card.invoiceItems.length === 1 ? 'item' : 'itens'}`}
                  </p>
                </div>
                <div className="flex items-center gap-1 flex-shrink-0 z-10">
                  <p className="font-semibold text-destructive mr-1">
                    {formatCurrency(getCardTotal(card))}
                  </p>
                  <button
                    type="button"
                    onClick={(e) => openEdit(card, e)}
                    className="p-2 rounded-lg text-muted-foreground hover:text-primary hover:bg-primary/10 opacity-0 group-hover:opacity-100 transition-all"
                    title="Editar"
                  >
                    <Pencil className="w-4 h-4" />
                  </button>
                  <button
                    type="button"
                    onClick={(e) => openDelete(card, e)}
                    className="p-2 rounded-lg text-muted-foreground hover:text-destructive hover:bg-destructive/10 opacity-0 group-hover:opacity-100 transition-all"
                    title="Excluir"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                  <ChevronRight className="w-5 h-5 text-muted-foreground" />
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Criar Cartão */}
      <Dialog open={isCreateOpen} onOpenChange={(open) => { setIsCreateOpen(open); if (!open) setFormData(EMPTY_FORM); }}>
        <DialogTrigger asChild>
          <button className="floating-button shadow-floating md:bottom-8 md:right-8">
            <Plus className="w-6 h-6" />
          </button>
        </DialogTrigger>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>Cadastrar Novo Cartão</DialogTitle>
          </DialogHeader>
          <CardFormFields formData={formData} setFormData={setFormData} />
          <Button onClick={handleCreate} className="w-full h-12 rounded-xl">Cadastrar</Button>
        </DialogContent>
      </Dialog>

      {/* Editar Cartão */}
      <Dialog open={isEditOpen} onOpenChange={(open) => { setIsEditOpen(open); if (!open) { setEditingCard(null); setFormData(EMPTY_FORM); } }}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>Editar Cartão</DialogTitle>
          </DialogHeader>
          <CardFormFields formData={formData} setFormData={setFormData} />
          <Button onClick={handleEdit} className="w-full h-12 rounded-xl">Salvar Alterações</Button>
        </DialogContent>
      </Dialog>

      {/* Confirmar Exclusão */}
      <AlertDialog open={isDeleteOpen} onOpenChange={setIsDeleteOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Excluir cartão?</AlertDialogTitle>
            <AlertDialogDescription>
              {editingCard && (
                <>
                  <strong>{editingCard.name}</strong> será removido permanentemente
                  {editingCard.invoiceItems.length > 0 && (
                    <> junto com <strong>{editingCard.invoiceItems.length}</strong> itens de fatura</>
                  )}.
                  Esta ação não pode ser desfeita.
                </>
              )}
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancelar</AlertDialogCancel>
            <AlertDialogAction onClick={handleDelete} className="bg-destructive text-destructive-foreground hover:bg-destructive/90">
              Excluir
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      <BottomNav />
    </div>
  );
};

export default Wallet;
