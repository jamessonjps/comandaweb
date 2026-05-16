-- 1. ADICIONAR COLUNAS DE ESTOQUE (Se não existirem)
ALTER TABLE produtos ADD COLUMN IF NOT EXISTS volume_ml integer;
ALTER TABLE produtos ADD COLUMN IF NOT EXISTS estoque_atual integer DEFAULT 0;
ALTER TABLE produtos ADD COLUMN IF NOT EXISTS preco_compra numeric(10,2) DEFAULT 0;

-- 2. GARANTIR UNICIDADE NAS CATEGORIAS E INSERIR
DO $$ 
BEGIN 
  IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'categorias_nome_key') THEN
    ALTER TABLE categorias ADD CONSTRAINT categorias_nome_key UNIQUE (nome);
  END IF;
END $$;

INSERT INTO categorias (nome) VALUES 
  ('Cerveja / Litrinho'),
  ('Cerveja / Latão'),
  ('Cerveja / Lata'),
  ('Cerveja / Garrafa'),
  ('Refrigerante / Lata'),
  ('Água')
ON CONFLICT (nome) DO NOTHING;

-- 3. LIMPAR PRODUTOS ANTIGOS DE TESTE (Opcional, mas recomendado para o novo Cardápio)
-- DELETE FROM produtos;

-- 4. INSERIR OS PRODUTOS DO MANGUEIRÃO
DO $$
DECLARE
  cat_litrinho uuid;
  cat_latao uuid;
  cat_lata uuid;
  cat_garrafa uuid;
  cat_refri uuid;
  cat_agua uuid;
BEGIN
  -- Capturar IDs das categorias
  SELECT id INTO cat_litrinho FROM categorias WHERE nome = 'Cerveja / Litrinho';
  SELECT id INTO cat_latao FROM categorias WHERE nome = 'Cerveja / Latão';
  SELECT id INTO cat_lata FROM categorias WHERE nome = 'Cerveja / Lata';
  SELECT id INTO cat_garrafa FROM categorias WHERE nome = 'Cerveja / Garrafa';
  SELECT id INTO cat_refri FROM categorias WHERE nome = 'Refrigerante / Lata';
  SELECT id INTO cat_agua FROM categorias WHERE nome = 'Água';

  -- Inserir Produtos
  INSERT INTO produtos (nome, categoria_id, volume_ml, estoque_atual, preco_compra, preco, disponivel) VALUES
    ('Cerveja Skol Pilsen', cat_litrinho, 300, 48, 2.70, 5.00, true),
    ('Cerveja Antarctica Original', cat_litrinho, 300, 28, 3.40, 6.00, true),
    ('Cerveja Devassa Puro Malte', cat_latao, 473, 12, 3.50, 6.00, true),
    ('Cerveja Heineken (Lata)', cat_lata, 350, 12, 4.80, 7.00, true),
    ('Cerveja Heineken (Garrafa)', cat_garrafa, 600, 7, 10.50, 15.00, true),
    ('Refrigerante Coca-Cola', cat_refri, 350, 6, 3.20, 7.00, true),
    ('Água Mineral Sem Gás', cat_agua, 500, 0, 0.90, 2.00, true),
    ('Água Mineral Com Gás', cat_agua, 500, 0, 1.30, 3.00, true);
END $$;
