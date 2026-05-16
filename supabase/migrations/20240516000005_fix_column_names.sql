-- 1. ADICIONAR COLUNA DE STATUS DE PAGAMENTO NA COMANDA
ALTER TABLE comandas ADD COLUMN IF NOT EXISTS status_pagamento text DEFAULT 'Pendente';

-- 2. GARANTIR QUE A TABELA DE ITENS_PEDIDO TENHA OS CAMPOS CORRETOS
-- Se o campo for preco_unitario_congelado, vamos renomear ou garantir que preco_unitario exista
ALTER TABLE itens_pedido ADD COLUMN IF NOT EXISTS preco_unitario_congelado numeric(10,2);

-- 3. ATUALIZAR STATUS DA MESA
-- Garantir que a mesa possa ter o status 'ocupada'
ALTER TABLE mesas DROP CONSTRAINT IF EXISTS mesas_status_check;
ALTER TABLE mesas ADD CONSTRAINT mesas_status_check CHECK (status IN ('livre', 'ocupada', 'fechando', 'reservada'));
