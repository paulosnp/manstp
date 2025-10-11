import { useState, useRef } from "react";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Upload, FileText, FileSpreadsheet, X, Check, AlertCircle } from "lucide-react";
import { supabase } from "@/lib/supabase";
import { toast } from "sonner";
import { Alert, AlertDescription } from "@/components/ui/alert";
import * as XLSX from 'xlsx';

interface ImportarAlunosProps {
  onSuccess: () => void;
  turmaId?: string;
  trigger?: React.ReactNode;
}

interface AlunoImport {
  nome_completo: string;
  graduacao: string;
  tipo_militar: string;
  email?: string;
  telefone?: string;
  local_servico?: string;
  observacoes?: string;
  status?: string;
  error?: string;
}

export function ImportarAlunos({ onSuccess, turmaId, trigger }: ImportarAlunosProps) {
  const [open, setOpen] = useState(false);
  const [dragging, setDragging] = useState(false);
  const [alunos, setAlunos] = useState<AlunoImport[]>([]);
  const [importing, setImporting] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const validGraduacoes = [
    "Almirante", "Vice-Almirante", "Contra-Almirante", "Capitão de Mar e Guerra",
    "Capitão de Fragata", "Capitão de Corveta", "Capitão-Tenente", "Primeiro-Tenente",
    "Segundo-Tenente", "Guarda-Marinha", "Suboficial", "Primeiro-Sargento",
    "Segundo-Sargento", "Terceiro-Sargento", "Cabo", "Marinheiro"
  ];

  const validTiposMilitares = ["Fuzileiro Naval", "Guarda Costeiro", "Exercito", "Bombeiro"];
  const validStatus = ["Cursando", "Aprovado", "Reprovado", "Desligado"];

  const processFile = async (file: File) => {
    try {
      if (file.name.endsWith('.txt')) {
        await processTXT(file);
      } else if (file.name.endsWith('.xlsx') || file.name.endsWith('.xls') || file.name.endsWith('.csv')) {
        await processExcel(file);
      } else {
        toast.error("Formato não suportado. Use TXT, CSV ou Excel (.xlsx, .xls)");
      }
    } catch (error) {
      console.error("Erro ao processar arquivo:", error);
      toast.error("Erro ao processar arquivo");
    }
  };

  const processTXT = async (file: File) => {
    const text = await file.text();
    const lines = text.split('\n').filter(line => line.trim());
    
    const alunosData: AlunoImport[] = [];
    
    // Formato esperado: nome_completo, graduacao, tipo_militar, email, telefone, local_servico, status (opcional)
    for (let i = 0; i < lines.length; i++) {
      const line = lines[i].trim();
      if (!line) continue;
      
      const parts = line.split(/[,;\t]/).map(p => p.trim());
      
      if (parts.length < 3) {
        alunosData.push({
          nome_completo: line,
          graduacao: "",
          tipo_militar: "",
          error: "Formato inválido. Mínimo: nome, graduação, tipo militar"
        });
        continue;
      }

      const aluno: AlunoImport = {
        nome_completo: parts[0],
        graduacao: parts[1],
        tipo_militar: parts[2],
        email: parts[3] || undefined,
        telefone: parts[4] || undefined,
        local_servico: parts[5] || undefined,
        status: parts[6] || "Cursando"
      };

      // Validações
      if (!validGraduacoes.includes(aluno.graduacao)) {
        aluno.error = `Graduação inválida: ${aluno.graduacao}`;
      }
      if (!validTiposMilitares.includes(aluno.tipo_militar)) {
        aluno.error = `Tipo militar inválido: ${aluno.tipo_militar}`;
      }
      if (aluno.status && !validStatus.includes(aluno.status)) {
        aluno.error = `Status inválido: ${aluno.status}`;
      }

      alunosData.push(aluno);
    }
    
    setAlunos(alunosData);
  };

  const processExcel = async (file: File) => {
    const data = await file.arrayBuffer();
    const workbook = XLSX.read(data);
    const firstSheet = workbook.Sheets[workbook.SheetNames[0]];
    const jsonData = XLSX.utils.sheet_to_json(firstSheet, { header: 1 }) as any[][];
    
    const alunosData: AlunoImport[] = [];
    
    // Pular cabeçalho se existir
    const startRow = jsonData[0] && typeof jsonData[0][0] === 'string' && 
                     jsonData[0][0].toLowerCase().includes('nome') ? 1 : 0;
    
    for (let i = startRow; i < jsonData.length; i++) {
      const row = jsonData[i];
      if (!row || !row[0]) continue;
      
      if (row.length < 3) {
        alunosData.push({
          nome_completo: String(row[0] || ""),
          graduacao: "",
          tipo_militar: "",
          error: "Linha com dados insuficientes"
        });
        continue;
      }

      const aluno: AlunoImport = {
        nome_completo: String(row[0] || ""),
        graduacao: String(row[1] || ""),
        tipo_militar: String(row[2] || ""),
        email: row[3] ? String(row[3]) : undefined,
        telefone: row[4] ? String(row[4]) : undefined,
        local_servico: row[5] ? String(row[5]) : undefined,
        status: row[6] ? String(row[6]) : "Cursando"
      };

      // Validações
      if (!validGraduacoes.includes(aluno.graduacao)) {
        aluno.error = `Graduação inválida: ${aluno.graduacao}`;
      }
      if (!validTiposMilitares.includes(aluno.tipo_militar)) {
        aluno.error = `Tipo militar inválido: ${aluno.tipo_militar}`;
      }
      if (aluno.status && !validStatus.includes(aluno.status)) {
        aluno.error = `Status inválido: ${aluno.status}`;
      }

      alunosData.push(aluno);
    }
    
    setAlunos(alunosData);
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setDragging(false);
    
    const file = e.dataTransfer.files[0];
    if (file) processFile(file);
  };

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) processFile(file);
  };

  const handleImport = async () => {
    const validAlunos = alunos.filter(a => !a.error);
    
    if (validAlunos.length === 0) {
      toast.error("Nenhum aluno válido para importar");
      return;
    }

    setImporting(true);
    
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error("Usuário não autenticado");

      let successCount = 0;
      let errorCount = 0;

      for (const aluno of validAlunos) {
        try {
          // Inserir aluno
          const { data: alunoData, error: alunoError } = await supabase
            .from("alunos")
            .insert([{
              nome_completo: aluno.nome_completo,
              graduacao: aluno.graduacao as any,
              tipo_militar: aluno.tipo_militar as any,
              email: aluno.email,
              telefone: aluno.telefone,
              local_servico: aluno.local_servico,
              user_id: user.id
            }])
            .select()
            .single();

          if (alunoError) throw alunoError;

          // Se turmaId foi fornecido, vincular o aluno à turma
          if (turmaId && alunoData) {
            const { error: vinculoError } = await supabase
              .from("aluno_turma")
              .insert([{
                aluno_id: alunoData.id,
                turma_id: turmaId,
                status: (aluno.status as any) || "Cursando"
              }]);

            if (vinculoError) throw vinculoError;
          }

          successCount++;
        } catch (error) {
          console.error("Erro ao importar aluno:", aluno.nome_completo, error);
          errorCount++;
        }
      }

      if (successCount > 0) {
        toast.success(`${successCount} aluno(s) importado(s) com sucesso!`);
        onSuccess();
        setOpen(false);
        setAlunos([]);
      }
      
      if (errorCount > 0) {
        toast.error(`${errorCount} aluno(s) falharam na importação`);
      }
    } catch (error) {
      console.error("Erro ao importar alunos:", error);
      toast.error("Erro ao importar alunos");
    } finally {
      setImporting(false);
    }
  };

  const removeAluno = (index: number) => {
    setAlunos(alunos.filter((_, i) => i !== index));
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        {trigger || (
          <Button variant="outline" size="sm">
            <Upload className="h-4 w-4 mr-2" />
            Importar Lista
          </Button>
        )}
      </DialogTrigger>
      <DialogContent className="max-w-3xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Importar Lista de Alunos</DialogTitle>
        </DialogHeader>

        <div className="space-y-4">
          {/* Info sobre formato */}
          <Alert>
            <AlertCircle className="h-4 w-4" />
            <AlertDescription className="text-xs">
              <strong>Formato esperado:</strong> Nome Completo, Graduação, Tipo Militar, Email, Telefone, Local de Serviço{turmaId && ", Status"}<br/>
              <strong>TXT:</strong> Separado por vírgula ou ponto e vírgula<br/>
              <strong>Excel/CSV:</strong> Cada coluna representa um campo (primeira linha pode ser cabeçalho)
            </AlertDescription>
          </Alert>

          {/* Área de drag and drop */}
          <div
            onDrop={handleDrop}
            onDragOver={(e) => { e.preventDefault(); setDragging(true); }}
            onDragLeave={() => setDragging(false)}
            className={`border-2 border-dashed rounded-lg p-8 text-center transition-colors ${
              dragging ? 'border-primary bg-primary/5' : 'border-muted-foreground/25'
            }`}
          >
            <div className="flex flex-col items-center gap-4">
              <div className="flex gap-4">
                <FileText className="h-12 w-12 text-muted-foreground" />
                <FileSpreadsheet className="h-12 w-12 text-muted-foreground" />
              </div>
              <div>
                <p className="text-sm font-medium">Arraste e solte o arquivo aqui</p>
                <p className="text-xs text-muted-foreground mt-1">ou clique no botão abaixo</p>
              </div>
              <Button
                type="button"
                variant="outline"
                onClick={() => fileInputRef.current?.click()}
              >
                <Upload className="h-4 w-4 mr-2" />
                Selecionar Arquivo
              </Button>
              <input
                ref={fileInputRef}
                type="file"
                accept=".txt,.csv,.xlsx,.xls"
                onChange={handleFileSelect}
                className="hidden"
              />
            </div>
          </div>

          {/* Lista de alunos */}
          {alunos.length > 0 && (
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <h3 className="text-sm font-medium">
                  Alunos Identificados: {alunos.filter(a => !a.error).length} / {alunos.length}
                </h3>
                <Button
                  onClick={() => setAlunos([])}
                  variant="ghost"
                  size="sm"
                >
                  Limpar Lista
                </Button>
              </div>

              <div className="max-h-64 overflow-y-auto space-y-2 border rounded-lg p-3">
                {alunos.map((aluno, index) => (
                  <div
                    key={index}
                    className={`flex items-start gap-2 p-2 rounded text-xs ${
                      aluno.error ? 'bg-destructive/10' : 'bg-muted'
                    }`}
                  >
                    {aluno.error ? (
                      <AlertCircle className="h-4 w-4 text-destructive flex-shrink-0 mt-0.5" />
                    ) : (
                      <Check className="h-4 w-4 text-green-600 flex-shrink-0 mt-0.5" />
                    )}
                    <div className="flex-1 min-w-0">
                      <p className="font-medium truncate">{aluno.nome_completo}</p>
                      {!aluno.error ? (
                        <p className="text-muted-foreground">
                          {aluno.graduacao} - {aluno.tipo_militar}
                          {aluno.email && ` - ${aluno.email}`}
                        </p>
                      ) : (
                        <p className="text-destructive">{aluno.error}</p>
                      )}
                    </div>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => removeAluno(index)}
                      className="h-6 w-6 p-0"
                    >
                      <X className="h-3 w-3" />
                    </Button>
                  </div>
                ))}
              </div>

              <div className="flex gap-3">
                <Button
                  onClick={handleImport}
                  disabled={importing || alunos.filter(a => !a.error).length === 0}
                  className="flex-1"
                >
                  {importing ? "Importando..." : `Importar ${alunos.filter(a => !a.error).length} Aluno(s)`}
                </Button>
              </div>
            </div>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
}
