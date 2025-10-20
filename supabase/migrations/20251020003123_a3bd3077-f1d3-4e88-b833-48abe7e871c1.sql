-- Adicionar novos valores ao enum status_aluno
DO $$ 
BEGIN
    IF NOT EXISTS (SELECT 1 FROM pg_enum WHERE enumlabel = 'Cancelado' AND enumtypid = 'public.status_aluno'::regtype) THEN
        ALTER TYPE public.status_aluno ADD VALUE 'Cancelado';
    END IF;
END $$;

DO $$ 
BEGIN
    IF NOT EXISTS (SELECT 1 FROM pg_enum WHERE enumlabel = 'Aguardando' AND enumtypid = 'public.status_aluno'::regtype) THEN
        ALTER TYPE public.status_aluno ADD VALUE 'Aguardando';
    END IF;
END $$;

DO $$ 
BEGIN
    IF NOT EXISTS (SELECT 1 FROM pg_enum WHERE enumlabel = 'Planejado' AND enumtypid = 'public.status_aluno'::regtype) THEN
        ALTER TYPE public.status_aluno ADD VALUE 'Planejado';
    END IF;
END $$;

DO $$ 
BEGIN
    IF NOT EXISTS (SELECT 1 FROM pg_enum WHERE enumlabel = 'Estagiando' AND enumtypid = 'public.status_aluno'::regtype) THEN
        ALTER TYPE public.status_aluno ADD VALUE 'Estagiando';
    END IF;
END $$;

-- Adicionar novo valor ao enum tipo_militar
DO $$ 
BEGIN
    IF NOT EXISTS (SELECT 1 FROM pg_enum WHERE enumlabel = 'ENAPORT' AND enumtypid = 'public.tipo_militar'::regtype) THEN
        ALTER TYPE public.tipo_militar ADD VALUE 'ENAPORT';
    END IF;
END $$;