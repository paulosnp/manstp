import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";

import { UserPlus } from "lucide-react";
import { supabase } from "@/lib/supabase";
import { useAuth } from "@/contexts/AuthContext";
import { toast } from "sonner";
import { alunoSchema } from "@/lib/validations";
import type { Database } from "@/integrations/supabase/types";

interface VincularAlunoTurmaProps {
  turmaId: string;
  turmaNome: string;
  onSuccess: () => void;
}


export function VincularAlunoTurma({ turmaId, turmaNome, onSuccess }: VincularAlunoTurmaProps) {
  const { user } = useAuth();
  const [open, setOpen] = useState(false);
  const [selectedStatus, setSelectedStatus] = useState("Aguardando");
  const [loading, setLoading] = useState(false);
  
  const rankKeys = [
    "brigadeiro", "coronel", "capitao_mar_guerra", "tenente_coronel",
    "capitao_fragata", "major", "capitao_tenente", "capitao",
    "primeiro_tenente", "tenente", "segundo_tenente", "alferes",
    "guarda_marinha", "aspirante", "subtenente", "primeiro_cabo", "sargento_mor", "sargento_chefe",
    "sargento_ajudante", "primeiro_sargento", "segundo_sargento", "terceiro_sargento",
    "furriel", "primeiro_subsargento", "segundo_furriel", "suboficial",
    "subsargento", "cabo_secao", "cabo", "segundo_cabo", "segundo_marinheiro",
    "marinheiro", "soldado", "grumete"
  ];
  
  const rankMap: { [key: string]: string } = {
    "brigadeiro": "Brigadeiro",
    "coronel": "Coronel",
    "capitao_mar_guerra": "Capitão de Mar e Guerra",
    "tenente_coronel": "Tenente Coronel",
    "capitao_fragata": "Capitão de Fragata",
    "major": "Major",
    "capitao_tenente": "Capitão Tenente",
    "capitao": "Capitão",
    "primeiro_tenente": "Primeiro Tenente",
    "tenente": "Tenente",
    "segundo_tenente": "Segundo Tenente",
    "alferes": "Alferes",
    "guarda_marinha": "Guarda Marinha",
    "aspirante": "Aspirante",
    "subtenente": "Subtenente",
    "primeiro_cabo": "Primeiro Cabo",
    "sargento_mor": "Sargento Mor",
    "sargento_chefe": "Sargento Chefe",
    "sargento_ajudante": "Sargento Ajudante",
    "primeiro_sargento": "Primeiro Sargento",
    "segundo_sargento": "Segundo Sargento",
    "terceiro_sargento": "Terceiro Sargento",
    "furriel": "Furriel",
    "primeiro_subsargento": "Primeiro Subsargento",
    "segundo_furriel": "Segundo Furriel",
    "suboficial": "Suboficial",
    "subsargento": "Subsargento",
    "cabo_secao": "Cabo de Seção",
    "cabo": "Cabo",
    "segundo_cabo": "Segundo Cabo",
    "segundo_marinheiro": "Segundo Marinheiro",
    "marinheiro": "Marinheiro",
    "soldado": "Soldado",
    "grumete": "Grumete"
  };
  
  const [newAlunoData, setNewAlunoData] = useState({
    nome_completo: "",
    email: "",
    telefone: "",
    whatsapp: "",
    graduacao: "",
    tipo_militar: "",
    local_servico: "",
    funcao: "",
    data_nascimento: "",
    local_curso: "",
    sigla_curso: "",
  });

  const handleCreateAndVincular = async () => {
    if (!user) {
      toast.error("Usuário não autenticado");
      return;
    }

    const validation = alunoSchema.safeParse({
      ...newAlunoData,
      observacoes: "",
    });
    
    if (!validation.success) {
      const firstError = validation.error.errors[0];
      toast.error(firstError.message);
      return;
    }

    setLoading(true);
    try {
      // Criar o aluno
      const { data: novoAluno, error: createError } = await supabase
        .from("alunos")
        .insert([{ 
          nome_completo: newAlunoData.nome_completo,
          email: newAlunoData.email || null,
          telefone: newAlunoData.telefone || null,
          whatsapp: newAlunoData.whatsapp || null,
          graduacao: (newAlunoData.tipo_militar === "Civil" ? "Civil" : rankMap[newAlunoData.graduacao]) as Database['public']['Enums']['graduacao_militar'],
          tipo_militar: newAlunoData.tipo_militar as Database['public']['Enums']['tipo_militar'],
          local_servico: newAlunoData.local_servico || null,
          funcao: newAlunoData.funcao || null,
          data_nascimento: newAlunoData.data_nascimento || null,
          user_id: user.id 
        } as Database['public']['Tables']['alunos']['Insert']])
        .select()
        .single();

      if (createError) throw createError;

      // Vincular à turma
      const { error: vincularError } = await supabase
        .from("aluno_turma")
        .insert([{ 
          aluno_id: novoAluno.id, 
          turma_id: turmaId, 
          status: selectedStatus as Database['public']['Enums']['status_aluno'],
          local_curso: newAlunoData.local_curso || null,
          sigla_curso: newAlunoData.sigla_curso || null
        }]);

      if (vincularError) throw vincularError;

      toast.success("Aluno criado e vinculado com sucesso!");
      setNewAlunoData({
        nome_completo: "",
        email: "",
        telefone: "",
        whatsapp: "",
        graduacao: "",
        tipo_militar: "",
        local_servico: "",
        funcao: "",
        data_nascimento: "",
        local_curso: "",
        sigla_curso: "",
      });
      setSelectedStatus("Aguardando");
      onSuccess();
    } catch (error) {
      console.error("Erro ao criar e vincular aluno:", error);
      toast.error("Erro ao criar e vincular aluno");
    } finally {
      setLoading(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button variant="outline" size="sm" className="gap-2">
          <UserPlus className="h-4 w-4" />
          Vincular Aluno
        </Button>
      </DialogTrigger>
      <DialogContent className="max-w-2xl" onInteractOutside={(e) => e.preventDefault()}>
        <DialogHeader>
          <DialogTitle>Criar e Vincular Novo Aluno à Turma: {turmaNome}</DialogTitle>
        </DialogHeader>
        
        <div className="space-y-4 mt-4">
            <div className="grid gap-4 md:grid-cols-2">
              <div className="space-y-2 md:col-span-2">
                <Label>Nome Completo *</Label>
                <Input
                  required
                  value={newAlunoData.nome_completo}
                  onChange={(e) => setNewAlunoData({ ...newAlunoData, nome_completo: e.target.value })}
                  placeholder="Digite o nome completo"
                />
              </div>
              
              <div className="space-y-2">
                <Label>Email</Label>
                <Input
                  type="email"
                  value={newAlunoData.email}
                  onChange={(e) => setNewAlunoData({ ...newAlunoData, email: e.target.value })}
                  placeholder="Digite o email"
                />
              </div>
              
              <div className="space-y-2">
                <Label>Data de Nascimento</Label>
                <Input
                  type="date"
                  value={newAlunoData.data_nascimento}
                  onChange={(e) => setNewAlunoData({ ...newAlunoData, data_nascimento: e.target.value })}
                />
              </div>
              
              <div className="space-y-2">
                <Label>Telemóvel</Label>
                <Input
                  type="tel"
                  value={newAlunoData.telefone}
                  onChange={(e) => setNewAlunoData({ ...newAlunoData, telefone: e.target.value })}
                  placeholder="Digite o telemóvel"
                />
              </div>
              
              <div className="space-y-2">
                <Label>WhatsApp</Label>
                <Input
                  type="tel"
                  value={newAlunoData.whatsapp}
                  onChange={(e) => setNewAlunoData({ ...newAlunoData, whatsapp: e.target.value })}
                  placeholder="Digite o WhatsApp"
                />
              </div>
              
              <div className="space-y-2">
                <Label>Posto / Graduação *</Label>
                <Select
                  required
                  value={newAlunoData.graduacao}
                  onValueChange={(value) => setNewAlunoData({ ...newAlunoData, graduacao: value })}
                  disabled={newAlunoData.tipo_militar === "Civil"}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Selecione o posto" />
                  </SelectTrigger>
                  <SelectContent className="max-h-[300px] overflow-y-auto bg-background">
                    {rankKeys.map((key) => (
                      <SelectItem key={key} value={key}>
                        {rankMap[key]}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              
              <div className="space-y-2">
                <Label>Tipo Militar *</Label>
                <Select
                  required
                  value={newAlunoData.tipo_militar}
                  onValueChange={(value) => {
                    setNewAlunoData({ 
                      ...newAlunoData, 
                      tipo_militar: value,
                      graduacao: value === "Civil" ? "civil" : newAlunoData.graduacao,
                      local_servico: value === "Civil" ? "Nenhuma" : newAlunoData.local_servico
                    });
                  }}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Selecione o tipo" />
                  </SelectTrigger>
                  <SelectContent className="bg-background">
                    <SelectItem value="Fuzileiro Naval">Fuzileiro Naval</SelectItem>
                    <SelectItem value="Marinheiro">Marinheiro</SelectItem>
                    <SelectItem value="Marinha do Brasil">Marinha do Brasil</SelectItem>
                    <SelectItem value="Exercito">Exército</SelectItem>
                    <SelectItem value="Bombeiro">Bombeiro</SelectItem>
                    <SelectItem value="EMAP">EMAP</SelectItem>
                    <SelectItem value="Civil">Civil</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              
              <div className="space-y-2 md:col-span-2">
                <Label>OM de Registro</Label>
                <Input
                  value={newAlunoData.local_servico}
                  onChange={(e) => setNewAlunoData({ ...newAlunoData, local_servico: e.target.value })}
                  placeholder="Digite a OM de registro"
                  disabled={newAlunoData.tipo_militar === "Civil"}
                />
              </div>
              
              <div className="space-y-2 md:col-span-2">
                <Label>Função que Exerce</Label>
                <Input
                  value={newAlunoData.funcao}
                  onChange={(e) => setNewAlunoData({ ...newAlunoData, funcao: e.target.value })}
                  placeholder="Digite a função que exerce"
                />
              </div>
              
              <div className="space-y-2 md:col-span-2">
                <Label>Situação do Curso</Label>
                <Select value={selectedStatus} onValueChange={setSelectedStatus}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="Aguardando">Aguardando</SelectItem>
                    <SelectItem value="Planejado">Planejado</SelectItem>
                    <SelectItem value="Cursando">Cursando</SelectItem>
                    <SelectItem value="Estagiando">Estagiando</SelectItem>
                    <SelectItem value="Concluído">Concluído</SelectItem>
                    <SelectItem value="Cancelado">Cancelado</SelectItem>
                    <SelectItem value="Reprovado">Reprovado</SelectItem>
                    <SelectItem value="Desligado">Desligado</SelectItem>
                    <SelectItem value="Desertor">Desertor</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              
              <div className="space-y-2">
                <Label>Local</Label>
                <Select
                  value={newAlunoData.local_curso}
                  onValueChange={(value) => setNewAlunoData({ ...newAlunoData, local_curso: value })}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Selecione o local" />
                  </SelectTrigger>
                  <SelectContent className="bg-background">
                    <SelectItem value="BRASIL">BRASIL</SelectItem>
                    <SelectItem value="SÃO TOMÉ E PRÍNCIPE">SÃO TOMÉ E PRÍNCIPE</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              
              <div className="space-y-2">
                <Label>Sigla do Curso</Label>
                <Input
                  value={newAlunoData.sigla_curso}
                  onChange={(e) => setNewAlunoData({ ...newAlunoData, sigla_curso: e.target.value })}
                  placeholder="Digite a sigla do curso"
                />
              </div>
            </div>
            
            <div className="flex justify-end gap-2">
              <Button variant="outline" onClick={() => setOpen(false)}>
                Cancelar
              </Button>
              <Button 
                onClick={handleCreateAndVincular} 
                disabled={loading || !newAlunoData.nome_completo || !newAlunoData.graduacao || !newAlunoData.tipo_militar}
              >
                {loading ? "Criando..." : "Criar e Vincular"}
              </Button>
            </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
