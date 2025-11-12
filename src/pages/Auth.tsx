import { useState, useEffect } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import { supabase } from "@/lib/supabase";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { toast } from "sonner";
import { Shield, Mail, CheckCircle2, AlertCircle } from "lucide-react";
import { authSchema } from "@/lib/validations";
import { z } from "zod";

const signupSchema = z.object({
  email: z.string().email("Email inválido"),
  password: z.string().min(8, "Senha deve ter no mínimo 8 caracteres"),
  confirmPassword: z.string(),
  nome_completo: z.string().min(3, "Nome deve ter no mínimo 3 caracteres"),
}).refine((data) => data.password === data.confirmPassword, {
  message: "As senhas não coincidem",
  path: ["confirmPassword"],
});

export default function Auth() {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const [loading, setLoading] = useState(false);
  const [inviteToken, setInviteToken] = useState<string | null>(null);
  const [inviteData, setInviteData] = useState<{ email: string; role: string } | null>(null);
  const [validatingInvite, setValidatingInvite] = useState(false);


  // Verificar token de convite na URL
  useEffect(() => {
    const token = searchParams.get("invite");
    if (token) {
      setInviteToken(token);
      validateInviteToken(token);
    }
  }, [searchParams]);

  const validateInviteToken = async (token: string) => {
    setValidatingInvite(true);
    try {
      const { data, error } = await supabase
        .from("invitations")
        .select("email, role, expires_at, used")
        .eq("token", token)
        .maybeSingle();

      if (error || !data) {
        toast.error("Convite inválido ou não encontrado");
        setInviteToken(null);
        return;
      }

      if (data.used) {
        toast.error("Este convite já foi utilizado");
        setInviteToken(null);
        return;
      }

      if (new Date(data.expires_at) < new Date()) {
        toast.error("Este convite expirou");
        setInviteToken(null);
        return;
      }

      setInviteData({ email: data.email, role: data.role });
      toast.success("Convite válido! Complete o cadastro abaixo.");
    } catch (error: any) {
      console.error("Erro ao validar convite:", error);
      toast.error("Erro ao validar convite");
      setInviteToken(null);
    } finally {
      setValidatingInvite(false);
    }
  };

  const handleSignIn = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setLoading(true);

    const formData = new FormData(e.currentTarget);
    const email = (formData.get("email") as string).trim();
    const password = formData.get("password") as string;

    // Validate form data
    const validation = authSchema.safeParse({ email, password });
    if (!validation.success) {
      const firstError = validation.error.errors[0];
      toast.error(firstError.message);
      setLoading(false);
      return;
    }

    try {
      const { error } = await supabase.auth.signInWithPassword({
        email,
        password,
      });

      if (error) throw error;

      toast.success("Login realizado com sucesso!");
      navigate("/");
    } catch (error: any) {
      toast.error(error.message || "Erro ao fazer login");
    } finally {
      setLoading(false);
    }
  };

  const handleSignUp = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    
    if (!inviteToken || !inviteData) {
      toast.error("Cadastro requer um convite válido");
      return;
    }

    setLoading(true);

    const formData = new FormData(e.currentTarget);
    const email = (formData.get("email") as string).trim();
    const password = formData.get("password") as string;
    const confirmPassword = formData.get("confirmPassword") as string;
    const nome_completo = (formData.get("nome_completo") as string).trim();

    const validation = signupSchema.safeParse({ email, password, confirmPassword, nome_completo });
    if (!validation.success) {
      const firstError = validation.error.errors[0];
      toast.error(firstError.message);
      setLoading(false);
      return;
    }

    if (email !== inviteData.email) {
      toast.error("Email não corresponde ao convite");
      setLoading(false);
      return;
    }

    try {
      // Criar usuário
      const { data: authData, error: signUpError } = await supabase.auth.signUp({
        email,
        password,
        options: {
          data: {
            nome_completo,
            role: inviteData.role,
          },
          emailRedirectTo: `${window.location.origin}/`,
        },
      });

      if (signUpError) throw signUpError;

      if (!authData.user) {
        throw new Error("Erro ao criar usuário");
      }

      // Marcar convite como usado
      const { error: updateError } = await supabase
        .from("invitations")
        .update({ 
          used: true, 
          used_at: new Date().toISOString() 
        })
        .eq("token", inviteToken);

      if (updateError) {
        console.error("Erro ao marcar convite como usado:", updateError);
      }

      toast.success("Conta criada com sucesso!", {
        description: "Você será redirecionado em instantes...",
      });

      setTimeout(() => {
        navigate("/");
      }, 2000);
    } catch (error: any) {
      console.error("Erro ao criar conta:", error);
      toast.error(error.message || "Erro ao criar conta");
    } finally {
      setLoading(false);
    }
  };

  const handleForgotPassword = async () => {
    const email = (document.getElementById("signin-email") as HTMLInputElement)?.value;

    if (!email) {
      toast.error("Por favor, insira seu email");
      return;
    }

    try {
      const { error } = await supabase.auth.resetPasswordForEmail(email, {
        redirectTo: `${window.location.origin}/auth`,
      });

      if (error) throw error;

      toast.success("Email de recuperação enviado! Verifique sua caixa de entrada.");
    } catch (error: any) {
      toast.error(error.message || "Erro ao enviar email de recuperação");
    }
  };

  // Se tem convite, mostrar apenas formulário de cadastro
  if (inviteToken && inviteData) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-gradient-to-br from-primary via-primary/90 to-primary/80 p-4">
        <Card className="w-full max-w-md shadow-elevated">
          <CardHeader className="space-y-4 text-center">
            <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-full bg-green-500">
              <Mail className="h-8 w-8 text-white" />
            </div>
            <CardTitle className="text-2xl font-bold">Complete seu Cadastro</CardTitle>
            <CardDescription>
              Você foi convidado como {inviteData.role === "coordenador" ? "Coordenador" : "Visualizador"}
            </CardDescription>
          </CardHeader>
          <CardContent>
            <Alert className="mb-4 border-green-200 bg-green-50">
              <CheckCircle2 className="h-4 w-4 text-green-600" />
              <AlertDescription className="text-green-800">
                Convite válido para: <strong>{inviteData.email}</strong>
              </AlertDescription>
            </Alert>

            <form onSubmit={handleSignUp} className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="signup-name">Nome Completo *</Label>
                <Input
                  id="signup-name"
                  name="nome_completo"
                  type="text"
                  placeholder="Seu nome completo"
                  required
                  disabled={loading}
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="signup-email">E-mail *</Label>
                <Input
                  id="signup-email"
                  name="email"
                  type="email"
                  value={inviteData.email}
                  readOnly
                  className="bg-muted"
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="signup-password">Senha *</Label>
                <Input
                  id="signup-password"
                  name="password"
                  type="password"
                  placeholder="Mínimo 8 caracteres"
                  required
                  disabled={loading}
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="signup-confirm-password">Confirmar Senha *</Label>
                <Input
                  id="signup-confirm-password"
                  name="confirmPassword"
                  type="password"
                  placeholder="Digite a senha novamente"
                  required
                  disabled={loading}
                />
              </div>

              <Button type="submit" className="w-full" disabled={loading}>
                {loading ? "Criando conta..." : "Criar Conta"}
              </Button>
            </form>
          </CardContent>
        </Card>
      </div>
    );
  }

  // Se está validando convite
  if (validatingInvite) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-gradient-to-br from-primary via-primary/90 to-primary/80 p-4">
        <Card className="w-full max-w-md shadow-elevated">
          <CardContent className="flex flex-col items-center justify-center py-12">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary"></div>
            <p className="mt-4 text-muted-foreground">Validando convite...</p>
          </CardContent>
        </Card>
      </div>
    );
  }

  // Tela de login padrão (sem convite)
  return (
    <div className="flex min-h-screen items-center justify-center bg-gradient-to-br from-primary via-primary/90 to-primary/80 p-4">
      <Card className="w-full max-w-md shadow-elevated">
        <CardHeader className="space-y-4 text-center">
          <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-full bg-primary">
            <Shield className="h-8 w-8 text-primary-foreground" />
          </div>
          <CardTitle className="text-2xl font-bold">GESTOR ESCOLAR</CardTitle>
        </CardHeader>
        <CardContent>
          <Alert className="mb-4 border-blue-200 bg-blue-50">
            <AlertCircle className="h-4 w-4 text-blue-600" />
            <AlertDescription className="text-blue-800">
              <strong>Cadastro por convite:</strong> Para criar uma conta, você precisa receber um convite do coordenador.
            </AlertDescription>
          </Alert>

          <form onSubmit={handleSignIn} className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="signin-email">E-mail</Label>
              <Input
                id="signin-email"
                name="email"
                type="email"
                placeholder="seu@email.com"
                required
              />
            </div>
            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <Label htmlFor="signin-password">Senha</Label>
                <Button
                  type="button"
                  variant="link"
                  className="h-auto p-0 text-xs"
                  onClick={handleForgotPassword}
                >
                  Esqueceu a senha?
                </Button>
              </div>
              <Input
                id="signin-password"
                name="password"
                type="password"
                placeholder="••••••••"
                required
              />
            </div>
            <Button type="submit" className="w-full" disabled={loading}>
              {loading ? "Entrando..." : "Entrar"}
            </Button>
          </form>
        </CardContent>
      </Card>
    </div>
  );
}
