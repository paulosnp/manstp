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
  data_inicio: string | null;
  data_fim: string | null;
  situacao: string | null;
  categoria: string | null;
  observacoes: string | null;
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
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-3xl font-bold tracking-tight">Cursos</h2>
          <p className="text-muted-foreground">Gerencie os cursos cadastrados</p>
        </div>
        {isCoordenador && <CursoForm onSuccess={fetchCursos} />}
      </div>

      <Card className="shadow-card">
        <CardHeader>
          <div className="relative">
            <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
            <Input
              placeholder="Buscar cursos..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="pl-9"
            />
          </div>
        </CardHeader>
        <CardContent>
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
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Nome</TableHead>
                  <TableHead>Instituição</TableHead>
                  <TableHead>Local</TableHead>
                  <TableHead>Período</TableHead>
                  <TableHead>Situação</TableHead>
                  <TableHead className="text-right">Ações</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredCursos.map((curso) => (
                  <TableRow key={curso.id}>
                    <TableCell className="font-medium">{curso.nome}</TableCell>
                    <TableCell>{curso.instituicao || "-"}</TableCell>
                    <TableCell>
                      {curso.local_realizacao ? (
                        <Badge variant="outline">{curso.local_realizacao}</Badge>
                      ) : "-"}
                    </TableCell>
                    <TableCell>
                      <div className="text-sm">
                        {curso.data_inicio && <div>Início: {new Date(curso.data_inicio).toLocaleDateString()}</div>}
                        {curso.data_fim && <div>Fim: {new Date(curso.data_fim).toLocaleDateString()}</div>}
                        {!curso.data_inicio && !curso.data_fim && "-"}
                      </div>
                    </TableCell>
                    <TableCell>
                      <Badge
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
                        <div className="flex justify-end gap-2">
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
          )}
        </CardContent>
      </Card>
    </div>
  );
}
