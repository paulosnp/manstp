import { useState } from "react";
import { useTranslation } from "react-i18next";
import { Mail, UserPlus, Loader2 } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { z } from "zod";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

const inviteSchema = z.object({
  email: z.string().email("Email inválido"),
  nome: z.string().min(3, "Nome deve ter no mínimo 3 caracteres").optional().or(z.literal("")),
  role: z.enum(["coordenador", "visualizador"]),
});

export function InviteUserDialog() {
  const { t } = useTranslation();
  const [open, setOpen] = useState(false);
  const [loading, setLoading] = useState(false);
  const [formData, setFormData] = useState({
    email: "",
    nome: "",
    role: "visualizador" as "coordenador" | "visualizador",
  });

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    // Validar dados
    const validation = inviteSchema.safeParse(formData);
    if (!validation.success) {
      toast.error(validation.error.errors[0].message);
      return;
    }

    setLoading(true);

    try {
      const { data: { session } } = await supabase.auth.getSession();
      
      if (!session) {
        toast.error("Sessão expirada. Faça login novamente.");
        return;
      }

      const { data, error } = await supabase.functions.invoke('send-invitation', {
        body: {
          email: formData.email,
          nome: formData.nome || undefined,
          role: formData.role,
        },
        headers: {
          Authorization: `Bearer ${session.access_token}`,
        },
      });

      if (error) {
        console.error("Erro na invocação:", error);
        throw new Error(error.message || "Erro ao enviar convite");
      }

      if (data?.error) {
        throw new Error(data.error);
      }

      toast.success("Convite enviado com sucesso!", {
        description: `Um email foi enviado para ${formData.email}`,
      });
      
      setFormData({ email: "", nome: "", role: "visualizador" });
      setOpen(false);
    } catch (error: any) {
      console.error("Erro ao enviar convite:", error);
      
      const errorMessage = error.message || "Erro ao enviar convite";
      
      if (errorMessage.includes("já está cadastrado")) {
        toast.error("Email já cadastrado no sistema", {
          description: "Este email já possui uma conta. Não é necessário enviar convite.",
        });
      } else if (errorMessage.includes("convite pendente")) {
        toast.error("Convite já enviado anteriormente", {
          description: "Já existe um convite pendente para este email.",
        });
      } else {
        toast.error("Erro ao enviar convite", {
          description: errorMessage,
        });
      }
    } finally {
      setLoading(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button className="gap-2">
          <Mail className="h-4 w-4" />
          Enviar Convite
        </Button>
      </DialogTrigger>
      <DialogContent className="sm:max-w-[500px]">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <UserPlus className="h-5 w-5" />
            Convidar Novo Usuário
          </DialogTitle>
          <DialogDescription>
            Envie um convite por email para um novo usuário se cadastrar no sistema.
            O convite expira em 7 dias e pode ser usado apenas uma vez.
          </DialogDescription>
        </DialogHeader>
        
        <form onSubmit={handleSubmit} className="space-y-4 mt-4">
          <div className="space-y-2">
            <Label htmlFor="email">
              Email <span className="text-destructive">*</span>
            </Label>
            <Input
              id="email"
              type="email"
              placeholder="usuario@exemplo.com"
              value={formData.email}
              onChange={(e) => setFormData({ ...formData, email: e.target.value })}
              required
              disabled={loading}
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="nome">
              Nome (opcional)
            </Label>
            <Input
              id="nome"
              type="text"
              placeholder="Nome completo do usuário"
              value={formData.nome}
              onChange={(e) => setFormData({ ...formData, nome: e.target.value })}
              disabled={loading}
            />
            <p className="text-xs text-muted-foreground">
              Será usado na saudação do email de convite
            </p>
          </div>

          <div className="space-y-2">
            <Label htmlFor="role">
              Perfil <span className="text-destructive">*</span>
            </Label>
            <Select
              value={formData.role}
              onValueChange={(value: "coordenador" | "visualizador") => 
                setFormData({ ...formData, role: value })
              }
              disabled={loading}
            >
              <SelectTrigger id="role">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="visualizador">
                  <div className="flex flex-col items-start">
                    <span className="font-medium">Visualizador</span>
                    <span className="text-xs text-muted-foreground">
                      Pode visualizar dados, mas não modificar
                    </span>
                  </div>
                </SelectItem>
                <SelectItem value="coordenador">
                  <div className="flex flex-col items-start">
                    <span className="font-medium">Coordenador</span>
                    <span className="text-xs text-muted-foreground">
                      Acesso total ao sistema
                    </span>
                  </div>
                </SelectItem>
              </SelectContent>
            </Select>
          </div>

          <div className="flex justify-end gap-2 pt-4">
            <Button
              type="button"
              variant="outline"
              onClick={() => setOpen(false)}
              disabled={loading}
            >
              Cancelar
            </Button>
            <Button type="submit" disabled={loading}>
              {loading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              {loading ? "Enviando..." : "Enviar Convite"}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}
