import { useEffect, useState } from "react";
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Search } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { supabase } from "@/lib/supabase";
import { useAuth } from "@/contexts/AuthContext";
import { useUserRole } from "@/hooks/useUserRole";
import { CursoForm } from "@/components/CursoForm";
import { DeleteDialog } from "@/components/DeleteDialog";

interface Curso {
  id: string;
  nome: string;
  instituicao: string | null;
  local_realizacao: string | null;
  tipo_curso: string | null;
  modalidade: string | null;
  situacao: string | null;
  categoria: string | null;
  observacoes: string | null;
  coordenador: string | null;
}

export default function Cursos() {
  const { user } = useAuth();
  const { isCoordenador } = useUserRole();
  const [cursos, setCursos] = useState<Curso[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState("");

  useEffect(() => {
    fetchCursos();
  }, [user]);

  const fetchCursos = async () => {
    try {
      const { data, error } = await supabase
        .from("cursos")
        .select("*")
        .order("nome");

      if (error) throw error;
      setCursos(data || []);
    } catch (error) {
      console.error("Erro ao buscar cursos:", error);
    } finally {
      setLoading(false);
    }
  };

  const filteredCursos = cursos.filter((curso) =>
    curso.nome.toLowerCase().includes(searchTerm.toLowerCase()) ||
    (curso.instituicao && curso.instituicao.toLowerCase().includes(searchTerm.toLowerCase())) ||
    (curso.categoria && curso.categoria.toLowerCase().includes(searchTerm.toLowerCase()))
  );

  return (
    <div className="space-y-4 sm:space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h2 className="text-2xl sm:text-3xl font-bold tracking-tight">Cursos</h2>
          <p className="text-sm sm:text-base text-muted-foreground">Gerencie os cursos cadastrados</p>
        </div>
        {isCoordenador && <CursoForm onSuccess={fetchCursos} />}
      </div>

      <Card className="shadow-card">
        <CardHeader className="p-4 sm:p-6">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
            <Input
              placeholder="Buscar cursos..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="pl-9 text-sm"
            />
          </div>
        </CardHeader>
        <CardContent className="p-0 sm:p-6">
          {loading ? (
            <div className="flex items-center justify-center py-12">
              <div className="h-8 w-8 animate-spin rounded-full border-4 border-primary border-t-transparent"></div>
            </div>
          ) : filteredCursos.length === 0 ? (
            <div className="py-12 text-center">
              <p className="text-muted-foreground">
                {searchTerm ? "Nenhum curso encontrado" : "Nenhum curso cadastrado"}
              </p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead className="min-w-[150px]">Nome</TableHead>
                    <TableHead className="min-w-[120px] hidden sm:table-cell">Instituição</TableHead>
                    <TableHead className="min-w-[100px]">Local</TableHead>
                    <TableHead className="min-w-[100px] hidden md:table-cell">Tipo</TableHead>
                    <TableHead className="min-w-[100px]">Situação</TableHead>
                    <TableHead className="text-right min-w-[100px]">Ações</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filteredCursos.map((curso) => (
                    <TableRow key={curso.id}>
                      <TableCell className="font-medium text-sm">{curso.nome}</TableCell>
                      <TableCell className="hidden sm:table-cell text-sm">{curso.instituicao || "-"}</TableCell>
                      <TableCell>
                        {curso.local_realizacao ? (
                          <Badge variant="outline" className="text-xs">{curso.local_realizacao}</Badge>
                        ) : "-"}
                      </TableCell>
                      <TableCell className="hidden md:table-cell">
                        {curso.tipo_curso ? (
                          <Badge variant={curso.tipo_curso === "Carreira" ? "default" : "secondary"} className="text-xs">
                            {curso.tipo_curso}
                          </Badge>
                        ) : "-"}
                      </TableCell>
                      <TableCell>
                        <Badge
                          className="text-xs"
                          variant={
                            curso.situacao === "Concluído" ? "default" :
                            curso.situacao === "Em Andamento" ? "secondary" : "outline"
                          }
                        >
                          {curso.situacao}
                        </Badge>
                      </TableCell>
                      <TableCell className="text-right">
                        {isCoordenador && (
                          <div className="flex justify-end gap-1 sm:gap-2">
                            <CursoForm curso={curso} onSuccess={fetchCursos} />
                            <DeleteDialog
                              table="cursos"
                              id={curso.id}
                              name="Curso"
                              onSuccess={fetchCursos}
                            />
                          </div>
                        )}
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
