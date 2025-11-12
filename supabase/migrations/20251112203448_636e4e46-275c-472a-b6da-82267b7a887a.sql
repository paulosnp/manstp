-- Adicionar valor "Aguardando" ao enum situacao_curso
ALTER TYPE situacao_curso ADD VALUE IF NOT EXISTS 'Aguardando';