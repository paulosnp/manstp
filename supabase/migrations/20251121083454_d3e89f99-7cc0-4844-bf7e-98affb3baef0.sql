-- Update RLS policies for notas_pessoais to restrict editing and deletion

-- Drop existing policies
DROP POLICY IF EXISTS "Usuários podem visualizar suas próprias notas" ON notas_pessoais;
DROP POLICY IF EXISTS "Usuários podem criar suas próprias notas" ON notas_pessoais;
DROP POLICY IF EXISTS "Usuários podem atualizar suas próprias notas" ON notas_pessoais;
DROP POLICY IF EXISTS "Usuários podem excluir suas próprias notas" ON notas_pessoais;

-- Allow all authenticated users to view all personal notes
CREATE POLICY "Todos usuários autenticados podem visualizar todas as notas"
  ON notas_pessoais
  FOR SELECT
  TO authenticated
  USING (true);

-- Only coordenadores can create notes
CREATE POLICY "Apenas coordenadores podem criar notas"
  ON notas_pessoais
  FOR INSERT
  TO authenticated
  WITH CHECK (
    has_role(auth.uid(), 'coordenador')
  );

-- Only coordenadores can update their own notes
CREATE POLICY "Coordenadores podem atualizar apenas suas próprias notas"
  ON notas_pessoais
  FOR UPDATE
  TO authenticated
  USING (
    has_role(auth.uid(), 'coordenador') AND
    auth.uid() = user_id
  );

-- Only coordenadores can delete their own notes (cannot delete notes from other users)
CREATE POLICY "Coordenadores podem excluir apenas suas próprias notas"
  ON notas_pessoais
  FOR DELETE
  TO authenticated
  USING (
    has_role(auth.uid(), 'coordenador') AND
    auth.uid() = user_id
  );