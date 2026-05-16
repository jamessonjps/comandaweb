-- 1. RENOMEAR COLUNA ROLE PARA NIVEL_ACESSO (Se ela existir)
DO $$ 
BEGIN 
  IF EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'perfis' AND column_name = 'role') THEN
    ALTER TABLE perfis RENAME COLUMN role TO nivel_acesso;
  END IF;
END $$;

-- 2. GARANTIR QUE O PIN 5678 SEJA O GERENTE
UPDATE perfis 
SET nivel_acesso = 'admin', 
    nome = 'Gerente'
WHERE pin_hash = '5678';

-- 3. INSERIR SE NÃO EXISTIR
INSERT INTO perfis (nome, pin_hash, nivel_acesso, ativo)
SELECT 'Gerente', '5678', 'admin', true
WHERE NOT EXISTS (SELECT 1 FROM perfis WHERE pin_hash = '5678');
