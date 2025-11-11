-- Add input validation constraints to prevent malformed data insertion
-- This addresses the INPUT_VALIDATION security finding by enforcing server-side validation

-- ============================================================================
-- ALUNOS (Students) Table Constraints
-- ============================================================================

-- Nome completo: must be between 3 and 200 characters
ALTER TABLE public.alunos 
  ADD CONSTRAINT alunos_nome_completo_length 
  CHECK (length(trim(nome_completo)) BETWEEN 3 AND 200);

-- Email: must be valid format if provided
ALTER TABLE public.alunos
  ADD CONSTRAINT alunos_email_format 
  CHECK (
    email IS NULL OR 
    email = '' OR
    email ~ '^[A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\.[A-Za-z]{2,}$'
  );

-- Telefone: only digits and formatting characters, max 20 chars
ALTER TABLE public.alunos
  ADD CONSTRAINT alunos_telefone_format 
  CHECK (
    telefone IS NULL OR 
    telefone = '' OR
    (telefone ~ '^[\d\s\-\(\)\+]*$' AND length(telefone) <= 20)
  );

-- WhatsApp: only digits and formatting characters, max 20 chars
ALTER TABLE public.alunos
  ADD CONSTRAINT alunos_whatsapp_format 
  CHECK (
    whatsapp IS NULL OR 
    whatsapp = '' OR
    (whatsapp ~ '^[\d\s\-\(\)\+]*$' AND length(whatsapp) <= 20)
  );

-- Local de servico: max 200 characters
ALTER TABLE public.alunos
  ADD CONSTRAINT alunos_local_servico_length 
  CHECK (
    local_servico IS NULL OR 
    local_servico = '' OR
    length(trim(local_servico)) <= 200
  );

-- Funcao: max 200 characters
ALTER TABLE public.alunos
  ADD CONSTRAINT alunos_funcao_length 
  CHECK (
    funcao IS NULL OR 
    funcao = '' OR
    length(trim(funcao)) <= 200
  );

-- Observacoes: max 1000 characters
ALTER TABLE public.alunos
  ADD CONSTRAINT alunos_observacoes_length 
  CHECK (
    observacoes IS NULL OR 
    observacoes = '' OR
    length(trim(observacoes)) <= 1000
  );

-- ============================================================================
-- INSTRUTORES (Instructors) Table Constraints
-- ============================================================================

-- Nome completo: must be between 3 and 200 characters
ALTER TABLE public.instrutores 
  ADD CONSTRAINT instrutores_nome_completo_length 
  CHECK (length(trim(nome_completo)) BETWEEN 3 AND 200);

-- Email: must be valid format if provided
ALTER TABLE public.instrutores
  ADD CONSTRAINT instrutores_email_format 
  CHECK (
    email IS NULL OR 
    email = '' OR
    email ~ '^[A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\.[A-Za-z]{2,}$'
  );

-- Telefone: only digits and formatting characters, max 20 chars
ALTER TABLE public.instrutores
  ADD CONSTRAINT instrutores_telefone_format 
  CHECK (
    telefone IS NULL OR 
    telefone = '' OR
    (telefone ~ '^[\d\s\-\(\)\+]*$' AND length(telefone) <= 20)
  );

-- Especialidade: max 200 characters
ALTER TABLE public.instrutores
  ADD CONSTRAINT instrutores_especialidade_length 
  CHECK (
    especialidade IS NULL OR 
    especialidade = '' OR
    length(trim(especialidade)) <= 200
  );

-- ============================================================================
-- CURSOS (Courses) Table Constraints
-- ============================================================================

-- Nome: must be between 3 and 200 characters
ALTER TABLE public.cursos 
  ADD CONSTRAINT cursos_nome_length 
  CHECK (length(trim(nome)) BETWEEN 3 AND 200);

-- Categoria: max 100 characters
ALTER TABLE public.cursos
  ADD CONSTRAINT cursos_categoria_length 
  CHECK (
    categoria IS NULL OR 
    categoria = '' OR
    length(trim(categoria)) <= 100
  );

