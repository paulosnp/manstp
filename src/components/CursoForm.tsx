import { useState } from "react";
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
import { cursoSchema } from "@/lib/validations";

interface Curso {
  id: string;
  nome: string;
  instituicao: string | null;
  local_realizacao: string | null;
  tipo_curso: string | null;
  modalidade: string | null;
  data_inicio: string | null;
  data_fim: string | null;
  situacao: string | null;
  categoria: string | null;
  observacoes: string | null;
}

interface CursoFormProps {
  curso?: Curso;
  onSuccess: () => void;
}

export function CursoForm({ curso, onSuccess }: CursoFormProps) {
  const { user } = useAuth();
  const [open, setOpen] = useState(false);
  const [loading, setLoading] = useState(false);
  const [formData, setFormData] = useState<{
    nome: string;
    instituicao: string;
    local_realizacao: string;
    tipo_curso: string;
    modalidade: string;
    data_inicio: string;
    data_fim: string;
    situacao: string;
    categoria: string;
    observacoes: string;
  }>({
    nome: curso?.nome || "",
    instituicao: curso?.instituicao || "",
    local_realizacao: curso?.local_realizacao || "",
    tipo_curso: curso?.tipo_curso || "",
    modalidade: curso?.modalidade || "",
    data_inicio: curso?.data_inicio || "",
    data_fim: curso?.data_fim || "",
    situacao: curso?.situacao || "Em Andamento",
    categoria: curso?.categoria || "",
    observacoes: curso?.observacoes || "",
  });

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user) return;

    // Validate form data
    const validation = cursoSchema.safeParse(formData);
    if (!validation.success) {
      const firstError = validation.error.errors[0];
      toast.error(firstError.message);
      return;
    }

    setLoading(true);
    try {
      if (curso) {
        const { error } = await supabase
          .from("cursos")
          .update(formData as any)
          .eq("id", curso.id);

        if (error) throw error;
        toast.success("Curso atualizado com sucesso");
      } else {
        const { error } = await supabase
          .from("cursos")
          .insert([{ ...formData, user_id: user.id } as any]);

        if (error) throw error;
        toast.success("Curso cadastrado com sucesso");
      }

      setOpen(false);
      onSuccess();
      if (!curso) {
        setFormData({
          nome: "",
          instituicao: "",
          local_realizacao: "",
          tipo_curso: "",
          modalidade: "",
          data_inicio: "",
          data_fim: "",
          situacao: "Em Andamento",
          categoria: "",
          observacoes: "",
        });
      }
    } catch (error) {
      console.error("Erro ao salvar curso:", error);
      toast.error("Erro ao salvar curso");
    } finally {
      setLoading(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        {curso ? (
          <Button variant="ghost" size="icon">
            <Pencil className="h-4 w-4" />
          </Button>
        ) : (
          <Button className="gap-2">
            <Plus className="h-4 w-4" />
            Novo Curso
          </Button>
        )}
      </DialogTrigger>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>{curso ? "Editar Curso" : "Novo Curso"}</DialogTitle>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="grid gap-4 md:grid-cols-2">
            <div className="space-y-2 md:col-span-2">
              <Label htmlFor="nome">Nome do Curso *</Label>
              <Input
                id="nome"
                required
                value={formData.nome}
                onChange={(e) => setFormData({ ...formData, nome: e.target.value })}
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="instituicao">Instituição</Label>
              <Input
                id="instituicao"
                value={formData.instituicao}
                onChange={(e) => setFormData({ ...formData, instituicao: e.target.value })}
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="categoria">Categoria</Label>
              <Input
                id="categoria"
                value={formData.categoria}
                onChange={(e) => setFormData({ ...formData, categoria: e.target.value })}
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="local_realizacao">País onde é Realizado</Label>
              <Select
                value={formData.local_realizacao}
                onValueChange={(value) => setFormData({ ...formData, local_realizacao: value })}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Selecione o país" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="São Tomé">São Tomé</SelectItem>
                  <SelectItem value="Brasil">Brasil</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label htmlFor="tipo_curso">Tipo de Curso</Label>
              <Select
                value={formData.tipo_curso}
                onValueChange={(value) => setFormData({ ...formData, tipo_curso: value })}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Selecione o tipo" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="Expedito">Expedito</SelectItem>
                  <SelectItem value="Carreira">Carreira</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label htmlFor="modalidade">Modalidade</Label>
              <Select
                value={formData.modalidade}
                onValueChange={(value) => setFormData({ ...formData, modalidade: value })}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Selecione a modalidade" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="Presencial">Presencial</SelectItem>
                  <SelectItem value="Semipresencial">Semipresencial</SelectItem>
                  <SelectItem value="A Distância">A Distância</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label htmlFor="data_inicio">Data de Início</Label>
              <Input
                id="data_inicio"
                type="date"
                value={formData.data_inicio}
                onChange={(e) => setFormData({ ...formData, data_inicio: e.target.value })}
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="data_fim">Data de Término</Label>
              <Input
                id="data_fim"
                type="date"
                value={formData.data_fim}
                onChange={(e) => setFormData({ ...formData, data_fim: e.target.value })}
              />
            </div>

            <div className="space-y-2 md:col-span-2">
              <Label htmlFor="situacao">Situação</Label>
              <Select
                value={formData.situacao}
                onValueChange={(value) => setFormData({ ...formData, situacao: value })}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="Em Andamento">Em Andamento</SelectItem>
                  <SelectItem value="Concluído">Concluído</SelectItem>
                  <SelectItem value="Cancelado">Cancelado</SelectItem>
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
