-- CORRIGIR O GATILHO DE CÁLCULO DE TOTAL
CREATE OR REPLACE FUNCTION atualizar_total_comanda()
RETURNS TRIGGER AS $$
BEGIN
  -- Atualiza o campo total_calculado sempre que um item mudar
  UPDATE comandas
  SET total_calculado = (
    SELECT COALESCE(SUM(quantidade * preco_unitario), 0)
    FROM itens_pedido
    WHERE comanda_id = COALESCE(NEW.comanda_id, OLD.comanda_id)
  )
  WHERE id = COALESCE(NEW.comanda_id, OLD.comanda_id);
  
  RETURN NULL;
END;
$$ LANGUAGE plpgsql;

-- Garantir que o gatilho esteja vinculado à tabela correta
DROP TRIGGER IF EXISTS trg_atualizar_total ON itens_pedido;
CREATE TRIGGER trg_atualizar_total
AFTER INSERT OR UPDATE OR DELETE ON itens_pedido
FOR EACH ROW EXECUTE FUNCTION atualizar_total_comanda();
