-- Adicionar novas graduações ao enum graduacao_militar
ALTER TYPE graduacao_militar ADD VALUE IF NOT EXISTS 'Civil';
ALTER TYPE graduacao_militar ADD VALUE IF NOT EXISTS 'Armada';
ALTER TYPE graduacao_militar ADD VALUE IF NOT EXISTS 'Primeiro Cabo';

-- Remover coluna situacao da tabela cursos
ALTER TABLE public.cursos DROP COLUMN IF EXISTS situacao;

-- Adicionar colunas de período na tabela turmas (data_inicio e data_fim já existem, então vamos garantir)
ALTER TABLE public.turmas ADD COLUMN IF NOT EXISTS data_inicio date;
ALTER TABLE public.turmas ADD COLUMN IF NOT EXISTS data_fim date;

-- Criar enum para situacao_curso se não existir
DO $$ BEGIN
  CREATE TYPE situacao_curso AS ENUM ('Em Andamento', 'Concluído', 'Cancelado', 'Planejado');
EXCEPTION
  WHEN duplicate_object THEN null;
END $$;

-- Adicionar coluna situacao na tabela turmas
ALTER TABLE public.turmas ADD COLUMN IF NOT EXISTS situacao situacao_curso DEFAULT 'Em Andamento';