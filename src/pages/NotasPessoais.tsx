import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { useUserRole } from "@/hooks/useUserRole";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { toast } from "sonner";
import { Plus, Trash2, Save, X } from "lucide-react";
import { format } from "date-fns";

interface Nota {
  id: string;
  titulo: string;
  conteudo: string | null;
  created_at: string;
  updated_at: string;
  user_id: string;
}

export default function NotasPessoais() {
  const { user } = useAuth();
  const { isCoordenador } = useUserRole();
  const [notas, setNotas] = useState<Nota[]>([]);
  const [loading, setLoading] = useState(true);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [newNote, setNewNote] = useState({ titulo: "", conteudo: "" });

  useEffect(() => {
    if (user) {
      fetchNotas();
    }
  }, [user]);

  const fetchNotas = async () => {
    try {
      const { data, error } = await supabase
        .from("notas_pessoais" as any)
        .select("*")
        .order("updated_at", { ascending: false });

      if (error) throw error;
      setNotas((data || []) as unknown as Nota[]);
    } catch (error) {
      console.error("Erro ao carregar notas:", error);
      toast.error("Erro ao carregar notas");
    } finally {
      setLoading(false);
    }
  };

  const handleCreate = async () => {
    if (!newNote.titulo.trim()) {
      toast.error("O título é obrigatório");
      return;
    }

    try {
      const { error } = await supabase.from("notas_pessoais" as any).insert({
        user_id: user?.id,
        titulo: newNote.titulo,
        conteudo: newNote.conteudo,
      });

      if (error) throw error;

      toast.success("Nota criada com sucesso");
      setNewNote({ titulo: "", conteudo: "" });
      fetchNotas();
    } catch (error) {
      console.error("Erro ao criar nota:", error);
      toast.error("Erro ao criar nota");
    }
  };

  const handleUpdate = async (id: string, titulo: string, conteudo: string) => {
    try {
      const { error } = await supabase
        .from("notas_pessoais" as any)
        .update({ titulo, conteudo })
        .eq("id", id);

      if (error) throw error;

      toast.success("Nota atualizada com sucesso");
      setEditingId(null);
      fetchNotas();
    } catch (error) {
      console.error("Erro ao atualizar nota:", error);
      toast.error("Erro ao atualizar nota");
    }
  };

  const handleDelete = async (id: string, nota: Nota) => {
    // Usuários não-coordenadores não podem deletar notas
    if (!isCoordenador) {
      toast.error("Apenas coordenadores podem excluir notas");
      return;
    }

    // Coordenadores não podem deletar notas de outros usuários
    if (nota.user_id !== user?.id) {
      toast.error("Você não pode excluir notas criadas por outros usuários");
      return;
    }

    if (!confirm("Tem certeza que deseja excluir esta nota?")) return;

    try {
      const { error } = await supabase
        .from("notas_pessoais" as any)
        .delete()
        .eq("id", id);

      if (error) throw error;

      toast.success("Nota excluída com sucesso");
      fetchNotas();
    } catch (error) {
      console.error("Erro ao excluir nota:", error);
      toast.error("Erro ao excluir nota");
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <p className="text-muted-foreground">Carregando notas...</p>
      </div>
    );
  }

  return (
    <div className="container mx-auto p-6 space-y-6">
      <div className="flex justify-between items-center">
        <h1 className="text-3xl font-bold">Bloco de Notas</h1>
      </div>

      {/* Nova Nota - Apenas coordenadores */}
      {isCoordenador && (
        <Card className="p-6 space-y-4">
          <h2 className="text-xl font-semibold">Nova Nota</h2>
          <Input
            placeholder="Título da nota"
            value={newNote.titulo}
            onChange={(e) => setNewNote({ ...newNote, titulo: e.target.value })}
          />
          <Textarea
            placeholder="Conteúdo da nota..."
            value={newNote.conteudo}
            onChange={(e) => setNewNote({ ...newNote, conteudo: e.target.value })}
            className="min-h-[150px]"
          />
          <Button onClick={handleCreate} className="gap-2">
            <Plus className="h-4 w-4" />
            Criar Nota
          </Button>
        </Card>
      )}

      {/* Lista de Notas */}
      <div className="grid gap-4">
        {notas.length === 0 ? (
          <Card className="p-6">
            <p className="text-center text-muted-foreground">
              Nenhuma nota encontrada. Crie sua primeira nota acima!
            </p>
          </Card>
        ) : (
          notas.map((nota) => (
            <Card key={nota.id} className="p-6 space-y-4">
              {editingId === nota.id ? (
                <EditingNote
                  nota={nota}
                  onSave={handleUpdate}
                  onCancel={() => setEditingId(null)}
                  canEdit={isCoordenador && nota.user_id === user?.id}
                />
              ) : (
                <ViewingNote
                  nota={nota}
                  onEdit={() => setEditingId(nota.id)}
                  onDelete={() => handleDelete(nota.id, nota)}
                  canEdit={isCoordenador && nota.user_id === user?.id}
                  canDelete={isCoordenador && nota.user_id === user?.id}
                />
              )}
            </Card>
          ))
        )}
      </div>
    </div>
  );
}

