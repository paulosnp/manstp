import { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Checkbox } from "@/components/ui/checkbox";
import { FileDown, FileSpreadsheet } from "lucide-react";
import { supabase } from "@/lib/supabase";
import { toast } from "sonner";

export default function Relatorios() {
  const [cursos, setCursos] = useState<any[]>([]);
  const [turmas, setTurmas] = useState<any[]>([]);
  const [selectedCurso, setSelectedCurso] = useState("");
  const [selectedTurma, setSelectedTurma] = useState("");
  const [selectedTipo, setSelectedTipo] = useState("");
  const [incluirAlunos, setIncluirAlunos] = useState(true);
  const [incluirCursos, setIncluirCursos] = useState(true);
  const [incluirTurmas, setIncluirTurmas] = useState(true);

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    const { data: cursosData } = await supabase.from("cursos").select("id, nome").order("nome");
    const { data: turmasData } = await supabase.from("turmas").select("id, nome").order("nome");
    if (cursosData) setCursos(cursosData);
    if (turmasData) setTurmas(turmasData);
  };

  const exportToCSV = async () => {
    try {
      let data: any[] = [];
      let headers: string[] = [];

      if (incluirAlunos) {
        let query = supabase.from("alunos").select("*");
        if (selectedTipo) query = query.eq("tipo_militar", selectedTipo as any);
        const { data: alunosData } = await query;
        if (alunosData && alunosData.length > 0) {
          headers = Object.keys(alunosData[0]);
          data = alunosData;
        }
      }

      if (incluirCursos) {
        let query = supabase.from("cursos").select("*");
        if (selectedCurso) query = query.eq("id", selectedCurso);
        const { data: cursosData } = await query;
        if (cursosData) data = [...data, ...cursosData];
      }

      if (incluirTurmas) {
        let query = supabase.from("turmas").select("*");
        if (selectedTurma) query = query.eq("id", selectedTurma);
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

  const exportToPDF = () => {
    toast.info("Exportação para PDF em desenvolvimento. Use CSV por enquanto.");
  };

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-3xl font-bold tracking-tight">Relatórios</h2>
        <p className="text-muted-foreground">Gere e exporte relatórios customizados</p>
      </div>

      <Card className="shadow-card">
        <CardHeader>
          <CardTitle>Configurar Relatório</CardTitle>
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
                  <SelectItem value="">Todos os cursos</SelectItem>
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
                  <SelectItem value="">Todas as turmas</SelectItem>
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
                  <SelectItem value="">Todos os tipos</SelectItem>
                  <SelectItem value="Fuzileiro Naval">Fuzileiro Naval</SelectItem>
                  <SelectItem value="Não Fuzileiro">Não Fuzileiro</SelectItem>
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
