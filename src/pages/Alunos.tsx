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
import { supabase } from "@/lib/supabase";
import { useAuth } from "@/contexts/AuthContext";
import { useUserRole } from "@/hooks/useUserRole";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { AlunoForm } from "@/components/AlunoForm";
import { DeleteDialog } from "@/components/DeleteDialog";
import { ImportarAlunos } from "@/components/ImportarAlunos";

interface Aluno {
  id: string;
  nome_completo: string;
  graduacao: string;
  tipo_militar: string;
  local_servico?: string;
  telefone: string | null;
  email: string | null;
  observacoes: string | null;
}

export default function Alunos() {
  const { user } = useAuth();
  const { isCoordenador } = useUserRole();
  const [alunos, setAlunos] = useState<Aluno[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState("");

  useEffect(() => {
    fetchAlunos();
  }, [user]);

  const fetchAlunos = async () => {
    try {
      const { data, error } = await supabase
        .from("alunos")
        .select("*")
        .order("nome_completo");

      if (error) throw error;
      setAlunos(data || []);
    } catch (error) {
      console.error("Erro ao buscar alunos:", error);
    } finally {
      setLoading(false);
    }
  };

  const filteredAlunos = alunos.filter((aluno) =>
    aluno.nome_completo.toLowerCase().includes(searchTerm.toLowerCase()) ||
    aluno.graduacao.toLowerCase().includes(searchTerm.toLowerCase()) ||
    aluno.tipo_militar.toLowerCase().includes(searchTerm.toLowerCase())
  );

  return (
    <div className="space-y-4 sm:space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h2 className="text-2xl sm:text-3xl font-bold tracking-tight">Alunos</h2>
          <p className="text-sm sm:text-base text-muted-foreground">Gerencie os alunos cadastrados</p>
        </div>
        {isCoordenador && (
          <div className="flex flex-col sm:flex-row gap-2 w-full sm:w-auto">
            <ImportarAlunos onSuccess={fetchAlunos} />
            <AlunoForm onSuccess={fetchAlunos} />
          </div>
        )}
      </div>

      <Card className="shadow-card">
        <CardHeader className="p-4 sm:p-6">
          <div className="flex items-center gap-4">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
              <Input
                placeholder="Buscar alunos..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-9 text-sm"
              />
            </div>
          </div>
        </CardHeader>
        <CardContent className="p-0 sm:p-6">
          {loading ? (
            <div className="flex items-center justify-center py-12">
              <div className="h-8 w-8 animate-spin rounded-full border-4 border-primary border-t-transparent"></div>
            </div>
          ) : filteredAlunos.length === 0 ? (
            <div className="py-12 text-center">
              <p className="text-muted-foreground">
                {searchTerm ? "Nenhum aluno encontrado" : "Nenhum aluno cadastrado"}
              </p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead className="min-w-[150px]">Nome</TableHead>
                    <TableHead className="min-w-[120px]">Graduação</TableHead>
                    <TableHead className="min-w-[140px]">Tipo</TableHead>
                    <TableHead className="min-w-[120px] hidden sm:table-cell">Local de Serviço</TableHead>
                    <TableHead className="min-w-[150px] hidden md:table-cell">Contato</TableHead>
                    <TableHead className="text-right min-w-[100px]">Ações</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                {filteredAlunos.map((aluno) => (
                  <TableRow key={aluno.id}>
                    <TableCell className="font-medium text-sm">{aluno.nome_completo}</TableCell>
                    <TableCell className="text-sm">{aluno.graduacao}</TableCell>
                    <TableCell>
                      <Badge
                        className="text-xs"
                        variant={
                          aluno.tipo_militar === "Fuzileiro Naval" ? "default" :
                          aluno.tipo_militar === "Guarda Costeiro" ? "secondary" :
                          aluno.tipo_militar === "Exercito" ? "outline" :
                          "destructive"
                        }
                      >
                        {aluno.tipo_militar}
                      </Badge>
                    </TableCell>
                    <TableCell className="hidden sm:table-cell text-sm">{aluno.local_servico || "-"}</TableCell>
                    <TableCell className="hidden md:table-cell">
                      <div className="text-xs">
                        {aluno.email && <div className="truncate max-w-[200px]">{aluno.email}</div>}
                        {aluno.telefone && <div className="text-muted-foreground">{aluno.telefone}</div>}
                      </div>
                    </TableCell>
                    <TableCell className="text-right">
                      {isCoordenador && (
                        <div className="flex justify-end gap-1 sm:gap-2">
                          <AlunoForm aluno={aluno} onSuccess={fetchAlunos} />
                          <DeleteDialog
                            table="alunos"
                            id={aluno.id}
                            name="Aluno"
                            onSuccess={fetchAlunos}
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
