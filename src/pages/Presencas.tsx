import { useState, useEffect, useRef } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { Calendar, Download, Check, X, Share2 } from "lucide-react";
import { format, addDays, startOfWeek, endOfWeek, isWeekend } from "date-fns";
import { ptBR } from "date-fns/locale";
import jsPDF from "jspdf";
import html2canvas from "html2canvas";
import { useUserRole } from "@/hooks/useUserRole";
import { playBlockSound } from "@/lib/blockSound";
import { PermissionBlockModal } from "@/components/PermissionBlockModal";

interface Turma {
  id: string;
  nome: string;
  ano: number;
}

interface Aluno {
  id: string;
  nome_completo: string;
  graduacao: string;
}

interface Presenca {
  aluno_id: string;
  data: string;
  presente: boolean;
  observacao?: string;
}

export default function Presencas() {
  const { isVisualizador } = useUserRole();
  const [turmas, setTurmas] = useState<Turma[]>([]);
  const [selectedTurma, setSelectedTurma] = useState<Turma | null>(null);
  const [alunos, setAlunos] = useState<Aluno[]>([]);
  const [presencas, setPresencas] = useState<Presenca[]>([]);
  const [weekStart, setWeekStart] = useState<Date>(startOfWeek(new Date(), { locale: ptBR }));
  const [blockModal, setBlockModal] = useState({ open: false, message: "" });
  const tableRef = useRef<HTMLDivElement>(null);

  // Gerar datas da semana (apenas dias úteis - segunda a sexta)
  const weekDates = Array.from({ length: 7 }, (_, i) => addDays(weekStart, i)).filter(
    (date) => !isWeekend(date)
  );

  useEffect(() => {
    fetchTurmas();
  }, []);

  useEffect(() => {
    if (selectedTurma) {
      fetchAlunosDaTurma();
      fetchPresencas();
    }
  }, [selectedTurma, weekStart]);

  const fetchTurmas = async () => {
    const { data, error } = await supabase
      .from("turmas")
      .select("id, nome, ano")
      .order("ano", { ascending: false });

    if (error) {
      toast.error("Erro ao carregar turmas");
      return;
    }
    setTurmas(data || []);
  };

  const fetchAlunosDaTurma = async () => {
    if (!selectedTurma) return;

    const { data, error } = await supabase
      .from("aluno_turma")
      .select("aluno_id, alunos(id, nome_completo, graduacao)")
      .eq("turma_id", selectedTurma.id);

    if (error) {
      toast.error("Erro ao carregar alunos");
      return;
    }

    const alunosData = data?.map((item: any) => ({
      id: item.alunos.id,
      nome_completo: item.alunos.nome_completo,
      graduacao: item.alunos.graduacao,
    })) || [];

    setAlunos(alunosData);
  };

  const fetchPresencas = async () => {
    if (!selectedTurma) return;

    const startDate = format(weekStart, "yyyy-MM-dd");
    const endDate = format(endOfWeek(weekStart, { locale: ptBR }), "yyyy-MM-dd");

    const { data, error } = await supabase
      .from("presencas")
      .select("aluno_id, data, presente, observacao")
      .eq("turma_id", selectedTurma.id)
      .gte("data", startDate)
      .lte("data", endDate);

    if (error) {
      toast.error("Erro ao carregar presenças");
      return;
    }

    setPresencas(data || []);
  };

  const togglePresenca = async (alunoId: string, data: Date) => {
    if (isVisualizador) {
      playBlockSound();
      setBlockModal({ 
        open: true, 
        message: "Você não pode modificar presenças. Apenas coordenadores têm essa permissão." 
      });
      return;
    }

    if (!selectedTurma) return;

    const { data: userData } = await supabase.auth.getUser();
    if (!userData.user) return;

    const dataStr = format(data, "yyyy-MM-dd");
    const presencaExistente = presencas.find(
      (p) => p.aluno_id === alunoId && p.data === dataStr
    );

    try {
      if (presencaExistente) {
        // Atualizar presença existente
        const { error } = await supabase
          .from("presencas")
          .update({ presente: !presencaExistente.presente })
          .eq("turma_id", selectedTurma.id)
          .eq("aluno_id", alunoId)
          .eq("data", dataStr);

        if (error) throw error;
      } else {
        // Criar nova presença
        const { error } = await supabase
          .from("presencas")
          .insert({
            turma_id: selectedTurma.id,
            aluno_id: alunoId,
            data: dataStr,
            presente: true,
            user_id: userData.user.id,
          });

        if (error) throw error;
      }

      await fetchPresencas();
    } catch (error) {
      console.error("Erro ao registrar presença:", error);
      toast.error("Erro ao registrar presença");
    }
  };

  const getPresenca = (alunoId: string, data: Date): boolean | null => {
    const dataStr = format(data, "yyyy-MM-dd");
    const presenca = presencas.find(
      (p) => p.aluno_id === alunoId && p.data === dataStr
    );
    return presenca ? presenca.presente : null;
  };

  const calcularEstatisticas = () => {
    const totalDias = weekDates.length;
    const estatisticas = alunos.map(aluno => {
      let presentes = 0;
      let ausentes = 0;
      
      weekDates.forEach(data => {
        const presente = getPresenca(aluno.id, data);
        if (presente === true) presentes++;
        if (presente === false) ausentes++;
      });

      const percentual = totalDias > 0 ? ((presentes / totalDias) * 100).toFixed(1) : "0.0";
      
      return {
        alunoId: aluno.id,
        presentes,
        ausentes,
        percentual,
      };
    });

    return estatisticas;
  };

  const nextWeek = () => {
    setWeekStart(addDays(weekStart, 7));
  };

  const previousWeek = () => {
    setWeekStart(addDays(weekStart, -7));
  };

  const currentWeek = () => {
    setWeekStart(startOfWeek(new Date(), { locale: ptBR }));
  };

  const exportarPresencas = async (saveLocation: 'download' | 'whatsapp' = 'download') => {
    if (!tableRef.current || !selectedTurma) return;

    toast.info("Gerando PDF...");

    try {
      // Aplicar estilos temporários para PDF
      const allElements = tableRef.current.querySelectorAll('*');
      const originalStyles: {
        element: HTMLElement;
        background: string;
        backgroundColor: string;
        color: string;
        border: string;
      }[] = [];

      allElements.forEach((el) => {
        const htmlEl = el as HTMLElement;
        originalStyles.push({
          element: htmlEl,
          background: htmlEl.style.background,
          backgroundColor: htmlEl.style.backgroundColor,
          color: htmlEl.style.color,
          border: htmlEl.style.border,
        });

        // Forçar fundo branco e texto preto
        htmlEl.style.background = '#ffffff';
        htmlEl.style.backgroundColor = '#ffffff';
        if (htmlEl.textContent && htmlEl.textContent.trim()) {
          htmlEl.style.color = '#000000';
        }

        // Manter bordas visíveis
        if (htmlEl.tagName === 'TD' || htmlEl.tagName === 'TH') {
          htmlEl.style.border = '1px solid #cccccc';
        }
      });

      const canvas = await html2canvas(tableRef.current, {
        scale: 2,
        backgroundColor: "#ffffff",
        logging: false,
        useCORS: true,
      });

      // Restaurar estilos originais
      originalStyles.forEach(({ element, background, backgroundColor, color, border }) => {
        element.style.background = background;
        element.style.backgroundColor = backgroundColor;
        element.style.color = color;
        element.style.border = border;
      });

      const imgData = canvas.toDataURL("image/png");
      const pdf = new jsPDF("l", "mm", "a4");
      const pageWidth = pdf.internal.pageSize.getWidth();
      const pageHeight = pdf.internal.pageSize.getHeight();

      // Cabeçalho
      pdf.setFontSize(16);
      pdf.setFont("helvetica", "bold");
      pdf.text(`MAPA DE PRESENÇA - ${selectedTurma.nome}`, pageWidth / 2, 15, { align: "center" });

      pdf.setFontSize(12);
      pdf.setFont("helvetica", "normal");
      const firstDay = weekDates[0];
      const lastDay = weekDates[weekDates.length - 1];
      const periodoStr = `${format(firstDay, "dd/MM/yyyy", { locale: ptBR })} a ${format(
        lastDay,
        "dd/MM/yyyy",
        { locale: ptBR }
      )}`;
      pdf.text(`Período: ${periodoStr}`, pageWidth / 2, 22, { align: "center" });

      // Adicionar tabela
      const imgWidth = pageWidth - 20;
      const imgHeight = (canvas.height * imgWidth) / canvas.width;
      pdf.addImage(imgData, "PNG", 10, 30, imgWidth, Math.min(imgHeight, pageHeight - 40));

      const fileName = `presenca_${selectedTurma.nome.replace(/\s+/g, '_')}_${format(weekStart, "yyyy-MM-dd")}.pdf`;

      if (saveLocation === 'whatsapp') {
        const pdfBlob = pdf.output('blob');
        const file = new File([pdfBlob], fileName, { type: 'application/pdf' });
        
        if (navigator.share) {
          try {
            if (navigator.canShare && navigator.canShare({ files: [file] })) {
              await navigator.share({
                files: [file],
                title: 'Mapa de Presença',
                text: `Mapa de presença - ${selectedTurma.nome}`,
              });
              toast.success("Mapa compartilhado!");
            } else {
              pdf.save(fileName);
              toast.info("Arquivo salvo. Você pode compartilhá-lo manualmente pelo WhatsApp.");
            }
          } catch (err: any) {
            if (err.name === 'AbortError') return;
            pdf.save(fileName);
            toast.info("Arquivo salvo. Você pode compartilhá-lo manualmente.");
          }
        } else {
          pdf.save(fileName);
          toast.info("Compartilhamento não disponível neste navegador. Arquivo baixado para compartilhamento manual.");
        }
      } else {
        pdf.save(fileName);
        toast.success("PDF baixado com sucesso!");
      }
    } catch (error) {
      console.error("Erro ao gerar PDF:", error);
      toast.error("Erro ao gerar PDF");
    }
  };

  const estatisticas = calcularEstatisticas();

  return (
    <div className="p-6 space-y-6">
      <PermissionBlockModal
        open={blockModal.open}
        message={blockModal.message}
        onClose={() => setBlockModal({ open: false, message: "" })}
      />

      <div className="flex items-center justify-between">
        <h1 className="text-3xl font-bold">📋 Mapa de Presença</h1>
      </div>

      <Card>
        <CardContent className="p-6 space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="text-sm font-medium mb-2 block">Selecione a Turma</label>
              <Select
                value={selectedTurma?.id || ""}
                onValueChange={(value) => {
                  const turma = turmas.find((t) => t.id === value);
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

            <div className="flex items-end gap-2">
              <Button onClick={previousWeek} variant="outline" size="sm">
                ← Semana Anterior
              </Button>
              <Button onClick={currentWeek} variant="outline" size="sm">
                Semana Atual
              </Button>
              <Button onClick={nextWeek} variant="outline" size="sm">
                Próxima Semana →
              </Button>
            </div>
          </div>

          {selectedTurma && alunos.length > 0 && (
            <div className="flex gap-2">
              <Button onClick={() => exportarPresencas('download')} className="gap-2">
                <Download className="h-4 w-4" />
                Salvar no Computador
              </Button>
              <Button onClick={() => exportarPresencas('whatsapp')} variant="outline" className="gap-2">
                <Share2 className="h-4 w-4" />
                Compartilhar WhatsApp
              </Button>
            </div>
          )}
        </CardContent>
      </Card>

      {selectedTurma && alunos.length > 0 && (
        <Card ref={tableRef}>
          <CardHeader className="bg-gradient-to-r from-blue-50 to-cyan-50 dark:from-blue-950 dark:to-cyan-950">
            <CardTitle className="text-center">
              Mapa de Presença - {selectedTurma.nome}
              <p className="text-sm font-normal text-muted-foreground mt-1">
                {weekDates.length > 0 && (
                  <>
                    {format(weekDates[0], "dd/MM/yyyy", { locale: ptBR })} a{" "}
                    {format(weekDates[weekDates.length - 1], "dd/MM/yyyy", { locale: ptBR })}
                  </>
                )}
              </p>
            </CardTitle>
          </CardHeader>
          <CardContent className="p-6">
            <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead className="min-w-[200px]">Aluno</TableHead>
                    {weekDates.map((data) => (
                      <TableHead key={data.toISOString()} className="text-center min-w-[100px]">
                        <div className="flex flex-col">
                          <span className="text-xs">{format(data, "EEE", { locale: ptBR })}</span>
                          <span className="font-bold">{format(data, "dd/MM")}</span>
                        </div>
                      </TableHead>
                    ))}
                    <TableHead className="text-center">Presenças</TableHead>
                    <TableHead className="text-center">Faltas</TableHead>
                    <TableHead className="text-center">%</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {alunos.map((aluno) => {
                    const stats = estatisticas.find((s) => s.alunoId === aluno.id);
                    return (
                      <TableRow key={aluno.id}>
                        <TableCell>
                          <div>
                            <p className="font-medium">{aluno.nome_completo}</p>
                            <p className="text-xs text-muted-foreground">{aluno.graduacao}</p>
                          </div>
                        </TableCell>
                        {weekDates.map((data) => {
                          const presente = getPresenca(aluno.id, data);
                          return (
                            <TableCell key={data.toISOString()} className="text-center">
                              <Button
                                variant="ghost"
                                size="sm"
                                onClick={() => togglePresenca(aluno.id, data)}
                                className={`w-12 h-12 ${
                                  presente === true
                                    ? "bg-green-100 hover:bg-green-200 text-green-700"
                                    : presente === false
                                    ? "bg-red-100 hover:bg-red-200 text-red-700"
                                    : "bg-gray-100 hover:bg-gray-200"
                                }`}
                              >
                                {presente === true ? (
                                  <Check className="h-5 w-5" />
                                ) : presente === false ? (
                                  <X className="h-5 w-5" />
                                ) : (
                                  "-"
                                )}
                              </Button>
                            </TableCell>
                          );
                        })}
                        <TableCell className="text-center font-semibold text-green-600">
                          {stats?.presentes || 0}
                        </TableCell>
                        <TableCell className="text-center font-semibold text-red-600">
                          {stats?.ausentes || 0}
                        </TableCell>
                        <TableCell className="text-center font-bold">
                          {stats?.percentual}%
                        </TableCell>
                      </TableRow>
                    );
                  })}
                </TableBody>
              </Table>
            </div>
          </CardContent>
        </Card>
      )}

      {selectedTurma && alunos.length === 0 && (
        <Card>
          <CardContent className="p-12 text-center text-muted-foreground">
            <Calendar className="h-12 w-12 mx-auto mb-4 opacity-50" />
            <p>Nenhum aluno cadastrado nesta turma.</p>
          </CardContent>
        </Card>
      )}

      {!selectedTurma && (
        <Card>
          <CardContent className="p-12 text-center text-muted-foreground">
            <Calendar className="h-12 w-12 mx-auto mb-4 opacity-50" />
            <p>Selecione uma turma para visualizar o mapa de presença.</p>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
