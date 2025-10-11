import { SidebarProvider, SidebarTrigger } from "@/components/ui/sidebar";
import { AppSidebar } from "./AppSidebar";
import { useLocation } from "react-router-dom";
import logoFundo from "@/assets/logo-fundo.png";
import logoFundo2 from "@/assets/logo-fundo-2.png";
import { LanguageSelector } from "./LanguageSelector";

export default function MainLayout({ children }: { children: React.ReactNode }) {
  const location = useLocation();
  
  // Alternar entre as duas imagens baseado na rota
  const pagesWithLogo2 = ["/cursos", "/instrutores", "/relatorios"];
  const backgroundImage = pagesWithLogo2.includes(location.pathname) ? logoFundo2 : logoFundo;
  return (
    <SidebarProvider>
      <div className="flex min-h-screen w-full">
        <AppSidebar />
        <div className="flex-1 flex flex-col relative">
          <div 
            className="fixed inset-0 z-0 bg-no-repeat bg-center pointer-events-none"
            style={{ 
              backgroundImage: `url(${backgroundImage})`,
              opacity: 0.06,
              backgroundSize: 'contain'
            }}
          />
          <header className="sticky top-0 z-10 flex h-14 items-center gap-2 sm:gap-4 border-b bg-card px-3 sm:px-4 shadow-sm">
            <SidebarTrigger />
            <h1 className="text-sm sm:text-base md:text-lg font-semibold truncate">Gestor de Cursos e Alunos Militares</h1>
            <div className="ml-auto">
              <LanguageSelector />
            </div>
          </header>
          <main className="flex-1 p-3 sm:p-4 md:p-6 relative z-[1]">{children}</main>
        </div>
      </div>
    </SidebarProvider>
  );
}
