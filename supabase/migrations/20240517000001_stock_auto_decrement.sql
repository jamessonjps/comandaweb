CREATE OR REPLACE FUNCTION gerenciar_estoque_pedido()
RETURNS TRIGGER AS $$
BEGIN
  IF TG_OP = 'INSERT' THEN
    -- Apenas decrementa se o item não estiver cancelado
    IF NEW.status_item IS DISTINCT FROM 'cancelado' THEN
      UPDATE produtos
      SET estoque_atual = COALESCE(estoque_atual, 0) - NEW.quantidade
      WHERE id = NEW.produto_id;
    END IF;
    
  ELSIF TG_OP = 'UPDATE' THEN
    -- Caso 1: Mudou o produto
    IF OLD.produto_id <> NEW.produto_id THEN
      -- Devolve ao produto antigo (se não estava cancelado)
      IF OLD.status_item IS DISTINCT FROM 'cancelado' THEN
        UPDATE produtos
        SET estoque_atual = COALESCE(estoque_atual, 0) + OLD.quantidade
        WHERE id = OLD.produto_id;
      END IF;
      -- Retira do produto novo (se não está cancelado)
      IF NEW.status_item IS DISTINCT FROM 'cancelado' THEN
        UPDATE produtos
        SET estoque_atual = COALESCE(estoque_atual, 0) - NEW.quantidade
        WHERE id = NEW.produto_id;
      END IF;
      
    -- Caso 2: Mesmo produto, mudou status ou quantidade
    ELSE
      -- Sub-caso 2.1: Item foi cancelado
      IF OLD.status_item IS DISTINCT FROM 'cancelado' AND NEW.status_item = 'cancelado' THEN
        UPDATE produtos
        SET estoque_atual = COALESCE(estoque_atual, 0) + OLD.quantidade
        WHERE id = NEW.produto_id;
        
      -- Sub-caso 2.2: Item foi reativado (saiu de cancelado)
      ELSIF OLD.status_item = 'cancelado' AND NEW.status_item IS DISTINCT FROM 'cancelado' THEN
        UPDATE produtos
        SET estoque_atual = COALESCE(estoque_atual, 0) - NEW.quantidade
        WHERE id = NEW.produto_id;
        
      -- Sub-caso 2.3: Permaneceu ativo, mas mudou a quantidade
      ELSIF NEW.status_item IS DISTINCT FROM 'cancelado' AND OLD.quantidade <> NEW.quantidade THEN
        UPDATE produtos
        SET estoque_atual = COALESCE(estoque_atual, 0) - (NEW.quantidade - OLD.quantidade)
        WHERE id = NEW.produto_id;
      END IF;
    END IF;
    
  ELSIF TG_OP = 'DELETE' THEN
    -- Devolve ao estoque se o item deletado não estava cancelado
    IF OLD.status_item IS DISTINCT FROM 'cancelado' THEN
      UPDATE produtos
      SET estoque_atual = COALESCE(estoque_atual, 0) + OLD.quantidade
      WHERE id = OLD.produto_id;
    END IF;
  END IF;
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Remover trigger antigo se existir
DROP TRIGGER IF EXISTS trigger_estoque_pedido ON itens_pedido;

-- Criar o novo trigger
CREATE TRIGGER trigger_estoque_pedido
AFTER INSERT OR UPDATE OR DELETE ON itens_pedido
FOR EACH ROW EXECUTE FUNCTION gerenciar_estoque_pedido();
