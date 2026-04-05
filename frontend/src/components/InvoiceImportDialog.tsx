import React, { useMemo, useRef, useState } from 'react';
import { AlertCircle, Check, FileSpreadsheet, FileText, Loader2, MessageSquareText, PencilLine, Sparkles, Upload, UserRound } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Textarea } from '@/components/ui/textarea';
import { Checkbox } from '@/components/ui/checkbox';
import { Badge } from '@/components/ui/badge';
import { Card, InvoiceItem } from '@/contexts/FinanceContext';
import invoiceImportService, { ImportedInvoiceItem } from '@/services/invoiceImportService';

const CATEGORY_OPTIONS = [
  'Alimentacao',
  'Transporte',
  'Moradia',
  'Lazer',
  'Saude',
  'Educacao',
  'Compras',
  'Servicos',
  'Outros',
] as const;

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

type ImportMode = 'csv' | 'pdf' | 'text';
type ImportStep = 'source' | 'review';

interface ReviewItem extends ImportedInvoiceItem {
  id: string;
  selected: boolean;
  warnings: string[];
}

interface InvoiceImportDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  card: Card;
  people: string[];
  month: number;
  year: number;
  onImport: (items: Omit<InvoiceItem, 'id'>[]) => Promise<void>;
}

const IMPORT_METHODS = [
  {
    value: 'csv' as const,
    title: 'CSV',
    description: 'Importação rápida sem IA para extratos CSV.',
    icon: FileSpreadsheet,
  },
  {
    value: 'pdf' as const,
    title: 'PDF da fatura',
    description: 'Extrai os lançamentos da fatura com Groq IA.',
    icon: FileText,
  },
  {
    value: 'text' as const,
    title: 'Texto',
    description: 'Cole o texto da fatura e deixe a IA organizar tudo.',
    icon: MessageSquareText,
  },
];

const formatCurrency = (amount: number) => new Intl.NumberFormat('pt-BR', {
  style: 'currency',
  currency: 'BRL',
}).format(amount);

const normalizeDate = (value: string) => {
  const trimmed = value.trim();
  const patterns = [
    /^(\d{4})-(\d{2})-(\d{2})$/,
    /^(\d{2})\/(\d{2})\/(\d{4})$/,
    /^(\d{2})-(\d{2})-(\d{4})$/,
  ];

  for (const pattern of patterns) {
    const match = pattern.exec(trimmed);
    if (!match) continue;
    if (pattern === patterns[0]) {
      return trimmed;
    }
    return `${match[3]}-${match[2]}-${match[1]}`;
  }

  return '';
};

const normalizeCategory = (value: string) => {
  const normalized = value.normalize('NFD').replaceAll(/[\u0300-\u036f]/g, '');
  const match = CATEGORY_OPTIONS.find((item) => item.toLowerCase() === normalized.toLowerCase());
  return match ?? 'Outros';
};

const parseAmount = (raw: string) => {
  let amountStr = raw.replaceAll(/[^\d,.-]/g, '');
  if (amountStr.includes(',') && amountStr.includes('.')) {
    const lastComma = amountStr.lastIndexOf(',');
    const lastDot = amountStr.lastIndexOf('.');
    amountStr = lastComma > lastDot
      ? amountStr.replaceAll('.', '').replaceAll(',', '.')
      : amountStr.replaceAll(',', '');
  } else if (amountStr.includes(',')) {
    amountStr = amountStr.replaceAll(',', '.');
  }
  return Number.parseFloat(amountStr) || 0;
};

const trimCSVCell = (cell: string) => cell.trim().replaceAll(/^"|"$/g, '');

const getItemWarnings = (item: Pick<ReviewItem, 'date' | 'description' | 'amount'>) => {
  const warnings: string[] = [];
  if (!item.description?.trim()) warnings.push('Sem descrição');
  if (!item.date || !normalizeDate(item.date)) warnings.push('Data inválida');
  if (!item.amount || item.amount <= 0) warnings.push('Valor inválido');
  return warnings;
};

