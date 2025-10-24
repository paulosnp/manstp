import { useEffect, useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Users, BookOpen, School, Award } from "lucide-react";
import { supabase } from "@/lib/supabase";
import { useAuth } from "@/contexts/AuthContext";

interface Stats {
  cursosEmAndamentoBrasil: number;
  cursosEmAndamentoSaoTome: number;
  turmasConcluidas: number;
  // Brasil - por tipo
  fuzileirosBrasil: number;
  guardaCosteiraBrasil: number;
  exercitoBrasil: number;
  civisBrasil: number;
  // São Tomé - por tipo
  fuzileirosSaoTome: number;
  guardaCosteiraSaoTome: number;
  exercitoSaoTome: number;
  civisSaoTome: number;
  totalCursos: number;
}

export default function Dashboard() {
  const { user } = useAuth();
  const [stats, setStats] = useState<Stats>({
    cursosEmAndamentoBrasil: 0,
    cursosEmAndamentoSaoTome: 0,
    turmasConcluidas: 0,
    fuzileirosBrasil: 0,
    guardaCosteiraBrasil: 0,
    exercitoBrasil: 0,
    civisBrasil: 0,
    fuzileirosSaoTome: 0,
    guardaCosteiraSaoTome: 0,
    exercitoSaoTome: 0,
    civisSaoTome: 0,
    totalCursos: 0,
  });
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchStats = async () => {
      try {
        // Buscar cursos totais
        const cursosRes = await supabase.from("cursos").select("id", { count: "exact", head: true });
        
        // Buscar IDs dos cursos no Brasil
        const { data: cursosBrasil } = await supabase.from("cursos")
          .select("id")
          .eq("local_realizacao", "Brasil");
        
        const cursoBrasilIds = cursosBrasil?.map(c => c.id) || [];
        
        // Buscar turmas com situação "Em Andamento" em cursos do Brasil
        const turmasEmAndamentoBrasil = await supabase.from("turmas")
          .select("id", { count: "exact", head: true })
          .in("curso_id", cursoBrasilIds)
          .eq("situacao", "Em Andamento");
        
        // Buscar IDs dos cursos em São Tomé e Príncipe
        const { data: cursosSaoTome } = await supabase.from("cursos")
          .select("id")
          .eq("local_realizacao", "São Tomé e Príncipe");
        
        const cursoSaoTomeIds = cursosSaoTome?.map(c => c.id) || [];
        
        // Buscar turmas com situação "Em Andamento" em cursos de São Tomé
        const turmasEmAndamentoSaoTome = await supabase.from("turmas")
          .select("id", { count: "exact", head: true })
          .in("curso_id", cursoSaoTomeIds)
          .eq("situacao", "Em Andamento");
        
        // Buscar turmas concluídas
        const turmasConcluidas = await supabase.from("turmas")
          .select("id", { count: "exact", head: true })
          .eq("situacao", "Concluído");
        
        // Buscar turmas de cursos no Brasil
        const { data: turmasBrasil } = await supabase.from("turmas")
          .select("id")
          .in("curso_id", cursoBrasilIds);
        
        const turmaBrasilIds = turmasBrasil?.map(t => t.id) || [];
        
        // Buscar alunos concluídos no Brasil por tipo militar
        const { data: alunosConcluidosBrasil } = await supabase
          .from("aluno_turma")
          .select("aluno_id, alunos!inner(tipo_militar)")
          .eq("status", "Concluído")
          .in("turma_id", turmaBrasilIds);

        let fuzileirosBrasil = 0, guardaCosteiraBrasil = 0, exercitoBrasil = 0, civisBrasil = 0;
        alunosConcluidosBrasil?.forEach((item: any) => {
          const tipo = item.alunos.tipo_militar;
          if (tipo === "Fuzileiro Naval") fuzileirosBrasil++;
          else if (tipo === "Marinheiro") guardaCosteiraBrasil++;
          else if (tipo === "Exercito") exercitoBrasil++;
          else if (tipo === "Civil") civisBrasil++;
        });

        // Buscar turmas de cursos em São Tomé e Príncipe
        const { data: turmasSaoTome } = await supabase.from("turmas")
          .select("id")
          .in("curso_id", cursoSaoTomeIds);
        
        const turmaSaoTomeIds = turmasSaoTome?.map(t => t.id) || [];
        
        // Buscar alunos concluídos em São Tomé por tipo militar
        const { data: alunosConcluidosSaoTome } = await supabase
          .from("aluno_turma")
          .select("aluno_id, alunos!inner(tipo_militar)")
          .eq("status", "Concluído")
          .in("turma_id", turmaSaoTomeIds);

        let fuzileirosSaoTome = 0, guardaCosteiraSaoTome = 0, exercitoSaoTome = 0, civisSaoTome = 0;
        alunosConcluidosSaoTome?.forEach((item: any) => {
          const tipo = item.alunos.tipo_militar;
          if (tipo === "Fuzileiro Naval") fuzileirosSaoTome++;
          else if (tipo === "Marinheiro") guardaCosteiraSaoTome++;
          else if (tipo === "Exercito") exercitoSaoTome++;
          else if (tipo === "Civil") civisSaoTome++;
        });

        setStats({
          totalCursos: cursosRes.count || 0,
          cursosEmAndamentoBrasil: turmasEmAndamentoBrasil.count || 0,
          cursosEmAndamentoSaoTome: turmasEmAndamentoSaoTome.count || 0,
          turmasConcluidas: turmasConcluidas.count || 0,
          fuzileirosBrasil,
          guardaCosteiraBrasil,
          exercitoBrasil,
          civisBrasil,
          fuzileirosSaoTome,
          guardaCosteiraSaoTome,
          exercitoSaoTome,
          civisSaoTome,
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
      title: "Turmas em Andamento - Brasil",
      value: stats.cursosEmAndamentoBrasil,
      icon: BookOpen,
      description: "Turmas ativas no Brasil",
    },
    {
      title: "Turmas em Andamento - São Tomé e Príncipe",
      value: stats.cursosEmAndamentoSaoTome,
      icon: BookOpen,
      description: "Turmas ativas em São Tomé e Príncipe",
    },
    {
      title: "Total de Turmas Concluídas",
      value: stats.turmasConcluidas,
      icon: School,
      description: "Turmas finalizadas",
    },
    {
      title: "Militares com Cursos Concluídos - São Tomé",
      value: stats.fuzileirosSaoTome + stats.guardaCosteiraSaoTome + stats.exercitoSaoTome + stats.civisSaoTome,
      icon: Award,
      description: `Fuzileiros: ${stats.fuzileirosSaoTome} | Guarda Costeira: ${stats.guardaCosteiraSaoTome} | Exército: ${stats.exercitoSaoTome} | Civis: ${stats.civisSaoTome}`,
    },
    {
      title: "Militares com Cursos Concluídos - Brasil",
      value: stats.fuzileirosBrasil + stats.guardaCosteiraBrasil + stats.exercitoBrasil + stats.civisBrasil,
      icon: Users,
      description: `Fuzileiros: ${stats.fuzileirosBrasil} | Guarda Costeira: ${stats.guardaCosteiraBrasil} | Exército: ${stats.exercitoBrasil} | Civis: ${stats.civisBrasil}`,
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
