import React, { useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { ArrowLeft, Plus, Trash2, Upload, CreditCard, Building2, Users, Pencil, FileText, ChevronLeft, ChevronRight } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Switch } from '@/components/ui/switch';
import { Label } from '@/components/ui/label';
import { useFinance, Card, getMonthName, InvoiceItem } from '@/contexts/FinanceContext';
import { useToast } from '@/hooks/use-toast';
import CSVImportDialog from '@/components/CSVImportDialog';
import PDFExportDialog from '@/components/PDFExportDialog';
const CATEGORIES = [
  'Alimentação',
  'Transporte',
  'Moradia',
  'Saúde',
  'Educação',
  'Lazer',
  'Streaming',
  'Serviços',
  'Compras',
  'Outros',
];

const MONTHS = Array.from({ length: 12 }, (_, i) => i);
const YEARS = Array.from({ length: 10 }, (_, i) => new Date().getFullYear() - 5 + i);

const CardDetail: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { cards, people, addInvoiceItem, updateInvoiceItem, removeInvoiceItem, importCSV, addPerson, updateCard, removeCard } = useFinance();
  const { toast } = useToast();

  const card = cards.find((c) => c.id === id);

  const [selectedMonth, setSelectedMonth] = useState(new Date().getMonth());
  const [selectedYear, setSelectedYear] = useState(new Date().getFullYear());
  const [isAddDialogOpen, setIsAddDialogOpen] = useState(false);
  const [isEditDialogOpen, setIsEditDialogOpen] = useState(false);
  const [isImportDialogOpen, setIsImportDialogOpen] = useState(false);
  const [isExportDialogOpen, setIsExportDialogOpen] = useState(false);
  const [isAddPersonOpen, setIsAddPersonOpen] = useState(false);
  const [isEditCardDialogOpen, setIsEditCardDialogOpen] = useState(false);
  const [isDeleteCardDialogOpen, setIsDeleteCardDialogOpen] = useState(false);
  const [deleteConfirmName, setDeleteConfirmName] = useState('');
  const [newPersonName, setNewPersonName] = useState('');
  const [editingItem, setEditingItem] = useState<InvoiceItem | null>(null);
  
  const [editCardData, setEditCardData] = useState({
    name: card?.name || '',
    color: card?.color || '#8b5cf6',
  });
  
  const [newItem, setNewItem] = useState({
    date: new Date().toISOString().split('T')[0],
    description: '',
    category: CATEGORIES[0],
    amount: '',
    owner: 'Eu',
    isInstallment: false,
    installments: '2',
    isRecurring: false,
    frequency: 'monthly' as 'monthly' | 'weekly',
    splitBetween: [] as string[],
    totalAmount: '',
  });

  const [editItem, setEditItem] = useState({
    date: '',
    description: '',
    category: '',
    amount: '',
    owner: '',
  });

  if (!card) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="text-center">
          <p className="text-muted-foreground">Cartão não encontrado</p>
          <Button onClick={() => navigate('/wallet')} className="mt-4">
            Voltar
          </Button>
        </div>
      </div>
    );
  }

  // Filter items by selected month/year
  const filteredItems = card.invoiceItems.filter((item) => {
    const itemDate = new Date(item.date);
    return itemDate.getMonth() === selectedMonth && itemDate.getFullYear() === selectedYear;
  });

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('pt-BR', {
      style: 'currency',
      currency: 'BRL',
    }).format(amount);
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('pt-BR');
  };

  const getCardIcon = (type: Card['type']) => {
    switch (type) {
      case 'bank':
        return <Building2 className="w-6 h-6" />;
      default:
        return <CreditCard className="w-6 h-6" />;
    }
  };

  // Calculate totals by owner
  const ownerTotals = filteredItems.reduce((acc, item) => {
    const owner = item.owner || 'Eu';
    acc[owner] = (acc[owner] || 0) + item.amount;
    return acc;
  }, {} as Record<string, number>);

  const handleAddItem = () => {
    if (!newItem.description || !newItem.amount) {
      toast({
        title: 'Erro',
        description: 'Preencha todos os campos.',
        variant: 'destructive',
      });
      return;
    }

    const installments = newItem.isInstallment ? parseInt(newItem.installments) : undefined;

    // Check if splitting between multiple people
    if (newItem.splitBetween.length > 0) {
      const totalAmount = parseFloat(newItem.totalAmount || newItem.amount);
      const splitCount = newItem.splitBetween.length;
      const amountPerPerson = totalAmount / splitCount;

      // Add one item for each person
      newItem.splitBetween.forEach(person => {
        addInvoiceItem(
          card.id,
          {
            date: newItem.date,
            description: `${newItem.description} (dividido)`,
            category: newItem.category,
            amount: amountPerPerson,
            owner: person,
            isRecurring: newItem.isRecurring,
            frequency: newItem.frequency,
          },
          installments
        );
      });

      toast({
        title: 'Sucesso',
        description: `Item dividido entre ${splitCount} ${splitCount === 1 ? 'pessoa' : 'pessoas'}!`,
      });
    } else {
      // Normal add without splitting
      addInvoiceItem(
        card.id,
        {
          date: newItem.date,
          description: newItem.description,
          category: newItem.category,
          amount: parseFloat(newItem.amount),
          owner: newItem.owner,
          isRecurring: newItem.isRecurring,
          frequency: newItem.frequency,
        },
        installments
      );

      const message = installments && installments > 1 
        ? `Item parcelado em ${installments}x adicionado com sucesso!`
        : 'Item adicionado com sucesso!';

      toast({
        title: 'Sucesso',
        description: message,
      });
    }

    setNewItem({
      date: new Date().toISOString().split('T')[0],
      description: '',
      category: CATEGORIES[0],
      amount: '',
      owner: 'Eu',
      isInstallment: false,
      installments: '2',
      isRecurring: false,
      frequency: 'monthly',
      splitBetween: [],
      totalAmount: '',
    });
    setIsAddDialogOpen(false);
  };

  const handleEditItem = () => {
    if (!editingItem || !editItem.description || !editItem.amount) {
      toast({
        title: 'Erro',
        description: 'Preencha todos os campos.',
        variant: 'destructive',
      });
      return;
    }

    updateInvoiceItem(card.id, editingItem.id, {
      date: editItem.date,
      description: editItem.description,
      category: editItem.category,
      amount: parseFloat(editItem.amount),
      owner: editItem.owner,
    });

    toast({
      title: 'Sucesso',
      description: 'Item atualizado com sucesso!',
    });

    setIsEditDialogOpen(false);
    setEditingItem(null);
  };

  const openEditDialog = (item: InvoiceItem) => {
    setEditingItem(item);
    setEditItem({
      date: item.date,
      description: item.description,
      category: item.category,
      amount: item.amount.toString(),
      owner: item.owner,
    });
    setIsEditDialogOpen(true);
  };

  const handleRemoveItem = (itemId: string) => {
    removeInvoiceItem(card.id, itemId);
    toast({
      title: 'Removido',
      description: 'Item removido com sucesso.',
    });
  };

  // Navigate months
  const goToPreviousMonth = () => {
    if (selectedMonth === 0) {
      setSelectedMonth(11);
      setSelectedYear(selectedYear - 1);
    } else {
      setSelectedMonth(selectedMonth - 1);
    }
  };

  const goToNextMonth = () => {
    if (selectedMonth === 11) {
      setSelectedMonth(0);
      setSelectedYear(selectedYear + 1);
    } else {
      setSelectedMonth(selectedMonth + 1);
    }
  };

  const handleAddPerson = () => {
    if (newPersonName.trim()) {
      addPerson(newPersonName.trim());
      setNewItem({ ...newItem, owner: newPersonName.trim() });
      setNewPersonName('');
      setIsAddPersonOpen(false);
      toast({
        title: 'Sucesso',
        description: 'Pessoa adicionada com sucesso!',
      });
    }
  };

  const handleCSVImport = (items: { date: string; description: string; category: string; amount: number; owner: string }[]) => {
    if (items.length > 0) {
      importCSV(card.id, items);
      toast({
        title: 'Sucesso',
        description: `${items.length} itens importados com sucesso!`,
      });
      setIsImportDialogOpen(false);
    }
  };

  const handleEditCard = () => {
    if (!editCardData.name.trim()) {
      toast({
        title: 'Erro',
        description: 'O nome do cartão não pode estar vazio.',
        variant: 'destructive',
      });
      return;
    }

    updateCard(card.id, {
      name: editCardData.name,
      color: editCardData.color,
    });

    toast({
      title: 'Sucesso',
      description: 'Cartão atualizado com sucesso!',
    });

    setIsEditCardDialogOpen(false);
  };

  const handleDeleteCard = () => {
    if (deleteConfirmName.trim().toLowerCase() !== card.name.toLowerCase()) {
      toast({
        title: 'Erro',
        description: 'O nome do cartão não corresponde. Digite exatamente o nome para confirmar.',
        variant: 'destructive',
      });
      return;
    }

    removeCard(card.id);
    
    toast({
      title: 'Removido',
      description: 'Cartão removido com sucesso.',
    });

    navigate('/wallet');
  };

  const totalAmount = filteredItems.reduce((sum, item) => sum + item.amount, 0);

  return (
    <div className="min-h-screen bg-background pb-8">
      {/* Header */}
      <header
        className="text-white p-6 pb-8 rounded-b-3xl"
        style={{ backgroundColor: card.color }}
      >
        <div className="max-w-7xl mx-auto">
          <div className="flex items-center gap-4 mb-4">
            <Button
              variant="ghost"
              size="icon"
              onClick={() => navigate('/wallet')}
              className="text-white hover:bg-white/20"
            >
              <ArrowLeft className="w-5 h-5" />
            </Button>
            <div className="flex-1">
              <h1 className="text-xl md:text-2xl font-bold">{card.name}</h1>
            </div>
            <div className="flex items-center gap-2">
              <Button
                variant="ghost"
                size="icon"
                onClick={() => {
                  setEditCardData({ name: card.name, color: card.color });
                  setIsEditCardDialogOpen(true);
                }}
                className="text-white hover:bg-white/20"
                title="Editar cartão"
              >
                <Pencil className="w-5 h-5" />
              </Button>
              <Button
                variant="ghost"
                size="icon"
                onClick={() => setIsDeleteCardDialogOpen(true)}
                className="text-white hover:bg-white/20 hover:bg-red-500/30"
                title="Deletar cartão"
              >
                <Trash2 className="w-5 h-5" />
              </Button>
              {getCardIcon(card.type)}
            </div>
          </div>
          <div className="bg-white/20 rounded-2xl p-4 md:max-w-md">
            <p className="text-white/80 text-sm">Total da Fatura - {getMonthName(selectedMonth)}</p>
            <p className="text-2xl md:text-3xl font-bold">{formatCurrency(totalAmount)}</p>
          </div>
        </div>
      </header>

      {/* Content */}
      <div className="px-4 md:px-6 lg:px-8 -mt-4 space-y-4 max-w-7xl mx-auto">
        {/* Month/Year Navigation with Arrows */}
        <div className="card-finance animate-fade-in">
          <div className="flex items-center justify-between gap-3">
            <Button
              variant="ghost"
              size="icon"
              onClick={goToPreviousMonth}
              className="h-10 w-10 rounded-full bg-primary/10 hover:bg-primary/20"
            >
              <ChevronLeft className="w-5 h-5" />
            </Button>
            
            <div className="flex items-center gap-2">
              <span className="text-sm text-muted-foreground">Fatura de</span>
              <span className="text-lg font-semibold">
                {getMonthName(selectedMonth)} {selectedYear}
              </span>
            </div>
            
            <Button
              variant="ghost"
              size="icon"
              onClick={goToNextMonth}
              className="h-10 w-10 rounded-full bg-primary/10 hover:bg-primary/20"
            >
              <ChevronRight className="w-5 h-5" />
            </Button>
          </div>
        </div>

        {/* Shared Spend Summary */}
        {Object.keys(ownerTotals).length > 0 && (
          <div className="card-finance animate-fade-in" style={{ animationDelay: '0.05s' }}>
            <div className="flex items-center gap-2 mb-3">
              <Users className="w-5 h-5 text-primary" />
              <h2 className="font-semibold text-foreground">Gastos por Titular</h2>
            </div>
            <div className="flex flex-wrap gap-3">
              {Object.entries(ownerTotals).map(([owner, total]) => (
                <div
                  key={owner}
                  className="flex items-center gap-2 px-4 py-2 bg-secondary/50 rounded-xl"
                >
                  <span className="text-sm font-medium text-foreground">{owner}:</span>
                  <span className="text-sm font-bold text-destructive">{formatCurrency(total)}</span>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Action Buttons */}
        <div className="flex gap-2 md:max-w-md">
          <Dialog open={isAddDialogOpen} onOpenChange={setIsAddDialogOpen}>
            <DialogTrigger asChild>
              <Button className="flex-1 h-10 md:h-12 rounded-xl text-xs md:text-sm px-2 md:px-4">
                <Plus className="w-4 h-4 md:w-5 md:h-5 md:mr-2" />
                <span className="hidden sm:inline">Adicionar Item</span>
                <span className="sm:hidden">Adicionar</span>
              </Button>
            </DialogTrigger>
            <DialogContent className="sm:max-w-md max-h-[90vh] overflow-y-auto">
              <DialogHeader>
                <DialogTitle>Adicionar Item</DialogTitle>
              </DialogHeader>
              <div className="space-y-4 mt-4">
                <Input
                  type="date"
                  value={newItem.date}
                  onChange={(e) => setNewItem({ ...newItem, date: e.target.value })}
                  className="input-finance"
                />
                <Input
                  placeholder="Descrição"
                  value={newItem.description}
                  onChange={(e) => setNewItem({ ...newItem, description: e.target.value })}
                  className="input-finance"
                />
                <Select
                  value={newItem.category}
                  onValueChange={(value) => setNewItem({ ...newItem, category: value })}
                >
                  <SelectTrigger className="input-finance">
                    <SelectValue placeholder="Categoria" />
                  </SelectTrigger>
                  <SelectContent className="bg-background border shadow-lg z-50">
                    {CATEGORIES.map((cat) => (
                      <SelectItem key={cat} value={cat}>
                        {cat}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                <Input
                  type="number"
                  placeholder="Valor Total"
                  value={newItem.amount}
                  onChange={(e) => setNewItem({ ...newItem, amount: e.target.value })}
                  className="input-finance"
                />
                
                {/* Person Selector with Add Button */}
                <div className="space-y-2">
                  <Label className="text-sm font-medium">Titular da Compra</Label>
                  <div className="flex gap-2">
                    <Select
                      value={newItem.owner}
                      onValueChange={(value) => setNewItem({ ...newItem, owner: value })}
                    >
                      <SelectTrigger className="input-finance flex-1">
                        <SelectValue placeholder="Selecione" />
                      </SelectTrigger>
                      <SelectContent className="bg-background border shadow-lg z-50">
                        {people.map((person) => (
                          <SelectItem key={person} value={person}>
                            {person}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                    <Dialog open={isAddPersonOpen} onOpenChange={setIsAddPersonOpen}>
                      <DialogTrigger asChild>
                        <Button variant="outline" size="icon" className="h-11 w-11 rounded-xl shrink-0">
                          <Plus className="w-4 h-4" />
                        </Button>
                      </DialogTrigger>
                      <DialogContent className="sm:max-w-xs">
                        <DialogHeader>
                          <DialogTitle>Adicionar Pessoa</DialogTitle>
                        </DialogHeader>
                        <div className="space-y-4 mt-4">
                          <Input
                            placeholder="Nome da pessoa"
                            value={newPersonName}
                            onChange={(e) => setNewPersonName(e.target.value)}
                            className="input-finance"
                          />
                          <Button onClick={handleAddPerson} className="w-full h-11 rounded-xl">
                            Adicionar
                          </Button>
                        </div>
                      </DialogContent>
                    </Dialog>
                  </div>
                </div>

                {/* Split Payment Toggle */}
                <div className="space-y-3 p-4 bg-secondary/30 rounded-xl">
                  <div className="flex items-center justify-between">
                    <Label htmlFor="split-toggle" className="text-sm font-medium cursor-pointer">
                      Dividir Conta?
                    </Label>
                    <Switch
                      id="split-toggle"
                      checked={newItem.splitBetween.length > 0}
                      onCheckedChange={(checked) => {
                        if (checked) {
                          setNewItem({ ...newItem, splitBetween: [newItem.owner], totalAmount: newItem.amount });
                        } else {
                          setNewItem({ ...newItem, splitBetween: [], totalAmount: '' });
                        }
                      }}
                    />
                  </div>
                  
                  {newItem.splitBetween.length > 0 && (
                    <div className="space-y-3 animate-fade-in">
                      <div className="space-y-2">
                        <Label className="text-xs text-muted-foreground">Valor Total da Conta</Label>
                        <Input
                          type="number"
                          placeholder="0.00"
                          value={newItem.totalAmount}
                          onChange={(e) => setNewItem({ ...newItem, totalAmount: e.target.value })}
                          className="input-finance"
                        />
                      </div>
                      
                      <div className="space-y-2">
                        <Label className="text-xs text-muted-foreground">Dividir entre:</Label>
                        <div className="flex flex-wrap gap-2">
                          {people.map((person) => (
                            <Button
                              key={person}
                              type="button"
                              variant={newItem.splitBetween.includes(person) ? "default" : "outline"}
                              size="sm"
                              onClick={() => {
                                const isSelected = newItem.splitBetween.includes(person);
                                if (isSelected) {
                                  setNewItem({
                                    ...newItem,
                                    splitBetween: newItem.splitBetween.filter(p => p !== person)
                                  });
                                } else {
                                  setNewItem({
                                    ...newItem,
                                    splitBetween: [...newItem.splitBetween, person]
                                  });
                                }
                              }}
                              className="rounded-xl"
                            >
                              {person}
                            </Button>
                          ))}
                        </div>
                      </div>
                      
                      {newItem.totalAmount && newItem.splitBetween.length > 0 && (
                        <div className="p-3 bg-primary/10 rounded-xl">
                          <p className="text-xs text-muted-foreground mb-1">Valor por pessoa:</p>
                          <p className="text-lg font-bold text-primary">
                            {formatCurrency(parseFloat(newItem.totalAmount) / newItem.splitBetween.length)}
                          </p>
                          <p className="text-xs text-muted-foreground mt-1">
                            {newItem.splitBetween.length} {newItem.splitBetween.length === 1 ? 'pessoa' : 'pessoas'} selecionada(s)
                          </p>
                        </div>
                      )}
                    </div>
                  )}
                </div>

                {/* Recurring Purchase Toggle */}
                <div className="space-y-3 p-4 bg-secondary/30 rounded-xl">
                  <div className="flex items-center justify-between">
                    <Label htmlFor="recurring-toggle" className="text-sm font-medium cursor-pointer">
                      Compra Recorrente?
                    </Label>
                    <Switch
                      id="recurring-toggle"
                      checked={newItem.isRecurring}
                      onCheckedChange={(checked) => setNewItem({ ...newItem, isRecurring: checked })}
                    />
                  </div>
                  
                  {newItem.isRecurring && (
                    <div className="space-y-2 animate-fade-in">
                      <Label className="text-xs text-muted-foreground">Frequência</Label>
                      <Select
                        value={newItem.frequency}
                        onValueChange={(value: 'monthly' | 'weekly') => setNewItem({ ...newItem, frequency: value })}
                      >
                        <SelectTrigger className="input-finance">
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent className="bg-background border shadow-lg z-50">
                          <SelectItem value="monthly">Mensal</SelectItem>
                          <SelectItem value="weekly">Semanal</SelectItem>
                        </SelectContent>
                      </Select>
                      <p className="text-xs text-muted-foreground">
                        Esta compra será duplicada automaticamente todo mês.
                      </p>
                    </div>
                  )}
                </div>

                {/* Installment Toggle */}
                <div className="space-y-3 p-4 bg-secondary/30 rounded-xl">
                  <div className="flex items-center justify-between">
                    <Label htmlFor="installment-toggle" className="text-sm font-medium cursor-pointer">
                      Compra Parcelada?
                    </Label>
                    <Switch
                      id="installment-toggle"
                      checked={newItem.isInstallment}
                      onCheckedChange={(checked) => setNewItem({ ...newItem, isInstallment: checked })}
                    />
                  </div>
                  
                  {newItem.isInstallment && (
                    <div className="space-y-2 animate-fade-in">
                      <Label className="text-xs text-muted-foreground">Quantidade de Parcelas</Label>
                      <Select
                        value={newItem.installments}
                        onValueChange={(value) => setNewItem({ ...newItem, installments: value })}
                      >
                        <SelectTrigger className="input-finance">
                          <SelectValue placeholder="Parcelas" />
                        </SelectTrigger>
                        <SelectContent className="bg-background border shadow-lg z-50">
                          {Array.from({ length: 12 }, (_, i) => i + 2).map((num) => (
                            <SelectItem key={num} value={num.toString()}>
                              {num}x de {newItem.amount ? formatCurrency(parseFloat(newItem.amount) / num) : 'R$ 0,00'}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                      {newItem.amount && (
                        <p className="text-xs text-muted-foreground">
                          As parcelas serão criadas automaticamente nos próximos meses.
                        </p>
                      )}
                    </div>
                  )}
                </div>

                <Button onClick={handleAddItem} className="w-full h-12 rounded-xl">
                  {newItem.splitBetween.length > 0 
                    ? `Adicionar (dividido entre ${newItem.splitBetween.length})` 
                    : newItem.isInstallment 
                      ? `Adicionar em ${newItem.installments}x` 
                      : 'Adicionar'}
                </Button>
              </div>
            </DialogContent>
          </Dialog>

          <Button 
            variant="outline" 
            className="flex-1 h-10 md:h-12 rounded-xl text-xs md:text-sm px-2 md:px-4"
            onClick={() => setIsImportDialogOpen(true)}
          >
            <Upload className="w-4 h-4 md:w-5 md:h-5 md:mr-2" />
            <span className="hidden sm:inline">Importar CSV</span>
            <span className="sm:hidden">Importar</span>
          </Button>

          <Button 
            variant="outline" 
            className="flex-1 h-10 md:h-12 rounded-xl text-xs md:text-sm px-2 md:px-4"
            onClick={() => setIsExportDialogOpen(true)}
          >
            <FileText className="w-4 h-4 md:w-5 md:h-5 md:mr-2" />
            <span className="hidden sm:inline">Exportar PDF</span>
            <span className="sm:hidden">Exportar</span>
          </Button>
        </div>

        {/* CSV Import Dialog */}
        <CSVImportDialog
          open={isImportDialogOpen}
          onOpenChange={setIsImportDialogOpen}
          onImport={handleCSVImport}
        />

        {/* PDF Export Dialog */}
        <PDFExportDialog
          open={isExportDialogOpen}
          onOpenChange={setIsExportDialogOpen}
          card={card}
          items={filteredItems}
          month={selectedMonth}
          year={selectedYear}
          ownerTotals={ownerTotals}
        />

        {/* Edit Dialog */}
        <Dialog open={isEditDialogOpen} onOpenChange={setIsEditDialogOpen}>
          <DialogContent className="sm:max-w-md">
            <DialogHeader>
              <DialogTitle>Editar Item</DialogTitle>
            </DialogHeader>
            <div className="space-y-4 mt-4">
              <Input
                type="date"
                value={editItem.date}
                onChange={(e) => setEditItem({ ...editItem, date: e.target.value })}
                className="input-finance"
              />
              <Input
                placeholder="Descrição"
                value={editItem.description}
                onChange={(e) => setEditItem({ ...editItem, description: e.target.value })}
                className="input-finance"
              />
              <Select
                value={editItem.category}
                onValueChange={(value) => setEditItem({ ...editItem, category: value })}
              >
                <SelectTrigger className="input-finance">
                  <SelectValue placeholder="Categoria" />
                </SelectTrigger>
                <SelectContent className="bg-background border shadow-lg z-50">
                  {CATEGORIES.map((cat) => (
                    <SelectItem key={cat} value={cat}>
                      {cat}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              <Input
                type="number"
                placeholder="Valor"
                value={editItem.amount}
                onChange={(e) => setEditItem({ ...editItem, amount: e.target.value })}
                className="input-finance"
              />
              <Select
                value={editItem.owner}
                onValueChange={(value) => setEditItem({ ...editItem, owner: value })}
              >
                <SelectTrigger className="input-finance">
                  <SelectValue placeholder="Titular" />
                </SelectTrigger>
                <SelectContent className="bg-background border shadow-lg z-50">
                  {people.map((person) => (
                    <SelectItem key={person} value={person}>
                      {person}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              <Button onClick={handleEditItem} className="w-full h-12 rounded-xl">
                Salvar Alterações
              </Button>
            </div>
          </DialogContent>
        </Dialog>

        {/* Invoice Items */}
        <section className="card-finance">
          <h2 className="font-semibold text-foreground mb-4">Fatura</h2>
          
          {filteredItems.length === 0 ? (
            <p className="text-sm text-muted-foreground text-center py-8">
              Nenhum item na fatura deste mês
            </p>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-2 md:gap-3">
              {filteredItems.map((item, index) => (
                <div
                  key={item.id}
                  className="flex items-center justify-between p-3 bg-secondary/50 rounded-xl animate-fade-in cursor-pointer hover:bg-secondary/70 transition-colors"
                  style={{ animationDelay: `${index * 0.03}s` }}
                  onClick={() => openEditDialog(item)}
                >
                  <div className="flex-1 min-w-0">
                    <p className="font-medium text-foreground truncate">
                      {item.description}
                    </p>
                    <div className="flex items-center gap-2 text-xs text-muted-foreground flex-wrap">
                      <span>{formatDate(item.date)}</span>
                      <span>•</span>
                      <span className="px-2 py-0.5 bg-primary/10 text-primary rounded-full">
                        {item.category}
                      </span>
                      {item.owner && (
                        <>
                          <span>•</span>
                          <span className="px-2 py-0.5 bg-warning/10 text-warning rounded-full">
                            {item.owner}
                          </span>
                        </>
                      )}
                      {item.installmentInfo && (
                        <>
                          <span>•</span>
                          <span className="px-2 py-0.5 bg-blue-500/10 text-blue-500 rounded-full">
                            Parcela {item.installmentInfo.currentInstallment}/{item.installmentInfo.totalInstallments}
                          </span>
                        </>
                      )}
                    </div>
                  </div>
                  <div className="flex items-center gap-2 ml-2">
                    <p className="font-semibold text-destructive whitespace-nowrap">
                      {formatCurrency(item.amount)}
                    </p>
                    <Button
                      variant="ghost"
                      size="icon"
                      onClick={(e) => {
                        e.stopPropagation();
                        openEditDialog(item);
                      }}
                      className="h-8 w-8 text-muted-foreground hover:text-primary"
                    >
                      <Pencil className="w-4 h-4" />
                    </Button>
                    <Button
                      variant="ghost"
                      size="icon"
                      onClick={(e) => {
                        e.stopPropagation();
                        handleRemoveItem(item.id);
                      }}
                      className="h-8 w-8 text-muted-foreground hover:text-destructive"
                    >
                      <Trash2 className="w-4 h-4" />
                    </Button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </section>

        {/* Edit Card Dialog */}
        <Dialog open={isEditCardDialogOpen} onOpenChange={setIsEditCardDialogOpen}>
          <DialogContent className="sm:max-w-md">
            <DialogHeader>
              <DialogTitle>Editar Cartão</DialogTitle>
            </DialogHeader>
            <div className="space-y-4 mt-4">
              <div className="space-y-2">
                <Label htmlFor="card-name">Nome do Cartão</Label>
                <Input
                  id="card-name"
                  placeholder="Nome do cartão"
                  value={editCardData.name}
                  onChange={(e) => setEditCardData({ ...editCardData, name: e.target.value })}
                  className="input-finance"
                />
              </div>
              
              <div className="space-y-2">
                <Label htmlFor="card-color">Cor do Cartão</Label>
                <div className="flex gap-2">
                  <Input
                    id="card-color"
                    type="color"
                    value={editCardData.color}
                    onChange={(e) => setEditCardData({ ...editCardData, color: e.target.value })}
                    className="h-11 w-20"
                  />
                  <Input
                    type="text"
                    value={editCardData.color}
                    onChange={(e) => setEditCardData({ ...editCardData, color: e.target.value })}
                    className="flex-1 input-finance"
                    placeholder="#8b5cf6"
                  />
                </div>
              </div>

              <div className="flex gap-2">
                <Button
                  variant="outline"
                  onClick={() => setIsEditCardDialogOpen(false)}
                  className="flex-1"
                >
                  Cancelar
                </Button>
                <Button onClick={handleEditCard} className="flex-1">
                  Salvar
                </Button>
              </div>
            </div>
          </DialogContent>
        </Dialog>

        {/* Delete Card Dialog */}
        <Dialog open={isDeleteCardDialogOpen} onOpenChange={setIsDeleteCardDialogOpen}>
          <DialogContent className="sm:max-w-md">
            <DialogHeader>
              <DialogTitle className="text-destructive">Deletar Cartão</DialogTitle>
            </DialogHeader>
            <div className="space-y-4 mt-4">
              <div className="bg-destructive/10 border border-destructive/20 rounded-lg p-4">
                <p className="text-sm text-muted-foreground mb-3">
                  ⚠️ Esta ação é irreversível! Todos os itens da fatura deste cartão serão perdidos.
                </p>
                <p className="text-sm font-medium mb-2">
                  Para confirmar, digite o nome do cartão:
                </p>
                <p className="text-lg font-bold text-center py-2 px-4 bg-background rounded-lg">
                  {card.name}
                </p>
              </div>

              <div className="space-y-2">
                <Label htmlFor="confirm-name">Confirme o nome do cartão</Label>
                <Input
                  id="confirm-name"
                  placeholder="Digite o nome do cartão"
                  value={deleteConfirmName}
                  onChange={(e) => setDeleteConfirmName(e.target.value)}
                  className="input-finance"
                  autoComplete="off"
                />
              </div>

              <div className="flex gap-2">
                <Button
                  variant="outline"
                  onClick={() => {
                    setIsDeleteCardDialogOpen(false);
                    setDeleteConfirmName('');
                  }}
                  className="flex-1"
                >
                  Cancelar
                </Button>
                <Button 
                  onClick={handleDeleteCard} 
                  variant="destructive"
                  className="flex-1"
                  disabled={deleteConfirmName.trim().toLowerCase() !== card.name.toLowerCase()}
                >
                  Deletar
                </Button>
              </div>
            </div>
          </DialogContent>
        </Dialog>
      </div>
    </div>
  );
};

export default CardDetail;