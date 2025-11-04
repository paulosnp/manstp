import { useEffect, useRef, useState } from "react";
import { Canvas as FabricCanvas, FabricImage, Textbox, util } from "fabric";
import { toast } from "sonner";

interface CertificateCanvasProps {
  orientation: "landscape" | "portrait";
  backgroundImage?: string;
  onCanvasReady: (canvas: FabricCanvas) => void;
}

export const CertificateCanvas = ({
  orientation,
  backgroundImage,
  onCanvasReady,
}: CertificateCanvasProps) => {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [fabricCanvas, setFabricCanvas] = useState<FabricCanvas | null>(null);
  const containerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!canvasRef.current) return;

    const width = orientation === "landscape" ? 900 : 600;
    const height = orientation === "landscape" ? 600 : 900;

    const canvas = new FabricCanvas(canvasRef.current, {
      width,
      height,
      backgroundColor: "#ffffff",
    });

    setFabricCanvas(canvas);
    onCanvasReady(canvas);

    return () => {
      canvas.dispose();
    };
  }, [orientation]);

  useEffect(() => {
    if (!fabricCanvas || !backgroundImage) return;

    util.loadImage(backgroundImage, { crossOrigin: "anonymous" }).then((img) => {
      const fabricImg = new FabricImage(img, {
        selectable: false,
        evented: false,
      });

      const canvasWidth = fabricCanvas.width || 900;
      const canvasHeight = fabricCanvas.height || 600;

      fabricImg.scaleToWidth(canvasWidth);
      fabricImg.scaleToHeight(canvasHeight);

      fabricCanvas.backgroundImage = fabricImg;
      fabricCanvas.renderAll();
    });
  }, [fabricCanvas, backgroundImage]);

  const width = orientation === "landscape" ? 900 : 600;
  const height = orientation === "landscape" ? 600 : 900;

  return (
    <div
      ref={containerRef}
      className="w-full flex items-center justify-center bg-muted/30 rounded-lg p-8"
    >
      <div className="relative shadow-xl">
        <canvas ref={canvasRef} />
        <div className="absolute -right-20 top-0 text-xs text-muted-foreground max-w-[200px]">
          <p className="leading-relaxed">
            Para a exibição correta do certificado, a imagem de fundo deve ter{" "}
            <strong>
              {orientation === "landscape" ? "900x600px" : "600x900px"}
            </strong>{" "}
            na orientação {orientation === "landscape" ? "paisagem" : "retrato"}.
          </p>
        </div>
      </div>
    </div>
  );
};
