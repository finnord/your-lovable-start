import * as XLSX from 'xlsx';
import { Order } from '@/types/order';
import { CATEGORY_LABELS, formatOrderId } from '@/lib/constants';

interface Product {
  id: string;
  name: string;
  category: string;
  unit: string;
  price: number;
}

export interface KitchenSummary {
  name: string;
  category: string;
  unit: string;
  quantity: number;
}

export interface UnitSummary {
  unit: string;
  totalQuantity: number;
  products: { name: string; quantity: number }[];
}

export interface QuantityBreakdown {
  quantity: number;
  orderCount: number;
  customers: string[];
}

export interface DetailedKitchenSummary {
  productName: string;
  category: string;
  unit: string;
  totalQuantity: number;
  breakdown: QuantityBreakdown[];
}

// Calculate kitchen summary from orders
export function calculateKitchenSummary(
  orders: Order[],
  products: Product[],
  filters?: {
    dateRange?: string[];
    categories?: string[];
  }
): KitchenSummary[] {
  let filteredOrders = orders;

  if (filters?.dateRange?.length) {
    filteredOrders = filteredOrders.filter(o => filters.dateRange!.includes(o.deliveryDate));
  }

  const summary: Record<string, KitchenSummary> = {};

  filteredOrders.forEach(order => {
    order.items.forEach(item => {
      const product = products.find(p => p.name === item.name);
      const category = product?.category || 'altro';
      const unit = product?.unit || 'porzione';

      if (filters?.categories?.length && !filters.categories.includes(category)) {
        return;
      }

      if (!summary[item.name]) {
        summary[item.name] = {
          name: item.name,
          category,
          unit,
          quantity: 0,
        };
      }
      summary[item.name].quantity += item.quantity;
    });
  });

  return Object.values(summary).sort((a, b) => {
    const catCompare = a.category.localeCompare(b.category);
    if (catCompare !== 0) return catCompare;
    return b.quantity - a.quantity;
  });
}

// Calculate summary by unit type
export function calculateUnitSummary(
  orders: Order[],
  products: Product[],
  filters?: {
    dateRange?: string[];
  }
): UnitSummary[] {
  let filteredOrders = orders;

  if (filters?.dateRange?.length) {
    filteredOrders = filteredOrders.filter(o => filters.dateRange!.includes(o.deliveryDate));
  }

  const unitMap: Record<string, { totalQuantity: number; products: Record<string, number> }> = {};

  filteredOrders.forEach(order => {
    order.items.forEach(item => {
      const product = products.find(p => p.name === item.name);
      const unit = product?.unit || 'porzione';

      if (!unitMap[unit]) {
        unitMap[unit] = { totalQuantity: 0, products: {} };
      }
      unitMap[unit].totalQuantity += item.quantity;
      unitMap[unit].products[item.name] = (unitMap[unit].products[item.name] || 0) + item.quantity;
    });
  });

  return Object.entries(unitMap).map(([unit, data]) => ({
    unit,
    totalQuantity: data.totalQuantity,
    products: Object.entries(data.products)
      .map(([name, quantity]) => ({ name, quantity }))
      .sort((a, b) => b.quantity - a.quantity),
  }));
}

// Unit labels for display
export const unitLabels: Record<string, string> = {
  etto: 'Etti',
  pezzo: 'Pezzi',
  porzione: 'Porzioni',
};

// Export kitchen summary to Excel
export function exportKitchenSummary(summary: KitchenSummary[], filename = 'riepilogo-cucina') {
  const data = summary.map(item => ({
    Prodotto: item.name,
    Categoria: CATEGORY_LABELS[item.category] || item.category,
    'Unità': unitLabels[item.unit] || item.unit,
    'Quantità': item.quantity,
  }));

  const ws = XLSX.utils.json_to_sheet(data);
  const wb = XLSX.utils.book_new();
  XLSX.utils.book_append_sheet(wb, ws, 'Riepilogo Cucina');
  XLSX.writeFile(wb, `${filename}.xlsx`);
}

// Export by unit type to Excel
export function exportByUnit(unitSummary: UnitSummary[], filename = 'riepilogo-per-unita') {
  const wb = XLSX.utils.book_new();

  // Summary sheet
  const summaryData = unitSummary.map(u => ({
    'Unità': unitLabels[u.unit] || u.unit,
    'Totale': u.totalQuantity,
  }));
  const summaryWs = XLSX.utils.json_to_sheet(summaryData);
  XLSX.utils.book_append_sheet(wb, summaryWs, 'Riepilogo');

  // Detail sheet for each unit
  unitSummary.forEach(u => {
    const detailData = u.products.map(p => ({
      Prodotto: p.name,
      'Quantità': p.quantity,
    }));
    const detailWs = XLSX.utils.json_to_sheet(detailData);
    XLSX.utils.book_append_sheet(wb, detailWs, unitLabels[u.unit] || u.unit);
  });

  XLSX.writeFile(wb, `${filename}.xlsx`);
}

