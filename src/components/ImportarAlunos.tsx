import { useState, useRef } from "react";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Upload, FileSpreadsheet, X, AlertCircle, Info } from "lucide-react";
import { supabase } from "@/lib/supabase";
import { toast } from "sonner";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Label } from "@/components/ui/label";
import * as XLSX from 'xlsx';
import { useAuth } from "@/contexts/AuthContext";
import type { Database } from "@/integrations/supabase/types";

interface ImportarAlunosProps {
  onSuccess: () => void;
  turmaId?: string;
  trigger?: React.ReactNode;
}

interface AlunoImport {
  nome_completo: string;
  graduacao: string;
  tipo_militar: string;
  local_servico: string;
  status: string;
}

export function ImportarAlunos({ onSuccess, turmaId, trigger }: ImportarAlunosProps) {
  const { user } = useAuth();
  const [open, setOpen] = useState(false);
  const [dragging, setDragging] = useState(false);
  const [importing, setImporting] = useState(false);
  const [tipoMilitarPadrao, setTipoMilitarPadrao] = useState<string>("");
  const [localServicoPadrao, setLocalServicoPadrao] = useState<string>("");
  const fileInputRef = useRef<HTMLInputElement>(null);

  const processExcel = async (file: File) => {
    try {
      const data = await file.arrayBuffer();
      const workbook = XLSX.read(data);
      const sheetName = workbook.SheetNames[0];
      const worksheet = workbook.Sheets[sheetName];
      const jsonData = XLSX.utils.sheet_to_json(worksheet, { header: 1 }) as any[][];
      
      if (jsonData.length < 2) {
        toast.error("Arquivo vazio ou sem dados");
        return;
      }

      const alunos: AlunoImport[] = [];
      
      // Processar linhas (ignorando header se houver)
      for (let i = 1; i < jsonData.length; i++) {
        const row = jsonData[i];
        if (!row[0] && !row[1]) continue; // Pula linhas vazias
        
        const aluno: AlunoImport = {
          graduacao: row[0]?.toString().trim() || "",
          nome_completo: row[1]?.toString().trim() || "",
          tipo_militar: row[2]?.toString().trim() || tipoMilitarPadrao,
          local_servico: row[3]?.toString().trim() || localServicoPadrao,
          status: row[4]?.toString().trim() || "Cursando"
        };

        if (aluno.nome_completo) {
          alunos.push(aluno);
        }
      }

      if (alunos.length === 0) {
        toast.error("Nenhum aluno válido encontrado no arquivo");
        return;
      }

      await importarAlunos(alunos);
    } catch (error) {
      console.error("Erro ao processar Excel:", error);
      toast.error("Erro ao processar arquivo Excel");
    }
  };

  const importarAlunos = async (alunos: AlunoImport[]) => {
    if (!user) {
      toast.error("Usuário não autenticado");
      return;
    }

    setImporting(true);
    let sucessos = 0;
    let erros = 0;

    try {
      for (const aluno of alunos) {
        try {
          // Criar aluno
          const { data: novoAluno, error: createError } = await supabase
            .from("alunos")
            .insert([{
              nome_completo: aluno.nome_completo,
              graduacao: aluno.graduacao as Database['public']['Enums']['graduacao_militar'],
              tipo_militar: aluno.tipo_militar as Database['public']['Enums']['tipo_militar'],
              local_servico: aluno.local_servico,
              user_id: user.id
            } as Database['public']['Tables']['alunos']['Insert']])
            .select()
            .single();

          if (createError) throw createError;

          // Vincular à turma se turmaId foi fornecido
          if (turmaId && novoAluno) {
            const { error: vincularError } = await supabase
              .from("aluno_turma")
              .insert([{
                aluno_id: novoAluno.id,
                turma_id: turmaId,
                status: aluno.status as Database['public']['Enums']['status_aluno']
              } as Database['public']['Tables']['aluno_turma']['Insert']]);

            if (vincularError) throw vincularError;
          }

          sucessos++;
        } catch (error) {
          console.error("Erro ao importar aluno:", aluno.nome_completo, error);
          erros++;
        }
      }

      toast.success(`Importação concluída! ${sucessos} aluno(s) importado(s), ${erros} erro(s)`);
      onSuccess();
    } catch (error) {
      console.error("Erro na importação:", error);
      toast.error("Erro ao importar alunos");
    } finally {
      setImporting(false);
    }
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setDragging(false);

    const file = e.dataTransfer.files[0];
    if (file) {
      if (file.size > 5 * 1024 * 1024) {
        toast.error("Arquivo muito grande. Tamanho máximo: 5MB");
        return;
      }
      processExcel(file);
    }
  };

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      if (file.size > 5 * 1024 * 1024) {
        toast.error("Arquivo muito grande. Tamanho máximo: 5MB");
        return;
      }
      processExcel(file);
    }
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        {trigger || (
          <Button variant="outline">
            <Upload className="h-4 w-4 mr-2" />
            Importar Alunos
          </Button>
        )}
      </DialogTrigger>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto" onInteractOutside={(e) => e.preventDefault()}>
        <DialogHeader>
          <DialogTitle>Importar Lista de Alunos</DialogTitle>
        </DialogHeader>

        <div className="space-y-4">
          <Alert>
            <Info className="h-4 w-4" />
            <AlertDescription>
              <strong>Formato do arquivo Excel/CSV:</strong>
              <br />
              Coluna A: Graduação
              <br />
              Coluna B: Nome Completo
              <br />
              Coluna C: Tipo Militar (opcional, usa padrão abaixo)
              <br />
              Coluna D: OM Onde Serve (opcional, usa padrão abaixo)
              <br />
              Coluna E: Status (opcional, padrão: Cursando)
            </AlertDescription>
          </Alert>

          <div className="grid gap-4 md:grid-cols-2">
            <div className="space-y-2">
              <Label>Tipo Militar Padrão</Label>
              <Select value={tipoMilitarPadrao} onValueChange={setTipoMilitarPadrao}>
                <SelectTrigger>
                  <SelectValue placeholder="Selecione o tipo" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="Fuzileiro Naval">Fuzileiro Naval</SelectItem>
                  <SelectItem value="Marinheiro">Marinheiro</SelectItem>
                  <SelectItem value="Marinha do Brasil">Marinha do Brasil</SelectItem>
                  <SelectItem value="Exercito">Exército</SelectItem>
                  <SelectItem value="Bombeiro">Bombeiro</SelectItem>
                  <SelectItem value="Civil">Civil</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label>OM Onde Serve Padrão</Label>
              <Select value={localServicoPadrao} onValueChange={setLocalServicoPadrao}>
                <SelectTrigger>
                  <SelectValue placeholder="Selecione a OM" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="Guarda Costeira">Guarda Costeira</SelectItem>
                  <SelectItem value="Quartel de Fuzileiros">Quartel de Fuzileiros</SelectItem>
                  <SelectItem value="Exército">Exército</SelectItem>
                  <SelectItem value="Palácio do Governo">Palácio do Governo</SelectItem>
                  <SelectItem value="Bombeiros">Bombeiros</SelectItem>
                  <SelectItem value="Polícia">Polícia</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>

          <div
            className={`border-2 border-dashed rounded-lg p-12 text-center transition-colors ${
              dragging ? "border-primary bg-primary/10" : "border-border"
            }`}
            onDrop={handleDrop}
            onDragOver={(e) => {
              e.preventDefault();
              setDragging(true);
            }}
            onDragLeave={() => setDragging(false)}
          >
            <input
              ref={fileInputRef}
              type="file"
              accept=".xlsx,.xls,.csv"
              onChange={handleFileSelect}
              className="hidden"
            />

            <FileSpreadsheet className="h-12 w-12 mx-auto mb-4 text-muted-foreground" />
            <p className="text-lg font-medium mb-2">
              Arraste um arquivo Excel aqui
            </p>
            <p className="text-sm text-muted-foreground mb-4">
              ou
            </p>
            <Button
              type="button"
              onClick={() => fileInputRef.current?.click()}
              disabled={importing}
            >
              Selecionar Arquivo
            </Button>
            <p className="text-xs text-muted-foreground mt-4">
              Formatos aceitos: .xlsx, .xls, .csv (máximo 5MB)
            </p>
          </div>

          {importing && (
            <Alert>
              <AlertCircle className="h-4 w-4" />
              <AlertDescription>
                Importando alunos... Por favor, aguarde.
              </AlertDescription>
            </Alert>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
}
