import { Button } from "@/components/ui/button";
import { Separator } from "@/components/ui/separator";
import {
  Bold,
  Italic,
  Underline,
  AlignLeft,
  AlignCenter,
  AlignRight,
  AlignJustify,
  Type,
  Image as ImageIcon,
  Layers,
  Trash2,
  Copy,
  Scissors,
  Clipboard,
  Undo,
  Redo,
  ZoomIn,
  ZoomOut,
  Save,
  Eye,
  Download,
  Square,
  Circle,
  Triangle,
  Minus,
  Plus,
  Palette,
  Upload,
  Ruler,
} from "lucide-react";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { TemplateDropdown } from "./TemplateDropdown";
import { TurmaAssociation } from "./TurmaAssociation";
import { OpacityControl } from "./OpacityControl";
import { useState, useEffect } from "react";

interface PowerPointToolbarProps {
  selectedElement: any;
  onUpdateElement: (element: any) => void;
  onAddText: () => void;
  onAddImage: (file: File) => void;
  onAddShape: (shape: "rectangle" | "circle" | "line") => void;
  onDelete: () => void;
  onMoveLayer: (direction: "front" | "back") => void;
  onSave: () => void;
  onPreview: () => void;
  onExport: () => void;
  onExportAll?: () => void;
  currentFont: string;
  onFontChange: (font: string) => void;
  templateName: string;
  onTemplateNameChange: (name: string) => void;
  selectedTemplateId: string;
  onSelectTemplate: (template: any) => void;
  onAddStudentName: () => void;
  onAddCourseName: () => void;
  onAddInstructor: () => void;
  onAddStamp: () => void;
  orientation: "landscape" | "portrait";
  onOrientationChange: (value: "landscape" | "portrait") => void;
  backgroundImage: string;
  onBackgroundUpload: (e: React.ChangeEvent<HTMLInputElement>) => void;
  selectedTurmaId: string | null;
  onSelectTurma: (turmaId: string | null) => void;
  showRulers: boolean;
  onToggleRulers: () => void;
}

