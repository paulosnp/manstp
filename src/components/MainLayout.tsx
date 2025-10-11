import { SidebarProvider, SidebarTrigger } from "@/components/ui/sidebar";
import { AppSidebar } from "./AppSidebar";
import { useLocation } from "react-router-dom";
import { useEffect, useState } from "react";
import logoFundo from "@/assets/logo-fundo.png";
import logoFundo2 from "@/assets/logo-fundo-2.png";
import { LanguageSelector } from "./LanguageSelector";
import { OnlineUsers } from "./OnlineUsers";
import { ThemeToggle } from "./ThemeToggle";
import { BackgroundSettings } from "./BackgroundSettings";
import { supabase } from "@/integrations/supabase/client";

export default function MainLayout({ children }: { children: React.ReactNode }) {
  const location = useLocation();
  const [customBackgrounds, setCustomBackgrounds] = useState<{
    background1: string | null;
    background2: string | null;
  }>({ background1: null, background2: null });

  useEffect(() => {
    const fetchBackgrounds = async () => {
      const { data } = await supabase
        .from("appearance_settings")
        .select("background_image_1, background_image_2")
        .single();

      if (data) {
        setCustomBackgrounds({
          background1: data.background_image_1,
          background2: data.background_image_2,
        });
      }
    };

    fetchBackgrounds();
  }, []);
  
  // Alternar entre as duas imagens baseado na rota
  const pagesWithLogo2 = ["/cursos", "/instrutores", "/relatorios"];
  const useBackground2 = pagesWithLogo2.includes(location.pathname);
  
  const backgroundImage = useBackground2
    ? (customBackgrounds.background2 || logoFundo2)
    : (customBackgrounds.background1 || logoFundo);
  return (
    <SidebarProvider>
      <div className="flex min-h-screen w-full">
        <AppSidebar />
        <div className="flex-1 flex flex-col relative">
          <div 
            className="fixed inset-0 z-0 bg-no-repeat bg-center pointer-events-none"
            style={{ 
              backgroundImage: `url(${backgroundImage})`,
              opacity: 0.10,
              backgroundSize: 'contain'
            }}
          />
          <header className="sticky top-0 z-10 flex h-14 items-center gap-2 sm:gap-4 border-b bg-card px-3 sm:px-4 shadow-sm">
            <SidebarTrigger />
            <h1 className="text-sm sm:text-base md:text-lg font-semibold truncate">Gestor de Cursos e Alunos Militares</h1>
            <div className="ml-auto flex items-center gap-2">
              <OnlineUsers />
              <BackgroundSettings />
              <ThemeToggle />
              <LanguageSelector />
            </div>
          </header>
          <main className="flex-1 p-3 sm:p-4 md:p-6 relative z-[1]">{children}</main>
        </div>
      </div>
    </SidebarProvider>
  );
}
