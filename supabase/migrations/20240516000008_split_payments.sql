-- TABELA PARA REGISTRAR CADA PARTE DO PAGAMENTO (APOIO AO FRACIONAMENTO)
CREATE TABLE IF NOT EXISTS pagamentos_comanda (
  id uuid PRIMARY KEY DEFAULT uuid_generate_v4(),
  comanda_id uuid REFERENCES comandas(id) NOT NULL,
  metodo text NOT NULL, -- 'dinheiro', 'pix', 'cartao_credito', 'cartao_debito', 'fiado'
  valor numeric(10,2) NOT NULL,
  criado_em timestamptz DEFAULT now()
);

-- ADICIONAR COLUNAS DE CONTROLE NA COMANDA
ALTER TABLE comandas ADD COLUMN IF NOT EXISTS taxa_servico_inclusa boolean DEFAULT false;
ALTER TABLE comandas ADD COLUMN IF NOT EXISTS valor_taxa_servico numeric(10,2) DEFAULT 0;
ALTER TABLE comandas ADD COLUMN IF NOT EXISTS total_pago numeric(10,2) DEFAULT 0;
