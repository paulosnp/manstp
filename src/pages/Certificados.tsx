import { useState, useEffect, useRef } from "react";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { toast } from "sonner";
import { v4 as uuidv4 } from "uuid";
import diplomaTemplate from "@/assets/diploma-template.jpg";
import { CertificateKonvaCanvas } from "@/components/certificados/CertificateKonvaCanvas";

interface Element {
  id: string;
  type: "text" | "image";
  x: number;
  y: number;
  [key: string]: any;
}

interface Template {
  id: string;
  name: string;
  thumbnail?: string;
  data: {
    elements: Element[];
    orientation: "landscape" | "portrait";
    backgroundImage: string;
  };
}

export default function Certificados() {
  const [orientation, setOrientation] = useState<"landscape" | "portrait">("landscape");
  const [backgroundImage, setBackgroundImage] = useState<string>("");
  const [elements, setElements] = useState<Element[]>([]);
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [selectedTemplate, setSelectedTemplate] = useState<Template | null>(null);
  const [templateName, setTemplateName] = useState("");
  const [stageRef, setStageRef] = useState<any>(null);
  const [backgroundOpacity, setBackgroundOpacity] = useState(1);
  const fileInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    setBackgroundImage(diplomaTemplate);
  }, []);

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

  const addText = () => {
    const newElement: Element = {
      id: uuidv4(),
      type: "text",
      x: 100,
      y: 100,
      text: "Digite seu texto",
      fontSize: 20,
      fontFamily: "Arial",
      fill: "#000000",
    };
    setElements([...elements, newElement]);
    toast.success("Texto adicionado");
  };

  const addCourseName = () => {
    const newElement: Element = {
      id: uuidv4(),
      type: "text",
      x: 100,
      y: 200,
      text: "Nome do Curso",
      fontSize: 24,
      fontFamily: "Arial",
      fontWeight: "bold",
      fill: "#000000",
      textAlign: "center",
    };
    setElements([...elements, newElement]);
    toast.success("Campo de nome do curso adicionado");
  };

  const addStudentName = () => {
    const newElement: Element = {
      id: uuidv4(),
      type: "text",
      x: 100,
      y: 150,
      text: "Nome do Aluno",
      fontSize: 28,
      fontFamily: "Arial",
      fontWeight: "bold",
      fill: "#000000",
      textAlign: "center",
    };
    setElements([...elements, newElement]);
    toast.success("Campo de nome do aluno adicionado");
  };

  const addInstructor = () => {
    const newElement: Element = {
      id: uuidv4(),
      type: "text",
      x: 100,
      y: 250,
      text: "Instrutor",
      fontSize: 18,
      fontFamily: "Arial",
      fill: "#000000",
    };
    setElements([...elements, newElement]);
    toast.success("Campo de instrutor adicionado");
  };

  const addImage = () => {
    fileInputRef.current?.click();
  };

  const handleImageUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = () => {
      const newElement: Element = {
        id: uuidv4(),
        type: "image",
        src: reader.result as string,
        x: 50,
        y: 50,
        width: 100,
        height: 100,
        opacity: 1,
      };
      setElements([...elements, newElement]);
      toast.success("Imagem adicionada");
    };
    reader.readAsDataURL(file);
  };

  const updateElement = (updated: Element) => {
    setElements(elements.map((el) => (el.id === updated.id ? updated : el)));
  };

  const moveLayer = (direction: "front" | "back") => {
    if (!selectedId) return;

    const index = elements.findIndex((el) => el.id === selectedId);
    if (index === -1) return;

    const newElements = [...elements];
    if (direction === "front" && index < elements.length - 1) {
      [newElements[index], newElements[index + 1]] = [
        newElements[index + 1],
        newElements[index],
      ];
    } else if (direction === "back" && index > 0) {
      [newElements[index], newElements[index - 1]] = [
        newElements[index - 1],
        newElements[index],
      ];
    }
    setElements(newElements);
    toast.success("Camada alterada");
  };

  const deleteElement = () => {
    if (!selectedId) return;
    setElements(elements.filter((el) => el.id !== selectedId));
    setSelectedId(null);
    toast.success("Elemento excluído");
  };

  const saveTemplate = () => {
    if (!stageRef) return;
    if (!templateName.trim()) {
      toast.error("Digite um nome para o template");
      return;
    }

    const thumbnail = stageRef.toDataURL({ pixelRatio: 0.5 });

    const newTemplate: Template = {
      id: Date.now().toString(),
      name: templateName,
      thumbnail,
      data: { elements, orientation, backgroundImage },
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
      setElements([]);
      setSelectedId(null);
      return;
    }

    setSelectedTemplate(template);
    setOrientation(template.data.orientation);
    setBackgroundImage(template.data.backgroundImage);
    setElements(template.data.elements);
    toast.success("Template carregado");
  };

  const handlePreview = () => {
    if (!stageRef) return;

    const dataUrl = stageRef.toDataURL({ pixelRatio: 2 });
    const win = window.open();
    if (win) {
      win.document.write(`<img src="${dataUrl}" style="width:100%;"/>`);
    }
  };

  return (
    <div className="min-h-screen bg-background flex">
      {/* Input escondido para upload de imagens */}
      <input
        type="file"
        accept="image/*"
        className="hidden"
        ref={fileInputRef}
        onChange={handleImageUpload}
      />
      
      {/* Sidebar à esquerda */}
      <div className="w-72 border-r bg-card p-6 space-y-4 overflow-y-auto">
        <h2 className="text-lg font-semibold mb-6">Controles</h2>
        
        {/* Botões principais */}
        <div className="space-y-2">
          <Button 
            variant="outline" 
            className="w-full justify-start"
            onClick={addText}
          >
            Adicionar Texto
          </Button>
          
          <Button 
            variant="outline" 
            className="w-full justify-start"
            onClick={addImage}
          >
            Adicionar Imagem
          </Button>
          
          <Button 
            variant="default" 
            className="w-full justify-start"
            onClick={handlePreview}
          >
            Exportar Certificado
          </Button>
        </div>

        {/* Imagem de fundo */}
        <div className="pt-4 space-y-3">
          <Label className="text-base">Imagem de Fundo:</Label>
          <div className="space-y-2">
            <input
              ref={fileInputRef}
              type="file"
              accept="image/*"
              className="hidden"
              onChange={(e) => {
                const file = e.target.files?.[0];
                if (file) handleBackgroundChange(file);
              }}
            />
            <Button
              variant="outline"
              className="w-full"
              onClick={() => fileInputRef.current?.click()}
            >
              Escolher arquivo
            </Button>
            <p className="text-xs text-muted-foreground">
              {backgroundImage ? "Arquivo selecionado" : "Nenhum arquivo selecionado"}
            </p>
          </div>
        </div>

        {/* Slider de transparência */}
        <div className="pt-4 space-y-3">
          <Label className="text-base">Transparência:</Label>
          <input
            type="range"
            min="0"
            max="1"
            step="0.01"
            value={backgroundOpacity}
            onChange={(e) => setBackgroundOpacity(parseFloat(e.target.value))}
            className="w-full"
          />
          <p className="text-xs text-right text-muted-foreground">
            {backgroundOpacity.toFixed(2)}
          </p>
        </div>

        {/* Controles de camada (aparecem quando algo está selecionado) */}
        {selectedId && (
          <div className="pt-4 space-y-2 border-t">
            <Button
              variant="outline"
              className="w-full"
              onClick={() => moveLayer("front")}
            >
              Trazer para Frente
            </Button>
            <Button
              variant="outline"
              className="w-full"
              onClick={() => moveLayer("back")}
            >
              Enviar para Trás
            </Button>
          </div>
        )}
      </div>

      {/* Canvas à direita */}
      <div className="flex-1 p-8 overflow-auto">
        <CertificateKonvaCanvas
          orientation={orientation}
          backgroundImage={backgroundImage}
          elements={elements}
          selectedId={selectedId}
          onSelectElement={setSelectedId}
          onUpdateElement={updateElement}
          onStageReady={setStageRef}
          backgroundOpacity={backgroundOpacity}
        />
      </div>
    </div>
  );
}
