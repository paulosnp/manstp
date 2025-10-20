import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
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

interface Aluno {
  id: string;
  nome_completo: string;
  graduacao: string;
  tipo_militar: string;
}

export function VincularAlunoTurma({ turmaId, turmaNome, onSuccess }: VincularAlunoTurmaProps) {
  const { user } = useAuth();
  const [open, setOpen] = useState(false);
  const [alunos, setAlunos] = useState<Aluno[]>([]);
  const [alunosVinculados, setAlunosVinculados] = useState<string[]>([]);
  const [selectedAluno, setSelectedAluno] = useState("");
  const [selectedStatus, setSelectedStatus] = useState("Aguardando");
  const [loading, setLoading] = useState(false);
  const [activeTab, setActiveTab] = useState("existing");
  
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
    graduacao: "",
    tipo_militar: "",
    local_servico: "",
  });

  useEffect(() => {
    if (open) {
      fetchAlunos();
      fetchAlunosVinculados();
    }
  }, [open, turmaId]);

  const fetchAlunos = async () => {
    try {
      const { data, error } = await supabase
        .from("alunos")
        .select("id, nome_completo, graduacao, tipo_militar")
        .order("nome_completo");

      if (error) throw error;
      setAlunos(data || []);
    } catch (error) {
      console.error("Erro ao buscar alunos:", error);
      toast.error("Erro ao carregar alunos");
    }
  };

  const fetchAlunosVinculados = async () => {
    try {
      const { data, error } = await supabase
        .from("aluno_turma")
        .select("aluno_id")
        .eq("turma_id", turmaId);

      if (error) throw error;
      setAlunosVinculados(data?.map((item) => item.aluno_id) || []);
    } catch (error) {
      console.error("Erro ao buscar vínculos:", error);
    }
  };

  const handleVincular = async () => {
    if (!selectedAluno) {
      toast.error("Selecione um aluno");
      return;
    }

    if (alunosVinculados.includes(selectedAluno)) {
      toast.error("Aluno já vinculado a esta turma");
      return;
    }

    setLoading(true);
    try {
      // Check for duplicates before inserting
      const { data: existingLink, error: checkError } = await supabase
        .from("aluno_turma")
        .select("id")
        .eq("aluno_id", selectedAluno)
        .eq("turma_id", turmaId)
        .maybeSingle();

      if (checkError) throw checkError;

      if (existingLink) {
        toast.error("Aluno já vinculado a esta turma");
        setLoading(false);
        return;
      }

      const { error } = await supabase
        .from("aluno_turma")
        .insert([{ aluno_id: selectedAluno, turma_id: turmaId, status: selectedStatus as Database['public']['Enums']['status_aluno'] }]);

      if (error) throw error;

      toast.success("Aluno vinculado com sucesso!");
      setSelectedAluno("");
      setSelectedStatus("Aguardando");
      fetchAlunosVinculados();
      onSuccess();
    } catch (error) {
      console.error("Erro ao vincular aluno:", error);
      toast.error("Erro ao vincular aluno");
    } finally {
      setLoading(false);
    }
  };

  const handleCreateAndVincular = async () => {
    if (!user) {
      toast.error("Usuário não autenticado");
      return;
    }

    const validation = alunoSchema.safeParse({
      ...newAlunoData,
      email: "",
      telefone: "",
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
          graduacao: (newAlunoData.tipo_militar === "Civil" ? "Civil" : rankMap[newAlunoData.graduacao]) as Database['public']['Enums']['graduacao_militar'],
          tipo_militar: newAlunoData.tipo_militar as Database['public']['Enums']['tipo_militar'],
          local_servico: newAlunoData.tipo_militar === "Civil" ? "Nenhuma" : newAlunoData.local_servico,
          user_id: user.id 
        } as Database['public']['Tables']['alunos']['Insert']])
        .select()
        .single();

      if (createError) throw createError;

      // Vincular à turma
      const { error: vincularError } = await supabase
        .from("aluno_turma")
        .insert([{ aluno_id: novoAluno.id, turma_id: turmaId, status: selectedStatus as Database['public']['Enums']['status_aluno'] }]);

      if (vincularError) throw vincularError;

      toast.success("Aluno criado e vinculado com sucesso!");
      setNewAlunoData({
        nome_completo: "",
        graduacao: "",
        tipo_militar: "",
        local_servico: "",
      });
      setSelectedStatus("Aguardando");
      setActiveTab("existing");
      fetchAlunos();
      fetchAlunosVinculados();
      onSuccess();
    } catch (error) {
      console.error("Erro ao criar e vincular aluno:", error);
      toast.error("Erro ao criar e vincular aluno");
    } finally {
      setLoading(false);
    }
  };

  const alunosDisponiveis = alunos.filter(
    (aluno) => !alunosVinculados.includes(aluno.id)
  );

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button variant="outline" size="sm" className="gap-2">
          <UserPlus className="h-4 w-4" />
          Vincular Aluno
        </Button>
      </DialogTrigger>
      <DialogContent className="max-w-2xl">
        <DialogHeader>
          <DialogTitle>Vincular Aluno à Turma: {turmaNome}</DialogTitle>
        </DialogHeader>
        
        <Tabs value={activeTab} onValueChange={setActiveTab}>
          <TabsList className="grid w-full grid-cols-2">
            <TabsTrigger value="existing">Aluno Existente</TabsTrigger>
            <TabsTrigger value="new">Novo Aluno</TabsTrigger>
          </TabsList>
          
          <TabsContent value="existing" className="space-y-4 mt-4">
            <div className="space-y-2">
              <Label>Selecione o Aluno</Label>
              <Select value={selectedAluno} onValueChange={setSelectedAluno}>
                <SelectTrigger>
                  <SelectValue placeholder="Escolha um aluno" />
                </SelectTrigger>
                <SelectContent>
                  {alunosDisponiveis.length === 0 ? (
                    <SelectItem value="none" disabled>
                      Nenhum aluno disponível
                    </SelectItem>
                  ) : (
                    alunosDisponiveis.map((aluno) => (
                      <SelectItem key={aluno.id} value={aluno.id}>
                        {aluno.nome_completo} - {aluno.graduacao} ({aluno.tipo_militar})
                      </SelectItem>
                    ))
                  )}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label>Status</Label>
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
            <div className="flex justify-end gap-2">
              <Button variant="outline" onClick={() => setOpen(false)}>
                Cancelar
              </Button>
              <Button onClick={handleVincular} disabled={loading || !selectedAluno}>
                {loading ? "Vinculando..." : "Vincular"}
              </Button>
            </div>
          </TabsContent>
          
          <TabsContent value="new" className="space-y-4 mt-4">
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
                    <SelectItem value="Guarda Costeiro">Guarda Costeiro</SelectItem>
                    <SelectItem value="Marinha do Brasil">Marinha do Brasil</SelectItem>
                    <SelectItem value="Exercito">Exército</SelectItem>
                    <SelectItem value="Bombeiro">Bombeiro</SelectItem>
                    <SelectItem value="ENAPORT">ENAPORT</SelectItem>
                    <SelectItem value="Civil">Civil</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              
              <div className="space-y-2 md:col-span-2">
                <Label>OM ONDE SERVE *</Label>
                <Select
                  required
                  value={newAlunoData.local_servico}
                  onValueChange={(value) => setNewAlunoData({ ...newAlunoData, local_servico: value })}
                  disabled={newAlunoData.tipo_militar === "Civil"}
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
                <Label>Status Inicial</Label>
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
            </div>
            
            <div className="flex justify-end gap-2">
              <Button variant="outline" onClick={() => setOpen(false)}>
                Cancelar
              </Button>
              <Button 
                onClick={handleCreateAndVincular} 
                disabled={loading || !newAlunoData.nome_completo || !newAlunoData.graduacao || !newAlunoData.tipo_militar || !newAlunoData.local_servico}
              >
                {loading ? "Criando..." : "Criar e Vincular"}
              </Button>
            </div>
          </TabsContent>
        </Tabs>
      </DialogContent>
    </Dialog>
  );
}
