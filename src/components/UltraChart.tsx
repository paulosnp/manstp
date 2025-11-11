import { useEffect, useState } from "react";
import { supabase } from "@/lib/supabase";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Legend, Cell, LabelList } from "recharts";

interface YearData {
  ano: string;
  fuzileiro: number;
  marinheiro: number;
  exercito: number;
  civil: number;
  total: number;
}

const COLORS = {
  fuzileiro: "#43A047",
  marinheiro: "#FB8C00",
  exercito: "#8E24AA",
  civil: "#E53935",
  total: "#1E88E5"
};

export default function UltraChart() {
  const [yearData, setYearData] = useState<YearData[]>([]);
  const [lastUpdate, setLastUpdate] = useState<Date>(new Date());

  const fetchData = async () => {
    try {
      // Buscar alunos com suas turmas e status
      const { data: alunoTurma, error: errorAT } = await supabase
        .from("aluno_turma")
        .select(`
          aluno_id,
          turma_id,
          status,
          turmas!inner(ano)
        `);

      if (errorAT) throw errorAT;

      // Buscar informações dos alunos
      const { data: alunos, error: errorAlunos } = await supabase
        .from("alunos")
        .select("id, tipo_militar");

      if (errorAlunos) throw errorAlunos;

      // Criar mapa de alunos
      const alunosMap = new Map(alunos?.map(a => [a.id, a]) || []);

      // Agrupar por ano - contando inscrições (aluno pode aparecer em múltiplas turmas)
      const dadosPorAno: Record<string, { 
        fuzileiro: number; 
        marinheiro: number; 
        exercito: number; 
        civil: number;
        total: number;
      }> = {};

      // Totais gerais (soma de todas as inscrições)
      let totalGeralFuzileiro = 0;
      let totalGeralMarinheiro = 0;
      let totalGeralExercito = 0;
      let totalGeralCivil = 0;
      let totalGeralTodos = 0;

      alunoTurma?.forEach((at) => {
        const ano = (at.turmas as any)?.ano?.toString() || "Sem Ano";
        const aluno = alunosMap.get(at.aluno_id);
        const status = at.status;
        
        if (!aluno) return;

        if (!dadosPorAno[ano]) {
          dadosPorAno[ano] = { fuzileiro: 0, marinheiro: 0, exercito: 0, civil: 0, total: 0 };
        }

        const tipo = aluno.tipo_militar?.toLowerCase() || "civil";
        const concluido = status === "Concluído";

        // Para Total de cada ano: contar TODAS as inscrições
        dadosPorAno[ano].total++;
        totalGeralTodos++;

        // Para categorias específicas: só contar se concluído
        if (tipo.includes("fuzileiro")) {
          if (concluido) {
            dadosPorAno[ano].fuzileiro++;
            totalGeralFuzileiro++;
          }
        } else if (tipo.includes("marinheiro")) {
          if (concluido) {
            dadosPorAno[ano].marinheiro++;
            totalGeralMarinheiro++;
          }
        } else if (tipo.includes("exército") || tipo.includes("exercito")) {
          if (concluido) {
            dadosPorAno[ano].exercito++;
            totalGeralExercito++;
          }
        } else {
          if (concluido) {
            dadosPorAno[ano].civil++;
            totalGeralCivil++;
          }
        }
      });

      // Converter para array e ordenar
      const resultado: YearData[] = Object.keys(dadosPorAno)
        .sort()
        .map((ano) => ({
          ano,
          total: dadosPorAno[ano].total,
          marinheiro: dadosPorAno[ano].marinheiro,
          fuzileiro: dadosPorAno[ano].fuzileiro,
          exercito: dadosPorAno[ano].exercito,
          civil: dadosPorAno[ano].civil
        }));

      // Adicionar Total Geral no início
      resultado.unshift({
        ano: "TOTAL GERAL",
        total: totalGeralTodos,
        marinheiro: totalGeralMarinheiro,
        fuzileiro: totalGeralFuzileiro,
        exercito: totalGeralExercito,
        civil: totalGeralCivil
      });

      setYearData(resultado);
      setLastUpdate(new Date());
    } catch (error) {
      console.error("Erro ao buscar dados:", error);
    }
  };

  useEffect(() => {
    fetchData();
    const interval = setInterval(fetchData, 30000); // Atualiza a cada 30 segundos
    return () => clearInterval(interval);
  }, []);

  const renderCustomLabel = (props: any) => {
    const { x, y, width, value } = props;
    return value > 0 ? (
      <text 
        x={x + width / 2} 
        y={y - 5} 
        fill="hsl(var(--foreground))" 
        textAnchor="middle" 
        fontSize={12}
        fontWeight="bold"
      >
        {value}
      </text>
    ) : null;
  };

  return (
    <div className="space-y-6">
      <Card className="shadow-card">
        <CardHeader>
          <CardTitle className="flex items-center justify-between">
            <span>Distribuição de Alunos por Ano e Categoria</span>
            <span className="text-xs text-muted-foreground">
              Atualizado: {lastUpdate.toLocaleTimeString()}
            </span>
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="text-xs text-muted-foreground mb-4">
            Atualizado automaticamente a cada 30 segundos
          </div>

          <ResponsiveContainer width="100%" height={400}>
            <BarChart data={yearData} margin={{ top: 20, right: 30, left: 20, bottom: 5 }}>
              <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
              <XAxis 
                dataKey="ano" 
                stroke="hsl(var(--foreground))"
                tick={{ fill: "hsl(var(--foreground))", fontSize: 12 }}
                label={{ value: "Ano", position: "insideBottom", offset: -5 }}
              />
              <YAxis 
                stroke="hsl(var(--foreground))"
                tick={{ fill: "hsl(var(--foreground))", fontSize: 12 }}
                label={{ value: "Quantidade de Alunos", angle: -90, position: "insideLeft" }}
              />
              <Tooltip
                contentStyle={{
                  backgroundColor: "hsl(var(--background))",
                  border: "1px solid hsl(var(--border))",
                  borderRadius: "8px",
                }}
              />
              <Legend wrapperStyle={{ paddingTop: "20px" }} />
              
              <Bar dataKey="total" name="Total" fill={COLORS.total} radius={[8, 8, 0, 0]}>
                <LabelList content={renderCustomLabel} />
              </Bar>
              <Bar dataKey="marinheiro" name="Marinheiro (Concluídos)" fill={COLORS.marinheiro} radius={[8, 8, 0, 0]}>
                <LabelList content={renderCustomLabel} />
              </Bar>
              <Bar dataKey="fuzileiro" name="Fuzileiro (Concluídos)" fill={COLORS.fuzileiro} radius={[8, 8, 0, 0]}>
                <LabelList content={renderCustomLabel} />
              </Bar>
              <Bar dataKey="exercito" name="Exército (Concluídos)" fill={COLORS.exercito} radius={[8, 8, 0, 0]}>
                <LabelList content={renderCustomLabel} />
              </Bar>
              <Bar dataKey="civil" name="Civil (Concluídos)" fill={COLORS.civil} radius={[8, 8, 0, 0]}>
                <LabelList content={renderCustomLabel} />
              </Bar>
            </BarChart>
          </ResponsiveContainer>
        </CardContent>
      </Card>
    </div>
  );
}
