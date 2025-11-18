import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Bold, Italic, AlignLeft, AlignCenter, AlignRight, AlignJustify, Minus, Plus } from "lucide-react";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";

interface TextFormattingControlsProps {
  selectedElement: any;
  onUpdateElement: (updated: any) => void;
}

export const TextFormattingControls = ({ selectedElement, onUpdateElement }: TextFormattingControlsProps) => {
  if (!selectedElement || selectedElement.type !== "text") {
    return null;
  }

  const fontSize = selectedElement.fontSize || 20;
  const fontWeight = selectedElement.fontWeight || "normal";
  const fontStyle = selectedElement.fontStyle || "normal";
  const textAlign = selectedElement.textAlign || "left";
  const fill = selectedElement.fill || "#000000";

  const handleFontSizeChange = (delta: number) => {
    const newSize = Math.max(8, Math.min(200, fontSize + delta));
    onUpdateElement({ ...selectedElement, fontSize: newSize });
  };

  const toggleBold = () => {
    onUpdateElement({
      ...selectedElement,
      fontWeight: fontWeight === "bold" ? "normal" : "bold",
    });
  };

  const toggleItalic = () => {
    onUpdateElement({
      ...selectedElement,
      fontStyle: fontStyle === "italic" ? "normal" : "italic",
    });
  };

  const handleAlignChange = (align: string) => {
    onUpdateElement({ ...selectedElement, textAlign: align });
  };

  const handleColorChange = (color: string) => {
    onUpdateElement({ ...selectedElement, fill: color });
  };

  return (
    <TooltipProvider>
      <div className="space-y-4 p-4 border rounded-lg bg-muted/30">
        <h3 className="text-sm font-medium">Formatação do Texto</h3>
        
        <div className="space-y-2">
          <Label>Tamanho da Fonte</Label>
          <div className="flex gap-2 items-center">
            <Tooltip>
              <TooltipTrigger asChild>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => handleFontSizeChange(-2)}
                >
                  <Minus className="w-4 h-4" />
                </Button>
              </TooltipTrigger>
              <TooltipContent>
                <p>Diminuir tamanho da fonte</p>
              </TooltipContent>
            </Tooltip>
            <Input
              type="number"
              value={fontSize}
              onChange={(e) => onUpdateElement({ ...selectedElement, fontSize: parseInt(e.target.value) || 20 })}
              className="w-20 text-center"
              min={8}
              max={200}
            />
            <Tooltip>
              <TooltipTrigger asChild>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => handleFontSizeChange(2)}
                >
                  <Plus className="w-4 h-4" />
                </Button>
              </TooltipTrigger>
              <TooltipContent>
                <p>Aumentar tamanho da fonte</p>
              </TooltipContent>
            </Tooltip>
          </div>
        </div>

        <div className="space-y-2">
          <Label>Estilo</Label>
          <div className="flex gap-2">
            <Tooltip>
              <TooltipTrigger asChild>
                <Button
                  variant={fontWeight === "bold" ? "default" : "outline"}
                  size="sm"
                  onClick={toggleBold}
                >
                  <Bold className="w-4 h-4" />
                </Button>
              </TooltipTrigger>
              <TooltipContent>
                <p>Negrito</p>
              </TooltipContent>
            </Tooltip>
            <Tooltip>
              <TooltipTrigger asChild>
                <Button
                  variant={fontStyle === "italic" ? "default" : "outline"}
                  size="sm"
                  onClick={toggleItalic}
                >
                  <Italic className="w-4 h-4" />
                </Button>
              </TooltipTrigger>
              <TooltipContent>
                <p>Itálico</p>
              </TooltipContent>
            </Tooltip>
          </div>
        </div>

        <div className="space-y-2">
          <Label>Alinhamento</Label>
          <div className="flex gap-2">
            <Tooltip>
              <TooltipTrigger asChild>
                <Button
                  variant={textAlign === "left" ? "default" : "outline"}
                  size="sm"
                  onClick={() => handleAlignChange("left")}
                >
                  <AlignLeft className="w-4 h-4" />
                </Button>
              </TooltipTrigger>
              <TooltipContent>
                <p>Alinhar à esquerda</p>
              </TooltipContent>
            </Tooltip>
            <Tooltip>
              <TooltipTrigger asChild>
                <Button
                  variant={textAlign === "center" ? "default" : "outline"}
                  size="sm"
                  onClick={() => handleAlignChange("center")}
                >
                  <AlignCenter className="w-4 h-4" />
                </Button>
              </TooltipTrigger>
              <TooltipContent>
                <p>Centralizar</p>
              </TooltipContent>
            </Tooltip>
            <Tooltip>
              <TooltipTrigger asChild>
                <Button
                  variant={textAlign === "right" ? "default" : "outline"}
                  size="sm"
                  onClick={() => handleAlignChange("right")}
                >
                  <AlignRight className="w-4 h-4" />
                </Button>
              </TooltipTrigger>
              <TooltipContent>
                <p>Alinhar à direita</p>
              </TooltipContent>
            </Tooltip>
            <Tooltip>
              <TooltipTrigger asChild>
                <Button
                  variant={textAlign === "justify" ? "default" : "outline"}
                  size="sm"
                  onClick={() => handleAlignChange("justify")}
                >
                  <AlignJustify className="w-4 h-4" />
                </Button>
              </TooltipTrigger>
              <TooltipContent>
                <p>Justificar texto</p>
              </TooltipContent>
            </Tooltip>
          </div>
        </div>

      <div className="space-y-2">
        <Label>Cor do Texto</Label>
        <div className="flex gap-2 items-center">
          <Input
            type="color"
            value={fill}
            onChange={(e) => handleColorChange(e.target.value)}
            className="w-20 h-10"
          />
          <Input
            type="text"
            value={fill}
            onChange={(e) => handleColorChange(e.target.value)}
            className="flex-1"
            placeholder="#000000"
          />
        </div>
      </div>
      </div>
    </TooltipProvider>
  );
};
