-- 1. LIMPEZA DE COLUNAS DUPLICADAS OU COM NOME ERRADO
DO $$ 
BEGIN 
  -- Se existir uma coluna chamada 'total', renomeia para 'total_calculado'
  IF EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'comandas' AND column_name = 'total') THEN
    ALTER TABLE comandas RENAME COLUMN total TO total_calculado;
  END IF;
END $$;

-- 2. REMOVER TODOS OS GATILHOS ANTIGOS (Para evitar conflitos)
DROP TRIGGER IF EXISTS trg_atualizar_total ON itens_pedido;
DROP TRIGGER IF EXISTS atualizar_total_comanda_trigger ON itens_pedido;
DROP TRIGGER IF EXISTS update_comanda_total ON itens_pedido;

-- 3. RE-CRIAR A FUNÇÃO DE CÁLCULO USANDO O NOME CORRETO
CREATE OR REPLACE FUNCTION atualizar_total_comanda()
RETURNS TRIGGER AS $$
BEGIN
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

-- 4. VINCULAR O GATILHO NOVAMENTE
CREATE TRIGGER trg_atualizar_total
AFTER INSERT OR UPDATE OR DELETE ON itens_pedido
FOR EACH ROW EXECUTE FUNCTION atualizar_total_comanda();
