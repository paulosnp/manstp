import { useState, useEffect } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Card } from "@/components/ui/card";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { StickyNote, Trash2, Plus } from "lucide-react";
import { format } from "date-fns";
import { useAuth } from "@/contexts/AuthContext";

interface Nota {
  id: string;
  conteudo: string;
  created_at: string;
  updated_at: string;
  user_id: string;
}

interface AlunoNotasDialogProps {
  alunoId: string;
  alunoNome: string;
  turmaId: string | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export function AlunoNotasDialog({
  alunoId,
  alunoNome,
  turmaId,
  open,
  onOpenChange,
}: AlunoNotasDialogProps) {
  const { user } = useAuth();
  const [notas, setNotas] = useState<Nota[]>([]);
  const [loading, setLoading] = useState(false);
  const [novaNota, setNovaNota] = useState("");
  const [addingNote, setAddingNote] = useState(false);

  useEffect(() => {
    if (open && alunoId) {
      fetchNotas();
    }
  }, [open, alunoId]);

  const fetchNotas = async () => {
    setLoading(true);
    try {
      const { data, error } = await supabase
        .from("notas_aluno")
        .select("*")
        .eq("aluno_id", alunoId)
        .order("created_at", { ascending: false });

      if (error) throw error;
      setNotas(data || []);
    } catch (error) {
      console.error("Erro ao carregar notas:", error);
      toast.error("Erro ao carregar notas do aluno");
    } finally {
      setLoading(false);
    }
  };

  const handleAddNota = async () => {
    if (!novaNota.trim()) {
      toast.error("Digite o conteúdo da nota");
      return;
    }

    try {
      const { error } = await supabase.from("notas_aluno").insert({
        aluno_id: alunoId,
        turma_id: turmaId || null,
        user_id: user?.id,
        conteudo: novaNota,
      });

      if (error) throw error;

      toast.success("Nota adicionada com sucesso");
      setNovaNota("");
      setAddingNote(false);
      fetchNotas();
    } catch (error) {
      console.error("Erro ao adicionar nota:", error);
      toast.error("Erro ao adicionar nota");
    }
  };

  const handleDeleteNota = async (notaId: string) => {
    if (!confirm("Tem certeza que deseja excluir esta nota?")) return;

    try {
      const { error } = await supabase
        .from("notas_aluno")
        .delete()
        .eq("id", notaId);

      if (error) throw error;

      toast.success("Nota excluída com sucesso");
      fetchNotas();
    } catch (error) {
      console.error("Erro ao excluir nota:", error);
      toast.error("Erro ao excluir nota");
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl max-h-[80vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <StickyNote className="h-5 w-5" />
            Notas - {alunoNome}
          </DialogTitle>
        </DialogHeader>

        <div className="space-y-4 mt-4">
          {/* Adicionar nova nota */}
          {!addingNote ? (
            <Button
              onClick={() => setAddingNote(true)}
              className="w-full gap-2"
              variant="outline"
            >
              <Plus className="h-4 w-4" />
              Adicionar Nota
            </Button>
          ) : (
            <Card className="p-4 space-y-3">
              <Textarea
                placeholder="Digite sua nota sobre o aluno..."
                value={novaNota}
                onChange={(e) => setNovaNota(e.target.value)}
                className="min-h-[100px]"
              />
              <div className="flex gap-2">
                <Button onClick={handleAddNota} size="sm">
                  Salvar
                </Button>
                <Button
                  onClick={() => {
                    setAddingNote(false);
                    setNovaNota("");
                  }}
                  size="sm"
                  variant="outline"
                >
                  Cancelar
                </Button>
              </div>
            </Card>
          )}

          {/* Lista de notas */}
          {loading ? (
            <p className="text-center text-muted-foreground py-8">
              Carregando notas...
            </p>
          ) : notas.length === 0 ? (
            <Card className="p-8">
              <p className="text-center text-muted-foreground">
                Nenhuma nota registrada para este aluno.
              </p>
            </Card>
          ) : (
            <div className="space-y-3">
              {notas.map((nota) => (
                <Card key={nota.id} className="p-4">
                  <div className="flex justify-between items-start mb-2">
                    <span className="text-xs text-muted-foreground">
                      {format(new Date(nota.created_at), "dd/MM/yyyy HH:mm")}
                    </span>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => handleDeleteNota(nota.id)}
                      className="h-8 w-8 p-0 text-destructive hover:text-destructive"
                    >
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  </div>
                  <p className="whitespace-pre-wrap text-sm">{nota.conteudo}</p>
                </Card>
              ))}
            </div>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
}