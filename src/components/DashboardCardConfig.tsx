import { useState } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";
import { Settings } from "lucide-react";

export type DashboardCardType = 
  | "coppaznav"
  | "ead"
  | "cenpem"
  | "expeditos_stp"
  | "efomm_ciaga"
  | "efomm_ciaba"
  | "rov_eb";

interface DashboardCardConfigData {
  id: string;
  type: DashboardCardType;
  titulo: string;
}

interface DashboardCardConfigProps {
  config: DashboardCardConfigData;
  onSave: (config: DashboardCardConfigData) => void;
}

export const DashboardCardConfig = ({ config, onSave }: DashboardCardConfigProps) => {
  const [open, setOpen] = useState(false);
  const [titulo, setTitulo] = useState(config.titulo);
  const [type, setType] = useState(config.type);

  const handleSave = () => {
    onSave({
      ...config,
      titulo,
      type,
    });
    setOpen(false);
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <TooltipProvider>
        <Tooltip>
          <TooltipTrigger asChild>
            <DialogTrigger asChild>
              <Button variant="ghost" size="icon" className="h-8 w-8 hover:bg-accent absolute top-2 right-2">
                <Settings className="h-5 w-5" />
              </Button>
            </DialogTrigger>
          </TooltipTrigger>
          <TooltipContent>
            <p>Configurar título e tipo de contagem</p>
          </TooltipContent>
        </Tooltip>
      </TooltipProvider>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Configurar Card do Dashboard</DialogTitle>
        </DialogHeader>
        <div className="space-y-4 py-4">
          <div className="space-y-2">
            <Label htmlFor="titulo">Título do Card</Label>
            <Input
              id="titulo"
              value={titulo}
              onChange={(e) => setTitulo(e.target.value)}
              placeholder="Digite o título"
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="type">Tipo de Contagem</Label>
            <Select value={type} onValueChange={(value: DashboardCardType) => setType(value)}>
              <SelectTrigger id="type">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="coppaznav">COPPAZNAV</SelectItem>
                <SelectItem value="ead">Cursos a Distância (EAD)</SelectItem>
                <SelectItem value="cenpem">Cursos CENPEM</SelectItem>
                <SelectItem value="expeditos_stp">Cursos Expeditos STP</SelectItem>
                <SelectItem value="efomm_ciaga">EFOMM CIAGA</SelectItem>
                <SelectItem value="efomm_ciaba">EFOMM CIABA</SelectItem>
                <SelectItem value="rov_eb">ROV - EB</SelectItem>
              </SelectContent>
            </Select>
          </div>
          <Button onClick={handleSave} className="w-full">
            Salvar Configuração
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
};
