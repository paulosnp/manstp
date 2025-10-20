import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger, DialogDescription } from "@/components/ui/dialog";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Label } from "@/components/ui/label";
import { Edit } from "lucide-react";
import { supabase } from "@/lib/supabase";
import { toast } from "sonner";
import type { Database } from "@/integrations/supabase/types";

interface BulkStatusUpdateProps {
  turmaId: string;
  turmaNome: string;
  onSuccess: () => void;
}

export function BulkStatusUpdate({ turmaId, turmaNome, onSuccess }: BulkStatusUpdateProps) {
  const [open, setOpen] = useState(false);
  const [loading, setLoading] = useState(false);
  const [selectedStatus, setSelectedStatus] = useState("Aguardando");

  const handleBulkUpdate = async () => {
    setLoading(true);
    try {
      const { error } = await supabase
        .from("aluno_turma")
        .update({ status: selectedStatus as Database['public']['Enums']['status_aluno'] })
        .eq("turma_id", turmaId);

      if (error) throw error;

      toast.success(`Status de todos os alunos atualizado para "${selectedStatus}"`);
      setOpen(false);
      onSuccess();
    } catch (error) {
      console.error("Erro ao atualizar status em massa:", error);
      toast.error("Erro ao atualizar status");
    } finally {
      setLoading(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button variant="outline" size="sm" className="gap-2">
          <Edit className="h-4 w-4" />
          Editar Status da Turma
        </Button>
      </DialogTrigger>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Alterar Status de Toda a Turma</DialogTitle>
          <DialogDescription>
            Esta ação irá alterar o status de todos os alunos vinculados à turma "{turmaNome}".
          </DialogDescription>
        </DialogHeader>
        <div className="space-y-4">
          <div className="space-y-2">
            <Label>Novo Status para Todos os Alunos</Label>
            <Select value={selectedStatus} onValueChange={setSelectedStatus}>
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="Aguardando">Aguardando</SelectItem>
                <SelectItem value="Planejado">Planejado</SelectItem>
                <SelectItem value="Cursando">Cursando</SelectItem>
                <SelectItem value="Estagiando">Estagiando</SelectItem>
                <SelectItem value="Concluído">Concluído</SelectItem>
                <SelectItem value="Cancelado">Cancelado</SelectItem>
                <SelectItem value="Reprovado">Reprovado</SelectItem>
                <SelectItem value="Desligado">Desligado</SelectItem>
                <SelectItem value="Desertor">Desertor</SelectItem>
              </SelectContent>
            </Select>
          </div>
          <div className="flex justify-end gap-2">
            <Button variant="outline" onClick={() => setOpen(false)}>
              Cancelar
            </Button>
            <Button onClick={handleBulkUpdate} disabled={loading}>
              {loading ? "Atualizando..." : "Atualizar Todos"}
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
