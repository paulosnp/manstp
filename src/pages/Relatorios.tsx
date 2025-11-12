import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { supabase } from "@/integrations/supabase/client";
import { useState, useEffect, useRef } from "react";
import { useToast } from "@/hooks/use-toast";
import jsPDF from "jspdf";
import { FileText, Download, Printer, Share2 } from "lucide-react";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import UltraChart from "@/components/UltraChart";
import html2canvas from "html2canvas";

interface Aluno {
  id: string;
  nome_completo: string;
  graduacao: string;
  matricula: number;
}

interface Turma {
  id: string;
  nome: string;
  ano: number;
  situacao: string;
  data_inicio?: string;
  data_fim?: string;
  tipo_militar: string;
}

const Relatorios = () => {
  const [turmas, setTurmas] = useState<Turma[]>([]);
  const [selectedTurmaId, setSelectedTurmaId] = useState<string>("");
  const [selectedTurma, setSelectedTurma] = useState<Turma | null>(null);
  const [alunosTurma, setAlunosTurma] = useState<Aluno[]>([]);
  const chartRef = useRef<HTMLDivElement>(null);
  const { toast } = useToast();

  useEffect(() => {
    fetchTurmas();
  }, []);

  useEffect(() => {
    if (selectedTurmaId) {
      fetchTurmaDetails();
      fetchAlunosTurma();
    }
  }, [selectedTurmaId]);

  const fetchTurmas = async () => {
    try {
      const { data, error } = await supabase
        .from("turmas")
        .select("*")
        .order("ano", { ascending: false });

      if (error) throw error;
      setTurmas(data || []);
    } catch (error) {
      console.error("Erro ao buscar turmas:", error);
      toast({
        title: "Erro",
        description: "Não foi possível carregar as turmas.",
        variant: "destructive",
      });
    }
  };

  const fetchTurmaDetails = async () => {
    try {
      const { data, error } = await supabase
        .from("turmas")
        .select("*")
        .eq("id", selectedTurmaId)
        .single();

      if (error) throw error;
      setSelectedTurma(data);
    } catch (error) {
      console.error("Erro ao buscar detalhes da turma:", error);
    }
  };

  const fetchAlunosTurma = async () => {
    try {
      const { data: alunoTurmaData, error: alunoTurmaError } = await supabase
        .from("aluno_turma")
        .select("aluno_id")
        .eq("turma_id", selectedTurmaId);

      if (alunoTurmaError) throw alunoTurmaError;

      const alunoIds = alunoTurmaData?.map((at) => at.aluno_id) || [];

      if (alunoIds.length === 0) {
        setAlunosTurma([]);
        return;
      }

      const { data: alunosData, error: alunosError } = await supabase
        .from("alunos")
        .select("*")
        .in("id", alunoIds)
        .order("nome_completo");

      if (alunosError) throw alunosError;
      setAlunosTurma(alunosData || []);
    } catch (error) {
      console.error("Erro ao buscar alunos da turma:", error);
      toast({
        title: "Erro",
        description: "Não foi possível carregar os alunos da turma.",
        variant: "destructive",
      });
    }
  };

  const exportTurmaReport = async (saveLocation: 'download' | 'whatsapp' = 'download') => {
    if (!selectedTurma || alunosTurma.length === 0) {
      toast({
        title: "Aviso",
        description: "Selecione uma turma com alunos cadastrados.",
        variant: "destructive",
      });
      return;
    }

    try {
      // Buscar dados atualizados da turma antes de exportar
      const { data: turmaAtualizada, error: turmaError } = await supabase
        .from("turmas")
        .select("*")
        .eq("id", selectedTurmaId)
        .single();

      if (turmaError) throw turmaError;

      const pdf = new jsPDF();
      const pageWidth = pdf.internal.pageSize.getWidth();
      let yPos = 20;

      // Título
      pdf.setFontSize(18);
      pdf.setFont("helvetica", "bold");
      pdf.text("RELATÓRIO DE TURMA", pageWidth / 2, yPos, { align: "center" });
      yPos += 15;

      // Informações da Turma
      pdf.setFontSize(14);
      pdf.text(`Turma: ${turmaAtualizada.nome}`, 20, yPos);
      yPos += 8;
      
      pdf.setFontSize(12);
      pdf.setFont("helvetica", "normal");
      pdf.text(`Ano: ${turmaAtualizada.ano}`, 20, yPos);
      yPos += 6;
      pdf.text(`Situação: ${turmaAtualizada.situacao}`, 20, yPos);
      yPos += 6;
      pdf.text(`Tipo Militar: ${turmaAtualizada.tipo_militar}`, 20, yPos);
      yPos += 6;
      
      if (turmaAtualizada.data_inicio) {
        pdf.text(`Data Início: ${new Date(turmaAtualizada.data_inicio).toLocaleDateString('pt-BR')}`, 20, yPos);
        yPos += 6;
      }
      
      if (turmaAtualizada.data_fim) {
        pdf.text(`Data Fim: ${new Date(turmaAtualizada.data_fim).toLocaleDateString('pt-BR')}`, 20, yPos);
        yPos += 6;
      }

      yPos += 10;

      // Lista de Alunos
      pdf.setFontSize(14);
      pdf.setFont("helvetica", "bold");
      pdf.text(`Total de Alunos: ${alunosTurma.length}`, 20, yPos);
      yPos += 10;

      pdf.setFontSize(11);
      pdf.text("Nome Completo", 20, yPos);
      pdf.text("Graduação", 140, yPos);
      yPos += 8;

      pdf.setLineWidth(0.5);
      pdf.line(20, yPos, pageWidth - 20, yPos);
      yPos += 8;

      // Listar alunos
      pdf.setFont("helvetica", "normal");
      pdf.setFontSize(10);

      alunosTurma.forEach((aluno, index) => {
        if (yPos > 270) {
          pdf.addPage();
          yPos = 20;
        }

        pdf.text(`${index + 1}. ${aluno.nome_completo}`, 20, yPos);
        pdf.text(aluno.graduacao, 140, yPos);
        yPos += 7;
      });

      // Rodapé
      const totalPages = pdf.getNumberOfPages();
      for (let i = 1; i <= totalPages; i++) {
        pdf.setPage(i);
        pdf.setFontSize(8);
        pdf.text(
          `Página ${i} de ${totalPages}`,
          pageWidth / 2,
          pdf.internal.pageSize.getHeight() - 10,
          { align: "center" }
        );
      }

      const fileName = `relatorio_turma_${turmaAtualizada.nome.replace(/\s+/g, '_')}.pdf`;

      if (saveLocation === 'whatsapp') {
        // Converter para blob e compartilhar via WhatsApp
        const pdfBlob = pdf.output('blob');
        const file = new File([pdfBlob], fileName, { type: 'application/pdf' });
        
        if (navigator.share && navigator.canShare && navigator.canShare({ files: [file] })) {
          await navigator.share({
            files: [file],
            title: 'Relatório de Turma',
            text: `Relatório da turma ${turmaAtualizada.nome}`,
          });
          toast({
            title: "Sucesso",
            description: "Relatório compartilhado!",
          });
        } else {
          toast({
            title: "Não suportado",
            description: "Compartilhamento não disponível neste navegador. Fazendo download...",
            variant: "destructive",
          });
          pdf.save(fileName);
        }
      } else {
        // Salvar com File System Access API ou download normal
        if ('showSaveFilePicker' in window) {
          try {
            const handle = await (window as any).showSaveFilePicker({
              suggestedName: fileName,
              types: [{
                description: 'PDF',
                accept: { 'application/pdf': ['.pdf'] },
              }],
            });
            const writable = await handle.createWritable();
            const pdfBlob = pdf.output('blob');
            await writable.write(pdfBlob);
            await writable.close();
            toast({
              title: "Sucesso",
              description: "Relatório salvo com sucesso!",
            });
          } catch (err: any) {
            if (err.name !== 'AbortError') {
              console.error('Erro ao salvar:', err);
              pdf.save(fileName);
            }
          }
        } else {
          pdf.save(fileName);
          toast({
            title: "Sucesso",
            description: "Relatório da turma gerado com sucesso!",
          });
        }
      }
    } catch (error) {
      console.error("Erro ao gerar relatório:", error);
      toast({
        title: "Erro",
        description: "Não foi possível gerar o relatório da turma.",
        variant: "destructive",
      });
    }
  };

  const exportChartReport = async (saveLocation: 'download' | 'whatsapp' = 'download') => {
    if (!chartRef.current) return;

    try {
      const canvas = await html2canvas(chartRef.current, {
        scale: 2,
        backgroundColor: "#ffffff",
      });

      const imgData = canvas.toDataURL("image/png");
      const pdf = new jsPDF("landscape");
      const pageWidth = pdf.internal.pageSize.getWidth();
      const pageHeight = pdf.internal.pageSize.getHeight();

      // Título
      pdf.setFontSize(16);
      pdf.setFont("helvetica", "bold");
      pdf.text("RELATÓRIO DE ESTATÍSTICAS - GRÁFICO DE INSCRIÇÕES", pageWidth / 2, 15, { align: "center" });

      // Adicionar gráfico
      const imgWidth = pageWidth - 40;
      const imgHeight = (canvas.height * imgWidth) / canvas.width;
      pdf.addImage(imgData, "PNG", 20, 25, imgWidth, Math.min(imgHeight, pageHeight - 80));

      // Explicação
      pdf.addPage();
      pdf.setFontSize(14);
      pdf.text("EXPLICAÇÃO DO GRÁFICO", 20, 20);
      
      pdf.setFontSize(11);
      pdf.setFont("helvetica", "normal");
      let yPos = 35;
      
      const explanation = [
        "Este gráfico apresenta a evolução das inscrições de alunos ao longo do tempo.",
        "",
        "Metodologia de Contagem:",
        "- O gráfico conta o total de INSCRIÇÕES (vínculos aluno-turma)",
        "- Cada vez que um aluno se inscreve em uma turma, é contado como uma inscrição",
        "- Um mesmo aluno pode aparecer múltiplas vezes se estiver inscrito em várias turmas",
        "",
        "Categorias:",
        "- Total: Todas as inscrições independente do tipo militar ou status",
        "- Marinheiro (Concluídos): Inscrições de alunos do tipo Marinheiro que concluíram",
        "- Fuzileiro (Concluídos): Inscrições de alunos do tipo Fuzileiro Naval que concluíram",
        "- Exército (Concluídos): Inscrições de alunos do tipo Exército que concluíram",
        "- Civil (Concluídos): Inscrições de alunos do tipo Civil que concluíram",
        "",
        "Interpretação:",
        "- Os valores mostram o crescimento cumulativo de inscrições por ano",
        "- A barra 'Total' inclui todas as inscrições (concluídas ou não)",
        "- As demais barras mostram apenas inscrições com status 'Concluído'",
        "- Permite visualizar tendências de matrícula e taxa de conclusão ao longo do tempo",
        "- Útil para planejamento de recursos e capacidade de turmas",
      ];

      explanation.forEach((line) => {
        if (line === "") {
          yPos += 5;
        } else if (line.startsWith("-")) {
          pdf.text(line, 30, yPos);
          yPos += 6;
        } else {
          pdf.setFont("helvetica", "bold");
          pdf.text(line, 20, yPos);
          pdf.setFont("helvetica", "normal");
          yPos += 8;
        }
      });

      const fileName = "relatorio_estatisticas_grafico.pdf";

      if (saveLocation === 'whatsapp') {
        // Converter para blob e compartilhar via WhatsApp
        const pdfBlob = pdf.output('blob');
        const file = new File([pdfBlob], fileName, { type: 'application/pdf' });
        
        if (navigator.share && navigator.canShare && navigator.canShare({ files: [file] })) {
          await navigator.share({
            files: [file],
            title: 'Relatório de Estatísticas',
            text: 'Relatório do gráfico de estatísticas de inscrições',
          });
          toast({
            title: "Sucesso",
            description: "Relatório compartilhado!",
          });
        } else {
          toast({
            title: "Não suportado",
            description: "Compartilhamento não disponível neste navegador. Fazendo download...",
            variant: "destructive",
          });
          pdf.save(fileName);
        }
      } else {
        // Salvar com File System Access API ou download normal
        if ('showSaveFilePicker' in window) {
          try {
            const handle = await (window as any).showSaveFilePicker({
              suggestedName: fileName,
              types: [{
                description: 'PDF',
                accept: { 'application/pdf': ['.pdf'] },
              }],
            });
            const writable = await handle.createWritable();
            const pdfBlob = pdf.output('blob');
            await writable.write(pdfBlob);
            await writable.close();
            toast({
              title: "Sucesso",
              description: "Relatório salvo com sucesso!",
            });
          } catch (err: any) {
            if (err.name !== 'AbortError') {
              console.error('Erro ao salvar:', err);
              pdf.save(fileName);
            }
          }
        } else {
          pdf.save(fileName);
          toast({
            title: "Sucesso",
            description: "Relatório do gráfico gerado com sucesso!",
          });
        }
      }
    } catch (error) {
      console.error("Erro ao gerar relatório do gráfico:", error);
      toast({
        title: "Erro",
        description: "Não foi possível gerar o relatório do gráfico.",
        variant: "destructive",
      });
    }
  };

  return (
    <div className="space-y-6">
      <h1 className="text-3xl font-bold">Relatórios</h1>

      {/* Relatório por Turma */}
      <Card>
        <CardHeader>
          <CardTitle>Relatório por Turma</CardTitle>
        </CardHeader>
        <CardContent className="space-y-6">
          <div className="flex gap-4 items-end">
            <div className="flex-1">
              <label className="text-sm font-medium mb-2 block">Selecione a Turma</label>
              <Select value={selectedTurmaId} onValueChange={setSelectedTurmaId}>
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
            <div className="flex gap-2">
              <Button
                onClick={() => exportTurmaReport('download')}
                disabled={!selectedTurmaId || alunosTurma.length === 0}
                className="gap-2"
              >
                <Download className="h-4 w-4" />
                Salvar no Computador
              </Button>
              <Button
                onClick={() => exportTurmaReport('whatsapp')}
                disabled={!selectedTurmaId || alunosTurma.length === 0}
                variant="outline"
                className="gap-2"
              >
                <Share2 className="h-4 w-4" />
                Compartilhar WhatsApp
              </Button>
            </div>
          </div>

          {selectedTurma && (
            <div className="border rounded-lg p-6 space-y-4">
              <div>
                <h3 className="text-xl font-bold mb-4">{selectedTurma.nome}</h3>
                <div className="grid grid-cols-2 gap-3 text-sm">
                  <div>
                    <span className="font-medium">Ano:</span> {selectedTurma.ano}
                  </div>
                  <div>
                    <span className="font-medium">Situação:</span>{" "}
                    <span className={`font-semibold ${
                      selectedTurma.situacao === "Em Andamento" ? "text-green-600" :
                      selectedTurma.situacao === "Concluída" ? "text-blue-600" :
                      "text-muted-foreground"
                    }`}>
                      {selectedTurma.situacao}
                    </span>
                  </div>
                  <div>
                    <span className="font-medium">Tipo Militar:</span> {selectedTurma.tipo_militar}
                  </div>
                  {selectedTurma.data_inicio && (
                    <div>
                      <span className="font-medium">Data Início:</span>{" "}
                      {new Date(selectedTurma.data_inicio).toLocaleDateString('pt-BR')}
                    </div>
                  )}
                  {selectedTurma.data_fim && (
                    <div>
                      <span className="font-medium">Data Fim:</span>{" "}
                      {new Date(selectedTurma.data_fim).toLocaleDateString('pt-BR')}
                    </div>
                  )}
                </div>
              </div>

              <div>
                <h4 className="font-semibold mb-3">Alunos Cadastrados ({alunosTurma.length})</h4>
                <div className="space-y-2 max-h-96 overflow-y-auto">
                  {alunosTurma.map((aluno, index) => (
                    <div
                      key={aluno.id}
                      className="flex items-center justify-between p-3 border rounded bg-muted/50"
                    >
                      <div className="flex items-center gap-3">
                        <span className="text-sm font-medium text-muted-foreground">
                          {index + 1}.
                        </span>
                        <div>
                          <p className="font-medium">{aluno.nome_completo}</p>
                          <p className="text-sm text-muted-foreground">{aluno.graduacao}</p>
                        </div>
                      </div>
                    </div>
                  ))}
                  {alunosTurma.length === 0 && (
                    <p className="text-center text-muted-foreground py-8">
                      Nenhum aluno cadastrado nesta turma.
                    </p>
                  )}
                </div>
              </div>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Relatório de Gráfico de Estatísticas */}
      <Card>
        <CardHeader>
          <CardTitle>Relatório de Gráfico de Estatísticas</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex justify-end gap-2">
            <Button onClick={() => exportChartReport('download')} className="gap-2">
              <Download className="h-4 w-4" />
              Salvar no Computador
            </Button>
            <Button onClick={() => exportChartReport('whatsapp')} variant="outline" className="gap-2">
              <Share2 className="h-4 w-4" />
              Compartilhar WhatsApp
            </Button>
          </div>
          
          <div ref={chartRef} className="border rounded-lg p-4 bg-background">
            <UltraChart />
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default Relatorios;
