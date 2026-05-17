-- 1. Remover vínculo de cliente nas comandas existentes para evitar violação de FK
UPDATE comandas 
SET cliente_id = NULL 
WHERE cliente_id IN (
  SELECT id FROM clientes 
  WHERE LOWER(nome) IN ('jamesson', 'tio edmilson', 'augusto (zerado)', 'pai')
);

-- 2. Limpeza de registros de teste da base de clientes
DELETE FROM clientes 
WHERE LOWER(nome) IN ('jamesson', 'tio edmilson', 'augusto (zerado)', 'pai');
