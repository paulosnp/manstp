import { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Checkbox } from "@/components/ui/checkbox";
import { FileDown, FileSpreadsheet, User, TrendingUp } from "lucide-react";
import { supabase } from "@/lib/supabase";
import { toast } from "sonner";
import { BarChart, Bar, PieChart, Pie, Cell, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from "recharts";
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
    const { data: cursosData } = await supabase.from("cursos").select("id, nome").order("nome");
    const { data: turmasData } = await supabase.from("turmas").select("id, nome").order("nome");
    const { data: alunosData } = await supabase.from("alunos").select("id, nome_completo").order("nome_completo");
    if (cursosData) setCursos(cursosData);
    if (turmasData) setTurmas(turmasData);
    if (alunosData) setAlunos(alunosData);
    await fetchStats();
  };

  const fetchStats = async () => {
    const { data: alunosData } = await supabase.from("alunos").select("status, graduacao, tipo_militar");
    if (!alunosData) return;

    const statusCounts = alunosData.reduce((acc: any, aluno) => {
      acc[aluno.status] = (acc[aluno.status] || 0) + 1;
      return acc;
    }, {});

    const graduacaoCounts = alunosData.reduce((acc: any, aluno) => {
      acc[aluno.graduacao] = (acc[aluno.graduacao] || 0) + 1;
      return acc;
    }, {});

    const tipoCounts = alunosData.reduce((acc: any, aluno) => {
      acc[aluno.tipo_militar] = (acc[aluno.tipo_militar] || 0) + 1;
      return acc;
    }, {});

    setStatsData({
      statusData: Object.entries(statusCounts).map(([name, value]) => ({ name, value })),
      graduacaoData: Object.entries(graduacaoCounts).map(([name, value]) => ({ name, value })),
      tipoData: Object.entries(tipoCounts).map(([name, value]) => ({ name, value })),
    });
  };

  const exportToCSV = async () => {
    try {
      let data: any[] = [];
      let headers: string[] = [];

      if (incluirAlunos) {
        let query = supabase.from("alunos").select("*");
        if (selectedTipo && selectedTipo !== "all") query = query.eq("tipo_militar", selectedTipo as "Fuzileiro Naval" | "Guarda Costeiro");
        const { data: alunosData } = await query;
        if (alunosData && alunosData.length > 0) {
          headers = Object.keys(alunosData[0]);
          data = alunosData;
        }
      }

      if (incluirCursos) {
        let query = supabase.from("cursos").select("*");
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

      // Estatísticas gerais
      if (statsData) {
        pdf.setFontSize(14);
        pdf.text("Estatísticas Gerais", 14, yPosition);
        yPosition += 10;

        pdf.setFontSize(10);
        statsData.statusData.forEach((item: any) => {
          pdf.text(`${item.name}: ${item.value} alunos`, 14, yPosition);
          yPosition += 7;
        });
        yPosition += 5;
      }

      // Capturar gráficos se existirem
      const chartsElement = document.getElementById("charts-container");
      if (chartsElement) {
        const canvas = await html2canvas(chartsElement, { scale: 2 });
        const imgData = canvas.toDataURL("image/png");
        
        if (yPosition + 100 > pdf.internal.pageSize.getHeight()) {
          pdf.addPage();
          yPosition = 20;
        }
        
        pdf.addImage(imgData, "PNG", 14, yPosition, pageWidth - 28, 80);
        yPosition += 90;
      }

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
          pdf.text(`${item.nome_completo} - ${item.graduacao} - ${item.status}`, 14, yPosition);
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
        .select("turma_id, turmas(nome, cursos(nome))")
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
        `Status: ${alunoData.status}`,
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
          pdf.text(`• ${item.turmas?.nome} - ${item.turmas?.cursos?.nome}`, 14, yPosition);
          yPosition += 7;
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

  const COLORS = ["hsl(var(--primary))", "hsl(var(--secondary))", "hsl(var(--accent))", "hsl(var(--muted))"];

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-3xl font-bold tracking-tight">Relatórios</h2>
        <p className="text-muted-foreground">Gere e exporte relatórios customizados com gráficos e análises</p>
      </div>

      {/* Gráficos de Estatísticas */}
      {statsData && (
        <div id="charts-container" className="grid gap-6 md:grid-cols-2">
          <Card className="shadow-card">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <TrendingUp className="h-5 w-5" />
                Status dos Alunos
              </CardTitle>
            </CardHeader>
            <CardContent>
              <ResponsiveContainer width="100%" height={300}>
                <PieChart>
                  <Pie
                    data={statsData.statusData}
                    cx="50%"
                    cy="50%"
                    labelLine={false}
                    label={({ name, percent }) => `${name}: ${(percent * 100).toFixed(0)}%`}
                    outerRadius={80}
                    fill="hsl(var(--primary))"
                    dataKey="value"
                  >
                    {statsData.statusData.map((_: any, index: number) => (
                      <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                    ))}
                  </Pie>
                  <Tooltip />
                </PieChart>
              </ResponsiveContainer>
            </CardContent>
          </Card>

          <Card className="shadow-card">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <TrendingUp className="h-5 w-5" />
                Tipo Militar
              </CardTitle>
            </CardHeader>
            <CardContent>
              <ResponsiveContainer width="100%" height={300}>
                <BarChart data={statsData.tipoData}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="name" />
                  <YAxis />
                  <Tooltip />
                  <Legend />
                  <Bar dataKey="value" fill="hsl(var(--primary))" name="Quantidade" />
                </BarChart>
              </ResponsiveContainer>
            </CardContent>
          </Card>
        </div>
      )}

      {/* Relatório Individual */}
      <Card className="shadow-card">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <User className="h-5 w-5" />
            Relatório Individual por Aluno
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-2">
            <Label>Selecionar Aluno</Label>
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
          <Button onClick={exportAlunoReport} className="gap-2">
            <FileDown className="h-4 w-4" />
            Gerar Relatório Individual (PDF)
          </Button>
        </CardContent>
      </Card>

      {/* Relatórios Gerais */}
      <Card className="shadow-card">
        <CardHeader>
          <CardTitle>Configurar Relatório Geral</CardTitle>
        </CardHeader>
        <CardContent className="space-y-6">
          <div className="grid gap-4 md:grid-cols-2">
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
                </SelectContent>
              </Select>
            </div>
          </div>

          <div className="space-y-3">
            <Label>Incluir nos Relatórios:</Label>
            <div className="space-y-2">
              <div className="flex items-center space-x-2">
                <Checkbox
                  id="alunos"
                  checked={incluirAlunos}
                  onCheckedChange={(checked) => setIncluirAlunos(checked as boolean)}
                />
                <label htmlFor="alunos" className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70">
                  Alunos
                </label>
              </div>
              <div className="flex items-center space-x-2">
                <Checkbox
                  id="cursos"
                  checked={incluirCursos}
                  onCheckedChange={(checked) => setIncluirCursos(checked as boolean)}
                />
                <label htmlFor="cursos" className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70">
                  Cursos
                </label>
              </div>
              <div className="flex items-center space-x-2">
                <Checkbox
                  id="turmas"
                  checked={incluirTurmas}
                  onCheckedChange={(checked) => setIncluirTurmas(checked as boolean)}
                />
                <label htmlFor="turmas" className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70">
                  Turmas
                </label>
              </div>
            </div>
          </div>

          <div className="flex gap-3">
            <Button onClick={exportToCSV} className="gap-2">
              <FileSpreadsheet className="h-4 w-4" />
              Exportar Excel/CSV
            </Button>
            <Button onClick={exportToPDF} variant="outline" className="gap-2">
              <FileDown className="h-4 w-4" />
              Exportar PDF
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
