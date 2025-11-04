import { useState, useEffect, useRef } from "react";
import { useTranslation } from "react-i18next";
import { Card } from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { useReactToPrint } from "react-to-print";
import { FileDown } from "lucide-react";
import diplomaTemplate from "@/assets/diploma-template.jpg";
import {
  CertificateEditor,
  DraggableElement,
} from "@/components/certificados/CertificateEditor";
import { CertificateToolbar } from "@/components/certificados/CertificateToolbar";
import { TextStyleControls } from "@/components/certificados/TextStyleControls";
import { CertificatePrintPreview } from "@/components/certificados/CertificatePrintPreview";

interface Aluno {
  id: string;
  nome_completo: string;
}

export default function Certificados() {
  const { t } = useTranslation();
  const [alunos, setAlunos] = useState<Aluno[]>([]);
  const [selectedAluno, setSelectedAluno] = useState("");
  const [titulo, setTitulo] = useState("");
  const [elementosFrente, setElementosFrente] = useState<DraggableElement[]>([]);
  const [elementosVerso, setElementosVerso] = useState<DraggableElement[]>([]);
  const [fontSize, setFontSize] = useState(16);
  const [fontColor, setFontColor] = useState("#000000");
  const [fontFamily, setFontFamily] = useState("Arial");
  const [textAlign, setTextAlign] = useState("center");
  const [anoSelecionado, setAnoSelecionado] = useState(new Date().getFullYear());
  const [backgroundFrente, setBackgroundFrente] = useState<string>("");
  const [backgroundVerso, setBackgroundVerso] = useState<string>("");
  const printRef = useRef<HTMLDivElement>(null);

  const handlePrint = useReactToPrint({
    contentRef: printRef,
    documentTitle: `Certificado_${
      alunos.find((a) => a.id === selectedAluno)?.nome_completo || "aluno"
    }`,
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
      content: "Digite aqui o texto",
      x: 100,
      y: 100,
      width: 300,
      height: 60,
      fontSize: 16,
      fontFamily: "Arial",
      color: "#000000",
      textAlign: "center",
    };

    if (editor === "frente") {
      setElementosFrente([...elementosFrente, novoElemento]);
    } else {
      setElementosVerso([...elementosVerso, novoElemento]);
    }
    toast.success(`Texto adicionado ao ${editor}`);
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
      toast.success(`Imagem adicionada ao ${editor}`);
    };
    reader.readAsDataURL(file);
  };

  const aplicarEstilo = () => {
    const updateElements = (elements: DraggableElement[]) =>
      elements.map((el) => {
        if (el.type === "text") {
          return { ...el, fontSize, fontFamily, color: fontColor, textAlign };
        }
        return el;
      });

    setElementosFrente(updateElements(elementosFrente));
    setElementosVerso(updateElements(elementosVerso));
    toast.success("Estilo aplicado aos textos");
  };

  const carregarTemplateDiploma = (editor: "frente" | "verso") => {
    if (editor === "frente") {
      setBackgroundFrente(diplomaTemplate);
    } else {
      setBackgroundVerso(diplomaTemplate);
    }
    toast.success(`Template de diploma carregado no ${editor}`);
  };

  const gerarPDF = async () => {
    const aluno = alunos.find((a) => a.id === selectedAluno);
    if (!aluno) {
      toast.error("Selecione um aluno");
      return;
    }

    const element = printRef.current;
    if (!element) return;

    try {
      const html2canvas = (await import("html2canvas")).default;
      const jsPDF = (await import("jspdf")).default;

      const canvas = await html2canvas(element, {
        scale: 2,
        useCORS: true,
        backgroundColor: "#ffffff",
      });
      const imgData = canvas.toDataURL("image/png");

      const doc = new jsPDF("landscape", "pt", "a4");
      const pdfWidth = doc.internal.pageSize.getWidth();
      const pdfHeight = doc.internal.pageSize.getHeight();
      const imgWidth = canvas.width;
      const imgHeight = canvas.height;
      const ratio = Math.min(pdfWidth / imgWidth, pdfHeight / imgHeight);

      doc.addImage(imgData, "PNG", 0, 0, imgWidth * ratio, imgHeight * ratio);

      // Adicionar verso se houver elementos
      if (elementosVerso.length > 0 || backgroundVerso) {
        doc.addPage();
        doc.setFontSize(18);
        doc.text("Verso do Certificado", pdfWidth / 2, 50, { align: "center" });
      }

      doc.save(`${aluno.nome_completo}_certificado_${anoSelecionado}.pdf`);
      toast.success("Certificado gerado com sucesso!");
    } catch (error) {
      console.error("Erro ao gerar PDF:", error);
      toast.error("Erro ao gerar o PDF");
    }
  };

  return (
    <div className="p-6 space-y-6">
      <div>
        <h1 className="text-3xl font-bold">
          {t("certificates") || "Certificados e Diplomas"}
        </h1>
        <p className="text-muted-foreground mt-2">
          Crie e personalize certificados profissionais com templates editáveis
        </p>
      </div>

      <Card className="p-6 space-y-6">
        <div>
          <h2 className="text-xl font-semibold mb-4">Informações do Certificado</h2>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
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
              <Input
                value={titulo}
                onChange={(e) => setTitulo(e.target.value)}
                placeholder="Ex: Certificado de Conclusão"
              />
            </div>

            <div className="space-y-2">
              <Label>Ano</Label>
              <Select
                value={anoSelecionado.toString()}
                onValueChange={(value) => setAnoSelecionado(parseInt(value))}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {Array.from({ length: 10 }, (_, i) => new Date().getFullYear() - 2 + i).map(
                    (ano) => (
                      <SelectItem key={ano} value={ano.toString()}>
                        {ano}
                      </SelectItem>
                    )
                  )}
                </SelectContent>
              </Select>
            </div>
          </div>
        </div>

        <CertificateToolbar
          onAddText={adicionarTexto}
          onAddImage={adicionarImagem}
          onLoadTemplate={carregarTemplateDiploma}
        />

        <TextStyleControls
          fontFamily={fontFamily}
          fontSize={fontSize}
          fontColor={fontColor}
          textAlign={textAlign}
          onFontFamilyChange={setFontFamily}
          onFontSizeChange={setFontSize}
          onFontColorChange={setFontColor}
          onTextAlignChange={setTextAlign}
          onApplyStyle={aplicarEstilo}
        />
      </Card>

      <Card className="p-6">
        <CertificateEditor
          elements={elementosFrente}
          onElementsChange={setElementosFrente}
          backgroundImage={backgroundFrente}
          editorTitle="Editor - Frente do Certificado"
        />
      </Card>

      <Card className="p-6">
        <CertificateEditor
          elements={elementosVerso}
          onElementsChange={setElementosVerso}
          backgroundImage={backgroundVerso}
          editorTitle="Editor - Verso do Certificado"
        />
      </Card>

      <div className="flex gap-4">
        <Button onClick={gerarPDF} className="flex-1" size="lg">
          <FileDown className="w-4 h-4 mr-2" />
          Gerar PDF
        </Button>
        <Button onClick={handlePrint} className="flex-1" size="lg" variant="outline">
          <FileDown className="w-4 h-4 mr-2" />
          Imprimir/Salvar PDF
        </Button>
      </div>

      <CertificatePrintPreview
        ref={printRef}
        titulo={titulo}
        backgroundFrente={backgroundFrente}
        elementosFrente={elementosFrente}
      />
    </div>
  );
}