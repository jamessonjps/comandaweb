-- DESATIVAR RLS PARA A TABELA turnos_caixa
-- Garante compatibilidade total com o fluxo de autenticação anônimo (baseado em PIN)
-- que o frontend do comandaweb utiliza em toda a aplicação.

ALTER TABLE turnos_caixa DISABLE ROW LEVEL SECURITY;
