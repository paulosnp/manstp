-- Adicionar coluna local_realizacao na tabela cursos
ALTER TABLE public.cursos 
ADD COLUMN local_realizacao TEXT CHECK (local_realizacao IN ('São Tomé', 'Brasil'));