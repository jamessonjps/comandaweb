-- LIBERAR ACESSO TOTAL À TABELA DE PAGAMENTOS
ALTER TABLE pagamentos_comanda DISABLE ROW LEVEL SECURITY;

-- GARANTIR PERMISSÃO PARA O USUÁRIO ANÔNIMO (API)
GRANT ALL ON TABLE pagamentos_comanda TO anon;
GRANT ALL ON TABLE pagamentos_comanda TO authenticated;
GRANT ALL ON TABLE pagamentos_comanda TO service_role;
