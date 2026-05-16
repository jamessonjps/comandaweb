-- 1. EXTENSIONS
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- 2. TABLES
-- perfis (garçons e caixas)
CREATE TABLE IF NOT EXISTS perfis (
  id          uuid PRIMARY KEY DEFAULT uuid_generate_v4(),
  nome        text NOT NULL,
  pin_hash    text NOT NULL,
  role        text CHECK (role IN ('garcom', 'caixa', 'admin')),
  ativo       boolean DEFAULT true,
  criado_em   timestamptz DEFAULT now()
);

-- categorias
CREATE TABLE IF NOT EXISTS categorias (
  id          uuid PRIMARY KEY DEFAULT uuid_generate_v4(),
  nome        text NOT NULL,
  ordem       smallint DEFAULT 0,
  ativo       boolean DEFAULT true
);

-- produtos
CREATE TABLE IF NOT EXISTS produtos (
  id          uuid PRIMARY KEY DEFAULT uuid_generate_v4(),
  nome        text NOT NULL,
  descricao   text,
  preco       numeric(10,2) NOT NULL CHECK (preco >= 0),
  categoria_id uuid REFERENCES categorias(id),
  disponivel  boolean DEFAULT true,
  imagem_url  text,
  ordem       smallint DEFAULT 0
);

-- mesas
CREATE TABLE IF NOT EXISTS mesas (
  id          uuid PRIMARY KEY DEFAULT uuid_generate_v4(),
  numero      smallint UNIQUE NOT NULL,
  capacidade  smallint DEFAULT 4,
  status      text CHECK (status IN ('livre', 'ocupada', 'fechando', 'reservada')),
  setor       text
);

-- comandas
CREATE TABLE IF NOT EXISTS comandas (
  id          uuid PRIMARY KEY DEFAULT uuid_generate_v4(),
  mesa_id     uuid REFERENCES mesas(id) NOT NULL,
  garcom_id   uuid REFERENCES perfis(id) NOT NULL,
  aberta_em   timestamptz DEFAULT now(),
  fechada_em  timestamptz,
  status      text CHECK (status IN ('aberta', 'fechando', 'paga', 'cancelada')) DEFAULT 'aberta',
  forma_pagamento text CHECK (forma_pagamento IN ('dinheiro','cartao_debito','cartao_credito','pix')),
  total_calculado numeric(10,2) DEFAULT 0,
  observacoes text
);

-- itens_pedido
CREATE TABLE IF NOT EXISTS itens_pedido (
  id              uuid PRIMARY KEY DEFAULT uuid_generate_v4(),
  comanda_id      uuid REFERENCES comandas(id) NOT NULL,
  produto_id      uuid REFERENCES produtos(id) NOT NULL,
  quantidade      smallint NOT NULL CHECK (quantidade > 0),
  preco_unitario  numeric(10,2) NOT NULL,
  status_item     text CHECK (status_item IN ('pendente', 'em_preparo', 'entregue', 'cancelado')) DEFAULT 'pendente',
  observacao      text,
  criado_em       timestamptz DEFAULT now(),
  criado_por      uuid REFERENCES perfis(id)
);

-- 3. TRIGGERS & FUNCTIONS
-- Recalcula total_calculado na comanda automaticamente
CREATE OR REPLACE FUNCTION recalcular_total()
RETURNS TRIGGER AS $$
BEGIN
  UPDATE comandas
  SET total_calculado = (
    SELECT COALESCE(SUM(quantidade * preco_unitario), 0)
    FROM itens_pedido
    WHERE comanda_id = COALESCE(NEW.comanda_id, OLD.comanda_id)
      AND status_item != 'cancelado'
  )
  WHERE id = COALESCE(NEW.comanda_id, OLD.comanda_id);
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trigger_total
AFTER INSERT OR UPDATE OR DELETE ON itens_pedido
FOR EACH ROW EXECUTE FUNCTION recalcular_total();

-- 4. RLS POLICIES
ALTER TABLE perfis ENABLE ROW LEVEL SECURITY;
ALTER TABLE categorias ENABLE ROW LEVEL SECURITY;
ALTER TABLE produtos ENABLE ROW LEVEL SECURITY;
ALTER TABLE mesas ENABLE ROW LEVEL SECURITY;
ALTER TABLE comandas ENABLE ROW LEVEL SECURITY;
ALTER TABLE itens_pedido ENABLE ROW LEVEL SECURITY;

-- Public read for categories and products
CREATE POLICY "Public Read Categorias" ON categorias FOR SELECT USING (ativo = true);
CREATE POLICY "Public Read Produtos" ON produtos FOR SELECT USING (disponivel = true);

-- Profiles access
CREATE POLICY "Admin All Profiles" ON perfis FOR ALL USING (
  EXISTS (SELECT 1 FROM perfis WHERE id = auth.uid() AND role = 'admin')
);

-- Comandas access
CREATE POLICY "Garcom Comandas" ON comandas FOR ALL USING (
  garcom_id = auth.uid() OR 
  EXISTS (SELECT 1 FROM perfis WHERE id = auth.uid() AND role IN ('caixa', 'admin'))
);

-- Mesas access
CREATE POLICY "Public Read Mesas" ON mesas FOR SELECT TO authenticated USING (true);
CREATE POLICY "Admin Update Mesas" ON mesas FOR UPDATE TO authenticated USING (
  EXISTS (SELECT 1 FROM perfis WHERE id = auth.uid() AND role IN ('garcom', 'caixa', 'admin'))
);

-- 5. INDICES
CREATE INDEX IF NOT EXISTS idx_comandas_mesa_status ON comandas(mesa_id, status);
CREATE INDEX IF NOT EXISTS idx_itens_comanda ON itens_pedido(comanda_id);
CREATE INDEX IF NOT EXISTS idx_produtos_categoria ON produtos(categoria_id) WHERE disponivel = true;
