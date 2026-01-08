import React, { useState, useRef } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { ArrowLeft, Plus, Trash2, Upload, CreditCard, Building2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { useFinance, Card } from '@/contexts/FinanceContext';
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

const CardDetail: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { cards, addInvoiceItem, removeInvoiceItem, importCSV } = useFinance();
  const { toast } = useToast();
  const fileInputRef = useRef<HTMLInputElement>(null);

  const card = cards.find((c) => c.id === id);

  const [isAddDialogOpen, setIsAddDialogOpen] = useState(false);
  const [isImportDialogOpen, setIsImportDialogOpen] = useState(false);
  const [newItem, setNewItem] = useState({
    date: new Date().toISOString().split('T')[0],
    description: '',
    category: CATEGORIES[0],
    amount: '',
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

  const handleAddItem = () => {
    if (!newItem.description || !newItem.amount) {
      toast({
        title: 'Erro',
        description: 'Preencha todos os campos.',
        variant: 'destructive',
      });
      return;
    }

    addInvoiceItem(card.id, {
      date: newItem.date,
      description: newItem.description,
      category: newItem.category,
      amount: parseFloat(newItem.amount),
    });

    toast({
      title: 'Sucesso',
      description: 'Item adicionado com sucesso!',
    });

    setNewItem({
      date: new Date().toISOString().split('T')[0],
      description: '',
      category: CATEGORIES[0],
      amount: '',
    });
    setIsAddDialogOpen(false);
  };

  const handleRemoveItem = (itemId: string) => {
    removeInvoiceItem(card.id, itemId);
    toast({
      title: 'Removido',
      description: 'Item removido com sucesso.',
    });
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
        const [date, description, category, amount] = line.split(',').map((s) => s.trim());
        return {
          date: date || new Date().toISOString().split('T')[0],
          description: description || 'Importado',
          category: category || 'Outros',
          amount: parseFloat(amount) || 0,
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

  const totalAmount = card.invoiceItems.reduce((sum, item) => sum + item.amount, 0);

  return (
    <div className="min-h-screen bg-background pb-8">
      {/* Header */}
      <header
        className="text-white p-6 pb-8 rounded-b-3xl"
        style={{ backgroundColor: card.color }}
      >
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
            <h1 className="text-xl font-bold">{card.name}</h1>
          </div>
          {getCardIcon(card.type)}
        </div>
        <div className="bg-white/20 rounded-2xl p-4">
          <p className="text-white/80 text-sm">Total da Fatura</p>
          <p className="text-2xl font-bold">{formatCurrency(totalAmount)}</p>
        </div>
      </header>

      {/* Content */}
      <div className="px-4 -mt-4 space-y-4">
        {/* Action Buttons */}
        <div className="flex gap-3">
          <Dialog open={isAddDialogOpen} onOpenChange={setIsAddDialogOpen}>
            <DialogTrigger asChild>
              <Button className="flex-1 h-12 rounded-xl">
                <Plus className="w-5 h-5 mr-2" />
                Adicionar Item
              </Button>
            </DialogTrigger>
            <DialogContent className="sm:max-w-md">
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
                <select
                  value={newItem.category}
                  onChange={(e) => setNewItem({ ...newItem, category: e.target.value })}
                  className="w-full input-finance"
                >
                  {CATEGORIES.map((cat) => (
                    <option key={cat} value={cat}>
                      {cat}
                    </option>
                  ))}
                </select>
                <Input
                  type="number"
                  placeholder="Valor"
                  value={newItem.amount}
                  onChange={(e) => setNewItem({ ...newItem, amount: e.target.value })}
                  className="input-finance"
                />
                <Button onClick={handleAddItem} className="w-full h-12 rounded-xl">
                  Adicionar
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
                    Data,Descrição,Categoria,Valor
                  </code>
                </div>
              </div>
            </DialogContent>
          </Dialog>
        </div>

        {/* Invoice Items */}
        <section className="card-finance">
          <h2 className="font-semibold text-foreground mb-4">Fatura</h2>
          
          {card.invoiceItems.length === 0 ? (
            <p className="text-sm text-muted-foreground text-center py-8">
              Nenhum item na fatura
            </p>
          ) : (
            <div className="space-y-2">
              {card.invoiceItems.map((item, index) => (
                <div
                  key={item.id}
                  className="flex items-center justify-between p-3 bg-secondary/50 rounded-xl animate-fade-in"
                  style={{ animationDelay: `${index * 0.03}s` }}
                >
                  <div className="flex-1 min-w-0">
                    <p className="font-medium text-foreground truncate">
                      {item.description}
                    </p>
                    <div className="flex items-center gap-2 text-xs text-muted-foreground">
                      <span>{formatDate(item.date)}</span>
                      <span>•</span>
                      <span className="px-2 py-0.5 bg-primary/10 text-primary rounded-full">
                        {item.category}
                      </span>
                    </div>
                  </div>
                  <div className="flex items-center gap-2 ml-2">
                    <p className="font-semibold text-destructive whitespace-nowrap">
                      {formatCurrency(item.amount)}
                    </p>
                    <Button
                      variant="ghost"
                      size="icon"
                      onClick={() => handleRemoveItem(item.id)}
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
