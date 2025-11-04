import { useState, useEffect } from "react";
import { useTranslation } from "react-i18next";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { Eye, Save } from "lucide-react";
import { Canvas as FabricCanvas, Textbox, FabricImage, util } from "fabric";
import diplomaTemplate from "@/assets/diploma-template.jpg";
import { CertificateTemplateSelector } from "@/components/certificados/CertificateTemplateSelector";
import { CertificateGeneralSettings } from "@/components/certificados/CertificateGeneralSettings";
import { CertificateElementToolbar } from "@/components/certificados/CertificateElementToolbar";
import { CertificateCanvas } from "@/components/certificados/CertificateCanvas";

interface Aluno {
  id: string;
  nome_completo: string;
}

interface Template {
  id: string;
  name: string;
  thumbnail?: string;
  data: any;
}

export default function Certificados() {
  const { t } = useTranslation();
  const [alunos, setAlunos] = useState<Aluno[]>([]);
  const [orientation, setOrientation] = useState<"landscape" | "portrait">("landscape");
  const [backgroundImage, setBackgroundImage] = useState<string>("");
  const [fabricCanvas, setFabricCanvas] = useState<FabricCanvas | null>(null);
  const [selectedTemplate, setSelectedTemplate] = useState<Template | null>(null);
  const [templateName, setTemplateName] = useState("");

  useEffect(() => {
    fetchAlunos();
    setBackgroundImage(diplomaTemplate);
  }, []);

  const fetchAlunos = async () => {
    const { data, error } = await supabase.from("alunos").select("id, nome_completo");
    if (error) {
      toast.error("Erro ao carregar alunos");
      return;
    }
    setAlunos(data || []);
  };

  const handleBackgroundChange = (file: File | null) => {
    if (!file) {
      setBackgroundImage("");
      return;
    }

    const reader = new FileReader();
    reader.onload = () => {
      setBackgroundImage(reader.result as string);
    };
    reader.readAsDataURL(file);
  };

  const handleCanvasReady = (canvas: FabricCanvas) => {
    setFabricCanvas(canvas);
  };

  const addText = () => {
    if (!fabricCanvas) return;

    const text = new Textbox("Digite seu texto", {
      left: 100,
      top: 100,
      width: 300,
      fontSize: 20,
      fontFamily: "Arial",
      fill: "#000000",
    });

    fabricCanvas.add(text);
    fabricCanvas.setActiveObject(text);
    fabricCanvas.renderAll();
    toast.success("Texto adicionado");
  };

  const addCourseName = () => {
    if (!fabricCanvas) return;

    const text = new Textbox("Nome do Curso", {
      left: 100,
      top: 200,
      width: 400,
      fontSize: 24,
      fontFamily: "Arial",
      fontWeight: "bold",
      fill: "#000000",
      textAlign: "center",
    });

    fabricCanvas.add(text);
    fabricCanvas.setActiveObject(text);
    fabricCanvas.renderAll();
    toast.success("Campo de nome do curso adicionado");
  };

  const addStudentName = () => {
    if (!fabricCanvas) return;

    const text = new Textbox("Nome do Aluno", {
      left: 100,
      top: 150,
      width: 400,
      fontSize: 28,
      fontFamily: "Arial",
      fontWeight: "bold",
      fill: "#000000",
      textAlign: "center",
    });

    fabricCanvas.add(text);
    fabricCanvas.setActiveObject(text);
    fabricCanvas.renderAll();
    toast.success("Campo de nome do aluno adicionado");
  };

  const addInstructor = () => {
    if (!fabricCanvas) return;

    const text = new Textbox("Instrutor", {
      left: 100,
      top: 250,
      width: 300,
      fontSize: 18,
      fontFamily: "Arial",
      fill: "#000000",
    });

    fabricCanvas.add(text);
    fabricCanvas.setActiveObject(text);
    fabricCanvas.renderAll();
    toast.success("Campo de instrutor adicionado");
  };

  const addImage = (file: File) => {
    if (!fabricCanvas) return;

    const reader = new FileReader();
    reader.onload = () => {
      util.loadImage(reader.result as string, { crossOrigin: "anonymous" }).then((img) => {
        const fabricImg = new FabricImage(img, {
          left: 50,
          top: 50,
          scaleX: 0.3,
          scaleY: 0.3,
        });

        fabricCanvas.add(fabricImg);
        fabricCanvas.setActiveObject(fabricImg);
        fabricCanvas.renderAll();
        toast.success("Imagem adicionada");
      });
    };
    reader.readAsDataURL(file);
  };

  const saveTemplate = () => {
    if (!fabricCanvas) return;
    if (!templateName.trim()) {
      toast.error("Digite um nome para o template");
      return;
    }

    const json = fabricCanvas.toJSON();
    const thumbnail = fabricCanvas.toDataURL({ multiplier: 0.5, format: "png", quality: 0.5 });

    const newTemplate: Template = {
      id: Date.now().toString(),
      name: templateName,
      thumbnail,
      data: { json, orientation, backgroundImage },
    };

    const saved = localStorage.getItem("certificate_templates");
    const templates: Template[] = saved ? JSON.parse(saved) : [];
    templates.push(newTemplate);
    localStorage.setItem("certificate_templates", JSON.stringify(templates));

    toast.success("Template salvo com sucesso!");
    setTemplateName("");
  };

  const handleSelectTemplate = (template: Template | null) => {
    if (!template) {
      setSelectedTemplate(null);
      if (fabricCanvas) {
        fabricCanvas.clear();
        fabricCanvas.backgroundColor = "#ffffff";
        fabricCanvas.renderAll();
      }
      return;
    }

    setSelectedTemplate(template);
    setOrientation(template.data.orientation);
    setBackgroundImage(template.data.backgroundImage);

    if (fabricCanvas) {
      fabricCanvas.loadFromJSON(template.data.json).then(() => {
        fabricCanvas.renderAll();
        toast.success("Template carregado");
      });
    }
  };

  const handlePreview = () => {
    if (!fabricCanvas) return;

    const dataUrl = fabricCanvas.toDataURL({ multiplier: 2, format: "png", quality: 1.0 });
    const win = window.open();
    if (win) {
      win.document.write(`<img src="${dataUrl}" style="width:100%;"/>`);
    }
  };

  return (
    <div className="min-h-screen bg-background">
      <div className="border-b bg-muted/30">
        <div className="container mx-auto px-6 py-4 flex items-center justify-between">
          <h1 className="text-2xl font-bold">Certificate Builder</h1>
          <div className="flex gap-2">
            <Button variant="outline" onClick={handlePreview}>
              <Eye className="w-4 h-4 mr-2" />
              Preview
            </Button>
            <Button onClick={saveTemplate}>
              <Save className="w-4 h-4 mr-2" />
              Salvar Template
            </Button>
          </div>
        </div>
      </div>

      <div className="container mx-auto px-6 py-6 space-y-6">
        <Card className="p-6">
          <CertificateTemplateSelector
            onSelectTemplate={handleSelectTemplate}
            selectedTemplateId={selectedTemplate?.id || "new"}
          />
        </Card>

        <Card className="p-6 space-y-6">
          <CertificateGeneralSettings
            orientation={orientation}
            onOrientationChange={setOrientation}
            backgroundImage={backgroundImage}
            onBackgroundChange={handleBackgroundChange}
          />

          <CertificateElementToolbar
            onAddText={addText}
            onAddCourseName={addCourseName}
            onAddStudentName={addStudentName}
            onAddImage={addImage}
            onAddInstructor={addInstructor}
          />

          <div className="space-y-2 pt-4 border-t">
            <Label>Nome do Template (para salvar)</Label>
            <Input
              value={templateName}
              onChange={(e) => setTemplateName(e.target.value)}
              placeholder="Digite o nome do template..."
            />
          </div>
        </Card>

        <CertificateCanvas
          orientation={orientation}
          backgroundImage={backgroundImage}
          onCanvasReady={handleCanvasReady}
        />
      </div>
    </div>
  );
}
