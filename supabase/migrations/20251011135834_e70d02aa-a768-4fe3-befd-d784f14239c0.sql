-- Adicionar coluna tipo_curso na tabela cursos
ALTER TABLE public.cursos 
ADD COLUMN tipo_curso TEXT CHECK (tipo_curso IN ('Expedito', 'Carreira'));