// Export all orders to Excel
export function exportAllOrders(orders: Order[], products: Product[], filename = 'tutti-ordini') {
  const wb = XLSX.utils.book_new();

  // Orders sheet
  const ordersData = orders.map(order => ({
    'ID Ordine': formatOrderId(order.deliveryDate, order.orderNumber),
    Cliente: order.customerName,
    Telefono: order.customerPhone,
    'Data Ritiro': order.deliveryDate,
    'Ora Ritiro': order.deliveryTime,
    'N. Prodotti': order.items.reduce((sum, i) => sum + i.quantity, 0),
    Note: order.notes || '',
    'Creato il': new Date(order.createdAt).toLocaleString('it-IT'),
  }));
  const ordersWs = XLSX.utils.json_to_sheet(ordersData);
  XLSX.utils.book_append_sheet(wb, ordersWs, 'Ordini');

  // Order items sheet
  const itemsData: { 'ID Ordine': string; Prodotto: string; Quantità: number; Unità: string }[] = [];
  orders.forEach(order => {
    order.items.forEach(item => {
      const product = products.find(p => p.name === item.name);
      itemsData.push({
        'ID Ordine': formatOrderId(order.deliveryDate, order.orderNumber),
        Prodotto: item.name,
        'Quantità': item.quantity,
        'Unità': unitLabels[product?.unit || 'porzione'] || product?.unit || 'porzione',
      });
    });
  });
  const itemsWs = XLSX.utils.json_to_sheet(itemsData);
  XLSX.utils.book_append_sheet(wb, itemsWs, 'Dettaglio Prodotti');

  // Kitchen summary
  const summary = calculateKitchenSummary(orders, products);
  const summaryData = summary.map(item => ({
    Prodotto: item.name,
    Categoria: CATEGORY_LABELS[item.category] || item.category,
    'Unità': unitLabels[item.unit] || item.unit,
    'Quantità Totale': item.quantity,
  }));
  const summaryWs = XLSX.utils.json_to_sheet(summaryData);
  XLSX.utils.book_append_sheet(wb, summaryWs, 'Riepilogo Cucina');

  XLSX.writeFile(wb, `${filename}.xlsx`);
}

// Export filtered data to Excel
export function exportFiltered(
  orders: Order[],
  products: Product[],
  filters: {
    dateRange?: string[];
    categories?: string[];
    units?: string[];
  },
  filename = 'export-filtrato'
) {
  let filteredOrders = orders;

  if (filters.dateRange?.length) {
    filteredOrders = filteredOrders.filter(o => filters.dateRange!.includes(o.deliveryDate));
  }

  const summary = calculateKitchenSummary(filteredOrders, products, { categories: filters.categories });
  
  let finalSummary = summary;
  if (filters.units?.length) {
    finalSummary = summary.filter(s => filters.units!.includes(s.unit));
  }

  exportKitchenSummary(finalSummary, filename);
}

// Calculate detailed kitchen summary with quantity breakdown
export function calculateDetailedKitchenSummary(
  orders: Order[],
  products: Product[],
  filters?: {
    dateRange?: string[];
  }
): DetailedKitchenSummary[] {
  let filteredOrders = orders;

  if (filters?.dateRange?.length) {
    filteredOrders = filteredOrders.filter(o => filters.dateRange!.includes(o.deliveryDate));
  }

  // Group by product name
  const productMap: Record<string, {
    category: string;
    unit: string;
    totalQuantity: number;
    quantityOrders: Record<number, { count: number; customers: string[] }>;
  }> = {};

  filteredOrders.forEach(order => {
    order.items.forEach(item => {
      const product = products.find(p => p.name === item.name);
      const category = product?.category || 'altro';
      const unit = product?.unit || 'porzione';

      if (!productMap[item.name]) {
        productMap[item.name] = {
          category,
          unit,
          totalQuantity: 0,
          quantityOrders: {},
        };
      }

      productMap[item.name].totalQuantity += item.quantity;

      // Track quantity breakdown
      const qty = item.quantity;
      if (!productMap[item.name].quantityOrders[qty]) {
        productMap[item.name].quantityOrders[qty] = { count: 0, customers: [] };
      }
      productMap[item.name].quantityOrders[qty].count++;
      productMap[item.name].quantityOrders[qty].customers.push(order.customerName);
    });
  });

  // Convert to array and sort
  return Object.entries(productMap)
    .map(([productName, data]) => ({
      productName,
      category: data.category,
      unit: data.unit,
      totalQuantity: data.totalQuantity,
      breakdown: Object.entries(data.quantityOrders)
        .map(([qty, info]) => ({
          quantity: parseInt(qty),
          orderCount: info.count,
          customers: info.customers,
        }))
        .sort((a, b) => a.quantity - b.quantity),
    }))
    .sort((a, b) => {
      const catCompare = a.category.localeCompare(b.category);
      if (catCompare !== 0) return catCompare;
      return b.totalQuantity - a.totalQuantity;
    });
}

