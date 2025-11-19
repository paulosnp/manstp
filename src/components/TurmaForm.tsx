import { useState, useEffect } from "react";
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
import { turmaSchema } from "@/lib/validations";
import { useTranslation } from "react-i18next";
import type { Database } from "@/integrations/supabase/types";

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
  const { t } = useTranslation();
  const [open, setOpen] = useState(false);
  const [loading, setLoading] = useState(false);
  const [cursos, setCursos] = useState<any[]>([]);
  const [formData, setFormData] = useState<{
    nome: string;
    curso_id: string;
    ano: number;
    tipo_militar: string;
    tipo_militar_outro: string;
    om_registro: string;
    data_inicio: string;
    data_fim: string;
    situacao: string;
    observacoes: string;
  }>({
    nome: turma?.nome || "",
    curso_id: turma?.curso_id || "",
    ano: turma?.ano || new Date().getFullYear(),
    tipo_militar: turma?.tipo_militar || "",
    tipo_militar_outro: (turma as any)?.tipo_militar_outro || "",
    om_registro: (turma as any)?.om_registro || "",
    data_inicio: (turma as any)?.data_inicio || "",
    data_fim: (turma as any)?.data_fim || "",
    situacao: (turma as any)?.situacao || "Em Andamento",
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

    const validation = turmaSchema.safeParse(formData);
    if (!validation.success) {
      const firstError = validation.error.errors[0];
      toast.error(firstError.message);
      return;
    }

    setLoading(true);
    try {
      if (turma) {
        const { error } = await supabase
          .from("turmas")
          .update(formData as Database['public']['Tables']['turmas']['Update'])
          .eq("id", turma.id);

        if (error) throw error;
        toast.success(t("classUpdatedSuccess"));
      } else {
        const { error } = await supabase
          .from("turmas")
          .insert([{ ...formData, user_id: user.id } as Database['public']['Tables']['turmas']['Insert']]);

        if (error) throw error;
        toast.success(t("classRegisteredSuccess"));
      }

      onSuccess();
      if (!turma) {
        setFormData({
          nome: "",
          curso_id: "",
          ano: new Date().getFullYear(),
          tipo_militar: "",
          tipo_militar_outro: "",
          om_registro: "",
          data_inicio: "",
          data_fim: "",
          situacao: "Em Andamento",
          observacoes: "",
        });
      }
    } catch (error) {
      console.error("Erro ao salvar turma:", error);
      toast.error(t("errorSavingClass"));
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
            {t("newClass")}
          </Button>
        )}
      </DialogTrigger>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto" onInteractOutside={(e) => e.preventDefault()}>
        <DialogHeader>
          <DialogTitle>{turma ? t("editClass") : t("newClass")}</DialogTitle>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="grid gap-4 md:grid-cols-2">
            <div className="space-y-2 md:col-span-2">
              <Label htmlFor="nome">{t("className")} *</Label>
              <Input
                id="nome"
                required
                value={formData.nome}
                onChange={(e) => setFormData({ ...formData, nome: e.target.value })}
              />
            </div>

            <div className="space-y-2 md:col-span-2">
              <Label htmlFor="curso_id">{t("linkedCourse")} *</Label>
              <Select
                required
                value={formData.curso_id}
                onValueChange={(value) => setFormData({ ...formData, curso_id: value })}
              >
                <SelectTrigger>
                  <SelectValue placeholder={t("selectCourse")} />
                </SelectTrigger>
                <SelectContent className="bg-background">
                  {cursos.map((curso) => (
                    <SelectItem key={curso.id} value={curso.id}>
                      {curso.nome}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label htmlFor="ano">{t("year")} *</Label>
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
              <Label htmlFor="tipo_militar">{t("militaryType")} *</Label>
              <CustomizableSelect
                required
                value={formData.tipo_militar}
                onValueChange={(value) => setFormData({ ...formData, tipo_militar: value })}
                defaultOptions={[
                  "Fuzileiro Naval",
                  "Marinheiro",
                  "Exercito",
                  "Bombeiro",
                  "Civil",
                  "Outros"
                ]}
                placeholder={t("selectType")}
                storageKey="custom_tipo_militar_turmas"
              />
            </div>

            {formData.tipo_militar === "Outros" && (
              <div className="space-y-2">
                <Label htmlFor="tipo_militar_outro">Especificar Tipo Militar</Label>
                <Input
                  id="tipo_militar_outro"
                  value={formData.tipo_militar_outro}
                  onChange={(e) => setFormData({ ...formData, tipo_militar_outro: e.target.value })}
                  placeholder="Digite o tipo militar"
                />
              </div>
            )}

            <div className="space-y-2">
              <Label htmlFor="om_registro">OM de Registro</Label>
              <Input
                id="om_registro"
                value={formData.om_registro}
                onChange={(e) => setFormData({ ...formData, om_registro: e.target.value })}
                placeholder="Digite a OM de registro"
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="data_inicio">{t("startDateShort")}</Label>
              <Input
                id="data_inicio"
                type="date"
                value={formData.data_inicio}
                onChange={(e) => setFormData({ ...formData, data_inicio: e.target.value })}
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="data_fim">{t("endDateShort")}</Label>
              <Input
                id="data_fim"
                type="date"
                value={formData.data_fim}
                onChange={(e) => setFormData({ ...formData, data_fim: e.target.value })}
              />
            </div>

            <div className="space-y-2 md:col-span-2">
              <Label htmlFor="situacao">Situação do Curso *</Label>
              <CustomizableSelect
                required
                value={formData.situacao}
                onValueChange={(value) => setFormData({ ...formData, situacao: value })}
                defaultOptions={[
                  "Em Andamento",
                  "Concluído",
                  "Cancelado",
                  "Planejado"
                ]}
                placeholder="Selecione a situação"
                storageKey="custom_situacao_turmas"
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
