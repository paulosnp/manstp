import React, { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Plus, User, Calendar, ChevronLeft, ChevronRight, Save, BookOpen } from "lucide-react";
import { useTranslation } from "react-i18next";
import { toast } from "sonner";
import { startOfYear, addDays, format } from "date-fns";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { useUserRole } from "@/hooks/useUserRole";
import { playBlockSound } from "@/lib/blockSound";
import { PermissionBlockModal } from "@/components/PermissionBlockModal";

const DIAS = ["SEGUNDA-FEIRA", "TERÇA-FEIRA", "QUARTA-FEIRA", "QUINTA-FEIRA", "SEXTA-FEIRA"];
const HORARIOS = [
  "08:00 - 08:50",
  "09:00 - 09:50",
  "10:00 - 10:50",
  "11:00 - 11:50",
  "12:00 - 12:50",
  "13:00 - 13:50",
  "14:00 - 14:50",
  "15:00 - 15:50"
];

// Keywords for filtering turmas display
const TURMA_FILTER_KEYWORDS = ["FMN", "FSD", "FSG", "GAT", "Expedito", "Exp"];

interface HorarioCell {
  turma_id: string;
  dia_semana: string;
  horario: string;
  disciplina: string;
  aula: string;
  instrutor: string;
}

const defaultCell = (turma_id: string, dia_semana: string, horario: string): HorarioCell => ({
  turma_id,
  dia_semana,
  horario,
  disciplina: "",
  aula: "",
  instrutor: "",
});

