import { useState, useEffect } from "react";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { X, Plus } from "lucide-react";
import { toast } from "sonner";

interface CustomizableSelectProps {
  value: string;
  onValueChange: (value: string) => void;
  defaultOptions: string[];
  placeholder?: string;
  storageKey: string;
  disabled?: boolean;
  required?: boolean;
  maxHeight?: string;
  allowCustom?: boolean;
}

export function CustomizableSelect({
  value,
  onValueChange,
  defaultOptions,
  placeholder = "Selecione...",
  storageKey,
  disabled = false,
  required = false,
  maxHeight = "300px",
  allowCustom = true,
}: CustomizableSelectProps) {
  const [customOptions, setCustomOptions] = useState<string[]>([]);
  const [newOption, setNewOption] = useState("");
  const [showAddInput, setShowAddInput] = useState(false);

  useEffect(() => {
    const stored = localStorage.getItem(storageKey);
    if (stored) {
      setCustomOptions(JSON.parse(stored));
    }
  }, [storageKey]);

  const allOptions = [...defaultOptions, ...customOptions];

  const handleAddOption = () => {
    if (!newOption.trim()) {
      toast.error("Digite uma opção válida");
      return;
    }

    if (allOptions.includes(newOption.trim())) {
      toast.error("Esta opção já existe");
      return;
    }

    const updated = [...customOptions, newOption.trim()];
    setCustomOptions(updated);
    localStorage.setItem(storageKey, JSON.stringify(updated));
    toast.success("Opção adicionada com sucesso");
    setNewOption("");
    setShowAddInput(false);
  };

  const handleRemoveOption = (option: string) => {
    if (defaultOptions.includes(option)) {
      toast.error("Não é possível remover opções padrão do sistema");
      return;
    }

    const updated = customOptions.filter((o) => o !== option);
    setCustomOptions(updated);
    localStorage.setItem(storageKey, JSON.stringify(updated));
    toast.success("Opção removida com sucesso");

    if (value === option) {
      onValueChange("");
    }
  };

  return (
    <div className="space-y-2">
      <Select value={value} onValueChange={onValueChange} disabled={disabled} required={required}>
        <SelectTrigger>
          <SelectValue placeholder={placeholder} />
        </SelectTrigger>
        <SelectContent className="bg-background" style={{ maxHeight }}>
          <div className="overflow-y-auto">
            {allOptions.map((option) => (
              <div key={option} className="flex items-center justify-between group hover:bg-accent px-2">
                <SelectItem value={option} className="flex-1">
                  {option}
                </SelectItem>
                {allowCustom && !defaultOptions.includes(option) && (
                  <Button
                    type="button"
                    variant="ghost"
                    size="icon"
                    className="h-6 w-6 opacity-0 group-hover:opacity-100 transition-opacity"
                    onClick={(e) => {
                      e.stopPropagation();
                      handleRemoveOption(option);
                    }}
                  >
                    <X className="h-3 w-3" />
                  </Button>
                )}
              </div>
            ))}
          </div>
          {allowCustom && (
            <div className="border-t mt-2 pt-2 px-2">
              {showAddInput ? (
                <div className="flex gap-2">
                  <Input
                    placeholder="Nova opção..."
                    value={newOption}
                    onChange={(e) => setNewOption(e.target.value)}
                    onKeyDown={(e) => {
                      if (e.key === "Enter") {
                        e.preventDefault();
                        handleAddOption();
                      }
                      if (e.key === "Escape") {
                        setShowAddInput(false);
                        setNewOption("");
                      }
                    }}
                    className="h-8 text-sm"
                    autoFocus
                  />
                  <Button
                    type="button"
                    size="sm"
                    onClick={handleAddOption}
                    className="h-8"
                  >
                    <Plus className="h-4 w-4" />
                  </Button>
                </div>
              ) : (
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  onClick={() => setShowAddInput(true)}
                  className="w-full h-8 gap-2"
                >
                  <Plus className="h-4 w-4" />
                  Adicionar nova opção
                </Button>
              )}
            </div>
          )}
        </SelectContent>
      </Select>
    </div>
  );
}
