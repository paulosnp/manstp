import { useEffect, useState } from "react";
import { supabase } from "@/lib/supabase";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { BarChart, Bar, LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Cell } from "recharts";

interface CategoryData {
  name: string;
  value: number;
  color: string;
  alert?: "increase" | "decrease";
}

interface HistoryData {
  date: string;
  total: number;
}

const COLORS = ["#4f46e5", "#f43f5e", "#0ea5e9", "#22c55e", "#eab308", "#ec4899", "#a855f7"];
const THRESHOLD_ALERT = 5;

export default function UltraChart() {
  const [categoryData, setCategoryData] = useState<CategoryData[]>([]);
  const [historyData, setHistoryData] = useState<HistoryData[]>([]);
  const [lastUpdate, setLastUpdate] = useState<Date>(new Date());

  const fetchData = async () => {
    try {
      // Buscar todos os alunos
      const { data: alunos, error } = await supabase
        .from("alunos")
        .select("tipo_militar");

      if (error) throw error;

      // Contar por tipo
      const contagem: Record<string, number> = {};
      alunos?.forEach((aluno) => {
        const tipo = (aluno.tipo_militar || "Outros").toLowerCase();
        contagem[tipo] = (contagem[tipo] || 0) + 1;
      });

      // Recuperar histórico anterior
      const historico = JSON.parse(localStorage.getItem("historicoAlunos") || "{}");
      const hoje = new Date().toISOString().split("T")[0];

      // Detectar alertas
      const previousData = historico[Object.keys(historico).sort().pop() || ""] || {};
      const newCategoryData: CategoryData[] = Object.keys(contagem)
        .sort()
        .map((tipo, index) => {
          const currentValue = contagem[tipo];
          const previousValue = previousData[tipo] || 0;
          const diff = previousValue === 0 ? 0 : ((currentValue - previousValue) / previousValue) * 100;
          
          return {
            name: tipo.charAt(0).toUpperCase() + tipo.slice(1),
            value: currentValue,
            color: COLORS[index % COLORS.length],
            alert: Math.abs(diff) >= THRESHOLD_ALERT ? (diff > 0 ? "increase" : "decrease") : undefined,
          };
        });

      // Adicionar total geral
      const totalGeral = Object.values(contagem).reduce((a, b) => a + b, 0);
      newCategoryData.unshift({
        name: "Total Geral",
        value: totalGeral,
        color: "#4f46e5",
      });

      setCategoryData(newCategoryData);

      // Salvar histórico
      historico[hoje] = contagem;
      localStorage.setItem("historicoAlunos", JSON.stringify(historico));

      // Preparar dados de histórico para o gráfico
      const historyArray: HistoryData[] = Object.keys(historico)
        .sort()
        .map((date) => ({
          date,
          total: Object.values(historico[date] as Record<string, number>).reduce((a: number, b: number) => a + b, 0),
        }));

      setHistoryData(historyArray);
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

  return (
    <div className="space-y-6">
      <Card className="shadow-card">
        <CardHeader>
          <CardTitle className="flex items-center justify-between">
            <span>Visualização Ultra - Alunos por Categoria</span>
            <span className="text-xs text-muted-foreground">
              Atualizado: {lastUpdate.toLocaleTimeString()}
            </span>
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="text-xs text-muted-foreground mb-4">
            Atualizado automaticamente a cada 30 segundos
          </div>

          {/* Gráfico de Barras 3D */}
          <ResponsiveContainer width="100%" height={360}>
            <BarChart data={categoryData}>
              <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
              <XAxis 
                dataKey="name" 
                stroke="hsl(var(--foreground))"
                tick={{ fill: "hsl(var(--foreground))", fontSize: 12 }}
              />
              <YAxis 
                stroke="hsl(var(--foreground))"
                tick={{ fill: "hsl(var(--foreground))", fontSize: 12 }}
              />
              <Tooltip
                contentStyle={{
                  backgroundColor: "hsl(var(--background))",
                  border: "1px solid hsl(var(--border))",
                  borderRadius: "8px",
                }}
              />
              <Bar dataKey="value" radius={[8, 8, 0, 0]}>
                {categoryData.map((entry, index) => (
                  <Cell
                    key={`cell-${index}`}
                    fill={entry.color}
                    opacity={entry.alert ? 1 : 0.8}
                    className={entry.alert ? "animate-pulse" : ""}
                  />
                ))}
              </Bar>
            </BarChart>
          </ResponsiveContainer>
        </CardContent>
      </Card>

      <Card className="shadow-card">
        <CardHeader>
          <CardTitle>Histórico Diário - Total de Alunos</CardTitle>
        </CardHeader>
        <CardContent>
          <ResponsiveContainer width="100%" height={200}>
            <LineChart data={historyData}>
              <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
              <XAxis 
                dataKey="date" 
                stroke="hsl(var(--foreground))"
                tick={{ fill: "hsl(var(--foreground))", fontSize: 10 }}
              />
              <YAxis 
                stroke="hsl(var(--foreground))"
                tick={{ fill: "hsl(var(--foreground))", fontSize: 10 }}
              />
              <Tooltip
                contentStyle={{
                  backgroundColor: "hsl(var(--background))",
                  border: "1px solid hsl(var(--border))",
                  borderRadius: "8px",
                }}
              />
              <Line
                type="monotone"
                dataKey="total"
                stroke="#4f46e5"
                strokeWidth={2}
                dot={{ fill: "#4f46e5", r: 4 }}
                activeDot={{ r: 6 }}
              />
            </LineChart>
          </ResponsiveContainer>
          <div className="text-xs text-muted-foreground mt-2">
            Histórico diário salvo localmente. Colunas brilham quando há variação significativa (&gt;{THRESHOLD_ALERT}%).
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
