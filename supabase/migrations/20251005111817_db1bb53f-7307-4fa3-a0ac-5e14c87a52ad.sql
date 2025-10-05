-- Adicionar campo local_servico na tabela alunos
ALTER TABLE public.alunos 
ADD COLUMN local_servico TEXT;

-- Atualizar o enum tipo_militar para trocar "Não Fuzileiro" por "Guarda Costeiro"
ALTER TYPE tipo_militar RENAME VALUE 'Não Fuzileiro' TO 'Guarda Costeiro';

-- Adicionar novos valores de graduação militar
ALTER TYPE graduacao_militar ADD VALUE IF NOT EXISTS '1º Tenente';
ALTER TYPE graduacao_militar ADD VALUE IF NOT EXISTS '2º Tenente';
ALTER TYPE graduacao_militar ADD VALUE IF NOT EXISTS 'Capitão';
ALTER TYPE graduacao_militar ADD VALUE IF NOT EXISTS 'Major';
ALTER TYPE graduacao_militar ADD VALUE IF NOT EXISTS 'Tenente-Coronel';
ALTER TYPE graduacao_militar ADD VALUE IF NOT EXISTS 'Coronel';
ALTER TYPE graduacao_militar ADD VALUE IF NOT EXISTS '1º Sargento';
ALTER TYPE graduacao_militar ADD VALUE IF NOT EXISTS '2º Sargento';
ALTER TYPE graduacao_militar ADD VALUE IF NOT EXISTS '3º Sargento';