import { useRef, useState, useEffect } from "react";
import { Stage, Layer, Image as KonvaImage } from "react-konva";
import useImage from "use-image";
import { DraggableImage } from "./konva/DraggableImage";
import { DraggableText } from "./konva/DraggableText";
import { Rulers } from "./Rulers";

interface Element {
  id: string;
  type: "text" | "image";
  x: number;
  y: number;
  [key: string]: any;
}

interface CertificateKonvaCanvasProps {
  orientation: "landscape" | "portrait";
  backgroundImage?: string;
  elements: Element[];
  selectedId: string | null;
  onSelectElement: (id: string | null) => void;
  onUpdateElement: (element: Element) => void;
  onStageReady: (stage: any) => void;
  showRulers?: boolean;
}

export const CertificateKonvaCanvas = ({
  orientation,
  backgroundImage,
  elements,
  selectedId,
  onSelectElement,
  onUpdateElement,
  onStageReady,
  showRulers = false,
}: CertificateKonvaCanvasProps) => {
  const stageRef = useRef<any>(null);
  const [bgImage] = useImage(backgroundImage || "");
  const [backgroundOpacity, setBackgroundOpacity] = useState(1);

  const width = orientation === "landscape" ? 900 : 600;
  const height = orientation === "landscape" ? 600 : 900;

  useEffect(() => {
    if (stageRef.current) {
      onStageReady(stageRef.current);
    }
  }, [stageRef.current]);

  // Calcular scale automático do background para cobrir todo o canvas
  const getBackgroundScale = () => {
    if (!bgImage) return { scaleX: 1, scaleY: 1, x: 0, y: 0 };
    
    const scaleX = width / bgImage.width;
    const scaleY = height / bgImage.height;
    
    // Usar o maior scale para cobrir todo o canvas (cover)
    const scale = Math.max(scaleX, scaleY);
    
    // Centralizar a imagem
    const x = (width - bgImage.width * scale) / 2;
    const y = (height - bgImage.height * scale) / 2;
    
    return { scaleX: scale, scaleY: scale, x, y };
  };

  const backgroundScale = getBackgroundScale();

  const checkDeselect = (e: any) => {
    const clickedOnEmpty = e.target === e.target.getStage();
    if (clickedOnEmpty) {
      onSelectElement(null);
    }
  };

  return (
    <div className="w-full flex flex-col items-center gap-4">
      <div className="w-full max-w-md space-y-4">
        <div>
          <label className="text-sm font-medium text-muted-foreground mb-2 block">
            Transparência do fundo
          </label>
          <input
            type="range"
            min="0"
            max="1"
            step="0.01"
            value={backgroundOpacity}
            onChange={(e) => setBackgroundOpacity(parseFloat(e.target.value))}
            className="w-full"
          />
        </div>
      </div>

      <div className="bg-muted/30 rounded-lg p-8 shadow-xl">
        <Stage
          width={width}
          height={height}
          ref={stageRef}
          onMouseDown={checkDeselect}
          onTouchStart={checkDeselect}
          className="bg-white shadow-lg"
        >
          <Layer>
            {bgImage && (
              <KonvaImage
                image={bgImage}
                x={backgroundScale.x}
                y={backgroundScale.y}
                scaleX={backgroundScale.scaleX}
                scaleY={backgroundScale.scaleY}
                opacity={backgroundOpacity}
                listening={false}
              />
            )}

            {elements.map((el) => {
              if (el.type === "text") {
                return (
                  <DraggableText
                    key={el.id}
                    element={el as any}
                    isSelected={selectedId === el.id}
                    onSelect={() => {
                      onSelectElement(el.id);
                    }}
                    onChange={onUpdateElement}
                  />
                );
              } else if (el.type === "image") {
                return (
                  <DraggableImage
                    key={el.id}
                    element={el as any}
                    isSelected={selectedId === el.id}
                    onSelect={() => {
                      onSelectElement(el.id);
                    }}
                    onChange={onUpdateElement}
                  />
                );
              }
              return null;
            })}
          </Layer>
          <Rulers width={width} height={height} visible={showRulers} />
        </Stage>
      </div>

      <div className="text-xs text-muted-foreground max-w-[600px] text-center">
        <p>
          Clique duplo no texto para editar. Arraste elementos para reposicionar. 
          Use os pontos de controle para redimensionar. O fundo se ajusta automaticamente.
        </p>
      </div>
    </div>
  );
};
