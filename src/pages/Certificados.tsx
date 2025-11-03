import { useState, useEffect, useRef } from "react";
import { useTranslation } from "react-i18next";
import { Card } from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import Draggable from "react-draggable";
import { ResizableBox } from "react-resizable";
import { useReactToPrint } from "react-to-print";
import { FileDown, Plus, Image as ImageIcon, Type, Trash2, FileText } from "lucide-react";
import "react-resizable/css/styles.css";
import diplomaTemplate from "@/assets/diploma-template.jpg";

interface Aluno {
  id: string;
  nome_completo: string;
}

interface DraggableElement {
  id: string;
  type: "image" | "text";
  content: string;
  x: number;
  y: number;
  width: number;
  height: number;
  fontSize?: number;
  fontFamily?: string;
  color?: string;
  textAlign?: string;
}

interface EditorProps {
  elements: DraggableElement[];
  onElementsChange: (elements: DraggableElement[]) => void;
  editorId: string;
  backgroundImage?: string;
}

const CertificateEditor = ({ elements, onElementsChange, editorId, backgroundImage }: EditorProps) => {
  const [selectedId, setSelectedId] = useState<string | null>(null);

  const handleDrag = (id: string, data: any) => {
    const newElements = elements.map(el =>
      el.id === id ? { ...el, x: data.x, y: data.y } : el
    );
    onElementsChange(newElements);
  };

  const handleResize = (id: string, width: number, height: number) => {
    const newElements = elements.map(el =>
      el.id === id ? { ...el, width, height } : el
    );
    onElementsChange(newElements);
  };

  const handleDelete = (id: string) => {
    onElementsChange(elements.filter(el => el.id !== id));
  };

  return (
    <div 
      className="relative w-full h-[600px] border-4 border-primary rounded-lg bg-white overflow-hidden"
      style={{
        backgroundImage: backgroundImage ? `url(${backgroundImage})` : undefined,
        backgroundSize: 'contain',
        backgroundPosition: 'center',
        backgroundRepeat: 'no-repeat',
      }}
    >
      {elements.map((element) => (
        <Draggable
          key={element.id}
          position={{ x: element.x, y: element.y }}
          onStop={(e, data) => handleDrag(element.id, data)}
        >
          <div className="absolute">
            <ResizableBox
              width={element.width}
              height={element.height}
              onResizeStop={(e, data) => handleResize(element.id, data.size.width, data.size.height)}
              minConstraints={[50, 30]}
              maxConstraints={[800, 500]}
            >
              <div
                className={`w-full h-full border-2 ${
                  selectedId === element.id ? "border-destructive" : "border-dashed border-primary"
                } p-2 cursor-move bg-white`}
                onClick={() => setSelectedId(element.id)}
              >
                {element.type === "image" ? (
                  <img src={element.content} alt="" className="w-full h-full object-contain" />
                ) : (
                  <div
                    contentEditable
                    suppressContentEditableWarning
                    style={{
                      fontSize: element.fontSize,
                      fontFamily: element.fontFamily,
                      color: element.color,
                      textAlign: element.textAlign as any,
                    }}
                    className="w-full h-full outline-none"
                    onBlur={(e) => {
                      const newElements = elements.map(el =>
                        el.id === element.id
                          ? { ...el, content: e.currentTarget.textContent || "" }
                          : el
                      );
                      onElementsChange(newElements);
                    }}
                  >
                    {element.content}
                  </div>
                )}
                <Button
                  size="sm"
                  variant="destructive"
                  className="absolute top-0 right-0 h-6 w-6 p-0"
                  onClick={(e) => {
                    e.stopPropagation();
                    handleDelete(element.id);
                  }}
                >
                  <Trash2 className="h-3 w-3" />
                </Button>
              </div>
            </ResizableBox>
          </div>
        </Draggable>
      ))}
    </div>
  );
};

