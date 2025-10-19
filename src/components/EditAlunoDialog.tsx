import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
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
    status: aluno.status || "Cursando",
  });

  const rankKeys = [
    "brigadeiro", "coronel", "capitao_mar_guerra", "tenente_coronel",
    "capitao_fragata", "major", "capitao_tenente", "capitao",
    "primeiro_tenente", "tenente", "segundo_tenente", "alferes",
    "guarda_marinha", "aspirante", "subtenente", "primeiro_cabo", "sargento_mor", "sargento_chefe",
    "sargento_ajudante", "primeiro_sargento", "segundo_sargento", "terceiro_sargento",
    "furriel", "primeiro_subsargento", "segundo_furriel", "suboficial",
    "subsargento", "cabo_secao", "cabo", "segundo_cabo", "segundo_marinheiro",
    "marinheiro", "soldado", "grumete", "civil"
  ];

  const rankMap: { [key: string]: string } = {
    "Brigadeiro": "Brigadeiro",
    "Coronel": "Coronel",
    "Capitão de Mar e Guerra": "Capitão de Mar e Guerra",
    "Tenente Coronel": "Tenente Coronel",
    "Capitão de Fragata": "Capitão de Fragata",
    "Major": "Major",
    "Capitão Tenente": "Capitão Tenente",
    "Capitão": "Capitão",
    "Primeiro Tenente": "Primeiro Tenente",
    "Tenente": "Tenente",
    "Segundo Tenente": "Segundo Tenente",
    "Alferes": "Alferes",
    "Guarda Marinha": "Guarda Marinha",
    "Aspirante": "Aspirante",
    "Subtenente": "Subtenente",
    "Primeiro Cabo": "Primeiro Cabo",
    "Sargento Mor": "Sargento Mor",
    "Sargento Chefe": "Sargento Chefe",
    "Sargento Ajudante": "Sargento Ajudante",
    "Primeiro Sargento": "Primeiro Sargento",
    "Segundo Sargento": "Segundo Sargento",
    "Terceiro Sargento": "Terceiro Sargento",
    "Furriel": "Furriel",
    "Primeiro Subsargento": "Primeiro Subsargento",
    "Segundo Furriel": "Segundo Furriel",
    "Suboficial": "Suboficial",
    "Subsargento": "Subsargento",
    "Cabo de Seção": "Cabo de Seção",
    "Cabo": "Cabo",
    "Segundo Cabo": "Segundo Cabo",
    "Segundo Marinheiro": "Segundo Marinheiro",
    "Marinheiro": "Marinheiro",
    "Soldado": "Soldado",
    "Grumete": "Grumete",
    "Civil": "Civil"
  };

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
          .update({ status: formData.status as Database['public']['Enums']['status_aluno'] })
          .eq("id", aluno.vinculo_id);

        if (statusError) throw statusError;
      }

      toast.success("Aluno atualizado com sucesso!");
      setOpen(false);
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
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
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
              <Select
                required
                value={formData.graduacao}
                onValueChange={(value) => setFormData({ ...formData, graduacao: value })}
                disabled={formData.tipo_militar === "Civil"}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Selecione o posto" />
                </SelectTrigger>
                <SelectContent className="max-h-[300px] overflow-y-auto bg-background">
                  {Object.entries(rankMap).map(([key, value]) => (
                    <SelectItem key={key} value={key}>
                      {value}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label>Tipo Militar *</Label>
              <Select
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
              >
                <SelectTrigger>
                  <SelectValue placeholder="Selecione o tipo" />
                </SelectTrigger>
                <SelectContent className="bg-background">
                  <SelectItem value="Fuzileiro Naval">Fuzileiro Naval</SelectItem>
                  <SelectItem value="Guarda Costeiro">Guarda Costeiro</SelectItem>
                  <SelectItem value="Marinha do Brasil">Marinha do Brasil</SelectItem>
                  <SelectItem value="Exercito">Exército</SelectItem>
                  <SelectItem value="Bombeiro">Bombeiro</SelectItem>
                  <SelectItem value="Civil">Civil</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2 md:col-span-2">
              <Label>OM ONDE SERVE</Label>
              <Select
                value={formData.local_servico}
                onValueChange={(value) => setFormData({ ...formData, local_servico: value })}
                disabled={formData.tipo_militar === "Civil"}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Selecione a OM" />
                </SelectTrigger>
                <SelectContent className="bg-background">
                  <SelectItem value="Nenhuma">Nenhuma</SelectItem>
                  <SelectItem value="Guarda Costeira">Guarda Costeira</SelectItem>
                  <SelectItem value="Quartel de Fuzileiros">Quartel de Fuzileiros</SelectItem>
                  <SelectItem value="Exército">Exército</SelectItem>
                  <SelectItem value="Palácio do Governo">Palácio do Governo</SelectItem>
                  <SelectItem value="Bombeiros">Bombeiros</SelectItem>
                  <SelectItem value="Polícia">Polícia</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2 md:col-span-2">
              <Label>Status na Turma</Label>
              <Select
                value={formData.status}
                onValueChange={(value) => setFormData({ ...formData, status: value })}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="Cursando">Cursando</SelectItem>
                  <SelectItem value="Concluído">Concluído</SelectItem>
                  <SelectItem value="Reprovado">Reprovado</SelectItem>
                  <SelectItem value="Desligado">Desligado</SelectItem>
                  <SelectItem value="Desertor">Desertor</SelectItem>
                </SelectContent>
              </Select>
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
