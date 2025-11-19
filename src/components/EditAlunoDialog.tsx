import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { CustomizableSelect } from "@/components/ui/customizable-select";
import { Textarea } from "@/components/ui/textarea";
import { Pencil } from "lucide-react";
import { supabase } from "@/lib/supabase";
import { toast } from "sonner";
import type { Database } from "@/integrations/supabase/types";

interface Aluno {
  id: string;
  nome_completo: string;
  graduacao: string;
  tipo_militar: string;
  local_servico?: string;
  observacoes?: string | null;
  status?: string;
  vinculo_id?: string;
  local_curso?: string | null;
  sigla_curso?: string | null;
}

interface EditAlunoDialogProps {
  aluno: Aluno;
  onSuccess: () => void;
}

export function EditAlunoDialog({ aluno, onSuccess }: EditAlunoDialogProps) {
  const [open, setOpen] = useState(false);
  const [loading, setLoading] = useState(false);
  const [formData, setFormData] = useState({
    nome_completo: aluno.nome_completo,
    graduacao: aluno.graduacao,
    tipo_militar: aluno.tipo_militar,
    local_servico: aluno.local_servico || "",
    observacoes: aluno.observacoes || "",
    status: aluno.status || "Aguardando",
    local_curso: aluno.local_curso || "",
    sigla_curso: aluno.sigla_curso || "",
  });

  const rankOptions = [
    "Brigadeiro", "Coronel", "Capitão de Mar e Guerra", "Tenente Coronel",
    "Capitão de Fragata", "Major", "Capitão Tenente", "Capitão",
    "Primeiro Tenente", "Tenente", "Segundo Tenente", "Alferes",
    "Guarda Marinha", "Aspirante", "Subtenente", "Primeiro Cabo", "Sargento Mor", "Sargento Chefe",
    "Sargento Ajudante", "Primeiro Sargento", "Segundo Sargento", "Terceiro Sargento",
    "Furriel", "Primeiro Subsargento", "Segundo Furriel", "Suboficial",
    "Subsargento", "Cabo de Seção", "Cabo", "Segundo Cabo", "Segundo Marinheiro",
    "Marinheiro", "Soldado", "Grumete", "Civil", "Armada"
  ];

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    
    try {
      // Update aluno data
      const { error: alunoError } = await supabase
        .from("alunos")
        .update({
          nome_completo: formData.nome_completo,
          graduacao: formData.graduacao as Database['public']['Enums']['graduacao_militar'],
          tipo_militar: formData.tipo_militar as Database['public']['Enums']['tipo_militar'],
          local_servico: formData.local_servico,
          observacoes: formData.observacoes,
        })
        .eq("id", aluno.id);

      if (alunoError) throw alunoError;

      // Update status in aluno_turma
      if (aluno.vinculo_id) {
        const { error: statusError } = await supabase
          .from("aluno_turma")
          .update({ 
            status: formData.status as Database['public']['Enums']['status_aluno'],
            local_curso: formData.local_curso || null,
            sigla_curso: formData.sigla_curso || null
          })
          .eq("id", aluno.vinculo_id);

        if (statusError) throw statusError;
      }

      toast.success("Aluno atualizado com sucesso!");
      onSuccess();
    } catch (error) {
      console.error("Erro ao atualizar aluno:", error);
      toast.error("Erro ao atualizar aluno");
    } finally {
      setLoading(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button variant="ghost" size="icon">
          <Pencil className="h-4 w-4" />
        </Button>
      </DialogTrigger>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto" onInteractOutside={(e) => e.preventDefault()}>
        <DialogHeader>
          <DialogTitle>Editar Aluno</DialogTitle>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="grid gap-4 md:grid-cols-2">
            <div className="space-y-2 md:col-span-2">
              <Label>Nome Completo *</Label>
              <Input
                required
                value={formData.nome_completo}
                onChange={(e) => setFormData({ ...formData, nome_completo: e.target.value })}
              />
            </div>

            <div className="space-y-2">
              <Label>Posto / Graduação *</Label>
              <CustomizableSelect
                required
                value={formData.graduacao}
                onValueChange={(value) => setFormData({ ...formData, graduacao: value })}
                disabled={formData.tipo_militar === "Civil"}
                defaultOptions={rankOptions}
                placeholder="Selecione o posto"
                storageKey="custom_graduacao_alunos"
              />
            </div>

            <div className="space-y-2">
              <Label>Tipo Militar *</Label>
              <CustomizableSelect
                required
                value={formData.tipo_militar}
                onValueChange={(value) => {
                  setFormData({ 
                    ...formData, 
                    tipo_militar: value,
                    graduacao: value === "Civil" ? "Civil" : formData.graduacao,
                    local_servico: value === "Civil" ? "Nenhuma" : formData.local_servico
                  });
                }}
                defaultOptions={[
                  "Fuzileiro Naval",
                  "Marinheiro",
                  "Marinha do Brasil",
                  "Exercito",
                  "Bombeiro",
                  "EMAP",
                  "Civil"
                ]}
                placeholder="Selecione o tipo"
                storageKey="custom_tipo_militar_alunos"
              />
            </div>

            <div className="space-y-2 md:col-span-2">
              <Label>OM de Registro</Label>
              <CustomizableSelect
                value={formData.local_servico}
                onValueChange={(value) => setFormData({ ...formData, local_servico: value })}
                disabled={formData.tipo_militar === "Civil"}
                defaultOptions={[
                  "Nenhuma",
                  "Guarda Costeira",
                  "Quartel de Fuzileiros",
                  "Exército",
                  "Palácio do Governo",
                  "Bombeiros",
                  "Polícia",
                  "Ministério da Defesa",
                  "Missão UPDE"
                ]}
                placeholder="Selecione a OM"
                storageKey="custom_local_servico_alunos"
              />
            </div>

            <div className="space-y-2 md:col-span-2">
              <Label>Status na Turma</Label>
              <CustomizableSelect
                value={formData.status}
                onValueChange={(value) => setFormData({ ...formData, status: value })}
                defaultOptions={[
                  "Aguardando",
                  "Planejado",
                  "Cursando",
                  "Estagiando",
                  "Concluído",
                  "Cancelado",
                  "Reprovado",
                  "Desligado",
                  "Desertor"
                ]}
                placeholder="Selecione o status"
                storageKey="custom_status_aluno_turma"
              />
            </div>

            <div className="space-y-2">
              <Label>Local</Label>
              <CustomizableSelect
                value={formData.local_curso}
                onValueChange={(value) => setFormData({ ...formData, local_curso: value })}
                defaultOptions={[
                  "BRASIL",
                  "SÃO TOMÉ E PRÍNCIPE"
                ]}
                placeholder="Selecione o local"
                storageKey="custom_local_curso"
              />
            </div>

            <div className="space-y-2">
              <Label>Sigla do Curso</Label>
              <Input
                value={formData.sigla_curso}
                onChange={(e) => setFormData({ ...formData, sigla_curso: e.target.value })}
                placeholder="Digite a sigla do curso"
              />
            </div>

            <div className="space-y-2 md:col-span-2">
              <Label>Observações</Label>
              <Textarea
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
