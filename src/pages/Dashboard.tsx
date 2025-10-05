import { useEffect, useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Users, BookOpen, School, Award } from "lucide-react";
import { supabase } from "@/lib/supabase";
import { useAuth } from "@/contexts/AuthContext";

interface Stats {
  totalAlunos: number;
  totalCursos: number;
  totalTurmas: number;
  cursosEmAndamento: number;
  fuzieiros: number;
  guardaCosteiros: number;
}

export default function Dashboard() {
  const { user } = useAuth();
  const [stats, setStats] = useState<Stats>({
    totalAlunos: 0,
    totalCursos: 0,
    totalTurmas: 0,
    cursosEmAndamento: 0,
    fuzieiros: 0,
    guardaCosteiros: 0,
  });
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchStats = async () => {
      try {
        const [alunosRes, cursosRes, turmasRes, fuzileirosRes, guardaCosteirosRes, emAndamentoRes] = await Promise.all([
          supabase.from("alunos").select("id", { count: "exact", head: true }),
          supabase.from("cursos").select("id", { count: "exact", head: true }),
          supabase.from("turmas").select("id", { count: "exact", head: true }),
          supabase.from("alunos").select("id", { count: "exact", head: true }).eq("tipo_militar", "Fuzileiro Naval"),
          supabase.from("alunos").select("id", { count: "exact", head: true }).eq("tipo_militar", "Guarda Costeiro"),
          supabase.from("cursos").select("id", { count: "exact", head: true }).eq("situacao", "Em Andamento"),
        ]);

        setStats({
          totalAlunos: alunosRes.count || 0,
          totalCursos: cursosRes.count || 0,
          totalTurmas: turmasRes.count || 0,
          cursosEmAndamento: emAndamentoRes.count || 0,
          fuzieiros: fuzileirosRes.count || 0,
          guardaCosteiros: guardaCosteirosRes.count || 0,
        });
      } catch (error) {
        console.error("Erro ao buscar estatísticas:", error);
      } finally {
        setLoading(false);
      }
    };

    if (user) {
      fetchStats();
    }
  }, [user]);

  if (loading) {
    return (
      <div className="flex items-center justify-center py-12">
        <div className="h-8 w-8 animate-spin rounded-full border-4 border-primary border-t-transparent"></div>
      </div>
    );
  }

  const statCards = [
    {
      title: "Total de Alunos",
      value: stats.totalAlunos,
      icon: Users,
      description: `${stats.fuzieiros} Fuzileiros | ${stats.guardaCosteiros} Guardas Costeiros`,
    },
    {
      title: "Total de Cursos",
      value: stats.totalCursos,
      icon: BookOpen,
      description: `${stats.cursosEmAndamento} em andamento`,
    },
    {
      title: "Total de Turmas",
      value: stats.totalTurmas,
      icon: School,
      description: "Turmas cadastradas",
    },
    {
      title: "Fuzileiros Navais",
      value: stats.fuzieiros,
      icon: Award,
      description: `${stats.totalAlunos > 0 ? Math.round((stats.fuzieiros / stats.totalAlunos) * 100) : 0}% do total`,
    },
  ];

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-3xl font-bold tracking-tight">Dashboard</h2>
        <p className="text-muted-foreground">Visão geral do sistema de gestão militar</p>
      </div>

      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        {statCards.map((stat, index) => (
          <Card key={index} className="shadow-card transition-all hover:shadow-elevated">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">{stat.title}</CardTitle>
              <stat.icon className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{stat.value}</div>
              <p className="text-xs text-muted-foreground">{stat.description}</p>
            </CardContent>
          </Card>
        ))}
      </div>

      <Card className="shadow-card">
        <CardHeader>
          <CardTitle>Bem-vindo ao Sistema</CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-muted-foreground">
            Use o menu lateral para navegar entre as diferentes seções do sistema.
            Gerencie alunos, cursos, turmas e acompanhe estatísticas detalhadas.
          </p>
        </CardContent>
      </Card>
    </div>
  );
}
