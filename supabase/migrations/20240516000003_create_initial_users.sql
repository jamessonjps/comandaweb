-- Criar usuários iniciais reais para o Mangueirão
INSERT INTO perfis (nome, pin_hash, nivel_acesso, ativo) VALUES
  ('Administrador', '5678', 'admin', true),
  ('Garçom Teste', '1234', 'garcom', true)
ON CONFLICT DO NOTHING;
