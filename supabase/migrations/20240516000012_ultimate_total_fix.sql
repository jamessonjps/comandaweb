-- 1. CRIAR A COLUNA 'TOTAL' PARA SATISFAZER QUALQUER REGRA ANTIGA
ALTER TABLE comandas ADD COLUMN IF NOT EXISTS total numeric(10,2) DEFAULT 0;

-- 2. ATUALIZAR O GATILHO PARA GRAVAR EM AMBAS AS COLUNAS (TOTAL E TOTAL_CALCULADO)
CREATE OR REPLACE FUNCTION atualizar_total_comanda_universal()
RETURNS TRIGGER AS $$
DECLARE
  v_total numeric;
BEGIN
  -- Calcula o total real
  SELECT COALESCE(SUM(quantidade * preco_unitario), 0)
  INTO v_total
  FROM itens_pedido
  WHERE comanda_id = COALESCE(NEW.comanda_id, OLD.comanda_id);

  -- Atualiza AMBOS os campos para não ter erro
  UPDATE comandas
  SET total_calculado = v_total,
      total = v_total
  WHERE id = COALESCE(NEW.comanda_id, OLD.comanda_id);
  
  RETURN NULL;
END;
$$ LANGUAGE plpgsql;

-- 3. RESETAR O GATILHO
DROP TRIGGER IF EXISTS trg_atualizar_total ON itens_pedido;
CREATE TRIGGER trg_atualizar_total
AFTER INSERT OR UPDATE OR DELETE ON itens_pedido
FOR EACH ROW EXECUTE FUNCTION atualizar_total_comanda_universal();

-- 4. SINCRONIZAR VALORES ATUAIS
UPDATE comandas SET total = total_calculado;
