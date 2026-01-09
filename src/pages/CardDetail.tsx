import React, { useState, useRef } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { ArrowLeft, Plus, Trash2, Upload, CreditCard, Building2, Users, Pencil } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Switch } from '@/components/ui/switch';
import { Label } from '@/components/ui/label';
import { useFinance, Card, getMonthName, InvoiceItem } from '@/contexts/FinanceContext';
import { useToast } from '@/hooks/use-toast';

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
  const { cards, people, addInvoiceItem, updateInvoiceItem, removeInvoiceItem, importCSV, addPerson } = useFinance();
  const { toast } = useToast();
  const fileInputRef = useRef<HTMLInputElement>(null);

  const card = cards.find((c) => c.id === id);

  const [selectedMonth, setSelectedMonth] = useState(new Date().getMonth());
  const [selectedYear, setSelectedYear] = useState(new Date().getFullYear());
  const [isAddDialogOpen, setIsAddDialogOpen] = useState(false);
  const [isEditDialogOpen, setIsEditDialogOpen] = useState(false);
  const [isImportDialogOpen, setIsImportDialogOpen] = useState(false);
  const [isAddPersonOpen, setIsAddPersonOpen] = useState(false);
  const [newPersonName, setNewPersonName] = useState('');
  const [editingItem, setEditingItem] = useState<InvoiceItem | null>(null);
  
  const [newItem, setNewItem] = useState({
    date: new Date().toISOString().split('T')[0],
    description: '',
    category: CATEGORIES[0],
    amount: '',
    owner: 'Eu',
    isInstallment: false,
    installments: '2',
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

    addInvoiceItem(
      card.id,
      {
        date: newItem.date,
        description: newItem.description,
        category: newItem.category,
        amount: parseFloat(newItem.amount),
        owner: newItem.owner,
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

    setNewItem({
      date: new Date().toISOString().split('T')[0],
      description: '',
      category: CATEGORIES[0],
      amount: '',
      owner: 'Eu',
      isInstallment: false,
      installments: '2',
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

  const handleFileUpload = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (e) => {
      const text = e.target?.result as string;
      const lines = text.split('\n').filter((line) => line.trim());
      
      // Skip header if present
      const dataLines = lines[0].toLowerCase().includes('data') ? lines.slice(1) : lines;
      
      const items = dataLines.map((line) => {
        const [date, description, category, amount, owner] = line.split(',').map((s) => s.trim());
        return {
          date: date || new Date().toISOString().split('T')[0],
          description: description || 'Importado',
          category: category || 'Outros',
          amount: parseFloat(amount) || 0,
          owner: owner || 'Eu',
        };
      }).filter((item) => item.amount > 0);

      if (items.length > 0) {
        importCSV(card.id, items);
        toast({
          title: 'Sucesso',
          description: `${items.length} itens importados com sucesso!`,
        });
      } else {
        toast({
          title: 'Erro',
          description: 'Nenhum item válido encontrado no arquivo.',
          variant: 'destructive',
        });
      }

      setIsImportDialogOpen(false);
    };
    reader.readAsText(file);
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
            {getCardIcon(card.type)}
          </div>
          <div className="bg-white/20 rounded-2xl p-4 md:max-w-md">
            <p className="text-white/80 text-sm">Total da Fatura - {getMonthName(selectedMonth)}</p>
            <p className="text-2xl md:text-3xl font-bold">{formatCurrency(totalAmount)}</p>
          </div>
        </div>
      </header>

      {/* Content */}
      <div className="px-4 md:px-6 lg:px-8 -mt-4 space-y-4 max-w-7xl mx-auto">
        {/* Month/Year Filters */}
        <div className="card-finance animate-fade-in">
          <div className="flex flex-col sm:flex-row gap-3">
            <div className="flex-1">
              <label className="text-xs font-medium text-muted-foreground uppercase tracking-wide mb-1.5 block">
                Mês da Fatura
              </label>
              <Select
                value={selectedMonth.toString()}
                onValueChange={(value) => setSelectedMonth(parseInt(value))}
              >
                <SelectTrigger className="w-full h-11 rounded-xl bg-secondary/50 border-0">
                  <SelectValue placeholder="Mês" />
                </SelectTrigger>
                <SelectContent className="bg-background border shadow-lg z-50">
                  {MONTHS.map((month) => (
                    <SelectItem key={month} value={month.toString()}>
                      {getMonthName(month)}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="flex-1">
              <label className="text-xs font-medium text-muted-foreground uppercase tracking-wide mb-1.5 block">
                Ano
              </label>
              <Select
                value={selectedYear.toString()}
                onValueChange={(value) => setSelectedYear(parseInt(value))}
              >
                <SelectTrigger className="w-full h-11 rounded-xl bg-secondary/50 border-0">
                  <SelectValue placeholder="Ano" />
                </SelectTrigger>
                <SelectContent className="bg-background border shadow-lg z-50">
                  {YEARS.map((year) => (
                    <SelectItem key={year} value={year.toString()}>
                      {year}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
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
        <div className="flex gap-3 md:max-w-md">
          <Dialog open={isAddDialogOpen} onOpenChange={setIsAddDialogOpen}>
            <DialogTrigger asChild>
              <Button className="flex-1 h-12 rounded-xl">
                <Plus className="w-5 h-5 mr-2" />
                Adicionar Item
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
                  {newItem.isInstallment ? `Adicionar em ${newItem.installments}x` : 'Adicionar'}
                </Button>
              </div>
            </DialogContent>
          </Dialog>

          <Dialog open={isImportDialogOpen} onOpenChange={setIsImportDialogOpen}>
            <DialogTrigger asChild>
              <Button variant="outline" className="flex-1 h-12 rounded-xl">
                <Upload className="w-5 h-5 mr-2" />
                Importar CSV
              </Button>
            </DialogTrigger>
            <DialogContent className="sm:max-w-md">
              <DialogHeader>
                <DialogTitle>Importar CSV</DialogTitle>
              </DialogHeader>
              <div className="space-y-4 mt-4">
                <div className="border-2 border-dashed border-border rounded-2xl p-8 text-center">
                  <Upload className="w-12 h-12 text-muted-foreground mx-auto mb-4" />
                  <p className="text-muted-foreground mb-4">
                    Selecione um arquivo CSV
                  </p>
                  <input
                    ref={fileInputRef}
                    type="file"
                    accept=".csv"
                    onChange={handleFileUpload}
                    className="hidden"
                  />
                  <Button onClick={() => fileInputRef.current?.click()}>
                    Escolher Arquivo
                  </Button>
                </div>
                <div className="text-xs text-muted-foreground">
                  <p className="font-medium mb-1">Formato esperado:</p>
                  <code className="bg-secondary p-2 rounded block">
                    Data,Descrição,Categoria,Valor,Titular
                  </code>
                </div>
              </div>
            </DialogContent>
          </Dialog>
        </div>

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
      </div>
    </div>
  );
};

export default CardDetail;