const buildReviewItems = (items: ImportedInvoiceItem[], defaultOwner: string) => {
  return items.map((item, index) => {
    const warnings = getItemWarnings({
      date: normalizeDate(item.date) || item.date,
      description: item.description || 'Lançamento importado',
      amount: Number(item.amount || 0),
    });

    return {
      id: `${item.date}-${item.description}-${index}`,
      date: normalizeDate(item.date) || item.date,
      description: item.description || 'Lançamento importado',
      category: normalizeCategory(item.category || 'Outros'),
      amount: Number(item.amount || 0),
      owner: item.owner || defaultOwner,
      notes: item.notes,
      selected: warnings.length === 0,
      warnings,
    } satisfies ReviewItem;
  });
};

const parseCSVContent = (content: string, people: string[], month: number, year: number) => {
  const lines = content.split(/\r?\n/).filter((line) => line.trim());
  if (lines.length === 0) return [] as ReviewItem[];

  const firstLine = lines[0];
  const delimiterCandidates = [';', ',', '\t'];
  const delimiter = delimiterCandidates.reduce((best, current) => {
    const currentCount = firstLine.split(current).length;
    const bestCount = firstLine.split(best).length;
    return currentCount > bestCount ? current : best;
  }, ',');

  const firstRow = firstLine.split(delimiter).map(trimCSVCell);
  const headerMap = {
    date: firstRow.findIndex((column) => ['date', 'data'].includes(column.toLowerCase())),
    description: firstRow.findIndex((column) => ['title', 'descricao', 'descrição', 'description'].includes(column.toLowerCase())),
    amount: firstRow.findIndex((column) => ['amount', 'valor'].includes(column.toLowerCase())),
    category: firstRow.findIndex((column) => ['category', 'categoria'].includes(column.toLowerCase())),
    owner: firstRow.findIndex((column) => ['owner', 'titular', 'pessoa'].includes(column.toLowerCase())),
  };
  const hasHeader = headerMap.date >= 0 || headerMap.description >= 0 || headerMap.amount >= 0;
  const defaultOwner = people[0] ?? 'Eu';

  const dataLines = hasHeader ? lines.slice(1) : lines;
  const reviewItems = dataLines.map((line, index) => {
    const parts = line.split(delimiter).map(trimCSVCell);
    const date = normalizeDate(parts[hasHeader ? headerMap.date : 0] || '') || `${year}-${String(month + 1).padStart(2, '0')}-01`;
    const description = parts[hasHeader ? headerMap.description : 1] || 'Lançamento importado';
    const amount = parseAmount(parts[hasHeader ? headerMap.amount : 2] || '0');
    const categoryIndex = hasHeader ? headerMap.category : 3;
    const ownerIndex = hasHeader ? headerMap.owner : 4;
    const category = normalizeCategory(parts[categoryIndex] || 'Outros');
    const owner = parts[ownerIndex] || defaultOwner;
    const warnings: string[] = [];

    if (amount <= 0) warnings.push('Pagamento/crédito ignorado');
    if (!description.trim()) warnings.push('Sem descrição');

    return {
      id: `csv-${index}`,
      date,
      description,
      category,
      amount: Math.abs(amount),
      owner,
      selected: warnings.length === 0,
      warnings,
    } satisfies ReviewItem;
  });

  return reviewItems;
};

