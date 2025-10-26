-- Enable realtime for turmas and aluno_turma tables
ALTER TABLE turmas REPLICA IDENTITY FULL;
ALTER TABLE aluno_turma REPLICA IDENTITY FULL;

-- Add tables to realtime publication
ALTER PUBLICATION supabase_realtime ADD TABLE turmas;
ALTER PUBLICATION supabase_realtime ADD TABLE aluno_turma;