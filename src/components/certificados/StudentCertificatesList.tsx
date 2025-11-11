import { useState, useEffect, useRef } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { ScrollArea } from "@/components/ui/scroll-area";
import { toast } from "sonner";
import { Download, FileCheck, Loader2 } from "lucide-react";
import jsPDF from "jspdf";
import { Stage, Layer, Image as KonvaImage, Text as KonvaText, Rect } from "react-konva";
import useImage from "use-image";

interface Student {
  id: string;
  nome_completo: string;
  matricula: number;
  hasCertificate?: boolean;
  thumbnail?: string;
}

interface StudentCertificatesListProps {
  turmaId: string | null;
  templateId: string | null;
  stageRef: any;
  orientation: "landscape" | "portrait";
  elements: any[];
  onGenerateCertificate: (studentName: string) => void;
}

export const StudentCertificatesList = ({
  turmaId,
  templateId,
  stageRef,
  orientation,
  elements,
  onGenerateCertificate,
}: StudentCertificatesListProps) => {
  const [students, setStudents] = useState<Student[]>([]);
  const [loading, setLoading] = useState(false);
  const [generating, setGenerating] = useState<string | null>(null);
  const thumbnailStageRef = useRef<any>(null);

  useEffect(() => {
    if (turmaId) {
      fetchStudents();
    } else {
      setStudents([]);
    }
  }, [turmaId, templateId]);

  const fetchStudents = async () => {
    if (!turmaId) return;

    setLoading(true);
    try {
      const { data: alunoTurma, error: alunoError } = await supabase
        .from("aluno_turma")
        .select(`
          alunos (
            id,
            nome_completo,
            matricula
          )
        `)
        .eq("turma_id", turmaId)
        .in("status", ["Cursando", "Concluído"]);

      if (alunoError) throw alunoError;

      const studentIds = alunoTurma?.map((at: any) => at.alunos.id).filter(Boolean) || [];

      let certificateMap: { [key: string]: boolean } = {};
      if (templateId && studentIds.length > 0) {
        const { data: certificates } = await supabase
          .from("student_certificates")
          .select("aluno_id")
          .eq("template_id", templateId)
          .in("aluno_id", studentIds);

        certificateMap = (certificates || []).reduce((acc, cert) => {
          acc[cert.aluno_id] = true;
          return acc;
        }, {} as { [key: string]: boolean });
      }

      const studentsData = alunoTurma?.map((at: any) => ({
        ...at.alunos,
        hasCertificate: certificateMap[at.alunos.id] || false,
      })) || [];

      setStudents(studentsData);
      
      // Gerar miniaturas após carregar os alunos
      setTimeout(() => generateThumbnails(studentsData), 500);
    } catch (error) {
      console.error("Erro ao buscar alunos:", error);
      toast.error("Erro ao carregar alunos da turma");
    } finally {
      setLoading(false);
    }
  };

  const generateThumbnails = async (studentsData: Student[]) => {
    if (!thumbnailStageRef.current || !elements.length) return;

    const thumbnailsMap: { [key: string]: string } = {};

    for (const student of studentsData) {
      try {
        // Aguardar um pouco antes de capturar cada thumbnail
        await new Promise(resolve => setTimeout(resolve, 100));
        
        const dataUrl = thumbnailStageRef.current.toDataURL({ pixelRatio: 0.5 });
        thumbnailsMap[student.id] = dataUrl;
      } catch (error) {
        console.error(`Erro ao gerar miniatura para ${student.nome_completo}:`, error);
      }
    }

    // Atualizar todos os alunos com suas miniaturas
    setStudents(prev => prev.map(student => ({
      ...student,
      thumbnail: thumbnailsMap[student.id]
    })));
  };

  const generateCertificateForStudent = async (student: Student) => {
    if (!stageRef || !templateId) {
      toast.error("Template não salvo. Salve o template antes de gerar certificados.");
      return;
    }

    setGenerating(student.id);

    try {
      // Substituir placeholders nos elementos
      const updatedElements = elements.map((el) => {
        if (el.type === "text") {
          let text = el.text;
          if (text.includes("Nome do Aluno") || text.toLowerCase().includes("aluno")) {
            text = student.nome_completo;
          }
          return { ...el, text };
        }
        return el;
      });

      // Atualizar o stage temporariamente
      onGenerateCertificate(student.nome_completo);

      // Aguardar um frame para o canvas atualizar
      await new Promise((resolve) => setTimeout(resolve, 100));

      const dataUrl = stageRef.toDataURL({ pixelRatio: 2 });
      
      const pdf = new jsPDF({
        orientation: orientation === "landscape" ? "landscape" : "portrait",
        unit: "px",
        format: orientation === "landscape" ? [900, 600] : [600, 900],
      });

      const img = new Image();
      img.onload = async () => {
        pdf.addImage(dataUrl, "PNG", 0, 0, pdf.internal.pageSize.getWidth(), pdf.internal.pageSize.getHeight());
        const pdfBlob = pdf.output("blob");

        // Salvar no banco de dados
        const { data: user } = await supabase.auth.getUser();
        if (!user.user) throw new Error("Usuário não autenticado");

        const { error: insertError } = await supabase
          .from("student_certificates")
          .upsert({
            template_id: templateId,
            aluno_id: student.id,
            turma_id: turmaId,
            user_id: user.user.id,
          });

        if (insertError) throw insertError;

        // Download do PDF
        const url = URL.createObjectURL(pdfBlob);
        const link = document.createElement("a");
        link.href = url;
        link.download = `certificado-${student.nome_completo.replace(/\s+/g, "_")}.pdf`;
        link.click();
        URL.revokeObjectURL(url);

        toast.success(`Certificado gerado para ${student.nome_completo}`);
        fetchStudents(); // Atualizar lista
      };
      img.src = dataUrl;
    } catch (error) {
      console.error("Erro ao gerar certificado:", error);
      toast.error("Erro ao gerar certificado");
    } finally {
      setGenerating(null);
    }
  };

  const generateAllCertificates = async () => {
    for (const student of students) {
      if (!student.hasCertificate) {
        await generateCertificateForStudent(student);
        await new Promise((resolve) => setTimeout(resolve, 500)); // Delay entre gerações
      }
    }
  };

  if (!turmaId) {
    return (
      <Card>
        <CardContent className="p-6 text-center text-muted-foreground">
          Selecione uma turma para vincular certificados aos alunos
        </CardContent>
      </Card>
    );
  }

  // Canvas oculto para geração de miniaturas
  const ThumbnailCanvas = () => (
    <div style={{ position: 'absolute', left: '-9999px', top: '-9999px' }}>
      <Stage
        width={orientation === "landscape" ? 300 : 200}
        height={orientation === "landscape" ? 200 : 300}
        ref={thumbnailStageRef}
      >
        <Layer>
          {elements.map((el) => {
            const scale = orientation === "landscape" ? 300 / 900 : 200 / 600;
            
            if (el.type === "image" && el.src) {
              return (
                <ThumbnailImage
                  key={el.id}
                  src={el.src}
                  x={el.x * scale}
                  y={el.y * scale}
                  width={(el.width || 100) * scale}
                  height={(el.height || 100) * scale}
                  opacity={el.opacity ?? 1}
                />
              );
            }
            
            if (el.type === "text") {
              return (
                <KonvaText
                  key={el.id}
                  x={el.x * scale}
                  y={el.y * scale}
                  text={el.text}
                  fontSize={(el.fontSize || 24) * scale}
                  fontFamily={el.fontFamily || "Arial"}
                  fill={el.fill || "#000000"}
                  fontStyle={`${el.bold ? "bold" : ""} ${el.italic ? "italic" : ""}`.trim()}
                  align={el.align || "left"}
                  width={(el.width || 200) * scale}
                  opacity={el.opacity ?? 1}
                />
              );
            }
            
            if (el.type === "shape") {
              return (
                <Rect
                  key={el.id}
                  x={el.x * scale}
                  y={el.y * scale}
                  width={(el.width || 100) * scale}
                  height={(el.height || 100) * scale}
                  fill={el.fill || "#cccccc"}
                  opacity={el.opacity ?? 1}
                />
              );
            }
            
            return null;
          })}
        </Layer>
      </Stage>
    </div>
  );

  const ThumbnailImage = ({ src, ...props }: any) => {
    const [image] = useImage(src);
    return <KonvaImage image={image} {...props} />;
  };

  return (
    <>
      <ThumbnailCanvas />
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <CardTitle>Alunos da Turma</CardTitle>
            {students.length > 0 && (
              <Button
                onClick={generateAllCertificates}
                disabled={!templateId || generating !== null}
                size="sm"
              >
                Gerar Todos
              </Button>
            )}
          </div>
        </CardHeader>
        <CardContent>
          {loading ? (
            <div className="flex justify-center py-8">
              <Loader2 className="w-6 h-6 animate-spin" />
            </div>
          ) : students.length === 0 ? (
            <p className="text-center text-muted-foreground py-4">
              Nenhum aluno encontrado nesta turma
            </p>
          ) : (
            <ScrollArea className="h-[600px]">
              <div className="space-y-3">
                {students.map((student) => (
                  <Card key={student.id} className="overflow-hidden">
                    <div className="flex items-center gap-3 p-3">
                      {/* Miniatura do certificado */}
                      <div className="flex-shrink-0 w-32 h-24 bg-muted rounded overflow-hidden border">
                        {student.thumbnail ? (
                          <img 
                            src={student.thumbnail} 
                            alt={`Certificado de ${student.nome_completo}`}
                            className="w-full h-full object-cover"
                          />
                        ) : (
                          <div className="w-full h-full flex items-center justify-center text-muted-foreground text-xs">
                            Carregando...
                          </div>
                        )}
                      </div>
                      
                      {/* Informações do aluno */}
                      <div className="flex-1 min-w-0">
                        <div className="font-medium text-sm truncate">
                          {student.nome_completo}
                        </div>
                        <div className="text-xs text-muted-foreground">
                          Matrícula: {student.matricula}
                        </div>
                        <div className="mt-1">
                          {student.hasCertificate ? (
                            <span className="inline-flex items-center gap-1 text-xs text-green-600">
                              <FileCheck className="w-3 h-3" />
                              Gerado
                            </span>
                          ) : (
                            <span className="text-xs text-muted-foreground">Pendente</span>
                          )}
                        </div>
                      </div>
                      
                      {/* Botão de ação */}
                      <Button
                        size="sm"
                        variant={student.hasCertificate ? "outline" : "default"}
                        onClick={() => generateCertificateForStudent(student)}
                        disabled={!templateId || generating === student.id}
                      >
                        {generating === student.id ? (
                          <Loader2 className="w-4 h-4 animate-spin" />
                        ) : (
                          <Download className="w-4 h-4" />
                        )}
                      </Button>
                    </div>
                  </Card>
                ))}
              </div>
            </ScrollArea>
          )}
        </CardContent>
      </Card>
    </>
  );
};
