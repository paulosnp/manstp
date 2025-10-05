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
import { Search, Users } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { supabase } from "@/lib/supabase";
import { useAuth } from "@/contexts/AuthContext";
import { TurmaForm } from "@/components/TurmaForm";
import { DeleteDialog } from "@/components/DeleteDialog";

interface Turma {
  id: string;
  nome: string;
  curso_id: string;
  ano: number;
  tipo_militar: string;
  observacoes: string | null;
  cursos?: { nome: string };
}

interface Aluno {
  id: string;
  nome_completo: string;
  graduacao: string;
  tipo_militar: string;
  local_servico?: string;
  email: string | null;
  telefone: string | null;
}

export default function Turmas() {
  const { user } = useAuth();
  const [turmas, setTurmas] = useState<Turma[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedTurma, setSelectedTurma] = useState<Turma | null>(null);
  const [alunosTurma, setAlunosTurma] = useState<Aluno[]>([]);
  const [loadingAlunos, setLoadingAlunos] = useState(false);

  useEffect(() => {
    fetchTurmas();
  }, [user]);

  const fetchTurmas = async () => {
    try {
      const { data, error } = await supabase
        .from("turmas")
        .select("*, cursos(nome)")
        .order("ano", { ascending: false });

      if (error) throw error;
      setTurmas(data || []);
    } catch (error) {
      console.error("Erro ao buscar turmas:", error);
    } finally {
      setLoading(false);
    }
  };

  const fetchAlunosTurma = async (turmaId: string) => {
    setLoadingAlunos(true);
    try {
      const { data, error } = await supabase
        .from("aluno_turma")
        .select("aluno_id, alunos(id, nome_completo, graduacao, tipo_militar, local_servico, email, telefone)")
        .eq("turma_id", turmaId);

      if (error) throw error;
      setAlunosTurma(data?.map((item: any) => item.alunos) || []);
    } catch (error) {
      console.error("Erro ao buscar alunos da turma:", error);
    } finally {
      setLoadingAlunos(false);
    }
  };

  const handleViewAlunos = (turma: Turma) => {
    setSelectedTurma(turma);
    fetchAlunosTurma(turma.id);
  };

  const filteredTurmas = turmas.filter((turma) =>
    turma.nome.toLowerCase().includes(searchTerm.toLowerCase()) ||
    turma.cursos?.nome.toLowerCase().includes(searchTerm.toLowerCase()) ||
    turma.tipo_militar.toLowerCase().includes(searchTerm.toLowerCase())
  );

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-3xl font-bold tracking-tight">Turmas</h2>
          <p className="text-muted-foreground">Gerencie as turmas cadastradas</p>
        </div>
        <TurmaForm onSuccess={fetchTurmas} />
      </div>

      <Card className="shadow-card">
        <CardHeader>
          <div className="relative">
            <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
            <Input
              placeholder="Buscar turmas..."
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
          ) : filteredTurmas.length === 0 ? (
            <div className="py-12 text-center">
              <p className="text-muted-foreground">
                {searchTerm ? "Nenhuma turma encontrada" : "Nenhuma turma cadastrada"}
              </p>
            </div>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Nome</TableHead>
                  <TableHead>Curso</TableHead>
                  <TableHead>Ano</TableHead>
                  <TableHead>Tipo</TableHead>
                  <TableHead>Alunos</TableHead>
                  <TableHead className="text-right">Ações</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredTurmas.map((turma) => (
                  <TableRow key={turma.id}>
                    <TableCell className="font-medium">{turma.nome}</TableCell>
                    <TableCell>{turma.cursos?.nome || "-"}</TableCell>
                    <TableCell>{turma.ano}</TableCell>
                    <TableCell>
                      <Badge
                        variant={
                          turma.tipo_militar === "Fuzileiro Naval"
                            ? "default"
                            : "secondary"
                        }
                      >
                        {turma.tipo_militar}
                      </Badge>
                    </TableCell>
                    <TableCell>
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => handleViewAlunos(turma)}
                        className="gap-2"
                      >
                        <Users className="h-4 w-4" />
                        Ver Alunos
                      </Button>
                    </TableCell>
                    <TableCell className="text-right">
                      <div className="flex justify-end gap-2">
                        <TurmaForm turma={turma} onSuccess={fetchTurmas} />
                        <DeleteDialog
                          table="turmas"
                          id={turma.id}
                          name="Turma"
                          onSuccess={fetchTurmas}
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

      <Dialog open={!!selectedTurma} onOpenChange={() => setSelectedTurma(null)}>
        <DialogContent className="max-w-4xl max-h-[80vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>
              Alunos da Turma: {selectedTurma?.nome} ({selectedTurma?.ano})
            </DialogTitle>
          </DialogHeader>
          {loadingAlunos ? (
            <div className="flex items-center justify-center py-12">
              <div className="h-8 w-8 animate-spin rounded-full border-4 border-primary border-t-transparent"></div>
            </div>
          ) : alunosTurma.length === 0 ? (
            <div className="py-12 text-center">
              <p className="text-muted-foreground">Nenhum aluno vinculado a esta turma</p>
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
                </TableRow>
              </TableHeader>
              <TableBody>
                {alunosTurma.map((aluno) => (
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
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}
