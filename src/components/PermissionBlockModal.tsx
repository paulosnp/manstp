import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { AlertTriangle } from "lucide-react";
import { playBlockSound } from "@/lib/blockSound";

interface PermissionBlockModalProps {
  open: boolean;
  onClose: () => void;
  message?: string;
}

export function PermissionBlockModal({ open, onClose, message }: PermissionBlockModalProps) {
  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <div className="flex items-center gap-3 mb-2">
            <AlertTriangle className="h-6 w-6 text-destructive" />
            <DialogTitle>Acesso Negado</DialogTitle>
          </div>
          <DialogDescription className="text-base">
            {message || "⚠️ Você não possui permissão para realizar esta ação. Apenas coordenadores podem modificar os dados."}
          </DialogDescription>
        </DialogHeader>
        <div className="flex gap-3 justify-end mt-4">
          <Button
            variant="outline"
            size="sm"
            onClick={() => playBlockSound()}
          >
            Reproduzir Som
          </Button>
          <Button onClick={onClose}>
            Entendido
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}
