import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { instrutorSchema } from "@/lib/validations";
import { useTranslation } from "react-i18next";

interface InstrutorFormProps {
  instrutor?: any;
  onSuccess: () => void;
  onCancel: () => void;
}

export function InstrutorForm({ instrutor, onSuccess, onCancel }: InstrutorFormProps) {
  const { t } = useTranslation();
  const [formData, setFormData] = useState({
    nome_completo: instrutor?.nome_completo || "",
    graduacao: instrutor?.graduacao || "",
    tipo_militar: instrutor?.tipo_militar || "",
    especialidade: instrutor?.especialidade || "",
    telefone: instrutor?.telefone || "",
    email: instrutor?.email || "",
  });

  const rankKeys = [
    "brigadeiro", "coronel", "capitao_mar_guerra", "tenente_coronel",
    "capitao_fragata", "major", "capitao_tenente", "capitao",
    "primeiro_tenente", "tenente", "segundo_tenente", "alferes",
    "guarda_marinha", "aspirante", "subtenente", "sargento_mor", "sargento_chefe",
    "sargento_ajudante", "primeiro_sargento", "segundo_sargento", "terceiro_sargento",
    "furriel", "primeiro_subsargento", "segundo_furriel", "suboficial",
    "subsargento", "cabo_secao", "cabo", "segundo_cabo", "segundo_marinheiro",
    "soldado", "grumete"
  ];

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    const validation = instrutorSchema.safeParse(formData);
    if (!validation.success) {
      const firstError = validation.error.errors[0];
      toast.error(firstError.message);
      return;
    }

    const { data: { user } } = await supabase.auth.getUser();
    if (!user) {
      toast.error(t("userNotAuthenticated"));
      return;
    }

    if (instrutor) {
      const { error } = await supabase
        .from("instrutores")
        .update(formData)
        .eq("id", instrutor.id);

      if (error) {
        toast.error(t("errorSavingInstructor"));
        return;
      }
      toast.success(t("instructorUpdatedSuccess"));
    } else {
      const { error } = await supabase
        .from("instrutores")
        .insert([{ ...formData, user_id: user.id }]);

      if (error) {
        toast.error(t("errorSavingInstructor"));
        return;
      }
      toast.success(t("instructorRegisteredSuccess"));
    }

    onSuccess();
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div>
        <Label htmlFor="nome_completo">{t("fullName")} *</Label>
        <Input
          id="nome_completo"
          value={formData.nome_completo}
          onChange={(e) =>
            setFormData({ ...formData, nome_completo: e.target.value })
          }
          required
        />
      </div>

      <div>
        <Label htmlFor="graduacao">{t("rank")} *</Label>
        <Select
          value={formData.graduacao}
          onValueChange={(value) =>
            setFormData({ ...formData, graduacao: value })
          }
          required
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

      <div>
        <Label htmlFor="tipo_militar">{t("militaryType")} *</Label>
        <Select
          value={formData.tipo_militar}
          onValueChange={(value) =>
            setFormData({ ...formData, tipo_militar: value })
          }
          required
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
          </SelectContent>
        </Select>
      </div>

      <div>
        <Label htmlFor="especialidade">{t("specialty")}</Label>
        <Input
          id="especialidade"
          value={formData.especialidade}
          onChange={(e) =>
            setFormData({ ...formData, especialidade: e.target.value })
          }
        />
      </div>

      <div>
        <Label htmlFor="telefone">{t("phone")}</Label>
        <Input
          id="telefone"
          value={formData.telefone}
          onChange={(e) =>
            setFormData({ ...formData, telefone: e.target.value })
          }
        />
      </div>

      <div>
        <Label htmlFor="email">{t("email")}</Label>
        <Input
          id="email"
          type="email"
          value={formData.email}
          onChange={(e) =>
            setFormData({ ...formData, email: e.target.value })
          }
        />
      </div>

      <div className="flex gap-2 justify-end">
        <Button type="button" variant="outline" onClick={onCancel}>
          {t("cancel")}
        </Button>
        <Button type="submit">
          {instrutor ? t("update") : t("register")}
        </Button>
      </div>
    </form>
  );
}
