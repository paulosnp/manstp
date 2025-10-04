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

export default function Turmas() {
  const { user } = useAuth();
  const [turmas, setTurmas] = useState<Turma[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState("");

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
    </div>
  );
}
