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

const DIAS = ["Segunda", "Terça", "Quarta", "Quinta", "Sexta"];

interface SemanaData {
  semana: number;
  dias: Array<{
    dia: Date;
    aulasManha: string[];
    aulasTarde: string[];
  }>;
}

const defaultBlock = (turma_id: string, dia_semana: string, aula_numero: number) => ({
  turma_id,
  dia_semana,
  aula_numero,
  disciplina: "",
  professor: "",
  sala: "",
  observacao: "",
});

export default function Horarios() {
  const { t } = useTranslation();
  
  const [turmas, setTurmas] = useState<any[]>([]);
  const [alunos, setAlunos] = useState<any[]>([]);
  const [disciplinas, setDisciplinas] = useState<any[]>([]);
  const [grade, setGrade] = useState<any[]>([]);
  const [gradeSemanal, setGradeSemanal] = useState<SemanaData[]>([]);
  const [semanaAtual, setSemanaAtual] = useState(1);

  const [activeTurma, setActiveTurma] = useState<any>(null);
  const [loading, setLoading] = useState(false);

  const [novaTurmaNome, setNovaTurmaNome] = useState("");
  const [novoAlunoNome, setNovoAlunoNome] = useState("");
  const [novaDisciplinaNome, setNovaDisciplinaNome] = useState("");

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
      gerarGradeSemanal(activeTurma.id);
    }
  }, [activeTurma]);

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

      const { data: g } = await supabase.from("grade_aulas").select("*").eq("turma_id", turmaId);
      const full = ensureFullGrade(turmaId, g || []);
      setGrade(full);
    } catch (err) {
      console.error(err);
      toast.error("Erro ao carregar turma");
    } finally {
      setLoading(false);
    }
  }

  function ensureFullGrade(turmaId: string, existingBlocks: any[]) {
    const blocks = [];
    for (let di = 0; di < DIAS.length; di++) {
      const dia = DIAS[di];
      for (let i = 1; i <= 8; i++) {
        const found = existingBlocks.find((b: any) => b.aula_numero === i && b.dia_semana === dia);
        if (found) blocks.push(found);
        else blocks.push(defaultBlock(turmaId, dia, i));
      }
    }
    return blocks;
  }

  function gerarGradeSemanal(turmaId: string) {
    const ano = new Date().getFullYear();
    const inicioAno = startOfYear(new Date(ano, 0, 1));
    const semanas: SemanaData[] = [];
    
    for (let i = 0; i < 52; i++) {
      const semanaData = [];
      for (let j = 0; j < 5; j++) {
        const dia = addDays(inicioAno, i * 7 + j);
        semanaData.push({ 
          dia, 
          aulasManha: ['', '', '', ''], 
          aulasTarde: ['', '', '', ''] 
        });
      }
      semanas.push({ semana: i + 1, dias: semanaData });
    }
    setGradeSemanal(semanas);
  }

  async function atualizarAulaSemanal(
    semanaIdx: number, 
    diaIdx: number, 
    periodo: 'aulasManha' | 'aulasTarde', 
    aulaIdx: number, 
    valor: string
  ) {
    const copia = [...gradeSemanal];
    copia[semanaIdx].dias[diaIdx][periodo][aulaIdx] = valor;
    setGradeSemanal(copia);

    if (activeTurma) {
      await supabase.from("grade_semana").upsert([{
        turma_id: activeTurma.id,
        semana: copia[semanaIdx].semana,
        dias: copia[semanaIdx].dias as any
      }], { onConflict: 'turma_id,semana' });
      toast.success("Grade semanal salva");
    }
  }

  function openTurma(t: any) {
    setActiveTurma(t);
  }

  async function criarTurma() {
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

  async function salvarBloco(b: any) {
    toast.info("Salvando...");
    const payload = {
      turma_id: b.turma_id,
      dia_semana: b.dia_semana,
      aula_numero: b.aula_numero,
      disciplina: b.disciplina,
      professor: b.professor,
      sala: b.sala,
      observacao: b.observacao,
    };

    const { error } = await supabase
      .from("grade_aulas")
      .upsert(payload, { onConflict: "turma_id,dia_semana,aula_numero" });

    if (error) {
      console.error(error);
      toast.error("Erro ao salvar");
      return;
    }
    toast.success("✅ Dados salvos automaticamente");
  }

  function onChangeBlock(index: number, field: string, value: string) {
    const copy = [...grade];
    copy[index] = { ...copy[index], [field]: value };
    setGrade(copy);
  }

  async function onSaveBlock(index: number) {
    const b = grade[index];
    if (!activeTurma) return;
    b.turma_id = activeTurma.id;
    await salvarBloco(b);
  }

  return (
    <div className="min-h-screen flex bg-background">
      <aside className="w-72 bg-card border-r p-4">
        <div className="flex items-center gap-3 mb-4">
          <Calendar className="h-6 w-6" />
          <h2 className="text-lg font-semibold">Turmas</h2>
        </div>

        <div className="space-y-2">
          {turmas.map(t => (
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
          <Tabs defaultValue="diaria" className="space-y-6">
            <TabsList className="grid w-full grid-cols-2">
              <TabsTrigger value="diaria">Grade Diária</TabsTrigger>
              <TabsTrigger value="semanal">
                <Calendar className="w-4 h-4 mr-2" />
                Grade Anual (52 Semanas)
              </TabsTrigger>
            </TabsList>

            <TabsContent value="diaria" className="space-y-6">
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
                    <div key={d.id} className="px-3 py-1 border rounded text-sm">{d.nome}</div>
                  ))}
                </div>
              </Card>

              <Card className="p-4">
                <h2 className="font-semibold mb-4">Grade Semanal Padrão</h2>
                <div className="overflow-x-auto">
                  <div className="grid grid-cols-5 gap-3">
                    {DIAS.map((dia, di) => (
                      <div key={dia} className="bg-accent/50 p-2 rounded">
                        <div className="font-medium mb-2 text-center">{dia}</div>
                        <div className="space-y-2">
                          {grade.filter((g: any) => g.dia_semana === dia).map((b: any, idx: number) => {
                            const globalIndex = di * 8 + (b.aula_numero - 1);
                            const isManha = b.aula_numero <= 4;
                            return (
                              <div key={`${dia}-${b.aula_numero}`} className="p-2 border rounded bg-card">
                                <div className="flex items-center justify-between mb-2">
                                  <div className="text-xs font-semibold">
                                    {isManha ? `Manhã - Aula ${b.aula_numero}` : `Tarde - Aula ${b.aula_numero - 4}`}
                                  </div>
                                </div>

                                <Input
                                  placeholder="Disciplina"
                                  value={b.disciplina}
                                  onChange={e => onChangeBlock(globalIndex, "disciplina", e.target.value)}
                                  className="mb-1 text-sm"
                                />
                                <Input
                                  placeholder="Professor"
                                  value={b.professor}
                                  onChange={e => onChangeBlock(globalIndex, "professor", e.target.value)}
                                  className="mb-1 text-sm"
                                />
                                <Input
                                  placeholder="Sala"
                                  value={b.sala}
                                  onChange={e => onChangeBlock(globalIndex, "sala", e.target.value)}
                                  className="mb-1 text-sm"
                                />
                                <div className="flex gap-2 justify-end mt-2">
                                  <Button onClick={() => onSaveBlock(globalIndex)} size="sm" variant="outline">
                                    <Save className="w-3 h-3 mr-1" /> Salvar
                                  </Button>
                                </div>
                              </div>
                            );
                          })}
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              </Card>
            </TabsContent>

            <TabsContent value="semanal">
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center justify-between">
                    <span>Grade Anual - Semana {semanaAtual} de 52</span>
                    <div className="flex gap-2">
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => setSemanaAtual(Math.max(1, semanaAtual - 1))}
                        disabled={semanaAtual === 1}
                      >
                        <ChevronLeft className="w-4 h-4" />
                      </Button>
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => setSemanaAtual(Math.min(52, semanaAtual + 1))}
                        disabled={semanaAtual === 52}
                      >
                        <ChevronRight className="w-4 h-4" />
                      </Button>
                    </div>
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  {gradeSemanal[semanaAtual - 1] && (
                    <div className="space-y-4">
                      <div className="grid grid-cols-5 gap-3">
                        {DIAS.map((dia, diaIdx) => {
                          const diaData = gradeSemanal[semanaAtual - 1].dias[diaIdx];
                          return (
                            <div key={dia} className="space-y-2">
                              <div className="font-semibold text-center p-2 bg-primary text-primary-foreground rounded">
                                {dia}
                                <div className="text-xs">{format(diaData.dia, 'dd/MM')}</div>
                              </div>

                              <div className="space-y-2">
                                <div className="text-sm font-medium">Manhã</div>
                                {[0, 1, 2, 3].map((aulaIdx) => (
                                  <Input
                                    key={`m-${aulaIdx}`}
                                    placeholder={`Aula ${aulaIdx + 1}`}
                                    value={diaData.aulasManha[aulaIdx]}
                                    onChange={(e) =>
                                      atualizarAulaSemanal(
                                        semanaAtual - 1,
                                        diaIdx,
                                        'aulasManha',
                                        aulaIdx,
                                        e.target.value
                                      )
                                    }
                                    className="text-sm"
                                  />
                                ))}
                              </div>

                              <div className="space-y-2">
                                <div className="text-sm font-medium">Tarde</div>
                                {[0, 1, 2, 3].map((aulaIdx) => (
                                  <Input
                                    key={`t-${aulaIdx}`}
                                    placeholder={`Aula ${aulaIdx + 5}`}
                                    value={diaData.aulasTarde[aulaIdx]}
                                    onChange={(e) =>
                                      atualizarAulaSemanal(
                                        semanaAtual - 1,
                                        diaIdx,
                                        'aulasTarde',
                                        aulaIdx,
                                        e.target.value
                                      )
                                    }
                                    className="text-sm"
                                  />
                                ))}
                              </div>
                            </div>
                          );
                        })}
                      </div>
                    </div>
                  )}
                </CardContent>
              </Card>
            </TabsContent>
          </Tabs>
        )}
      </main>
    </div>
  );
}
