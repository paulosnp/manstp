import { Home, Users, BookOpen, School, GraduationCap, BarChart3, FileText, Shield, LogOut, Award, ClipboardList, Calendar, CheckSquare, StickyNote } from "lucide-react";
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
import { useTranslation } from "react-i18next";

export function AppSidebar() {
  const { state } = useSidebar();
  const navigate = useNavigate();
  const { t } = useTranslation();

  const menuItems = [
    { title: t("dashboard"), url: "/", icon: Home },
    { title: t("instructors"), url: "/instrutores", icon: GraduationCap },
    { title: t("courses"), url: "/cursos", icon: BookOpen },
    { title: t("classes"), url: "/turmas", icon: School },
    { title: t("certificates") || "Certificados", url: "/certificados", icon: Award },
    { title: t("grades") || "Notas", url: "/notas", icon: ClipboardList },
    { title: "Presença", url: "/presencas", icon: CheckSquare },
    { title: t("weeklySchedule") || "Horários", url: "/horarios", icon: Calendar },
    { title: "Bloco de Notas", url: "/notas-pessoais", icon: StickyNote },
    { title: t("statistics"), url: "/estatisticas", icon: BarChart3 },
    { title: t("reports"), url: "/relatorios", icon: FileText },
    { title: t("users"), url: "/usuarios", icon: Shield },
  ];

  const handleSignOut = async () => {
    try {
      await signOut();
      toast.success(t("logoutSuccess"));
      navigate("/auth");
    } catch (error: any) {
      toast.error(t("errorLogout"));
    }
  };

  return (
    <Sidebar collapsible="icon">
      <SidebarContent>
        <SidebarGroup>
          <SidebarGroupLabel className="text-sidebar-primary">
            {t("militarySystem")}
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
          {state !== "collapsed" && <span className="ml-2">{t("logout")}</span>}
        </Button>
      </SidebarFooter>
    </Sidebar>
  );
}
