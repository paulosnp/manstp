import { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Checkbox } from "@/components/ui/checkbox";
import { FileDown, FileSpreadsheet, User } from "lucide-react";
import { supabase } from "@/lib/supabase";
import { toast } from "sonner";
import jsPDF from "jspdf";
import html2canvas from "html2canvas";

export default function Relatorios() {
  const [cursos, setCursos] = useState<any[]>([]);
  const [turmas, setTurmas] = useState<any[]>([]);
  const [alunos, setAlunos] = useState<any[]>([]);
  const [selectedCurso, setSelectedCurso] = useState("");
  const [selectedTurma, setSelectedTurma] = useState("");
  const [selectedTipo, setSelectedTipo] = useState("");
  const [selectedAluno, setSelectedAluno] = useState("");
  const [incluirAlunos, setIncluirAlunos] = useState(true);
  const [incluirCursos, setIncluirCursos] = useState(true);
  const [incluirTurmas, setIncluirTurmas] = useState(true);
  const [statsData, setStatsData] = useState<any>(null);

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    const { data: cursosData } = await supabase.from("cursos").select("id, nome, coordenador").order("nome");
    const { data: turmasData } = await supabase.from("turmas").select("id, nome").order("nome");
    const { data: alunosData } = await supabase.from("alunos").select("id, nome_completo").order("nome_completo");
    if (cursosData) setCursos(cursosData);
    if (turmasData) setTurmas(turmasData);
    if (alunosData) setAlunos(alunosData);
    await fetchStats();
  };

  const fetchStats = async () => {
    const { data: alunosData } = await supabase.from("alunos").select("graduacao, tipo_militar");
    if (!alunosData) return;

    const graduacaoCounts = alunosData.reduce((acc: any, aluno) => {
      acc[aluno.graduacao] = (acc[aluno.graduacao] || 0) + 1;
      return acc;
    }, {});

    const tipoCounts = alunosData.reduce((acc: any, aluno) => {
      acc[aluno.tipo_militar] = (acc[aluno.tipo_militar] || 0) + 1;
      return acc;
    }, {});

    setStatsData({
      graduacaoData: Object.entries(graduacaoCounts).map(([name, value]) => ({ name, value })),
      tipoData: Object.entries(tipoCounts).map(([name, value]) => ({ name, value })),
    });
  };

  const fetchCursosStats = async () => {
    const { data: cursosData } = await supabase
      .from("cursos")
      .select("id, nome, instituicao, coordenador, ano:data_inicio, turmas(tipo_militar, aluno_turma(aluno_id, alunos(tipo_militar)))");
    
    if (!cursosData) return null;

    const statsByYear: any = {};
    
    cursosData.forEach((curso: any) => {
      const year = curso.ano ? new Date(curso.ano).getFullYear() : 'Sem data';
      if (!statsByYear[year]) {
        statsByYear[year] = {
          fuzileiros: 0,
          guardaCosteira: 0,
          ciaga: 0,
          ciaba: 0,
          total: 0
        };
      }

      curso.turmas?.forEach((turma: any) => {
        const alunosCount = turma.aluno_turma?.length || 0;
        statsByYear[year].total += alunosCount;

        turma.aluno_turma?.forEach((at: any) => {
          if (at.alunos?.tipo_militar === "Fuzileiro Naval") {
            statsByYear[year].fuzileiros += 1;
          } else if (at.alunos?.tipo_militar === "Guarda Costeiro") {
            statsByYear[year].guardaCosteira += 1;
          }
        });
      });

      if (curso.instituicao?.toLowerCase().includes('ciaga')) {
        statsByYear[year].ciaga += 1;
      } else if (curso.instituicao?.toLowerCase().includes('ciaba')) {
        statsByYear[year].ciaba += 1;
      }
    });

    return statsByYear;
  };

  const fetchStatusStats = async () => {
    const { data: statusData } = await supabase
      .from("aluno_turma")
      .select("status");
    
    if (!statusData) return null;

    const statusCounts = {
      cursando: 0,
      concluido: 0,
      reprovado: 0,
      desligado: 0,
      desertor: 0,
      total: 0
    };

    statusData.forEach((item: any) => {
      statusCounts.total += 1;
      const status = item.status?.toLowerCase() || 'cursando';
      if (status === 'cursando') statusCounts.cursando += 1;
      else if (status === 'concluído' || status === 'concluido') statusCounts.concluido += 1;
      else if (status === 'reprovado') statusCounts.reprovado += 1;
      else if (status === 'desligado') statusCounts.desligado += 1;
      else if (status === 'desertor') statusCounts.desertor += 1;
    });

    return statusCounts;
  };

  const exportToCSV = async () => {
    try {
      let data: any[] = [];
      let headers: string[] = [];

      // Adicionar estatísticas de status dos alunos
      const statusStats = await fetchStatusStats();
      if (statusStats) {
        data.push({
          Tipo: "Status dos Alunos",
          Cursando: statusStats.cursando,
          Concluído: statusStats.concluido,
          Reprovado: statusStats.reprovado,
          Desligado: statusStats.desligado,
          Desertor: statusStats.desertor,
          Total: statusStats.total
        });
      }

      // Adicionar estatísticas de cursos por ano
      const cursosStats = await fetchCursosStats();
      if (cursosStats) {
        const statsRows = Object.entries(cursosStats).map(([year, stats]: [string, any]) => ({
          Tipo: "Estatística por Ano",
          Ano: year,
          Fuzileiros: stats.fuzileiros,
          "Guarda Costeira": stats.guardaCosteira,
          CIAGA: stats.ciaga,
          CIABA: stats.ciaba,
          Total: stats.total
        }));
        data = [...data, ...statsRows];
      }

      if (incluirAlunos) {
        let query = supabase.from("alunos").select("*");
        if (selectedTipo && selectedTipo !== "all") query = query.eq("tipo_militar", selectedTipo as "Fuzileiro Naval" | "Guarda Costeiro");
        const { data: alunosData } = await query;
        if (alunosData && alunosData.length > 0) {
          data = [...data, ...alunosData];
        }
      }

      if (incluirCursos) {
        let query = supabase.from("cursos").select("nome, instituicao, coordenador, local_realizacao, tipo_curso, modalidade, data_inicio, data_fim, situacao, categoria");
        if (selectedCurso && selectedCurso !== "all") query = query.eq("id", selectedCurso);
        const { data: cursosData } = await query;
        if (cursosData) data = [...data, ...cursosData];
      }

      if (incluirTurmas) {
        let query = supabase.from("turmas").select("*");
        if (selectedTurma && selectedTurma !== "all") query = query.eq("id", selectedTurma);
        const { data: turmasData } = await query;
        if (turmasData) data = [...data, ...turmasData];
      }

      if (data.length === 0) {
        toast.error("Nenhum dado para exportar");
        return;
      }

      const csv = [
        Object.keys(data[0]).join(","),
        ...data.map((row) => Object.values(row).join(",")),
      ].join("\n");

      const blob = new Blob([csv], { type: "text/csv" });
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = `relatorio-${Date.now()}.csv`;
      a.click();
      toast.success("Relatório exportado com sucesso");
    } catch (error) {
      console.error("Erro ao exportar:", error);
      toast.error("Erro ao exportar relatório");
    }
  };

  const exportToPDF = async () => {
    try {
      const pdf = new jsPDF();
      const pageWidth = pdf.internal.pageSize.getWidth();
      let yPosition = 20;

      // Título
      pdf.setFontSize(18);
      pdf.text("Relatório do Sistema de Gestão", pageWidth / 2, yPosition, { align: "center" });
      yPosition += 15;

      // Data de geração
      pdf.setFontSize(10);
      pdf.text(`Gerado em: ${new Date().toLocaleDateString("pt-BR")} às ${new Date().toLocaleTimeString("pt-BR")}`, pageWidth / 2, yPosition, { align: "center" });
      yPosition += 15;

      // Status dos Alunos
      const statusStats = await fetchStatusStats();
      if (statusStats) {
        pdf.setFontSize(14);
        pdf.text("Status dos Alunos", 14, yPosition);
        yPosition += 10;

        // Criar gráfico de barras simples para status
        const barWidth = 25;
        const barSpacing = 35;
        const maxBarHeight = 40;
        const maxValue = Math.max(statusStats.concluido, statusStats.reprovado, statusStats.desligado, statusStats.desertor, statusStats.cursando);
        
        const statuses = [
          { label: 'Cursando', value: statusStats.cursando, color: [100, 150, 255] },
          { label: 'Concluído', value: statusStats.concluido, color: [50, 200, 100] },
          { label: 'Reprovado', value: statusStats.reprovado, color: [255, 100, 100] },
          { label: 'Desligado', value: statusStats.desligado, color: [255, 200, 50] },
          { label: 'Desertor', value: statusStats.desertor, color: [150, 150, 150] }
        ];

        statuses.forEach((status, index) => {
          const x = 14 + (index * barSpacing);
          const barHeight = maxValue > 0 ? (status.value / maxValue) * maxBarHeight : 0;
          const y = yPosition + maxBarHeight - barHeight;
          
          // Desenhar barra
          pdf.setFillColor(status.color[0], status.color[1], status.color[2]);
          pdf.rect(x, y, barWidth, barHeight, 'F');
          
          // Valor acima da barra
          pdf.setFontSize(8);
          pdf.text(status.value.toString(), x + barWidth / 2, y - 2, { align: 'center' });
          
          // Label abaixo
          pdf.setFontSize(7);
          const labelLines = pdf.splitTextToSize(status.label, barWidth);
          pdf.text(labelLines, x + barWidth / 2, yPosition + maxBarHeight + 5, { align: 'center' });
        });

        yPosition += maxBarHeight + 20;

        // Texto com totais
        pdf.setFontSize(10);
        pdf.text(`Total de vínculos aluno-turma: ${statusStats.total}`, 14, yPosition);
        yPosition += 7;
        pdf.text(`Cursando: ${statusStats.cursando} | Concluídos: ${statusStats.concluido} | Reprovados: ${statusStats.reprovado}`, 14, yPosition);
        yPosition += 7;
        pdf.text(`Desligados: ${statusStats.desligado} | Desertores: ${statusStats.desertor}`, 14, yPosition);
        yPosition += 15;
      }

      // Cursos por Ano e Tipo Militar
      const cursosStats = await fetchCursosStats();
      if (cursosStats) {
        pdf.setFontSize(14);
        pdf.text("Cursos por Ano - Distribuição", 14, yPosition);
        yPosition += 10;

        pdf.setFontSize(10);
        Object.entries(cursosStats).forEach(([year, stats]: [string, any]) => {
          if (yPosition > pdf.internal.pageSize.getHeight() - 30) {
            pdf.addPage();
            yPosition = 20;
          }
          
          pdf.setFontSize(11);
          pdf.text(`Ano: ${year}`, 14, yPosition);
          yPosition += 7;
          
          pdf.setFontSize(9);
          pdf.text(`  • Fuzileiros Navais: ${stats.fuzileiros}`, 14, yPosition);
          yPosition += 6;
          pdf.text(`  • Guarda Costeira: ${stats.guardaCosteira}`, 14, yPosition);
          yPosition += 6;
          pdf.text(`  • Cursos CIAGA: ${stats.ciaga}`, 14, yPosition);
          yPosition += 6;
          pdf.text(`  • Cursos CIABA: ${stats.ciaba}`, 14, yPosition);
          yPosition += 6;
          pdf.text(`  • Total de alunos: ${stats.total}`, 14, yPosition);
          yPosition += 10;
        });
        yPosition += 5;
      }

      // Estatísticas gerais
      if (statsData) {
        if (yPosition > pdf.internal.pageSize.getHeight() - 40) {
          pdf.addPage();
          yPosition = 20;
        }
        
        pdf.setFontSize(14);
        pdf.text("Estatísticas Gerais", 14, yPosition);
        yPosition += 10;

        pdf.setFontSize(10);
        statsData.tipoData.forEach((item: any) => {
          pdf.text(`${item.name}: ${item.value} alunos`, 14, yPosition);
          yPosition += 7;
        });
        yPosition += 5;
      }

      // Capturar gráficos se existirem (removido)


      // Dados tabulares
      let data: any[] = [];
      if (incluirAlunos) {
        let query = supabase.from("alunos").select("*");
        if (selectedTipo && selectedTipo !== "all") query = query.eq("tipo_militar", selectedTipo as "Fuzileiro Naval" | "Guarda Costeiro");
        const { data: alunosData } = await query;
        if (alunosData) data = [...data, ...alunosData];
      }

      if (data.length > 0) {
        if (yPosition + 20 > pdf.internal.pageSize.getHeight()) {
          pdf.addPage();
          yPosition = 20;
        }
        
        pdf.setFontSize(12);
        pdf.text("Dados dos Alunos", 14, yPosition);
        yPosition += 10;

        pdf.setFontSize(8);
        data.slice(0, 20).forEach((item: any) => {
          if (yPosition > pdf.internal.pageSize.getHeight() - 20) {
            pdf.addPage();
            yPosition = 20;
          }
          pdf.text(`${item.nome_completo} - ${item.graduacao} - ${item.tipo_militar}`, 14, yPosition);
          yPosition += 7;
        });
      }

      pdf.save(`relatorio-${Date.now()}.pdf`);
      toast.success("Relatório PDF exportado com sucesso");
    } catch (error) {
      console.error("Erro ao exportar PDF:", error);
      toast.error("Erro ao exportar relatório PDF");
    }
  };

  const exportAlunoReport = async () => {
    if (!selectedAluno) {
      toast.error("Selecione um aluno para gerar o relatório individual");
      return;
    }

    try {
      const { data: alunoData } = await supabase
        .from("alunos")
        .select("*")
        .eq("id", selectedAluno)
        .single();

      const { data: turmasData } = await supabase
        .from("aluno_turma")
        .select("status, turmas(nome, ano, cursos(nome, modalidade, coordenador))")
        .eq("aluno_id", selectedAluno);

      if (!alunoData) {
        toast.error("Aluno não encontrado");
        return;
      }

      const pdf = new jsPDF();
      const pageWidth = pdf.internal.pageSize.getWidth();
      let yPosition = 20;

      // Cabeçalho
      pdf.setFontSize(18);
      pdf.text("Relatório Individual do Aluno", pageWidth / 2, yPosition, { align: "center" });
      yPosition += 15;

      // Dados do aluno
      pdf.setFontSize(12);
      pdf.text("Dados Pessoais", 14, yPosition);
      yPosition += 10;

      pdf.setFontSize(10);
      const dadosAluno = [
        `Nome: ${alunoData.nome_completo}`,
        `Graduação: ${alunoData.graduacao}`,
        `Tipo Militar: ${alunoData.tipo_militar}`,
        `Email: ${alunoData.email || "Não informado"}`,
        `Telefone: ${alunoData.telefone || "Não informado"}`,
        `Local de Serviço: ${alunoData.local_servico || "Não informado"}`,
      ];

      dadosAluno.forEach((linha) => {
        pdf.text(linha, 14, yPosition);
        yPosition += 7;
      });

      yPosition += 10;

      // Turmas e cursos
      if (turmasData && turmasData.length > 0) {
        pdf.setFontSize(12);
        pdf.text("Turmas e Cursos", 14, yPosition);
        yPosition += 10;

        pdf.setFontSize(10);
        turmasData.forEach((item: any) => {
          if (yPosition > pdf.internal.pageSize.getHeight() - 30) {
            pdf.addPage();
            yPosition = 20;
          }
          
          const turma = item.turmas;
          const status = item.status || 'Cursando';
          const ano = turma?.ano || 'Não informado';
          const modalidade = turma?.cursos?.modalidade || 'Não informado';
          const coordenador = turma?.cursos?.coordenador || 'Não informado';
          
          pdf.text(`• Curso: ${turma?.cursos?.nome}`, 14, yPosition);
          yPosition += 6;
          pdf.text(`  Turma: ${turma?.nome} | Ano: ${ano}`, 14, yPosition);
          yPosition += 6;
          pdf.text(`  Modalidade: ${modalidade}`, 14, yPosition);
          yPosition += 6;
          pdf.text(`  Coordenador: ${coordenador}`, 14, yPosition);
          yPosition += 6;
          pdf.text(`  Status: ${status}`, 14, yPosition);
          yPosition += 8;
        });
      }

      // Observações
      if (alunoData.observacoes) {
        yPosition += 10;
        pdf.setFontSize(12);
        pdf.text("Observações", 14, yPosition);
        yPosition += 10;

        pdf.setFontSize(10);
        const lines = pdf.splitTextToSize(alunoData.observacoes, pageWidth - 28);
        lines.forEach((line: string) => {
          if (yPosition > pdf.internal.pageSize.getHeight() - 20) {
            pdf.addPage();
            yPosition = 20;
          }
          pdf.text(line, 14, yPosition);
          yPosition += 7;
        });
      }

      pdf.save(`relatorio-aluno-${alunoData.nome_completo}-${Date.now()}.pdf`);
      toast.success("Relatório individual exportado com sucesso");
    } catch (error) {
      console.error("Erro ao exportar relatório do aluno:", error);
      toast.error("Erro ao exportar relatório individual");
    }
  };


  return (
    <div className="space-y-4 sm:space-y-6">
      <div>
        <h2 className="text-2xl sm:text-3xl font-bold tracking-tight">Relatórios</h2>
        <p className="text-sm sm:text-base text-muted-foreground">Gere e exporte relatórios customizados com gráficos e análises</p>
      </div>

      {/* Relatório Individual */}
      <Card className="shadow-card">
        <CardHeader className="p-4 sm:p-6">
          <CardTitle className="flex items-center gap-2 text-base sm:text-lg">
            <User className="h-4 w-4 sm:h-5 sm:w-5" />
            Relatório Individual por Aluno
          </CardTitle>
        </CardHeader>
        <CardContent className="p-4 sm:p-6 pt-0 space-y-4">
          <div className="space-y-2">
            <Label className="text-sm">Selecionar Aluno</Label>
            <Select value={selectedAluno} onValueChange={setSelectedAluno}>
              <SelectTrigger>
                <SelectValue placeholder="Escolha um aluno" />
              </SelectTrigger>
              <SelectContent>
                {alunos.map((aluno) => (
                  <SelectItem key={aluno.id} value={aluno.id}>
                    {aluno.nome_completo}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <Button onClick={exportAlunoReport} className="gap-2 w-full sm:w-auto">
            <FileDown className="h-4 w-4" />
            <span className="text-sm">Gerar Relatório Individual (PDF)</span>
          </Button>
        </CardContent>
      </Card>

      {/* Relatórios Gerais */}
      <Card className="shadow-card">
        <CardHeader className="p-4 sm:p-6">
          <CardTitle className="text-base sm:text-lg">Configurar Relatório Geral</CardTitle>
        </CardHeader>
        <CardContent className="p-4 sm:p-6 pt-0 space-y-4 sm:space-y-6">
          <div className="grid gap-4 grid-cols-1 sm:grid-cols-2">
            <div className="space-y-2">
              <Label>Filtrar por Curso</Label>
              <Select value={selectedCurso} onValueChange={setSelectedCurso}>
                <SelectTrigger>
                  <SelectValue placeholder="Todos os cursos" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">Todos os cursos</SelectItem>
                  {cursos.map((curso) => (
                    <SelectItem key={curso.id} value={curso.id}>
                      {curso.nome}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label>Filtrar por Turma</Label>
              <Select value={selectedTurma} onValueChange={setSelectedTurma}>
                <SelectTrigger>
                  <SelectValue placeholder="Todas as turmas" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">Todas as turmas</SelectItem>
                  {turmas.map((turma) => (
                    <SelectItem key={turma.id} value={turma.id}>
                      {turma.nome}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label>Filtrar por Tipo Militar</Label>
              <Select value={selectedTipo} onValueChange={setSelectedTipo}>
                <SelectTrigger>
                  <SelectValue placeholder="Todos os tipos" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">Todos os tipos</SelectItem>
                  <SelectItem value="Fuzileiro Naval">Fuzileiro Naval</SelectItem>
                  <SelectItem value="Guarda Costeiro">Guarda Costeiro</SelectItem>
                  <SelectItem value="Exercito">Exército</SelectItem>
                  <SelectItem value="Bombeiro">Bombeiro</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>

          <div className="space-y-3">
            <Label className="text-sm">Incluir nos Relatórios:</Label>
            <div className="space-y-2">
              <div className="flex items-center space-x-2">
                <Checkbox
                  id="alunos"
                  checked={incluirAlunos}
                  onCheckedChange={(checked) => setIncluirAlunos(checked as boolean)}
                />
                <label htmlFor="alunos" className="text-xs sm:text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70">
                  Alunos
                </label>
              </div>
              <div className="flex items-center space-x-2">
                <Checkbox
                  id="cursos"
                  checked={incluirCursos}
                  onCheckedChange={(checked) => setIncluirCursos(checked as boolean)}
                />
                <label htmlFor="cursos" className="text-xs sm:text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70">
                  Cursos
                </label>
              </div>
              <div className="flex items-center space-x-2">
                <Checkbox
                  id="turmas"
                  checked={incluirTurmas}
                  onCheckedChange={(checked) => setIncluirTurmas(checked as boolean)}
                />
                <label htmlFor="turmas" className="text-xs sm:text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70">
                  Turmas
                </label>
              </div>
            </div>
          </div>

          <div className="flex flex-col sm:flex-row gap-3">
            <Button onClick={exportToCSV} className="gap-2 w-full sm:w-auto">
              <FileSpreadsheet className="h-4 w-4" />
              <span className="text-sm">Exportar Excel/CSV</span>
            </Button>
            <Button onClick={exportToPDF} variant="outline" className="gap-2 w-full sm:w-auto">
              <FileDown className="h-4 w-4" />
              <span className="text-sm">Exportar PDF</span>
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
