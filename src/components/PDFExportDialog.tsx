import React, { useState } from 'react';
import { FileText, Download, Loader2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Card } from '@/contexts/FinanceContext';
import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';

interface PDFExportDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  card: Card;
  items: Card['invoiceItems'];
  month: number;
  year: number;
  ownerTotals: Record<string, number>;
}

const MONTH_NAMES = [
  'Janeiro', 'Fevereiro', 'Março', 'Abril', 'Maio', 'Junho',
  'Julho', 'Agosto', 'Setembro', 'Outubro', 'Novembro', 'Dezembro'
];

const PDFExportDialog: React.FC<PDFExportDialogProps> = ({
  open,
  onOpenChange,
  card,
  items,
  month,
  year,
  ownerTotals,
}) => {
  const [isGenerating, setIsGenerating] = useState(false);

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('pt-BR', {
      style: 'currency',
      currency: 'BRL',
    }).format(amount);
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('pt-BR');
  };

  const totalAmount = items.reduce((sum, item) => sum + item.amount, 0);

  const generatePDF = async () => {
    setIsGenerating(true);

    try {
      const doc = new jsPDF();
      const pageWidth = doc.internal.pageSize.getWidth();
      
      // Header gradient simulation with colored rectangle
      doc.setFillColor(37, 99, 235); // Primary blue color
      doc.rect(0, 0, pageWidth, 60, 'F');
      
      // Logo/Title
      doc.setTextColor(255, 255, 255);
      doc.setFontSize(24);
      doc.setFont('helvetica', 'bold');
      doc.text('ALTCORP WALLET', 20, 25);
      
      // Subtitle
      doc.setFontSize(14);
      doc.setFont('helvetica', 'normal');
      doc.text('Fatura do Cartão', 20, 35);
      
      // Card name and period
      doc.setFontSize(18);
      doc.setFont('helvetica', 'bold');
      doc.text(card.name, 20, 50);
      
      // Period badge
      const periodText = `${MONTH_NAMES[month]} / ${year}`;
      doc.setFontSize(12);
      doc.setFont('helvetica', 'normal');
      const periodWidth = doc.getTextWidth(periodText) + 16;
      doc.setFillColor(255, 255, 255, 0.2);
      doc.roundedRect(pageWidth - 20 - periodWidth, 20, periodWidth, 24, 4, 4, 'F');
      doc.text(periodText, pageWidth - 20 - periodWidth + 8, 35);

      let yPos = 75;

      // Total Summary Card
      doc.setFillColor(248, 250, 252); // Slate 50
      doc.roundedRect(15, yPos, pageWidth - 30, 35, 4, 4, 'F');
      
      doc.setTextColor(100, 116, 139); // Slate 500
      doc.setFontSize(10);
      doc.text('TOTAL DA FATURA', 25, yPos + 12);
      
      doc.setTextColor(220, 38, 38); // Red 600
      doc.setFontSize(22);
      doc.setFont('helvetica', 'bold');
      doc.text(formatCurrency(totalAmount), 25, yPos + 28);
      
      // Items count
      doc.setTextColor(100, 116, 139);
      doc.setFontSize(10);
      doc.setFont('helvetica', 'normal');
      doc.text(`${items.length} lançamentos`, pageWidth - 25, yPos + 20, { align: 'right' });

      yPos += 50;

      // Owner Totals Section
      if (Object.keys(ownerTotals).length > 0) {
        doc.setTextColor(30, 41, 59); // Slate 800
        doc.setFontSize(12);
        doc.setFont('helvetica', 'bold');
        doc.text('Gastos por Titular', 20, yPos);
        
        yPos += 10;

        const ownerEntries = Object.entries(ownerTotals);
        const cardWidth = (pageWidth - 40 - (ownerEntries.length - 1) * 10) / ownerEntries.length;
        
        ownerEntries.forEach(([owner, total], index) => {
          const xPos = 20 + index * (cardWidth + 10);
          
          // Card background
          doc.setFillColor(254, 242, 242); // Red 50
          doc.roundedRect(xPos, yPos, cardWidth, 30, 3, 3, 'F');
          
          // Owner name
          doc.setTextColor(100, 116, 139);
          doc.setFontSize(9);
          doc.setFont('helvetica', 'normal');
          doc.text(owner, xPos + 8, yPos + 12);
          
          // Amount
          doc.setTextColor(220, 38, 38);
          doc.setFontSize(12);
          doc.setFont('helvetica', 'bold');
          doc.text(formatCurrency(total), xPos + 8, yPos + 24);
        });

        yPos += 45;
      }

      // Items Table
      doc.setTextColor(30, 41, 59);
      doc.setFontSize(12);
      doc.setFont('helvetica', 'bold');
      doc.text('Lançamentos da Fatura', 20, yPos);
      
      yPos += 8;

      // Prepare table data
      const tableData = items.map(item => [
        formatDate(item.date),
        item.description,
        item.category,
        item.owner || 'Eu',
        formatCurrency(item.amount),
      ]);

      // Add table using autoTable
      autoTable(doc, {
        startY: yPos,
        head: [['Data', 'Descrição', 'Categoria', 'Titular', 'Valor']],
        body: tableData,
        theme: 'plain',
        styles: {
          fontSize: 9,
          cellPadding: 6,
          lineColor: [226, 232, 240], // Slate 200
          lineWidth: 0.5,
        },
        headStyles: {
          fillColor: [241, 245, 249], // Slate 100
          textColor: [71, 85, 105], // Slate 600
          fontStyle: 'bold',
          halign: 'left',
        },
        columnStyles: {
          0: { cellWidth: 25 },
          1: { cellWidth: 'auto' },
          2: { cellWidth: 30 },
          3: { cellWidth: 25 },
          4: { cellWidth: 30, halign: 'right', textColor: [220, 38, 38] },
        },
        alternateRowStyles: {
          fillColor: [248, 250, 252], // Slate 50
        },
        margin: { left: 15, right: 15 },
      });

      // Footer
      const finalY = (doc as any).lastAutoTable?.finalY || yPos + 50;
      const footerY = Math.max(finalY + 20, doc.internal.pageSize.getHeight() - 30);
      
      doc.setDrawColor(226, 232, 240);
      doc.line(15, footerY - 10, pageWidth - 15, footerY - 10);
      
      doc.setTextColor(148, 163, 184); // Slate 400
      doc.setFontSize(8);
      doc.setFont('helvetica', 'normal');
      doc.text(
        `Documento gerado em ${new Date().toLocaleDateString('pt-BR')} às ${new Date().toLocaleTimeString('pt-BR')}`,
        pageWidth / 2,
        footerY,
        { align: 'center' }
      );
      doc.text('ALTCORP WALLET - Gestão Financeira Pessoal', pageWidth / 2, footerY + 6, { align: 'center' });

      // Save PDF
      const fileName = `fatura_${card.name.toLowerCase().replace(/\s+/g, '_')}_${MONTH_NAMES[month].toLowerCase()}_${year}.pdf`;
      doc.save(fileName);
      
      onOpenChange(false);
    } catch (error) {
      console.error('Error generating PDF:', error);
    } finally {
      setIsGenerating(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-lg">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <FileText className="w-5 h-5" />
            Exportar Fatura em PDF
          </DialogTitle>
        </DialogHeader>

        <div className="space-y-4 mt-4">
          {/* Preview Card */}
          <div className="border rounded-2xl overflow-hidden">
            {/* Header Preview */}
            <div 
              className="p-4 text-white"
              style={{ backgroundColor: card.color }}
            >
              <p className="text-sm opacity-80">Cartão</p>
              <p className="text-xl font-bold">{card.name}</p>
              <p className="text-sm mt-1">{MONTH_NAMES[month]} / {year}</p>
            </div>

            <div className="p-4 space-y-4">
              {/* Total */}
              <div className="flex justify-between items-center">
                <span className="text-sm text-muted-foreground">Total da Fatura</span>
                <span className="text-xl font-bold text-destructive">{formatCurrency(totalAmount)}</span>
              </div>

              {/* Owner Summary */}
              {Object.keys(ownerTotals).length > 0 && (
                <div className="space-y-2">
                  <p className="text-xs font-medium text-muted-foreground uppercase">Por Titular</p>
                  <div className="grid grid-cols-2 gap-2">
                    {Object.entries(ownerTotals).map(([owner, total]) => (
                      <div key={owner} className="flex justify-between items-center p-2 bg-secondary/30 rounded-lg">
                        <span className="text-sm">{owner}</span>
                        <span className="text-sm font-medium text-destructive">{formatCurrency(total)}</span>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Items count */}
              <div className="flex justify-between items-center pt-2 border-t">
                <span className="text-sm text-muted-foreground">Lançamentos</span>
                <span className="text-sm font-medium">{items.length} itens</span>
              </div>
            </div>
          </div>

          {/* Info */}
          <div className="p-3 bg-secondary/30 rounded-xl text-sm text-muted-foreground">
            <p>O PDF incluirá:</p>
            <ul className="list-disc list-inside mt-1 space-y-0.5">
              <li>Resumo da fatura com total</li>
              <li>Gastos separados por titular</li>
              <li>Lista completa de todos os lançamentos</li>
            </ul>
          </div>

          {/* Action Button */}
          <Button 
            onClick={generatePDF} 
            disabled={isGenerating || items.length === 0}
            className="w-full h-12 rounded-xl"
          >
            {isGenerating ? (
              <>
                <Loader2 className="w-5 h-5 mr-2 animate-spin" />
                Gerando PDF...
              </>
            ) : (
              <>
                <Download className="w-5 h-5 mr-2" />
                Baixar PDF
              </>
            )}
          </Button>

          {items.length === 0 && (
            <p className="text-sm text-center text-muted-foreground">
              Não há lançamentos para exportar neste período.
            </p>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
};

export default PDFExportDialog;
