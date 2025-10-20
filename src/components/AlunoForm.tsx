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

  const rankKeys = [
    "brigadeiro", "coronel", "capitao_mar_guerra", "tenente_coronel",
    "capitao_fragata", "major", "capitao_tenente", "capitao",
    "primeiro_tenente", "tenente", "segundo_tenente", "alferes",
    "guarda_marinha", "aspirante", "subtenente", "primeiro_cabo", "sargento_mor", "sargento_chefe",
    "sargento_ajudante", "primeiro_sargento", "segundo_sargento", "terceiro_sargento",
    "furriel", "primeiro_subsargento", "segundo_furriel", "suboficial",
    "subsargento", "cabo_secao", "cabo", "segundo_cabo", "segundo_marinheiro",
    "marinheiro", "soldado", "grumete", "civil", "armada"
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

      setOpen(false);
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
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
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
              <Select
                required
                value={formData.graduacao}
                onValueChange={(value) => setFormData({ ...formData, graduacao: value })}
                disabled={formData.tipo_militar === "Civil"}
              >
                <SelectTrigger>
                  <SelectValue placeholder={t("selectRank")} />
                </SelectTrigger>
                <SelectContent className="max-h-[300px] overflow-y-auto bg-background">
                  {rankKeys.map((key) => (
                    <SelectItem key={key} value={t(`ranks.${key}`)}>
                      {t(`ranks.${key}`)}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label htmlFor="tipo_militar">{t("militaryType")} *</Label>
              <Select
                required
                value={formData.tipo_militar}
                onValueChange={(value) => {
                  setFormData({ 
                    ...formData, 
                    tipo_militar: value,
                    graduacao: value === "Civil" ? t("ranks.civil") : formData.graduacao,
                    local_servico: value === "Civil" ? "Nenhuma" : formData.local_servico
                  });
                }}
              >
                <SelectTrigger>
                  <SelectValue placeholder={t("selectType")} />
                </SelectTrigger>
                <SelectContent className="bg-background">
                  <SelectItem value="Fuzileiro Naval">Fuzileiro Naval</SelectItem>
                  <SelectItem value="Guarda Costeiro">Guarda Costeiro</SelectItem>
                  <SelectItem value="Marinha do Brasil">Marinha do Brasil</SelectItem>
                  <SelectItem value="Exercito">Exército</SelectItem>
                  <SelectItem value="Bombeiro">Bombeiro</SelectItem>
                  <SelectItem value="ENAPORT">ENAPORT</SelectItem>
                  <SelectItem value="Civil">Civil</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label htmlFor="local_servico">OM ONDE SERVE *</Label>
              <Select
                required
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
                  <SelectItem value="Ministério da Defesa">Ministério da Defesa</SelectItem>
                  <SelectItem value="Missão UPDE">Missão UPDE</SelectItem>
                </SelectContent>
              </Select>
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
