import { Home, Users, BookOpen, School, GraduationCap, BarChart3, FileText, Shield, LogOut, History } from "lucide-react";
import { NavLink, useNavigate } from "react-router-dom";
import {
  Sidebar,
  SidebarContent,
  SidebarGroup,
  SidebarGroupContent,
  SidebarGroupLabel,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
  SidebarFooter,
  useSidebar,
} from "@/components/ui/sidebar";
import { Button } from "@/components/ui/button";
import { signOut } from "@/lib/supabase";
import { toast } from "sonner";

const menuItems = [
  { title: "Dashboard", url: "/", icon: Home },
  { title: "Alunos", url: "/alunos", icon: Users },
  { title: "Instrutores", url: "/instrutores", icon: GraduationCap },
  { title: "Cursos", url: "/cursos", icon: BookOpen },
  { title: "Turmas", url: "/turmas", icon: School },
  { title: "Estatísticas", url: "/estatisticas", icon: BarChart3 },
  { title: "Relatórios", url: "/relatorios", icon: FileText },
  { title: "Usuários", url: "/usuarios", icon: Shield },
  { title: "Histórico", url: "/historico", icon: History },
];

export function AppSidebar() {
  const { state } = useSidebar();
  const navigate = useNavigate();

  const handleSignOut = async () => {
    try {
      console.log("Iniciando logout...");
      await signOut();
      console.log("Logout realizado com sucesso");
      toast.success("Logout realizado com sucesso!");
      // Força navegação para auth
      window.location.href = "/auth";
    } catch (error: any) {
      console.error("Erro ao fazer logout:", error);
      toast.error("Erro ao fazer logout: " + error.message);
    }
  };

  return (
    <Sidebar collapsible="icon">
      <SidebarContent>
        <SidebarGroup>
          <SidebarGroupLabel className="text-sidebar-primary">
            Sistema Militar
          </SidebarGroupLabel>
          <SidebarGroupContent>
            <SidebarMenu>
              {menuItems.map((item) => (
                <SidebarMenuItem key={item.title}>
                  <SidebarMenuButton asChild>
                    <NavLink
                      to={item.url}
                      end={item.url === "/"}
                      className={({ isActive }) =>
                        isActive
                          ? "bg-sidebar-accent text-sidebar-accent-foreground"
                          : ""
                      }
                    >
                      <item.icon className="h-4 w-4" />
                      <span>{item.title}</span>
                    </NavLink>
                  </SidebarMenuButton>
                </SidebarMenuItem>
              ))}
            </SidebarMenu>
          </SidebarGroupContent>
        </SidebarGroup>
      </SidebarContent>
      <SidebarFooter>
        <Button
          variant="ghost"
          className="w-full justify-start text-sidebar-foreground hover:bg-sidebar-accent hover:text-sidebar-accent-foreground"
          onClick={handleSignOut}
        >
          <LogOut className="h-4 w-4" />
          {state !== "collapsed" && <span className="ml-2">Sair</span>}
        </Button>
      </SidebarFooter>
    </Sidebar>
  );
}
