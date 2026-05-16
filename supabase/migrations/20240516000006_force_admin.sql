-- FORÇAR O PIN 5678 A SER GERENTE/ADMIN
UPDATE perfis 
SET nivel_acesso = 'admin', 
    nome = 'Gerente'
WHERE pin_hash = '5678';

-- Garantir que se o usuário não existia, ele seja criado corretamente
INSERT INTO perfis (nome, pin_hash, nivel_acesso, ativo)
SELECT 'Gerente', '5678', 'admin', true
WHERE NOT EXISTS (SELECT 1 FROM perfis WHERE pin_hash = '5678');
