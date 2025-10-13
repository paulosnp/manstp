import { useEffect, useState } from "react";
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Search } from "lucide-react";
import { supabase } from "@/lib/supabase";
import { useAuth } from "@/contexts/AuthContext";
import { useUserRole } from "@/hooks/useUserRole";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { AlunoForm } from "@/components/AlunoForm";
import { DeleteDialog } from "@/components/DeleteDialog";
import { ImportarAlunos } from "@/components/ImportarAlunos";
import { useTranslation } from "react-i18next";

interface Aluno {
  id: string;
  nome_completo: string;
  graduacao: string;
  tipo_militar: string;
  local_servico?: string;
  telefone: string | null;
  email: string | null;
  observacoes: string | null;
}

export default function Alunos() {
  const { user } = useAuth();
  const { isCoordenador } = useUserRole();
  const { t } = useTranslation();
  const [alunos, setAlunos] = useState<Aluno[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState("");

  // Mapeamento reverso de graduações portuguesas para chaves de tradução
  const rankToKeyMap: { [key: string]: string } = {
    "Brigadeiro": "brigadeiro",
    "Coronel": "coronel",
    "Capitão de Mar e Guerra": "capitao_mar_guerra",
    "Tenente Coronel": "tenente_coronel",
    "Tenente-Coronel": "tenente_coronel",
    "Capitão de Fragata": "capitao_fragata",
    "Major": "major",
    "Capitão Tenente": "capitao_tenente",
    "Capitão-Tenente": "capitao_tenente",
    "Capitão": "capitao",
    "Primeiro Tenente": "primeiro_tenente",
    "Primeiro-Tenente": "primeiro_tenente",
    "Tenente": "tenente",
    "Segundo Tenente": "segundo_tenente",
    "Segundo-Tenente": "segundo_tenente",
    "Alferes": "alferes",
    "Guarda Marinha": "guarda_marinha",
    "Guarda-Marinha": "guarda_marinha",
    "Aspirante": "aspirante",
    "Sargento Mor": "sargento_mor",
    "Sargento-Mor": "sargento_mor",
    "Sargento Chefe": "sargento_chefe",
    "Sargento-Chefe": "sargento_chefe",
    "Sargento Ajudante": "sargento_ajudante",
    "Sargento-Ajudante": "sargento_ajudante",
    "Primeiro Sargento": "primeiro_sargento",
    "Primeiro-Sargento": "primeiro_sargento",
    "Segundo Sargento": "segundo_sargento",
    "Segundo-Sargento": "segundo_sargento",
    "Furriel": "furriel",
    "Primeiro Subsargento": "primeiro_subsargento",
    "Primeiro-Subsargento": "primeiro_subsargento",
    "Segundo Furriel": "segundo_furriel",
    "Segundo-Furriel": "segundo_furriel",
    "Subsargento": "subsargento",
    "Cabo de Seção": "cabo_secao",
    "Cabo de Secção": "cabo_secao",
    "Cabo": "cabo",
    "Segundo Cabo": "segundo_cabo",
    "Segundo-Cabo": "segundo_cabo",
    "Segundo Marinheiro": "segundo_marinheiro",
    "Segundo-Marinheiro": "segundo_marinheiro",
    "Soldado": "soldado",
    "Grumete": "grumete",
    // Traduções em inglês
    "Brigadier General": "brigadeiro",
    "Lieutenant Colonel": "tenente_coronel",
    "Commander": "capitao_fragata",
    "Lieutenant Commander": "capitao_tenente",
    "First Lieutenant": "primeiro_tenente",
    "Second Lieutenant": "segundo_tenente",
    "Ensign": "alferes",
    "Midshipman": "guarda_marinha",
    "Cadet": "aspirante",
    "Sergeant Major": "sargento_mor",
    "Master Sergeant": "sargento_chefe",
    "Staff Sergeant": "sargento_ajudante",
    "First Sergeant": "primeiro_sargento",
    "Senior Corporal": "primeiro_subsargento",
    "Lance Corporal": "segundo_cabo",
    "Seaman": "segundo_marinheiro",
    "Private": "soldado",
    "Seaman Recruit": "grumete",
    // Traduções em espanhol
    "General de Brigada": "brigadeiro",
    "Capitán de Navío": "capitao_mar_guerra",
    "Teniente Coronel": "tenente_coronel",
    "Capitán de Fragata": "capitao_fragata",
    "Comandante": "major",
    "Capitán de Corbeta": "capitao_tenente",
    "Capitán": "capitao",
    "Teniente": "tenente",
    "Alférez": "alferes",
    "Guardiamarina": "guarda_marinha",
    "Suboficial Mayor": "sargento_mor",
    "Subteniente": "sargento_chefe",
    "Brigada": "sargento_ajudante",
    "Sargento Primero": "primeiro_sargento",
    "Sargento": "segundo_sargento",
    "Cabo Primero": "furriel",
    "Cabo Mayor": "primeiro_subsargento",
    "Marinero": "grumete",
    // Traduções em francês
    "Général de Brigade": "brigadeiro",
    "Capitaine de Vaisseau": "capitao_mar_guerra",
    "Lieutenant-Colonel": "tenente_coronel",
    "Capitaine de Frégate": "capitao_fragata",
    "Commandant": "major",
    "Capitaine de Corvette": "capitao_tenente",
    "Capitaine": "capitao",
    "Sous-Lieutenant": "segundo_tenente",
    "Enseigne": "alferes",
    "Adjudant-Chef": "sargento_chefe",
    "Adjudant": "sargento_ajudante",
    "Sergent-Chef": "primeiro_sargento",
    "Sergent": "segundo_sargento",
    "Caporal-Chef": "primeiro_subsargento",
    "Caporal": "cabo",
    "Matelot": "grumete",
    "Soldat": "soldado"
  };

  const translateRank = (rank: string) => {
    const key = rankToKeyMap[rank];
    if (key) {
      return t(`ranks.${key}`);
    }
    return rank; // Retorna o valor original se não encontrar tradução
  };

  useEffect(() => {
    fetchAlunos();
  }, [user]);

  const fetchAlunos = async () => {
    try {
      const { data, error } = await supabase
        .from("alunos")
        .select("*")
        .order("matricula", { ascending: true });

      if (error) throw error;
      setAlunos(data || []);
    } catch (error) {
      console.error("Erro ao buscar alunos:", error);
    } finally {
      setLoading(false);
    }
  };

  const filteredAlunos = alunos.filter((aluno) =>
    aluno.nome_completo.toLowerCase().includes(searchTerm.toLowerCase()) ||
    aluno.graduacao.toLowerCase().includes(searchTerm.toLowerCase()) ||
    aluno.tipo_militar.toLowerCase().includes(searchTerm.toLowerCase())
  );

  return (
    <div className="space-y-4 sm:space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h2 className="text-2xl sm:text-3xl font-bold tracking-tight">Alunos</h2>
          <p className="text-sm sm:text-base text-muted-foreground">Gerencie os alunos cadastrados</p>
        </div>
        {isCoordenador && (
          <div className="flex flex-col sm:flex-row gap-2 w-full sm:w-auto">
            <ImportarAlunos onSuccess={fetchAlunos} />
            <AlunoForm onSuccess={fetchAlunos} />
          </div>
        )}
      </div>

      <Card className="shadow-card">
        <CardHeader className="p-4 sm:p-6">
          <div className="flex items-center gap-4">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
              <Input
                placeholder="Buscar alunos..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-9 text-sm"
              />
            </div>
          </div>
        </CardHeader>
        <CardContent className="p-0 sm:p-6">
          {loading ? (
            <div className="flex items-center justify-center py-12">
              <div className="h-8 w-8 animate-spin rounded-full border-4 border-primary border-t-transparent"></div>
            </div>
          ) : filteredAlunos.length === 0 ? (
            <div className="py-12 text-center">
              <p className="text-muted-foreground">
                {searchTerm ? "Nenhum aluno encontrado" : "Nenhum aluno cadastrado"}
              </p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead className="min-w-[150px]">Nome</TableHead>
                    <TableHead className="min-w-[120px]">Graduação</TableHead>
                    <TableHead className="min-w-[140px]">Tipo</TableHead>
                    <TableHead className="min-w-[120px] hidden sm:table-cell">OM ONDE SERVE</TableHead>
                    <TableHead className="min-w-[150px] hidden md:table-cell">Contato</TableHead>
                    <TableHead className="text-right min-w-[100px]">Ações</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                {filteredAlunos.map((aluno) => (
                  <TableRow key={aluno.id}>
                    <TableCell className="font-medium text-sm">{aluno.nome_completo}</TableCell>
                    <TableCell className="text-sm">{translateRank(aluno.graduacao)}</TableCell>
                    <TableCell>
                      <Badge
                        className="text-xs"
                        variant={
                          aluno.tipo_militar === "Fuzileiro Naval" ? "default" :
                          aluno.tipo_militar === "Guarda Costeiro" ? "secondary" :
                          aluno.tipo_militar === "Exercito" ? "outline" :
                          "destructive"
                        }
                      >
                        {aluno.tipo_militar}
                      </Badge>
                    </TableCell>
                    <TableCell className="hidden sm:table-cell text-sm">{aluno.local_servico || "-"}</TableCell>
                    <TableCell className="hidden md:table-cell">
                      <div className="text-xs">
                        {aluno.email && <div className="truncate max-w-[200px]">{aluno.email}</div>}
                        {aluno.telefone && <div className="text-muted-foreground">{aluno.telefone}</div>}
                      </div>
                    </TableCell>
                    <TableCell className="text-right">
                      {isCoordenador && (
                        <div className="flex justify-end gap-1 sm:gap-2">
                          <AlunoForm aluno={aluno} onSuccess={fetchAlunos} />
                          <DeleteDialog
                            table="alunos"
                            id={aluno.id}
                            name="Aluno"
                            onSuccess={fetchAlunos}
                          />
                        </div>
                      )}
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
