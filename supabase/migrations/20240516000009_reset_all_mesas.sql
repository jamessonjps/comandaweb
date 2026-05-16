-- RESETAR TODAS AS MESAS PARA LIVRE
UPDATE mesas SET status = 'livre';

-- CANCELAR OU PAGAR TODAS AS COMANDAS QUE FICARAM "PRESAS"
UPDATE comandas SET status = 'cancelada' WHERE status IN ('aberta', 'fechando');
