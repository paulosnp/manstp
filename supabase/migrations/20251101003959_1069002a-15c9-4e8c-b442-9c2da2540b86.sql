-- Add recovery grade column to notas table
ALTER TABLE public.notas ADD COLUMN IF NOT EXISTS nota_recuperacao numeric DEFAULT NULL;

COMMENT ON COLUMN public.notas.nota_recuperacao IS 'Nota de recuperação do aluno (não conta na média)';
