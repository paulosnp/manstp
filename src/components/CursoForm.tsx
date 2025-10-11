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
  coordenador: string | null;
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
    coordenador: string;
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
    coordenador: curso?.coordenador || "",
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
          coordenador: "",
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
              <Label htmlFor="coordenador">Coordenador</Label>
              <Input
                id="coordenador"
                value={formData.coordenador}
                onChange={(e) => setFormData({ ...formData, coordenador: e.target.value })}
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
                <SelectContent className="max-h-[300px] overflow-y-auto bg-background">
                  <SelectItem value="Afeganistão">Afeganistão</SelectItem>
                  <SelectItem value="África do Sul">África do Sul</SelectItem>
                  <SelectItem value="Albânia">Albânia</SelectItem>
                  <SelectItem value="Alemanha">Alemanha</SelectItem>
                  <SelectItem value="Andorra">Andorra</SelectItem>
                  <SelectItem value="Angola">Angola</SelectItem>
                  <SelectItem value="Antígua e Barbuda">Antígua e Barbuda</SelectItem>
                  <SelectItem value="Arábia Saudita">Arábia Saudita</SelectItem>
                  <SelectItem value="Argélia">Argélia</SelectItem>
                  <SelectItem value="Argentina">Argentina</SelectItem>
                  <SelectItem value="Armênia">Armênia</SelectItem>
                  <SelectItem value="Austrália">Austrália</SelectItem>
                  <SelectItem value="Áustria">Áustria</SelectItem>
                  <SelectItem value="Azerbaijão">Azerbaijão</SelectItem>
                  <SelectItem value="Bahamas">Bahamas</SelectItem>
                  <SelectItem value="Bahrein">Bahrein</SelectItem>
                  <SelectItem value="Bangladesh">Bangladesh</SelectItem>
                  <SelectItem value="Barbados">Barbados</SelectItem>
                  <SelectItem value="Bélgica">Bélgica</SelectItem>
                  <SelectItem value="Belize">Belize</SelectItem>
                  <SelectItem value="Benin">Benin</SelectItem>
                  <SelectItem value="Bielorrússia">Bielorrússia</SelectItem>
                  <SelectItem value="Bolívia">Bolívia</SelectItem>
                  <SelectItem value="Bósnia e Herzegovina">Bósnia e Herzegovina</SelectItem>
                  <SelectItem value="Botsuana">Botsuana</SelectItem>
                  <SelectItem value="Brasil">Brasil</SelectItem>
                  <SelectItem value="Brunei">Brunei</SelectItem>
                  <SelectItem value="Bulgária">Bulgária</SelectItem>
                  <SelectItem value="Burkina Faso">Burkina Faso</SelectItem>
                  <SelectItem value="Burundi">Burundi</SelectItem>
                  <SelectItem value="Butão">Butão</SelectItem>
                  <SelectItem value="Cabo Verde">Cabo Verde</SelectItem>
                  <SelectItem value="Camarões">Camarões</SelectItem>
                  <SelectItem value="Camboja">Camboja</SelectItem>
                  <SelectItem value="Canadá">Canadá</SelectItem>
                  <SelectItem value="Catar">Catar</SelectItem>
                  <SelectItem value="Cazaquistão">Cazaquistão</SelectItem>
                  <SelectItem value="Chade">Chade</SelectItem>
                  <SelectItem value="Chile">Chile</SelectItem>
                  <SelectItem value="China">China</SelectItem>
                  <SelectItem value="Chipre">Chipre</SelectItem>
                  <SelectItem value="Colômbia">Colômbia</SelectItem>
                  <SelectItem value="Comores">Comores</SelectItem>
                  <SelectItem value="Congo">Congo</SelectItem>
                  <SelectItem value="Coreia do Norte">Coreia do Norte</SelectItem>
                  <SelectItem value="Coreia do Sul">Coreia do Sul</SelectItem>
                  <SelectItem value="Costa do Marfim">Costa do Marfim</SelectItem>
                  <SelectItem value="Costa Rica">Costa Rica</SelectItem>
                  <SelectItem value="Croácia">Croácia</SelectItem>
                  <SelectItem value="Cuba">Cuba</SelectItem>
                  <SelectItem value="Dinamarca">Dinamarca</SelectItem>
                  <SelectItem value="Djibuti">Djibuti</SelectItem>
                  <SelectItem value="Dominica">Dominica</SelectItem>
                  <SelectItem value="Egito">Egito</SelectItem>
                  <SelectItem value="El Salvador">El Salvador</SelectItem>
                  <SelectItem value="Emirados Árabes Unidos">Emirados Árabes Unidos</SelectItem>
                  <SelectItem value="Equador">Equador</SelectItem>
                  <SelectItem value="Eritreia">Eritreia</SelectItem>
                  <SelectItem value="Eslováquia">Eslováquia</SelectItem>
                  <SelectItem value="Eslovênia">Eslovênia</SelectItem>
                  <SelectItem value="Espanha">Espanha</SelectItem>
                  <SelectItem value="Estados Unidos">Estados Unidos</SelectItem>
                  <SelectItem value="Estônia">Estônia</SelectItem>
                  <SelectItem value="Etiópia">Etiópia</SelectItem>
                  <SelectItem value="Fiji">Fiji</SelectItem>
                  <SelectItem value="Filipinas">Filipinas</SelectItem>
                  <SelectItem value="Finlândia">Finlândia</SelectItem>
                  <SelectItem value="França">França</SelectItem>
                  <SelectItem value="Gabão">Gabão</SelectItem>
                  <SelectItem value="Gâmbia">Gâmbia</SelectItem>
                  <SelectItem value="Gana">Gana</SelectItem>
                  <SelectItem value="Geórgia">Geórgia</SelectItem>
                  <SelectItem value="Granada">Granada</SelectItem>
                  <SelectItem value="Grécia">Grécia</SelectItem>
                  <SelectItem value="Guatemala">Guatemala</SelectItem>
                  <SelectItem value="Guiana">Guiana</SelectItem>
                  <SelectItem value="Guiné">Guiné</SelectItem>
                  <SelectItem value="Guiné Equatorial">Guiné Equatorial</SelectItem>
                  <SelectItem value="Guiné-Bissau">Guiné-Bissau</SelectItem>
                  <SelectItem value="Haiti">Haiti</SelectItem>
                  <SelectItem value="Honduras">Honduras</SelectItem>
                  <SelectItem value="Hungria">Hungria</SelectItem>
                  <SelectItem value="Iêmen">Iêmen</SelectItem>
                  <SelectItem value="Ilhas Marshall">Ilhas Marshall</SelectItem>
                  <SelectItem value="Ilhas Salomão">Ilhas Salomão</SelectItem>
                  <SelectItem value="Índia">Índia</SelectItem>
                  <SelectItem value="Indonésia">Indonésia</SelectItem>
                  <SelectItem value="Irã">Irã</SelectItem>
                  <SelectItem value="Iraque">Iraque</SelectItem>
                  <SelectItem value="Irlanda">Irlanda</SelectItem>
                  <SelectItem value="Islândia">Islândia</SelectItem>
                  <SelectItem value="Israel">Israel</SelectItem>
                  <SelectItem value="Itália">Itália</SelectItem>
                  <SelectItem value="Jamaica">Jamaica</SelectItem>
                  <SelectItem value="Japão">Japão</SelectItem>
                  <SelectItem value="Jordânia">Jordânia</SelectItem>
                  <SelectItem value="Kiribati">Kiribati</SelectItem>
                  <SelectItem value="Kosovo">Kosovo</SelectItem>
                  <SelectItem value="Kuwait">Kuwait</SelectItem>
                  <SelectItem value="Laos">Laos</SelectItem>
                  <SelectItem value="Lesoto">Lesoto</SelectItem>
                  <SelectItem value="Letônia">Letônia</SelectItem>
                  <SelectItem value="Líbano">Líbano</SelectItem>
                  <SelectItem value="Libéria">Libéria</SelectItem>
                  <SelectItem value="Líbia">Líbia</SelectItem>
                  <SelectItem value="Liechtenstein">Liechtenstein</SelectItem>
                  <SelectItem value="Lituânia">Lituânia</SelectItem>
                  <SelectItem value="Luxemburgo">Luxemburgo</SelectItem>
                  <SelectItem value="Macedônia do Norte">Macedônia do Norte</SelectItem>
                  <SelectItem value="Madagascar">Madagascar</SelectItem>
                  <SelectItem value="Malásia">Malásia</SelectItem>
                  <SelectItem value="Malauí">Malauí</SelectItem>
                  <SelectItem value="Maldivas">Maldivas</SelectItem>
                  <SelectItem value="Mali">Mali</SelectItem>
                  <SelectItem value="Malta">Malta</SelectItem>
                  <SelectItem value="Marrocos">Marrocos</SelectItem>
                  <SelectItem value="Maurícia">Maurícia</SelectItem>
                  <SelectItem value="Mauritânia">Mauritânia</SelectItem>
                  <SelectItem value="México">México</SelectItem>
                  <SelectItem value="Mianmar">Mianmar</SelectItem>
                  <SelectItem value="Micronésia">Micronésia</SelectItem>
                  <SelectItem value="Moçambique">Moçambique</SelectItem>
                  <SelectItem value="Moldávia">Moldávia</SelectItem>
                  <SelectItem value="Mônaco">Mônaco</SelectItem>
                  <SelectItem value="Mongólia">Mongólia</SelectItem>
                  <SelectItem value="Montenegro">Montenegro</SelectItem>
                  <SelectItem value="Namíbia">Namíbia</SelectItem>
                  <SelectItem value="Nauru">Nauru</SelectItem>
                  <SelectItem value="Nepal">Nepal</SelectItem>
                  <SelectItem value="Nicarágua">Nicarágua</SelectItem>
                  <SelectItem value="Níger">Níger</SelectItem>
                  <SelectItem value="Nigéria">Nigéria</SelectItem>
                  <SelectItem value="Noruega">Noruega</SelectItem>
                  <SelectItem value="Nova Zelândia">Nova Zelândia</SelectItem>
                  <SelectItem value="Omã">Omã</SelectItem>
                  <SelectItem value="Países Baixos">Países Baixos</SelectItem>
                  <SelectItem value="Palau">Palau</SelectItem>
                  <SelectItem value="Panamá">Panamá</SelectItem>
                  <SelectItem value="Papua-Nova Guiné">Papua-Nova Guiné</SelectItem>
                  <SelectItem value="Paquistão">Paquistão</SelectItem>
                  <SelectItem value="Paraguai">Paraguai</SelectItem>
                  <SelectItem value="Peru">Peru</SelectItem>
                  <SelectItem value="Polônia">Polônia</SelectItem>
                  <SelectItem value="Portugal">Portugal</SelectItem>
                  <SelectItem value="Quênia">Quênia</SelectItem>
                  <SelectItem value="Quirguistão">Quirguistão</SelectItem>
                  <SelectItem value="Reino Unido">Reino Unido</SelectItem>
                  <SelectItem value="República Centro-Africana">República Centro-Africana</SelectItem>
                  <SelectItem value="República Democrática do Congo">República Democrática do Congo</SelectItem>
                  <SelectItem value="República Dominicana">República Dominicana</SelectItem>
                  <SelectItem value="República Tcheca">República Tcheca</SelectItem>
                  <SelectItem value="Romênia">Romênia</SelectItem>
                  <SelectItem value="Ruanda">Ruanda</SelectItem>
                  <SelectItem value="Rússia">Rússia</SelectItem>
                  <SelectItem value="Samoa">Samoa</SelectItem>
                  <SelectItem value="San Marino">San Marino</SelectItem>
                  <SelectItem value="Santa Lúcia">Santa Lúcia</SelectItem>
                  <SelectItem value="São Cristóvão e Nevis">São Cristóvão e Nevis</SelectItem>
                  <SelectItem value="São Tomé e Príncipe">São Tomé e Príncipe</SelectItem>
                  <SelectItem value="São Vicente e Granadinas">São Vicente e Granadinas</SelectItem>
                  <SelectItem value="Senegal">Senegal</SelectItem>
                  <SelectItem value="Serra Leoa">Serra Leoa</SelectItem>
                  <SelectItem value="Sérvia">Sérvia</SelectItem>
                  <SelectItem value="Seychelles">Seychelles</SelectItem>
                  <SelectItem value="Singapura">Singapura</SelectItem>
                  <SelectItem value="Síria">Síria</SelectItem>
                  <SelectItem value="Somália">Somália</SelectItem>
                  <SelectItem value="Sri Lanka">Sri Lanka</SelectItem>
                  <SelectItem value="Suazilândia">Suazilândia</SelectItem>
                  <SelectItem value="Sudão">Sudão</SelectItem>
                  <SelectItem value="Sudão do Sul">Sudão do Sul</SelectItem>
                  <SelectItem value="Suécia">Suécia</SelectItem>
                  <SelectItem value="Suíça">Suíça</SelectItem>
                  <SelectItem value="Suriname">Suriname</SelectItem>
                  <SelectItem value="Tailândia">Tailândia</SelectItem>
                  <SelectItem value="Tajiquistão">Tajiquistão</SelectItem>
                  <SelectItem value="Tanzânia">Tanzânia</SelectItem>
                  <SelectItem value="Timor-Leste">Timor-Leste</SelectItem>
                  <SelectItem value="Togo">Togo</SelectItem>
                  <SelectItem value="Tonga">Tonga</SelectItem>
                  <SelectItem value="Trinidad e Tobago">Trinidad e Tobago</SelectItem>
                  <SelectItem value="Tunísia">Tunísia</SelectItem>
                  <SelectItem value="Turcomenistão">Turcomenistão</SelectItem>
                  <SelectItem value="Turquia">Turquia</SelectItem>
                  <SelectItem value="Tuvalu">Tuvalu</SelectItem>
                  <SelectItem value="Ucrânia">Ucrânia</SelectItem>
                  <SelectItem value="Uganda">Uganda</SelectItem>
                  <SelectItem value="Uruguai">Uruguai</SelectItem>
                  <SelectItem value="Uzbequistão">Uzbequistão</SelectItem>
                  <SelectItem value="Vanuatu">Vanuatu</SelectItem>
                  <SelectItem value="Vaticano">Vaticano</SelectItem>
                  <SelectItem value="Venezuela">Venezuela</SelectItem>
                  <SelectItem value="Vietnã">Vietnã</SelectItem>
                  <SelectItem value="Zâmbia">Zâmbia</SelectItem>
                  <SelectItem value="Zimbábue">Zimbábue</SelectItem>
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
