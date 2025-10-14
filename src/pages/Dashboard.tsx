import { useEffect, useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Users, BookOpen, School, Award } from "lucide-react";
import { supabase } from "@/lib/supabase";
import { useAuth } from "@/contexts/AuthContext";

interface Stats {
  cursosEmAndamentoBrasil: number;
  cursosEmAndamentoSaoTome: number;
  turmasConcluidas: number;
  militaresConcluidos: number;
  militaresConcluidosSaoTome: number;
  militaresConcluidosBrasil: number;
  totalCursos: number;
}

export default function Dashboard() {
  const { user } = useAuth();
  const [stats, setStats] = useState<Stats>({
    cursosEmAndamentoBrasil: 0,
    cursosEmAndamentoSaoTome: 0,
    turmasConcluidas: 0,
    militaresConcluidos: 0,
    militaresConcluidosSaoTome: 0,
    militaresConcluidosBrasil: 0,
    totalCursos: 0,
  });
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchStats = async () => {
      try {
        // Buscar cursos totais
        const cursosRes = await supabase.from("cursos").select("id", { count: "exact", head: true });
        
        // Buscar cursos em andamento por local
        const cursosEmAndamentoBrasilRes = await supabase.from("cursos")
          .select("id", { count: "exact", head: true })
          .eq("situacao", "Em Andamento")
          .eq("local_realizacao", "Brasil");
        
        const cursosEmAndamentoSaoTomeRes = await supabase.from("cursos")
          .select("id", { count: "exact", head: true })
          .eq("situacao", "Em Andamento")
          .eq("local_realizacao", "São Tomé e Príncipe");
        
        // Buscar IDs dos cursos concluídos
        const { data: cursosConcluidos } = await supabase.from("cursos")
          .select("id")
          .eq("situacao", "Concluído");
        
        const cursoConcluidoIds = cursosConcluidos?.map(c => c.id) || [];
        
        // Buscar turmas concluídas
        const turmasConcluidas = await supabase.from("turmas")
          .select("id", { count: "exact", head: true })
          .in("curso_id", cursoConcluidoIds);
        
        // Buscar alunos aprovados
        const alunosConcluidos = await supabase.from("aluno_turma")
          .select("aluno_id", { count: "exact", head: true })
          .eq("status", "Aprovado");
        
        // Buscar IDs dos cursos em São Tomé e Príncipe
        const { data: cursosSaoTome } = await supabase.from("cursos")
          .select("id")
          .eq("local_realizacao", "São Tomé e Príncipe");
        
        const cursoSaoTomeIds = cursosSaoTome?.map(c => c.id) || [];
        
        // Buscar turmas de cursos em São Tomé e Príncipe
        const { data: turmasSaoTome } = await supabase.from("turmas")
          .select("id")
          .in("curso_id", cursoSaoTomeIds);
        
        const turmaSaoTomeIds = turmasSaoTome?.map(t => t.id) || [];
        
        const alunosConcluidosSaoTome = await supabase.from("aluno_turma")
          .select("aluno_id", { count: "exact", head: true })
          .eq("status", "Aprovado")
          .in("turma_id", turmaSaoTomeIds);
        
        // Buscar IDs dos cursos no Brasil
        const { data: cursosBrasil } = await supabase.from("cursos")
          .select("id")
          .eq("local_realizacao", "Brasil");
        
        const cursoBrasilIds = cursosBrasil?.map(c => c.id) || [];
        
        // Buscar turmas de cursos no Brasil
        const { data: turmasBrasil } = await supabase.from("turmas")
          .select("id")
          .in("curso_id", cursoBrasilIds);
        
        const turmaBrasilIds = turmasBrasil?.map(t => t.id) || [];
        
        const alunosConcluidosBrasil = await supabase.from("aluno_turma")
          .select("aluno_id", { count: "exact", head: true })
          .eq("status", "Aprovado")
          .in("turma_id", turmaBrasilIds);

        setStats({
          totalCursos: cursosRes.count || 0,
          cursosEmAndamentoBrasil: cursosEmAndamentoBrasilRes.count || 0,
          cursosEmAndamentoSaoTome: cursosEmAndamentoSaoTomeRes.count || 0,
          turmasConcluidas: turmasConcluidas.count || 0,
          militaresConcluidos: alunosConcluidos.count || 0,
          militaresConcluidosSaoTome: alunosConcluidosSaoTome.count || 0,
          militaresConcluidosBrasil: alunosConcluidosBrasil.count || 0,
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
      title: "Cursos em Andamento - Brasil",
      value: stats.cursosEmAndamentoBrasil,
      icon: BookOpen,
      description: "Cursos ativos no Brasil",
    },
    {
      title: "Cursos em Andamento - São Tomé e Príncipe",
      value: stats.cursosEmAndamentoSaoTome,
      icon: BookOpen,
      description: "Cursos ativos em São Tomé e Príncipe",
    },
    {
      title: "Total de Turmas Concluídas",
      value: stats.turmasConcluidas,
      icon: School,
      description: "Turmas finalizadas",
    },
    {
      title: "Militares com Cursos Concluídos - São Tomé",
      value: stats.militaresConcluidosSaoTome,
      icon: Award,
      description: "Militares formados em São Tomé e Príncipe",
    },
    {
      title: "Militares com Cursos Concluídos - Brasil",
      value: stats.militaresConcluidosBrasil,
      icon: Users,
      description: "Militares formados no Brasil",
    },
    {
      title: "Total de Cursos Cadastrados",
      value: stats.totalCursos,
      icon: BookOpen,
      description: "Todos os cursos no sistema",
    },
  ];

  return (
    <div className="space-y-4 sm:space-y-6">
      <div>
        <h2 className="text-2xl sm:text-3xl font-bold tracking-tight">Dashboard</h2>
        <p className="text-sm sm:text-base text-muted-foreground">Visão geral do sistema de gestão militar</p>
      </div>

      <div className="grid gap-3 sm:gap-4 grid-cols-1 sm:grid-cols-2 lg:grid-cols-3">
        {statCards.map((stat, index) => (
          <Card key={index} className="shadow-card transition-all hover:shadow-elevated">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2 p-4 sm:p-6">
              <CardTitle className="text-xs sm:text-sm font-medium">{stat.title}</CardTitle>
              <stat.icon className="h-3 w-3 sm:h-4 sm:w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent className="p-4 sm:p-6 pt-0">
              <div className="text-xl sm:text-2xl font-bold">{stat.value}</div>
              <p className="text-[10px] sm:text-xs text-muted-foreground mt-1">{stat.description}</p>
            </CardContent>
          </Card>
        ))}
      </div>

      <Card className="shadow-card">
        <CardHeader className="p-4 sm:p-6">
          <CardTitle className="text-base sm:text-lg">Bem-vindo ao Sistema</CardTitle>
        </CardHeader>
        <CardContent className="p-4 sm:p-6 pt-0">
          <p className="text-sm sm:text-base text-muted-foreground">
            Use o menu lateral para navegar entre as diferentes seções do sistema.
            Gerencie alunos, cursos, turmas e acompanhe estatísticas detalhadas.
          </p>
        </CardContent>
      </Card>
    </div>
  );
}
