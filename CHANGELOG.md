# CHANGELOG

Registro delle modifiche all'applicazione Mare Mio Order Management.

---

## [2025-12-17] - Backup Automatico Giornaliero

### ✨ Features

- **Daily Backup Edge Function** - Nuovo sistema di backup automatico:
  - Esecuzione automatica ogni giorno alle 03:00
  - Salvataggio in Storage bucket privato `backups`
  - Backup di 8 tabelle: orders, order_items, customers, products, categories, reservations, tables, restaurant_settings
  - Retention: ultimi 7 giorni (file più vecchi eliminati automaticamente)
  - File formato: `backup-YYYY-MM-DD.json`
  - Logging dettagliato per debugging

### 🔧 Infrastruttura

- **pg_cron + pg_net** - Estensioni database abilitate per scheduling HTTP
- **Storage bucket `backups`** - Bucket privato con policy service_role
- **Edge Function `daily-backup`** - Funzione Deno per raccolta e salvataggio dati

---

## [2025-12-15] - Audit e Consistenza

### 🔧 Fix

- **PageWrapper padding** - Aggiunto padding responsive (`p-8 md:p-12 lg:p-16`) al componente `PageWrapper` per garantire spaziatura consistente su tutte le pagine
- **Badge forwardRef** - Aggiunto `React.forwardRef` al componente `Badge` per eliminare warning console su refs

### ♻️ Refactor

- **Migrazione a PageWrapper** - Le seguenti pagine ora usano `PageWrapper` per layout consistente:
  - `Dashboard.tsx`
  - `GestioneOrdini.tsx`
  - `Clienti.tsx`
  - `Statistiche.tsx` (con `max-w-7xl`)
  - `GestioneMenu.tsx` (con `max-w-5xl`)
  - `Prenotazioni.tsx` (già usava PageWrapper)
  - `Tavoli.tsx` (già usava PageWrapper)
  - `TavoliMappa.tsx` (già usava PageWrapper)

### 📋 Audit Eseguito

#### Pagine - Stato Padding

| Pagina | Prima | Dopo |
|--------|-------|------|
| Dashboard | inline `p-8...` | ✅ PageWrapper |
| GestioneOrdini | inline `p-8...` | ✅ PageWrapper |
| Clienti | inline `p-8...` | ✅ PageWrapper |
| Statistiche | inline `max-w-7xl` | ✅ PageWrapper + className |
| GestioneMenu | inline `max-w-5xl` | ✅ PageWrapper + className |
| Prenotazioni | PageWrapper (no padding) | ✅ PageWrapper (con padding) |
| Tavoli | PageWrapper (no padding) | ✅ PageWrapper (con padding) |
| TavoliMappa | PageWrapper (no padding) | ✅ PageWrapper (con padding) |
| NuovoOrdine | `p-4 lg:p-8` | ⚠️ Padding custom (sticky layout) |
| ModificaOrdine | `p-4 lg:p-8` | ⚠️ Padding custom (sticky layout) |

#### Mini-Audit Features

| Feature | Input Validation | Logging | Error Handling |
|---------|-----------------|---------|----------------|
| Ordini | ⚠️ Toast base | ✅ Console logs | ⚠️ Try/catch generico |
| Clienti | ✅ Duplicate check | ✅ Console logs | ✅ hasOrders check |
| Prenotazioni | ⚠️ Solo check base | ✅ Console logs | ⚠️ Toast generico |
| Menu | ⚠️ Solo required check | ✅ Console logs | ✅ Error messages |
| Tavoli | ⚠️ Solo nome required | ✅ Console logs | ⚠️ Toast generico |

---

## [2025-12-15] - Swiss Design /prenota + Editor Tavoli

### ✨ Features

- **Redesign Swiss /prenota** - Aggiornato PublicBooking.tsx con:
  - Titoli massivi (5rem+)
  - Spaziatura PHI consistente
  - Progress indicator minimal
  - Bottoni party size a griglia
  
- **Editor Drag & Drop Tavoli** - Nuova pagina `/tavoli/mappa` con:
  - Inventario tavoli (2-4-6-8 posti)
  - Canvas con griglia per posizionamento
  - Panel proprietà per tavolo selezionato
  - Salvataggio posizioni su database
  
- **Fix Prenotazioni** - Cambiato filtro default da 'today' a 'week'

---

## Convenzioni

- ✅ Completato
- ⚠️ Parziale / Da migliorare
- ❌ Mancante / Critico

### Pattern Consistenti

1. **Padding pagine**: `p-8 md:p-12 lg:p-16` via PageWrapper
2. **Max width default**: `max-w-6xl` (override via className)
3. **Spacing**: `space-y-phi-6` (sistema PHI)
4. **Logging**: Prefisso `[ComponentName]` in console
5. **Toast**: sonner per notifiche utente