export const PowerPointToolbar = ({
  selectedElement,
  onUpdateElement,
  onAddText,
  onAddImage,
  onAddShape,
  onDelete,
  onMoveLayer,
  onSave,
  onPreview,
  onExport,
  onExportAll,
  currentFont,
  onFontChange,
  templateName,
  onTemplateNameChange,
  selectedTemplateId,
  onSelectTemplate,
  onAddStudentName,
  onAddCourseName,
  onAddInstructor,
  onAddStamp,
  orientation,
  onOrientationChange,
  backgroundImage,
  onBackgroundUpload,
  selectedTurmaId,
  onSelectTurma,
  showRulers,
  onToggleRulers,
}: PowerPointToolbarProps) => {
  const fonts = [
    "Arial",
    "Calibri",
    "Times New Roman",
    "Courier New",
    "Georgia",
    "Verdana",
    "Tahoma",
    "Trebuchet MS",
    "Palatino",
    "Garamond",
    "Comic Sans MS",
    "Impact",
    "Roboto",
    "Open Sans",
    "Lato",
    "Montserrat",
    "Source Sans 3",
    "Raleway",
    "PT Sans",
    "Merriweather",
    "Noto Sans",
    "Ubuntu",
    "Playfair Display",
    "Oswald",
    "Crimson Text",
    "Libre Baskerville",
    "Dancing Script",
    "Pacifico",
    "Caveat",
    "Permanent Marker",
  ];

  const fontSizes = [8, 10, 12, 14, 16, 18, 20, 24, 28, 32, 36, 48, 72];

  const handleTextAlign = (align: "left" | "center" | "right" | "justify") => {
    if (selectedElement && selectedElement.type === "text") {
      onUpdateElement({ ...selectedElement, textAlign: align });
    }
  };

  const toggleBold = () => {
    if (selectedElement && selectedElement.type === "text") {
      const currentWeight = selectedElement.fontWeight || "normal";
      onUpdateElement({
        ...selectedElement,
        fontWeight: currentWeight === "bold" ? "normal" : "bold",
      });
    }
  };

  const toggleItalic = () => {
    if (selectedElement && selectedElement.type === "text") {
      const currentStyle = selectedElement.fontStyle || "normal";
      onUpdateElement({
        ...selectedElement,
        fontStyle: currentStyle === "italic" ? "normal" : "italic",
      });
    }
  };

  const toggleUnderline = () => {
    if (selectedElement && selectedElement.type === "text") {
      const currentUnderline = selectedElement.textDecoration || "none";
      onUpdateElement({
        ...selectedElement,
        textDecoration: currentUnderline === "underline" ? "none" : "underline",
      });
    }
  };

  const handleFontSizeChange = (size: string) => {
    if (selectedElement && selectedElement.type === "text") {
      onUpdateElement({ ...selectedElement, fontSize: parseInt(size) });
    }
  };

  const handleColorChange = (color: string) => {
    if (selectedElement && selectedElement.type === "text") {
      onUpdateElement({ ...selectedElement, fill: color });
    }
  };

  const handleImageUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      onAddImage(file);
    }
  };

  const isTextSelected = selectedElement?.type === "text";

  return (
    <div className="bg-background border-b">
      {/* Primeira linha - Arquivo e ações principais */}
      <div className="flex items-center gap-2 px-4 py-2 border-b">
        <div className="flex items-center gap-2">
          <TemplateDropdown
            selectedTemplateId={selectedTemplateId}
            onSelectTemplate={onSelectTemplate}
          />
        </div>
        <div className="flex items-center gap-2 flex-1">
          <Input
            placeholder="Nome do template"
            value={templateName}
            onChange={(e) => onTemplateNameChange(e.target.value)}
            className="max-w-xs"
          />
        </div>
        <div className="flex items-center gap-2">
          <Button variant="outline" size="sm" onClick={onPreview}>
            <Eye className="w-4 h-4 mr-2" />
            Visualizar
          </Button>
          <Button variant="outline" size="sm" onClick={onExport}>
            <Download className="w-4 h-4 mr-2" />
            Exportar Slide
          </Button>
          {onExportAll && (
            <Button variant="outline" size="sm" onClick={onExportAll}>
              <Download className="w-4 h-4 mr-2" />
              Exportar Todos
            </Button>
          )}
          <Button size="sm" onClick={onSave}>
            <Save className="w-4 h-4 mr-2" />
            Salvar
          </Button>
        </div>
      </div>

      {/* Segunda linha - Ferramentas de formatação */}
      <div className="flex items-center gap-2 px-4 py-2">
        {/* Fonte */}
        <div className="flex items-center gap-2">
          <Select 
            value={selectedElement?.type === "text" ? selectedElement.fontFamily : currentFont} 
            onValueChange={(font) => {
              onFontChange(font);
              if (selectedElement?.type === "text") {
                onUpdateElement({ ...selectedElement, fontFamily: font });
              }
            }}
          >
            <SelectTrigger className="w-[140px] h-8">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {fonts.map((font) => (
                <SelectItem key={font} value={font}>
                  <span style={{ fontFamily: font }}>{font}</span>
                </SelectItem>
              ))}
            </SelectContent>
          </Select>

          {/* Tamanho da fonte */}
          <Select
            value={selectedElement?.fontSize?.toString() || "20"}
            onValueChange={handleFontSizeChange}
            disabled={!isTextSelected}
          >
            <SelectTrigger className="w-[80px] h-8">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {fontSizes.map((size) => (
                <SelectItem key={size} value={size.toString()}>
                  {size}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        <Separator orientation="vertical" className="h-6" />

        {/* Formatação de texto */}
        <div className="flex items-center gap-1">
          <Button
            variant={selectedElement?.fontWeight === "bold" ? "secondary" : "ghost"}
            size="sm"
            onClick={toggleBold}
            disabled={!isTextSelected}
            className="h-8 w-8 p-0"
          >
            <Bold className="w-4 h-4" />
          </Button>
          <Button
            variant={selectedElement?.fontStyle === "italic" ? "secondary" : "ghost"}
            size="sm"
            onClick={toggleItalic}
            disabled={!isTextSelected}
            className="h-8 w-8 p-0"
          >
            <Italic className="w-4 h-4" />
          </Button>
          <Button
            variant={
              selectedElement?.textDecoration === "underline" ? "secondary" : "ghost"
            }
            size="sm"
            onClick={toggleUnderline}
            disabled={!isTextSelected}
            className="h-8 w-8 p-0"
          >
            <Underline className="w-4 h-4" />
          </Button>
        </div>

        <Separator orientation="vertical" className="h-6" />

        {/* Alinhamento */}
        <div className="flex items-center gap-1">
          <Button
            variant={selectedElement?.textAlign === "left" ? "secondary" : "ghost"}
            size="sm"
            onClick={() => handleTextAlign("left")}
            disabled={!isTextSelected}
            className="h-8 w-8 p-0"
          >
            <AlignLeft className="w-4 h-4" />
          </Button>
          <Button
            variant={selectedElement?.textAlign === "center" ? "secondary" : "ghost"}
            size="sm"
            onClick={() => handleTextAlign("center")}
            disabled={!isTextSelected}
            className="h-8 w-8 p-0"
          >
            <AlignCenter className="w-4 h-4" />
          </Button>
          <Button
            variant={selectedElement?.textAlign === "right" ? "secondary" : "ghost"}
            size="sm"
            onClick={() => handleTextAlign("right")}
            disabled={!isTextSelected}
            className="h-8 w-8 p-0"
          >
            <AlignRight className="w-4 h-4" />
          </Button>
        </div>

        <Separator orientation="vertical" className="h-6" />

        {/* Cor do texto */}
        <Popover>
          <PopoverTrigger asChild>
            <Button
              variant="ghost"
              size="sm"
              disabled={!isTextSelected}
              className="h-8 w-8 p-0"
            >
              <Palette className="w-4 h-4" />
            </Button>
          </PopoverTrigger>
          <PopoverContent className="w-auto">
            <div className="space-y-2">
              <Label>Cor do texto</Label>
              <Input
                type="color"
                value={selectedElement?.fill || "#000000"}
                onChange={(e) => handleColorChange(e.target.value)}
                className="h-10 w-full"
              />
            </div>
          </PopoverContent>
        </Popover>

        <Separator orientation="vertical" className="h-6" />

        {/* Inserir elementos */}
        <Popover>
          <PopoverTrigger asChild>
            <Button variant="ghost" size="sm" className="h-8">
              <Plus className="w-4 h-4 mr-2" />
              Elementos
            </Button>
          </PopoverTrigger>
          <PopoverContent className="w-72" align="start">
            <div className="space-y-2">
              <Label>Adicionar Elementos</Label>
              <div className="grid grid-cols-2 gap-2">
                <Button variant="outline" size="sm" onClick={onAddText}>
                  <Type className="w-4 h-4 mr-2" />
                  Texto Livre
                </Button>
                <Button variant="outline" size="sm" onClick={onAddStudentName}>
                  👤 Nome Aluno
                </Button>
                <Button variant="outline" size="sm" onClick={onAddCourseName}>
                  📚 Nome Curso
                </Button>
                <Button variant="outline" size="sm" onClick={onAddInstructor}>
                  👨‍🏫 Instrutor
                </Button>
                <Button variant="outline" size="sm" onClick={onAddStamp}>
                  📌 Carimbo
                </Button>
                <Button variant="outline" size="sm" asChild>
                  <label htmlFor="element-image-toolbar" className="cursor-pointer">
                    <ImageIcon className="w-4 h-4 mr-2" />
                    Imagem
                    <input
                      id="element-image-toolbar"
                      type="file"
                      accept="image/*"
                      onChange={handleImageUpload}
                      className="hidden"
                    />
                  </label>
                </Button>
              </div>
            </div>
          </PopoverContent>
        </Popover>

        <Separator orientation="vertical" className="h-6" />

        {/* Configurações */}
        <Popover>
          <PopoverTrigger asChild>
            <Button variant="ghost" size="sm" className="h-8">
              🎨 Configurações
            </Button>
          </PopoverTrigger>
          <PopoverContent className="w-80" align="start">
            <div className="space-y-4">
              <div>
                <Label className="mb-2 block">Orientação</Label>
                <div className="grid grid-cols-2 gap-2">
                  <Button
                    variant={orientation === "landscape" ? "default" : "outline"}
                    size="sm"
                    onClick={() => onOrientationChange("landscape")}
                  >
                    Paisagem
                  </Button>
                  <Button
                    variant={orientation === "portrait" ? "default" : "outline"}
                    size="sm"
                    onClick={() => onOrientationChange("portrait")}
                  >
                    Retrato
                  </Button>
                </div>
              </div>
              
              <div>
                <Label className="mb-2 block">Imagem de Fundo</Label>
                <Button variant="outline" size="sm" className="w-full" asChild>
                  <label htmlFor="bg-upload-toolbar" className="cursor-pointer">
                    <Upload className="w-4 h-4 mr-2" />
                    Carregar Fundo
                    <input
                      id="bg-upload-toolbar"
                      type="file"
                      accept="image/*"
                      onChange={onBackgroundUpload}
                      className="hidden"
                    />
                  </label>
                </Button>
              </div>

              <div className="border-t pt-4">
                <TurmaAssociation 
                  selectedTurmaId={selectedTurmaId}
                  onSelectTurma={onSelectTurma}
                />
              </div>

              {selectedElement && (
                <div className="border-t pt-4">
                  <Label className="mb-2 block">Transparência</Label>
                  <OpacityControl
                    selectedElement={selectedElement}
                    onUpdateElement={onUpdateElement}
                  />
                </div>
              )}

              {isTextSelected && (
                <div className="border-t pt-4">
                  <Label className="mb-2 block">Espaçamento Entre Linhas</Label>
                  <div className="flex items-center gap-2">
                    <Input
                      type="number"
                      min="0.5"
                      max="3"
                      step="0.1"
                      value={selectedElement?.lineHeight || 1.2}
                      onChange={(e) => {
                        const value = parseFloat(e.target.value);
                        if (!isNaN(value)) {
                          onUpdateElement({ ...selectedElement, lineHeight: value });
                        }
                      }}
                      className="w-20"
                    />
                  </div>
                </div>
              )}

              <div className="border-t pt-4">
                <Button
                  variant={showRulers ? "default" : "outline"}
                  size="sm"
                  onClick={onToggleRulers}
                  className="w-full"
                >
                  <Ruler className="w-4 h-4 mr-2" />
                  {showRulers ? "Ocultar Réguas" : "Mostrar Réguas"}
                </Button>
              </div>
            </div>
          </PopoverContent>
        </Popover>

        <Separator orientation="vertical" className="h-6" />

        {/* Camadas */}
        <div className="flex items-center gap-1">
          <Button
            variant="ghost"
            size="sm"
            onClick={() => onMoveLayer("front")}
            disabled={!selectedElement}
            className="h-8"
          >
            <Layers className="w-4 h-4 mr-2" />
            Trazer
          </Button>
          <Button
            variant="ghost"
            size="sm"
            onClick={() => onMoveLayer("back")}
            disabled={!selectedElement}
            className="h-8"
          >
            <Layers className="w-4 h-4 mr-2" />
            Enviar
          </Button>
        </div>

        <Separator orientation="vertical" className="h-6" />

        {/* Excluir */}
        <Button
          variant="ghost"
          size="sm"
          onClick={onDelete}
          disabled={!selectedElement}
          className="h-8 text-destructive hover:text-destructive"
        >
          <Trash2 className="w-4 h-4" />
        </Button>
      </div>
    </div>
  );
};
