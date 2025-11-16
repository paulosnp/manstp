import { useState, useEffect } from "react";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { toast } from "sonner";
import { v4 as uuidv4 } from "uuid";
import jsPDF from "jspdf";
import diplomaTemplate from "@/assets/diploma-template.jpg";
import { CertificateTemplateSelector } from "@/components/certificados/CertificateTemplateSelector";
import { CertificateKonvaCanvas } from "@/components/certificados/CertificateKonvaCanvas";
import { PowerPointToolbar } from "@/components/certificados/PowerPointToolbar";
import { SlidesPanel } from "@/components/certificados/SlidesPanel";
import { useCertificateTemplates } from "@/hooks/useCertificateTemplates";
import { ScrollArea } from "@/components/ui/scroll-area";
import { supabase } from "@/integrations/supabase/client";

interface Element {
  id: string;
  type: "text" | "image";
  x: number;
  y: number;
  [key: string]: any;
}

interface Slide {
  id: string;
  thumbnail?: string;
  elements: Element[];
  orientation: "landscape" | "portrait";
  backgroundImage: string;
  alunoId?: string;
  alunoNome?: string;
}

interface Template {
  id: string;
  name: string;
  thumbnail?: string;
  turmaId?: string | null;
  data: {
    elements: Element[];
    orientation: "landscape" | "portrait";
    backgroundImage: string;
  };
}

