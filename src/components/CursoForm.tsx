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
import { useTranslation } from "react-i18next";

interface Curso {
  id: string;
  nome: string;
  instituicao: string | null;
  local_realizacao: string | null;
  tipo_curso: string | null;
  modalidade: string | null;
  situacao: string | null;
  categoria: string | null;
  observacoes: string | null;
  coordenador: string | null;
}

interface CursoFormProps {
  curso?: Curso;
  onSuccess: () => void;
}

const countries = ["Afeganistão", "África do Sul", "Albânia", "Alemanha", "Andorra", "Angola", "Antígua e Barbuda", "Arábia Saudita", "Argélia", "Argentina", "Armênia", "Austrália", "Áustria", "Azerbaijão", "Bahamas", "Bahrein", "Bangladesh", "Barbados", "Bélgica", "Belize", "Benin", "Bielorrússia", "Bolívia", "Bósnia e Herzegovina", "Botsuana", "Brasil", "Brunei", "Bulgária", "Burkina Faso", "Burundi", "Butão", "Cabo Verde", "Camarões", "Camboja", "Canadá", "Catar", "Cazaquistão", "Chade", "Chile", "China", "Chipre", "Colômbia", "Comores", "Congo", "Coreia do Norte", "Coreia do Sul", "Costa do Marfim", "Costa Rica", "Croácia", "Cuba", "Dinamarca", "Djibuti", "Dominica", "Egito", "El Salvador", "Emirados Árabes Unidos", "Equador", "Eritreia", "Eslováquia", "Eslovênia", "Espanha", "Estados Unidos", "Estônia", "Etiópia", "Fiji", "Filipinas", "Finlândia", "França", "Gabão", "Gâmbia", "Gana", "Geórgia", "Granada", "Grécia", "Guatemala", "Guiana", "Guiné", "Guiné Equatorial", "Guiné-Bissau", "Haiti", "Honduras", "Hungria", "Iêmen", "Ilhas Marshall", "Ilhas Salomão", "Índia", "Indonésia", "Irã", "Iraque", "Irlanda", "Islândia", "Israel", "Itália", "Jamaica", "Japão", "Jordânia", "Kiribati", "Kosovo", "Kuwait", "Laos", "Lesoto", "Letônia", "Líbano", "Libéria", "Líbia", "Liechtenstein", "Lituânia", "Luxemburgo", "Macedônia do Norte", "Madagascar", "Malásia", "Malauí", "Maldivas", "Mali", "Malta", "Marrocos", "Maurícia", "Mauritânia", "México", "Mianmar", "Micronésia", "Moçambique", "Moldávia", "Mônaco", "Mongólia", "Montenegro", "Namíbia", "Nauru", "Nepal", "Nicarágua", "Níger", "Nigéria", "Noruega", "Nova Zelândia", "Omã", "Países Baixos", "Palau", "Panamá", "Papua-Nova Guiné", "Paquistão", "Paraguai", "Peru", "Polônia", "Portugal", "Quênia", "Quirguistão", "Reino Unido", "República Centro-Africana", "República Democrática do Congo", "República Dominicana", "República Tcheca", "Romênia", "Ruanda", "Rússia", "Samoa", "San Marino", "Santa Lúcia", "São Cristóvão e Nevis", "São Tomé e Príncipe", "São Vicente e Granadinas", "Senegal", "Serra Leoa", "Sérvia", "Seychelles", "Singapura", "Síria", "Somália", "Sri Lanka", "Suazilândia", "Sudão", "Sudão do Sul", "Suécia", "Suíça", "Suriname", "Tailândia", "Tajiquistão", "Tanzânia", "Timor-Leste", "Togo", "Tonga", "Trinidad e Tobago", "Tunísia", "Turcomenistão", "Turquia", "Tuvalu", "Ucrânia", "Uganda", "Uruguai", "Uzbequistão", "Vanuatu", "Vaticano", "Venezuela", "Vietnã", "Zâmbia", "Zimbábue"];

