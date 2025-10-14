-- Remover campos de data dos cursos
ALTER TABLE public.cursos 
DROP COLUMN IF EXISTS data_inicio,
DROP COLUMN IF EXISTS data_fim;

-- Atualizar enum tipo_militar para incluir "Marinha do Brasil"
ALTER TYPE tipo_militar ADD VALUE IF NOT EXISTS 'Marinha do Brasil';

-- Adicionar "Subtenente" ao enum graduacao_militar se ainda não foi adicionado
DO $$ 
BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_enum WHERE enumlabel = 'Subtenente' AND enumtypid = 'graduacao_militar'::regtype) THEN
    ALTER TYPE graduacao_militar ADD VALUE 'Subtenente';
  END IF;
END $$;