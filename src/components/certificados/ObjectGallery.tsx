import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { ScrollArea } from "@/components/ui/scroll-area";
import { 
  Image as ImageIcon, 
  Square, 
  Circle, 
  Minus, 
  Type,
  Star,
  Hexagon,
  Triangle
} from "lucide-react";

interface ObjectGalleryProps {
  onAddText: () => void;
  onAddImage: (file: File) => void;
  onAddShape: (shape: "rectangle" | "circle" | "line") => void;
}

export const ObjectGallery = ({ 
  onAddText, 
  onAddImage, 
  onAddShape 
}: ObjectGalleryProps) => {
  const handleImageUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      onAddImage(file);
    }
  };

  const objects = [
    { 
      id: "text", 
      icon: Type, 
      label: "Texto", 
      onClick: onAddText,
      color: "text-blue-500"
    },
    { 
      id: "rectangle", 
      icon: Square, 
      label: "Retângulo", 
      onClick: () => onAddShape("rectangle"),
      color: "text-purple-500"
    },
    { 
      id: "circle", 
      icon: Circle, 
      label: "Círculo", 
      onClick: () => onAddShape("circle"),
      color: "text-green-500"
    },
    { 
      id: "line", 
      icon: Minus, 
      label: "Linha", 
      onClick: () => onAddShape("line"),
      color: "text-orange-500"
    },
  ];

  return (
    <div className="border-t p-3">
      <h3 className="font-semibold mb-2 text-sm">Galeria de Objetos</h3>
      
      <ScrollArea className="h-64">
        <div className="grid grid-cols-2 gap-2">
          {objects.map((obj) => (
            <Card
              key={obj.id}
              className="cursor-pointer hover:bg-accent transition-colors p-3 flex flex-col items-center gap-2"
              onClick={obj.onClick}
            >
              <obj.icon className={`w-8 h-8 ${obj.color}`} />
              <span className="text-xs font-medium text-center">{obj.label}</span>
            </Card>
          ))}
          
          <Card className="cursor-pointer hover:bg-accent transition-colors p-3 flex flex-col items-center gap-2">
            <label htmlFor="gallery-image-upload" className="cursor-pointer flex flex-col items-center gap-2">
              <ImageIcon className="w-8 h-8 text-pink-500" />
              <span className="text-xs font-medium text-center">Imagem</span>
            </label>
            <input
              id="gallery-image-upload"
              type="file"
              accept="image/*"
              className="hidden"
              onChange={handleImageUpload}
            />
          </Card>
        </div>
      </ScrollArea>
    </div>
  );
};
