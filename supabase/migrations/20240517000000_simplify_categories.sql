-- 1. Criar a categoria unificada "Cervejas" se não existir
INSERT INTO categorias (nome) VALUES ('Cervejas') ON CONFLICT (nome) DO NOTHING;

-- 2. Capturar o ID da nova categoria e IDs das antigas, e mover os produtos atualizando seus nomes
DO $$
DECLARE
  cat_cervejas_id uuid;
  cat_litrinho_id uuid;
  cat_latao_id uuid;
  cat_lata_id uuid;
  cat_garrafa_id uuid;
BEGIN
  SELECT id INTO cat_cervejas_id FROM categorias WHERE nome = 'Cervejas';
  SELECT id INTO cat_litrinho_id FROM categorias WHERE nome = 'Cerveja / Litrinho';
  SELECT id INTO cat_latao_id FROM categorias WHERE nome = 'Cerveja / Latão';
  SELECT id INTO cat_lata_id FROM categorias WHERE nome = 'Cerveja / Lata';
  SELECT id INTO cat_garrafa_id FROM categorias WHERE nome = 'Cerveja / Garrafa';

  -- Mover e renomear produtos específicos
  UPDATE produtos 
  SET categoria_id = cat_cervejas_id, 
      nome = 'Skol Litrinho' 
  WHERE categoria_id = cat_litrinho_id AND nome = 'Cerveja Skol Pilsen';

  UPDATE produtos 
  SET categoria_id = cat_cervejas_id, 
      nome = 'Antarctica Original Litrinho' 
  WHERE categoria_id = cat_litrinho_id AND nome = 'Cerveja Antarctica Original';

  UPDATE produtos 
  SET categoria_id = cat_cervejas_id, 
      nome = 'Devassa Latão' 
  WHERE categoria_id = cat_latao_id AND nome = 'Cerveja Devassa Puro Malte';

  UPDATE produtos 
  SET categoria_id = cat_cervejas_id, 
      nome = 'Heineken Lata' 
  WHERE categoria_id = cat_lata_id AND nome = 'Cerveja Heineken (Lata)';

  UPDATE produtos 
  SET categoria_id = cat_cervejas_id, 
      nome = 'Heineken Garrafa' 
  WHERE categoria_id = cat_garrafa_id AND nome = 'Cerveja Heineken (Garrafa)';

  -- Caso haja outros produtos genéricos nessas categorias antigas (para segurança)
  UPDATE produtos 
  SET categoria_id = cat_cervejas_id 
  WHERE categoria_id IN (cat_litrinho_id, cat_latao_id, cat_lata_id, cat_garrafa_id);

  -- 3. Remover as categorias antigas
  DELETE FROM categorias WHERE id IN (cat_litrinho_id, cat_latao_id, cat_lata_id, cat_garrafa_id);

END $$;
