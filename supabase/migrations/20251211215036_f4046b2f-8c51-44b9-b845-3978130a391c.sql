-- Prima pulisco i duplicati esistenti mantenendo il record più vecchio
-- e aggiornando gli ordini per usare il cliente corretto

-- Step 1: Creo una tabella temporanea con i duplicati da eliminare
WITH duplicates AS (
  SELECT id, phone, name, created_at,
    ROW_NUMBER() OVER (PARTITION BY phone ORDER BY created_at ASC) as rn
  FROM customers
),
to_keep AS (
  SELECT id, phone FROM duplicates WHERE rn = 1
),
to_delete AS (
  SELECT d.id as delete_id, d.phone, tk.id as keep_id
  FROM duplicates d
  JOIN to_keep tk ON d.phone = tk.phone
  WHERE d.rn > 1
)
-- Elimino i duplicati
DELETE FROM customers 
WHERE id IN (SELECT delete_id FROM to_delete);

-- Step 2: Aggiungo constraint UNIQUE sul telefono
ALTER TABLE customers ADD CONSTRAINT customers_phone_unique UNIQUE (phone);

-- Step 3: Creo indice per ricerche rapide (case-insensitive name search)
CREATE INDEX IF NOT EXISTS idx_customers_name_lower ON customers(LOWER(name));

-- Step 4: Creo indice sul telefono per lookup veloci
CREATE INDEX IF NOT EXISTS idx_customers_phone ON customers(phone);