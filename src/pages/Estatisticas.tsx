import { useEffect, useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { supabase } from "@/lib/supabase";
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from "recharts";
import { ChartContainer, ChartTooltip, ChartTooltipContent } from "@/components/ui/chart";

interface CursoStats {
  cursoNome: string;
  cursoId: string;
  anoStats: {
    ano: number;
    categorias: {
      "Fuzileiro Naval": number;
      "Guarda Costeiro": number;
      "Exército": number;
      "Civil": number;
    };
    totalAno: number;
  }[];
  totalCurso: number;
}

interface ConsolidatedChartData {
  curso: string;
  "Fuzileiro Naval - Aprovado": number;
  "Fuzileiro Naval - Desligado": number;
  "Fuzileiro Naval - Desertor": number;
  "Guarda Costeiro - Aprovado": number;
  "Guarda Costeiro - Desligado": number;
  "Guarda Costeiro - Desertor": number;
  "Exército - Aprovado": number;
  "Exército - Desligado": number;
  "Exército - Desertor": number;
  "Civil - Aprovado": number;
  "Civil - Desligado": number;
  "Civil - Desertor": number;
}

export default function Estatisticas() {
  const [loading, setLoading] = useState(true);
  const [estatisticas, setEstatisticas] = useState<CursoStats[]>([]);
  const [consolidatedData, setConsolidatedData] = useState<ConsolidatedChartData[]>([]);

  useEffect(() => {
    fetchStats();
  }, []);

  const fetchStats = async () => {
    try {
      // Buscar todos os alunos vinculados a turmas com informações de curso e status
      const { data, error } = await supabase
        .from("aluno_turma")
        .select(`
          aluno_id,
          alunos!inner(tipo_militar, status),
          turmas!inner(
            ano,
            curso_id,
            cursos!inner(nome)
          )
        `);

      if (error) throw error;

      // Estrutura para agrupar os dados
      const cursosMap = new Map<string, CursoStats>();
      const consolidatedMap = new Map<string, ConsolidatedChartData>();

      data?.forEach((item: any) => {
        const cursoId = item.turmas.curso_id;
        const cursoNome = item.turmas.cursos.nome;
        const ano = item.turmas.ano;
        const tipoMilitar = item.alunos.tipo_militar;
        const status = item.alunos.status || "Cursando";

        // Inicializar curso se não existir
        if (!cursosMap.has(cursoId)) {
          cursosMap.set(cursoId, {
            cursoId,
            cursoNome,
            anoStats: [],
            totalCurso: 0,
          });
        }

        const curso = cursosMap.get(cursoId)!;

        // Buscar ou criar ano
        let anoStat = curso.anoStats.find((a) => a.ano === ano);
        if (!anoStat) {
          anoStat = {
            ano,
            categorias: {
              "Fuzileiro Naval": 0,
              "Guarda Costeiro": 0,
              "Exército": 0,
              "Civil": 0,
            },
            totalAno: 0,
          };
          curso.anoStats.push(anoStat);
        }

        // Incrementar contador da categoria
        if (tipoMilitar in anoStat.categorias) {
          anoStat.categorias[tipoMilitar as keyof typeof anoStat.categorias]++;
          anoStat.totalAno++;
          curso.totalCurso++;
        }

        // Dados consolidados para o gráfico
        if (!consolidatedMap.has(cursoNome)) {
          consolidatedMap.set(cursoNome, {
            curso: cursoNome,
            "Fuzileiro Naval - Aprovado": 0,
            "Fuzileiro Naval - Desligado": 0,
            "Fuzileiro Naval - Desertor": 0,
            "Guarda Costeiro - Aprovado": 0,
            "Guarda Costeiro - Desligado": 0,
            "Guarda Costeiro - Desertor": 0,
            "Exército - Aprovado": 0,
            "Exército - Desligado": 0,
            "Exército - Desertor": 0,
            "Civil - Aprovado": 0,
            "Civil - Desligado": 0,
            "Civil - Desertor": 0,
          });
        }

        const consolidatedCurso = consolidatedMap.get(cursoNome)!;
        const key = `${tipoMilitar} - ${status}` as keyof ConsolidatedChartData;
        
        if (key in consolidatedCurso) {
          (consolidatedCurso[key] as number)++;
        }
      });

      // Ordenar anos dentro de cada curso
      cursosMap.forEach((curso) => {
        curso.anoStats.sort((a, b) => b.ano - a.ano);
      });

      // Converter Map para Array e ordenar por nome do curso
      const estatisticasArray = Array.from(cursosMap.values()).sort((a, b) =>
        a.cursoNome.localeCompare(b.cursoNome)
      );

      const consolidatedArray = Array.from(consolidatedMap.values()).sort((a, b) =>
        a.curso.localeCompare(b.curso)
      );

      setEstatisticas(estatisticasArray);
      setConsolidatedData(consolidatedArray);
    } catch (error) {
      console.error("Erro ao buscar estatísticas:", error);
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center py-12">
        <div className="h-8 w-8 animate-spin rounded-full border-4 border-primary border-t-transparent"></div>
      </div>
    );
  }

  if (estatisticas.length === 0) {
    return (
      <div className="space-y-6">
        <div>
          <h2 className="text-3xl font-bold tracking-tight">Estatísticas</h2>
          <p className="text-muted-foreground">Visualize estatísticas e métricas do sistema</p>
        </div>
        <Card>
          <CardContent className="py-12 text-center text-muted-foreground">
            Nenhum dado disponível. Cadastre alunos e vincule-os a turmas para visualizar estatísticas.
          </CardContent>
        </Card>
      </div>
    );
  }

  const chartConfig = {
    "Fuzileiro Naval - Aprovado": { label: "FN - Aprovado", color: "hsl(var(--chart-1))" },
    "Fuzileiro Naval - Desligado": { label: "FN - Desligado", color: "hsl(var(--chart-2))" },
    "Fuzileiro Naval - Desertor": { label: "FN - Desertor", color: "hsl(var(--chart-3))" },
    "Guarda Costeiro - Aprovado": { label: "GC - Aprovado", color: "hsl(var(--chart-4))" },
    "Guarda Costeiro - Desligado": { label: "GC - Desligado", color: "hsl(var(--chart-5))" },
    "Guarda Costeiro - Desertor": { label: "GC - Desertor", color: "hsl(var(--chart-6))" },
    "Exército - Aprovado": { label: "Ex - Aprovado", color: "hsl(var(--chart-1))" },
    "Exército - Desligado": { label: "Ex - Desligado", color: "hsl(var(--chart-2))" },
    "Exército - Desertor": { label: "Ex - Desertor", color: "hsl(var(--chart-3))" },
    "Civil - Aprovado": { label: "Civ - Aprovado", color: "hsl(var(--chart-4))" },
    "Civil - Desligado": { label: "Civ - Desligado", color: "hsl(var(--chart-5))" },
    "Civil - Desertor": { label: "Civ - Desertor", color: "hsl(var(--chart-6))" },
  };

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-3xl font-bold tracking-tight">Estatísticas</h2>
        <p className="text-muted-foreground">
          Análise consolidada de alunos por curso, categoria e status
        </p>
      </div>

      {/* Gráfico Consolidado */}
      <Card>
        <CardHeader>
          <CardTitle>Visão Geral - Todos os Anos</CardTitle>
        </CardHeader>
        <CardContent>
          <ChartContainer config={chartConfig} className="h-[400px] w-full">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={consolidatedData}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="curso" angle={-45} textAnchor="end" height={100} />
                <YAxis />
                <ChartTooltip content={<ChartTooltipContent />} />
                <Legend wrapperStyle={{ paddingTop: "20px" }} />
                <Bar dataKey="Fuzileiro Naval - Aprovado" fill="hsl(var(--chart-1))" stackId="fn" />
                <Bar dataKey="Fuzileiro Naval - Desligado" fill="hsl(var(--chart-2))" stackId="fn" />
                <Bar dataKey="Fuzileiro Naval - Desertor" fill="hsl(var(--chart-3))" stackId="fn" />
                <Bar dataKey="Guarda Costeiro - Aprovado" fill="hsl(var(--chart-4))" stackId="gc" />
                <Bar dataKey="Guarda Costeiro - Desligado" fill="hsl(var(--chart-5))" stackId="gc" />
                <Bar dataKey="Guarda Costeiro - Desertor" fill="hsl(var(--chart-6))" stackId="gc" />
                <Bar dataKey="Exército - Aprovado" fill="hsl(var(--chart-1))" stackId="ex" />
                <Bar dataKey="Exército - Desligado" fill="hsl(var(--chart-2))" stackId="ex" />
                <Bar dataKey="Exército - Desertor" fill="hsl(var(--chart-3))" stackId="ex" />
                <Bar dataKey="Civil - Aprovado" fill="hsl(var(--chart-4))" stackId="civ" />
                <Bar dataKey="Civil - Desligado" fill="hsl(var(--chart-5))" stackId="civ" />
                <Bar dataKey="Civil - Desertor" fill="hsl(var(--chart-6))" stackId="civ" />
              </BarChart>
            </ResponsiveContainer>
          </ChartContainer>
        </CardContent>
      </Card>

      <Tabs defaultValue={estatisticas[0]?.cursoId} className="w-full">
        <TabsList className="w-full flex-wrap h-auto gap-2 justify-start">
          {estatisticas.map((curso) => (
            <TabsTrigger key={curso.cursoId} value={curso.cursoId}>
              {curso.cursoNome}
            </TabsTrigger>
          ))}
        </TabsList>

        {estatisticas.map((curso) => (
          <TabsContent key={curso.cursoId} value={curso.cursoId} className="space-y-4">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center justify-between">
                  <span>{curso.cursoNome}</span>
                  <span className="text-primary">Total: {curso.totalCurso} alunos</span>
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-6">
                  {curso.anoStats.map((anoStat) => (
                    <div key={anoStat.ano} className="space-y-2">
                      <h3 className="text-lg font-semibold flex items-center justify-between border-b pb-2">
                        <span>Ano: {anoStat.ano}</span>
                        <span className="text-sm text-muted-foreground">
                          Total do ano: {anoStat.totalAno} alunos
                        </span>
                      </h3>
                      <Table>
                        <TableHeader>
                          <TableRow>
                            <TableHead>Categoria</TableHead>
                            <TableHead className="text-right">Quantidade</TableHead>
                          </TableRow>
                        </TableHeader>
                        <TableBody>
                          <TableRow>
                            <TableCell className="font-medium">Fuzileiro Naval</TableCell>
                            <TableCell className="text-right">
                              {anoStat.categorias["Fuzileiro Naval"]}
                            </TableCell>
                          </TableRow>
                          <TableRow>
                            <TableCell className="font-medium">Guarda Costeiro</TableCell>
                            <TableCell className="text-right">
                              {anoStat.categorias["Guarda Costeiro"]}
                            </TableCell>
                          </TableRow>
                          <TableRow>
                            <TableCell className="font-medium">Exército</TableCell>
                            <TableCell className="text-right">
                              {anoStat.categorias["Exército"]}
                            </TableCell>
                          </TableRow>
                          <TableRow>
                            <TableCell className="font-medium">Civil</TableCell>
                            <TableCell className="text-right">
                              {anoStat.categorias["Civil"]}
                            </TableCell>
                          </TableRow>
                          <TableRow className="bg-muted/50 font-semibold">
                            <TableCell>Total do Ano</TableCell>
                            <TableCell className="text-right">{anoStat.totalAno}</TableCell>
                          </TableRow>
                        </TableBody>
                      </Table>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          </TabsContent>
        ))}
      </Tabs>
    </div>
  );
}