-- Instituicao: max 200 characters
ALTER TABLE public.cursos
  ADD CONSTRAINT cursos_instituicao_length 
  CHECK (
    instituicao IS NULL OR 
    instituicao = '' OR
    length(trim(instituicao)) <= 200
  );

-- Coordenador: max 200 characters
ALTER TABLE public.cursos
  ADD CONSTRAINT cursos_coordenador_length 
  CHECK (
    coordenador IS NULL OR 
    coordenador = '' OR
    length(trim(coordenador)) <= 200
  );

-- Local realizacao: must be between 1 and 200 characters
ALTER TABLE public.cursos
  ADD CONSTRAINT cursos_local_realizacao_length 
  CHECK (
    local_realizacao IS NULL OR 
    local_realizacao = '' OR
    length(trim(local_realizacao)) BETWEEN 1 AND 200
  );

-- Observacoes: max 1000 characters
ALTER TABLE public.cursos
  ADD CONSTRAINT cursos_observacoes_length 
  CHECK (
    observacoes IS NULL OR 
    observacoes = '' OR
    length(trim(observacoes)) <= 1000
  );

-- ============================================================================
-- TURMAS (Classes) Table Constraints
-- ============================================================================

-- Nome: must be between 3 and 200 characters
ALTER TABLE public.turmas 
  ADD CONSTRAINT turmas_nome_length 
  CHECK (length(trim(nome)) BETWEEN 3 AND 200);

-- Ano: must be reasonable year range
ALTER TABLE public.turmas
  ADD CONSTRAINT turmas_ano_range 
  CHECK (ano BETWEEN 1900 AND 2100);

-- Observacoes: max 1000 characters
ALTER TABLE public.turmas
  ADD CONSTRAINT turmas_observacoes_length 
  CHECK (
    observacoes IS NULL OR 
    observacoes = '' OR
    length(trim(observacoes)) <= 1000
  );

-- ============================================================================
-- PROFILES Table Constraints
-- ============================================================================

-- Nome completo: must be between 3 and 200 characters if provided
ALTER TABLE public.profiles 
  ADD CONSTRAINT profiles_nome_completo_length 
  CHECK (
    nome_completo IS NULL OR 
    nome_completo = '' OR
    length(trim(nome_completo)) BETWEEN 3 AND 200
  );

-- Email: must be valid format if provided
ALTER TABLE public.profiles
  ADD CONSTRAINT profiles_email_format 
  CHECK (
    email IS NULL OR 
    email = '' OR
    email ~ '^[A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\.[A-Za-z]{2,}$'
  );

-- ============================================================================
-- DISCIPLINAS (Subjects) Table Constraints
-- ============================================================================

-- Nome: must be between 1 and 200 characters
ALTER TABLE public.disciplinas 
  ADD CONSTRAINT disciplinas_nome_length 
  CHECK (length(trim(nome)) BETWEEN 1 AND 200);

-- Carga horaria: must be non-negative
ALTER TABLE public.disciplinas
  ADD CONSTRAINT disciplinas_carga_horaria_positive 
  CHECK (carga_horaria >= 0);

-- ============================================================================
-- CERTIFICATE_TEMPLATES Table Constraints
-- ============================================================================

-- Nome: must be between 1 and 200 characters
ALTER TABLE public.certificate_templates 
  ADD CONSTRAINT certificate_templates_nome_length 
  CHECK (length(trim(name)) BETWEEN 1 AND 200);

-- ============================================================================
-- ALUNO_TURMA Table Constraints
-- ============================================================================

-- Sigla curso: max 50 characters if provided
ALTER TABLE public.aluno_turma
  ADD CONSTRAINT aluno_turma_sigla_curso_length 
  CHECK (
    sigla_curso IS NULL OR 
    sigla_curso = '' OR
    length(trim(sigla_curso)) <= 50
  );

-- Local curso: max 200 characters if provided
ALTER TABLE public.aluno_turma
  ADD CONSTRAINT aluno_turma_local_curso_length 
  CHECK (
    local_curso IS NULL OR 
    local_curso = '' OR
    length(trim(local_curso)) <= 200
  );