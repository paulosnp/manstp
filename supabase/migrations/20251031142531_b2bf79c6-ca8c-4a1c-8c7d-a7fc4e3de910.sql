-- Renomear colunas na tabela grade_aulas
ALTER TABLE grade_aulas RENAME COLUMN professor TO instrutor;
ALTER TABLE grade_aulas RENAME COLUMN sala TO aula;