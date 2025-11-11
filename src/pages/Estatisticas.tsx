import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { supabase } from "@/integrations/supabase/client";
import { useEffect, useState } from "react";
import UltraChart from "@/components/UltraChart";

interface StatData {
  totalAlunos: number;
  totalInstrutores: number;
  totalCursos: number;
  totalTurmas: number;
}

const Estatisticas = () => {
  const [stats, setStats] = useState<StatData>({
    totalAlunos: 0,
    totalInstrutores: 0,
    totalCursos: 0,
    totalTurmas: 0,
  });

  useEffect(() => {
    fetchData();
    // Configurar atualização automática a cada 30 segundos
    const interval = setInterval(fetchData, 30000);
    return () => clearInterval(interval);
  }, []);

  const fetchData = async () => {
    try {
      // Buscar total de inscrições (aluno_turma)
      const { data: alunoTurma, error: errorAT } = await supabase
        .from("aluno_turma")
        .select("aluno_id");

      if (errorAT) throw errorAT;

      // Contar total de inscrições (não alunos únicos)
      const totalAlunos = alunoTurma?.length || 0;

      // Buscar outros totais
      const [instrutoresResult, cursosResult, turmasResult] = await Promise.all([
        supabase.from("instrutores").select("id", { count: "exact", head: true }),
        supabase.from("cursos").select("id", { count: "exact", head: true }),
        supabase.from("turmas").select("id", { count: "exact", head: true }),
      ]);

      setStats({
        totalAlunos: totalAlunos,
        totalInstrutores: instrutoresResult.count || 0,
        totalCursos: cursosResult.count || 0,
        totalTurmas: turmasResult.count || 0,
      });
    } catch (error) {
      console.error("Erro ao buscar dados:", error);
    }
  };

  return (
    <div className="space-y-6">
      <h1 className="text-3xl font-bold">Estatísticas</h1>

      {/* Cards de Estatísticas */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <Card>
          <CardHeader>
            <CardTitle>Total de Inscrições</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-4xl font-bold">{stats.totalAlunos}</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Total de Instrutores</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-4xl font-bold">{stats.totalInstrutores}</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Total de Cursos</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-4xl font-bold">{stats.totalCursos}</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Total de Turmas</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-4xl font-bold">{stats.totalTurmas}</p>
          </CardContent>
        </Card>
      </div>

      {/* Gráfico Ultra */}
      <UltraChart />
    </div>
  );
};

export default Estatisticas;
