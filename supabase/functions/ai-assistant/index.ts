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

    // Fetch system data for context
    const [alunosRes, cursosRes, turmasRes, alunoTurmaRes] = await Promise.all([
      supabase.from("alunos").select("id, nome_completo, graduacao, tipo_militar, funcao, local_servico"),
      supabase.from("cursos").select("id, nome, tipo_curso, modalidade, local_realizacao, categoria"),
      supabase.from("turmas").select("id, nome, ano, situacao, data_inicio, data_fim"),
      supabase.from("aluno_turma").select("aluno_id, turma_id, status, sigla_curso, local_curso")
    ]);

    const totalAlunos = alunosRes.data?.length || 0;
    const totalCursos = cursosRes.data?.length || 0;
    const totalTurmas = turmasRes.data?.length || 0;
    const totalMatriculas = alunoTurmaRes.data?.length || 0;

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

    const systemPrompt = `Você é um assistente inteligente do GESTOR ESCOLAR, um sistema de gestão educacional militar.

DADOS DO SISTEMA:
- Total de alunos cadastrados: ${totalAlunos}
- Total de cursos: ${totalCursos}
- Total de turmas: ${totalTurmas}
- Total de matrículas (aluno_turma): ${totalMatriculas}

Distribuição de alunos por status:
${Object.entries(statusCounts || {}).map(([status, count]) => `- ${status}: ${count}`).join('\n')}

Distribuição de turmas por situação:
${Object.entries(situacaoCounts || {}).map(([situacao, count]) => `- ${situacao}: ${count}`).join('\n')}

SUAS CAPACIDADES:
1. Responder perguntas sobre estatísticas e dados do sistema
2. Gerar insights sobre desempenho de alunos e cursos
3. Sugerir relatórios e análises
4. Ajudar na interpretação de dados
5. Fornecer recomendações baseadas nos dados

INSTRUÇÕES:
- Seja conciso e direto nas respostas
- Use os dados fornecidos para dar respostas precisas
- Quando não souber algo específico, seja honesto
- Sugira análises e relatórios relevantes quando apropriado
- Use linguagem profissional mas acessível
- Formate respostas com markdown quando necessário (listas, negrito, etc)`;

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
