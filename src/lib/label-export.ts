import { Order } from '@/types/order';
import { formatOrderId } from '@/lib/constants';
import { format, parseISO } from 'date-fns';
import { it } from 'date-fns/locale';

/**
 * Generate HTML label for a single order
 */
function generateSingleLabelHTML(order: Order, includePageBreak = false): string {
  const formattedDate = (() => {
    try {
      return format(parseISO(order.deliveryDate), 'd MMMM', { locale: it });
    } catch {
      return order.deliveryDate;
    }
  })();

  const orderId = formatOrderId(order.deliveryDate, order.orderNumber);

  return `
    <div class="label" ${includePageBreak ? 'style="page-break-after: always;"' : ''}>
      <div class="header">
        <div class="order-number">${orderId}</div>
        <div class="customer-name">${order.customerName}</div>
      </div>
      
      <div class="info-row">
        <div class="info-block">
          <div class="info-label">Telefono</div>
          <div class="info-value">${order.customerPhone}</div>
        </div>
        <div class="info-block">
          <div class="info-label">Ritiro</div>
          <div class="info-value">${formattedDate} · ${order.deliveryTime}</div>
        </div>
      </div>
      
      <div class="products-section">
        <div class="products-label">Prodotti</div>
        ${order.items.map(item => `
          <div class="product-item">
            <span class="product-qty">${item.quantity}×</span>
            <span class="product-name">${item.name}</span>
          </div>
        `).join('')}
      </div>
      
      ${order.notes ? `
        <div class="notes-section">
          <div class="notes-label">Note</div>
          <div class="notes-value">${order.notes}</div>
        </div>
      ` : ''}
    </div>
  `;
}

/**
 * Copy order label to clipboard as image for WhatsApp
 */
export async function copyLabelToClipboard(order: Order): Promise<boolean> {
  const formattedDate = (() => {
    try {
      return format(parseISO(order.deliveryDate), 'd MMMM', { locale: it });
    } catch {
      return order.deliveryDate;
    }
  })();

  const orderId = formatOrderId(order.deliveryDate, order.orderNumber);

  // Create container with inline styles for html2canvas
  const container = document.createElement('div');
  container.innerHTML = `
    <div style="width: 400px; padding: 24px; background: white; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;">
      <div style="border-bottom: 3px solid #1E3A5F; padding-bottom: 16px; margin-bottom: 16px;">
        <div style="font-size: 36px; font-weight: 800; font-family: monospace; color: #1E3A5F; letter-spacing: -1px;">${orderId}</div>
        <div style="font-size: 20px; font-weight: 600; margin-top: 8px; text-transform: uppercase; letter-spacing: 0.5px; color: #000;">${order.customerName}</div>
      </div>
      
      <div style="display: flex; gap: 32px; margin-bottom: 16px; padding-bottom: 16px; border-bottom: 1px solid #e0e0e0;">
        <div style="flex: 1;">
          <div style="font-size: 10px; text-transform: uppercase; letter-spacing: 1px; color: #666; margin-bottom: 4px;">Telefono</div>
          <div style="font-size: 14px; font-weight: 500; color: #000;">${order.customerPhone}</div>
        </div>
        <div style="flex: 1;">
          <div style="font-size: 10px; text-transform: uppercase; letter-spacing: 1px; color: #666; margin-bottom: 4px;">Ritiro</div>
          <div style="font-size: 14px; font-weight: 500; color: #000;">${formattedDate} · ${order.deliveryTime}</div>
        </div>
      </div>
      
      <div>
        <div style="font-size: 10px; text-transform: uppercase; letter-spacing: 1px; color: #666; margin-bottom: 12px;">Prodotti</div>
        ${order.items.map(item => `
          <div style="font-size: 14px; padding: 8px 0; border-bottom: 1px dotted #ccc; display: flex; color: #000;">
            <span style="font-weight: 700; min-width: 40px; font-family: monospace;">${item.quantity}×</span>
            <span style="flex: 1;">${item.name}</span>
          </div>
        `).join('')}
      </div>
      
      ${order.notes ? `
        <div style="margin-top: 16px; padding-top: 16px; border-top: 1px solid #e0e0e0;">
          <div style="font-size: 10px; text-transform: uppercase; letter-spacing: 1px; color: #666; margin-bottom: 4px;">Note</div>
          <div style="font-size: 12px; font-style: italic; color: #333;">${order.notes}</div>
        </div>
      ` : ''}
    </div>
  `;
  
  container.style.cssText = 'position: absolute; left: -9999px; top: 0;';
  document.body.appendChild(container);

  try {
    const html2canvas = (await import('html2canvas')).default;
    
    const canvas = await html2canvas(container.firstElementChild as HTMLElement, {
      scale: 2,
      backgroundColor: '#ffffff',
      logging: false,
    });

    const blob = await new Promise<Blob>((resolve, reject) => {
      canvas.toBlob((b) => {
        if (b) resolve(b);
        else reject(new Error('Failed to create blob'));
      }, 'image/png', 1.0);
    });

    await navigator.clipboard.write([
      new ClipboardItem({ 'image/png': blob })
    ]);

    return true;
  } finally {
    document.body.removeChild(container);
  }
}

