-- Adicionar novos campos à tabela alunos
ALTER TABLE public.alunos 
ADD COLUMN IF NOT EXISTS funcao TEXT,
ADD COLUMN IF NOT EXISTS whatsapp TEXT,
ADD COLUMN IF NOT EXISTS data_nascimento DATE;