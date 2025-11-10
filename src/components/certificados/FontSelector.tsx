import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";

interface FontSelectorProps {
  value: string;
  onChange: (font: string) => void;
}

const AVAILABLE_FONTS = [
  { name: "Arial", value: "Arial" },
  { name: "Calibri", value: "Calibri" },
  { name: "Times New Roman", value: "Times New Roman" },
  { name: "Courier New", value: "Courier New" },
  { name: "Georgia", value: "Georgia" },
  { name: "Verdana", value: "Verdana" },
  { name: "Tahoma", value: "Tahoma" },
  { name: "Trebuchet MS", value: "Trebuchet MS" },
  { name: "Palatino", value: "Palatino" },
  { name: "Garamond", value: "Garamond" },
  { name: "Comic Sans MS", value: "Comic Sans MS" },
  { name: "Impact", value: "Impact" },
  { name: "Roboto", value: "Roboto" },
  { name: "Open Sans", value: "Open Sans" },
  { name: "Lato", value: "Lato" },
  { name: "Montserrat", value: "Montserrat" },
  { name: "Source Sans 3", value: "Source Sans 3" },
  { name: "Raleway", value: "Raleway" },
  { name: "PT Sans", value: "PT Sans" },
  { name: "Merriweather", value: "Merriweather" },
  { name: "Noto Sans", value: "Noto Sans" },
  { name: "Ubuntu", value: "Ubuntu" },
  { name: "Playfair Display", value: "Playfair Display" },
  { name: "Oswald", value: "Oswald" },
  { name: "Crimson Text", value: "Crimson Text" },
  { name: "Libre Baskerville", value: "Libre Baskerville" },
  { name: "Dancing Script", value: "Dancing Script" },
  { name: "Pacifico", value: "Pacifico" },
  { name: "Caveat", value: "Caveat" },
  { name: "Permanent Marker", value: "Permanent Marker" },
];

export const FontSelector = ({ value, onChange }: FontSelectorProps) => {
  return (
    <div className="space-y-2">
      <Label>Fonte do Texto</Label>
      <Select value={value} onValueChange={onChange}>
        <SelectTrigger>
          <SelectValue placeholder="Selecione uma fonte" />
        </SelectTrigger>
        <SelectContent>
          {AVAILABLE_FONTS.map((font) => (
            <SelectItem key={font.value} value={font.value} style={{ fontFamily: font.value }}>
              {font.name}
            </SelectItem>
          ))}
        </SelectContent>
      </Select>
    </div>
  );
};
