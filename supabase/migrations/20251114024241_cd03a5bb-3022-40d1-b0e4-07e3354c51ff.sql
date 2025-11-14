-- Create student notes table
CREATE TABLE public.notas_aluno (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  aluno_id UUID NOT NULL,
  turma_id UUID NOT NULL,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  conteudo TEXT NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable Row Level Security
ALTER TABLE public.notas_aluno ENABLE ROW LEVEL SECURITY;

-- Create policies
CREATE POLICY "Coordenadores podem ver notas de alunos"
ON public.notas_aluno
FOR SELECT
USING (has_role(auth.uid(), 'coordenador'::app_role));

CREATE POLICY "Coordenadores podem criar notas de alunos"
ON public.notas_aluno
FOR INSERT
WITH CHECK (has_role(auth.uid(), 'coordenador'::app_role));

CREATE POLICY "Coordenadores podem atualizar notas de alunos"
ON public.notas_aluno
FOR UPDATE
USING (has_role(auth.uid(), 'coordenador'::app_role));

CREATE POLICY "Coordenadores podem deletar notas de alunos"
ON public.notas_aluno
FOR DELETE
USING (has_role(auth.uid(), 'coordenador'::app_role));

-- Create trigger for automatic timestamp updates
CREATE TRIGGER update_notas_aluno_updated_at
BEFORE UPDATE ON public.notas_aluno
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();