/**
 * Generate base CSS styles for labels
 */
function getLabelStyles(): string {
  return `
    @page {
      size: 105mm 148mm;
      margin: 0;
    }
    * {
      margin: 0;
      padding: 0;
      box-sizing: border-box;
    }
    body {
      font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
    }
    .label {
      width: 105mm;
      height: 148mm;
      padding: 8mm;
      display: flex;
      flex-direction: column;
    }
    .header {
      border-bottom: 2px solid #000;
      padding-bottom: 6mm;
      margin-bottom: 5mm;
    }
    .order-number {
      font-size: 32pt;
      font-weight: 800;
      font-family: 'SF Mono', Monaco, 'Courier New', monospace;
      color: #1E3A5F;
      letter-spacing: -1px;
    }
    .customer-name {
      font-size: 16pt;
      font-weight: 600;
      margin-top: 2mm;
      text-transform: uppercase;
      letter-spacing: 0.5px;
    }
    .info-row {
      display: flex;
      gap: 10mm;
      margin-bottom: 4mm;
      padding-bottom: 4mm;
      border-bottom: 1px solid #e0e0e0;
    }
    .info-block {
      flex: 1;
    }
    .info-label {
      font-size: 7pt;
      text-transform: uppercase;
      letter-spacing: 1px;
      color: #666;
      margin-bottom: 1mm;
    }
    .info-value {
      font-size: 11pt;
      font-weight: 500;
    }
    .products-section {
      flex: 1;
    }
    .products-label {
      font-size: 7pt;
      text-transform: uppercase;
      letter-spacing: 1px;
      color: #666;
      margin-bottom: 3mm;
    }
    .product-item {
      font-size: 11pt;
      padding: 2mm 0;
      border-bottom: 1px dotted #ccc;
      display: flex;
    }
    .product-qty {
      font-weight: 700;
      min-width: 8mm;
      font-family: 'SF Mono', Monaco, 'Courier New', monospace;
    }
    .product-name {
      flex: 1;
    }
    .notes-section {
      margin-top: 4mm;
      padding-top: 4mm;
      border-top: 1px solid #e0e0e0;
    }
    .notes-label {
      font-size: 7pt;
      text-transform: uppercase;
      letter-spacing: 1px;
      color: #666;
      margin-bottom: 1mm;
    }
    .notes-value {
      font-size: 9pt;
      font-style: italic;
      color: #333;
    }
    @media print {
      body { 
        -webkit-print-color-adjust: exact; 
        print-color-adjust: exact;
      }
    }
  `;
}

/**
 * Generate and download an A6 label for an order as HTML/PDF
 * A6 dimensions: 105mm x 148mm
 */
export function downloadOrderLabel(order: Order) {
  const labelHTML = `
<!DOCTYPE html>
<html>
<head>
  <meta charset="UTF-8">
  <title>Etichetta Ordine ${formatOrderId(order.deliveryDate, order.orderNumber)}</title>
  <style>${getLabelStyles()}</style>
</head>
<body>
  ${generateSingleLabelHTML(order, false)}
</body>
</html>`;

  // Create blob and download
  const blob = new Blob([labelHTML], { type: 'text/html' });
  const url = URL.createObjectURL(blob);
  
  // Open in new window for printing
  const printWindow = window.open(url, '_blank');
  if (printWindow) {
    printWindow.onload = () => {
      printWindow.print();
    };
  }
  
  // Cleanup
  setTimeout(() => URL.revokeObjectURL(url), 1000);
}

