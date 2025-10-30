-- Criar tabela para armazenar grade semanal anual
CREATE TABLE IF NOT EXISTS public.grade_semana (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  turma_id UUID NOT NULL REFERENCES public.turmas(id) ON DELETE CASCADE,
  semana INTEGER NOT NULL CHECK (semana >= 1 AND semana <= 52),
  dias JSONB NOT NULL DEFAULT '[]'::jsonb,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  UNIQUE(turma_id, semana)
);

-- Enable Row Level Security
ALTER TABLE public.grade_semana ENABLE ROW LEVEL SECURITY;

-- Create policies
CREATE POLICY "Todos podem ver grade semanal"
ON public.grade_semana
FOR SELECT
TO authenticated
USING (true);

CREATE POLICY "Coordenadores podem inserir grade semanal"
ON public.grade_semana
FOR INSERT
TO authenticated
WITH CHECK (has_role(auth.uid(), 'coordenador'::app_role));

CREATE POLICY "Coordenadores podem atualizar grade semanal"
ON public.grade_semana
FOR UPDATE
TO authenticated
USING (has_role(auth.uid(), 'coordenador'::app_role));

CREATE POLICY "Coordenadores podem deletar grade semanal"
ON public.grade_semana
FOR DELETE
TO authenticated
USING (has_role(auth.uid(), 'coordenador'::app_role));

-- Create trigger for updated_at
CREATE TRIGGER update_grade_semana_updated_at
BEFORE UPDATE ON public.grade_semana
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();