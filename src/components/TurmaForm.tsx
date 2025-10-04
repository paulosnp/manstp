import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { Plus, Pencil } from "lucide-react";
import { supabase } from "@/lib/supabase";
import { useAuth } from "@/contexts/AuthContext";
import { toast } from "sonner";

interface Turma {
  id: string;
  nome: string;
  curso_id: string;
  ano: number;
  tipo_militar: string;
  observacoes: string | null;
}

interface TurmaFormProps {
  turma?: Turma;
  onSuccess: () => void;
}

export function TurmaForm({ turma, onSuccess }: TurmaFormProps) {
  const { user } = useAuth();
  const [open, setOpen] = useState(false);
  const [loading, setLoading] = useState(false);
  const [cursos, setCursos] = useState<any[]>([]);
  const [formData, setFormData] = useState<{
    nome: string;
    curso_id: string;
    ano: number;
    tipo_militar: string;
    observacoes: string;
  }>({
    nome: turma?.nome || "",
    curso_id: turma?.curso_id || "",
    ano: turma?.ano || new Date().getFullYear(),
    tipo_militar: turma?.tipo_militar || "",
    observacoes: turma?.observacoes || "",
  });

  useEffect(() => {
    fetchCursos();
  }, []);

  const fetchCursos = async () => {
    const { data } = await supabase
      .from("cursos")
      .select("id, nome")
      .order("nome");
    if (data) setCursos(data);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user) return;

    setLoading(true);
    try {
      if (turma) {
        const { error } = await supabase
          .from("turmas")
          .update(formData as any)
          .eq("id", turma.id);

        if (error) throw error;
        toast.success("Turma atualizada com sucesso");
      } else {
        const { error } = await supabase
          .from("turmas")
          .insert([{ ...formData, user_id: user.id } as any]);

        if (error) throw error;
        toast.success("Turma cadastrada com sucesso");
      }

      setOpen(false);
      onSuccess();
      if (!turma) {
        setFormData({
          nome: "",
          curso_id: "",
          ano: new Date().getFullYear(),
          tipo_militar: "",
          observacoes: "",
        });
      }
    } catch (error) {
      console.error("Erro ao salvar turma:", error);
      toast.error("Erro ao salvar turma");
    } finally {
      setLoading(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        {turma ? (
          <Button variant="ghost" size="icon">
            <Pencil className="h-4 w-4" />
          </Button>
        ) : (
          <Button className="gap-2">
            <Plus className="h-4 w-4" />
            Nova Turma
          </Button>
        )}
      </DialogTrigger>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>{turma ? "Editar Turma" : "Nova Turma"}</DialogTitle>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="grid gap-4 md:grid-cols-2">
            <div className="space-y-2 md:col-span-2">
              <Label htmlFor="nome">Nome da Turma *</Label>
              <Input
                id="nome"
                required
                value={formData.nome}
                onChange={(e) => setFormData({ ...formData, nome: e.target.value })}
              />
            </div>

            <div className="space-y-2 md:col-span-2">
              <Label htmlFor="curso_id">Curso Vinculado *</Label>
              <Select
                required
                value={formData.curso_id}
                onValueChange={(value) => setFormData({ ...formData, curso_id: value })}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Selecione o curso" />
                </SelectTrigger>
                <SelectContent>
                  {cursos.map((curso) => (
                    <SelectItem key={curso.id} value={curso.id}>
                      {curso.nome}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label htmlFor="ano">Ano *</Label>
              <Input
                id="ano"
                type="number"
                required
                min="1900"
                max="2100"
                value={formData.ano}
                onChange={(e) => setFormData({ ...formData, ano: parseInt(e.target.value) })}
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="tipo_militar">Tipo Militar *</Label>
              <Select
                required
                value={formData.tipo_militar}
                onValueChange={(value) => setFormData({ ...formData, tipo_militar: value })}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Selecione o tipo" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="Fuzileiro Naval">Fuzileiro Naval</SelectItem>
                  <SelectItem value="Não Fuzileiro">Não Fuzileiro</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2 md:col-span-2">
              <Label htmlFor="observacoes">Observações</Label>
              <Textarea
                id="observacoes"
                value={formData.observacoes}
                onChange={(e) => setFormData({ ...formData, observacoes: e.target.value })}
                rows={3}
              />
            </div>
          </div>

          <div className="flex justify-end gap-2">
            <Button type="button" variant="outline" onClick={() => setOpen(false)}>
              Cancelar
            </Button>
            <Button type="submit" disabled={loading}>
              {loading ? "Salvando..." : "Salvar"}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}
