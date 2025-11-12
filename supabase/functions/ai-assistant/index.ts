import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.39.3";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { messages } = await req.json();
    const LOVABLE_API_KEY = Deno.env.get("LOVABLE_API_KEY");
    
    if (!LOVABLE_API_KEY) {
      throw new Error("LOVABLE_API_KEY not configured");
    }

    // Get Supabase client for data access
    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const supabaseKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
    const supabase = createClient(supabaseUrl, supabaseKey);

    // Fetch ALL system data for complete context
    const [
      alunosRes,
      cursosRes,
      turmasRes,
      alunoTurmaRes,
      notasRes,
      instrutoresRes,
      disciplinasRes,
      instrutorTurmaRes,
      gradeAulasRes,
      gradeSemanaRes,
      profilesRes,
      userRolesRes
    ] = await Promise.all([
      supabase.from("alunos").select("*"),
      supabase.from("cursos").select("*"),
      supabase.from("turmas").select("*"),
      supabase.from("aluno_turma").select("*"),
      supabase.from("notas").select("*"),
      supabase.from("instrutores").select("*"),
      supabase.from("disciplinas").select("*"),
      supabase.from("instrutor_turma").select("*"),
      supabase.from("grade_aulas").select("*"),
      supabase.from("grade_semana").select("*"),
      supabase.from("profiles").select("*"),
      supabase.from("user_roles").select("*")
    ]);

    const totalAlunos = alunosRes.data?.length || 0;
    const totalCursos = cursosRes.data?.length || 0;
    const totalTurmas = turmasRes.data?.length || 0;
    const totalMatriculas = alunoTurmaRes.data?.length || 0;
    const totalInstrutores = instrutoresRes.data?.length || 0;
    const totalDisciplinas = disciplinasRes.data?.length || 0;

    // Count students by status
    const statusCounts = alunoTurmaRes.data?.reduce((acc: any, at: any) => {
      acc[at.status] = (acc[at.status] || 0) + 1;
      return acc;
    }, {});

    // Count turmas by situation
    const situacaoCounts = turmasRes.data?.reduce((acc: any, t: any) => {
      acc[t.situacao] = (acc[t.situacao] || 0) + 1;
      return acc;
    }, {});

    // Build comprehensive context with ALL database data
    const alunosData = alunosRes.data || [];
    const cursosData = cursosRes.data || [];
    const turmasData = turmasRes.data || [];
    const alunoTurmaData = alunoTurmaRes.data || [];
    const notasData = notasRes.data || [];
    const instrutoresData = instrutoresRes.data || [];
    const disciplinasData = disciplinasRes.data || [];
    const instrutorTurmaData = instrutorTurmaRes.data || [];
    const gradeAulasData = gradeAulasRes.data || [];
    const gradeSemanaData = gradeSemanaRes.data || [];
    const profilesData = profilesRes.data || [];
    const userRolesData = userRolesRes.data || [];

    const systemPrompt = `Você é um assistente inteligente do GESTOR ESCOLAR, um sistema de gestão educacional militar com ACESSO COMPLETO ao banco de dados.

ESTATÍSTICAS GERAIS:
- Total de alunos: ${totalAlunos}
- Total de cursos: ${totalCursos}
- Total de turmas: ${totalTurmas}
- Total de matrículas: ${totalMatriculas}
- Total de instrutores: ${totalInstrutores}
- Total de disciplinas: ${totalDisciplinas}

DISTRIBUIÇÃO DE STATUS:
Alunos por status:
${Object.entries(statusCounts || {}).map(([status, count]) => `- ${status}: ${count}`).join('\n')}

Turmas por situação:
${Object.entries(situacaoCounts || {}).map(([situacao, count]) => `- ${situacao}: ${count}`).join('\n')}

═══════════════════════════════════════════════════════
DADOS COMPLETOS DO SISTEMA (ACESSO IRRESTRITO)
═══════════════════════════════════════════════════════

📚 ALUNOS (${alunosData.length} registros):
${alunosData.map(a => `
• ID: ${a.id}
  Nome: ${a.nome_completo}
  Matrícula: ${a.matricula}
  Graduação: ${a.graduacao} | Tipo: ${a.tipo_militar}
  Função: ${a.funcao || 'N/A'}
  Local: ${a.local_servico || 'N/A'}
  Email: ${a.email || 'N/A'}
  Tel: ${a.telefone || 'N/A'} | WhatsApp: ${a.whatsapp || 'N/A'}
  Nasc: ${a.data_nascimento || 'N/A'}
`).join('\n')}

🎓 CURSOS (${cursosData.length} registros):
${cursosData.map(c => `
• ID: ${c.id}
  Nome: ${c.nome}
  Tipo: ${c.tipo_curso || 'N/A'} | Modalidade: ${c.modalidade || 'N/A'}
  Local: ${c.local_realizacao || 'N/A'}
  Categoria: ${c.categoria || 'N/A'}
  Coordenador: ${c.coordenador || 'N/A'}
  Obs: ${c.observacoes || 'N/A'}
`).join('\n')}

🏫 TURMAS (${turmasData.length} registros):
${turmasData.map(t => `
• ID: ${t.id}
  Nome: ${t.nome} | Ano: ${t.ano}
  Curso ID: ${t.curso_id}
  Situação: ${t.situacao}
  Tipo Militar: ${t.tipo_militar}
  Período: ${t.data_inicio || 'N/A'} até ${t.data_fim || 'N/A'}
  Obs: ${t.observacoes || 'N/A'}