export default function Certificados() {
  const { saveTemplate: saveTemplateToDb, updateTemplate } = useCertificateTemplates();
  const [slides, setSlides] = useState<Slide[]>([
    {
      id: uuidv4(),
      elements: [],
      orientation: "landscape",
      backgroundImage: "",
      thumbnail: undefined,
    },
  ]);
  const [activeSlideId, setActiveSlideId] = useState<string>(slides[0].id);
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [selectedTemplate, setSelectedTemplate] = useState<Template | null>(null);
  const [templateName, setTemplateName] = useState("");
  const [stageRef, setStageRef] = useState<any>(null);
  const [currentFont, setCurrentFont] = useState<string>("Arial");
  const [selectedTurmaId, setSelectedTurmaId] = useState<string | null>(null);
  const [showSlidesPanel, setShowSlidesPanel] = useState(true);
  const [showRulers, setShowRulers] = useState(false);

  const activeSlide = slides.find((s) => s.id === activeSlideId) || slides[0];
  const orientation = activeSlide.orientation;
  const backgroundImage = activeSlide.backgroundImage;
  const elements = activeSlide.elements;

  useEffect(() => {
    setSlides([
      {
        id: uuidv4(),
        elements: [],
        orientation: "landscape",
        backgroundImage: "",
        thumbnail: undefined,
      },
    ]);
  }, []);

  // Criar slides automaticamente quando turma é selecionada
  useEffect(() => {
    if (selectedTurmaId && selectedTemplate && selectedTemplate.id !== "new") {
      fetchAlunosAndCreateSlides();
    }
  }, [selectedTurmaId, selectedTemplate?.id]);

  const fetchAlunosAndCreateSlides = async () => {
    if (!selectedTurmaId || !selectedTemplate) return;

    try {
      const { data, error } = await supabase
        .from("aluno_turma")
        .select(`
          aluno_id,
          alunos (
            id,
            nome_completo,
            matricula
          )
        `)
        .eq("turma_id", selectedTurmaId);

      if (error) throw error;

      const alunosList = (data || [])
        .map((at: any) => at.alunos)
        .filter(Boolean);

      if (alunosList.length === 0) {
        toast.info("Nenhum aluno encontrado nesta turma");
        return;
      }

      // Criar um slide para cada aluno
      const newSlides: Slide[] = alunosList.map((aluno: any) => ({
        id: uuidv4(),
        elements: selectedTemplate.data.elements.map((el: any) => ({
          ...el,
          id: uuidv4(),
        })),
        orientation: selectedTemplate.data.orientation,
        backgroundImage: selectedTemplate.data.backgroundImage,
        thumbnail: undefined,
        alunoId: aluno.id,
        alunoNome: aluno.nome_completo,
      }));

      setSlides(newSlides);
      setActiveSlideId(newSlides[0].id);
      toast.success(`${alunosList.length} slides criados para os alunos da turma`);
    } catch (error) {
      console.error("Erro ao buscar alunos:", error);
      toast.error("Erro ao carregar alunos da turma");
    }
  };

  const updateActiveSlide = (updates: Partial<Slide>) => {
    setSlides((prev) =>
      prev.map((slide) =>
        slide.id === activeSlideId ? { ...slide, ...updates } : slide
      )
    );
  };

  const updateSlideThumbnail = () => {
    if (!stageRef) return;
    const thumbnail = stageRef.toDataURL({ pixelRatio: 0.3 });
    updateActiveSlide({ thumbnail });
  };

  const setOrientation = (newOrientation: "landscape" | "portrait") => {
    updateActiveSlide({ orientation: newOrientation });
  };

  const setBackgroundImage = (image: string) => {
    updateActiveSlide({ backgroundImage: image });
  };

  const setElements = (newElements: Element[]) => {
    updateActiveSlide({ elements: newElements });
    setTimeout(updateSlideThumbnail, 100);
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

  const addText = () => {
    const newElement: Element = {
      id: uuidv4(),
      type: "text",
      x: 100,
      y: 100,
      text: "Digite seu texto",
      fontSize: 20,
      fontFamily: currentFont,
      fill: "#000000",
      opacity: 1,
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
      fontFamily: currentFont,
      fontWeight: "bold",
      fill: "#000000",
      textAlign: "center",
      opacity: 1,
      width: 600,
      lineHeight: 1.2,
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
      fontFamily: currentFont,
      fontWeight: "bold",
      fill: "#000000",
      textAlign: "center",
      opacity: 1,
      width: 600,
      lineHeight: 1.2,
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
      fontFamily: currentFont,
      fill: "#000000",
      opacity: 1,
      width: 400,
      lineHeight: 1.2,
    };
    setElements([...elements, newElement]);
    toast.success("Campo de instrutor adicionado");
  };

  const addStamp = () => {
    const stampId = uuidv4();
    const baseX = 100;
    const baseY = 400;
    
    const stampElements: Element[] = [
      {
        id: uuidv4(),
        type: "text",
        x: baseX,
        y: baseY,
        text: "Nome Completo",
        fontSize: 12,
        fontFamily: currentFont,
        fill: "#000000",
        textAlign: "center",
        width: 200,
        opacity: 1,
        lineHeight: 1.2,
      },
      {
        id: uuidv4(),
        type: "text",
        x: baseX,
        y: baseY + 20,
        text: "Posto/Graduação",
        fontSize: 12,
        fontFamily: currentFont,
        fill: "#000000",
        textAlign: "center",
        width: 200,
        opacity: 1,
        lineHeight: 1.2,
      },
      {
        id: uuidv4(),
        type: "text",
        x: baseX,
        y: baseY + 40,
        text: "Função",
        fontSize: 12,
        fontFamily: currentFont,
        fill: "#000000",
        textAlign: "center",
        width: 200,
        opacity: 1,
        lineHeight: 1.2,
      },
    ];
    
    setElements([...elements, ...stampElements]);
    toast.success("Carimbo adicionado com 3 linhas");
  };

  const addShape = (shape: "rectangle" | "circle" | "line") => {
    const newElement: Element = {
      id: uuidv4(),
      type: "image",
      x: 100,
      y: 100,
      width: 100,
      height: 100,
      shape: shape,
    };
    setElements([...elements, newElement]);
    toast.success("Forma adicionada");
  };

  const addImage = (file: File) => {
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

  const handleBackgroundUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      handleBackgroundChange(file);
    }
  };

  const updateElement = (updated: Element) => {
    setElements(elements.map((el) => (el.id === updated.id ? updated : el)));
  };

  const replaceImage = (file: File) => {
    if (!selectedId) return;
    
    const selectedElement = elements.find((el) => el.id === selectedId);
    if (!selectedElement || selectedElement.type !== "image") {
      toast.error("Selecione uma imagem para substituir");
      return;
    }

    const reader = new FileReader();
    reader.onload = () => {
      const updatedElement = {
        ...selectedElement,
        src: reader.result as string,
      };
      updateElement(updatedElement);
      toast.success("Imagem substituída");
    };
    reader.readAsDataURL(file);
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

  const saveTemplate = async () => {
    if (!stageRef) return;
    if (!templateName.trim()) {
      toast.error("Digite um nome para o template");
      return;
    }

    const thumbnail = stageRef.toDataURL({ pixelRatio: 0.5 });

    if (selectedTemplate?.id && selectedTemplate.id !== "new") {
      // Atualizar template existente
      await updateTemplate(
        selectedTemplate.id,
        templateName,
        thumbnail,
        selectedTurmaId,
        orientation,
        backgroundImage,
        elements
      );
    } else {
      // Criar novo template
      const newId = await saveTemplateToDb(
        templateName,
        thumbnail,
        selectedTurmaId,
        orientation,
        backgroundImage,
        elements
      );

      if (newId) {
        setSelectedTemplate({
          id: newId,
          name: templateName,
          thumbnail,
          turmaId: selectedTurmaId,
          data: { elements, orientation, backgroundImage },
        });
      }
    }

    setTemplateName("");
  };

  const handleSelectTemplate = (template: Template | null) => {
    if (!template) {
      setSelectedTemplate(null);
      setSlides([
        {
          id: uuidv4(),
          elements: [],
          orientation: "landscape",
          backgroundImage: "",
          thumbnail: undefined,
        },
      ]);
      setSelectedId(null);
      setSelectedTurmaId(null);
      setTemplateName("");
      return;
    }

    setSelectedTemplate(template);
    setSlides([
      {
        id: uuidv4(),
        elements: template.data.elements,
        orientation: template.data.orientation,
        backgroundImage: template.data.backgroundImage,
        thumbnail: undefined,
      },
    ]);
    setActiveSlideId(slides[0]?.id || uuidv4());
    setSelectedTurmaId(template.turmaId || null);
    setTemplateName(template.name);
    toast.success("Template carregado");
  };

  const handleAddSlide = () => {
    const newSlide: Slide = {
      id: uuidv4(),
      elements: [],
      orientation: "landscape",
      backgroundImage: "",
      thumbnail: undefined,
    };
    setSlides([...slides, newSlide]);
    setActiveSlideId(newSlide.id);
    toast.success("Novo slide adicionado");
  };

  const handleDuplicateSlide = (slideId: string) => {
    const slideToDuplicate = slides.find((s) => s.id === slideId);
    if (!slideToDuplicate) return;

    const duplicatedSlide: Slide = {
      ...slideToDuplicate,
      id: uuidv4(),
      elements: slideToDuplicate.elements.map((el) => ({ ...el, id: uuidv4() })),
      alunoId: undefined,
      alunoNome: undefined,
    };

    const slideIndex = slides.findIndex((s) => s.id === slideId);
    const newSlides = [...slides];
    newSlides.splice(slideIndex + 1, 0, duplicatedSlide);
    setSlides(newSlides);
    setActiveSlideId(duplicatedSlide.id);
    toast.success("Slide duplicado - vincule a um aluno");
  };

  const handleDeleteSlide = (slideId: string) => {
    if (slides.length === 1) {
      toast.error("Não é possível excluir o último slide");
      return;
    }

    const newSlides = slides.filter((s) => s.id !== slideId);
    setSlides(newSlides);
    
    if (activeSlideId === slideId) {
      setActiveSlideId(newSlides[0].id);
    }
    
    toast.success("Slide excluído");
  };

  const handlePreview = () => {
    if (!stageRef) return;

    const dataUrl = stageRef.toDataURL({ pixelRatio: 2 });
    const win = window.open();
    if (win) {
      win.document.write(`<img src="${dataUrl}" style="width:100%;"/>`);
    }
  };

  const exportToPDF = async () => {
    if (!stageRef) return;

    const fileName = activeSlide.alunoNome 
      ? `certificado-${activeSlide.alunoNome.replace(/\s+/g, '_')}.pdf`
      : `certificado-${Date.now()}.pdf`;

    const dataUrl = stageRef.toDataURL({ pixelRatio: 2 });
    const pdf = new jsPDF({
      orientation: orientation === "landscape" ? "landscape" : "portrait",
      unit: "px",
      format: orientation === "landscape" ? [900, 600] : [600, 900],
    });

    const img = new Image();
    img.onload = async () => {
      pdf.addImage(dataUrl, "PNG", 0, 0, pdf.internal.pageSize.getWidth(), pdf.internal.pageSize.getHeight());
      
      // Usar File System Access API para escolher onde salvar
      try {
        const blob = pdf.output('blob');
        
        // Verificar se o navegador suporta File System Access API
        if ('showSaveFilePicker' in window) {
          const handle = await (window as any).showSaveFilePicker({
            suggestedName: fileName,
            types: [{
              description: 'PDF Document',
              accept: { 'application/pdf': ['.pdf'] },
            }],
          });
          
          const writable = await handle.createWritable();
          await writable.write(blob);
          await writable.close();
          toast.success("PDF salvo com sucesso!");
        } else {
          // Fallback para navegadores que não suportam
          pdf.save(fileName);
          toast.success("PDF exportado com sucesso!");
        }
      } catch (error: any) {
        if (error.name !== 'AbortError') {
          console.error('Erro ao salvar PDF:', error);
          // Fallback em caso de erro
          pdf.save(fileName);
          toast.success("PDF exportado com sucesso!");
        }
      }
    };
    img.src = dataUrl;
  };

  const exportAllToPDF = async () => {
    if (!stageRef) {
      toast.error("Canvas não está pronto");
      return;
    }

    try {
      // Pedir ao usuário para escolher a pasta
      let dirHandle;
      if ('showDirectoryPicker' in window) {
        dirHandle = await (window as any).showDirectoryPicker();
      }

      toast.info("Gerando certificados...");
      
      for (const slide of slides) {
        if (!slide.alunoNome) continue;

        // Temporariamente ativar o slide para renderizar
        setActiveSlideId(slide.id);
        await new Promise(resolve => setTimeout(resolve, 500)); // Aguardar renderização

        const dataUrl = stageRef.toDataURL({ pixelRatio: 2 });
        const pdf = new jsPDF({
          orientation: slide.orientation === "landscape" ? "landscape" : "portrait",
          unit: "px",
          format: slide.orientation === "landscape" ? [900, 600] : [600, 900],
        });

        const img = new Image();
        await new Promise((resolve) => {
          img.onload = resolve;
          img.src = dataUrl;
        });

        pdf.addImage(dataUrl, "PNG", 0, 0, pdf.internal.pageSize.getWidth(), pdf.internal.pageSize.getHeight());
        
        const fileName = `certificado-${slide.alunoNome.replace(/\s+/g, '_')}.pdf`;
        const blob = pdf.output('blob');

        if (dirHandle) {
          const fileHandle = await dirHandle.getFileHandle(fileName, { create: true });
          const writable = await fileHandle.createWritable();
          await writable.write(blob);
          await writable.close();
        } else {
          pdf.save(fileName);
        }
      }

      toast.success("Todos os certificados foram exportados!");
    } catch (error: any) {
      if (error.name !== 'AbortError') {
        console.error('Erro ao exportar certificados:', error);
        toast.error("Erro ao exportar certificados");
      }
    }
  };

  const handleGenerateCertificate = (studentName: string) => {
    // Atualizar elementos com o nome do aluno
    const updatedElements = elements.map((el) => {
      if (el.type === "text") {
        let text = el.text;
        if (text.includes("Nome do Aluno") || text.toLowerCase().includes("aluno")) {
          text = studentName;
        }
        return { ...el, text };
      }
      return el;
    });
    setElements(updatedElements);
  };

  const selectedElement = elements.find((el) => el.id === selectedId);

  return (
    <div className="min-h-screen bg-background flex flex-col">
      {/* Toolbar tipo PowerPoint */}
      <div className="flex items-center gap-2 border-b bg-background px-2 py-1">
        <div className="flex gap-1 border-r pr-2">
          <Button
            variant={showSlidesPanel ? "default" : "outline"}
            size="sm"
            onClick={() => setShowSlidesPanel(!showSlidesPanel)}
            title="Exibir/Ocultar Slides"
          >
            📑
          </Button>
        </div>
        <div className="flex-1">
          <PowerPointToolbar
            selectedElement={selectedElement}
            onUpdateElement={updateElement}
            onAddText={addText}
            onAddImage={addImage}
            onAddShape={addShape}
            onDelete={deleteElement}
            onMoveLayer={moveLayer}
            onSave={saveTemplate}
            onPreview={handlePreview}
            onExport={exportToPDF}
            onExportAll={exportAllToPDF}
            currentFont={currentFont}
            onFontChange={setCurrentFont}
            templateName={templateName}
            onTemplateNameChange={setTemplateName}
            selectedTemplateId={selectedTemplate?.id || "new"}
            onSelectTemplate={handleSelectTemplate}
            onAddStudentName={addStudentName}
            onAddCourseName={addCourseName}
            onAddInstructor={addInstructor}
            onAddStamp={addStamp}
            orientation={orientation}
            onOrientationChange={setOrientation}
            backgroundImage={backgroundImage}
            onBackgroundUpload={handleBackgroundUpload}
            selectedTurmaId={selectedTurmaId}
            onSelectTurma={setSelectedTurmaId}
            showRulers={showRulers}
            onToggleRulers={() => setShowRulers(!showRulers)}
          />
        </div>
      </div>

      {/* Conteúdo principal */}
      <div className="flex-1 flex overflow-hidden">
        {/* Painel de Slides (miniaturas) */}
        {showSlidesPanel && (
          <SlidesPanel
            slides={slides}
            activeSlideId={activeSlideId}
            onSelectSlide={setActiveSlideId}
            onDuplicateSlide={handleDuplicateSlide}
            onDeleteSlide={handleDeleteSlide}
            onAddSlide={handleAddSlide}
            turmaId={selectedTurmaId}
            onLinkStudent={(slideId, alunoId, alunoNome) => {
              setSlides(prev => prev.map(s => 
                s.id === slideId ? { ...s, alunoId, alunoNome } : s
              ));
              toast.success(`Slide vinculado a ${alunoNome}`);
            }}
          />
        )}


        {/* Área central - Canvas */}
        <div className="flex-1 flex flex-col bg-muted/30">
          <ScrollArea className="flex-1">
            <div className="flex items-center justify-center min-h-full p-8">
              <CertificateKonvaCanvas
                orientation={orientation}
                backgroundImage={backgroundImage}
                elements={elements}
                selectedId={selectedId}
                onSelectElement={setSelectedId}
                onUpdateElement={updateElement}
                onStageReady={setStageRef}
                showRulers={showRulers}
              />
            </div>
          </ScrollArea>
        </div>
      </div>
    </div>
  );
}