// Export detailed kitchen summary to Excel
export function exportDetailedKitchen(
  summary: DetailedKitchenSummary[],
  filename = 'dettaglio-cucina'
) {
  const wb = XLSX.utils.book_new();

  // Main summary sheet with breakdown columns
  const maxQty = Math.max(...summary.flatMap(s => s.breakdown.map(b => b.quantity)), 0);
  
  const summaryData = summary.map(item => {
    const row: Record<string, string | number> = {
      'Prodotto': item.productName,
      'Categoria': CATEGORY_LABELS[item.category] || item.category,
      'Unità': unitLabels[item.unit] || item.unit,
      'Totale': item.totalQuantity,
    };
    
    // Add breakdown columns (x1, x2, x3...)
    for (let i = 1; i <= maxQty; i++) {
      const bd = item.breakdown.find(b => b.quantity === i);
      row[`x${i}`] = bd ? bd.orderCount : '';
    }
    
    return row;
  });

  const summaryWs = XLSX.utils.json_to_sheet(summaryData);
  XLSX.utils.book_append_sheet(wb, summaryWs, 'Riepilogo');

  // Detail sheet with customer names
  const detailData: Record<string, string | number>[] = [];
  summary.forEach(item => {
    item.breakdown.forEach(bd => {
      detailData.push({
        'Prodotto': item.productName,
        'Quantità': `x${bd.quantity}`,
        'N. Ordini': bd.orderCount,
        'Clienti': bd.customers.join(', '),
      });
    });
  });

  const detailWs = XLSX.utils.json_to_sheet(detailData);
  XLSX.utils.book_append_sheet(wb, detailWs, 'Dettaglio Clienti');

  XLSX.writeFile(wb, `${filename}.xlsx`);
}

// Export detailed kitchen summary with individual product tabs (vertical layout)
export function exportDetailedByProduct(
  summary: DetailedKitchenSummary[],
  filename = 'dettaglio-per-prodotto'
) {
  const wb = XLSX.utils.book_new();

  // Sheet 1: Riepilogo generale
  const maxQty = Math.max(...summary.flatMap(s => s.breakdown.map(b => b.quantity)), 0);
  
  const summaryData = summary.map(item => {
    const row: Record<string, string | number> = {
      'Prodotto': item.productName,
      'Categoria': CATEGORY_LABELS[item.category] || item.category,
      'Unità': unitLabels[item.unit] || item.unit,
      'Totale': item.totalQuantity,
    };
    
    for (let i = 1; i <= maxQty; i++) {
      const bd = item.breakdown.find(b => b.quantity === i);
      row[`×${i}`] = bd ? bd.orderCount : '';
    }
    
    return row;
  });

  const summaryWs = XLSX.utils.json_to_sheet(summaryData);
  XLSX.utils.book_append_sheet(wb, summaryWs, 'Riepilogo');

  // Sheet 2: Dettaglio Clienti
  const detailData: Record<string, string | number>[] = [];
  summary.forEach(item => {
    item.breakdown.forEach(bd => {
      detailData.push({
        'Prodotto': item.productName,
        'Quantità': `×${bd.quantity}`,
        'N. Ordini': bd.orderCount,
        'Clienti': bd.customers.join(', '),
      });
    });
  });

  const detailWs = XLSX.utils.json_to_sheet(detailData);
  XLSX.utils.book_append_sheet(wb, detailWs, 'Dettaglio Clienti');

  // Individual product tabs with VERTICAL layout
  summary.forEach(item => {
    if (item.totalQuantity === 0) return; // Skip products with no orders

    // First row: product header info
    const headerRow = [{
      'Prodotto': item.productName,
      'Categoria': CATEGORY_LABELS[item.category] || item.category,
      'Unità': unitLabels[item.unit] || item.unit,
    }];

    // Empty row separator
    const emptyRow = [{ 'Prodotto': '', 'Categoria': '', 'Unità': '' }];

    // Quantity breakdown rows (without Clienti column)
    const breakdownHeader = [{ 'Quantità': 'Quantità', 'N. Ordini': 'N. Ordini' }];
    const breakdownData = item.breakdown.map(bd => ({
      'Quantità': `×${bd.quantity}`,
      'N. Ordini': bd.orderCount,
    }));

    // Total row
    const totalRow = [{
      'Quantità': 'TOTALE',
      'N. Ordini': item.totalQuantity,
    }];

    // Build sheet with header info first, then breakdown
    const productWs = XLSX.utils.json_to_sheet(headerRow);
    XLSX.utils.sheet_add_json(productWs, emptyRow, { origin: -1, skipHeader: true });
    XLSX.utils.sheet_add_json(productWs, breakdownHeader, { origin: -1, skipHeader: true });
    XLSX.utils.sheet_add_json(productWs, breakdownData, { origin: -1, skipHeader: true });
    XLSX.utils.sheet_add_json(productWs, totalRow, { origin: -1, skipHeader: true });

    // Sheet name: truncate to 31 chars (Excel limit) and remove invalid chars
    const sheetName = item.productName
      .substring(0, 31)
      .replace(/[\\/*?:\[\]]/g, '')
      .trim() || 'Prodotto';
    
    XLSX.utils.book_append_sheet(wb, productWs, sheetName);
  });

  XLSX.writeFile(wb, `${filename}.xlsx`);
}