export default function Certificados() {
  const { t } = useTranslation();
  const [alunos, setAlunos] = useState<Aluno[]>([]);
  const [selectedAluno, setSelectedAluno] = useState("");
  const [titulo, setTitulo] = useState("");
  const [elementosFrente, setElementosFrente] = useState<DraggableElement[]>([]);
  const [elementosVerso, setElementosVerso] = useState<DraggableElement[]>([]);
  const [fontSize, setFontSize] = useState(14);
  const [fontColor, setFontColor] = useState("#000000");
  const [fontFamily, setFontFamily] = useState("Arial");
  const [textAlign, setTextAlign] = useState("left");
  const [anoSelecionado, setAnoSelecionado] = useState(new Date().getFullYear());
  const [backgroundFrente, setBackgroundFrente] = useState<string>("");
  const [backgroundVerso, setBackgroundVerso] = useState<string>("");
  const fileInputFrente = useRef<HTMLInputElement>(null);
  const fileInputVerso = useRef<HTMLInputElement>(null);
  const printRef = useRef<HTMLDivElement>(null);

  const handlePrint = useReactToPrint({
    contentRef: printRef,
    documentTitle: `Certificado_${alunos.find(a => a.id === selectedAluno)?.nome_completo || 'aluno'}`,
  });

  useEffect(() => {
    fetchAlunos();
  }, []);

  const fetchAlunos = async () => {
    const { data, error } = await supabase.from("alunos").select("id, nome_completo");
    if (error) {
      toast.error("Erro ao carregar alunos");
      return;
    }
    setAlunos(data || []);
  };

  const adicionarTexto = (editor: "frente" | "verso") => {
    const novoElemento: DraggableElement = {
      id: `txt-${Date.now()}`,
      type: "text",
      content: "Digite aqui",
      x: 100,
      y: 100,
      width: 200,
      height: 50,
      fontSize: 14,
      fontFamily: "Arial",
      color: "#000000",
      textAlign: "left",
    };

    if (editor === "frente") {
      setElementosFrente([...elementosFrente, novoElemento]);
    } else {
      setElementosVerso([...elementosVerso, novoElemento]);
    }
  };

  const adicionarImagem = (file: File, editor: "frente" | "verso") => {
    const reader = new FileReader();
    reader.onload = () => {
      const novoElemento: DraggableElement = {
        id: `img-${Date.now()}`,
        type: "image",
        content: reader.result as string,
        x: 50,
        y: 50,
        width: 150,
        height: 150,
      };

      if (editor === "frente") {
        setElementosFrente([...elementosFrente, novoElemento]);
      } else {
        setElementosVerso([...elementosVerso, novoElemento]);
      }
    };
    reader.readAsDataURL(file);
  };

  const aplicarEstilo = () => {
    const updateElements = (elements: DraggableElement[]) =>
      elements.map((el) => {
        const selected = elementosFrente.concat(elementosVerso).find(e => e.id === el.id);
        if (el.type === "text" && selected) {
          return { ...el, fontSize, fontFamily, color: fontColor, textAlign };
        }
        return el;
      });

    setElementosFrente(updateElements(elementosFrente));
    setElementosVerso(updateElements(elementosVerso));
  };

  const carregarTemplateDiploma = (editor: "frente" | "verso") => {
    if (editor === "frente") {
      setBackgroundFrente(diplomaTemplate);
    } else {
      setBackgroundVerso(diplomaTemplate);
    }
    toast.success("Template de diploma carregado com sucesso!");
  };

  const gerarPDF = async () => {
    const aluno = alunos.find(a => a.id === selectedAluno);
    if (!aluno) {
      toast.error("Selecione um aluno");
      return;
    }

    // Use html2canvas para converter o preview em imagem e adicionar ao PDF
    const element = printRef.current;
    if (!element) return;

    const html2canvas = (await import("html2canvas")).default;
    const jsPDF = (await import("jspdf")).default;
    
    const canvas = await html2canvas(element);
    const imgData = canvas.toDataURL("image/png");
    
    const doc = new jsPDF("landscape", "pt", "a4");
    const pdfWidth = doc.internal.pageSize.getWidth();
    const pdfHeight = doc.internal.pageSize.getHeight();
    const imgWidth = canvas.width;
    const imgHeight = canvas.height;
    const ratio = Math.min(pdfWidth / imgWidth, pdfHeight / imgHeight);
    
    doc.addImage(imgData, "PNG", 0, 0, imgWidth * ratio, imgHeight * ratio);
    
    // Frente
    doc.setFontSize(22);
    doc.text(titulo, 400, 50, { align: "center" });
    
    elementosFrente.forEach((el) => {
      if (el.type === "text") {
        doc.setFontSize(el.fontSize || 14);
        doc.setFont(el.fontFamily || "helvetica");
        doc.text(el.content, el.x, el.y + (el.fontSize || 14));
      }
    });

    // Verso
    doc.addPage();
    doc.setFontSize(18);
    doc.text("Verso do Certificado", 400, 50, { align: "center" });
    
    elementosVerso.forEach((el) => {
      if (el.type === "text") {
        doc.setFontSize(el.fontSize || 14);
        doc.setFont(el.fontFamily || "helvetica");
        doc.text(el.content, el.x, el.y + (el.fontSize || 14));
      }
    });

    doc.save(`${aluno.nome_completo}_certificado.pdf`);
    toast.success("Certificado gerado com sucesso!");
  };

  return (
    <div className="p-6 space-y-6">
      <h1 className="text-3xl font-bold">{t("certificates") || "Certificados"}</h1>

      <Card className="p-6 space-y-4">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div className="space-y-2">
            <Label>Selecionar Aluno</Label>
            <Select value={selectedAluno} onValueChange={setSelectedAluno}>
              <SelectTrigger>
                <SelectValue placeholder="Escolha um aluno" />
              </SelectTrigger>
              <SelectContent>
                {alunos.map((aluno) => (
                  <SelectItem key={aluno.id} value={aluno.id}>
                    {aluno.nome_completo}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-2">
            <Label>Título do Certificado</Label>
            <Input value={titulo} onChange={(e) => setTitulo(e.target.value)} placeholder="Ex: Certificado de Conclusão" />
          </div>

          <div className="space-y-2">
            <Label>Ano</Label>
            <Select value={anoSelecionado.toString()} onValueChange={(value) => setAnoSelecionado(parseInt(value))}>
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {Array.from({ length: 10 }, (_, i) => new Date().getFullYear() - 2 + i).map((ano) => (
                  <SelectItem key={ano} value={ano.toString()}>
                    {ano}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        </div>

        <div className="flex flex-wrap gap-2">
          <Button onClick={() => carregarTemplateDiploma("frente")} variant="default" size="sm">
            <FileText className="w-4 h-4 mr-2" />
            Template Diploma (Frente)
          </Button>
          <Button onClick={() => carregarTemplateDiploma("verso")} variant="default" size="sm">
            <FileText className="w-4 h-4 mr-2" />
            Template Diploma (Verso)
          </Button>
          <Button onClick={() => adicionarTexto("frente")} variant="outline" size="sm">
            <Type className="w-4 h-4 mr-2" />
            Texto Frente
          </Button>
          <Button onClick={() => adicionarTexto("verso")} variant="outline" size="sm">
            <Type className="w-4 h-4 mr-2" />
            Texto Verso
          </Button>
          <Button onClick={() => fileInputFrente.current?.click()} variant="outline" size="sm">
            <ImageIcon className="w-4 h-4 mr-2" />
            Imagem Frente
          </Button>
          <Button onClick={() => fileInputVerso.current?.click()} variant="outline" size="sm">
            <ImageIcon className="w-4 h-4 mr-2" />
            Imagem Verso
          </Button>
        </div>

        <input
          ref={fileInputFrente}
          type="file"
          accept="image/*"
          className="hidden"
          onChange={(e) => e.target.files?.[0] && adicionarImagem(e.target.files[0], "frente")}
        />
        <input
          ref={fileInputVerso}
          type="file"
          accept="image/*"
          className="hidden"
          onChange={(e) => e.target.files?.[0] && adicionarImagem(e.target.files[0], "verso")}
        />

        <div className="space-y-4 border-t pt-4">
          <h3 className="font-semibold">Personalizar Texto</h3>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <div className="space-y-2">
              <Label>Fonte</Label>
              <Select value={fontFamily} onValueChange={setFontFamily}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="Arial">Arial</SelectItem>
                  <SelectItem value="Courier">Courier</SelectItem>
                  <SelectItem value="Times">Times New Roman</SelectItem>
                  <SelectItem value="Verdana">Verdana</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label>Tamanho</Label>
              <Input type="number" value={fontSize} onChange={(e) => setFontSize(Number(e.target.value))} min="8" max="72" />
            </div>
            <div className="space-y-2">
              <Label>Cor</Label>
              <Input type="color" value={fontColor} onChange={(e) => setFontColor(e.target.value)} />
            </div>
            <div className="space-y-2">
              <Label>Alinhamento</Label>
              <Select value={textAlign} onValueChange={setTextAlign}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="left">Esquerda</SelectItem>
                  <SelectItem value="center">Centro</SelectItem>
                  <SelectItem value="right">Direita</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
          <Button onClick={aplicarEstilo} size="sm">Aplicar Estilo</Button>
        </div>
      </Card>

      <Card className="p-6 space-y-4">
        <h3 className="font-semibold text-lg">Editor - Frente</h3>
        <CertificateEditor
          elements={elementosFrente}
          onElementsChange={setElementosFrente}
          editorId="frente"
          backgroundImage={backgroundFrente}
        />
      </Card>

      <Card className="p-6 space-y-4">
        <h3 className="font-semibold text-lg">Editor - Verso</h3>
        <CertificateEditor
          elements={elementosVerso}
          onElementsChange={setElementosVerso}
          editorId="verso"
          backgroundImage={backgroundVerso}
        />
      </Card>

      <div className="flex gap-4">
        <Button onClick={gerarPDF} className="flex-1" size="lg">
          <FileDown className="w-4 h-4 mr-2" />
          Gerar PDF (jsPDF)
        </Button>
        <Button onClick={handlePrint} className="flex-1" size="lg" variant="outline">
          <FileDown className="w-4 h-4 mr-2" />
          Imprimir/Salvar PDF
        </Button>
      </div>

      {/* Preview para impressão */}
      <div ref={printRef} className="hidden print:block">
        <div className="w-full min-h-screen p-8 bg-white">
          <h1 className="text-4xl font-bold text-center mb-8">{titulo}</h1>
          <div 
            className="relative w-full h-[800px]"
            style={{
              backgroundImage: backgroundFrente ? `url(${backgroundFrente})` : undefined,
              backgroundSize: 'contain',
              backgroundPosition: 'center',
              backgroundRepeat: 'no-repeat',
            }}
          >
            {elementosFrente.map((el) => (
              <div
                key={el.id}
                style={{
                  position: 'absolute',
                  left: el.x,
                  top: el.y,
                  width: el.width,
                  height: el.height,
                }}
              >
                {el.type === "image" ? (
                  <img src={el.content} alt="" className="w-full h-full object-contain" />
                ) : (
                  <div
                    style={{
                      fontSize: el.fontSize,
                      fontFamily: el.fontFamily,
                      color: el.color,
                      textAlign: el.textAlign as any,
                    }}
                  >
                    {el.content}
                  </div>
                )}
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
