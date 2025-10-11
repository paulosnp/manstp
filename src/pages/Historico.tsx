import { useEffect, useState, useMemo } from "react";
import { supabase } from "@/lib/supabase";
import { useUserRole } from "@/hooks/useUserRole";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { toast } from "sonner";
import { Trash2, Search, Eye, EyeOff } from "lucide-react";
import { format } from "date-fns";
import { ptBR } from "date-fns/locale";

interface AuditLog {
  id: string;
  user_id: string;
  user_email: string;
  action_type: "login" | "insert" | "update" | "delete";
  table_name: string | null;
  record_id: string | null;
  old_data: any;
  new_data: any;
  created_at: string;
}

const actionLabels = {
  login: "Login",
  insert: "Inserção",
  update: "Atualização",
  delete: "Exclusão",
};

const tableLabels: Record<string, string> = {
  alunos: "Alunos",
  instrutores: "Instrutores",
  cursos: "Cursos",
  turmas: "Turmas",
  aluno_turma: "Vínculo Aluno-Turma",
  instrutor_turma: "Vínculo Instrutor-Turma",
  user_roles: "Funções de Usuários",
};

export default function Historico() {
  const { isCoordenador, loading: roleLoading } = useUserRole();
  const [logs, setLogs] = useState<AuditLog[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState("");
  const [actionFilter, setActionFilter] = useState<string>("all");
  const [tableFilter, setTableFilter] = useState<string>("all");
  const [hiddenUsers, setHiddenUsers] = useState<Set<string>>(new Set());
  const [showClearDialog, setShowClearDialog] = useState(false);

  useEffect(() => {
    if (!roleLoading && isCoordenador) {
      fetchLogs();
    }
  }, [isCoordenador, roleLoading]);

  const fetchLogs = async () => {
    try {
      setLoading(true);
      const { data, error } = await supabase
        .from("audit_logs")
        .select("*")
        .order("created_at", { ascending: false })
        .limit(100);

      if (error) throw error;
      setLogs(data || []);
    } catch (error) {
      console.error("Erro ao buscar logs:", error);
      toast.error("Erro ao carregar histórico de auditoria");
    } finally {
      setLoading(false);
    }
  };

  // Usar useMemo para otimizar filtragem
  const filteredLogs = useMemo(() => {
    let filtered = logs;

    // Filtrar por termo de busca (email)
    if (searchTerm) {
      filtered = filtered.filter((log) =>
        log.user_email?.toLowerCase().includes(searchTerm.toLowerCase())
      );
    }

    // Filtrar por tipo de ação
    if (actionFilter !== "all") {
      filtered = filtered.filter((log) => log.action_type === actionFilter);
    }

    // Filtrar por tabela
    if (tableFilter !== "all") {
      filtered = filtered.filter((log) => log.table_name === tableFilter);
    }

    // Filtrar usuários ocultos
    filtered = filtered.filter((log) => !hiddenUsers.has(log.user_email));

    return filtered;
  }, [logs, searchTerm, actionFilter, tableFilter, hiddenUsers]);

  const handleClearHistory = async () => {
    try {
      const { error } = await supabase.from("audit_logs").delete().neq("id", "00000000-0000-0000-0000-000000000000");

      if (error) throw error;

      toast.success("Histórico limpo com sucesso");
      setLogs([]);
      setShowClearDialog(false);
    } catch (error) {
      console.error("Erro ao limpar histórico:", error);
      toast.error("Erro ao limpar histórico");
    }
  };

  const toggleUserVisibility = (email: string) => {
    const newHiddenUsers = new Set(hiddenUsers);
    if (newHiddenUsers.has(email)) {
      newHiddenUsers.delete(email);
      toast.success(`Usuário ${email} reexibido`);
    } else {
      newHiddenUsers.add(email);
      toast.success(`Usuário ${email} ocultado`);
    }
    setHiddenUsers(newHiddenUsers);
  };

  const uniqueEmails = useMemo(() => {
    return Array.from(new Set(logs.map((log) => log.user_email).filter(Boolean)));
  }, [logs]);

  if (roleLoading) {
    return (
      <div className="flex min-h-screen items-center justify-center">
        <div className="h-8 w-8 animate-spin rounded-full border-4 border-primary border-t-transparent"></div>
      </div>
    );
  }

  if (!isCoordenador) {
    return (
      <div className="flex min-h-screen items-center justify-center">
        <div className="text-center">
          <h2 className="text-2xl font-bold">Acesso Negado</h2>
          <p className="text-muted-foreground">
            Apenas coordenadores podem acessar o histórico de auditoria.
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="container mx-auto py-6">
      <div className="mb-6 flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">Histórico de Auditoria</h1>
          <p className="text-muted-foreground">
            Visualize todas as ações realizadas no sistema
          </p>
        </div>
        <Button
          variant="destructive"
          onClick={() => setShowClearDialog(true)}
          disabled={logs.length === 0}
        >
          <Trash2 className="mr-2 h-4 w-4" />
          Limpar Histórico
        </Button>
      </div>

      <div className="mb-4 grid gap-4 md:grid-cols-4">
        <div className="relative">
          <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
          <Input
            placeholder="Buscar por email..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="pl-10"
          />
        </div>

        <Select value={actionFilter} onValueChange={setActionFilter}>
          <SelectTrigger>
            <SelectValue placeholder="Filtrar por ação" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">Todas as ações</SelectItem>
            <SelectItem value="login">Login</SelectItem>
            <SelectItem value="insert">Inserção</SelectItem>
            <SelectItem value="update">Atualização</SelectItem>
            <SelectItem value="delete">Exclusão</SelectItem>
          </SelectContent>
        </Select>

        <Select value={tableFilter} onValueChange={setTableFilter}>
          <SelectTrigger>
            <SelectValue placeholder="Filtrar por tabela" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">Todas as tabelas</SelectItem>
            {Object.entries(tableLabels).map(([value, label]) => (
              <SelectItem key={value} value={value}>
                {label}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>

        <Select onValueChange={toggleUserVisibility}>
          <SelectTrigger>
            <SelectValue placeholder="Ocultar usuário" />
          </SelectTrigger>
          <SelectContent>
            {uniqueEmails.map((email) => (
              <SelectItem key={email} value={email}>
                {hiddenUsers.has(email) ? "✓ " : ""}
                {email}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      {hiddenUsers.size > 0 && (
        <div className="mb-4 flex flex-wrap gap-2">
          <span className="text-sm text-muted-foreground">Usuários ocultos:</span>
          {Array.from(hiddenUsers).map((email) => (
            <Button
              key={email}
              variant="outline"
              size="sm"
              onClick={() => toggleUserVisibility(email)}
            >
              <EyeOff className="mr-2 h-3 w-3" />
              {email}
            </Button>
          ))}
        </div>
      )}

      <div className="rounded-md border">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Data/Hora</TableHead>
              <TableHead>Usuário</TableHead>
              <TableHead>Ação</TableHead>
              <TableHead>Tabela</TableHead>
              <TableHead>Detalhes</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {loading ? (
              <TableRow>
                <TableCell colSpan={5} className="text-center">
                  Carregando...
                </TableCell>
              </TableRow>
            ) : filteredLogs.length === 0 ? (
              <TableRow>
                <TableCell colSpan={5} className="text-center">
                  Nenhum registro encontrado
                </TableCell>
              </TableRow>
            ) : (
              filteredLogs.map((log) => (
                <TableRow key={log.id}>
                  <TableCell>
                    {format(new Date(log.created_at), "dd/MM/yyyy HH:mm:ss", {
                      locale: ptBR,
                    })}
                  </TableCell>
                  <TableCell>{log.user_email || "Sistema"}</TableCell>
                  <TableCell>
                    <span
                      className={`inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-medium ${
                        log.action_type === "delete"
                          ? "bg-destructive/10 text-destructive"
                          : log.action_type === "update"
                          ? "bg-orange-500/10 text-orange-500"
                          : log.action_type === "insert"
                          ? "bg-green-500/10 text-green-500"
                          : "bg-blue-500/10 text-blue-500"
                      }`}
                    >
                      {actionLabels[log.action_type]}
                    </span>
                  </TableCell>
                  <TableCell>
                    {log.table_name ? tableLabels[log.table_name] || log.table_name : "-"}
                  </TableCell>
                  <TableCell className="max-w-md truncate text-xs text-muted-foreground">
                    {log.action_type === "insert" && log.new_data?.nome_completo
                      ? `Novo registro: ${log.new_data.nome_completo}`
                      : log.action_type === "update" && log.new_data?.nome_completo
                      ? `Atualizado: ${log.new_data.nome_completo}`
                      : log.action_type === "delete" && log.old_data?.nome_completo
                      ? `Deletado: ${log.old_data.nome_completo}`
                      : log.action_type === "login"
                      ? "Acesso ao sistema"
                      : "Ver detalhes"}
                  </TableCell>
                </TableRow>
              ))
            )}
          </TableBody>
        </Table>
      </div>

      <Dialog open={showClearDialog} onOpenChange={setShowClearDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Confirmar Limpeza</DialogTitle>
            <DialogDescription>
              Tem certeza que deseja limpar todo o histórico de auditoria? Esta ação não pode ser
              desfeita.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowClearDialog(false)}>
              Cancelar
            </Button>
            <Button variant="destructive" onClick={handleClearHistory}>
              Limpar Histórico
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
