-- Adicionar campos customizáveis para tipo militar e OM de registro
ALTER TABLE public.turmas 
ADD COLUMN tipo_militar_outro text,
ADD COLUMN om_registro text;