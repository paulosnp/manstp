import { Button } from "@/components/ui/button";
import { Type, ImageIcon, User, BookOpen, UserCircle } from "lucide-react";
import { useRef } from "react";

interface CertificateElementToolbarProps {
  onAddText: () => void;
  onAddCourseName: () => void;
  onAddStudentName: () => void;
  onAddImage: (file: File) => void;
  onAddInstructor: () => void;
}

export const CertificateElementToolbar = ({
  onAddText,
  onAddCourseName,
  onAddStudentName,
  onAddImage,
  onAddInstructor,
}: CertificateElementToolbarProps) => {
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      onAddImage(file);
    }
  };

  return (
    <div className="space-y-3">
      <h3 className="text-sm font-medium text-muted-foreground">Adicionar elementos</h3>
      <div className="flex flex-wrap gap-2">
        <Button variant="outline" size="sm" onClick={onAddText}>
          <Type className="w-4 h-4 mr-2" />
          Texto
        </Button>
        <Button variant="outline" size="sm" onClick={onAddCourseName}>
          <BookOpen className="w-4 h-4 mr-2" />
          Nome do curso
        </Button>
        <Button variant="outline" size="sm" onClick={onAddStudentName}>
          <User className="w-4 h-4 mr-2" />
          Nome do aluno
        </Button>
        <Button
          variant="outline"
          size="sm"
          onClick={() => fileInputRef.current?.click()}
        >
          <ImageIcon className="w-4 h-4 mr-2" />
          Imagem
        </Button>
        <Button variant="outline" size="sm" onClick={onAddInstructor}>
          <UserCircle className="w-4 h-4 mr-2" />
          Instrutor
        </Button>
      </div>
      <input
        ref={fileInputRef}
        type="file"
        accept="image/*"
        className="hidden"
        onChange={handleFileChange}
      />
    </div>
  );
};