const InvoiceImportDialog: React.FC<InvoiceImportDialogProps> = ({
  open,
  onOpenChange,
  card,
  people,
  month,
  year,
  onImport,
}) => {
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [mode, setMode] = useState<ImportMode>('csv');
  const [step, setStep] = useState<ImportStep>('source');
  const [fileName, setFileName] = useState('');
  const [textInput, setTextInput] = useState('');
  const [reviewItems, setReviewItems] = useState<ReviewItem[]>([]);
  const [rawTextPreview, setRawTextPreview] = useState('');
  const [isProcessing, setIsProcessing] = useState(false);
  const [isImporting, setIsImporting] = useState(false);
  const [error, setError] = useState('');

  const knownPeople = useMemo(() => (people.length > 0 ? people : ['Eu']), [people]);
  const availableOwners = useMemo(() => {
    const ownerSet = new Set(knownPeople);
    for (const item of reviewItems) {
      if (item.owner?.trim()) {
        ownerSet.add(item.owner);
      }
    }
    return Array.from(ownerSet);
  }, [knownPeople, reviewItems]);
  const selectedCount = reviewItems.filter((item) => item.selected && item.warnings.length === 0).length;
  const selectedTotal = reviewItems
    .filter((item) => item.selected && item.warnings.length === 0)
    .reduce((sum, item) => sum + item.amount, 0);
  const methodDescription = useMemo(() => {
    if (mode === 'csv') {
      return 'CSV entra sem IA e você revisa antes de gravar.';
    }
    if (mode === 'pdf') {
      return 'O PDF é lido, o texto é extraído e a Groq organiza os lançamentos para revisão.';
    }
    return 'Cole o texto bruto da fatura e a Groq sugere os lançamentos automaticamente.';
  }, [mode]);

  const resetState = () => {
    setStep('source');
    setFileName('');
    setTextInput('');
    setReviewItems([]);
    setRawTextPreview('');
    setError('');
    setIsProcessing(false);
    setIsImporting(false);
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  const closeDialog = (nextOpen: boolean) => {
    onOpenChange(nextOpen);
    if (!nextOpen) {
      resetState();
    }
  };

  const handleCSVFile = async (file: File) => {
    setIsProcessing(true);
    setError('');
    try {
      const content = await file.text();
      setFileName(file.name);
      setRawTextPreview(content.slice(0, 4000));
      setReviewItems(parseCSVContent(content, knownPeople, month, year));
      setStep('review');
    } catch {
      setError('Não foi possível ler o CSV.');
    } finally {
      setIsProcessing(false);
    }
  };

  const handleAIDocument = async (file: File) => {
    setIsProcessing(true);
    setError('');
    try {
      const result = await invoiceImportService.processDocument({
        file,
        cardName: card.name,
        people: knownPeople,
        referenceMonth: month + 1,
        referenceYear: year,
      });
      setFileName(file.name);
      setRawTextPreview(result.raw_text);
      setReviewItems(buildReviewItems(result.items, knownPeople[0] ?? 'Eu'));
      setStep('review');
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Falha ao processar o arquivo com IA.');
    } finally {
      setIsProcessing(false);
    }
  };

  const handleProcessText = async () => {
    if (!textInput.trim()) {
      setError('Cole o texto da fatura antes de continuar.');
      return;
    }

    setIsProcessing(true);
    setError('');
    try {
      const result = await invoiceImportService.processText({
        content: textInput,
        cardName: card.name,
        people: knownPeople,
        referenceMonth: month + 1,
        referenceYear: year,
      });
      setRawTextPreview(result.raw_text);
      setReviewItems(buildReviewItems(result.items, knownPeople[0] ?? 'Eu'));
      setStep('review');
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Falha ao processar o texto com IA.');
    } finally {
      setIsProcessing(false);
    }
  };

  const handleFileSelection = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;
    if (mode === 'csv') {
      await handleCSVFile(file);
      return;
    }
    await handleAIDocument(file);
  };

  const updateItem = (itemId: string, updates: Partial<ReviewItem>) => {
    setReviewItems((prev) => prev.map((item) => {
      if (item.id !== itemId) return item;

      const nextItem = { ...item, ...updates };
      const warnings = getItemWarnings({
        date: nextItem.date,
        description: nextItem.description,
        amount: nextItem.amount,
      });

      return {
        ...nextItem,
        warnings,
        selected: warnings.length === 0 ? nextItem.selected : false,
      };
    }));
  };

  const handleImport = async () => {
    const itemsToImport = reviewItems
      .filter((item) => item.selected && item.warnings.length === 0)
      .map(({ id, selected, warnings, notes, ...item }) => item);

    if (itemsToImport.length === 0) {
      setError('Selecione ao menos um lançamento válido para importar.');
      return;
    }

    setIsImporting(true);
    setError('');
    try {
      await onImport(itemsToImport);
      closeDialog(false);
    } catch {
      setError('Não foi possível importar os lançamentos.');
    } finally {
      setIsImporting(false);
    }
  };

  const currentMethod = IMPORT_METHODS.find((item) => item.value === mode) ?? IMPORT_METHODS[0];

  return (
    <Dialog open={open} onOpenChange={closeDialog}>
      <DialogContent
        className="w-[calc(100%-1rem)] sm:max-w-5xl max-h-[calc(100dvh-1rem)] sm:max-h-[92vh] p-0 flex flex-col overflow-y-auto overscroll-contain left-1/2 top-2 -translate-x-1/2 translate-y-0 sm:top-[50%] sm:translate-y-[-50%]"
        style={{ WebkitOverflowScrolling: 'touch' }}
      >
        <div className="bg-gradient-to-br from-slate-950 via-slate-900 to-blue-950 text-white p-4 sm:p-6 border-b border-white/10 shrink-0">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-3 text-xl">
              <Sparkles className="w-5 h-5 text-cyan-300" />
              Importar fatura para {card.name}
            </DialogTitle>
          </DialogHeader>
          <p className="text-sm text-slate-300 mt-2 max-w-3xl">
            Escolha o formato da importação, revise os lançamentos encontrados e confirme apenas quando estiver tudo correto.
          </p>
        </div>

        <div className="flex-1 min-h-0 p-4 sm:p-6 space-y-5 [touch-action:pan-y]">
          {step === 'source' && (
            <>
              <div className="grid gap-3 md:grid-cols-3">
                {IMPORT_METHODS.map((method) => {
                  const Icon = method.icon;
                  const active = mode === method.value;
                  return (
                    <button
                      key={method.value}
                      type="button"
                      onClick={() => {
                        setMode(method.value);
                        setError('');
                      }}
                      className={`rounded-2xl border p-4 text-left transition-all ${
                        active
                          ? 'border-primary bg-primary/10 shadow-[0_0_0_1px_rgba(59,130,246,0.3)]'
                          : 'border-border hover:border-primary/30 hover:bg-muted/40'
                      }`}
                    >
                      <div className="flex items-center gap-3 mb-3">
                        <div className={`rounded-xl p-2 ${active ? 'bg-primary/20 text-primary' : 'bg-muted text-muted-foreground'}`}>
                          <Icon className="w-4 h-4" />
                        </div>
                        <div>
                          <p className="font-semibold text-foreground">{method.title}</p>
                          <p className="text-xs text-muted-foreground">{method.description}</p>
                        </div>
                      </div>
                      {active && <Badge className="bg-primary text-primary-foreground">Selecionado</Badge>}
                    </button>
                  );
                })}
              </div>

              <div className="rounded-2xl border border-border bg-card p-5 space-y-4">
                <div>
                  <p className="text-base font-semibold text-foreground">Método: {currentMethod.title}</p>
                  <p className="text-sm text-muted-foreground mt-1">{methodDescription}</p>
                  {fileName && <p className="text-xs text-muted-foreground mt-2">Arquivo: {fileName}</p>}
                </div>

                {mode === 'text' ? (
                  <div className="space-y-3">
                    <Label>Texto da fatura</Label>
                    <Textarea
                      value={textInput}
                      onChange={(event) => setTextInput(event.target.value)}
                      placeholder="Cole aqui o texto completo da fatura, extrato ou mensagem com lançamentos..."
                      className="min-h-[220px]"
                    />
                    <Button onClick={handleProcessText} disabled={isProcessing} className="w-full sm:w-auto">
                      {isProcessing ? <Loader2 className="w-4 h-4 mr-2 animate-spin" /> : <Sparkles className="w-4 h-4 mr-2" />}
                      Processar com IA
                    </Button>
                  </div>
                ) : (
                  <div className="space-y-3">
                    <input
                      ref={fileInputRef}
                      type="file"
                      accept={mode === 'csv' ? '.csv,.txt' : '.pdf,.txt'}
                      onChange={handleFileSelection}
                      className="hidden"
                    />
                    <button
                      type="button"
                      onClick={() => fileInputRef.current?.click()}
                      className="w-full rounded-2xl border-2 border-dashed border-border hover:border-primary/40 bg-muted/20 p-8 text-center transition-colors"
                    >
                      <Upload className="w-10 h-10 mx-auto mb-3 text-primary" />
                      <p className="font-semibold text-foreground">Selecionar arquivo</p>
                      <p className="text-sm text-muted-foreground mt-1">
                        {mode === 'csv' ? 'Envie um CSV do banco/cartão.' : 'Envie a fatura em PDF ou TXT.'}
                      </p>
                    </button>
                    {isProcessing && (
                      <div className="flex items-center gap-2 text-sm text-muted-foreground">
                        <Loader2 className="w-4 h-4 animate-spin" />
                        Processando arquivo...
                      </div>
                    )}
                  </div>
                )}

                {error && (
                  <div className="rounded-xl border border-red-500/30 bg-red-500/10 p-3 text-sm text-red-300 flex items-start gap-2">
                    <AlertCircle className="w-4 h-4 mt-0.5 shrink-0" />
                    <span>{error}</span>
                  </div>
                )}
              </div>
            </>
          )}

          {step === 'review' && (
            <div className="space-y-4">
              <div className="flex flex-col gap-3 lg:flex-row lg:items-center lg:justify-between">
                <div>
                  <h3 className="text-lg font-semibold text-foreground">Confira se está tudo correto antes de importar</h3>
                  <p className="text-sm text-muted-foreground mt-1">
                    Ajuste descrição, categoria, titular e marque somente o que realmente deve entrar na fatura.
                  </p>
                </div>
                <div className="flex flex-wrap gap-2">
                  <Badge variant="secondary">{selectedCount} selecionados</Badge>
                  <Badge variant="secondary">{formatCurrency(selectedTotal)}</Badge>
                  <Badge variant="outline">{reviewItems.length} encontrados</Badge>
                </div>
              </div>

              {rawTextPreview && (
                <details className="rounded-xl border border-border bg-muted/20 p-3">
                  <summary className="cursor-pointer text-sm font-medium text-foreground">Ver texto bruto processado</summary>
                  <pre className="mt-3 text-xs text-muted-foreground whitespace-pre-wrap max-h-48 overflow-auto">{rawTextPreview}</pre>
                </details>
              )}

              <div className="md:hidden space-y-3 pb-2">
                {reviewItems.map((item) => (
                  <div key={item.id} className="rounded-2xl border border-border bg-card p-4 space-y-4">
                    <div className="flex items-start justify-between gap-3">
                      <div className="min-w-0">
                        <p className="text-sm font-semibold text-foreground truncate">{item.description}</p>
                        <div className="flex flex-wrap gap-2 mt-2">
                          <Badge variant="secondary">{formatCurrency(item.amount)}</Badge>
                          <Badge variant="outline">{item.date || 'Sem data'}</Badge>
                          <Badge variant="outline">{CATEGORY_LABELS[item.category] ?? item.category}</Badge>
                        </div>
                      </div>
                      <Checkbox
                        checked={item.selected && item.warnings.length === 0}
                        onCheckedChange={(checked) => updateItem(item.id, { selected: checked === true })}
                        disabled={item.warnings.length > 0}
                      />
                    </div>

                    <div className="grid gap-3">
                      <div className="space-y-1.5">
                        <Label className="text-xs text-muted-foreground flex items-center gap-1">
                          <PencilLine className="w-3.5 h-3.5" />
                          Descrição
                        </Label>
                        <Input
                          value={item.description}
                          onChange={(event) => updateItem(item.id, { description: event.target.value })}
                        />
                      </div>

                      <div className="grid grid-cols-2 gap-3">
                        <div className="space-y-1.5">
                          <Label className="text-xs text-muted-foreground">Data</Label>
                          <Input
                            type="date"
                            value={item.date}
                            onChange={(event) => updateItem(item.id, { date: event.target.value })}
                          />
                        </div>
                        <div className="space-y-1.5">
                          <Label className="text-xs text-muted-foreground">Valor</Label>
                          <Input
                            inputMode="decimal"
                            value={item.amount.toFixed(2)}
                            onChange={(event) => updateItem(item.id, { amount: Number.parseFloat(event.target.value.replace(',', '.')) || 0 })}
                          />
                        </div>
                      </div>

                      <div className="grid grid-cols-2 gap-3">
                        <div className="space-y-1.5">
                          <Label className="text-xs text-muted-foreground">Categoria</Label>
                          <Select value={item.category} onValueChange={(value) => updateItem(item.id, { category: value })}>
                            <SelectTrigger>
                              <SelectValue />
                            </SelectTrigger>
                            <SelectContent>
                              {CATEGORY_OPTIONS.map((category) => (
                                <SelectItem key={category} value={category}>{CATEGORY_LABELS[category]}</SelectItem>
                              ))}
                            </SelectContent>
                          </Select>
                        </div>
                        <div className="space-y-1.5">
                          <Label className="text-xs text-muted-foreground flex items-center gap-1">
                            <UserRound className="w-3.5 h-3.5" />
                            Titular
                          </Label>
                          <Select value={item.owner} onValueChange={(value) => updateItem(item.id, { owner: value })}>
                            <SelectTrigger>
                              <SelectValue />
                            </SelectTrigger>
                            <SelectContent>
                              {availableOwners.map((person) => (
                                <SelectItem key={person} value={person}>{person}</SelectItem>
                              ))}
                            </SelectContent>
                          </Select>
                        </div>
                      </div>
                    </div>

                    {item.notes && <p className="text-xs text-muted-foreground">{item.notes}</p>}
                    {item.warnings.length > 0 && (
                      <div className="flex flex-wrap gap-1">
                        {item.warnings.map((warning) => (
                          <Badge key={warning} variant="destructive" className="text-[10px]">{warning}</Badge>
                        ))}
                      </div>
                    )}
                  </div>
                ))}
              </div>

              <div className="hidden md:block rounded-2xl border border-border overflow-hidden">
                <div className="grid grid-cols-[56px_120px_minmax(220px,1.6fr)_160px_140px_160px] gap-3 px-4 py-3 bg-muted/40 text-xs font-semibold uppercase tracking-wide text-muted-foreground min-w-[920px]">
                  <span>OK</span>
                  <span>Data</span>
                  <span>Descrição</span>
                  <span>Categoria</span>
                  <span>Valor</span>
                  <span>Titular</span>
                </div>
                <ScrollArea className="h-[420px]">
                  <div className="min-w-[920px]">
                    {reviewItems.map((item) => (
                      <div key={item.id} className="px-4 py-3 border-t border-border/70 bg-background">
                        <div className="grid grid-cols-[56px_120px_minmax(220px,1.6fr)_160px_140px_160px] gap-3 items-start">
                          <div className="pt-2">
                            <Checkbox
                              checked={item.selected && item.warnings.length === 0}
                              onCheckedChange={(checked) => updateItem(item.id, { selected: checked === true })}
                              disabled={item.warnings.length > 0}
                            />
                          </div>
                          <Input
                            type="date"
                            value={item.date}
                            onChange={(event) => updateItem(item.id, { date: event.target.value })}
                          />
                          <div className="space-y-2">
                            <Input
                              value={item.description}
                              onChange={(event) => updateItem(item.id, { description: event.target.value })}
                            />
                            {item.notes && <p className="text-xs text-muted-foreground">{item.notes}</p>}
                            {item.warnings.length > 0 && (
                              <div className="flex flex-wrap gap-1">
                                {item.warnings.map((warning) => (
                                  <Badge key={warning} variant="destructive" className="text-[10px]">{warning}</Badge>
                                ))}
                              </div>
                            )}
                          </div>
                          <Select value={item.category} onValueChange={(value) => updateItem(item.id, { category: value })}>
                            <SelectTrigger>
                              <SelectValue />
                            </SelectTrigger>
                            <SelectContent>
                              {CATEGORY_OPTIONS.map((category) => (
                                <SelectItem key={category} value={category}>{CATEGORY_LABELS[category]}</SelectItem>
                              ))}
                            </SelectContent>
                          </Select>
                          <Input
                            inputMode="decimal"
                            value={item.amount.toFixed(2)}
                            onChange={(event) => updateItem(item.id, { amount: Number.parseFloat(event.target.value.replace(',', '.')) || 0 })}
                          />
                          <Select value={item.owner} onValueChange={(value) => updateItem(item.id, { owner: value })}>
                            <SelectTrigger>
                              <SelectValue />
                            </SelectTrigger>
                            <SelectContent>
                              {availableOwners.map((person) => (
                                <SelectItem key={person} value={person}>{person}</SelectItem>
                              ))}
                            </SelectContent>
                          </Select>
                        </div>
                      </div>
                    ))}
                  </div>
                </ScrollArea>
              </div>

              {error && (
                <div className="rounded-xl border border-red-500/30 bg-red-500/10 p-3 text-sm text-red-300 flex items-start gap-2">
                  <AlertCircle className="w-4 h-4 mt-0.5 shrink-0" />
                  <span>{error}</span>
                </div>
              )}

              <div className="flex flex-col-reverse sm:flex-row gap-2 sm:justify-end pb-2">
                <Button variant="outline" onClick={() => setStep('source')}>Voltar</Button>
                <Button onClick={handleImport} disabled={isImporting || selectedCount === 0}>
                  {isImporting ? <Loader2 className="w-4 h-4 mr-2 animate-spin" /> : <Check className="w-4 h-4 mr-2" />}
                  Importar {selectedCount} lançamento(s)
                </Button>
              </div>
            </div>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
};

export default InvoiceImportDialog;
