// Centralized constants for the application

// Available pickup dates for Christmas 2025 season
export const PICKUP_DATES = [
  { value: '2025-12-23', label: '23/12' },
  { value: '2025-12-24', label: '24/12' },
  { value: '2025-12-30', label: '30/12' },
  { value: '2025-12-31', label: '31/12' },
];

// Available pickup times
export const PICKUP_TIMES = [
  '09:00', '09:30', '10:00', '10:30', '11:00', '11:30',
  '12:00', '12:30', '13:00', '13:30', '14:00', '14:30',
  '15:00', '15:30', '16:00', '16:30', '17:00', '17:30', 
  '18:00', '18:30', '19:00'
];


// Unit labels for products
export const UNIT_LABELS: Record<string, string> = {
  'porzione': 'porz.',
  'etto': 'etto',
  'pezzo': 'pz.',
  'kg': 'kg',
};

// Category labels mapping
export const CATEGORY_LABELS: Record<string, string> = {
  antipasti: 'Antipasti',
  sughi: 'Sughi',
  primi: 'Primi Piatti',
  secondi: 'Secondi Piatti',
  pronti_a_cuocere: 'Pronti a Cuocere',
  crudi: 'Crudi',
  dolci: 'Dolci',
  altro: 'Altro',
};

// Helper function to format order ID as DD-XXX
export function formatOrderId(deliveryDate: string, orderNumber: string): string {
  if (!deliveryDate || !orderNumber) return orderNumber || '';
  
  // Se è già nel formato DD-XXX, restituiscilo così com'è
  if (/^\d{2}-\d+$/.test(orderNumber)) {
    return orderNumber;
  }
  
  // Extract day from date (YYYY-MM-DD format)
  const day = deliveryDate.split('-')[2];
  
  // Remove any existing prefix like "ORD-" and get just the number
  const numericPart = orderNumber.replace(/\D/g, '');
  
  return `${day}-${numericPart}`;
}

// Helper function to extract order number from formatted ID
export function extractOrderNumber(formattedId: string): string {
  if (!formattedId) return '';
  
  // If it's in DD-XXX format, extract the XXX part
  if (formattedId.includes('-')) {
    const parts = formattedId.split('-');
    return parts[parts.length - 1];
  }
  
  // Otherwise return as-is
  return formattedId.replace(/\D/g, '');
}
