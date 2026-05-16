-- 1. LIMPAR HISTÓRICO DE PEDIDOS (COMANDAS, ITENS E PAGAMENTOS)
TRUNCATE pagamentos_comanda CASCADE;
TRUNCATE itens_pedido CASCADE;
TRUNCATE comandas CASCADE;

-- 2. CORRIGIR A REGRA DE VALIDAÇÃO DE CARGOS
ALTER TABLE perfis DROP CONSTRAINT IF EXISTS perfis_role_check;
ALTER TABLE perfis DROP CONSTRAINT IF EXISTS perfis_nivel_acesso_check;
ALTER TABLE perfis ADD CONSTRAINT perfis_nivel_acesso_check 
CHECK (nivel_acesso IN ('garcom', 'caixa', 'admin', 'GERENTE'));

-- 3. RESET DE USUÁRIOS (MANTER APENAS OS DOIS PADRÕES)
DELETE FROM perfis WHERE pin_hash NOT IN ('5678', '1234');
UPDATE perfis SET nome = 'GERENTE MANGUEIRÃO', nivel_acesso = 'GERENTE', ativo = true WHERE pin_hash = '5678';
UPDATE perfis SET nome = 'GARÇOM PADRÃO', nivel_acesso = 'garcom', ativo = true WHERE pin_hash = '1234';

-- 4. RESTAURAR 20 MESAS (1 A 20)
-- Primeiro limpamos mesas extras acima de 20
DELETE FROM mesas WHERE numero > 20;

-- Criamos as mesas que estiverem faltando (de 1 a 20)
DO $$
BEGIN
   FOR i IN 1..20 LOOP
      INSERT INTO mesas (numero, status, capacidade)
      VALUES (i, 'livre', 4)
      ON CONFLICT (numero) DO UPDATE SET status = 'livre';
   END LOOP;
END $$;

-- Garantir que todas as 20 estão livres
UPDATE mesas SET status = 'livre' WHERE numero <= 20;