export default function Horarios() {
  const { t } = useTranslation();
  const { isVisualizador } = useUserRole();
  
  const [turmas, setTurmas] = useState<any[]>([]);
  const [alunos, setAlunos] = useState<any[]>([]);
  const [disciplinas, setDisciplinas] = useState<any[]>([]);
  const [grade, setGrade] = useState<HorarioCell[]>([]);
  const [semanaAtual, setSemanaAtual] = useState(1);
  const [dataInicioSemana, setDataInicioSemana] = useState<Date>(new Date());

  const [activeTurma, setActiveTurma] = useState<any>(null);
  const [loading, setLoading] = useState(false);

  const [novaTurmaNome, setNovaTurmaNome] = useState("");
  const [novoAlunoNome, setNovoAlunoNome] = useState("");
  const [novaDisciplinaNome, setNovaDisciplinaNome] = useState("");
  const [showAllTurmas, setShowAllTurmas] = useState(false);
  const [blockModal, setBlockModal] = useState({ open: false, message: "" });

  // Filter turmas based on keywords
  const filteredTurmas = showAllTurmas 
    ? turmas 
    : turmas.filter(t => 
        TURMA_FILTER_KEYWORDS.some(keyword => 
          (t.nome || "").toLowerCase().includes(keyword.toLowerCase())
        )
      );

  useEffect(() => {
    const last = localStorage.getItem("lovable_last_turma");
    if (last) {
      setActiveTurma(JSON.parse(last));
    }
  }, []);

  useEffect(() => {
    loadAll();
  }, []);

  useEffect(() => {
    if (activeTurma) {
      localStorage.setItem("lovable_last_turma", JSON.stringify(activeTurma));
      loadTurmaData(activeTurma.id);
      calcularDataSemana(semanaAtual);
    }
  }, [activeTurma]);

  useEffect(() => {
    if (activeTurma) {
      loadGradeSemana(activeTurma.id, semanaAtual);
      calcularDataSemana(semanaAtual);
    }
  }, [semanaAtual]);

  async function loadAll() {
    setLoading(true);
    try {
      const { data: t } = await supabase.from("turmas").select("*");
      setTurmas(t || []);

      const last = localStorage.getItem("lovable_last_turma");
      if (last) {
        const parsed = JSON.parse(last);
        const found = (t || []).find((x: any) => x.id === parsed.id);
        if (found) setActiveTurma(found);
      }
    } catch (err) {
      console.error(err);
      toast.error("Erro ao carregar dados");
    } finally {
      setLoading(false);
    }
  }

  async function loadTurmaData(turmaId: string) {
    setLoading(true);
    try {
      const { data: vinculos } = await supabase
        .from("aluno_turma")
        .select("aluno_id")
        .eq("turma_id", turmaId);
      
      const alunoIds = (vinculos || []).map((v: any) => v.aluno_id);
      
      if (alunoIds.length > 0) {
        const { data: a } = await supabase
          .from("alunos")
          .select("*")
          .in("id", alunoIds);
        setAlunos(a || []);
      } else {
        setAlunos([]);
      }

      const { data: d } = await supabase.from("disciplinas").select("*").eq("turma_id", turmaId);
      setDisciplinas(d || []);
    } catch (err) {
      console.error(err);
      toast.error("Erro ao carregar turma");
    } finally {
      setLoading(false);
    }
  }

  function calcularDataSemana(numeroSemana: number) {
    const ano = new Date().getFullYear();
    const inicioAno = startOfYear(new Date(ano, 0, 1));
    const dataInicio = addDays(inicioAno, (numeroSemana - 1) * 7);
    setDataInicioSemana(dataInicio);
  }

  async function loadGradeSemana(turmaId: string, semana: number) {
    setLoading(true);
    try {
      const { data } = await supabase
        .from("grade_semana")
        .select("*")
        .eq("turma_id", turmaId)
        .eq("semana", semana)
        .single();

      if (data && data.dias) {
        const cells: HorarioCell[] = [];
        HORARIOS.forEach((horario, hIdx) => {
          DIAS.forEach((dia, dIdx) => {
            const diaData = data.dias[dIdx];
            cells.push({
              turma_id: turmaId,
              dia_semana: dia,
              horario: horario,
              disciplina: diaData?.horarios?.[hIdx]?.disciplina || "",
              aula: diaData?.horarios?.[hIdx]?.aula || "",
              instrutor: diaData?.horarios?.[hIdx]?.instrutor || "",
            });
          });
        });
        setGrade(cells);
      } else {
        const cells: HorarioCell[] = [];
        HORARIOS.forEach((horario) => {
          DIAS.forEach((dia) => {
            cells.push(defaultCell(turmaId, dia, horario));
          });
        });
        setGrade(cells);
      }
    } catch (err) {
      console.error(err);
      const cells: HorarioCell[] = [];
      HORARIOS.forEach((horario) => {
        DIAS.forEach((dia) => {
          cells.push(defaultCell(turmaId, dia, horario));
        });
      });
      setGrade(cells);
    } finally {
      setLoading(false);
    }
  }


  function openTurma(t: any) {
    setActiveTurma(t);
  }

  async function criarTurma() {
    if (isVisualizador) {
      playBlockSound();
      setBlockModal({ open: true, message: "Você não pode criar turmas. Apenas coordenadores têm essa permissão." });
      return;
    }

    if (!novaTurmaNome.trim()) return;
    
    const { data: user } = await supabase.auth.getUser();
    if (!user.user) {
      toast.error("Usuário não autenticado");
      return;
    }

    const { data, error } = await supabase
      .from("turmas")
      .insert([{ 
        nome: novaTurmaNome.trim(), 
        tipo_militar: "Marinha do Brasil", 
        situacao: "Em Andamento", 
        ano: new Date().getFullYear(),
        user_id: user.user.id,
        curso_id: "00000000-0000-0000-0000-000000000000"
      }])
      .select()
      .single();
    if (error) {
      console.error(error);
      toast.error("Erro ao criar turma");
      return;
    }
    setTurmas([...turmas, data]);
    setNovaTurmaNome("");
    toast.success("Turma criada ✅");
  }

  async function criarAluno() {
    if (isVisualizador) {
      playBlockSound();
      setBlockModal({ open: true, message: "Você não pode adicionar alunos. Apenas coordenadores têm essa permissão." });
      return;
    }

    if (!novoAlunoNome.trim() || !activeTurma) return;

    const { data: user } = await supabase.auth.getUser();
    if (!user.user) {
      toast.error("Usuário não autenticado");
      return;
    }

    const { data: aluno, error } = await supabase
      .from("alunos")
      .insert([{ 
        nome_completo: novoAlunoNome.trim(), 
        tipo_militar: "Marinha do Brasil", 
        graduacao: "Soldado",
        user_id: user.user.id 
      }])
      .select()
      .single();

    if (error) {
      console.error(error);
      toast.error("Erro ao adicionar aluno");
      return;
    }

    await supabase.from("aluno_turma").insert([{ 
      aluno_id: aluno.id, 
      turma_id: activeTurma.id 
    }]);

    setAlunos([...alunos, aluno]);
    setNovoAlunoNome("");
    toast.success("Aluno adicionado ✅");
  }

  async function criarDisciplina() {
    if (isVisualizador) {
      playBlockSound();
      setBlockModal({ open: true, message: "Você não pode criar disciplinas. Apenas coordenadores têm essa permissão." });
      return;
    }

    if (!novaDisciplinaNome.trim() || !activeTurma) return;
    const { data, error } = await supabase
      .from("disciplinas")
      .insert([{
        nome: novaDisciplinaNome.trim(),
        turma_id: activeTurma.id,
        carga_horaria: 0
      }])
      .select()
      .single();

    if (error) {
      console.error(error);
      toast.error("Erro ao adicionar disciplina");
      return;
    }

    setDisciplinas([...disciplinas, data]);
    setNovaDisciplinaNome("");
    toast.success("Disciplina criada ✅");
  }

  async function salvarGradeSemana() {
    if (!activeTurma) return;

    const diasData = DIAS.map((dia, dIdx) => {
      const horariosData = HORARIOS.map((horario) => {
        const cell = grade.find(c => c.dia_semana === dia && c.horario === horario);
        return {
          disciplina: cell?.disciplina || "",
          aula: cell?.aula || "",
          instrutor: cell?.instrutor || "",
        };
      });

      return {
        dia: addDays(dataInicioSemana, dIdx),
        horarios: horariosData,
      };
    });

    const { error } = await supabase
      .from("grade_semana")
      .upsert([{
        turma_id: activeTurma.id,
        semana: semanaAtual,
        dias: diasData as any,
      }], { onConflict: "turma_id,semana" });

    if (error) {
      console.error(error);
      toast.error("Erro ao salvar");
      return;
    }
    toast.success("✅ Semana salva automaticamente");
  }

  function onChangeCell(index: number, field: keyof HorarioCell, value: string) {
    if (isVisualizador) {
      playBlockSound();
      setBlockModal({ open: true, message: "Você não pode modificar a grade de horários. Apenas coordenadores têm essa permissão." });
      return;
    }

    const copy = [...grade];
    copy[index] = { ...copy[index], [field]: value };
    setGrade(copy);
  }

  async function onBlurCell(index: number) {
    if (isVisualizador) return;
    await salvarGradeSemana();
  }

  function mudarSemana(direcao: number) {
    const novaSemana = semanaAtual + direcao;
    if (novaSemana >= 1 && novaSemana <= 52) {
      setSemanaAtual(novaSemana);
    }
  }

  function getCellIndex(horario: string, dia: string): number {
    return grade.findIndex(c => c.horario === horario && c.dia_semana === dia);
  }

  return (
    <div className="min-h-screen flex bg-background">
      <aside className="w-72 bg-card border-r p-4">
        <div className="flex items-center gap-3 mb-4">
          <Calendar className="h-6 w-6" />
          <h2 className="text-lg font-semibold">Turmas</h2>
        </div>

        {!showAllTurmas && (
          <div className="mb-3 p-2 bg-primary/10 border border-primary/20 rounded text-xs">
            <p className="font-medium mb-1">Filtro ativo</p>
            <p className="text-muted-foreground">
              Mostrando apenas turmas com: {TURMA_FILTER_KEYWORDS.join(", ")}
            </p>
          </div>
        )}

        <div className="mb-3">
          <Button
            variant="outline"
            size="sm"
            onClick={() => setShowAllTurmas(!showAllTurmas)}
            className="w-full"
          >
            {showAllTurmas ? "Mostrar Filtradas" : "Mostrar Todas"}
          </Button>
        </div>

        <div className="space-y-2 max-h-[calc(100vh-400px)] overflow-y-auto">
          {filteredTurmas.map(t => (
            <button
              key={t.id}
              onClick={() => openTurma(t)}
              className={`w-full text-left px-3 py-2 rounded flex justify-between items-center ${
                activeTurma?.id === t.id ? "ring-2 ring-primary ring-offset-1" : "hover:bg-accent"
              }`}
            >
              <span className="flex items-center gap-2">
                <strong>{t.nome}</strong>
              </span>
              <span className="text-sm text-muted-foreground">{t.ano}</span>
            </button>
          ))}
          {filteredTurmas.length === 0 && (
            <p className="text-sm text-muted-foreground text-center py-4">
              Nenhuma turma encontrada com os filtros ativos
            </p>
          )}
        </div>

        <div className="mt-6">
          <Input
            value={novaTurmaNome}
            onChange={e => setNovaTurmaNome(e.target.value)}
            placeholder="Nova turma"
            className="w-full mb-2"
          />
          <Button onClick={criarTurma} className="w-full">
            <Plus className="h-4 w-4 mr-2" /> Criar Turma
          </Button>
        </div>
      </aside>

      <main className="flex-1 p-6">
        <header className="flex items-center justify-between mb-6">
          <div>
            <h1 className="text-2xl font-bold">Grade de Horários</h1>
            <p className="text-sm text-muted-foreground">
              {activeTurma ? `Turma ativa: ${activeTurma.nome}` : "Selecione uma turma"}
            </p>
          </div>
        </header>

        {!activeTurma && (
          <Card className="p-6">
            <p className="text-center text-muted-foreground">Selecione uma turma na barra lateral para começar.</p>
          </Card>
        )}

        {activeTurma && (
          <div className="space-y-6">
            <Card className="p-4">
              <div className="flex items-center justify-between mb-4">
                <h2 className="font-semibold text-lg">Alunos - {activeTurma.nome}</h2>
                <div className="flex items-center gap-2">
                  <Input
                    value={novoAlunoNome}
                    onChange={e => setNovoAlunoNome(e.target.value)}
                    placeholder="Novo aluno"
                    className="w-48"
                  />
                  <Button onClick={criarAluno}>Adicionar</Button>
                </div>
              </div>

              <div className="grid grid-cols-3 gap-2">
                {alunos.map(al => (
                  <div key={al.id} className="p-2 border rounded flex items-center gap-2">
                    <User className="h-5 w-5 text-muted-foreground" />
                    <div>
                      <div className="font-medium">{al.nome_completo}</div>
                    </div>
                  </div>
                ))}
              </div>
            </Card>

            <Card className="p-4">
              <div className="flex items-center justify-between mb-4">
                <h2 className="font-semibold">Disciplinas</h2>
                <div className="flex items-center gap-2">
                  <Input
                    value={novaDisciplinaNome}
                    onChange={e => setNovaDisciplinaNome(e.target.value)}
                    placeholder="Nova disciplina"
                    className="w-48"
                  />
                  <Button onClick={criarDisciplina}>Criar</Button>
                </div>
              </div>

              <div className="flex gap-2 flex-wrap">
                {disciplinas.map(d => (
                  <div key={d.id} className="px-3 py-1 border rounded text-sm flex items-center gap-2">
                    <BookOpen className="h-4 w-4" />
                    {d.nome}
                  </div>
                ))}
              </div>
            </Card>

            <Card className="p-4">
              <div className="flex items-center justify-between mb-4">
                <h2 className="font-semibold">Grade de Horários - Semana {semanaAtual} de 52</h2>
                <div className="flex items-center gap-3">
                  <span className="text-sm text-muted-foreground">
                    {format(dataInicioSemana, "dd/MM/yyyy")} - {format(addDays(dataInicioSemana, 4), "dd/MM/yyyy")}
                  </span>
                  <div className="flex gap-2">
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => mudarSemana(-1)}
                      disabled={semanaAtual === 1}
                    >
                      <ChevronLeft className="w-4 h-4" />
                    </Button>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => mudarSemana(1)}
                      disabled={semanaAtual === 52}
                    >
                      <ChevronRight className="w-4 h-4" />
                    </Button>
                  </div>
                </div>
              </div>
              <div className="overflow-x-auto">
                <table className="w-full border-collapse border border-border">
                  <thead>
                    <tr className="bg-primary text-primary-foreground">
                      <th className="border border-border p-2 text-sm font-semibold">HORÁRIO</th>
                      {DIAS.map(dia => (
                        <th key={dia} className="border border-border p-2 text-sm font-semibold min-w-[150px]">
                          {dia}
                        </th>
                      ))}
                    </tr>
                  </thead>
                  <tbody>
                    {HORARIOS.map((horario) => (
                      <tr key={horario}>
                        <td className="border border-border p-2 bg-accent/50 font-medium text-sm whitespace-nowrap">
                          {horario}
                        </td>
                        {DIAS.map((dia) => {
                          const cellIndex = getCellIndex(horario, dia);
                          const cell = grade[cellIndex];
                          
                          if (!cell) return <td key={dia} className="border border-border p-2"></td>;

                          return (
                            <td key={dia} className="border border-border p-1">
                              <div className="space-y-1">
                                <Input
                                  placeholder="Disciplina"
                                  value={cell.disciplina}
                                  onChange={e => onChangeCell(cellIndex, "disciplina", e.target.value)}
                                  onBlur={() => onBlurCell(cellIndex)}
                                  className="text-xs h-7 border-0 bg-transparent focus:bg-background"
                                />
                                <Input
                                  placeholder="Aula"
                                  value={cell.aula}
                                  onChange={e => onChangeCell(cellIndex, "aula", e.target.value)}
                                  onBlur={() => onBlurCell(cellIndex)}
                                  className="text-xs h-7 border-0 bg-transparent focus:bg-background"
                                />
                                <Input
                                  placeholder="Instrutor"
                                  value={cell.instrutor}
                                  onChange={e => onChangeCell(cellIndex, "instrutor", e.target.value)}
                                  onBlur={() => onBlurCell(cellIndex)}
                                  className="text-xs h-7 border-0 bg-transparent focus:bg-background"
                                />
                              </div>
                            </td>
                          );
                        })}
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </Card>
          </div>
        )}
      </main>

      <PermissionBlockModal
        open={blockModal.open}
        onClose={() => setBlockModal({ open: false, message: "" })}
        message={blockModal.message}
      />
    </div>
  );
}
