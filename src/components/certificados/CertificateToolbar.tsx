import { Button } from "@/components/ui/button";
import { Type, ImageIcon, FileText } from "lucide-react";
import { useRef } from "react";

interface CertificateToolbarProps {
  onAddText: (editor: "frente" | "verso") => void;
  onAddImage: (file: File, editor: "frente" | "verso") => void;
  onLoadTemplate: (editor: "frente" | "verso") => void;
}

export const CertificateToolbar = ({
  onAddText,
  onAddImage,
  onLoadTemplate,
}: CertificateToolbarProps) => {
  const fileInputFrente = useRef<HTMLInputElement>(null);
  const fileInputVerso = useRef<HTMLInputElement>(null);

  return (
    <div className="space-y-4">
      <h3 className="font-semibold">Ferramentas de Edição</h3>
      <div className="grid grid-cols-2 gap-3">
        <div className="space-y-2">
          <p className="text-sm font-medium text-muted-foreground">Frente do Certificado</p>
          <div className="flex flex-wrap gap-2">
            <Button onClick={() => onLoadTemplate("frente")} variant="default" size="sm">
              <FileText className="w-4 h-4 mr-2" />
              Carregar Template
            </Button>
            <Button onClick={() => onAddText("frente")} variant="outline" size="sm">
              <Type className="w-4 h-4 mr-2" />
              Adicionar Texto
            </Button>
            <Button
              onClick={() => fileInputFrente.current?.click()}
              variant="outline"
              size="sm"
            >
              <ImageIcon className="w-4 h-4 mr-2" />
              Adicionar Imagem
            </Button>
          </div>
        </div>

        <div className="space-y-2">
          <p className="text-sm font-medium text-muted-foreground">Verso do Certificado</p>
          <div className="flex flex-wrap gap-2">
            <Button onClick={() => onLoadTemplate("verso")} variant="default" size="sm">
              <FileText className="w-4 h-4 mr-2" />
              Carregar Template
            </Button>
            <Button onClick={() => onAddText("verso")} variant="outline" size="sm">
              <Type className="w-4 h-4 mr-2" />
              Adicionar Texto
            </Button>
            <Button
              onClick={() => fileInputVerso.current?.click()}
              variant="outline"
              size="sm"
            >
              <ImageIcon className="w-4 h-4 mr-2" />
              Adicionar Imagem
            </Button>
          </div>
        </div>
      </div>

      <input
        ref={fileInputFrente}
        type="file"
        accept="image/*"
        className="hidden"
        onChange={(e) => e.target.files?.[0] && onAddImage(e.target.files[0], "frente")}
      />
      <input
        ref={fileInputVerso}
        type="file"
        accept="image/*"
        className="hidden"
        onChange={(e) => e.target.files?.[0] && onAddImage(e.target.files[0], "verso")}
      />
    </div>
  );
};
