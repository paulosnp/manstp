import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { X, Upload } from "lucide-react";
import { useRef } from "react";

interface CertificateGeneralSettingsProps {
  orientation: "landscape" | "portrait";
  onOrientationChange: (value: "landscape" | "portrait") => void;
  backgroundImage?: string;
  onBackgroundChange: (file: File | null) => void;
}

export const CertificateGeneralSettings = ({
  orientation,
  onOrientationChange,
  backgroundImage,
  onBackgroundChange,
}: CertificateGeneralSettingsProps) => {
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      onBackgroundChange(file);
    }
  };

  return (
    <div className="space-y-4">
      <h3 className="text-sm font-medium text-muted-foreground">Geral</h3>
      <div className="grid grid-cols-2 gap-4">
        <div className="space-y-2">
          <Label>Orientação</Label>
          <Select value={orientation} onValueChange={onOrientationChange}>
            <SelectTrigger>
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="landscape">Paisagem</SelectItem>
              <SelectItem value="portrait">Retrato</SelectItem>
            </SelectContent>
          </Select>
        </div>

        <div className="space-y-2">
          <Label>Imagem de Fundo</Label>
          <div className="flex gap-2">
            {backgroundImage ? (
              <>
                <Button
                  variant="outline"
                  size="sm"
                  className="flex-1 text-xs truncate"
                  onClick={() => fileInputRef.current?.click()}
                >
                  <Upload className="w-3 h-3 mr-2" />
                  Alterar
                </Button>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => onBackgroundChange(null)}
                >
                  <X className="w-4 h-4" />
                </Button>
              </>
            ) : (
              <Button
                variant="outline"
                size="sm"
                className="w-full"
                onClick={() => fileInputRef.current?.click()}
              >
                <Upload className="w-4 h-4 mr-2" />
                Upload
              </Button>
            )}
          </div>
          <input
            ref={fileInputRef}
            type="file"
            accept="image/*"
            className="hidden"
            onChange={handleFileChange}
          />
        </div>
      </div>
    </div>
  );
};
