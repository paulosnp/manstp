-- Fix Issue 1: Unrestricted Access to Personal Data
-- Update SELECT policies to use role-based access control

-- Drop existing overly permissive policies
DROP POLICY IF EXISTS "Todos podem ver alunos" ON public.alunos;
DROP POLICY IF EXISTS "Todos podem ver instrutores" ON public.instrutores;
DROP POLICY IF EXISTS "Todos podem ver documentos" ON public.documentos_curso;

-- Create role-based SELECT policies for alunos table
CREATE POLICY "Coordenadores podem ver todos os alunos"
ON public.alunos FOR SELECT
TO authenticated
USING (has_role(auth.uid(), 'coordenador'::app_role));

CREATE POLICY "Visualizadores podem ver alunos"
ON public.alunos FOR SELECT
TO authenticated
USING (has_role(auth.uid(), 'visualizador'::app_role));

-- Create role-based SELECT policies for instrutores table
CREATE POLICY "Coordenadores podem ver todos os instrutores"
ON public.instrutores FOR SELECT
TO authenticated
USING (has_role(auth.uid(), 'coordenador'::app_role));

CREATE POLICY "Visualizadores podem ver instrutores"
ON public.instrutores FOR SELECT
TO authenticated
USING (has_role(auth.uid(), 'visualizador'::app_role));

-- Create role-based SELECT policies for documentos_curso table
CREATE POLICY "Coordenadores podem ver todos os documentos"
ON public.documentos_curso FOR SELECT
TO authenticated
USING (has_role(auth.uid(), 'coordenador'::app_role));

CREATE POLICY "Visualizadores podem ver documentos"
ON public.documentos_curso FOR SELECT
TO authenticated
USING (has_role(auth.uid(), 'visualizador'::app_role));

-- Fix Issue 2: Instructor Table Incorrect RLS Role Configuration
-- Update UPDATE and DELETE policies to use 'authenticated' role

DROP POLICY IF EXISTS "Usuários autenticados podem atualizar instrutores" ON public.instrutores;
DROP POLICY IF EXISTS "Usuários autenticados podem deletar instrutores" ON public.instrutores;

-- These policies already exist with correct names, just recreating with proper role
DROP POLICY IF EXISTS "Coordenadores podem atualizar instrutores" ON public.instrutores;
DROP POLICY IF EXISTS "Coordenadores podem deletar instrutores" ON public.instrutores;

CREATE POLICY "Coordenadores podem atualizar instrutores"
ON public.instrutores FOR UPDATE
TO authenticated
USING (has_role(auth.uid(), 'coordenador'::app_role));

CREATE POLICY "Coordenadores podem deletar instrutores"
ON public.instrutores FOR DELETE
TO authenticated
USING (has_role(auth.uid(), 'coordenador'::app_role));