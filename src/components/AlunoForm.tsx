import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { CustomizableSelect } from "@/components/ui/customizable-select";
import { Textarea } from "@/components/ui/textarea";
import { Plus, Pencil } from "lucide-react";
import { supabase } from "@/lib/supabase";
import { useAuth } from "@/contexts/AuthContext";
import { toast } from "sonner";
import { alunoSchema } from "@/lib/validations";
import { useTranslation } from "react-i18next";
import type { Database } from "@/integrations/supabase/types";

interface Aluno {
  id: string;
  nome_completo: string;
  graduacao: string;
  tipo_militar: string;
  telefone: string | null;
  email: string | null;
  observacoes: string | null;
}

interface AlunoFormProps {
  aluno?: Aluno;
  onSuccess: () => void;
}

export function AlunoForm({ aluno, onSuccess }: AlunoFormProps) {
  const { user } = useAuth();
  const { t } = useTranslation();

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
  const [open, setOpen] = useState(false);
  const [loading, setLoading] = useState(false);
  const [formData, setFormData] = useState<{
    nome_completo: string;
    graduacao: string;
    tipo_militar: string;
    local_servico: string;
    telefone: string;
    email: string;
    observacoes: string;
  }>({
    nome_completo: aluno?.nome_completo || "",
    graduacao: aluno?.graduacao || "",
    tipo_militar: aluno?.tipo_militar || "",
    local_servico: (aluno as any)?.local_servico || "",
    telefone: aluno?.telefone || "",
    email: aluno?.email || "",
    observacoes: aluno?.observacoes || "",
  });

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user) return;

    const validation = alunoSchema.safeParse(formData);
    if (!validation.success) {
      const firstError = validation.error.errors[0];
      toast.error(firstError.message);
      return;
    }

    setLoading(true);
    try {
      if (aluno) {
        const { error } = await supabase
          .from("alunos")
          .update(formData as Database['public']['Tables']['alunos']['Update'])
          .eq("id", aluno.id);

        if (error) throw error;
        toast.success(t("studentUpdatedSuccess"));
      } else {
        const { error } = await supabase
          .from("alunos")
          .insert([{ ...formData, user_id: user.id } as Database['public']['Tables']['alunos']['Insert']]);

        if (error) throw error;
        toast.success(t("studentRegisteredSuccess"));
      }

      onSuccess();
      if (!aluno) {
        setFormData({
          nome_completo: "",
          graduacao: "",
          tipo_militar: "",
          local_servico: "",
          telefone: "",
          email: "",
          observacoes: "",
        });
      }
    } catch (error) {
      console.error("Erro ao salvar aluno:", error);
      toast.error(t("errorSavingStudent"));
    } finally {
      setLoading(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        {aluno ? (
          <Button variant="ghost" size="icon">
            <Pencil className="h-4 w-4" />
          </Button>
        ) : (
          <Button className="gap-2">
            <Plus className="h-4 w-4" />
            {t("newStudent")}
          </Button>
        )}
      </DialogTrigger>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto" onInteractOutside={(e) => e.preventDefault()}>
        <DialogHeader>
          <DialogTitle>{aluno ? t("editStudent") : t("newStudent")}</DialogTitle>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="grid gap-4 md:grid-cols-2">
            <div className="space-y-2">
              <Label htmlFor="nome_completo">{t("fullName")} *</Label>
              <Input
                id="nome_completo"
                required
                value={formData.nome_completo}
                onChange={(e) => setFormData({ ...formData, nome_completo: e.target.value })}
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="graduacao">{t("rank")} *</Label>
              <CustomizableSelect
                required
                value={formData.graduacao}
                onValueChange={(value) => setFormData({ ...formData, graduacao: value })}
                disabled={formData.tipo_militar === "Civil"}
                defaultOptions={rankOptions}
                placeholder={t("selectRank")}
                storageKey="custom_graduacao_alunos"
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="tipo_militar">{t("militaryType")} *</Label>
              <CustomizableSelect
                required
                value={formData.tipo_militar}
                onValueChange={(value) => {
                  setFormData({ 
                    ...formData, 
                    tipo_militar: value,
                    graduacao: value === "Civil" ? t("ranks.nenhuma") : formData.graduacao,
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
                placeholder={t("selectType")}
                storageKey="custom_tipo_militar_alunos"
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="local_servico">OM ONDE SERVE *</Label>
              <CustomizableSelect
                required
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

            <div className="space-y-2">
              <Label htmlFor="telefone">{t("phone")}</Label>
              <Input
                id="telefone"
                type="tel"
                value={formData.telefone}
                onChange={(e) => setFormData({ ...formData, telefone: e.target.value })}
              />
            </div>

            <div className="space-y-2 md:col-span-2">
              <Label htmlFor="email">{t("email")}</Label>
              <Input
                id="email"
                type="email"
                value={formData.email}
                onChange={(e) => setFormData({ ...formData, email: e.target.value })}
              />
            </div>

            <div className="space-y-2 md:col-span-2">
              <Label htmlFor="observacoes">{t("observations")}</Label>
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
              {t("cancel")}
            </Button>
            <Button type="submit" disabled={loading}>
              {loading ? t("saving") : t("save")}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}
