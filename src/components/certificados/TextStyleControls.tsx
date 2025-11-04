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

interface TextStyleControlsProps {
  fontFamily: string;
  fontSize: number;
  fontColor: string;
  textAlign: string;
  onFontFamilyChange: (value: string) => void;
  onFontSizeChange: (value: number) => void;
  onFontColorChange: (value: string) => void;
  onTextAlignChange: (value: string) => void;
  onApplyStyle: () => void;
}

export const TextStyleControls = ({
  fontFamily,
  fontSize,
  fontColor,
  textAlign,
  onFontFamilyChange,
  onFontSizeChange,
  onFontColorChange,
  onTextAlignChange,
  onApplyStyle,
}: TextStyleControlsProps) => {
  return (
    <div className="space-y-4 border-t pt-4">
      <h3 className="font-semibold">Personalizar Texto</h3>
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <div className="space-y-2">
          <Label>Fonte</Label>
          <Select value={fontFamily} onValueChange={onFontFamilyChange}>
            <SelectTrigger>
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="Arial">Arial</SelectItem>
              <SelectItem value="Times New Roman">Times New Roman</SelectItem>
              <SelectItem value="Courier New">Courier New</SelectItem>
              <SelectItem value="Georgia">Georgia</SelectItem>
              <SelectItem value="Verdana">Verdana</SelectItem>
              <SelectItem value="Tahoma">Tahoma</SelectItem>
            </SelectContent>
          </Select>
        </div>

        <div className="space-y-2">
          <Label>Tamanho</Label>
          <Input
            type="number"
            value={fontSize}
            onChange={(e) => onFontSizeChange(Number(e.target.value))}
            min="8"
            max="72"
          />
        </div>

        <div className="space-y-2">
          <Label>Cor</Label>
          <div className="flex gap-2">
            <Input
              type="color"
              value={fontColor}
              onChange={(e) => onFontColorChange(e.target.value)}
              className="w-20 h-10"
            />
            <Input
              type="text"
              value={fontColor}
              onChange={(e) => onFontColorChange(e.target.value)}
              placeholder="#000000"
              className="flex-1"
            />
          </div>
        </div>

        <div className="space-y-2">
          <Label>Alinhamento</Label>
          <Select value={textAlign} onValueChange={onTextAlignChange}>
            <SelectTrigger>
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="left">Esquerda</SelectItem>
              <SelectItem value="center">Centro</SelectItem>
              <SelectItem value="right">Direita</SelectItem>
              <SelectItem value="justify">Justificado</SelectItem>
            </SelectContent>
          </Select>
        </div>
      </div>
      <Button onClick={onApplyStyle} size="sm" className="w-full md:w-auto">
        Aplicar Estilo aos Textos Selecionados
      </Button>
    </div>
  );
};
