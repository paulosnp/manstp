import { SidebarProvider, SidebarTrigger } from "@/components/ui/sidebar";
import { AppSidebar } from "./AppSidebar";
import logoFundo from "@/assets/logo-fundo.png";

export default function MainLayout({ children }: { children: React.ReactNode }) {
  return (
    <SidebarProvider>
      <div className="flex min-h-screen w-full">
        <AppSidebar />
        <div className="flex-1 flex flex-col relative">
          <div 
            className="fixed inset-0 z-0 bg-no-repeat pointer-events-none"
            style={{ 
              backgroundImage: `url(${logoFundo})`,
              opacity: 0.05,
              backgroundSize: 'cover',
              backgroundPosition: '60% center'
            }}
          />
          <header className="sticky top-0 z-10 flex h-14 items-center gap-2 sm:gap-4 border-b bg-card px-3 sm:px-4 shadow-sm">
            <SidebarTrigger />
            <h1 className="text-sm sm:text-base md:text-lg font-semibold truncate">Gestor de Cursos e Alunos Militares</h1>
          </header>
          <main className="flex-1 p-3 sm:p-4 md:p-6 relative z-[1]">{children}</main>
        </div>
      </div>
    </SidebarProvider>
  );
}
