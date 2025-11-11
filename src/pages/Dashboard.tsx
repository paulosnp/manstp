import { useEffect, useState } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { supabase } from "@/lib/supabase";
import { useAuth } from "@/contexts/AuthContext";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { RealtimeChannel } from "@supabase/supabase-js";
import { DashboardCardConfig, DashboardCardType } from "@/components/DashboardCardConfig";

interface DashboardCard {
  id: string;
  type: DashboardCardType;
  titulo: string;
  valor: number;
  subtitulo?: string;
  cor: string; // Tailwind border color class
}

interface AlunoAndamento {
  nome: string;
  curso: string;
  local: string;
  turmaAno: string;
  status: string;
  instrutores: string[];
}

const DEFAULT_CARD_CONFIGS: { [key in DashboardCardType]: string } = {
  coppaznav: "Alunos no curso COPPAZNAV",
  ead: "Cursos a Distância (EAD)",
  cenpem: "Cursos CENPEM",
  expeditos_stp: "Cursos Expeditos São Tomé e Príncipe",
  efomm_ciaga: "EFOMM CIAGA (And/Agd)",
  efomm_ciaba: "EFOMM CIABA (And/Agd)",
  rov_eb: "ROV - EB"
};

export default function Dashboard() {
  const { user } = useAuth();
  const [cards, setCards] = useState<DashboardCard[]>([]);
  const [alunosAndamento, setAlunosAndamento] = useState<AlunoAndamento[]>([]);
  const [loading, setLoading] = useState(true);
  const [lastUpdate, setLastUpdate] = useState<string>("");
  const [cardConfigs, setCardConfigs] = useState<{ [key: string]: { type: DashboardCardType; titulo: string } }>(() => {
    const saved = localStorage.getItem("dashboardCardConfigs");
    return saved ? JSON.parse(saved) : {};
  });

  const fetchDashboardData = async () => {
    try {
      console.log('Fetching dashboard data...');
      
      // Buscar todos os vínculos aluno-turma com status Cursando ou Aguardando
      const { data: vinculos } = await supabase
        .from("aluno_turma")
        .select(`
          status,
          sigla_curso,
          local_curso,
          alunos (nome_completo),
          turmas (
            id,
            nome,
            ano,
            situacao,
            tipo_militar,
            cursos (
              nome,
              tipo_curso,
              modalidade,
              local_realizacao
            )
          )
        `)
        .in('status', ['Cursando', 'Aguardando']);

      if (!vinculos) return;

      // Buscar instrutores de todas as turmas únicas
      const turmasIds = [...new Set(vinculos.map((v: any) => v.turmas?.id).filter(Boolean))];
      const instrutoresPorTurma: { [key: string]: string[] } = {};
      
      for (const turmaId of turmasIds) {
        const { data: instrutoresData } = await supabase
          .from("instrutor_turma")
          .select("instrutores(nome_completo)")
          .eq("turma_id", turmaId);
        
        instrutoresPorTurma[turmaId] = instrutoresData?.map((item: any) => item.instrutores?.nome_completo).filter(Boolean) || [];
      }

      // Contadores
      let totalGeral = 0;
      let eadTotal = 0, eadTurmasAtivas = 0;
      let cenpemTotal = 0, cenpemAguardando = 0, cenpemAndamento = 0;
      let expeditosTotal = 0, expeditosAndamento = 0, expeditosAguardando = 0;
      let efommCiagaTotal = 0, efommCiagaAndamento = 0, efommCiagaAguardando = 0;
      let efommCiabaTotal = 0, efommCiabaAndamento = 0, efommCiabaAguardando = 0;
      let rovEbTotal = 0, rovEbAndamento = 0, rovEbAguardando = 0;
      let cursosAndamentoBrasil = 0;

      const turmasUnicas = new Set<string>();
      const alunosArray: AlunoAndamento[] = [];

      vinculos.forEach((vinculo: any) => {
        const turma = vinculo.turmas;
        const curso = turma?.cursos;
        const status = vinculo.status?.toLowerCase();
        const isAndamento = status === 'cursando';
        const isAguardando = status === 'aguardando';

        if (!turma || !curso) return;

        totalGeral++;
        
        // Adicionar à tabela se estiver em andamento ou aguardando
        if (isAndamento || isAguardando) {
          if (isAndamento) cursosAndamentoBrasil++;
          alunosArray.push({
            nome: vinculo.alunos?.nome_completo || "N/A",
            curso: vinculo.sigla_curso || curso.nome || "N/A",
            local: vinculo.local_curso || curso.local_realizacao || "N/A",
            turmaAno: `${turma.ano}/${turma.nome}` || "N/A",
            status: isAndamento ? "Em Andamento" : "Aguardando",
            instrutores: instrutoresPorTurma[turma.id] || []
          });
        }

        // Categorizar por tipo de curso
        const nomeCurso = curso.nome?.toLowerCase() || '';
        const tipoCurso = curso.tipo_curso?.toLowerCase() || '';
        const modalidade = curso.modalidade?.toLowerCase() || '';

        // EAD
        if (modalidade.includes('ead') || modalidade.includes('distância')) {
          if (isAndamento || isAguardando) {
            eadTotal++;
            turmasUnicas.add(turma.id);
          }
        }

        // CENPEM
        if (nomeCurso.includes('cenpem')) {
          cenpemTotal++;
          if (isAguardando) cenpemAguardando++;
          if (isAndamento) cenpemAndamento++;
        }

        // Expeditos (STP) - TODOS os cursos em São Tomé e Príncipe
        const localCurso = (vinculo.local_curso || curso.local_realizacao || '').toLowerCase();
        const siglaCurso = (vinculo.sigla_curso || '').toLowerCase();
        const isSTP = localCurso.includes('são tomé') || localCurso.includes('sao tome') || 
                      localCurso.includes('stp') || localCurso.includes('príncipe') || 
                      localCurso.includes('principe') || siglaCurso.includes('stp');
        
        if (isSTP) {
          expeditosTotal++;
          if (isAndamento) expeditosAndamento++;
          if (isAguardando) expeditosAguardando++;
        }

        // EFOMM CIAGA
        if (nomeCurso.includes('efomm') && nomeCurso.includes('ciaga')) {
          efommCiagaTotal++;
          if (isAndamento) efommCiagaAndamento++;
          if (isAguardando) efommCiagaAguardando++;
        }

        // EFOMM CIABA
        if (nomeCurso.includes('efomm') && nomeCurso.includes('ciaba')) {
          efommCiabaTotal++;
          if (isAndamento) efommCiabaAndamento++;
          if (isAguardando) efommCiabaAguardando++;
        }

        // ROV - EB
        if (nomeCurso.includes('rov') || nomeCurso.includes('eb')) {
          rovEbTotal++;
          if (isAndamento) rovEbAndamento++;
          if (isAguardando) rovEbAguardando++;
        }
      });

      eadTurmasAtivas = turmasUnicas.size;

      // Criar cards
      const now = new Date();
      const timeStr = now.toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' });
      const dateStr = now.toLocaleDateString('pt-BR');
      
      setLastUpdate(`${dateStr} ${timeStr}`);

      // Count COPPAZNAV students
      let copaaznavTotal = 0;
      vinculos.forEach((vinculo: any) => {
        const curso = vinculo.turmas?.cursos;
        const nomeCurso = curso?.nome?.toLowerCase() || '';
        const siglaCurso = vinculo.sigla_curso?.toLowerCase() || '';
        const status = vinculo.status?.toLowerCase();
        if ((nomeCurso.includes('coppaznav') || siglaCurso.includes('coppaznav')) && 
            (status === 'cursando' || status === 'aguardando')) {
          copaaznavTotal++;
        }
      });

      // Helper function to get card config
      const getCardConfig = (type: DashboardCardType, id: string) => {
        const saved = cardConfigs[id];
        if (saved) {
          return { type: saved.type, titulo: saved.titulo };
        }
        return { type, titulo: DEFAULT_CARD_CONFIGS[type] };
      };

      const allCards: DashboardCard[] = [
        ...(copaaznavTotal > 0 ? [{
          id: "coppaznav",
          ...getCardConfig("coppaznav", "coppaznav"),
          valor: copaaznavTotal,
          subtitulo: `Cursando ou Aguardando`,
          cor: "border-l-teal-500"
        }] : []),
        {
          id: "ead",
          ...getCardConfig("ead", "ead"),
          valor: eadTotal,
          subtitulo: `Turmas ativas: ${eadTurmasAtivas}`,
          cor: "border-l-green-500"
        },
        {
          id: "cenpem",
          ...getCardConfig("cenpem", "cenpem"),
          valor: cenpemTotal,
          subtitulo: `Aguardando: ${cenpemAguardando} • Andamento: ${cenpemAndamento}`,
          cor: "border-l-blue-600"
        },
        {
          id: "expeditos_stp",
          ...getCardConfig("expeditos_stp", "expeditos_stp"),
          valor: expeditosTotal,
          subtitulo: `Em Andamento: ${expeditosAndamento} • Aguardando: ${expeditosAguardando}`,
          cor: "border-l-orange-500"
        },
        {
          id: "efomm_ciaga",
          ...getCardConfig("efomm_ciaga", "efomm_ciaga"),
          valor: efommCiagaTotal,
          subtitulo: `Andamento: ${efommCiagaAndamento} • Aguardando: ${efommCiagaAguardando}`,
          cor: "border-l-purple-600"
        },
        {
          id: "efomm_ciaba",
          ...getCardConfig("efomm_ciaba", "efomm_ciaba"),
          valor: efommCiabaTotal,
          subtitulo: `Andamento: ${efommCiabaAndamento} • Aguardando: ${efommCiabaAguardando}`,
          cor: "border-l-indigo-600"
        },
        {
          id: "rov_eb",
          ...getCardConfig("rov_eb", "rov_eb"),
          valor: rovEbTotal,
          subtitulo: `Andamento: ${rovEbAndamento} • Aguardando: ${rovEbAguardando}`,
          cor: "border-l-red-600"
        }
      ];

      // Apply custom type configurations - recalculate values based on saved type
      const newCards = allCards.map(card => {
        const savedConfig = cardConfigs[card.id];
        if (savedConfig && savedConfig.type !== card.type) {
          // Recalculate based on the saved type
          const type = savedConfig.type;
          switch (type) {
            case "coppaznav":
              return { ...card, type, valor: copaaznavTotal, subtitulo: `Cursando ou Aguardando` };
            case "ead":
              return { ...card, type, valor: eadTotal, subtitulo: `Turmas ativas: ${eadTurmasAtivas}` };
            case "cenpem":
              return { ...card, type, valor: cenpemTotal, subtitulo: `Aguardando: ${cenpemAguardando} • Andamento: ${cenpemAndamento}` };
            case "expeditos_stp":
              return { ...card, type, valor: expeditosTotal, subtitulo: `Em Andamento: ${expeditosAndamento} • Aguardando: ${expeditosAguardando}` };
            case "efomm_ciaga":
              return { ...card, type, valor: efommCiagaTotal, subtitulo: `Andamento: ${efommCiagaAndamento} • Aguardando: ${efommCiagaAguardando}` };
            case "efomm_ciaba":
              return { ...card, type, valor: efommCiabaTotal, subtitulo: `Andamento: ${efommCiabaAndamento} • Aguardando: ${efommCiabaAguardando}` };
            case "rov_eb":
              return { ...card, type, valor: rovEbTotal, subtitulo: `Andamento: ${rovEbAndamento} • Aguardando: ${rovEbAguardando}` };
          }
        }
        return card;
      });

      // Filtrar cards com valor > 0
      setCards(newCards.filter(card => card.valor > 0));
      setAlunosAndamento(alunosArray);
      
      console.log('Dashboard data updated');
    } catch (error) {
      console.error("Erro ao buscar dados do dashboard:", error);
    } finally {
      setLoading(false);
    }
  };

  const handleSaveCardConfig = (config: { id: string; type: DashboardCardType; titulo: string }) => {
    const updated = {
      ...cardConfigs,
      [config.id]: { type: config.type, titulo: config.titulo }
    };
    setCardConfigs(updated);
    localStorage.setItem("dashboardCardConfigs", JSON.stringify(updated));
    // Refetch data to apply new configuration
    fetchDashboardData();
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
        <h1 className="text-2xl sm:text-3xl font-bold tracking-tight">DASHBOARD — CURSOS (Quadros Informativos)</h1>
        <p className="text-sm text-muted-foreground mt-1">Painel atualizado automaticamente. Cards aparecem/removem conforme turmas com alunos 'CURSANDO' ou 'AGUARDANDO'.</p>
      </div>

      {/* CARDS INFORMATIVOS */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {cards.map((card) => (
          <Card key={card.id} className={`shadow-card border-l-4 ${card.cor} relative`}>
            <DashboardCardConfig 
              config={{ id: card.id, type: card.type, titulo: card.titulo }}
              onSave={handleSaveCardConfig}
            />
            <CardContent className="p-5 pt-10">
              <h3 className="text-sm font-medium text-muted-foreground mb-2">{card.titulo}</h3>
              <p className="text-3xl font-bold mb-1">{card.valor}</p>
              {card.subtitulo && (
                <p className="text-xs text-muted-foreground">{card.subtitulo}</p>
              )}
            </CardContent>
          </Card>
        ))}
      </div>

      {cards.length === 0 && (
        <Card className="shadow-card">
          <CardContent className="p-6 text-center">
            <p className="text-muted-foreground">Nenhum curso com alunos em andamento ou aguardando no momento</p>
          </CardContent>
        </Card>
      )}

      {/* TABELA DE ALUNOS EM ANDAMENTO */}
      {alunosAndamento.length > 0 && (
        <Card className="shadow-card">
          <CardContent className="p-6">
            <h2 className="text-lg font-semibold mb-4">Alunos com cursos em andamento ou aguardando (por curso)</h2>
            <div className="overflow-auto">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Nome do Aluno</TableHead>
                    <TableHead>Curso</TableHead>
                    <TableHead>Local</TableHead>
                    <TableHead>Turma/Ano</TableHead>
                    <TableHead>Instrutor(es)</TableHead>
                    <TableHead>Status</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {alunosAndamento.map((aluno, idx) => (
                    <TableRow key={idx}>
                      <TableCell className="font-medium">{aluno.nome}</TableCell>
                      <TableCell>{aluno.curso}</TableCell>
                      <TableCell>{aluno.local}</TableCell>
                      <TableCell>{aluno.turmaAno}</TableCell>
                      <TableCell>
                        {aluno.instrutores && aluno.instrutores.length > 0 ? (
                          <div className="text-sm">
                            {aluno.instrutores.map((instrutor, instIdx) => (
                              <div key={instIdx} className="text-muted-foreground">
                                {instrutor}
                              </div>
                            ))}
                          </div>
                        ) : (
                          <span className="text-muted-foreground text-sm">-</span>
                        )}
                      </TableCell>
                      <TableCell>
                        <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                          aluno.status === "Em Andamento" 
                            ? "bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200" 
                            : "bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-200"
                        }`}>
                          {aluno.status}
                        </span>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}