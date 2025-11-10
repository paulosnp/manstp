import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useCertificateTemplates } from "@/hooks/useCertificateTemplates";
import { FileText } from "lucide-react";

interface TemplateDropdownProps {
  selectedTemplateId: string;
  onSelectTemplate: (template: any) => void;
}

export const TemplateDropdown = ({ selectedTemplateId, onSelectTemplate }: TemplateDropdownProps) => {
  const { templates, loading } = useCertificateTemplates();

  if (loading) {
    return null;
  }

  return (
    <Select
      value={selectedTemplateId}
      onValueChange={(value) => {
        if (value === "new") {
          onSelectTemplate(null);
        } else {
          const template = templates.find((t) => t.id === value);
          if (template) {
            onSelectTemplate(template);
          }
        }
      }}
    >
      <SelectTrigger className="w-[200px] h-8">
        <FileText className="w-4 h-4 mr-2" />
        <SelectValue placeholder="Selecionar Template" />
      </SelectTrigger>
      <SelectContent>
        <SelectItem value="new">Novo Template</SelectItem>
        {templates.map((template) => (
          <SelectItem key={template.id} value={template.id}>
            {template.name}
          </SelectItem>
        ))}
      </SelectContent>
    </Select>
  );
};
