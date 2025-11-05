import { useRef, useState, useEffect } from "react";
import { Stage, Layer, Image as KonvaImage } from "react-konva";
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

interface CertificateKonvaCanvasProps {
  orientation: "landscape" | "portrait";
  backgroundImage?: string;
  elements: Element[];
  selectedId: string | null;
  onSelectElement: (id: string | null) => void;
  onUpdateElement: (element: Element) => void;
  onStageReady: (stage: any) => void;
  backgroundOpacity: number;
}

export const CertificateKonvaCanvas = ({
  orientation,
  backgroundImage,
  elements,
  selectedId,
  onSelectElement,
  onUpdateElement,
  onStageReady,
  backgroundOpacity,
}: CertificateKonvaCanvasProps) => {
  const stageRef = useRef<any>(null);
  const [bgImage] = useImage(backgroundImage || "");

  const width = orientation === "landscape" ? 900 : 600;
  const height = orientation === "landscape" ? 600 : 900;

  useEffect(() => {
    if (stageRef.current) {
      onStageReady(stageRef.current);
    }
  }, [stageRef.current]);

  const checkDeselect = (e: any) => {
    const clickedOnEmpty = e.target === e.target.getStage();
    if (clickedOnEmpty) {
      onSelectElement(null);
    }
  };

  return (
    <div className="w-full flex justify-center">
      <div className="bg-muted/10 rounded-lg p-4 border shadow-sm inline-block">
        <Stage
          width={width}
          height={height}
          ref={stageRef}
          onMouseDown={checkDeselect}
          onTouchStart={checkDeselect}
          className="bg-white"
        >
          <Layer>
            {bgImage && (
              <KonvaImage
                image={bgImage}
                x={0}
                y={0}
                width={width}
                height={height}
                opacity={backgroundOpacity}
              />
            )}

            {elements.map((el) => {
              if (el.type === "text") {
                return (
                  <DraggableText
                    key={el.id}
                    element={el as any}
                    isSelected={selectedId === el.id}
                    onSelect={() => onSelectElement(el.id)}
                    onChange={onUpdateElement}
                  />
                );
              } else if (el.type === "image") {
                return (
                  <DraggableImage
                    key={el.id}
                    element={el as any}
                    isSelected={selectedId === el.id}
                    onSelect={() => onSelectElement(el.id)}
                    onChange={onUpdateElement}
                  />
                );
              }
              return null;
            })}
          </Layer>
        </Stage>
      </div>
    </div>
  );
};
