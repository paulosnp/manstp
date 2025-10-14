-- Remove a restrição CHECK na coluna local_realizacao da tabela cursos
ALTER TABLE public.cursos DROP CONSTRAINT IF EXISTS cursos_local_realizacao_check;