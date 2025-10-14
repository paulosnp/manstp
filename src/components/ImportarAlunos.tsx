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
  const [tipoMilitar, setTipoMilitar] = useState<string>("");
  const fileInputRef = useRef<HTMLInputElement>(null);

  const validGraduacoes = [
    "Almirante", "Vice-Almirante", "Contra-Almirante", "Capitão de Mar e Guerra",
    "Capitão de Fragata", "Capitão de Corveta", "Capitão-Tenente", "Primeiro-Tenente",
    "Segundo-Tenente", "Guarda-Marinha", "Suboficial", "Subtenente", "Primeiro-Sargento",
    "Segundo-Sargento", "Terceiro Sargento", "Cabo", "Marinheiro"
  ];

  const validTiposMilitares = ["Fuzileiro Naval", "Guarda Costeiro", "Exercito", "Bombeiro", "Civil", "Marinha do Brasil"];
  const validStatus = ["Cursando", "Aprovado", "Reprovado", "Desligado"];

  const processFile = async (file: File) => {
    // Limite de 5MB
    const MAX_FILE_SIZE = 5 * 1024 * 1024;
    if (file.size > MAX_FILE_SIZE) {
      toast.error("Arquivo muito grande. Tamanho máximo: 5MB");
      return;
    }

    try {
      if (file.name.endsWith('.txt')) {
        await processTXT(file);
      } else if (file.name.endsWith('.xlsx') || file.name.endsWith('.xls') || file.name.endsWith('.csv')) {
        await processExcel(file);
      } else if (file.name.endsWith('.docx')) {
        await processWord(file);
      } else {
        toast.error("Formato não suportado. Use TXT, CSV, Excel (.xlsx, .xls) ou Word (.docx)");
      }
    } catch (error) {
      toast.error("Erro ao processar arquivo");
    }
  };

  const processTXT = async (file: File) => {
    const text = await file.text();
    const lines = text.split('\n').filter(line => line.trim());
    
    const alunosData: AlunoImport[] = [];
    
    // Formato esperado: graduacao, nome_completo
    for (let i = 0; i < lines.length; i++) {
      const line = lines[i].trim();
      if (!line) continue;
      
      const parts = line.split(/[,;\t]/).map(p => p.trim());
      
      if (parts.length < 2) {
        alunosData.push({
          nome_completo: line,
          graduacao: "",
          tipo_militar: "",
          error: "Formato inválido. Esperado: graduação, nome completo"
        });
        continue;
      }

      const aluno: AlunoImport = {
        graduacao: parts[0],
        nome_completo: parts[1],
        tipo_militar: tipoMilitar,
        status: "Cursando"
      };

      // Validações
      if (!validGraduacoes.includes(aluno.graduacao)) {
        aluno.error = `Graduação inválida: ${aluno.graduacao}`;
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
    const MAX_ROWS = 1000;
    
    // Pular cabeçalho se existir
    const startRow = jsonData[0] && typeof jsonData[0][0] === 'string' && 
                     jsonData[0][0].toLowerCase().includes('nome') ? 1 : 0;
    
    const endRow = Math.min(jsonData.length, startRow + MAX_ROWS);
    
    for (let i = startRow; i < endRow; i++) {
      const row = jsonData[i];
      if (!row || !row[0]) continue;
      
      if (row.length < 2) {
        alunosData.push({
          nome_completo: String(row[0] || ""),
          graduacao: "",
          tipo_militar: "",
          error: "Linha com dados insuficientes. Esperado: graduação, nome completo"
        });
        continue;
      }

      const aluno: AlunoImport = {
        graduacao: String(row[0] || ""),
        nome_completo: String(row[1] || ""),
        tipo_militar: tipoMilitar,
        status: "Cursando"
      };

      // Validações
      if (!validGraduacoes.includes(aluno.graduacao)) {
        aluno.error = `Graduação inválida: ${aluno.graduacao}`;
      }

      alunosData.push(aluno);
    }
    
    if (jsonData.length > endRow) {
      toast.warning(`Apenas as primeiras ${MAX_ROWS} linhas foram processadas`);
    }
    
    setAlunos(alunosData);
  };

  const processWord = async (file: File) => {
    const mammoth = await import('mammoth');
    const arrayBuffer = await file.arrayBuffer();
    const result = await mammoth.extractRawText({ arrayBuffer });
    const text = result.value;
    
    const lines = text.split('\n').filter(line => line.trim());
    const alunosData: AlunoImport[] = [];
    const MAX_ROWS = 1000;
    
    for (let i = 0; i < Math.min(lines.length, MAX_ROWS); i++) {
      const line = lines[i].trim();
      if (!line) continue;
      
      const parts = line.split(/[,;\t]/).map(p => p.trim());
      
      if (parts.length < 2) {
        alunosData.push({
          nome_completo: line,
          graduacao: "",
          tipo_militar: "",
          error: "Formato inválido. Esperado: graduação, nome completo"
        });
        continue;
      }

      const aluno: AlunoImport = {
        graduacao: parts[0],
        nome_completo: parts[1],
        tipo_militar: tipoMilitar,
        status: "Cursando"
      };

      if (!validGraduacoes.includes(aluno.graduacao)) {
        aluno.error = `Graduação inválida: ${aluno.graduacao}`;
      }

      alunosData.push(aluno);
    }
    
    if (lines.length > MAX_ROWS) {
      toast.warning(`Apenas as primeiras ${MAX_ROWS} linhas foram processadas`);
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
    if (!tipoMilitar) {
      toast.error("Selecione o tipo militar antes de importar");
      return;
    }

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

      // Processar em lotes de 50
      const BATCH_SIZE = 50;
      for (let i = 0; i < validAlunos.length; i += BATCH_SIZE) {
        const batch = validAlunos.slice(i, i + BATCH_SIZE);
        
        for (const aluno of batch) {
          try {
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

            if (turmaId && alunoData) {
              const { error: vinculoError } = await supabase
                .from("aluno_turma")
                .insert([{
                  aluno_id: alunoData.id,
                  turma_id: turmaId,
                  status: (aluno.status || "Cursando") as any
                }]);

              if (vinculoError) throw vinculoError;
            }

            successCount++;
          } catch (error) {
            errorCount++;
          }
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
              <strong>Formato esperado:</strong> Graduação, Nome Completo (nessa ordem)<br/>
              <strong>TXT:</strong> Separado por vírgula, ponto e vírgula ou tab<br/>
              <strong>Excel/CSV:</strong> Primeira coluna = Graduação, Segunda coluna = Nome Completo
            </AlertDescription>
          </Alert>

          {/* Seleção de Tipo Militar */}
          <div className="space-y-2">
            <label className="text-sm font-medium">Tipo Militar *</label>
            <select
              value={tipoMilitar}
              onChange={(e) => setTipoMilitar(e.target.value)}
              className="w-full p-2 border rounded-md"
              required
            >
              <option value="">Selecione o tipo militar</option>
              {validTiposMilitares.map(tipo => (
                <option key={tipo} value={tipo}>{tipo}</option>
              ))}
            </select>
          </div>

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
                accept=".txt,.csv,.xlsx,.xls,.docx"
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
