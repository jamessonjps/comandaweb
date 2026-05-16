-- 1. TABELA DE CLIENTES (Gestão de Fiado e Base de Dados)
CREATE TABLE IF NOT EXISTS clientes (
  id          uuid PRIMARY KEY DEFAULT uuid_generate_v4(),
  nome        text NOT NULL,
  telefone    text,
  whatsapp    text,
  cpf         text UNIQUE,
  total_fiado numeric(10,2) DEFAULT 0,
  criado_em   timestamptz DEFAULT now(),
  ativo       boolean DEFAULT true
);

-- 2. VÍNCULO DE CLIENTE NA COMANDA
ALTER TABLE comandas ADD COLUMN IF NOT EXISTS cliente_id uuid REFERENCES clientes(id);

-- 3. TABELA DE CONFIGURAÇÕES DO ESTABELECIMENTO
CREATE TABLE IF NOT EXISTS configuracoes (
  id          text PRIMARY KEY, -- ex: 'horarios', 'pagamentos'
  valor       jsonb NOT NULL,
  atualizado_em timestamptz DEFAULT now()
);

-- Inserir configurações padrão
INSERT INTO configuracoes (id, valor) VALUES 
  ('pagamentos', '{"dinheiro": true, "pix": true, "cartao_credito": true, "cartao_debito": true}'),
  ('horarios', '{"seg": "18:00-00:00", "ter": "18:00-00:00", "qua": "18:00-00:00", "qui": "18:00-00:00", "sex": "18:00-02:00", "sab": "11:00-02:00", "dom": "11:00-22:00"}')
ON CONFLICT (id) DO NOTHING;

-- 4. ÍNDICE PARA BUSCA DE CLIENTES
CREATE INDEX IF NOT EXISTS idx_clientes_nome ON clientes(nome);
