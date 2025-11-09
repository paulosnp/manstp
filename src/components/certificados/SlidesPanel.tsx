import { ScrollArea } from "@/components/ui/scroll-area";
import { Button } from "@/components/ui/button";
import { Plus, Copy, Trash2 } from "lucide-react";
import { Card } from "@/components/ui/card";

interface Slide {
  id: string;
  thumbnail?: string;
  elements: any[];
  orientation: "landscape" | "portrait";
  backgroundImage: string;
}

interface SlidesPanelProps {
  slides: Slide[];
  activeSlideId: string;
  onSelectSlide: (slideId: string) => void;
  onDuplicateSlide: (slideId: string) => void;
  onDeleteSlide: (slideId: string) => void;
  onAddSlide: () => void;
}

export const SlidesPanel = ({
  slides,
  activeSlideId,
  onSelectSlide,
  onDuplicateSlide,
  onDeleteSlide,
  onAddSlide,
}: SlidesPanelProps) => {
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
              className={`relative cursor-pointer transition-all hover:ring-2 hover:ring-primary ${
                activeSlideId === slide.id ? "ring-2 ring-primary" : ""
              }`}
              onClick={() => onSelectSlide(slide.id)}
            >
              <div className="absolute top-1 left-1 bg-background/90 px-2 py-0.5 rounded text-xs font-semibold z-10">
                {index + 1}
              </div>
              
              <div className="aspect-[4/3] bg-muted/50 overflow-hidden rounded">
                {slide.thumbnail ? (
                  <img
                    src={slide.thumbnail}
                    alt={`Slide ${index + 1}`}
                    className="w-full h-full object-contain"
                  />
                ) : (
                  <div className="w-full h-full flex items-center justify-center text-muted-foreground">
                    Slide {index + 1}
                  </div>
                )}
              </div>

              <div className="absolute bottom-1 right-1 flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
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
    </div>
  );
};