function ViewingNote({
  nota,
  onEdit,
  onDelete,
  canEdit,
  canDelete,
}: {
  nota: Nota;
  onEdit: () => void;
  onDelete: () => void;
  canEdit: boolean;
  canDelete: boolean;
}) {
  return (
    <>
      <div className="flex justify-between items-start">
        <div className="flex-1">
          <h3 className="text-xl font-semibold">{nota.titulo}</h3>
          <p className="text-sm text-muted-foreground">
            Atualizado em {format(new Date(nota.updated_at), "dd/MM/yyyy HH:mm")}
          </p>
        </div>
        {(canEdit || canDelete) && (
          <div className="flex gap-2">
            {canEdit && (
              <Button variant="outline" size="sm" onClick={onEdit}>
                Editar
              </Button>
            )}
            {canDelete && (
              <Button
                variant="destructive"
                size="sm"
                onClick={onDelete}
                className="gap-2"
              >
                <Trash2 className="h-4 w-4" />
              </Button>
            )}
          </div>
        )}
      </div>
      {nota.conteudo && (
        <p className="whitespace-pre-wrap text-foreground">{nota.conteudo}</p>
      )}
    </>
  );
}

function EditingNote({
  nota,
  onSave,
  onCancel,
  canEdit,
}: {
  nota: Nota;
  onSave: (id: string, titulo: string, conteudo: string) => void;
  onCancel: () => void;
  canEdit: boolean;
}) {
  const [titulo, setTitulo] = useState(nota.titulo);
  const [conteudo, setConteudo] = useState(nota.conteudo || "");

  if (!canEdit) {
    return (
      <div className="p-4 border border-destructive rounded-md">
        <p className="text-destructive">Você não tem permissão para editar esta nota.</p>
        <Button variant="outline" onClick={onCancel} className="mt-4 gap-2">
          <X className="h-4 w-4" />
          Voltar
        </Button>
      </div>
    );
  }

  return (
    <>
      <Input
        value={titulo}
        onChange={(e) => setTitulo(e.target.value)}
        placeholder="Título da nota"
      />
      <Textarea
        value={conteudo}
        onChange={(e) => setConteudo(e.target.value)}
        placeholder="Conteúdo da nota..."
        className="min-h-[150px]"
      />
      <div className="flex gap-2">
        <Button
          onClick={() => onSave(nota.id, titulo, conteudo)}
          className="gap-2"
        >
          <Save className="h-4 w-4" />
          Salvar
        </Button>
        <Button variant="outline" onClick={onCancel} className="gap-2">
          <X className="h-4 w-4" />
          Cancelar
        </Button>
      </div>
    </>
  );
}