/**
 * Generate and download multiple A6 labels for bulk printing
 * Each label gets a page break for proper printing
 */
export function downloadMultipleLabels(orders: Order[]) {
  if (orders.length === 0) return;

  const labelsHTML = orders.map((order, index) => 
    generateSingleLabelHTML(order, index < orders.length - 1)
  ).join('');

  const fullHTML = `
<!DOCTYPE html>
<html>
<head>
  <meta charset="UTF-8">
  <title>Etichette Ordini (${orders.length})</title>
  <style>${getLabelStyles()}</style>
</head>
<body>
  ${labelsHTML}
</body>
</html>`;

  // Create blob and download
  const blob = new Blob([fullHTML], { type: 'text/html' });
  const url = URL.createObjectURL(blob);
  
  // Open in new window for printing
  const printWindow = window.open(url, '_blank');
  if (printWindow) {
    printWindow.onload = () => {
      printWindow.print();
    };
  }
  
  // Cleanup
  setTimeout(() => URL.revokeObjectURL(url), 1000);
}

/**
 * Export orders grouped by date to Excel in pivot style
 */
export function exportOrdersPivot(orders: Order[], filename = 'ordini-pivot') {
  // Dynamic import of xlsx
  import('xlsx').then(XLSX => {
    const wb = XLSX.utils.book_new();

    // Group orders by delivery date
    const ordersByDate = orders.reduce((acc, order) => {
      if (!acc[order.deliveryDate]) {
        acc[order.deliveryDate] = [];
      }
      acc[order.deliveryDate].push(order);
      return acc;
    }, {} as Record<string, Order[]>);

    // Sort dates
    const sortedDates = Object.keys(ordersByDate).sort();

    // Create a sheet for each date
    sortedDates.forEach(date => {
      const dateOrders = ordersByDate[date];
      const data: Record<string, string | number>[] = [];

      dateOrders.forEach(order => {
        const orderId = formatOrderId(order.deliveryDate, order.orderNumber);
        
        // Add header row for each order
        data.push({
          'Ordine': orderId,
          'Cliente': order.customerName,
          'Telefono': order.customerPhone,
          'Ora': order.deliveryTime,
          'Prodotto': '',
          'Qtà': '',
        });

        // Add items
        order.items.forEach(item => {
          data.push({
            'Ordine': '',
            'Cliente': '',
            'Telefono': '',
            'Ora': '',
            'Prodotto': item.name,
            'Qtà': item.quantity,
          });
        });

        // Add notes if present
        if (order.notes) {
          data.push({
            'Ordine': '',
            'Cliente': '',
            'Telefono': '',
            'Ora': '',
            'Prodotto': `Note: ${order.notes}`,
            'Qtà': '',
          });
        }

        // Empty row between orders
        data.push({
          'Ordine': '',
          'Cliente': '',
          'Telefono': '',
          'Ora': '',
          'Prodotto': '',
          'Qtà': '',
        });
      });

      const ws = XLSX.utils.json_to_sheet(data);
      
      // Format date for sheet name
      const sheetName = format(parseISO(date), 'd MMM', { locale: it });
      XLSX.utils.book_append_sheet(wb, ws, sheetName);
    });

    // Summary sheet with all products
    const productSummary: Record<string, { quantity: number; orders: number }> = {};
    orders.forEach(order => {
      order.items.forEach(item => {
        if (!productSummary[item.name]) {
          productSummary[item.name] = { quantity: 0, orders: 0 };
        }
        productSummary[item.name].quantity += item.quantity;
        productSummary[item.name].orders++;
      });
    });

    const summaryData = Object.entries(productSummary)
      .map(([name, data]) => ({
        'Prodotto': name,
        'Quantità Totale': data.quantity,
        'N. Ordini': data.orders,
      }))
      .sort((a, b) => b['Quantità Totale'] - a['Quantità Totale']);

    const summaryWs = XLSX.utils.json_to_sheet(summaryData);
    XLSX.utils.book_append_sheet(wb, summaryWs, 'Riepilogo Totale');

    XLSX.writeFile(wb, `${filename}.xlsx`);
  });
}
