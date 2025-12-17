-- Normalize order_number from ORD-XXX to DD-XXX format
UPDATE orders 
SET order_number = CONCAT(
  LPAD(EXTRACT(DAY FROM delivery_date::date)::text, 2, '0'),
  '-',
  REGEXP_REPLACE(order_number, '[^0-9]', '', 'g')
)
WHERE order_number LIKE 'ORD-%';