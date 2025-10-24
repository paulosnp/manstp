import { useEffect, useState, useRef } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { supabase } from "@/lib/supabase";
import { useAuth } from "@/contexts/AuthContext";


interface AlunoData {
  id: string;
  nome: string;
  turma_id: string | null;
  status: string;
  tipo_militar: string;
}

interface TurmaData {
  id: string;
  nome: string;
  ano: number;
  curso_id: string;
  situacao: string;
}

interface CursoData {
  id: string;
  nome: string;
  local_realizacao: string | null;
  modalidade: string | null;
}

interface YearStats {
  ano: number;
  inscritos: number;
  concluintes: number;
  reprovados: number;
}

export default function Dashboard() {
  const { user } = useAuth();
  const [loading, setLoading] = useState(true);
  const [metrics, setMetrics] = useState({
    totalGeral: 0,
    ead: 0,
    alunosCenpem: 0,
    alunosExp: 0,
    carreira: 0,
    conclExerc: 0
  });
  const [evolution, setEvolution] = useState<YearStats[]>([]);
  const [statusCounts, setStatusCounts] = useState<Record<string, number>>({});
  const [cfommData, setCfommData] = useState<any[]>([]);
  const [careerData, setCareerData] = useState<Record<string, number>>({});
  const [alunosCursando, setAlunosCursando] = useState<any[]>([]);
  const [alunosPlanejados, setAlunosPlanejados] = useState<any[]>([]);

  const evoCanvasRef = useRef<HTMLCanvasElement>(null);
  const statusCanvasRef = useRef<HTMLCanvasElement>(null);
  const cfommCanvasRef = useRef<HTMLCanvasElement>(null);
  const careerCanvasRef = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    if (user) {
      fetchAllData();
    }
  }, [user]);

  const fetchAllData = async () => {
    try {
      setLoading(true);

      // Fetch all data in parallel
      const [cursosRes, turmasRes, alunosRes, alunoTurmaRes] = await Promise.all([
        supabase.from("cursos").select("*"),
        supabase.from("turmas").select("*"),
        supabase.from("alunos").select("*"),
        supabase.from("aluno_turma").select("*, alunos(*)")
      ]);

      const cursos: CursoData[] = cursosRes.data || [];
      const turmas: TurmaData[] = turmasRes.data || [];
      const alunos: AlunoData[] = (alunosRes.data || []).map((a: any) => ({
        id: a.id,
        nome: a.nome_completo,
        turma_id: null,
        status: "",
        tipo_militar: a.tipo_militar
      }));

      // Map aluno_turma relationships
      const alunoTurmaMap = new Map<string, { turma_id: string; status: string }[]>();
      (alunoTurmaRes.data || []).forEach((at: any) => {
        if (!alunoTurmaMap.has(at.aluno_id)) {
          alunoTurmaMap.set(at.aluno_id, []);
        }
        alunoTurmaMap.get(at.aluno_id)!.push({
          turma_id: at.turma_id,
          status: at.status || "CURSANDO"
        });
      });

      // Enrich alunos with turma data
      const enrichedAlunos = alunos.flatMap(aluno => {
        const turmaLinks = alunoTurmaMap.get(aluno.id) || [];
        if (turmaLinks.length === 0) {
          return [{ ...aluno, turma_id: null, status: "PLANEJADO" }];
        }
        return turmaLinks.map(link => ({
          ...aluno,
          turma_id: link.turma_id,
          status: link.status.toUpperCase()
        }));
      });

      // Compute metrics
      const totalGeral = enrichedAlunos.length;
      
      // EAD courses
      const cursosEadIds = cursos.filter(c => /EAD|DISTÂNCIA/i.test(c.modalidade || "")).map(c => c.id);
      const turmasEadIds = turmas.filter(t => cursosEadIds.includes(t.curso_id)).map(t => t.id);
      const ead = enrichedAlunos.filter(a => a.turma_id && turmasEadIds.includes(a.turma_id)).length;

      // CENPEM courses
      const cursosCenpemIds = cursos.filter(c => /CENPEM/i.test(c.local_realizacao || "")).map(c => c.id);
      const turmasCenpemIds = turmas.filter(t => cursosCenpemIds.includes(t.curso_id)).map(t => t.id);
      const alunosCenpem = enrichedAlunos.filter(a => a.turma_id && turmasCenpemIds.includes(a.turma_id)).length;

      // Expedited courses
      const cursosExpIds = cursos.filter(c => /EXPEDIT/i.test(c.nome || "")).map(c => c.id);
      const turmasExpIds = turmas.filter(t => cursosExpIds.includes(t.curso_id)).map(t => t.id);
      const alunosExp = enrichedAlunos.filter(a => a.turma_id && turmasExpIds.includes(a.turma_id)).length;

      // Career (military types)
      const carreira = enrichedAlunos.filter(a => /MARINHEIRO|FUZILEIRO|OFICIAL/i.test(a.tipo_militar || "")).length;

      // Concluded from army
      const conclExerc = enrichedAlunos.filter(a => /EXERCITO/i.test(a.tipo_militar || "") && a.status === "CONCLUÍDO").length;

      setMetrics({
        totalGeral,
        ead,
        alunosCenpem,
        alunosExp,
        carreira,
        conclExerc
      });

      // Status counts
      const statusMap: Record<string, number> = {};
      enrichedAlunos.forEach(a => {
        const status = a.status || "SEM STATUS";
        statusMap[status] = (statusMap[status] || 0) + 1;
      });
      setStatusCounts(statusMap);

      // Evolution by year
      const anos = Array.from(new Set(turmas.map(t => t.ano))).filter(Boolean).sort((a, b) => a - b);
      const evolutionStats: YearStats[] = anos.map(ano => {
        const turmaIds = turmas.filter(t => t.ano === ano).map(t => t.id);
        const alunosAno = enrichedAlunos.filter(a => a.turma_id && turmaIds.includes(a.turma_id));
        const inscritos = alunosAno.length;
        const concluintes = alunosAno.filter(a => a.status === "CONCLUÍDO").length;
        const reprovados = alunosAno.filter(a => /REPROVADO/i.test(a.status)).length;
        return { ano, inscritos, concluintes, reprovados };
      });
      setEvolution(evolutionStats);

      // CFOMM data
      const cfommStats = anos.map(ano => {
        const turmasAno = turmas.filter(t => t.ano === ano);
        const cfommTurmaIds = turmasAno
          .filter(t => {
            const curso = cursos.find(c => c.id === t.curso_id);
            return /C-FOMM/i.test(curso?.nome || "") && (/CIAGA|CIABA/i.test(curso?.nome || ""));
          })
          .map(t => t.id);
        
        const alunosCfomm = enrichedAlunos.filter(a => a.turma_id && cfommTurmaIds.includes(a.turma_id));
        const inscritos = alunosCfomm.length;
        
        const conclCiaga = alunosCfomm.filter(a => {
          const turma = turmas.find(t => t.id === a.turma_id);
          const curso = turma ? cursos.find(c => c.id === turma.curso_id) : null;
          return a.status === "CONCLUÍDO" && /CIAGA/i.test(curso?.nome || "");
        }).length;
        
        const conclCiaba = alunosCfomm.filter(a => {
          const turma = turmas.find(t => t.id === a.turma_id);
          const curso = turma ? cursos.find(c => c.id === turma.curso_id) : null;
          return a.status === "CONCLUÍDO" && /CIABA/i.test(curso?.nome || "");
        }).length;
        
        return { ano, inscritos, conclCiaga, conclCiaba };
      });
      setCfommData(cfommStats);

      // Career distribution
      const careerMap: Record<string, number> = {};
      enrichedAlunos.forEach(a => {
        const tipo = a.tipo_militar || "Outros";
        careerMap[tipo] = (careerMap[tipo] || 0) + 1;
      });
      setCareerData(careerMap);

      // Lists
      setAlunosCursando(enrichedAlunos.filter(a => a.status === "CURSANDO").slice(0, 50));
      setAlunosPlanejados(enrichedAlunos.filter(a => /PLANEJADO|PREVISTO|AGENDADO/i.test(a.status)).slice(0, 50));

    } catch (error) {
      console.error("Erro ao buscar dados:", error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (!loading && evolution.length > 0 && evoCanvasRef.current) {
      renderEvolutionChart();
    }
  }, [evolution, loading]);

  useEffect(() => {
    if (!loading && Object.keys(statusCounts).length > 0 && statusCanvasRef.current) {
      renderStatusChart();
    }
  }, [statusCounts, loading]);

  useEffect(() => {
    if (!loading && cfommData.length > 0 && cfommCanvasRef.current) {
      renderCfommChart();
    }
  }, [cfommData, loading]);

  useEffect(() => {
    if (!loading && Object.keys(careerData).length > 0 && careerCanvasRef.current) {
      renderCareerChart();
    }
  }, [careerData, loading]);

  const renderEvolutionChart = async () => {
    const ctx = evoCanvasRef.current?.getContext("2d");
    if (!ctx) return;

    const { Chart } = await import("chart.js/auto");
    const ChartDataLabels = (await import("chartjs-plugin-datalabels")).default;

    new Chart(ctx, {
      type: "bar",
      data: {
        labels: evolution.map(e => e.ano.toString()),
        datasets: [
          {
            label: "Inscritos",
            data: evolution.map(e => e.inscritos),
            backgroundColor: "rgba(14, 165, 233, 0.9)",
          },
          {
            label: "Concluintes",
            data: evolution.map(e => e.concluintes),
            backgroundColor: "rgba(16, 185, 129, 0.9)",
          },
          {
            label: "Reprovados",
            data: evolution.map(e => e.reprovados),
            backgroundColor: "rgba(239, 68, 68, 0.9)",
          }
        ]
      },
      options: {
        responsive: true,
        maintainAspectRatio: false,
        plugins: {
          legend: { position: "top" },
          datalabels: {
            color: "#fff",
            font: { weight: "bold" as const, size: 10 },
            formatter: (value: any) => value > 0 ? value : ""
          }
        }
      },
      plugins: [ChartDataLabels]
    });
  };

  const renderStatusChart = async () => {
    const ctx = statusCanvasRef.current?.getContext("2d");
    if (!ctx) return;

    const { Chart } = await import("chart.js/auto");

    new Chart(ctx, {
      type: "doughnut",
      data: {
        labels: Object.keys(statusCounts),
        datasets: [{
          data: Object.values(statusCounts),
          backgroundColor: [
            "rgba(16, 185, 129, 0.9)",
            "rgba(14, 165, 233, 0.9)",
            "rgba(245, 158, 11, 0.9)",
            "rgba(239, 68, 68, 0.9)",
            "rgba(249, 115, 22, 0.9)"
          ]
        }]
      },
      options: {
        responsive: true,
        maintainAspectRatio: false,
        plugins: {
          legend: { position: "right" }
        }
      }
    });
  };

  const renderCfommChart = async () => {
    const ctx = cfommCanvasRef.current?.getContext("2d");
    if (!ctx) return;

    const { Chart } = await import("chart.js/auto");
    const ChartDataLabels = (await import("chartjs-plugin-datalabels")).default;

    new Chart(ctx, {
      type: "bar",
      data: {
        labels: cfommData.map(c => c.ano.toString()),
        datasets: [
          {
            label: "Inscritos (CIAGA+CIABA)",
            data: cfommData.map(c => c.inscritos),
            backgroundColor: "rgba(14, 165, 233, 0.95)"
          },
          {
            label: "Concluintes CIAGA",
            data: cfommData.map(c => c.conclCiaga),
            backgroundColor: "rgba(52, 211, 153, 0.95)"
          },
          {
            label: "Concluintes CIABA",
            data: cfommData.map(c => c.conclCiaba),
            backgroundColor: "rgba(139, 92, 246, 0.95)"
          }
        ]
      },
      options: {
        responsive: true,
        maintainAspectRatio: false,
        plugins: {
          legend: { position: "top" },
          datalabels: {
            color: "#fff",
            font: { weight: "bold" as const, size: 10 },
            formatter: (value: any) => value > 0 ? value : ""
          }
        }
      },
      plugins: [ChartDataLabels]
    });
  };

  const renderCareerChart = async () => {
    const ctx = careerCanvasRef.current?.getContext("2d");
    if (!ctx) return;

    const { Chart } = await import("chart.js/auto");

    const keys = Object.keys(careerData).slice(0, 8);
    const values = keys.map(k => careerData[k]);

    new Chart(ctx, {
      type: "bar",
      data: {
        labels: keys,
        datasets: [{
          data: values,
          backgroundColor: "rgba(37, 99, 235, 0.95)"
        }]
      },
      options: {
        responsive: true,
        maintainAspectRatio: false,
        plugins: {
          legend: { display: false }
        }
      }
    });
  };

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
        <h2 className="text-3xl font-bold tracking-tight text-foreground">Dashboard — Controle de Formação</h2>
        <p className="text-muted-foreground">Visão analítica do sistema de gestão militar</p>
      </div>

      {/* Metric Cards */}
      <div className="grid gap-4 grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-6">
        {[
          ["Total de Alunos", metrics.totalGeral],
          ["Cursos EAD", metrics.ead],
          ["Cursos CENPEM", metrics.alunosCenpem],
          ["Cursos Expeditos", metrics.alunosExp],
          ["Carreira", metrics.carreira],
          ["Concluídos (Exército)", metrics.conclExerc]
        ].map(([title, value], idx) => (
          <Card key={idx} className="shadow-card">
            <CardHeader className="pb-2">
              <CardTitle className="text-xs text-muted-foreground font-medium">{title}</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-foreground">{value}</div>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Charts Grid */}
      <div className="grid gap-4 grid-cols-1 lg:grid-cols-3">
        <Card className="lg:col-span-2 shadow-card">
          <CardHeader>
            <CardTitle className="text-lg">Evolução Anual — Inscritos / Concluídos / Reprovados</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="h-[300px]">
              <canvas ref={evoCanvasRef}></canvas>
            </div>
          </CardContent>
        </Card>

        <Card className="shadow-card">
          <CardHeader>
            <CardTitle className="text-lg">Distribuição de Status</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="h-[300px]">
              <canvas ref={statusCanvasRef}></canvas>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Lower Charts */}
      <div className="grid gap-4 grid-cols-1 lg:grid-cols-2">
        <Card className="shadow-card">
          <CardHeader>
            <CardTitle className="text-lg">Comparativo C-FOMM</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="h-[250px]">
              <canvas ref={cfommCanvasRef}></canvas>
            </div>
          </CardContent>
        </Card>

        <Card className="shadow-card">
          <CardHeader>
            <CardTitle className="text-lg">Distribuição por Carreira</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="h-[250px]">
              <canvas ref={careerCanvasRef}></canvas>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Tables */}
      <div className="grid gap-4 grid-cols-1 lg:grid-cols-2">
        <Card className="shadow-card">
          <CardHeader>
            <CardTitle className="text-lg">Alunos Cursando Agora ({alunosCursando.length})</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="overflow-auto max-h-[300px]">
              {alunosCursando.length === 0 ? (
                <p className="text-sm text-muted-foreground">Nenhum registro</p>
              ) : (
                <table className="w-full text-sm">
                  <thead className="border-b border-border">
                    <tr className="text-left">
                      <th className="pb-2 font-medium text-muted-foreground">Nome</th>
                      <th className="pb-2 font-medium text-muted-foreground">Tipo</th>
                    </tr>
                  </thead>
                  <tbody>
                    {alunosCursando.map((a, i) => (
                      <tr key={i} className="border-b border-border last:border-0">
                        <td className="py-2 text-foreground">{a.nome}</td>
                        <td className="py-2 text-muted-foreground">{a.tipo_militar}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              )}
            </div>
          </CardContent>
        </Card>

        <Card className="shadow-card">
          <CardHeader>
            <CardTitle className="text-lg">Alunos Planejados ({alunosPlanejados.length})</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="overflow-auto max-h-[300px]">
              {alunosPlanejados.length === 0 ? (
                <p className="text-sm text-muted-foreground">Nenhum registro</p>
              ) : (
                <table className="w-full text-sm">
                  <thead className="border-b border-border">
                    <tr className="text-left">
                      <th className="pb-2 font-medium text-muted-foreground">Nome</th>
                      <th className="pb-2 font-medium text-muted-foreground">Tipo</th>
                    </tr>
                  </thead>
                  <tbody>
                    {alunosPlanejados.map((a, i) => (
                      <tr key={i} className="border-b border-border last:border-0">
                        <td className="py-2 text-foreground">{a.nome}</td>
                        <td className="py-2 text-muted-foreground">{a.tipo_militar}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              )}
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
