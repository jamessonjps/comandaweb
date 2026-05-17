-- Criar a tabela turnos_caixa
CREATE TABLE IF NOT EXISTS turnos_caixa (
  id uuid PRIMARY KEY DEFAULT uuid_generate_v4(),
  aberto_por uuid REFERENCES perfis(id) NOT NULL,
  fechado_por uuid REFERENCES perfis(id),
  aberto_em timestamptz DEFAULT now() NOT NULL,
  fechado_em timestamptz,
  valor_inicial numeric(10,2) NOT NULL DEFAULT 0,
  valor_final_dinheiro_declarado numeric(10,2),
  valor_final_pix_declarado numeric(10,2),
  valor_final_cartao_declarado numeric(10,2),
  valor_final_fiado_declarado numeric(10,2),
  status text CHECK (status IN ('aberto', 'fechado')) DEFAULT 'aberto' NOT NULL,
  observacoes text
);

-- Ativar RLS
ALTER TABLE turnos_caixa ENABLE ROW LEVEL SECURITY;

-- Criar políticas de segurança (RLS)
CREATE POLICY "Permitir leitura para todos autenticados" ON turnos_caixa
  FOR SELECT TO authenticated USING (true);

CREATE POLICY "Permitir inserção para operadores de caixa e admin" ON turnos_caixa
  FOR INSERT TO authenticated WITH CHECK (
    EXISTS (
      SELECT 1 FROM perfis
      WHERE id = auth.uid() AND nivel_acesso IN ('caixa', 'admin', 'GERENTE')
    )
  );

CREATE POLICY "Permitir atualização para operadores de caixa e admin" ON turnos_caixa
  FOR UPDATE TO authenticated USING (
    EXISTS (
      SELECT 1 FROM perfis
      WHERE id = auth.uid() AND nivel_acesso IN ('caixa', 'admin', 'GERENTE')
    )
  ) WITH CHECK (
    EXISTS (
      SELECT 1 FROM perfis
      WHERE id = auth.uid() AND nivel_acesso IN ('caixa', 'admin', 'GERENTE')
    )
  );
