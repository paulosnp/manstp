import { Label } from "@/components/ui/label";
import { Slider } from "@/components/ui/slider";
import { Input } from "@/components/ui/input";

interface OpacityControlProps {
  selectedElement: any;
  onUpdateElement: (updated: any) => void;
}

export const OpacityControl = ({ selectedElement, onUpdateElement }: OpacityControlProps) => {
  if (!selectedElement) {
    return null;
  }

  const opacity = selectedElement.opacity !== undefined ? selectedElement.opacity : 1;
  const opacityPercent = Math.round(opacity * 100);

  const handleOpacityChange = (value: number[]) => {
    const newOpacity = value[0] / 100;
    onUpdateElement({ ...selectedElement, opacity: newOpacity });
  };

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = parseInt(e.target.value) || 0;
    const clampedValue = Math.max(0, Math.min(100, value));
    const newOpacity = clampedValue / 100;
    onUpdateElement({ ...selectedElement, opacity: newOpacity });
  };

  return (
    <div className="space-y-2">
      <Label>Transparência do Elemento</Label>
      <div className="flex gap-2 items-center">
        <Slider
          value={[opacityPercent]}
          onValueChange={handleOpacityChange}
          min={0}
          max={100}
          step={1}
          className="flex-1"
        />
        <Input
          type="number"
          value={opacityPercent}
          onChange={handleInputChange}
          className="w-16 text-center"
          min={0}
          max={100}
        />
        <span className="text-sm text-muted-foreground">%</span>
      </div>
    </div>
  );
};
