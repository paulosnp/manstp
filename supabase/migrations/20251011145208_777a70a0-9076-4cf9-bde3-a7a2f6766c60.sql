-- Adicionar política RLS para UPDATE na tabela aluno_turma
CREATE POLICY "Coordenadores podem atualizar vínculos aluno-turma"
ON public.aluno_turma
FOR UPDATE
USING (has_role(auth.uid(), 'coordenador'::app_role))
WITH CHECK (has_role(auth.uid(), 'coordenador'::app_role));