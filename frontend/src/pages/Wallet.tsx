import React, { useState } from 'react';
import { Plus, CreditCard, Building2, ChevronRight } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { BottomNav } from '@/components/BottomNav';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
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

const Wallet: React.FC = () => {
  const { cards, addCard } = useFinance();
  const navigate = useNavigate();
  const { toast } = useToast();
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [newCard, setNewCard] = useState({
    name: '',
    type: 'credit' as Card['type'],
    color: CARD_COLORS[0].value,
  });

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('pt-BR', {
      style: 'currency',
      currency: 'BRL',
    }).format(amount);
  };

  const getCardTotal = (card: Card) => {
    return card.invoiceItems.reduce((sum, item) => sum + item.amount, 0);
  };

  const handleAddCard = () => {
    if (!newCard.name) {
      toast({
        title: 'Erro',
        description: 'Informe o nome do cartão/banco.',
        variant: 'destructive',
      });
      return;
    }

    addCard(newCard);
    toast({
      title: 'Sucesso',
      description: 'Cartão cadastrado com sucesso!',
    });

    setNewCard({ name: '', type: 'credit', color: CARD_COLORS[0].value });
    setIsDialogOpen(false);
  };

  const getCardIcon = (type: Card['type']) => {
    switch (type) {
      case 'bank':
        return <Building2 className="w-6 h-6" />;
      default:
        return <CreditCard className="w-6 h-6" />;
    }
  };

  const getCardTypeLabel = (type: Card['type']) => {
    switch (type) {
      case 'credit':
        return 'Crédito';
      case 'debit':
        return 'Débito';
      case 'bank':
        return 'Conta';
    }
  };

  return (
    <div className="min-h-screen bg-background pb-24 md:pt-16 md:pb-8">
      {/* Header */}
      <header className="bg-primary text-primary-foreground p-6 pb-8 rounded-b-3xl md:rounded-none">
        <div className="max-w-7xl mx-auto">
          <h1 className="text-xl md:text-2xl font-bold text-center tracking-wide">
            CARTÕES E BANCOS
          </h1>
        </div>
      </header>

      {/* Content */}
      <div className="px-4 md:px-6 lg:px-8 -mt-4 max-w-7xl mx-auto">
        {cards.length === 0 ? (
          <div className="card-finance text-center py-8 animate-fade-in">
            <CreditCard className="w-12 h-12 text-muted-foreground mx-auto mb-3" />
            <p className="text-muted-foreground">
              Nenhum cartão cadastrado
            </p>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-3 md:gap-4">
            {cards.map((card, index) => (
              <button
                key={card.id}
                onClick={() => navigate(`/wallet/${card.id}`)}
                className="w-full card-finance flex items-center gap-4 animate-fade-in"
                style={{ animationDelay: `${index * 0.05}s` }}
              >
                <div
                  className="w-12 h-12 rounded-xl flex items-center justify-center text-white flex-shrink-0"
                  style={{ backgroundColor: card.color }}
                >
                  {getCardIcon(card.type)}
                </div>
                <div className="flex-1 text-left min-w-0">
                  <p className="font-semibold text-foreground truncate">{card.name}</p>
                  <p className="text-sm text-muted-foreground">
                    {getCardTypeLabel(card.type)} • {card.invoiceItems.length} itens
                  </p>
                </div>
                <div className="text-right flex-shrink-0">
                  <p className="font-semibold text-destructive">
                    {formatCurrency(getCardTotal(card))}
                  </p>
                  <ChevronRight className="w-5 h-5 text-muted-foreground ml-auto" />
                </div>
              </button>
            ))}
          </div>
        )}
      </div>

      {/* Add Card Dialog */}
      <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
        <DialogTrigger asChild>
          <button className="floating-button shadow-floating md:bottom-8 md:right-8">
            <Plus className="w-6 h-6" />
          </button>
        </DialogTrigger>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>Cadastrar Novo Cartão</DialogTitle>
          </DialogHeader>
          <div className="space-y-4 mt-4">
            <Input
              placeholder="Nome (ex: Cartão Nubank)"
              value={newCard.name}
              onChange={(e) => setNewCard({ ...newCard, name: e.target.value })}
              className="input-finance"
            />
            <Select
              value={newCard.type}
              onValueChange={(value: Card['type']) => setNewCard({ ...newCard, type: value })}
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
            <div>
              <p className="text-sm text-muted-foreground mb-2">Cor</p>
              <div className="flex gap-2 flex-wrap">
                {CARD_COLORS.map((color) => (
                  <button
                    key={color.value}
                    onClick={() => setNewCard({ ...newCard, color: color.value })}
                    className={`w-10 h-10 rounded-xl transition-transform ${
                      newCard.color === color.value ? 'scale-110 ring-2 ring-foreground' : ''
                    }`}
                    style={{ backgroundColor: color.value }}
                  />
                ))}
              </div>
            </div>
            <Button onClick={handleAddCard} className="w-full h-12 rounded-xl">
              Cadastrar
            </Button>
          </div>
        </DialogContent>
      </Dialog>

      <BottomNav />
    </div>
  );
};

export default Wallet;
