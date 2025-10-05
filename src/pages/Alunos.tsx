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
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { AlunoForm } from "@/components/AlunoForm";
import { DeleteDialog } from "@/components/DeleteDialog";

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
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-3xl font-bold tracking-tight">Alunos</h2>
          <p className="text-muted-foreground">Gerencie os alunos cadastrados</p>
        </div>
        <AlunoForm onSuccess={fetchAlunos} />
      </div>

      <Card className="shadow-card">
        <CardHeader>
          <div className="flex items-center gap-4">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
              <Input
                placeholder="Buscar por nome, graduação ou tipo militar..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-9"
              />
            </div>
          </div>
        </CardHeader>
        <CardContent>
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
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Nome</TableHead>
                  <TableHead>Graduação</TableHead>
                  <TableHead>Tipo</TableHead>
                  <TableHead>Local de Serviço</TableHead>
                  <TableHead>Contato</TableHead>
                  <TableHead className="text-right">Ações</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredAlunos.map((aluno) => (
                  <TableRow key={aluno.id}>
                    <TableCell className="font-medium">{aluno.nome_completo}</TableCell>
                    <TableCell>{aluno.graduacao}</TableCell>
                    <TableCell>
                      <Badge
                        variant={
                          aluno.tipo_militar === "Fuzileiro Naval"
                            ? "default"
                            : "secondary"
                        }
                      >
                        {aluno.tipo_militar}
                      </Badge>
                    </TableCell>
                    <TableCell>{aluno.local_servico || "-"}</TableCell>
                    <TableCell>
                      <div className="text-sm">
                        {aluno.email && <div>{aluno.email}</div>}
                        {aluno.telefone && <div className="text-muted-foreground">{aluno.telefone}</div>}
                      </div>
                    </TableCell>
                    <TableCell className="text-right">
                      <div className="flex justify-end gap-2">
                        <AlunoForm aluno={aluno} onSuccess={fetchAlunos} />
                        <DeleteDialog
                          table="alunos"
                          id={aluno.id}
                          name="Aluno"
                          onSuccess={fetchAlunos}
                        />
                      </div>
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
