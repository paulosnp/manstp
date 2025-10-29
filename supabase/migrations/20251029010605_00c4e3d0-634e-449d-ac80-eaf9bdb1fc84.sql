-- Criar tabela de notas
CREATE TABLE IF NOT EXISTS public.notas (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  turma_id UUID NOT NULL REFERENCES public.turmas(id) ON DELETE CASCADE,
  aluno_id UUID NOT NULL REFERENCES public.alunos(id) ON DELETE CASCADE,
  disciplina_id UUID NOT NULL REFERENCES public.disciplinas(id) ON DELETE CASCADE,
  nota DECIMAL(4,2) NOT NULL DEFAULT 0 CHECK (nota >= 0 AND nota <= 10),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  UNIQUE(turma_id, aluno_id, disciplina_id)
);

-- Habilitar RLS
ALTER TABLE public.notas ENABLE ROW LEVEL SECURITY;

-- Políticas RLS para notas
CREATE POLICY "Todos podem ver notas"
  ON public.notas
  FOR SELECT
  USING (true);

CREATE POLICY "Coordenadores podem inserir notas"
  ON public.notas
  FOR INSERT
  WITH CHECK (has_role(auth.uid(), 'coordenador'::app_role));

CREATE POLICY "Coordenadores podem atualizar notas"
  ON public.notas
  FOR UPDATE
  USING (has_role(auth.uid(), 'coordenador'::app_role));

CREATE POLICY "Coordenadores podem deletar notas"
  ON public.notas
  FOR DELETE
  USING (has_role(auth.uid(), 'coordenador'::app_role));

-- Trigger para updated_at
CREATE TRIGGER update_notas_updated_at
  BEFORE UPDATE ON public.notas
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();