`).join('\n')}

👨‍🏫 INSTRUTORES (${instrutoresData.length} registros):
${instrutoresData.map(i => `
• ID: ${i.id}
  Nome: ${i.nome_completo}
  Graduação: ${i.graduacao} | Tipo: ${i.tipo_militar}
  Especialidade: ${i.especialidade || 'N/A'}
  Email: ${i.email || 'N/A'}
  Tel: ${i.telefone || 'N/A'}
  Obs: ${i.observacoes || 'N/A'}
`).join('\n')}

📖 DISCIPLINAS (${disciplinasData.length} registros):
${disciplinasData.map(d => `
• ID: ${d.id}
  Nome: ${d.nome}
  Turma ID: ${d.turma_id}
  Carga Horária: ${d.carga_horaria || 0}h
`).join('\n')}

📊 NOTAS (${notasData.length} registros):
${notasData.slice(0, 200).map(n => {
  const aluno = alunosData.find(a => a.id === n.aluno_id);
  const disciplina = disciplinasData.find(d => d.id === n.disciplina_id);
  return `• Aluno: ${aluno?.nome_completo || n.aluno_id} | Disciplina: ${disciplina?.nome || n.disciplina_id} | Nota: ${n.nota} | Rec: ${n.nota_recuperacao || 'N/A'}`;
}).join('\n')}
${notasData.length > 200 ? `\n... e mais ${notasData.length - 200} registros de notas` : ''}

🔗 VÍNCULOS ALUNO-TURMA (${alunoTurmaData.length}):
${alunoTurmaData.map(at => {
  const aluno = alunosData.find(a => a.id === at.aluno_id);
  const turma = turmasData.find(t => t.id === at.turma_id);
  return `• ${aluno?.nome_completo || at.aluno_id} → ${turma?.nome || at.turma_id}: ${at.status} | Sigla: ${at.sigla_curso || 'N/A'} | Local: ${at.local_curso || 'N/A'}`;
}).join('\n')}

🔗 VÍNCULOS INSTRUTOR-TURMA (${instrutorTurmaData.length}):
${instrutorTurmaData.map(it => {
  const instrutor = instrutoresData.find(i => i.id === it.instrutor_id);
  const turma = turmasData.find(t => t.id === it.turma_id);
  return `• ${instrutor?.nome_completo || it.instrutor_id} → ${turma?.nome || it.turma_id}`;
}).join('\n')}

📅 GRADE DE AULAS (${gradeAulasData.length} horários):
${gradeAulasData.slice(0, 100).map(ga => `• Turma ${ga.turma_id} | ${ga.dia_semana} ${ga.horario}: ${ga.disciplina || 'N/A'} - ${ga.instrutor || 'N/A'}`).join('\n')}
${gradeAulasData.length > 100 ? `\n... e mais ${gradeAulasData.length - 100} horários` : ''}

👥 USUÁRIOS (${profilesData.length}):
${profilesData.map(p => {
  const roles = userRolesData.filter(r => r.user_id === p.id).map(r => r.role).join(', ');
  return `• ${p.nome_completo || 'N/A'} | Email: ${p.email || 'N/A'} | Roles: ${roles || 'N/A'}`;
}).join('\n')}

═══════════════════════════════════════════════════════

🎯 SUAS CAPACIDADES COM ACESSO COMPLETO:
1. ✅ Consultar QUALQUER dado de alunos (perfil completo, contatos, histórico)
2. ✅ Acessar informações de cursos (tipo, modalidade, local, coordenador)
3. ✅ Ver turmas completas (alunos, instrutores, disciplinas, situação)
4. ✅ Consultar notas individuais e médias de alunos
5. ✅ Listar instrutores e suas turmas
6. ✅ Ver grades de horários e disciplinas
7. ✅ Analisar vínculos entre alunos, turmas e cursos
8. ✅ Gerar relatórios personalizados e estatísticas
9. ✅ Buscar por qualquer campo (nome, matrícula, email, função, etc)
10. ✅ Fornecer insights e recomendações baseadas em dados reais

📋 INSTRUÇÕES DE USO:
- Você tem acesso COMPLETO E IRRESTRITO a todos os dados acima
- Responda com precisão usando os dados fornecidos
- Para buscas específicas, use os IDs e nomes exatos dos registros
- Formate respostas em markdown (tabelas, listas, negrito)
- Para grandes volumes, resuma e ofereça detalhamento
- Seja profissional, objetivo e útil
- Sugira análises quando relevante
- Organize informações de forma clara e estruturada`;

    const response = await fetch("https://ai.gateway.lovable.dev/v1/chat/completions", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${LOVABLE_API_KEY}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        model: "google/gemini-2.5-flash",
        messages: [
          { role: "system", content: systemPrompt },
          ...messages,
        ],
        stream: true,
      }),
    });

    if (!response.ok) {
      if (response.status === 429) {
        return new Response(
          JSON.stringify({ error: "Limite de requisições atingido. Tente novamente em alguns momentos." }),
          { status: 429, headers: { ...corsHeaders, "Content-Type": "application/json" } }
        );
      }
      if (response.status === 402) {
        return new Response(
          JSON.stringify({ error: "Créditos de IA esgotados. Adicione créditos no workspace Lovable." }),
          { status: 402, headers: { ...corsHeaders, "Content-Type": "application/json" } }
        );
      }
      const errorText = await response.text();
      console.error("AI Gateway error:", response.status, errorText);
      return new Response(
        JSON.stringify({ error: "Erro ao comunicar com o assistente de IA" }),
        { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    return new Response(response.body, {
      headers: { ...corsHeaders, "Content-Type": "text/event-stream" },
    });
  } catch (error) {
    console.error("Error in ai-assistant:", error);
    return new Response(
      JSON.stringify({ error: error instanceof Error ? error.message : "Erro desconhecido" }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});
