-- Adicionar política RLS para permitir coordenadores editarem perfis de usuários
CREATE POLICY "Coordenadores podem atualizar perfis de usuários"
ON public.profiles
FOR UPDATE
USING (has_role(auth.uid(), 'coordenador'::app_role))
WITH CHECK (has_role(auth.uid(), 'coordenador'::app_role));