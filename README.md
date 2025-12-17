# Mare Mio - Gestione Ordini Natalizi

Sistema di gestione ordini per il periodo natalizio (24 Dicembre - 1 Gennaio) per la gastronomia/pescheria Mare Mio.

## 🏗️ Struttura del Progetto

```
src/
├── components/           # Componenti React riutilizzabili
│   ├── ui/              # Componenti UI base (shadcn/ui)
│   ├── AppSidebar.tsx   # Navigazione laterale
│   ├── CustomerSelect.tsx
│   ├── OrderForm.tsx
│   ├── OrderHeader.tsx
│   ├── OrderList.tsx
│   └── StatusBadge.tsx
├── hooks/               # Custom React hooks
│   ├── useCustomers.ts  # CRUD clienti
│   ├── useOrders.ts     # CRUD ordini
│   └── useProducts.ts   # Lettura prodotti
├── integrations/        # Integrazioni esterne
│   └── supabase/        # Client e tipi Supabase (auto-generati)
├── lib/                 # Utilities
│   ├── design-tokens.ts # Token design system
│   ├── excel-export.ts  # Export Excel
│   └── utils.ts         # Utility generiche
├── pages/               # Pagine dell'applicazione
│   ├── Dashboard.tsx    # Dashboard principale
│   ├── Clienti.tsx      # Gestione clienti
│   ├── GestioneOrdini.tsx
│   ├── NuovoOrdine.tsx
│   └── Statistiche.tsx
└── types/               # TypeScript types
    └── order.ts         # Tipi per ordini, prodotti, clienti
```

## 📦 Schema Database

### Tabelle

#### `customers`
| Campo | Tipo | Descrizione |
|-------|------|-------------|
| id | UUID | Primary key |
| name | TEXT | Nome cliente |
| phone | TEXT | Telefono cliente |
| created_at | TIMESTAMP | Data creazione |

#### `orders`
| Campo | Tipo | Descrizione |
|-------|------|-------------|
| id | UUID | Primary key |
| order_number | TEXT | Numero ordine (ORD-101, ORD-102, ...) |
| customer_name | TEXT | Nome cliente |
| customer_phone | TEXT | Telefono cliente |
| customer_email | TEXT | Email cliente (opzionale) |
| delivery_date | DATE | Data consegna |
| delivery_time | TEXT | Ora consegna |
| delivery_type | TEXT | 'pickup' o 'delivery' |
| delivery_address | TEXT | Indirizzo (se delivery) |
| notes | TEXT | Note ordine |
| status | TEXT | 'pending', 'confirmed', 'ready', 'delivered', 'cancelled' |
| total_amount | NUMERIC | Totale ordine |
| created_at | TIMESTAMP | Data creazione |
| updated_at | TIMESTAMP | Ultima modifica |

#### `order_items`
| Campo | Tipo | Descrizione |
|-------|------|-------------|
| id | UUID | Primary key |
| order_id | UUID | FK → orders.id |
| product_id | UUID | FK → products.id (opzionale) |
| product_name | TEXT | Nome prodotto |
| quantity | INTEGER | Quantità |
| unit_price | NUMERIC | Prezzo unitario |
| total_price | NUMERIC | Prezzo totale (quantity * unit_price) |

#### `products`
| Campo | Tipo | Descrizione |
|-------|------|-------------|
| id | UUID | Primary key |
| name | TEXT | Nome prodotto |
| description | TEXT | Descrizione |
| price | NUMERIC | Prezzo (€/etto o €/pezzo) |
| category | TEXT | Categoria |
| unit | TEXT | Unità: 'porzione', 'pezzo', 'vaschetta', 'piatto' |
| sort_order | INTEGER | Ordine visualizzazione |
| available | BOOLEAN | Disponibilità |

## 📋 Linee Guida CRUD

### Pattern Standard Hook

Ogni hook CRUD deve seguire questo pattern:

