-- Adicionar novos valores ao enum graduacao_militar
ALTER TYPE graduacao_militar ADD VALUE IF NOT EXISTS 'Terceiro Sargento';
ALTER TYPE graduacao_militar ADD VALUE IF NOT EXISTS 'Subtenente';

-- Adicionar novo valor ao enum tipo_militar
ALTER TYPE tipo_militar ADD VALUE IF NOT EXISTS 'Marinha do Brasil';

-- Adicionar campo matricula na tabela alunos com sequência automática
ALTER TABLE public.alunos ADD COLUMN IF NOT EXISTS matricula SERIAL;

-- Criar índice para ordenação por matrícula
CREATE INDEX IF NOT EXISTS idx_alunos_matricula ON public.alunos(matricula);

-- Adicionar comentário explicativo
COMMENT ON COLUMN public.alunos.matricula IS 'Número de matrícula sequencial do aluno para ordenação';