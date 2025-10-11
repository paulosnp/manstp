import { z } from "zod";

export const emailSchema = z
  .string()
  .trim()
  .email({ message: "Email inválido" })
  .max(255, { message: "Email deve ter no máximo 255 caracteres" })
  .optional()
  .or(z.literal(""));

export const phoneSchema = z
  .string()
  .trim()
  .regex(/^[\d\s\-\(\)\+]*$/, { message: "Telefone deve conter apenas números e caracteres de formatação" })
  .max(20, { message: "Telefone deve ter no máximo 20 caracteres" })
  .optional()
  .or(z.literal(""));

export const nameSchema = z
  .string()
  .trim()
  .min(1, { message: "Nome não pode estar vazio" })
  .max(200, { message: "Nome deve ter no máximo 200 caracteres" });

export const textAreaSchema = z
  .string()
  .trim()
  .max(1000, { message: "Texto deve ter no máximo 1000 caracteres" })
  .optional()
  .or(z.literal(""));

export const alunoSchema = z.object({
  nome_completo: nameSchema,
  email: emailSchema,
  telefone: phoneSchema,
  graduacao: z.string().min(1, { message: "Graduação é obrigatória" }),
  tipo_militar: z.string().min(1, { message: "Tipo militar é obrigatório" }),
  local_servico: z.string().trim().max(200).optional().or(z.literal("")),
  observacoes: textAreaSchema,
  status: z.string().optional(),
});

export const instrutorSchema = z.object({
  nome_completo: nameSchema,
  email: emailSchema,
  telefone: phoneSchema,
  graduacao: z.string().min(1, { message: "Graduação é obrigatória" }),
  tipo_militar: z.string().min(1, { message: "Tipo militar é obrigatório" }),
  especialidade: z.string().trim().max(200).optional().or(z.literal("")),
});

export const cursoSchema = z.object({
  nome: nameSchema,
  categoria: z.string().trim().max(100).optional().or(z.literal("")),
  instituicao: z.string().trim().max(200).optional().or(z.literal("")),
  local_realizacao: z.enum(["São Tomé", "Brasil"]).optional(),
  tipo_curso: z.enum(["Expedito", "Carreira"]).optional(),
  data_inicio: z.string().optional(),
  data_fim: z.string().optional(),
  situacao: z.string().optional(),
  observacoes: textAreaSchema,
});

export const turmaSchema = z.object({
  nome: nameSchema,
  curso_id: z.string().min(1, { message: "Curso é obrigatório" }),
  ano: z.number().min(1900).max(2100),
  tipo_militar: z.string().min(1, { message: "Tipo militar é obrigatório" }),
  data_inicio: z.string().optional(),
  data_fim: z.string().optional(),
  observacoes: textAreaSchema,
});

export const authSchema = z.object({
  email: z
    .string()
    .trim()
    .email({ message: "Email inválido" })
    .max(255, { message: "Email deve ter no máximo 255 caracteres" }),
  password: z
    .string()
    .min(6, { message: "Senha deve ter no mínimo 6 caracteres" })
    .max(72, { message: "Senha deve ter no máximo 72 caracteres" }),
  nome_completo: nameSchema.optional(),
});
