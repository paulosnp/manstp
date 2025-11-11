import { ScrollArea } from "@/components/ui/scroll-area";
import { Button } from "@/components/ui/button";
import { Plus, Copy, Trash2, Link2 } from "lucide-react";
import { Card } from "@/components/ui/card";
import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { toast } from "sonner";
import { ObjectGallery } from "./ObjectGallery";

interface Slide {
  id: string;
  thumbnail?: string;
  elements: any[];
  orientation: "landscape" | "portrait";
  backgroundImage: string;
  alunoId?: string;
  alunoNome?: string;
}

interface SlidesPanelProps {
  slides: Slide[];
  activeSlideId: string;
  onSelectSlide: (slideId: string) => void;
  onDuplicateSlide: (slideId: string) => void;
  onDeleteSlide: (slideId: string) => void;
  onAddSlide: () => void;
  turmaId: string | null;
  onLinkStudent: (slideId: string, alunoId: string, alunoNome: string) => void;
  onAddText: () => void;
  onAddImage: (file: File) => void;
  onAddShape: (shape: "rectangle" | "circle" | "line") => void;
}

export const SlidesPanel = ({
  slides,
  activeSlideId,
  onSelectSlide,
  onDuplicateSlide,
  onDeleteSlide,
  onAddSlide,
  turmaId,
  onLinkStudent,
  onAddText,
  onAddImage,
  onAddShape,
}: SlidesPanelProps) => {
  const [alunos, setAlunos] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (turmaId) {
      fetchAlunos();
    }
  }, [turmaId]);

  const fetchAlunos = async () => {
    if (!turmaId) return;
    
    setLoading(true);
    try {
      const { data, error } = await supabase
        .from("aluno_turma")
        .select(`
          aluno_id,
          alunos (
            id,
            nome_completo,
            matricula
          )
        `)
        .eq("turma_id", turmaId);

      if (error) throw error;

      const alunosList = (data || [])
        .map((at: any) => at.alunos)
        .filter(Boolean);

      setAlunos(alunosList);
    } catch (error) {
      console.error("Erro ao buscar alunos:", error);
      toast.error("Erro ao carregar alunos");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="w-64 border-r bg-muted/20 flex flex-col">
      <div className="p-3 border-b">
        <h3 className="font-semibold mb-2 text-sm">Slides</h3>
        <Button onClick={onAddSlide} variant="outline" size="sm" className="w-full">
          <Plus className="w-4 h-4 mr-2" />
          Novo Slide
        </Button>
      </div>

      <ScrollArea className="flex-1">
        <div className="p-2 space-y-2">
          {slides.map((slide, index) => (
            <Card
              key={slide.id}
              className={`relative cursor-pointer transition-all hover:ring-2 hover:ring-primary group ${
                activeSlideId === slide.id ? "ring-2 ring-primary" : ""
              }`}
              onClick={() => onSelectSlide(slide.id)}
            >
              <div className="absolute top-1 left-1 bg-background/90 px-2 py-0.5 rounded text-xs font-semibold z-10">
                {index + 1}
              </div>
              
              {slide.alunoNome && (
                <div className="absolute top-1 right-1 bg-primary/90 text-primary-foreground px-2 py-0.5 rounded text-xs font-semibold z-10 max-w-[60%] truncate">
                  {slide.alunoNome}
                </div>
              )}
              
              <div className="aspect-[4/3] bg-muted/50 overflow-hidden rounded">
                {slide.thumbnail ? (
                  <img
                    src={slide.thumbnail}
                    alt={`Slide ${index + 1}`}
                    className="w-full h-full object-contain"
                  />
                ) : (
                  <div className="w-full h-full flex items-center justify-center text-muted-foreground text-xs">
                    {slide.alunoNome ? slide.alunoNome : `Slide ${index + 1}`}
                  </div>
                )}
              </div>

              <div className="absolute bottom-1 right-1 flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                {turmaId && (
                  <Popover>
                    <PopoverTrigger asChild>
                      <Button
                        size="sm"
                        variant="secondary"
                        className="h-7 w-7 p-0"
                        onClick={(e) => e.stopPropagation()}
                      >
                        <Link2 className="w-3 h-3" />
                      </Button>
                    </PopoverTrigger>
                    <PopoverContent className="w-64" align="end">
                      <div className="space-y-2">
                        <h4 className="font-semibold text-sm">Vincular Aluno</h4>
                        {loading ? (
                          <p className="text-sm text-muted-foreground">Carregando...</p>
                        ) : alunos.length === 0 ? (
                          <p className="text-sm text-muted-foreground">Nenhum aluno na turma</p>
                        ) : (
                          <ScrollArea className="h-40">
                            <div className="space-y-1">
                              {alunos.map((aluno) => (
                                <Button
                                  key={aluno.id}
                                  variant={slide.alunoId === aluno.id ? "default" : "outline"}
                                  size="sm"
                                  className="w-full justify-start text-xs"
                                  onClick={(e) => {
                                    e.stopPropagation();
                                    onLinkStudent(slide.id, aluno.id, aluno.nome_completo);
                                  }}
                                >
                                  {aluno.nome_completo}
                                </Button>
                              ))}
                            </div>
                          </ScrollArea>
                        )}
                      </div>
                    </PopoverContent>
                  </Popover>
                )}
                <Button
                  size="sm"
                  variant="secondary"
                  className="h-7 w-7 p-0"
                  onClick={(e) => {
                    e.stopPropagation();
                    onDuplicateSlide(slide.id);
                  }}
                >
                  <Copy className="w-3 h-3" />
                </Button>
                {slides.length > 1 && (
                  <Button
                    size="sm"
                    variant="destructive"
                    className="h-7 w-7 p-0"
                    onClick={(e) => {
                      e.stopPropagation();
                      onDeleteSlide(slide.id);
                    }}
                  >
                    <Trash2 className="w-3 h-3" />
                  </Button>
                )}
              </div>
            </Card>
          ))}
        </div>
      </ScrollArea>

      <ObjectGallery
        onAddText={onAddText}
        onAddImage={onAddImage}
        onAddShape={onAddShape}
      />
    </div>
  );
};
