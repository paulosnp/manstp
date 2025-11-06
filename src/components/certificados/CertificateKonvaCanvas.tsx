import { useRef, useState, useEffect } from "react";
import { Stage, Layer, Image as KonvaImage, Transformer } from "react-konva";
import useImage from "use-image";
import { DraggableImage } from "./konva/DraggableImage";
import { DraggableText } from "./konva/DraggableText";

interface Element {
  id: string;
  type: "text" | "image";
  x: number;
  y: number;
  [key: string]: any;
}

interface BackgroundSettings {
  x: number;
  y: number;
  width: number;
  height: number;
  scaleX: number;
  scaleY: number;
}

interface CertificateKonvaCanvasProps {
  orientation: "landscape" | "portrait";
  backgroundImage?: string;
  elements: Element[];
  selectedId: string | null;
  onSelectElement: (id: string | null) => void;
  onUpdateElement: (element: Element) => void;
  onStageReady: (stage: any) => void;
}

export const CertificateKonvaCanvas = ({
  orientation,
  backgroundImage,
  elements,
  selectedId,
  onSelectElement,
  onUpdateElement,
  onStageReady,
}: CertificateKonvaCanvasProps) => {
  const stageRef = useRef<any>(null);
  const bgRef = useRef<any>(null);
  const bgTrRef = useRef<any>(null);
  const [bgImage] = useImage(backgroundImage || "");
  const [backgroundOpacity, setBackgroundOpacity] = useState(1);
  const [backgroundSettings, setBackgroundSettings] = useState<BackgroundSettings>({
    x: 0,
    y: 0,
    width: 900,
    height: 600,
    scaleX: 1,
    scaleY: 1,
  });
  const [bgSelected, setBgSelected] = useState(false);

  const width = orientation === "landscape" ? 900 : 600;
  const height = orientation === "landscape" ? 600 : 900;

  useEffect(() => {
    if (stageRef.current) {
      onStageReady(stageRef.current);
    }
  }, [stageRef.current]);

  useEffect(() => {
    setBackgroundSettings({
      x: 0,
      y: 0,
      width,
      height,
      scaleX: 1,
      scaleY: 1,
    });
  }, [width, height]);

  useEffect(() => {
    if (bgSelected && bgTrRef.current && bgRef.current) {
      bgTrRef.current.nodes([bgRef.current]);
      bgTrRef.current.getLayer()?.batchDraw();
    }
  }, [bgSelected]);

  const checkDeselect = (e: any) => {
    const clickedOnEmpty = e.target === e.target.getStage();
    if (clickedOnEmpty) {
      onSelectElement(null);
      setBgSelected(false);
    }
  };

  const handleBgSelect = () => {
    setBgSelected(true);
    onSelectElement(null);
  };

  const handleBgTransform = () => {
    const node = bgRef.current;
    if (!node) return;
    
    setBackgroundSettings({
      x: node.x(),
      y: node.y(),
      width: node.width() * node.scaleX(),
      height: node.height() * node.scaleY(),
      scaleX: 1,
      scaleY: 1,
    });
    
    node.scaleX(1);
    node.scaleY(1);
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
        {bgSelected && (
          <div className="text-sm text-primary font-medium">
            ✓ Fundo selecionado - Arraste ou redimensione usando os controles
          </div>
        )}
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
              <>
                <KonvaImage
                  image={bgImage}
                  x={backgroundSettings.x}
                  y={backgroundSettings.y}
                  width={backgroundSettings.width}
                  height={backgroundSettings.height}
                  scaleX={backgroundSettings.scaleX}
                  scaleY={backgroundSettings.scaleY}
                  opacity={backgroundOpacity}
                  draggable
                  ref={bgRef}
                  onClick={handleBgSelect}
                  onTap={handleBgSelect}
                  onDragEnd={(e) => {
                    setBackgroundSettings({
                      ...backgroundSettings,
                      x: e.target.x(),
                      y: e.target.y(),
                    });
                  }}
                  onTransformEnd={handleBgTransform}
                />
                {bgSelected && (
                  <Transformer
                    ref={bgTrRef}
                    boundBoxFunc={(oldBox, newBox) => {
                      if (newBox.width < 50 || newBox.height < 50) {
                        return oldBox;
                      }
                      return newBox;
                    }}
                  />
                )}
              </>
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
                      setBgSelected(false);
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
                      setBgSelected(false);
                    }}
                    onChange={onUpdateElement}
                  />
                );
              }
              return null;
            })}
          </Layer>
        </Stage>
      </div>

      <div className="text-xs text-muted-foreground max-w-[600px] text-center">
        <p>
          Clique duplo no texto para editar. Clique no fundo para selecioná-lo e redimensioná-lo.
          Arraste elementos para reposicionar. Use os pontos de controle para redimensionar.
        </p>
      </div>
    </div>
  );
};
