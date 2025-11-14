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
import { Search, Users, X, GraduationCap, FileDown } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Label } from "@/components/ui/label";
import { supabase } from "@/lib/supabase";
import { useAuth } from "@/contexts/AuthContext";
import { useUserRole } from "@/hooks/useUserRole";
import { TurmaForm } from "@/components/TurmaForm";
import { DeleteDialog } from "@/components/DeleteDialog";
import { VincularAlunoTurma } from "@/components/VincularAlunoTurma";
import { VincularInstrutorTurma } from "@/components/VincularInstrutorTurma";
import { ImportarAlunos } from "@/components/ImportarAlunos";
import type { Database } from "@/integrations/supabase/types";
import { BulkStatusUpdate } from "@/components/BulkStatusUpdate";
import { BulkCourseInfoUpdate } from "@/components/BulkCourseInfoUpdate";
import { EditAlunoDialog } from "@/components/EditAlunoDialog";
import { toast } from "sonner";
import jsPDF from "jspdf";

interface Turma {
  id: string;
  nome: string;
  curso_id: string;
  ano: number;
  tipo_militar: string;
  observacoes: string | null;
  cursos?: { nome: string };
  aluno_count?: number;
  instrutores?: string[];
}

interface Aluno {
  id: string;
  nome_completo: string;
  graduacao: string;
  tipo_militar: string;
  local_servico?: string;
  status?: string;
  vinculo_id?: string;
  email: string | null;
  telefone: string | null;
  local_curso?: string | null;
  sigla_curso?: string | null;
  data_duracao_curso?: string | null;
}

interface Instrutor {
  id: string;
  nome_completo: string;
  graduacao: string;
  tipo_militar: string;
  especialidade?: string;
  vinculo_id?: string;
  email: string | null;
  telefone: string | null;
}

