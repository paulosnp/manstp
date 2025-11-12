import { useState, useEffect, useRef } from "react";
import { useTranslation } from "react-i18next";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { Plus, Upload, FileDown, TrendingUp, X } from "lucide-react";
import { Chart as ChartJS, CategoryScale, LinearScale, PointElement, LineElement, Title, Tooltip, Legend } from 'chart.js';
import { Line } from 'react-chartjs-2';
import jsPDF from "jspdf";
import html2canvas from "html2canvas";
import { useUserRole } from "@/hooks/useUserRole";
import { playBlockSound } from "@/lib/blockSound";
import { PermissionBlockModal } from "@/components/PermissionBlockModal";

ChartJS.register(CategoryScale, LinearScale, PointElement, LineElement, Title, Tooltip, Legend);

interface Turma {
  id: string;
  nome: string;
  ano: number;
  cursos?: {
    nome: string;
    local_realizacao?: string;
  };
}

interface Aluno {
  id: string;
  nome_completo: string;
}

interface Disciplina {
  id: string;
  nome: string;
}

interface Nota {
  aluno_id: string;
  disciplina_id: string;
  nota: number;
  nota_recuperacao?: number | null;
}

export default function Notas() {
  const { t } = useTranslation();
  const { role, isVisualizador } = useUserRole();
  const [turmas, setTurmas] = useState<Turma[]>([]);
  const [selectedTurma, setSelectedTurma] = useState<Turma | null>(null);
  const [alunos, setAlunos] = useState<Aluno[]>([]);
  const [disciplinas, setDisciplinas] = useState<Disciplina[]>([]);
  const [notas, setNotas] = useState<Nota[]>([]);
  const [novaDisciplina, setNovaDisciplina] = useState("");
  const [logoMarcaDagua, setLogoMarcaDagua] = useState<string>("");
  const [editandoCurso, setEditandoCurso] = useState(false);
  const [infoTurma, setInfoTurma] = useState({ curso: "", nome: "", local: "" });
  const [blockModal, setBlockModal] = useState({ open: false, message: "" });
  const tableRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    fetchTurmas();
  }, []);

  // Restaurar última turma selecionada ao carregar
  useEffect(() => {
    const lastTurmaId = localStorage.getItem("lastSelectedTurmaNotas");
    if (lastTurmaId && turmas.length > 0) {
      const turma = turmas.find(t => t.id === lastTurmaId);
      if (turma) {
        setSelectedTurma(turma);
      }
    }
  }, [turmas]);

  useEffect(() => {
    if (selectedTurma) {
      // Salvar turma selecionada no localStorage
      localStorage.setItem("lastSelectedTurmaNotas", selectedTurma.id);
      
      fetchAlunosDaTurma();
      fetchDisciplinas();
      fetchNotas();
      setInfoTurma({
        curso: selectedTurma.cursos?.nome || "",
        nome: selectedTurma.nome || "",
        local: selectedTurma.cursos?.local_realizacao || ""
      });
    }
  }, [selectedTurma]);

  const fetchNotas = async () => {
    if (!selectedTurma) return;
    
    const { data, error } = await supabase
      .from("notas")
      .select("aluno_id, disciplina_id, nota, nota_recuperacao")
      .eq("turma_id", selectedTurma.id);
    
    if (error) {
      toast.error("Erro ao carregar notas");
      return;
    }
    
    setNotas(data || []);
  };

  const fetchTurmas = async () => {
    const { data, error } = await supabase
      .from("turmas")
      .select("id, nome, ano, cursos(nome, local_realizacao)");
    if (error) {
      toast.error("Erro ao carregar turmas");
      return;
    }
    // Filtrar turmas que contenham FSG, FMN, GAT ou FSD
    const turmasFiltradas = (data || []).filter(turma => {
      const nome = turma.nome?.toLowerCase() || '';
      return nome.includes('fsg') || nome.includes('fmn') || nome.includes('gat') || nome.includes('fsd');
    });
    setTurmas(turmasFiltradas);
  };

  const fetchAlunosDaTurma = async () => {
    if (!selectedTurma) return;
    
    const { data, error } = await supabase
      .from("aluno_turma")
      .select("aluno_id, alunos(id, nome_completo)")
      .eq("turma_id", selectedTurma.id);

    if (error) {
      toast.error("Erro ao carregar alunos");
      return;
    }

    const alunosData = data?.map((item: any) => ({
      id: item.alunos.id,
      nome_completo: item.alunos.nome_completo,
    })) || [];

    setAlunos(alunosData);
  };

  const fetchDisciplinas = async () => {
    if (!selectedTurma) return;
    
    const { data, error } = await supabase
      .from("disciplinas")
      .select("id, nome")
      .eq("turma_id", selectedTurma.id);
    
    if (error) {
      toast.error("Erro ao carregar disciplinas");
      return;
    }
    
    setDisciplinas(data || []);
  };

  const adicionarDisciplina = async () => {
    if (isVisualizador) {
      playBlockSound();
      setBlockModal({ open: true, message: "Você não pode adicionar disciplinas. Apenas coordenadores têm essa permissão." });
      return;
    }

    if (!novaDisciplina.trim()) {
      toast.error("Digite o nome da disciplina");
      return;
    }

    if (!selectedTurma) {
      toast.error("Selecione uma turma primeiro");
      return;
    }

    const { data, error } = await supabase
      .from("disciplinas")
      .insert([{
        nome: novaDisciplina.trim(),
        turma_id: selectedTurma.id,
        carga_horaria: 0
      }])
      .select()
      .single();

    if (error) {
      toast.error("Erro ao adicionar disciplina");
      return;
    }

    setDisciplinas([...disciplinas, data]);
    setNovaDisciplina("");
    toast.success("Disciplina adicionada!");
  };

  const removerDisciplina = async (disciplinaId: string) => {
    if (isVisualizador) {
      playBlockSound();
      setBlockModal({ open: true, message: "Você não pode remover disciplinas. Apenas coordenadores têm essa permissão." });
      return;
    }

    const { error } = await supabase
      .from("disciplinas")
      .delete()
      .eq("id", disciplinaId);

    if (error) {
      toast.error("Erro ao remover disciplina");
      return;
    }

    setDisciplinas(disciplinas.filter(d => d.id !== disciplinaId));
    setNotas(notas.filter(n => n.disciplina_id !== disciplinaId));
    toast.success("Disciplina removida!");
  };

  const atualizarNota = async (alunoId: string, disciplinaId: string, valor: string) => {
    if (isVisualizador) {
      playBlockSound();
      setBlockModal({ open: true, message: "Você não pode modificar notas. Apenas coordenadores têm essa permissão." });
      return;
    }

    const nota = parseFloat(valor);
    if (isNaN(nota) || nota < 0 || nota > 20) return;

    if (!selectedTurma) return;

    // Atualizar localmente primeiro para resposta rápida
    const notasAtualizadas = notas.filter(
      n => !(n.aluno_id === alunoId && n.disciplina_id === disciplinaId)
    );
    notasAtualizadas.push({ aluno_id: alunoId, disciplina_id: disciplinaId, nota });
    setNotas(notasAtualizadas);

    // Salvar no banco (upsert)
    const { error } = await supabase
      .from("notas")
      .upsert({
        turma_id: selectedTurma.id,
        aluno_id: alunoId,
        disciplina_id: disciplinaId,
        nota: nota
      }, {
        onConflict: 'turma_id,aluno_id,disciplina_id'
      });

    if (error) {
      console.error("Erro ao salvar nota:", error);
      toast.error("Erro ao salvar nota");
    }
  };

  const atualizarNotaRecuperacao = async (alunoId: string, disciplinaId: string, valor: string) => {
    if (isVisualizador) {
      playBlockSound();
      setBlockModal({ open: true, message: "Você não pode modificar notas de recuperação. Apenas coordenadores têm essa permissão." });
      return;
    }

    const notaRecuperacao = parseFloat(valor);
    if (isNaN(notaRecuperacao) || notaRecuperacao < 0 || notaRecuperacao > 20) return;

    if (!selectedTurma) return;

    const { error } = await supabase
      .from("notas")
      .upsert({
        turma_id: selectedTurma.id,
        aluno_id: alunoId,
        disciplina_id: disciplinaId,
        nota: getNota(alunoId, disciplinaId),
        nota_recuperacao: notaRecuperacao
      }, {
        onConflict: 'turma_id,aluno_id,disciplina_id'
      });

    if (error) {
      console.error("Erro ao salvar nota de recuperação:", error);
      toast.error("Erro ao salvar nota de recuperação");
      return;
    }

    await fetchNotas();
  };

  const getNota = (alunoId: string, disciplinaId: string): number => {
    const nota = notas.find(n => n.aluno_id === alunoId && n.disciplina_id === disciplinaId);
    return nota?.nota || 0;
  };

  const getNotaRecuperacao = (alunoId: string, disciplinaId: string): number | null => {
    const nota = notas.find(n => n.aluno_id === alunoId && n.disciplina_id === disciplinaId);
    return nota?.nota_recuperacao || null;
  };

  const calcularMedia = (alunoId: string): string => {
    const notasAluno = disciplinas.map(d => {
      const nota = getNota(alunoId, d.id);
      const notaRec = getNotaRecuperacao(alunoId, d.id);
      
      // Se a nota é menor que 10 e tem recuperação preenchida, usar a recuperação
      if (nota > 0 && nota < 10 && notaRec !== null && notaRec > 0) {
        return notaRec;
      }
      return nota;
    });
    
    if (notasAluno.length === 0) return "0.00";
    
    const soma = notasAluno.reduce((acc, n) => acc + n, 0);
    return (soma / disciplinas.length).toFixed(2);
  };

  const handleLogoUpload = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (e) => {
      const result = e.target?.result as string;
      setLogoMarcaDagua(result);
      toast.success("Logo carregado com sucesso!");
    };
    reader.readAsDataURL(file);
  };

  const getNotaColor = (nota: number): string => {
    if (!nota || nota === 0) return "bg-blue-100 dark:bg-blue-900/20 border-blue-300"; // Caixas vazias em azul
    if (nota < 10) return "bg-red-100 dark:bg-red-900/20 border-red-300 animate-pulse"; // Piscar apenas notas < 10
    if (nota < 14) return "bg-yellow-100 dark:bg-yellow-900/20 border-yellow-300";
    return "bg-green-100 dark:bg-green-900/20 border-green-300";
  };

  const gerarBoletimPDF = async () => {
    if (!tableRef.current) return;

    toast.info("Gerando PDF...");
    
    try {
      // Salvar estilos originais
      const originalStyles = {
        fontSize: tableRef.current.style.fontSize,
        background: tableRef.current.style.background,
        backgroundColor: tableRef.current.style.backgroundColor,
      };

      // Aplicar estilos para PDF (fundo branco e fonte 14px)
      tableRef.current.style.fontSize = "14px";
      tableRef.current.style.background = "#ffffff";
      tableRef.current.style.backgroundColor = "#ffffff";
      
      // Forçar todos os elementos filhos a terem fundo branco e texto preto
      const allElements = tableRef.current.querySelectorAll('*');
      const originalElementStyles: { 
        element: HTMLElement; 
        background: string; 
        backgroundColor: string;
        color: string;
        borderColor: string;
        padding: string;
        paddingTop: string;
        height: string;
        minHeight: string;
        lineHeight: string;
        display: string;
        alignItems: string;
        justifyContent: string;
        textAlign: string;
        verticalAlign: string;
      }[] = [];
      
      allElements.forEach((el) => {
        const htmlEl = el as HTMLElement;
        originalElementStyles.push({
          element: htmlEl,
          background: htmlEl.style.background,
          backgroundColor: htmlEl.style.backgroundColor,
          color: htmlEl.style.color,
          borderColor: htmlEl.style.borderColor,
          padding: htmlEl.style.padding,
          paddingTop: htmlEl.style.paddingTop,
          height: htmlEl.style.height,
          minHeight: htmlEl.style.minHeight,
          lineHeight: htmlEl.style.lineHeight,
          display: htmlEl.style.display,
          alignItems: htmlEl.style.alignItems,
          justifyContent: htmlEl.style.justifyContent,
          textAlign: htmlEl.style.textAlign,
          verticalAlign: htmlEl.style.verticalAlign,
        });
        
        // Forçar fundo branco, texto preto e bordas pretas
        htmlEl.style.background = "#ffffff";
        htmlEl.style.backgroundColor = "#ffffff";
        htmlEl.style.color = "#000000";
        htmlEl.style.borderColor = "#000000";
        
        // Ajustar inputs para melhor visualização
        if (htmlEl.tagName === 'INPUT') {
          htmlEl.style.padding = "16px 8px";
          htmlEl.style.paddingTop = "18px";
          htmlEl.style.height = "50px";
          htmlEl.style.minHeight = "50px";
          htmlEl.style.lineHeight = "2";
          htmlEl.style.textAlign = "center";
          htmlEl.style.display = "flex";
          htmlEl.style.alignItems = "center";
          htmlEl.style.justifyContent = "center";
          htmlEl.style.verticalAlign = "middle";
        }
        
        // Ajustar células
        if (htmlEl.tagName === 'TD' || htmlEl.tagName === 'TH') {
          htmlEl.style.padding = "16px";
          htmlEl.style.lineHeight = "2";
          htmlEl.style.verticalAlign = "middle";
        }
      });

      const canvas = await html2canvas(tableRef.current, {
        scale: 3,
        backgroundColor: "#ffffff",
        logging: false,
        useCORS: true,
        allowTaint: true,
        windowWidth: tableRef.current.scrollWidth,
        windowHeight: tableRef.current.scrollHeight,
      });
      
      // Restaurar estilos originais
      tableRef.current.style.fontSize = originalStyles.fontSize;
      tableRef.current.style.background = originalStyles.background;
      tableRef.current.style.backgroundColor = originalStyles.backgroundColor;
      
      originalElementStyles.forEach(({ element, background, backgroundColor, color, borderColor, padding, paddingTop, height, minHeight, lineHeight, display, alignItems, justifyContent, textAlign, verticalAlign }) => {
        element.style.background = background;
        element.style.backgroundColor = backgroundColor;
        element.style.color = color;
        element.style.borderColor = borderColor;
        element.style.padding = padding;
        element.style.paddingTop = paddingTop;
        element.style.height = height;
        element.style.minHeight = minHeight;
        element.style.lineHeight = lineHeight;
        element.style.display = display;
        element.style.alignItems = alignItems;
        element.style.justifyContent = justifyContent;
        element.style.textAlign = textAlign;
        element.style.verticalAlign = verticalAlign;
      });
      
      const imgData = canvas.toDataURL('image/png');
      const pdf = new jsPDF('l', 'mm', 'a4'); // landscape A4
      const pdfWidth = pdf.internal.pageSize.getWidth();
      const pdfHeight = pdf.internal.pageSize.getHeight();
      
      // Adicionar cabeçalho
      pdf.setFontSize(16);
      pdf.setFont('helvetica', 'bold');
      pdf.text(`Boletim de Notas - ${selectedTurma?.nome || 'Turma'}`, pdfWidth / 2, 15, { align: 'center' });
      
      pdf.setFontSize(12);
      pdf.setFont('helvetica', 'normal');
      pdf.text(`Curso: ${infoTurma.curso}`, 15, 25);
      pdf.text(`Local: ${infoTurma.local}`, 15, 32);
      pdf.text(`Ano: ${selectedTurma?.ano || ''}`, pdfWidth - 15, 25, { align: 'right' });
      
      // Adicionar tabela com melhor proporção
      const imgWidth = canvas.width;
      const imgHeight = canvas.height;
      const ratio = Math.min((pdfWidth - 10) / imgWidth, (pdfHeight - 50) / imgHeight);
      const finalWidth = imgWidth * ratio;
      const finalHeight = imgHeight * ratio;
      const imgX = (pdfWidth - finalWidth) / 2;
      const imgY = 40;

      pdf.addImage(imgData, 'PNG', imgX, imgY, finalWidth, finalHeight);
      pdf.save(`boletim_${selectedTurma?.nome || 'turma'}.pdf`);
      
      toast.success("PDF gerado com sucesso!");
    } catch (error) {
      console.error("Erro ao gerar PDF:", error);
      toast.error("Erro ao gerar PDF");
    }
  };

  const gerarGraficoData = () => {
    if (alunos.length === 0 || disciplinas.length === 0) return null;

    const datasets = alunos.map((aluno, index) => {
      const hue = (index * 360) / alunos.length;
      return {
        label: aluno.nome_completo,
        data: disciplinas.map(d => getNota(aluno.id, d.id)),
        borderColor: `hsl(${hue}, 70%, 50%)`,
        backgroundColor: `hsl(${hue}, 70%, 50%, 0.1)`,
        tension: 0.4,
      };
    });

    return {
      labels: disciplinas.map(d => d.nome),
      datasets
    };
  };

  const calcularEstatisticas = () => {
    if (alunos.length === 0) return { mediaGeral: "0.00", alunosRecuperacao: 0 };

    let somaMedias = 0;
    let recuperacao = 0;

    alunos.forEach(aluno => {
      const media = parseFloat(calcularMedia(aluno.id));
      somaMedias += media;
      if (media < 10) recuperacao++;
    });

    return {
      mediaGeral: (somaMedias / alunos.length).toFixed(2),
      alunosRecuperacao: recuperacao
    };
  };

  const stats = calcularEstatisticas();
  const graficoData = gerarGraficoData();

  return (
    <div className="p-6 space-y-6 relative">
      {logoMarcaDagua && (
        <div 
          className="fixed inset-0 pointer-events-none opacity-5 z-0"
          style={{
            backgroundImage: `url(${logoMarcaDagua})`,
            backgroundRepeat: 'repeat',
            backgroundSize: '150px auto',
            transform: 'rotate(-45deg)',
          }}
        />
      )}

      <div className="relative z-10 space-y-6">
        <div className="flex items-center justify-between">
          <h1 className="text-3xl font-bold bg-gradient-to-r from-blue-600 to-cyan-500 bg-clip-text text-transparent">
            🎓 {t("grades") || "Mapa de Notas Futurista"}
          </h1>
          <div className="flex gap-2">
            <Label htmlFor="logo-upload" className="cursor-pointer">
              <Button variant="outline" size="sm" asChild>
                <span>
                  <Upload className="w-4 h-4 mr-2" />
                  Logo Marca D'água
                </span>
              </Button>
            </Label>
            <Input
              id="logo-upload"
              type="file"
              accept="image/*"
              onChange={handleLogoUpload}
              className="hidden"
            />
          </div>
        </div>

        <Card className="shadow-lg border-l-4 border-l-blue-500">
          <CardContent className="p-6 space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
              <div className="space-y-2">
                <Label>Selecionar Turma</Label>
                <Select 
                  value={selectedTurma?.id || ""} 
                  onValueChange={(value) => {
                    const turma = turmas.find(t => t.id === value);
                    setSelectedTurma(turma || null);
                  }}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Escolha uma turma" />
                  </SelectTrigger>
                  <SelectContent>
                    {turmas.map((turma) => (
                      <SelectItem key={turma.id} value={turma.id}>
                        {turma.nome} - {turma.ano}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              {selectedTurma && (
                <>
                  <div className="space-y-2">
                    <Label>Curso</Label>
                    <Input
                      value={infoTurma.curso}
                      onChange={(e) => setInfoTurma({ ...infoTurma, curso: e.target.value })}
                      placeholder="Nome do curso"
                      className="transition-all focus:border-blue-500 focus:ring-2 focus:ring-blue-200"
                    />
                  </div>

                  <div className="space-y-2">
                    <Label>Nome da Turma</Label>
                    <Input
                      value={infoTurma.nome}
                      onChange={(e) => setInfoTurma({ ...infoTurma, nome: e.target.value })}
                      placeholder="Nome"
                      className="transition-all focus:border-blue-500 focus:ring-2 focus:ring-blue-200"
                    />
                  </div>

                  <div className="space-y-2">
                    <Label>Local</Label>
                    <Input
                      value={infoTurma.local}
                      onChange={(e) => setInfoTurma({ ...infoTurma, local: e.target.value })}
                      placeholder="Local do curso"
                      className="transition-all focus:border-blue-500 focus:ring-2 focus:ring-blue-200"
                    />
                  </div>
                </>
              )}
            </div>

            <div className="flex gap-2">
              <div className="flex-1 space-y-2">
                <Label>Adicionar Disciplina</Label>
                <div className="flex gap-2">
                  <Input
                    value={novaDisciplina}
                    onChange={(e) => setNovaDisciplina(e.target.value)}
                    placeholder="Nome da disciplina"
                    onKeyPress={(e) => e.key === 'Enter' && adicionarDisciplina()}
                    className="transition-all focus:border-blue-500 focus:ring-2 focus:ring-blue-200"
                  />
                  <Button onClick={adicionarDisciplina} size="sm">
                    <Plus className="w-4 h-4 mr-1" />
                    Adicionar
                  </Button>
                </div>
              </div>

              {selectedTurma && alunos.length > 0 && (
                <Button onClick={gerarBoletimPDF} variant="default" className="self-end">
                  <FileDown className="w-4 h-4 mr-2" />
                  Gerar Boletim PDF
                </Button>
              )}
            </div>
          </CardContent>
        </Card>

        {selectedTurma && alunos.length > 0 && (
          <>
            <Card className="shadow-lg" ref={tableRef}>
              <CardHeader className="bg-gradient-to-r from-blue-50 to-cyan-50 dark:from-blue-950 dark:to-cyan-950">
                <CardTitle className="text-center">
                  Mapa de Notas - {infoTurma.nome || selectedTurma.nome}
                  <p className="text-sm font-normal text-muted-foreground mt-1">
                    {infoTurma.curso} • {infoTurma.local}
                  </p>
                </CardTitle>
              </CardHeader>
              <CardContent className="p-6">
                <div className="overflow-x-auto">
                  <Table>
                    <TableHeader>
                      <TableRow className="bg-gradient-to-r from-blue-100 to-cyan-100 dark:from-blue-900 dark:to-cyan-900">
                        <TableHead className="min-w-[200px] font-bold">Aluno</TableHead>
                        {disciplinas.map((disc) => (
                          <TableHead key={disc.id} className="text-center min-w-[100px] font-bold">
                            <div className="flex items-center justify-center gap-2">
                              <span>{disc.nome}</span>
                              <Button
                                variant="ghost"
                                size="sm"
                                onClick={() => removerDisciplina(disc.id)}
                                className="h-6 w-6 p-0 hover:bg-red-100 hover:text-red-600"
                              >
                                <X className="h-4 w-4" />
                              </Button>
                            </div>
                          </TableHead>
                        ))}
                        <TableHead className="text-center font-bold min-w-[100px]">Média</TableHead>
                      </TableRow>
                    </TableHeader>
                     <TableBody>
                       {alunos
                         .map((aluno) => ({
                           aluno,
                           media: parseFloat(calcularMedia(aluno.id))
                         }))
                         .sort((a, b) => b.media - a.media) // Ordenar da maior para menor média
                         .map(({ aluno, media }, index) => {
                         const isRecuperacao = media < 10;
                        
                        const disciplinasAbaixo10 = notas.filter(n => n.aluno_id === aluno.id && n.nota > 0 && n.nota < 10).length;
                        
                        return (
                           <TableRow 
                            key={aluno.id} 
                            className={`
                              ${index % 2 === 0 ? 'bg-white dark:bg-gray-950' : 'bg-gray-50 dark:bg-gray-900'}
                              ${isRecuperacao ? 'border-l-4 border-l-red-500' : ''}
                              ${disciplinasAbaixo10 > 0 && disciplinasAbaixo10 < 3 ? 'border-l-4 border-l-yellow-500' : ''}
                              hover:bg-cyan-50 dark:hover:bg-cyan-950 transition-colors
                            `}
                          >
                            <TableCell className="font-medium">
                              {aluno.nome_completo}
                              {disciplinasAbaixo10 > 0 && (
                                <span className="ml-2 text-xs px-2 py-1 rounded bg-yellow-200 dark:bg-yellow-800 text-yellow-900 dark:text-yellow-100">
                                  {disciplinasAbaixo10} disc. &lt; 10
                                </span>
                              )}
                            </TableCell>
                            {disciplinas.map((disc) => {
                              const nota = getNota(aluno.id, disc.id);
                              const notaRec = getNotaRecuperacao(aluno.id, disc.id);
                              const precisaRecuperacao = nota < 10;
                              
                              return (
                                   <TableCell key={disc.id} className="text-center p-2">
                                   <div className="flex flex-col gap-1">
                                     <Input
                                       type="number"
                                       min="0"
                                       max="20"
                                       step="0.1"
                                       value={nota || ""}
                                       onChange={(e) => atualizarNota(aluno.id, disc.id, e.target.value)}
                                       className={`w-20 text-center font-semibold border-2 ${getNotaColor(nota)} transition-all focus:scale-105`}
                                     />
                                      {precisaRecuperacao && nota > 0 && (
                                        <div className="space-y-1">
                                          <div className="text-xs text-red-600 dark:text-red-400 font-semibold">
                                            Recuperação
                                          </div>
                                          <Input
                                            type="number"
                                            min="0"
                                            max="20"
                                            step="0.1"
                                            value={notaRec || ""}
                                            onChange={(e) => atualizarNotaRecuperacao(aluno.id, disc.id, e.target.value)}
                                            placeholder="Rec."
                                            className="w-20 text-center text-sm bg-yellow-50 dark:bg-yellow-950/20 border-yellow-400 animate-pulse"
                                          />
                                        </div>
                                      )}
                                   </div>
                                 </TableCell>
                              );
                            })}
                            <TableCell className={`text-center font-bold text-lg ${isRecuperacao ? 'text-red-600' : 'text-green-600'}`}>
                              {calcularMedia(aluno.id)}
                            </TableCell>
                          </TableRow>
                        );
                      })}
                    </TableBody>
                  </Table>
                </div>
              </CardContent>
            </Card>

            {graficoData && (
              <Card className="shadow-lg">
                <CardHeader className="bg-gradient-to-r from-purple-50 to-pink-50 dark:from-purple-950 dark:to-pink-950">
                  <CardTitle className="flex items-center gap-2">
                    <TrendingUp className="w-5 h-5" />
                    Gráfico de Desempenho por Disciplina
                  </CardTitle>
                </CardHeader>
                <CardContent className="p-6">
                  <Line 
                    data={graficoData} 
                    options={{
                      responsive: true,
                      plugins: {
                        legend: {
                          position: 'bottom',
                        },
                      },
                       scales: {
                         y: {
                           min: 0,
                           max: 20,
                           ticks: {
                             stepSize: 2
                           }
                         }
                       }
                    }}
                  />
                </CardContent>
              </Card>
            )}

            <Card className="shadow-lg border-l-4 border-l-purple-500">
              <CardContent className="p-6">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="space-y-1">
                    <p className="text-sm text-muted-foreground">Média Geral da Turma</p>
                    <p className="text-3xl font-bold text-blue-600">{stats.mediaGeral}</p>
                  </div>
                   <div className="space-y-1">
                     <p className="text-sm text-muted-foreground">Alunos em Recuperação (&lt; 10.0)</p>
                     <p className={`text-3xl font-bold ${stats.alunosRecuperacao > 0 ? 'text-red-600' : 'text-green-600'}`}>
                       {stats.alunosRecuperacao}
                     </p>
                   </div>
                </div>
              </CardContent>
            </Card>
          </>
        )}

        {selectedTurma && alunos.length === 0 && (
          <Card className="shadow-lg">
            <CardContent className="p-12">
              <p className="text-center text-muted-foreground text-lg">
                Nenhum aluno cadastrado nesta turma
              </p>
            </CardContent>
          </Card>
        )}

        {!selectedTurma && (
          <Card className="shadow-lg border-2 border-dashed">
            <CardContent className="p-12">
              <p className="text-center text-muted-foreground text-lg">
                Selecione uma turma para começar
              </p>
            </CardContent>
          </Card>
        )}
      </div>

      <PermissionBlockModal
        open={blockModal.open}
        onClose={() => setBlockModal({ open: false, message: "" })}
        message={blockModal.message}
      />
    </div>
  );
}
