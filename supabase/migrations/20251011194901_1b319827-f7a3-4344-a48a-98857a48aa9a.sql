-- Create storage bucket for background images
INSERT INTO storage.buckets (id, name, public) 
VALUES ('backgrounds', 'backgrounds', true)
ON CONFLICT (id) DO NOTHING;

-- Create table for appearance settings
CREATE TABLE IF NOT EXISTS public.appearance_settings (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID,
  background_image_1 TEXT,
  background_image_2 TEXT,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  CONSTRAINT unique_user_settings UNIQUE (user_id)
);

-- Enable RLS
ALTER TABLE public.appearance_settings ENABLE ROW LEVEL SECURITY;

-- Policies for appearance_settings
CREATE POLICY "Users can view all appearance settings" 
ON public.appearance_settings 
FOR SELECT 
USING (true);

CREATE POLICY "Only coordenador can update appearance settings" 
ON public.appearance_settings 
FOR ALL
USING (
  EXISTS (
    SELECT 1 FROM public.user_roles 
    WHERE user_roles.user_id = auth.uid() 
    AND user_roles.role = 'coordenador'
  )
);

-- Storage policies for backgrounds bucket
CREATE POLICY "Background images are publicly accessible" 
ON storage.objects 
FOR SELECT 
USING (bucket_id = 'backgrounds');

CREATE POLICY "Only coordenador can upload background images" 
ON storage.objects 
FOR INSERT 
WITH CHECK (
  bucket_id = 'backgrounds' AND
  EXISTS (
    SELECT 1 FROM public.user_roles 
    WHERE user_roles.user_id = auth.uid() 
    AND user_roles.role = 'coordenador'
  )
);

CREATE POLICY "Only coordenador can delete background images" 
ON storage.objects 
FOR DELETE 
USING (
  bucket_id = 'backgrounds' AND
  EXISTS (
    SELECT 1 FROM public.user_roles 
    WHERE user_roles.user_id = auth.uid() 
    AND user_roles.role = 'coordenador'
  )
);

-- Trigger for updated_at
CREATE TRIGGER update_appearance_settings_updated_at
BEFORE UPDATE ON public.appearance_settings
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();