export default function Turmas() {
  const { user } = useAuth();
  const { isCoordenador } = useUserRole();
  const [turmas, setTurmas] = useState<Turma[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedTurma, setSelectedTurma] = useState<Turma | null>(null);
  const [alunosTurma, setAlunosTurma] = useState<Aluno[]>([]);
  const [instrutoresTurma, setInstrutoresTurma] = useState<Instrutor[]>([]);
  const [loadingAlunos, setLoadingAlunos] = useState(false);
  const [loadingInstrutores, setLoadingInstrutores] = useState(false);
  const [viewType, setViewType] = useState<'alunos' | 'instrutores'>('alunos');
  const [statusFilter, setStatusFilter] = useState<string>("todos");

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
      
      // Buscar contagem de alunos e instrutores para cada turma
      const turmasComContagem = await Promise.all(
        (data || []).map(async (turma) => {
          const { count } = await supabase
            .from("aluno_turma")
            .select("*", { count: "exact", head: true })
            .eq("turma_id", turma.id);
          
          // Buscar instrutores da turma
          const { data: instrutoresData } = await supabase
            .from("instrutor_turma")
            .select("instrutores(nome_completo)")
            .eq("turma_id", turma.id);
          
          const instrutores = instrutoresData?.map((item: any) => item.instrutores?.nome_completo).filter(Boolean) || [];
          
          return { ...turma, aluno_count: count || 0, instrutores };
        })
      );
      
      setTurmas(turmasComContagem);
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
        .select("id, aluno_id, status, local_curso, sigla_curso, data_duracao_curso, alunos(id, nome_completo, graduacao, tipo_militar, local_servico, email, telefone, matricula)")
        .eq("turma_id", turmaId)
        .order("alunos(matricula)", { ascending: true });

      if (error) throw error;
      setAlunosTurma(data?.map((item: any) => ({...item.alunos, vinculo_id: item.id, status: item.status, local_curso: item.local_curso, sigla_curso: item.sigla_curso, data_duracao_curso: item.data_duracao_curso})) || []);
    } catch (error) {
      console.error("Erro ao buscar alunos da turma:", error);
    } finally {
      setLoadingAlunos(false);
    }
  };

  const fetchInstrutoresTurma = async (turmaId: string) => {
    setLoadingInstrutores(true);
    try {
      const { data, error } = await supabase
        .from("instrutor_turma")
        .select("id, instrutor_id, instrutores(id, nome_completo, graduacao, tipo_militar, especialidade, email, telefone)")
        .eq("turma_id", turmaId);

      if (error) throw error;
      setInstrutoresTurma(data?.map((item: any) => ({...item.instrutores, vinculo_id: item.id})) || []);
    } catch (error) {
      console.error("Erro ao buscar instrutores da turma:", error);
    } finally {
      setLoadingInstrutores(false);
    }
  };

  const handleUpdateStatus = async (vinculoId: string, newStatus: string) => {
    try {
      const { error } = await supabase
        .from("aluno_turma")
        .update({ status: newStatus as Database['public']['Enums']['status_aluno'] })
        .eq("id", vinculoId);

      if (error) throw error;
      
      if (selectedTurma) {
        fetchAlunosTurma(selectedTurma.id);
      }
      toast.success("Status atualizado com sucesso");
    } catch (error) {
      console.error("Erro ao atualizar status:", error);
      toast.error("Erro ao atualizar status");
    }
  };

  const handleDesvincular = async (vinculoId: string) => {
    try {
      const { error } = await supabase
        .from("aluno_turma")
        .delete()
        .eq("id", vinculoId);

      if (error) throw error;
      
      if (selectedTurma) {
        fetchAlunosTurma(selectedTurma.id);
      }
      toast.success("Aluno desvinculado com sucesso");
    } catch (error) {
      console.error("Erro ao desvincular aluno:", error);
      toast.error("Erro ao desvincular aluno");
    }
  };

  const handleDesvincularInstrutor = async (vinculoId: string) => {
    try {
      const { error } = await supabase
        .from("instrutor_turma")
        .delete()
        .eq("id", vinculoId);

      if (error) throw error;
      
      if (selectedTurma) {
        fetchInstrutoresTurma(selectedTurma.id);
      }
      toast.success("Instrutor desvinculado com sucesso");
    } catch (error) {
      console.error("Erro ao desvincular instrutor:", error);
      toast.error("Erro ao desvincular instrutor");
    }
  };

  const gerarCertificadosLote = async () => {
    if (!selectedTurma) return;
    
    try {
      const alunosCursando = alunosTurma.filter(a => a.status === "Cursando" || a.status === "Concluído");
      
      if (alunosCursando.length === 0) {
        toast.error("Nenhum aluno cursando ou concluído nesta turma");
        return;
      }

      const pdf = new jsPDF();
      const pageWidth = pdf.internal.pageSize.getWidth();
      const pageHeight = pdf.internal.pageSize.getHeight();

      alunosCursando.forEach((aluno, index) => {
        if (index > 0) pdf.addPage();

        // Certificado
        pdf.setFontSize(24);
        pdf.text("CERTIFICADO", pageWidth / 2, 40, { align: "center" });

        pdf.setFontSize(12);
        pdf.text("Certificamos que", pageWidth / 2, 70, { align: "center" });

        pdf.setFontSize(18);
        pdf.text(aluno.nome_completo, pageWidth / 2, 90, { align: "center" });

        pdf.setFontSize(12);
        pdf.text(`${aluno.graduacao} - ${aluno.tipo_militar}`, pageWidth / 2, 105, { align: "center" });

        pdf.text(`concluiu com êxito o curso da turma ${selectedTurma.nome}`, pageWidth / 2, 130, { align: "center" });
        pdf.text(`no ano de ${selectedTurma.ano}`, pageWidth / 2, 145, { align: "center" });

        if (aluno.sigla_curso) {
          pdf.text(`Curso: ${aluno.sigla_curso}`, pageWidth / 2, 165, { align: "center" });
        }

        if (aluno.local_curso) {
          pdf.text(`Local: ${aluno.local_curso}`, pageWidth / 2, 180, { align: "center" });
        }

        // Data de emissão
        pdf.setFontSize(10);
        pdf.text(`Emitido em: ${new Date().toLocaleDateString("pt-BR")}`, pageWidth / 2, pageHeight - 30, { align: "center" });
      });

      pdf.save(`certificados_${selectedTurma.nome}_${Date.now()}.pdf`);
      toast.success(`${alunosCursando.length} certificado(s) gerado(s) com sucesso`);
    } catch (error) {
      console.error("Erro ao gerar certificados:", error);
      toast.error("Erro ao gerar certificados em lote");
    }
  };

  const handleViewAlunos = (turma: Turma) => {
    setSelectedTurma(turma);
    setViewType('alunos');
    fetchAlunosTurma(turma.id);
  };

  const handleViewInstrutores = (turma: Turma) => {
    setSelectedTurma(turma);
    setViewType('instrutores');
    fetchInstrutoresTurma(turma.id);
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
        {isCoordenador && <TurmaForm onSuccess={fetchTurmas} />}
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
                  <TableHead>Instrutor(es)</TableHead>
                  <TableHead className="text-center">Qtd. Alunos</TableHead>
                  <TableHead className="text-right">Ações</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredTurmas.map((turma) => (
                  <TableRow key={turma.id}>
                    <TableCell className="font-medium">
                      {turma.nome}
                    </TableCell>
                    <TableCell>{turma.cursos?.nome || "-"}</TableCell>
                    <TableCell>{turma.ano}</TableCell>
                    <TableCell>
                      <Badge
                        variant={
                          turma.tipo_militar === "Fuzileiro Naval" ? "default" :
                          turma.tipo_militar === "Marinheiro" ? "secondary" :
                          turma.tipo_militar === "Exercito" ? "outline" :
                          turma.tipo_militar === "Civil" ? "default" :
                          "destructive"
                        }
                      >
                        {turma.tipo_militar}
                      </Badge>
                    </TableCell>
                    <TableCell>
                      {turma.instrutores && turma.instrutores.length > 0 ? (
                        <div className="text-sm">
                          {turma.instrutores.map((instrutor, idx) => (
                            <div key={idx} className="text-muted-foreground">
                              {instrutor}
                            </div>
                          ))}
                        </div>
                      ) : (
                        <span className="text-muted-foreground text-sm">-</span>
                      )}
                    </TableCell>
                    <TableCell className="text-center">
                      <div className="flex flex-col items-center gap-2">
                        <Badge variant="secondary" className="text-base px-3 py-1">
                          {turma.aluno_count || 0}
                        </Badge>
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => handleViewAlunos(turma)}
                          className="gap-2"
                        >
                          <Users className="h-4 w-4" />
                          Gerenciar
                        </Button>
                      </div>
                    </TableCell>
                    <TableCell className="text-right">
                      {isCoordenador && (
                        <div className="flex justify-end gap-2">
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => handleViewInstrutores(turma)}
                            className="gap-2"
                          >
                            <GraduationCap className="h-4 w-4" />
                            Instrutores
                          </Button>
                          <TurmaForm turma={turma} onSuccess={fetchTurmas} />
                          <DeleteDialog
                            table="turmas"
                            id={turma.id}
                            name="Turma"
                            onSuccess={fetchTurmas}
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

      <Dialog open={!!selectedTurma} onOpenChange={() => setSelectedTurma(null)}>
        <DialogContent className="max-w-4xl max-h-[80vh] overflow-y-auto" onInteractOutside={(e) => e.preventDefault()}>
          <DialogHeader>
            <DialogTitle>
              {viewType === 'alunos' ? 'Alunos' : 'Instrutores'} da Turma: {selectedTurma?.nome} ({selectedTurma?.ano})
            </DialogTitle>
          </DialogHeader>
          
          {viewType === 'alunos' && isCoordenador && (
            <>
              <div className="flex flex-wrap gap-2 pb-4 border-b">
                <VincularAlunoTurma
                  turmaId={selectedTurma?.id || ""}
                  turmaNome={selectedTurma?.nome || ""}
                  onSuccess={() => {
                    fetchTurmas();
                    if (selectedTurma?.id) {
                      fetchAlunosTurma(selectedTurma.id);
                    }
                  }}
                />
                <ImportarAlunos
                  turmaId={selectedTurma?.id}
                  onSuccess={() => {
                    fetchTurmas();
                    if (selectedTurma?.id) {
                      fetchAlunosTurma(selectedTurma.id);
                    }
                  }}
                  trigger={
                    <Button variant="outline" size="sm">
                      <Users className="h-4 w-4 mr-2" />
                      Importar Lista
                    </Button>
                  }
                />
                <BulkStatusUpdate
                  turmaId={selectedTurma?.id || ""}
                  turmaNome={selectedTurma?.nome || ""}
                  onSuccess={() => {
                    if (selectedTurma?.id) {
                      fetchAlunosTurma(selectedTurma.id);
                    }
                  }}
                />
                <Button 
                  variant="default" 
                  size="sm"
                  onClick={gerarCertificadosLote}
                  className="gap-2"
                >
                  <FileDown className="h-4 w-4" />
                  Gerar Certificados em Lote
                </Button>
              </div>
              
              <div className="mb-4">
                <BulkCourseInfoUpdate
                  turmaId={selectedTurma?.id || ""}
                  turmaNome={selectedTurma?.nome || ""}
                  totalAlunos={alunosTurma.length}
                  onSuccess={() => {
                    if (selectedTurma?.id) {
                      fetchAlunosTurma(selectedTurma.id);
                    }
                  }}
                />
              </div>
            </>
          )}
          
          {viewType === 'alunos' ? (
            <>
              <div className="flex gap-2 mb-4 items-center">
                <Label className="text-sm font-medium">Filtrar por Status:</Label>
                <Select value={statusFilter} onValueChange={setStatusFilter}>
                  <SelectTrigger className="w-48">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="todos">Todos</SelectItem>
                    <SelectItem value="Aguardando">Aguardando</SelectItem>
                    <SelectItem value="Planejado">Planejado</SelectItem>
                    <SelectItem value="Cursando">Cursando</SelectItem>
                    <SelectItem value="Estagiando">Estagiando</SelectItem>
                    <SelectItem value="Concluído">Concluído</SelectItem>
                    <SelectItem value="Cancelado">Cancelado</SelectItem>
                    <SelectItem value="Reprovado">Reprovado</SelectItem>
                    <SelectItem value="Desligado">Desligado</SelectItem>
                    <SelectItem value="Desertor">Desertor</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              {loadingAlunos ? (
                <div className="flex items-center justify-center py-12">
                  <div className="h-8 w-8 animate-spin rounded-full border-4 border-primary border-t-transparent"></div>
                </div>
              ) : alunosTurma.filter(aluno => statusFilter === "todos" || aluno.status === statusFilter).length === 0 ? (
                <div className="py-12 text-center">
                  <p className="text-muted-foreground">
                    {statusFilter === "todos" 
                      ? "Nenhum aluno vinculado a esta turma" 
                      : `Nenhum aluno com status "${statusFilter}"`}
                  </p>
                </div>
              ) : (
                <Table>
               <TableHeader>
                <TableRow>
                  <TableHead>#</TableHead>
                  <TableHead>Nome</TableHead>
                  <TableHead>Graduação</TableHead>
                  <TableHead>Corpo/Quadro</TableHead>
                  <TableHead>OM de Registro</TableHead>
                  <TableHead>Local</TableHead>
                  <TableHead>Sigla do Curso</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead>Contato</TableHead>
                  <TableHead className="text-right">Ações</TableHead>
                </TableRow>
              </TableHeader>
               <TableBody>
                {alunosTurma.filter(aluno => statusFilter === "todos" || aluno.status === statusFilter).map((aluno, index) => (
                  <TableRow key={aluno.id}>
                    <TableCell className="font-medium">{index + 1}</TableCell>
                    <TableCell className="font-medium">
                      <span className={
                        aluno.status === "Desertor" || aluno.status === "Reprovado" || aluno.status === "Desligado" 
                          ? "text-destructive" 
                          : aluno.status === "Cursando" 
                          ? "text-success" 
                          : ""
                      }>
                        {aluno.nome_completo}
                      </span>
                    </TableCell>
                      <TableCell>{aluno.graduacao}</TableCell>
                      <TableCell>
                        <Badge
                          variant={
                            aluno.tipo_militar === "Fuzileiro Naval" ? "default" :
                            aluno.tipo_militar === "Marinheiro" ? "secondary" :
                            aluno.tipo_militar === "Exercito" ? "outline" :
                            aluno.tipo_militar === "Civil" ? "default" :
                            "destructive"
                          }
                        >
                          {aluno.tipo_militar}
                        </Badge>
                      </TableCell>
                      <TableCell>{aluno.local_servico || "-"}</TableCell>
                      <TableCell>{aluno.local_curso || "-"}</TableCell>
                      <TableCell>{aluno.sigla_curso || "-"}</TableCell>
                      <TableCell>
                        <Select
                          value={aluno.status || "Aguardando"}
                          onValueChange={(value) => handleUpdateStatus(aluno.vinculo_id!, value)}
                        >
                          <SelectTrigger className="w-32">
                            <SelectValue />
                          </SelectTrigger>
                           <SelectContent>
                            <SelectItem value="Aguardando">Aguardando</SelectItem>
                            <SelectItem value="Planejado">Planejado</SelectItem>
                            <SelectItem value="Cursando">Cursando</SelectItem>
                            <SelectItem value="Estagiando">Estagiando</SelectItem>
                            <SelectItem value="Concluído">Concluído</SelectItem>
                            <SelectItem value="Cancelado">Cancelado</SelectItem>
                            <SelectItem value="Reprovado">Reprovado</SelectItem>
                            <SelectItem value="Desligado">Desligado</SelectItem>
                            <SelectItem value="Desertor">Desertor</SelectItem>
                           </SelectContent>
                        </Select>
                      </TableCell>
                      <TableCell>
                        <div className="text-sm">
                          {aluno.email && <div>{aluno.email}</div>}
                          {aluno.telefone && <div className="text-muted-foreground">{aluno.telefone}</div>}
                        </div>
                      </TableCell>
                      <TableCell className="text-right">
                        {isCoordenador && (
                          <div className="flex gap-1 justify-end">
                            <EditAlunoDialog
                              aluno={aluno}
                              onSuccess={() => {
                                if (selectedTurma?.id) {
                                  fetchAlunosTurma(selectedTurma.id);
                                }
                              }}
                            />
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() => handleDesvincular(aluno.vinculo_id!)}
                              className="gap-2"
                            >
                              <X className="h-4 w-4" />
                              Desvincular
                            </Button>
                          </div>
                        )}
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
              )}
            </>
          ) : (
            <>
              {isCoordenador && (
                <div className="flex gap-2 pb-4 border-b">
                  <VincularInstrutorTurma
                    turmaId={selectedTurma?.id || ""}
                    onSuccess={() => {
                      fetchTurmas();
                      if (selectedTurma?.id) {
                        fetchInstrutoresTurma(selectedTurma.id);
                      }
                    }}
                  />
                </div>
              )}
              {loadingInstrutores ? (
                <div className="flex items-center justify-center py-12">
                  <div className="h-8 w-8 animate-spin rounded-full border-4 border-primary border-t-transparent"></div>
                </div>
              ) : instrutoresTurma.length === 0 ? (
                <div className="py-12 text-center">
                  <p className="text-muted-foreground">Nenhum instrutor vinculado a esta turma</p>
                </div>
              ) : (
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Nome</TableHead>
                      <TableHead>Graduação</TableHead>
                      <TableHead>Tipo</TableHead>
                      <TableHead>Especialidade</TableHead>
                      <TableHead>Contato</TableHead>
                      <TableHead className="text-right">Ações</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {instrutoresTurma.map((instrutor) => (
                      <TableRow key={instrutor.id}>
                        <TableCell className="font-medium">{instrutor.nome_completo}</TableCell>
                        <TableCell>{instrutor.graduacao}</TableCell>
                        <TableCell>
                          <Badge
                            variant={
                              instrutor.tipo_militar === "Fuzileiro Naval" ? "default" :
                              instrutor.tipo_militar === "Marinheiro" ? "secondary" :
                              instrutor.tipo_militar === "Exercito" ? "outline" :
                              "destructive"
                            }
                          >
                            {instrutor.tipo_militar}
                          </Badge>
                        </TableCell>
                        <TableCell>{instrutor.especialidade || "-"}</TableCell>
                        <TableCell>
                          <div className="text-sm">
                            {instrutor.email && <div>{instrutor.email}</div>}
                            {instrutor.telefone && <div className="text-muted-foreground">{instrutor.telefone}</div>}
                          </div>
                        </TableCell>
                        <TableCell className="text-right">
                          {isCoordenador && (
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() => handleDesvincularInstrutor(instrutor.vinculo_id!)}
                              className="gap-2"
                            >
                              <X className="h-4 w-4" />
                              Desvincular
                            </Button>
                          )}
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              )}
            </>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}
