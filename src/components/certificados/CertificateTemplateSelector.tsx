import { useState, useEffect } from "react";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Plus, Trash2 } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";

interface Template {
  id: string;
  name: string;
  thumbnail?: string;
  data: any;
}

interface CertificateTemplateSelectorProps {
  onSelectTemplate: (template: Template | null) => void;
  selectedTemplateId?: string;
}

export const CertificateTemplateSelector = ({
  onSelectTemplate,
  selectedTemplateId,
}: CertificateTemplateSelectorProps) => {
  const [templates, setTemplates] = useState<Template[]>([]);

  useEffect(() => {
    loadTemplates();
  }, []);

  const loadTemplates = async () => {
    // For now, we'll use local storage. Can be moved to Supabase later
    const saved = localStorage.getItem("certificate_templates");
    if (saved) {
      setTemplates(JSON.parse(saved));
    }
  };

  const deleteTemplate = (id: string) => {
    const updated = templates.filter((t) => t.id !== id);
    setTemplates(updated);
    localStorage.setItem("certificate_templates", JSON.stringify(updated));
    toast.success("Template excluído");
  };

  return (
    <div className="space-y-3">
      <h3 className="text-sm font-medium text-muted-foreground">Certificados</h3>
      <div className="grid grid-cols-4 gap-3">
        <Card
          className={`p-4 cursor-pointer hover:border-primary transition-all ${
            selectedTemplateId === "new" ? "border-primary bg-primary/5" : ""
          }`}
          onClick={() => onSelectTemplate(null)}
        >
          <div className="aspect-[4/3] bg-muted rounded-lg flex items-center justify-center mb-2">
            <Plus className="w-8 h-8 text-muted-foreground" />
          </div>
          <p className="text-xs text-center font-medium">Novo template</p>
        </Card>

        {templates.map((template) => (
          <Card
            key={template.id}
            className={`p-4 cursor-pointer hover:border-primary transition-all relative group ${
              selectedTemplateId === template.id ? "border-primary bg-primary/5" : ""
            }`}
            onClick={() => onSelectTemplate(template)}
          >
            <div className="aspect-[4/3] bg-muted rounded-lg mb-2 overflow-hidden">
              {template.thumbnail ? (
                <img
                  src={template.thumbnail}
                  alt={template.name}
                  className="w-full h-full object-cover"
                />
              ) : (
                <div className="w-full h-full flex items-center justify-center text-xs text-muted-foreground">
                  Sem preview
                </div>
              )}
            </div>
            <p className="text-xs text-center font-medium truncate">{template.name}</p>
            <Button
              size="sm"
              variant="destructive"
              className="absolute top-2 right-2 h-6 w-6 p-0 opacity-0 group-hover:opacity-100 transition-opacity"
              onClick={(e) => {
                e.stopPropagation();
                deleteTemplate(template.id);
              }}
            >
              <Trash2 className="h-3 w-3" />
            </Button>
          </Card>
        ))}
      </div>
    </div>
  );
};
