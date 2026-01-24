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
  'Janeiro', 'Fevereiro', 'Marco', 'Abril', 'Maio', 'Junho',
  'Julho', 'Agosto', 'Setembro', 'Outubro', 'Novembro', 'Dezembro'
];

const PIE_COLORS = [
  [59, 130, 246],
  [16, 185, 129],
  [245, 158, 11],
  [239, 68, 68],
  [139, 92, 246],
  [236, 72, 153],
  [20, 184, 166],
  [249, 115, 22],
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

  const drawPieSlice = (
    doc: jsPDF,
    centerX: number,
    centerY: number,
    radius: number,
    startAngle: number,
    endAngle: number,
    color: number[]
  ) => {
    doc.setFillColor(color[0], color[1], color[2]);
    const steps = 50;
    const angleStep = (endAngle - startAngle) / steps;
    const points: [number, number][] = [[centerX, centerY]];
    for (let i = 0; i <= steps; i++) {
      const angle = startAngle + i * angleStep;
      const x = centerX + radius * Math.cos(angle);
      const y = centerY + radius * Math.sin(angle);
      points.push([x, y]);
    }
    for (let i = 1; i < points.length - 1; i++) {
      doc.triangle(
        points[0][0], points[0][1],
        points[i][0], points[i][1],
        points[i + 1][0], points[i + 1][1],
        'F'
      );
    }
  };

  const generatePDF = async () => {
    setIsGenerating(true);
    try {
      const doc = new jsPDF();
      const pageWidth = doc.internal.pageSize.getWidth();
      const pageHeight = doc.internal.pageSize.getHeight();
      
      let logoLoaded = false;
      const logoImg = new Image();
      try {
        logoImg.src = '/altcorp-logo.png';
        await new Promise((resolve, reject) => {
          logoImg.onload = resolve;
          logoImg.onerror = reject;
          setTimeout(reject, 1000);
        });
        logoLoaded = true;
      } catch {
        logoLoaded = false;
      }

      const drawHeader = () => {
        if (logoLoaded) {
          doc.addImage(logoImg, 'PNG', 20, 12, 18, 18);
          doc.setTextColor(37, 99, 235);
          doc.setFontSize(16);
          doc.setFont('helvetica', 'bold');
          doc.text('AltCorp', 42, 24);
        } else {
          doc.setFillColor(37, 99, 235);
          doc.circle(28, 20, 8, 'F');
          doc.setTextColor(255, 255, 255);
          doc.setFontSize(12);
          doc.setFont('helvetica', 'bold');
          doc.text('A', 28, 23, { align: 'center' });
          doc.setTextColor(37, 99, 235);
          doc.setFontSize(16);
          doc.text('AltCorp', 42, 24);
        }
      };

      const drawFooter = (pageNum: number, totalPages: number) => {
        const date = new Date();
        const dateStr = 'Gerado em ' + date.toLocaleDateString('pt-BR') + ' as ' + date.toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' });
        
        doc.setDrawColor(230, 230, 230);
        doc.setLineWidth(0.3);
        doc.line(20, pageHeight - 20, pageWidth - 20, pageHeight - 20);
        doc.setTextColor(150, 150, 150);
        doc.setFontSize(8);
        doc.setFont('helvetica', 'normal');
        doc.text('Pagina ' + pageNum + ' de ' + totalPages, 20, pageHeight - 12);
        doc.text('AltCorp Wallet', pageWidth / 2, pageHeight - 12, { align: 'center' });
        doc.text(dateStr, pageWidth - 20, pageHeight - 12, { align: 'right' });
      };

      // PAGINA 1 - CAPA
      doc.setFillColor(29, 78, 216);
      doc.rect(0, 0, pageWidth, pageHeight, 'F');
      doc.setFillColor(59, 130, 246);
      doc.circle(pageWidth - 30, 50, 60, 'F');
      doc.setFillColor(96, 165, 250);
      doc.circle(30, pageHeight - 40, 40, 'F');
      
      if (logoLoaded) {
        doc.addImage(logoImg, 'PNG', pageWidth / 2 - 20, 40, 40, 40);
      } else {
        doc.setFillColor(255, 255, 255);
        doc.circle(pageWidth / 2, 60, 20, 'F');
        doc.setTextColor(37, 99, 235);
        doc.setFontSize(24);
        doc.setFont('helvetica', 'bold');
        doc.text('A', pageWidth / 2, 67, { align: 'center' });
      }
      
      doc.setTextColor(255, 255, 255);
      doc.setFontSize(28);
      doc.setFont('helvetica', 'bold');
      doc.text('AltCorp Wallet', pageWidth / 2, 100, { align: 'center' });
      doc.setFontSize(14);
      doc.setFont('helvetica', 'normal');
      doc.text('Fatura do Cartao de Credito', pageWidth / 2, 115, { align: 'center' });
      
      const boxY = 140;
      const boxHeight = 100;
      doc.setFillColor(255, 255, 255);
      doc.roundedRect(30, boxY, pageWidth - 60, boxHeight, 8, 8, 'F');
      
      doc.setTextColor(100, 100, 100);
      doc.setFontSize(11);
      doc.setFont('helvetica', 'normal');
      doc.text('Cartao', pageWidth / 2, boxY + 20, { align: 'center' });
      doc.setTextColor(37, 99, 235);
      doc.setFontSize(22);
      doc.setFont('helvetica', 'bold');
      doc.text(card.name, pageWidth / 2, boxY + 38, { align: 'center' });
      
      doc.setDrawColor(230, 230, 230);
      doc.setLineWidth(0.5);
      doc.line(50, boxY + 50, pageWidth - 50, boxY + 50);
      
      doc.setTextColor(100, 100, 100);
      doc.setFontSize(11);
      doc.setFont('helvetica', 'normal');
      doc.text('Periodo', pageWidth / 2, boxY + 65, { align: 'center' });
      doc.setTextColor(51, 51, 51);
      doc.setFontSize(18);
      doc.setFont('helvetica', 'bold');
      doc.text(MONTH_NAMES[month] + ' de ' + year, pageWidth / 2, boxY + 82, { align: 'center' });
      
      const totalBoxY = boxY + boxHeight + 20;
      doc.setFillColor(255, 255, 255);
      doc.roundedRect(30, totalBoxY, pageWidth - 60, 70, 8, 8, 'F');
      doc.setTextColor(100, 100, 100);
      doc.setFontSize(12);
      doc.setFont('helvetica', 'normal');
      doc.text('TOTAL A PAGAR', pageWidth / 2, totalBoxY + 25, { align: 'center' });
      doc.setTextColor(37, 99, 235);
      doc.setFontSize(36);
      doc.setFont('helvetica', 'bold');
      doc.text(formatCurrency(totalAmount), pageWidth / 2, totalBoxY + 52, { align: 'center' });
      
      doc.setTextColor(255, 255, 255);
      doc.setFontSize(11);
      doc.setFont('helvetica', 'normal');
      const itemsText = items.length + ' lancamento' + (items.length !== 1 ? 's' : '') + ' nesta fatura';
      doc.text(itemsText, pageWidth / 2, totalBoxY + 90, { align: 'center' });

      // PAGINA 2 - DETALHAMENTO
      doc.addPage();
      doc.setFillColor(255, 255, 255);
      doc.rect(0, 0, pageWidth, pageHeight, 'F');
      drawHeader();
      
      doc.setTextColor(51, 51, 51);
      doc.setFontSize(20);
      doc.setFont('helvetica', 'bold');
      doc.text('Detalhamento da Fatura', pageWidth / 2, 50, { align: 'center' });
      doc.setTextColor(100, 100, 100);
      doc.setFontSize(11);
      doc.setFont('helvetica', 'normal');
      doc.text(card.name + ' - ' + MONTH_NAMES[month] + ' de ' + year, pageWidth / 2, 60, { align: 'center' });
      doc.setDrawColor(37, 99, 235);
      doc.setLineWidth(2);
      doc.line(pageWidth / 2 - 30, 67, pageWidth / 2 + 30, 67);

      const tableData = items.map(item => [
        formatDate(item.date),
        item.description,
        item.category,
        item.owner || 'Eu',
        formatCurrency(item.amount),
      ]);

      autoTable(doc, {
        startY: 80,
        head: [['Data', 'Descricao', 'Categoria', 'Titular', 'Valor']],
        body: tableData,
        theme: 'striped',
        showHead: 'everyPage',
        styles: {
          fontSize: 9,
          cellPadding: 8,
          halign: 'center',
          valign: 'middle',
          lineColor: [230, 230, 230],
          lineWidth: 0.3,
          textColor: [60, 60, 60],
          font: 'helvetica',
        },
        headStyles: {
          fillColor: [37, 99, 235],
          textColor: [255, 255, 255],
          fontStyle: 'bold',
          fontSize: 9,
          halign: 'center',
        },
        columnStyles: {
          0: { cellWidth: 25, halign: 'center' },
          1: { cellWidth: 'auto', halign: 'left' },
          2: { cellWidth: 30, halign: 'center' },
          3: { cellWidth: 28, halign: 'center' },
          4: { cellWidth: 32, halign: 'right', textColor: [37, 99, 235], fontStyle: 'bold' },
        },
        alternateRowStyles: { fillColor: [248, 250, 255] },
        margin: { left: 20, right: 20, top: 60, bottom: 40 },
        didDrawPage: (data) => {
          // Só desenha header/footer nas páginas de continuação da tabela (página 3+)
          const currentPage = doc.getCurrentPageInfo().pageNumber;
          if (currentPage > 2) {
            drawHeader();
          }
        },
      });
      
      // Desenha o TOTAL na última página onde a tabela terminou
      const finalTableY = (doc as any).lastAutoTable?.finalY || 200;
      const finalTablePage = doc.getCurrentPageInfo().pageNumber;
      
      // Verifica se há espaço para o TOTAL na página atual (precisa de ~35px + 40px do footer = 75px)
      if (finalTableY + 75 > pageHeight - 40) {
        // Não há espaço, cria nova página
        doc.addPage();
        doc.setFillColor(255, 255, 255);
        doc.rect(0, 0, pageWidth, pageHeight, 'F');
        drawHeader();
        
        doc.setFillColor(37, 99, 235);
        doc.roundedRect(20, 80, pageWidth - 40, 25, 4, 4, 'F');
        doc.setTextColor(255, 255, 255);
        doc.setFontSize(11);
        doc.setFont('helvetica', 'bold');
        doc.text('TOTAL', 30, 95);
        doc.setFontSize(14);
        doc.text(formatCurrency(totalAmount), pageWidth - 30, 95, { align: 'right' });
      } else {
        // Há espaço, desenha na página atual
        doc.setFillColor(37, 99, 235);
        doc.roundedRect(20, finalTableY + 10, pageWidth - 40, 25, 4, 4, 'F');
        doc.setTextColor(255, 255, 255);
        doc.setFontSize(11);
        doc.setFont('helvetica', 'bold');
        doc.text('TOTAL', 30, finalTableY + 25);
        doc.setFontSize(14);
        doc.text(formatCurrency(totalAmount), pageWidth - 30, finalTableY + 25, { align: 'right' });
      }

      // PAGINA 3+ - GRAFICO DE GASTOS (número da página depende se a tabela continuou)
      doc.addPage();
      doc.setFillColor(255, 255, 255);
      doc.rect(0, 0, pageWidth, pageHeight, 'F');
      drawHeader();
      
      doc.setTextColor(51, 51, 51);
      doc.setFontSize(20);
      doc.setFont('helvetica', 'bold');
      doc.text('Distribuicao de Gastos', pageWidth / 2, 50, { align: 'center' });
      doc.setTextColor(100, 100, 100);
      doc.setFontSize(11);
      doc.setFont('helvetica', 'normal');
      doc.text(MONTH_NAMES[month] + ' de ' + year, pageWidth / 2, 60, { align: 'center' });
      doc.setDrawColor(37, 99, 235);
      doc.setLineWidth(2);
      doc.line(pageWidth / 2 - 30, 67, pageWidth / 2 + 30, 67);
      
      const ownerEntries = Object.entries(ownerTotals);
      
      if (ownerEntries.length > 0) {
        const centerX = pageWidth / 2;
        const centerY = 150;
        const radius = 55;
        let currentAngle = -Math.PI / 2;
        
        ownerEntries.forEach(([, total], index) => {
          const percentage = total / totalAmount;
          const sliceAngle = percentage * 2 * Math.PI;
          const endAngle = currentAngle + sliceAngle;
          const color = PIE_COLORS[index % PIE_COLORS.length];
          drawPieSlice(doc, centerX, centerY, radius, currentAngle, endAngle, color);
          currentAngle = endAngle;
        });
        
        doc.setFillColor(255, 255, 255);
        doc.circle(centerX, centerY, radius * 0.5, 'F');
        doc.setTextColor(51, 51, 51);
        doc.setFontSize(9);
        doc.setFont('helvetica', 'normal');
        doc.text('TOTAL', centerX, centerY - 6, { align: 'center' });
        doc.setFontSize(13);
        doc.setFont('helvetica', 'bold');
        doc.text(formatCurrency(totalAmount), centerX, centerY + 7, { align: 'center' });
        
        const legendY = 225;
        const legendX = 40;
        const itemsPerRow = 2;
        const itemWidth = (pageWidth - 80) / itemsPerRow;
        
        ownerEntries.forEach(([owner, total], index) => {
          const row = Math.floor(index / itemsPerRow);
          const col = index % itemsPerRow;
          const x = legendX + col * itemWidth;
          const y = legendY + row * 28;
          const color = PIE_COLORS[index % PIE_COLORS.length];
          const percentage = ((total / totalAmount) * 100).toFixed(1);
          
          doc.setFillColor(color[0], color[1], color[2]);
          doc.roundedRect(x, y - 6, 14, 14, 2, 2, 'F');
          doc.setTextColor(51, 51, 51);
          doc.setFontSize(11);
          doc.setFont('helvetica', 'bold');
          doc.text(owner, x + 20, y + 3);
          doc.setTextColor(100, 100, 100);
          doc.setFontSize(10);
          doc.setFont('helvetica', 'normal');
          doc.text(percentage + '% - ' + formatCurrency(total), x + 20, y + 12);
        });
      } else {
        doc.setTextColor(100, 100, 100);
        doc.setFontSize(12);
        doc.setFont('helvetica', 'normal');
        doc.text('Todos os gastos pertencem a um unico titular.', pageWidth / 2, 140, { align: 'center' });
        doc.setTextColor(37, 99, 235);
        doc.setFontSize(24);
        doc.setFont('helvetica', 'bold');
        doc.text(formatCurrency(totalAmount), pageWidth / 2, 170, { align: 'center' });
      }

      // PAGINA 4+ - DETALHAMENTO POR TITULAR
      doc.addPage();
      doc.setFillColor(255, 255, 255);
      doc.rect(0, 0, pageWidth, pageHeight, 'F');
      drawHeader();
      
      doc.setTextColor(51, 51, 51);
      doc.setFontSize(20);
      doc.setFont('helvetica', 'bold');
      doc.text('Detalhamento por Titular', pageWidth / 2, 50, { align: 'center' });
      doc.setTextColor(100, 100, 100);
      doc.setFontSize(11);
      doc.setFont('helvetica', 'normal');
      doc.text(MONTH_NAMES[month] + ' de ' + year, pageWidth / 2, 60, { align: 'center' });
      doc.setDrawColor(37, 99, 235);
      doc.setLineWidth(2);
      doc.line(pageWidth / 2 - 30, 67, pageWidth / 2 + 30, 67);
      
      if (ownerEntries.length > 0) {
        const ownerTableData = ownerEntries.map(([owner, total]) => {
          const percentage = ((total / totalAmount) * 100).toFixed(1);
          return [owner, percentage + '%', formatCurrency(total)];
        });
        
        autoTable(doc, {
          startY: 85,
          head: [['Titular', 'Participacao', 'Valor']],
          body: ownerTableData,
          theme: 'striped',
          styles: {
            fontSize: 11,
            cellPadding: 12,
            halign: 'center',
            valign: 'middle',
            lineColor: [230, 230, 230],
            lineWidth: 0.3,
            textColor: [60, 60, 60],
          },
          headStyles: {
            fillColor: [37, 99, 235],
            textColor: [255, 255, 255],
            fontStyle: 'bold',
            fontSize: 11,
          },
          columnStyles: {
            0: { cellWidth: 70, halign: 'left', fontStyle: 'bold' },
            1: { cellWidth: 50, halign: 'center' },
            2: { cellWidth: 60, halign: 'right', textColor: [37, 99, 235], fontStyle: 'bold', fontSize: 12 },
          },
          alternateRowStyles: { fillColor: [248, 250, 255] },
          margin: { left: 20, right: 20 },
        });
        
        const finalY = (doc as any).lastAutoTable?.finalY || 150;
        doc.setFillColor(37, 99, 235);
        doc.roundedRect(20, finalY + 10, pageWidth - 40, 28, 4, 4, 'F');
        doc.setTextColor(255, 255, 255);
        doc.setFontSize(12);
        doc.setFont('helvetica', 'bold');
        doc.text('TOTAL GERAL', 30, finalY + 28);
        doc.setFontSize(16);
        doc.text(formatCurrency(totalAmount), pageWidth - 30, finalY + 28, { align: 'right' });
      }
      
      // Agora que todas as páginas foram criadas, adiciona os footers (exceto na capa)
      const totalPages = doc.getNumberOfPages();
      for (let i = 2; i <= totalPages; i++) {
        doc.setPage(i);
        drawFooter(i, totalPages);
      }

      const fileName = 'Fatura_' + card.name.replace(/[^a-zA-Z0-9]/g, '_') + '_' + MONTH_NAMES[month] + '_' + year + '.pdf';
      doc.save(fileName);
      onOpenChange(false);
    } catch { /* silent */ } finally {
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
        <div className="space-y-4">
          <div 
            className="p-4 rounded-lg border"
            style={{ borderColor: card.color, backgroundColor: card.color + '10' }}
          >
            <div className="flex justify-between items-start mb-3">
              <div>
                <h3 className="font-semibold" style={{ color: card.color }}>{card.name}</h3>
                <p className="text-sm text-muted-foreground">{MONTH_NAMES[month]} de {year}</p>
              </div>
              <div className="w-8 h-8 rounded-full" style={{ backgroundColor: card.color }} />
            </div>
            <div className="text-2xl font-bold text-foreground mb-2">
              {formatCurrency(totalAmount)}
            </div>
            <p className="text-sm text-muted-foreground">
              {items.length} {items.length === 1 ? 'lancamento' : 'lancamentos'}
            </p>
          </div>
          {Object.keys(ownerTotals).length > 0 && (
            <div className="space-y-2">
              <h4 className="text-sm font-medium">Gastos por pessoa:</h4>
              <div className="grid grid-cols-2 gap-2">
                {Object.entries(ownerTotals).map(([owner, total]) => (
                  <div key={owner} className="flex justify-between text-sm bg-muted/50 rounded px-2 py-1">
                    <span>{owner}</span>
                    <span className="font-medium">{formatCurrency(total)}</span>
                  </div>
                ))}
              </div>
            </div>
          )}
          <div className="bg-blue-50 dark:bg-blue-950/30 rounded-lg p-3 text-sm">
            <p className="text-blue-700 dark:text-blue-300">O PDF tera 4 paginas:</p>
            <ul className="text-blue-600 dark:text-blue-400 mt-1 ml-4 list-disc text-xs">
              <li>Capa com valor total</li>
              <li>Detalhamento dos lancamentos</li>
              <li>Grafico de distribuicao de gastos</li>
              <li>Detalhamento por titular</li>
            </ul>
          </div>
          <div className="flex gap-2">
            <Button variant="outline" className="flex-1" onClick={() => onOpenChange(false)}>
              Cancelar
            </Button>
            <Button className="flex-1" onClick={generatePDF} disabled={isGenerating}>
              {isGenerating ? (
                <>
                  <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                  Gerando...
                </>
              ) : (
                <>
                  <Download className="w-4 h-4 mr-2" />
                  Baixar PDF
                </>
              )}
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
};

export default PDFExportDialog;
