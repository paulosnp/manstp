import { useEffect, useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { supabase } from "@/lib/supabase";
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer, PieChart, Pie, Cell } from "recharts";

const COLORS = ["hsl(var(--primary))", "hsl(var(--secondary))"];

export default function Estatisticas() {
  const [loading, setLoading] = useState(true);
  const [alunosPorGraduacao, setAlunosPorGraduacao] = useState<any[]>([]);
  const [alunosPorTipo, setAlunosPorTipo] = useState<any[]>([]);
  const [cursosPorSituacao, setCursosPorSituacao] = useState<any[]>([]);

  useEffect(() => {
    fetchStats();
  }, []);

  const fetchStats = async () => {
    try {
      // Alunos por graduação
      const { data: graduacaoData } = await supabase
        .from("alunos")
        .select("graduacao, tipo_militar");

      if (graduacaoData) {
        const graduacaoStats = graduacaoData.reduce((acc: any, aluno) => {
          const grad = aluno.graduacao;
          if (!acc[grad]) {
            acc[grad] = { graduacao: grad, Fuzileiro: 0, "Não Fuzileiro": 0 };
          }
          if (aluno.tipo_militar === "Fuzileiro Naval") {
            acc[grad].Fuzileiro++;
          } else {
            acc[grad]["Não Fuzileiro"]++;
          }
          return acc;
        }, {});
        setAlunosPorGraduacao(Object.values(graduacaoStats));
      }

      // Alunos por tipo militar
      const { data: tipoData } = await supabase
        .from("alunos")
        .select("tipo_militar");

      if (tipoData) {
        const tipoStats = tipoData.reduce((acc: any, aluno) => {
          const tipo = aluno.tipo_militar;
          acc[tipo] = (acc[tipo] || 0) + 1;
          return acc;
        }, {});
        setAlunosPorTipo(
          Object.entries(tipoStats).map(([name, value]) => ({ name, value }))
        );
      }

      // Cursos por situação
      const { data: cursosData } = await supabase
        .from("cursos")
        .select("situacao");

      if (cursosData) {
        const cursosStats = cursosData.reduce((acc: any, curso) => {
          const situacao = curso.situacao || "Sem situação";
          acc[situacao] = (acc[situacao] || 0) + 1;
          return acc;
        }, {});
        setCursosPorSituacao(
          Object.entries(cursosStats).map(([name, value]) => ({ name, value }))
        );
      }
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

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-3xl font-bold tracking-tight">Estatísticas</h2>
        <p className="text-muted-foreground">Visualize estatísticas e métricas do sistema</p>
      </div>

      <div className="grid gap-6 md:grid-cols-2">
        <Card className="shadow-card">
          <CardHeader>
            <CardTitle>Alunos por Graduação e Tipo Militar</CardTitle>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={300}>
              <BarChart data={alunosPorGraduacao}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="graduacao" />
                <YAxis />
                <Tooltip />
                <Legend />
                <Bar dataKey="Fuzileiro" fill={COLORS[0]} />
                <Bar dataKey="Não Fuzileiro" fill={COLORS[1]} />
              </BarChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>

        <Card className="shadow-card">
          <CardHeader>
            <CardTitle>Distribuição por Tipo Militar</CardTitle>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={300}>
              <PieChart>
                <Pie
                  data={alunosPorTipo}
                  cx="50%"
                  cy="50%"
                  labelLine={false}
                  label={({ name, percent }) => `${name}: ${(percent * 100).toFixed(0)}%`}
                  outerRadius={80}
                  fill="#8884d8"
                  dataKey="value"
                >
                  {alunosPorTipo.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                  ))}
                </Pie>
                <Tooltip />
              </PieChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>

        <Card className="shadow-card md:col-span-2">
          <CardHeader>
            <CardTitle>Cursos por Situação</CardTitle>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={300}>
              <BarChart data={cursosPorSituacao}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="name" />
                <YAxis />
                <Tooltip />
                <Bar dataKey="value" fill={COLORS[0]} />
              </BarChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
