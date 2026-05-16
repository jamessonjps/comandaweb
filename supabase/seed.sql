-- Seed básico revisado
INSERT INTO categorias (nome, ordem) VALUES
  ('Entradas', 1), 
  ('Pratos Principais', 2),
  ('Bebidas', 3), 
  ('Sobremesas', 4), 
  ('Porções', 5);

-- Inserir mesas
INSERT INTO mesas (numero, capacidade, setor, status) VALUES
  (1, 4, 'Salão', 'livre'),
  (2, 4, 'Salão', 'livre'),
  (3, 2, 'Salão', 'livre'),
  (4, 6, 'Salão', 'livre'),
  (5, 4, 'Varanda', 'livre'),
  (6, 4, 'Varanda', 'livre'),
  (7, 2, 'Bar', 'livre'),
  (8, 2, 'Bar', 'livre');

-- Inserir alguns produtos de exemplo
DO $$
DECLARE
  ent_id uuid;
  pra_id uuid;
  beb_id uuid;
BEGIN
  SELECT id INTO ent_id FROM categorias WHERE nome = 'Entradas';
  SELECT id INTO pra_id FROM categorias WHERE nome = 'Pratos Principais';
  SELECT id INTO beb_id FROM categorias WHERE nome = 'Bebidas';

  INSERT INTO produtos (nome, preco, categoria_id, disponivel) VALUES
    ('Bruschetta Clássica', 25.00, ent_id, true),
    ('Bolinho de Bacalhau', 38.00, ent_id, true),
    ('Filé à Parmegiana', 65.00, pra_id, true),
    ('Risoto de Funghi', 58.00, pra_id, true),
    ('Coca-Cola 350ml', 7.50, beb_id, true),
    ('Suco de Laranja Natural', 12.00, beb_id, true),
    ('Cerveja Artesanal IPA', 18.00, beb_id, true);
END $$;