```typescript
export function useEntity() {
  const [entities, setEntities] = useState<Entity[]>([]);
  const [loading, setLoading] = useState(true);

  // FETCH
  const fetchEntities = async () => {
    console.log('[useEntity] fetchEntities called');
    try {
      const { data, error } = await supabase.from('entities').select('*');
      if (error) {
        console.error('[useEntity] fetchEntities error:', error);
        throw error;
      }
      console.log('[useEntity] fetchEntities success:', data?.length, 'entities');
      setEntities(data || []);
    } catch (err) {
      console.error('[useEntity] fetchEntities failed:', err);
    } finally {
      setLoading(false);
    }
  };

  // CREATE
  const addEntity = async (data: CreateData): Promise<Entity | null> => {
    console.log('[useEntity] addEntity called', data);
    try {
      const { data: newEntity, error } = await supabase
        .from('entities')
        .insert(data)
        .select()
        .single();
      
      if (error) {
        console.error('[useEntity] addEntity error:', error);
        return null;
      }
      console.log('[useEntity] addEntity success:', newEntity);
      setEntities(prev => [...prev, newEntity]);
      return newEntity;
    } catch (err) {
      console.error('[useEntity] addEntity failed:', err);
      return null;
    }
  };

  // UPDATE
  const updateEntity = async (id: string, updates: Partial<Entity>): Promise<Entity | null> => {
    console.log('[useEntity] updateEntity called', { id, updates });
    // ... similar pattern
  };

  // DELETE
  const deleteEntity = async (id: string): Promise<boolean> => {
    console.log('[useEntity] deleteEntity called', { id });
    // ... similar pattern
  };

  return { entities, loading, addEntity, updateEntity, deleteEntity, refetch: fetchEntities };
}
```

### Pattern Logging

Tutti i log devono seguire questo formato:
- `[HookName] methodName called` - Inizio operazione
- `[HookName] methodName success` - Operazione riuscita
- `[HookName] methodName error:` - Errore specifico
- `[HookName] methodName failed:` - Operazione fallita

## 🎨 Design System

### Colori (HSL)

```css
--background: 210 20% 98%;     /* Sfondo chiaro */
--foreground: 210 40% 10%;     /* Testo principale */
--primary: 200 60% 50%;        /* Azzurro mare */
--primary-foreground: 0 0% 100%;
--secondary: 210 30% 95%;
--muted: 210 20% 94%;
--accent: 200 50% 45%;
--destructive: 0 84% 60%;
```

### Tipografia

- **Display**: Inter, 3rem+, uppercase
- **Body**: Inter, 0.875rem - 1rem
- **Labels**: uppercase, letter-spacing: 0.1em, 0.75rem

### Spacing (PHI-based)

- xs: 8px
- sm: 13px
- md: 21px
- lg: 34px
- xl: 55px
- 2xl: 89px

## 🔒 Sicurezza

### RLS Policies

Tutte le tabelle hanno Row Level Security abilitato:
- `customers`: SELECT, INSERT, UPDATE, DELETE per tutti (app interna)
- `orders`: SELECT, INSERT, UPDATE, DELETE per tutti
- `order_items`: SELECT, INSERT, UPDATE, DELETE per tutti
- `products`: solo SELECT (catalogo statico)

## 📤 Export Dati

L'applicazione supporta export in formato Excel (.xlsx):
- Export singolo ordine
- Export ordini filtrati
- Export riepilogo prodotti (quantità totali per prodotto)

## 🚀 Sviluppo

```bash
# Installazione dipendenze
npm install

# Avvio development server
npm run dev

# Build produzione
npm run build
```

## 📝 Note

- Gli ordini hanno numerazione sequenziale a partire da 101 (ORD-101, ORD-102, ...)
- Date di ritiro predefinite: 24/12, 25/12, 26/12, 31/12, 01/01
- Orari ritiro: 10:00 - 13:00 ogni mezz'ora
- Solo ritiro in negozio (no consegne)
