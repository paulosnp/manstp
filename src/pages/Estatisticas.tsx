import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { supabase } from "@/lib/supabase";
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from "recharts";
import { ChartContainer, ChartTooltip, ChartTooltipContent } from "@/components/ui/chart";

interface ChartData {
  curso: string;
  Aprovados: number;
  Desligados: number;
  Desertores: number;
}

interface TableData {
  curso: string;
  categoria: string;
  aprovados: number;
  desligados: number;
  desertores: number;
  total: number;
}

interface YearChartData {
  ano: number;
  CONCLUIDOS: number;
  GCSTP: number;
  FUZILEIRO: number;
}

interface LocationChartData {
  ano: number;
  CIABA: number;
  CIAGA: number;
  TOTAL: number;
}

interface CourseTypeChartData {
  ano: number;
  Expedito: number;
  Carreira: number;
  TOTAL: number;
}

export default function Estatisticas() {
  const [loading, setLoading] = useState(true);
  const [chartData, setChartData] = useState<ChartData[]>([]);
  const [tableData, setTableData] = useState<TableData[]>([]);
  const [yearChartData, setYearChartData] = useState<YearChartData[]>([]);
  const [locationChartData, setLocationChartData] = useState<LocationChartData[]>([]);
  const [courseTypeChartData, setCourseTypeChartData] = useState<CourseTypeChartData[]>([]);
  const [cursos, setCursos] = useState<string[]>([]);
  const [categorias, setCategorias] = useState<string[]>([]);
  const [anos, setAnos] = useState<number[]>([]);
  
  const [selectedCurso, setSelectedCurso] = useState<string>("todos");
  const [selectedCategoria, setSelectedCategoria] = useState<string>("todos");
  const [selectedAno, setSelectedAno] = useState<string>("todos");

  useEffect(() => {
    fetchStats();
  }, []);

  const fetchStats = async () => {
    try {
      const { data, error } = await supabase
        .from("aluno_turma")
        .select(`
          aluno_id,
          status,
          alunos!inner(tipo_militar),
          turmas!inner(
            ano,
            curso_id,
            cursos!inner(nome, local_realizacao, tipo_curso)
          )
        `);

      if (error) throw error;

      // Extract unique values for filters
      const cursosSet = new Set<string>();
      const categoriasSet = new Set<string>();
      const anosSet = new Set<number>();

      data?.forEach((item: any) => {
        cursosSet.add(item.turmas.cursos.nome);
        categoriasSet.add(item.alunos.tipo_militar);
        anosSet.add(item.turmas.ano);
      });

      setCursos(Array.from(cursosSet).sort());
      setCategorias(Array.from(categoriasSet).sort());
      setAnos(Array.from(anosSet).sort((a, b) => b - a));

      processData(data);
    } catch (error) {
      console.error("Erro ao buscar estatísticas:", error);
    } finally {
      setLoading(false);
    }
  };

  const processData = (rawData: any[]) => {
    // Apply filters
    const filteredData = rawData.filter((item: any) => {
      const cursoMatch = selectedCurso === "todos" || item.turmas.cursos.nome === selectedCurso;
      const categoriaMatch = selectedCategoria === "todos" || item.alunos.tipo_militar === selectedCategoria;
      const anoMatch = selectedAno === "todos" || item.turmas.ano.toString() === selectedAno;
      return cursoMatch && categoriaMatch && anoMatch;
    });

    // Chart data - group by curso and status
    const chartMap = new Map<string, { Aprovados: number; Desligados: number; Desertores: number }>();

    filteredData.forEach((item: any) => {
      const curso = item.turmas.cursos.nome;
      const status = item.status || "Cursando";

      if (!chartMap.has(curso)) {
        chartMap.set(curso, { Aprovados: 0, Desligados: 0, Desertores: 0 });
      }

      const cursoData = chartMap.get(curso)!;
      if (status === "Aprovado") cursoData.Aprovados++;
      else if (status === "Desligado") cursoData.Desligados++;
      else if (status === "Desertor") cursoData.Desertores++;
    });

    const chartArray: ChartData[] = Array.from(chartMap.entries())
      .map(([curso, counts]) => ({ curso, ...counts }))
      .sort((a, b) => a.curso.localeCompare(b.curso));

    setChartData(chartArray);

    // Year chart data - group by year and categoria (Fuzileiro Naval, Guarda Costeiro)
    const yearMap = new Map<number, { CONCLUIDOS: number; GCSTP: number; FUZILEIRO: number }>();

    filteredData.forEach((item: any) => {
      const ano = item.turmas.ano;
      const categoria = item.alunos.tipo_militar;

      if (!yearMap.has(ano)) {
        yearMap.set(ano, { CONCLUIDOS: 0, GCSTP: 0, FUZILEIRO: 0 });
      }

      const yearData = yearMap.get(ano)!;
      yearData.CONCLUIDOS++;
      
      if (categoria === "Guarda Costeiro") {
        yearData.GCSTP++;
      } else if (categoria === "Fuzileiro Naval") {
        yearData.FUZILEIRO++;
      }
    });

    const yearArray: YearChartData[] = Array.from(yearMap.entries())
      .map(([ano, counts]) => ({ ano, ...counts }))
      .sort((a, b) => a.ano - b.ano);

    setYearChartData(yearArray);

    // Location chart data - group by year and location (CIABA/CIAGA)
    const locationMap = new Map<number, { CIABA: number; CIAGA: number; TOTAL: number }>();

    filteredData.forEach((item: any) => {
      const ano = item.turmas.ano;
      const local = item.turmas.cursos.local_realizacao;

      if (!locationMap.has(ano)) {
        locationMap.set(ano, { CIABA: 0, CIAGA: 0, TOTAL: 0 });
      }

      const locationData = locationMap.get(ano)!;
      locationData.TOTAL++;
      
      if (local === "São Tomé") {
        locationData.CIABA++;
      } else if (local === "Brasil") {
        locationData.CIAGA++;
      }
    });

    const locationArray: LocationChartData[] = Array.from(locationMap.entries())
      .map(([ano, counts]) => ({ ano, ...counts }))
      .sort((a, b) => a.ano - b.ano);

    setLocationChartData(locationArray);

    // Course type chart data - group by year and course type (Expedito/Carreira)
    const courseTypeMap = new Map<number, { Expedito: number; Carreira: number; TOTAL: number }>();

    filteredData.forEach((item: any) => {
      const ano = item.turmas.ano;
      const tipo = item.turmas.cursos.tipo_curso;

      if (!courseTypeMap.has(ano)) {
        courseTypeMap.set(ano, { Expedito: 0, Carreira: 0, TOTAL: 0 });
      }

      const typeData = courseTypeMap.get(ano)!;
      typeData.TOTAL++;
      
      if (tipo === "Expedito") {
        typeData.Expedito++;
      } else if (tipo === "Carreira") {
        typeData.Carreira++;
      }
    });

    const courseTypeArray: CourseTypeChartData[] = Array.from(courseTypeMap.entries())
      .map(([ano, counts]) => ({ ano, ...counts }))
      .sort((a, b) => a.ano - b.ano);

    setCourseTypeChartData(courseTypeArray);

    // Table data - group by curso and categoria
    const tableMap = new Map<string, TableData>();

    filteredData.forEach((item: any) => {
      const curso = item.turmas.cursos.nome;
      const categoria = item.alunos.tipo_militar;
      const status = item.status || "Cursando";
      const key = `${curso}-${categoria}`;

      if (!tableMap.has(key)) {
        tableMap.set(key, {
          curso,
          categoria,
          aprovados: 0,
          desligados: 0,
          desertores: 0,
          total: 0,
        });
      }

      const rowData = tableMap.get(key)!;
      rowData.total++;
      if (status === "Aprovado") rowData.aprovados++;
      else if (status === "Desligado") rowData.desligados++;
      else if (status === "Desertor") rowData.desertores++;
    });

    const tableArray = Array.from(tableMap.values()).sort((a, b) => {
      const cursoCompare = a.curso.localeCompare(b.curso);
      return cursoCompare !== 0 ? cursoCompare : a.categoria.localeCompare(b.categoria);
    });

    setTableData(tableArray);
  };

  useEffect(() => {
    fetchStats();
  }, []);

  useEffect(() => {
    if (!loading) {
      // Re-fetch to get raw data and process with filters
      const refetch = async () => {
        const { data } = await supabase
          .from("aluno_turma")
          .select(`
            aluno_id,
            status,
            alunos!inner(tipo_militar),
            turmas!inner(
              ano,
              curso_id,
              cursos!inner(nome, local_realizacao, tipo_curso)
            )
          `);
        if (data) processData(data);
      };
      refetch();
    }
  }, [selectedCurso, selectedCategoria, selectedAno]);

  if (loading) {
    return (
      <div className="flex items-center justify-center py-12">
        <div className="h-8 w-8 animate-spin rounded-full border-4 border-primary border-t-transparent"></div>
      </div>
    );
  }

  if (chartData.length === 0 && !loading) {
    return (
      <div className="space-y-6">
        <div>
          <h2 className="text-3xl font-bold tracking-tight">Estatísticas</h2>
          <p className="text-muted-foreground">Visualize estatísticas e métricas do sistema</p>
        </div>
        <Card>
          <CardContent className="py-12 text-center">
            <p className="text-muted-foreground mb-6">
              Nenhum dado disponível. Cadastre alunos e vincule-os a turmas para visualizar estatísticas.
            </p>
            <Link
              to="/"
              className="inline-flex items-center gap-2 text-primary hover:underline"
            >
              <svg
                xmlns="http://www.w3.org/2000/svg"
                width="20"
                height="20"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="2"
                strokeLinecap="round"
                strokeLinejoin="round"
              >
                <path d="m12 19-7-7 7-7" />
                <path d="M19 12H5" />
              </svg>
              Voltar ao início
            </Link>
          </CardContent>
        </Card>
      </div>
    );
  }

  const chartConfig = {
    Aprovados: { label: "Aprovados", color: "hsl(142, 76%, 36%)" },
    Desligados: { label: "Desligados", color: "hsl(48, 96%, 53%)" },
    Desertores: { label: "Desertores", color: "hsl(0, 84%, 60%)" },
  };

  const yearChartConfig = {
    CONCLUIDOS: { label: "CONCLUIDOS", color: "hsl(142, 76%, 36%)" },
    GCSTP: { label: "GCSTP", color: "hsl(210, 100%, 50%)" },
    FUZILEIRO: { label: "FUZILEIRO", color: "hsl(0, 84%, 60%)" },
  };

  const locationChartConfig = {
    TOTAL: { label: "TOTAL", color: "hsl(142, 76%, 36%)" },
    CIABA: { label: "CIABA (São Tomé)", color: "hsl(210, 100%, 50%)" },
    CIAGA: { label: "CIAGA (Brasil)", color: "hsl(25, 95%, 53%)" },
  };

  const courseTypeChartConfig = {
    TOTAL: { label: "TOTAL", color: "hsl(142, 76%, 36%)" },
    Expedito: { label: "Expedito", color: "hsl(280, 100%, 50%)" },
    Carreira: { label: "Carreira", color: "hsl(160, 84%, 39%)" },
  };

  return (
    <div className="space-y-4 sm:space-y-6">
      <div>
        <h2 className="text-2xl sm:text-3xl font-bold tracking-tight">Estatísticas</h2>
        <p className="text-sm sm:text-base text-muted-foreground">
          Análise de alunos por curso, categoria e status
        </p>
      </div>

      {/* Filters */}
      <Card>
        <CardContent className="pt-4 sm:pt-6 p-4 sm:p-6">
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3 sm:gap-4">
            <div className="space-y-2">
              <label className="text-xs sm:text-sm font-medium">Curso</label>
              <Select value={selectedCurso} onValueChange={setSelectedCurso}>
                <SelectTrigger>
                  <SelectValue placeholder="Selecione o curso" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="todos">Todos</SelectItem>
                  {cursos.map((curso) => (
                    <SelectItem key={curso} value={curso}>
                      {curso}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <label className="text-xs sm:text-sm font-medium">Categoria</label>
              <Select value={selectedCategoria} onValueChange={setSelectedCategoria}>
                <SelectTrigger>
                  <SelectValue placeholder="Selecione a categoria" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="todos">Todos</SelectItem>
                  {categorias.map((categoria) => (
                    <SelectItem key={categoria} value={categoria}>
                      {categoria}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <label className="text-xs sm:text-sm font-medium">Ano</label>
              <Select value={selectedAno} onValueChange={setSelectedAno}>
                <SelectTrigger>
                  <SelectValue placeholder="Selecione o ano" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="todos">Todos</SelectItem>
                  {anos.map((ano) => (
                    <SelectItem key={ano} value={ano.toString()}>
                      {ano}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Year Chart - Inscritos por Categoria */}
      <Card>
        <CardHeader className="p-4 sm:p-6">
          <CardTitle className="text-base sm:text-lg">Inscritos por Ano - Fuzileiros Navais e Guarda Costeira</CardTitle>
        </CardHeader>
        <CardContent className="p-4 sm:p-6 pt-0">
          <ChartContainer config={yearChartConfig} className="h-[300px] sm:h-[400px] w-full">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={yearChartData}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="ano" tick={{ fontSize: 12 }} />
                <YAxis tick={{ fontSize: 12 }} />
                <ChartTooltip content={<ChartTooltipContent />} />
                <Legend wrapperStyle={{ fontSize: '12px' }} />
                <Bar dataKey="CONCLUIDOS" fill={yearChartConfig.CONCLUIDOS.color} label={{ position: 'top', fontSize: 10 }} />
                <Bar dataKey="GCSTP" fill={yearChartConfig.GCSTP.color} label={{ position: 'top', fontSize: 10 }} />
                <Bar dataKey="FUZILEIRO" fill={yearChartConfig.FUZILEIRO.color} label={{ position: 'top', fontSize: 10 }} />
              </BarChart>
            </ResponsiveContainer>
          </ChartContainer>
        </CardContent>
      </Card>

      {/* Location Chart - Cursos por Local */}
      <Card>
        <CardHeader className="p-4 sm:p-6">
          <CardTitle className="text-base sm:text-lg">Cursos Realizados no CIAGA e CIABA</CardTitle>
        </CardHeader>
        <CardContent className="p-4 sm:p-6 pt-0">
          <ChartContainer config={locationChartConfig} className="h-[300px] sm:h-[400px] w-full">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={locationChartData}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="ano" tick={{ fontSize: 12 }} />
                <YAxis tick={{ fontSize: 12 }} />
                <ChartTooltip content={<ChartTooltipContent />} />
                <Legend wrapperStyle={{ fontSize: '12px' }} />
                <Bar dataKey="TOTAL" fill={locationChartConfig.TOTAL.color} label={{ position: 'top', fontSize: 10 }} />
                <Bar dataKey="CIABA" fill={locationChartConfig.CIABA.color} label={{ position: 'top', fontSize: 10 }} />
                <Bar dataKey="CIAGA" fill={locationChartConfig.CIAGA.color} label={{ position: 'top', fontSize: 10 }} />
              </BarChart>
            </ResponsiveContainer>
          </ChartContainer>
        </CardContent>
      </Card>

      {/* Course Type Chart - Cursos Expeditos e Carreira */}
      <Card>
        <CardHeader className="p-4 sm:p-6">
          <CardTitle className="text-base sm:text-lg">Cursos Expeditos e de Carreira</CardTitle>
        </CardHeader>
        <CardContent className="p-4 sm:p-6 pt-0">
          <ChartContainer config={courseTypeChartConfig} className="h-[300px] sm:h-[400px] w-full">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={courseTypeChartData}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="ano" tick={{ fontSize: 12 }} />
                <YAxis tick={{ fontSize: 12 }} />
                <ChartTooltip content={<ChartTooltipContent />} />
                <Legend wrapperStyle={{ fontSize: '12px' }} />
                <Bar dataKey="TOTAL" fill={courseTypeChartConfig.TOTAL.color} label={{ position: 'top', fontSize: 10 }} />
                <Bar dataKey="Expedito" fill={courseTypeChartConfig.Expedito.color} label={{ position: 'top', fontSize: 10 }} />
                <Bar dataKey="Carreira" fill={courseTypeChartConfig.Carreira.color} label={{ position: 'top', fontSize: 10 }} />
              </BarChart>
            </ResponsiveContainer>
          </ChartContainer>
        </CardContent>
      </Card>

      {/* Table Data */}
      <Card>
        <CardHeader className="p-4 sm:p-6">
          <CardTitle className="text-base sm:text-lg">Detalhamento por Curso e Categoria</CardTitle>
        </CardHeader>
        <CardContent className="p-0 sm:p-6">
          <div className="overflow-x-auto">
            <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Curso</TableHead>
                <TableHead>Categoria</TableHead>
                <TableHead className="text-right">Total Inscritos</TableHead>
                <TableHead className="text-right">Aprovados</TableHead>
                <TableHead className="text-right">Desligados</TableHead>
                <TableHead className="text-right">Desertores</TableHead>
                <TableHead className="text-right">Total</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {tableData.map((row, index) => (
                <TableRow key={index}>
                  <TableCell className="font-medium text-sm">{row.curso}</TableCell>
                  <TableCell className="text-sm">{row.categoria}</TableCell>
                  <TableCell className="text-right font-semibold text-sm">{row.total}</TableCell>
                  <TableCell className="text-right text-sm">{row.aprovados}</TableCell>
                  <TableCell className="text-right text-sm">{row.desligados}</TableCell>
                  <TableCell className="text-right text-sm">{row.desertores}</TableCell>
                  <TableCell className="text-right font-semibold text-sm">{row.total}</TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
