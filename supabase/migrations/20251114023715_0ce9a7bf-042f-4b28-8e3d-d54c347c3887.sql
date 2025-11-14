-- Create notes table
CREATE TABLE public.notas_pessoais (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  titulo TEXT NOT NULL,
  conteudo TEXT,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable Row Level Security
ALTER TABLE public.notas_pessoais ENABLE ROW LEVEL SECURITY;

-- Create policies for user access
CREATE POLICY "Usuários podem ver suas próprias notas"
ON public.notas_pessoais
FOR SELECT
USING (auth.uid() = user_id);

CREATE POLICY "Usuários podem criar suas próprias notas"
ON public.notas_pessoais
FOR INSERT
WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Usuários podem atualizar suas próprias notas"
ON public.notas_pessoais
FOR UPDATE
USING (auth.uid() = user_id);

CREATE POLICY "Usuários podem deletar suas próprias notas"
ON public.notas_pessoais
FOR DELETE
USING (auth.uid() = user_id);

-- Create trigger for automatic timestamp updates
CREATE TRIGGER update_notas_pessoais_updated_at
BEFORE UPDATE ON public.notas_pessoais
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();