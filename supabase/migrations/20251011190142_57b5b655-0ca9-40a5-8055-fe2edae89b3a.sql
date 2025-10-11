-- Adicionar campo modalidade na tabela cursos
ALTER TABLE public.cursos 
ADD COLUMN modalidade TEXT CHECK (modalidade IN ('Presencial', 'Semipresencial', 'A Distância'));