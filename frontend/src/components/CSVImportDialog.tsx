import React, { useState, useRef, useCallback } from 'react';
import { Upload, FileText, Check, AlertCircle } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Label } from '@/components/ui/label';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Badge } from '@/components/ui/badge';

interface ParsedItem {
  date: string;
  description: string;
  category: string;
  amount: number;
  owner: string;
  isValid: boolean;
}

interface CSVImportDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onImport: (items: Omit<ParsedItem, 'isValid'>[]) => void;
}

const DELIMITERS = [
  { value: ',', label: 'Vírgula (,)' },
  { value: ';', label: 'Ponto e vírgula (;)' },
  { value: '.', label: 'Ponto (.)' },
  { value: '\t', label: 'Tab' },
];

const CSVImportDialog: React.FC<CSVImportDialogProps> = ({ open, onOpenChange, onImport }) => {
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [rawContent, setRawContent] = useState('');
  const [delimiter, setDelimiter] = useState(',');
  const [hasHeader, setHasHeader] = useState(true);
  const [parsedItems, setParsedItems] = useState<ParsedItem[]>([]);
  const [fileName, setFileName] = useState('');
  const [step, setStep] = useState<'upload' | 'preview'>('upload');

  const parseCSV = useCallback((content: string, delim: string, skipHeader: boolean) => {
    const lines = content.split('\n').filter((line) => line.trim());
    const dataLines = skipHeader ? lines.slice(1) : lines;

    const items: ParsedItem[] = dataLines.map((line) => {
      const parts = line.split(delim).map((s) => s.trim().replace(/^["']|["']$/g, ''));
      
      // Try to parse the amount - handle both . and , as decimal separator
      let amountStr = parts[3] || '0';
      amountStr = amountStr.replace(/[^\d,.-]/g, '');
      
      // Handle Brazilian format (1.234,56) or US format (1,234.56)
      if (amountStr.includes(',') && amountStr.includes('.')) {
        // Check which comes last to determine format
        const lastComma = amountStr.lastIndexOf(',');
        const lastDot = amountStr.lastIndexOf('.');
        if (lastComma > lastDot) {
          // Brazilian format: 1.234,56
          amountStr = amountStr.replace(/\./g, '').replace(',', '.');
        } else {
          // US format: 1,234.56
          amountStr = amountStr.replace(/,/g, '');
        }
      } else if (amountStr.includes(',')) {
        // Only comma - could be decimal separator
        amountStr = amountStr.replace(',', '.');
      }
      
      const amount = parseFloat(amountStr) || 0;
      
      // Try to parse date
      let dateStr = parts[0] || '';
      let parsedDate = '';
      
      // Try different date formats
      const datePatterns = [
        /^(\d{4})-(\d{2})-(\d{2})$/, // YYYY-MM-DD
        /^(\d{2})\/(\d{2})\/(\d{4})$/, // DD/MM/YYYY
        /^(\d{2})-(\d{2})-(\d{4})$/, // DD-MM-YYYY
        /^(\d{2})\.(\d{2})\.(\d{4})$/, // DD.MM.YYYY
      ];
      
      for (const pattern of datePatterns) {
        const match = dateStr.match(pattern);
        if (match) {
          if (pattern === datePatterns[0]) {
            parsedDate = dateStr;
          } else {
            parsedDate = `${match[3]}-${match[2]}-${match[1]}`;
          }
          break;
        }
      }
      
      if (!parsedDate) {
        parsedDate = new Date().toISOString().split('T')[0];
      }

      return {
        date: parsedDate,
        description: parts[1] || 'Importado',
        category: parts[2] || 'Outros',
        amount,
        owner: parts[4] || 'Eu',
        isValid: amount > 0 && parts[1]?.trim().length > 0,
      };
    });

    return items;
  }, []);

  const handleFileUpload = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    setFileName(file.name);
    
    const reader = new FileReader();
    reader.onload = (e) => {
      const text = e.target?.result as string;
      setRawContent(text);
      
      // Auto-detect delimiter
      const firstLine = text.split('\n')[0];
      const delimiters = [';', ',', '\t', '.'];
      let bestDelimiter = ',';
      let maxCount = 0;
      
      for (const d of delimiters) {
        const count = (firstLine.match(new RegExp(d === '.' ? '\\.' : d, 'g')) || []).length;
        if (count > maxCount) {
          maxCount = count;
          bestDelimiter = d;
        }
      }
      
      setDelimiter(bestDelimiter);
      
      // Check if first line looks like header
      const headerKeywords = ['data', 'date', 'descrição', 'description', 'valor', 'amount', 'categoria', 'category'];
      const hasHeaderLine = headerKeywords.some(kw => firstLine.toLowerCase().includes(kw));
      setHasHeader(hasHeaderLine);
      
      const items = parseCSV(text, bestDelimiter, hasHeaderLine);
      setParsedItems(items);
      setStep('preview');
    };
    reader.readAsText(file);
  };

  const handleDelimiterChange = (newDelimiter: string) => {
    setDelimiter(newDelimiter);
    if (rawContent) {
      const items = parseCSV(rawContent, newDelimiter, hasHeader);
      setParsedItems(items);
    }
  };

  const handleHeaderToggle = (skipHeader: boolean) => {
    setHasHeader(skipHeader);
    if (rawContent) {
      const items = parseCSV(rawContent, delimiter, skipHeader);
      setParsedItems(items);
    }
  };

  const handleImport = () => {
    const validItems = parsedItems.filter(item => item.isValid);
    onImport(validItems.map(({ isValid, ...item }) => item));
    handleReset();
  };

  const handleReset = () => {
    setRawContent('');
    setFileName('');
    setParsedItems([]);
    setStep('upload');
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  const validCount = parsedItems.filter(i => i.isValid).length;
  const invalidCount = parsedItems.filter(i => !i.isValid).length;

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('pt-BR', {
      style: 'currency',
      currency: 'BRL',
    }).format(amount);
  };

  return (
    <Dialog open={open} onOpenChange={(o) => { onOpenChange(o); if (!o) handleReset(); }}>
      <DialogContent className="sm:max-w-2xl max-h-[90vh] w-[95vw] sm:w-full p-4 sm:p-6">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2 text-base sm:text-lg">
            <Upload className="w-4 h-4 sm:w-5 sm:h-5" />
            Importar CSV
          </DialogTitle>
        </DialogHeader>

        {step === 'upload' ? (
          <div className="space-y-3 sm:space-y-4 mt-4">
            <div 
              className="border-2 border-dashed border-border rounded-2xl p-6 sm:p-8 text-center hover:border-primary/50 transition-colors cursor-pointer"
              onClick={() => fileInputRef.current?.click()}
            >
              <Upload className="w-10 h-10 sm:w-12 sm:h-12 text-muted-foreground mx-auto mb-3 sm:mb-4" />
              <p className="text-sm sm:text-base text-muted-foreground mb-3 sm:mb-4">
                Arraste seu arquivo ou clique para selecionar
              </p>
              <input
                ref={fileInputRef}
                type="file"
                accept=".csv,.txt"
                onChange={handleFileUpload}
                className="hidden"
              />
              <Button variant="outline" size="sm" className="sm:h-10">
                Escolher Arquivo
              </Button>
            </div>
            
            <div className="p-3 sm:p-4 bg-secondary/30 rounded-xl">
              <p className="text-xs sm:text-sm font-medium mb-2">Formatos suportados:</p>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-xs text-muted-foreground">
                <div className="flex items-center gap-2">
                  <Check className="w-3 h-3 text-success flex-shrink-0" />
                  <span>Separador: vírgula, ponto e vírgula, ponto</span>
                </div>
                <div className="flex items-center gap-2">
                  <Check className="w-3 h-3 text-success flex-shrink-0" />
                  <span>Datas: DD/MM/AAAA, AAAA-MM-DD</span>
                </div>
                <div className="flex items-center gap-2">
                  <Check className="w-3 h-3 text-success flex-shrink-0" />
                  <span>Valores: R$ 1.234,56 ou 1234.56</span>
                </div>
                <div className="flex items-center gap-2">
                  <Check className="w-3 h-3 text-success flex-shrink-0" />
                  <span>Com ou sem cabeçalho</span>
                </div>
              </div>
            </div>

            <div className="text-xs text-muted-foreground">
              <p className="font-medium mb-1">Colunas esperadas:</p>
              <code className="bg-secondary p-2 rounded block text-[10px] sm:text-xs overflow-x-auto">
                Data, Descrição, Categoria, Valor, Titular
              </code>
            </div>
          </div>
        ) : (
          <div className="space-y-3 sm:space-y-4 mt-4">
            {/* File Info */}
            <div className="flex items-center gap-2 sm:gap-3 p-2 sm:p-3 bg-secondary/30 rounded-xl">
              <FileText className="w-4 h-4 sm:w-5 sm:h-5 text-primary flex-shrink-0" />
              <span className="text-xs sm:text-sm font-medium flex-1 truncate">{fileName}</span>
              <Button variant="ghost" size="sm" onClick={handleReset} className="text-xs h-8 px-2 sm:px-3">
                Trocar
              </Button>
            </div>

            {/* Options */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 sm:gap-4">
              <div className="space-y-2">
                <Label className="text-xs sm:text-sm">Separador</Label>
                <Select value={delimiter} onValueChange={handleDelimiterChange}>
                  <SelectTrigger className="h-9 sm:h-10 text-xs sm:text-sm">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent className="bg-background border shadow-lg z-50">
                    {DELIMITERS.map(d => (
                      <SelectItem key={d.value} value={d.value}>
                        {d.label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              
              <div className="space-y-2">
                <Label className="text-xs sm:text-sm">Primeira linha</Label>
                <Select value={hasHeader ? 'header' : 'data'} onValueChange={(v) => handleHeaderToggle(v === 'header')}>
                  <SelectTrigger className="h-9 sm:h-10 text-xs sm:text-sm">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent className="bg-background border shadow-lg z-50">
                    <SelectItem value="header">É cabeçalho (ignorar)</SelectItem>
                    <SelectItem value="data">Contém dados</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>

            {/* Stats */}
            <div className="flex flex-wrap gap-2 sm:gap-3">
              <Badge variant="secondary" className="bg-success/10 text-success text-xs">
                <Check className="w-3 h-3 mr-1" />
                {validCount} válidos
              </Badge>
              {invalidCount > 0 && (
                <Badge variant="secondary" className="bg-destructive/10 text-destructive text-xs">
                  <AlertCircle className="w-3 h-3 mr-1" />
                  {invalidCount} inválidos
                </Badge>
              )}
            </div>

            {/* Preview Table */}
            <div className="border rounded-xl overflow-hidden">
              <div className="bg-secondary/30 px-3 sm:px-4 py-2 text-xs font-medium text-muted-foreground">
                Pré-visualização dos dados
              </div>
              <ScrollArea className="h-48 sm:h-64">
                <div className="overflow-x-auto">
                  <table className="w-full text-xs sm:text-sm">
                    <thead className="bg-secondary/20 sticky top-0">
                      <tr>
                        <th className="px-2 sm:px-3 py-2 text-left font-medium whitespace-nowrap">Status</th>
                        <th className="px-2 sm:px-3 py-2 text-left font-medium whitespace-nowrap">Data</th>
                        <th className="px-2 sm:px-3 py-2 text-left font-medium whitespace-nowrap">Descrição</th>
                        <th className="px-2 sm:px-3 py-2 text-left font-medium whitespace-nowrap">Categoria</th>
                        <th className="px-2 sm:px-3 py-2 text-right font-medium whitespace-nowrap">Valor</th>
                        <th className="px-2 sm:px-3 py-2 text-left font-medium whitespace-nowrap">Titular</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-border">
                      {parsedItems.map((item, index) => (
                        <tr key={index} className={!item.isValid ? 'bg-destructive/5' : ''}>
                          <td className="px-2 sm:px-3 py-2">
                            {item.isValid ? (
                              <Check className="w-3 h-3 sm:w-4 sm:h-4 text-success" />
                            ) : (
                              <AlertCircle className="w-3 h-3 sm:w-4 sm:h-4 text-destructive" />
                            )}
                          </td>
                          <td className="px-2 sm:px-3 py-2 text-muted-foreground whitespace-nowrap">
                            {new Date(item.date).toLocaleDateString('pt-BR')}
                          </td>
                          <td className="px-2 sm:px-3 py-2 font-medium">
                            <div className="max-w-[100px] sm:max-w-[150px] truncate">
                              {item.description}
                            </div>
                          </td>
                          <td className="px-2 sm:px-3 py-2">
                            <span className="px-2 py-0.5 bg-primary/10 text-primary rounded-full text-[10px] sm:text-xs whitespace-nowrap">
                              {item.category}
                            </span>
                          </td>
                          <td className="px-2 sm:px-3 py-2 text-right font-medium text-destructive whitespace-nowrap">
                            {formatCurrency(item.amount)}
                          </td>
                          <td className="px-2 sm:px-3 py-2 text-muted-foreground whitespace-nowrap">{item.owner}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </ScrollArea>
            </div>

            {/* Actions */}
            <div className="flex flex-col sm:flex-row gap-2 sm:gap-3">
              <Button variant="outline" onClick={handleReset} className="flex-1 h-9 sm:h-10 text-xs sm:text-sm">
                Cancelar
              </Button>
              <Button 
                onClick={handleImport} 
                disabled={validCount === 0}
                className="flex-1 h-9 sm:h-10 text-xs sm:text-sm"
              >
                Importar {validCount} {validCount === 1 ? 'item' : 'itens'}
              </Button>
            </div>
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
};

export default CSVImportDialog;
