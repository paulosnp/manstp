import { useEffect, useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { supabase } from "@/lib/supabase";
import { useAuth } from "@/contexts/AuthContext";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { RealtimeChannel } from "@supabase/supabase-js";

interface MetricCard {
  label: string;
  value: number;
}

interface CursoCard {
  id: string;
  nome: string;
  local: string;
  count: number;
}

interface AlunoAndamento {
  nome: string;
  siglaCurso: string;
  localCurso: string;
  turmaId: string;
}

export default function Dashboard() {
  const { user } = useAuth();
  const [metrics, setMetrics] = useState<MetricCard[]>([]);
  const [cursosEmAndamento, setCursosEmAndamento] = useState<CursoCard[]>([]);
  const [alunosAndamento, setAlunosAndamento] = useState<AlunoAndamento[]>([]);
  const [loading, setLoading] = useState(true);

  const fetchDashboardData = async () => {
    try {
      console.log('Fetching dashboard data...');
      // Buscar todos os cursos com suas turmas e alunos
      const { data: cursos } = await supabase
        .from("cursos")
        .select(`
          id,
          nome,
          local_realizacao,
          turmas (
            id,
            nome,
            situacao,
            aluno_turma (
              aluno_id,
              sigla_curso,
              local_curso,
              status,
              alunos (
                nome_completo
              )
            )
          )
        `);

      if (cursos) {
        let totalAlunos = 0;
        let totalCursos = cursos.length;
        let totalTurmasAndamento = 0;
        const cursosCards: CursoCard[] = [];
        const alunosArray: AlunoAndamento[] = [];

        cursos.forEach((curso: any) => {
          const turmasEmAndamento = curso.turmas?.filter(
            (turma: any) => turma.situacao === "Em Andamento"
          ) || [];

          totalTurmasAndamento += turmasEmAndamento.length;

          // Contar apenas alunos com status "Cursando"
          const alunosNoCurso = turmasEmAndamento.reduce(
            (sum: number, turma: any) => {
              const alunosCursando = turma.aluno_turma?.filter(
                (at: any) => at.status?.toLowerCase() === 'cursando'
              ) || [];
              return sum + alunosCursando.length;
            },
            0
          );

          totalAlunos += alunosNoCurso;

          if (turmasEmAndamento.length > 0 && alunosNoCurso > 0) {
            cursosCards.push({
              id: curso.id,
              nome: curso.nome || "Sem nome",
              local: curso.local_realizacao || "Não especificado",
              count: alunosNoCurso,
            });

            // Coletar alunos para tabela (apenas os que estão cursando)
            turmasEmAndamento.forEach((turma: any) => {
              turma.aluno_turma?.forEach((vinculo: any) => {
                if (vinculo.status?.toLowerCase() === 'cursando') {
                  alunosArray.push({
                    nome: vinculo.alunos?.nome_completo || "N/A",
                    siglaCurso: vinculo.sigla_curso || curso.nome || "N/A",
                    localCurso: vinculo.local_curso || curso.local_realizacao || "N/A",
                    turmaId: turma.nome || turma.id,
                  });
                }
              });
            });
          }
        });

        setMetrics([
          { label: "Total de Alunos", value: totalAlunos },
          { label: "Cursos Ativos", value: totalCursos },
          { label: "Turmas em Andamento", value: totalTurmasAndamento },
          { label: "Alunos Cursando", value: alunosArray.length },
        ]);

        setCursosEmAndamento(cursosCards);
        setAlunosAndamento(alunosArray);
        console.log('Dashboard data updated:', { cursosCards, alunosArray });
      }
    } catch (error) {
      console.error("Erro ao buscar dados do dashboard:", error);
    } finally {
      setLoading(false);
    }
  };

  // Initial data fetch
  useEffect(() => {
    if (user) {
      fetchDashboardData();
    }
  }, [user]);

  // Setup realtime subscriptions
  useEffect(() => {
    if (!user) return;

    console.log('🔴 Setting up realtime subscriptions for dashboard');
    
    const channel: RealtimeChannel = supabase
      .channel('dashboard-realtime-changes')
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'turmas'
        },
        (payload) => {
          console.log('🔴 Turmas change detected:', payload.eventType, payload);
          fetchDashboardData();
        }
      )
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'aluno_turma'
        },
        (payload) => {
          console.log('🔴 Aluno_turma change detected:', payload.eventType, payload);
          fetchDashboardData();
        }
      )
      .subscribe((status) => {
        console.log('🔴 Realtime subscription status:', status);
        if (status === 'SUBSCRIBED') {
          console.log('✅ Successfully subscribed to realtime updates');
        }
      });

    return () => {
      console.log('🔴 Cleaning up realtime subscriptions');
      supabase.removeChannel(channel);
    };
  }, [user]);

  if (loading) {
    return (
      <div className="flex items-center justify-center py-12">
        <div className="h-8 w-8 animate-spin rounded-full border-4 border-primary border-t-transparent"></div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold tracking-tight">Painel de Controle — Formação</h1>
        <p className="text-sm text-muted-foreground mt-1">Atualização automática em tempo real 🔴</p>
      </div>

      {/* CARDS DE MÉTRICAS */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        {metrics.map((metric, idx) => (
          <Card key={idx} className="shadow-card">
            <CardContent className="p-4">
              <p className="text-sm text-muted-foreground mb-1">{metric.label}</p>
              <p className="text-2xl font-bold">{metric.value}</p>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* CURSOS EM ANDAMENTO */}
      <Card className="shadow-card">
        <CardHeader>
          <CardTitle>Cursos em andamento</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            {cursosEmAndamento.length === 0 ? (
              <p className="text-muted-foreground col-span-full">Nenhum curso em andamento</p>
            ) : (
              cursosEmAndamento.map((curso) => (
                <div key={curso.id} className="p-3 border rounded-lg bg-card">
                  <div className="font-semibold">{curso.nome}</div>
                  <div className="text-sm text-muted-foreground">Local: {curso.local}</div>
                  <div className="text-lg font-bold mt-2">{curso.count} alunos</div>
                </div>
              ))
            )}
          </div>
        </CardContent>
      </Card>

      {/* TABELA DE ALUNOS EM ANDAMENTO */}
      <Card className="shadow-card">
        <CardHeader>
          <CardTitle>Alunos com cursos em andamento</CardTitle>
        </CardHeader>
        <CardContent>
          {alunosAndamento.length === 0 ? (
            <p className="text-muted-foreground">Nenhum aluno cursando no momento</p>
          ) : (
            <div className="overflow-auto">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Nome</TableHead>
                    <TableHead>Curso</TableHead>
                    <TableHead>Local</TableHead>
                    <TableHead>Ano/Turma</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {alunosAndamento.map((aluno, idx) => (
                    <TableRow key={idx}>
                      <TableCell>{aluno.nome}</TableCell>
                      <TableCell>{aluno.siglaCurso}</TableCell>
                      <TableCell>{aluno.localCurso}</TableCell>
                      <TableCell>{aluno.turmaId}</TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}