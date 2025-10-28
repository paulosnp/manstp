import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { GraduationCap } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";

interface VincularInstrutorTurmaProps {
  turmaId: string;
  onSuccess: () => void;
  onCancel?: () => void;
}

export function VincularInstrutorTurma({
  turmaId,
  onSuccess,
  onCancel,
}: VincularInstrutorTurmaProps) {
  const [instrutores, setInstrutores] = useState<any[]>([]);
  const [instrutorId, setInstrutorId] = useState("");
  const [open, setOpen] = useState(false);

  useEffect(() => {
    fetchInstrutores();
  }, []);

  const fetchInstrutores = async () => {
    const { data, error } = await supabase
      .from("instrutores")
      .select("*")
      .order("nome_completo");

    if (error) {
      toast.error("Erro ao carregar instrutores");
      return;
    }

    setInstrutores(data || []);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    const { error } = await supabase
      .from("instrutor_turma")
      .insert([{ instrutor_id: instrutorId, turma_id: turmaId }]);

    if (error) {
      if (error.code === "23505") {
        toast.error("Este instrutor já está vinculado a esta turma");
      } else {
        toast.error("Erro ao vincular instrutor");
      }
      return;
    }

    toast.success("Instrutor vinculado com sucesso!");
    setInstrutorId("");
    onSuccess();
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <Button
        variant="outline"
        size="sm"
        onClick={() => setOpen(true)}
        className="gap-2"
      >
        <GraduationCap className="h-4 w-4" />
        Vincular Instrutor
      </Button>
      <DialogContent onInteractOutside={(e) => e.preventDefault()}>
        <DialogHeader>
          <DialogTitle>Vincular Instrutor à Turma</DialogTitle>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <Label htmlFor="instrutor">Instrutor *</Label>
            <Select value={instrutorId} onValueChange={setInstrutorId} required>
              <SelectTrigger>
                <SelectValue placeholder="Selecione um instrutor" />
              </SelectTrigger>
              <SelectContent>
                {instrutores.map((instrutor) => (
                  <SelectItem key={instrutor.id} value={instrutor.id}>
                    {instrutor.graduacao} {instrutor.nome_completo}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div className="flex gap-2 justify-end">
            <Button type="button" variant="outline" onClick={() => {
              setOpen(false);
              if (onCancel) onCancel();
            }}>
              Cancelar
            </Button>
            <Button type="submit">Vincular</Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}