export function CursoForm({ curso, onSuccess }: CursoFormProps) {
  const { user } = useAuth();
  const { t } = useTranslation();
  const [open, setOpen] = useState(false);
  const [loading, setLoading] = useState(false);
  const [formData, setFormData] = useState({
    nome: curso?.nome || "",
    instituicao: curso?.instituicao || "",
    local_realizacao: curso?.local_realizacao || "",
    tipo_curso: curso?.tipo_curso || "",
    modalidade: curso?.modalidade || "",
    situacao: curso?.situacao || "Em Andamento",
    categoria: curso?.categoria || "",
    observacoes: curso?.observacoes || "",
    coordenador: curso?.coordenador || "",
  });

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user) return;

    const validation = cursoSchema.safeParse(formData);
    if (!validation.success) {
      toast.error(validation.error.errors[0].message);
      return;
    }

    setLoading(true);
    try {
      if (curso) {
        const { error } = await supabase.from("cursos").update(formData as any).eq("id", curso.id);
        if (error) throw error;
        toast.success(t("courseUpdatedSuccess"));
      } else {
        const { error } = await supabase.from("cursos").insert([{ ...formData, user_id: user.id } as any]);
        if (error) throw error;
        toast.success(t("courseRegisteredSuccess"));
      }
      setOpen(false);
      onSuccess();
    } catch (error) {
      toast.error(t("errorSavingCourse"));
    } finally {
      setLoading(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        {curso ? <Button variant="ghost" size="icon"><Pencil className="h-4 w-4" /></Button> : <Button className="gap-2"><Plus className="h-4 w-4" />{t("newCourse")}</Button>}
      </DialogTrigger>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader><DialogTitle>{curso ? t("editCourse") : t("newCourse")}</DialogTitle></DialogHeader>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="grid gap-4 md:grid-cols-2">
            <div className="space-y-2 md:col-span-2"><Label>{t("courseName")} *</Label><Input required value={formData.nome} onChange={(e) => setFormData({ ...formData, nome: e.target.value })} /></div>
            <div className="space-y-2"><Label>{t("institution")}</Label><Input value={formData.instituicao} onChange={(e) => setFormData({ ...formData, instituicao: e.target.value })} /></div>
            <div className="space-y-2"><Label>{t("category")}</Label><Input value={formData.categoria} onChange={(e) => setFormData({ ...formData, categoria: e.target.value })} /></div>
            <div className="space-y-2"><Label>{t("coordinator")}</Label><Input value={formData.coordenador} onChange={(e) => setFormData({ ...formData, coordenador: e.target.value })} /></div>
            <div className="space-y-2"><Label>{t("countryLocation")}</Label><Select value={formData.local_realizacao} onValueChange={(value) => setFormData({ ...formData, local_realizacao: value })}><SelectTrigger><SelectValue placeholder={t("selectCountry")} /></SelectTrigger><SelectContent className="max-h-[300px] overflow-y-auto bg-background">{countries.map(c => <SelectItem key={c} value={c}>{c}</SelectItem>)}</SelectContent></Select></div>
            <div className="space-y-2"><Label>{t("courseType")}</Label><Select value={formData.tipo_curso} onValueChange={(value) => setFormData({ ...formData, tipo_curso: value })}><SelectTrigger><SelectValue placeholder={t("selectType")} /></SelectTrigger><SelectContent className="bg-background"><SelectItem value="Expedito">{t("expedited")}</SelectItem><SelectItem value="Carreira">{t("career")}</SelectItem></SelectContent></Select></div>
            <div className="space-y-2"><Label>{t("modality")}</Label><Select value={formData.modalidade} onValueChange={(value) => setFormData({ ...formData, modalidade: value })}><SelectTrigger><SelectValue placeholder={t("selectModality")} /></SelectTrigger><SelectContent className="bg-background"><SelectItem value="Presencial">{t("inPerson")}</SelectItem><SelectItem value="Semipresencial">{t("semiPresential")}</SelectItem><SelectItem value="A Distância">{t("distance")}</SelectItem></SelectContent></Select></div>
            <div className="space-y-2 md:col-span-2"><Label>{t("status")}</Label><Select value={formData.situacao} onValueChange={(value) => setFormData({ ...formData, situacao: value })}><SelectTrigger><SelectValue /></SelectTrigger><SelectContent className="bg-background"><SelectItem value="Em Andamento">{t("inProgress")}</SelectItem><SelectItem value="Concluído">{t("completed")}</SelectItem><SelectItem value="Cancelado">{t("cancelled")}</SelectItem></SelectContent></Select></div>
            <div className="space-y-2 md:col-span-2"><Label>{t("observations")}</Label><Textarea value={formData.observacoes} onChange={(e) => setFormData({ ...formData, observacoes: e.target.value })} rows={3} /></div>
          </div>
          <div className="flex justify-end gap-2">
            <Button type="button" variant="outline" onClick={() => setOpen(false)}>{t("cancel")}</Button>
            <Button type="submit" disabled={loading}>{loading ? t("saving") : t("save")}</Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}
