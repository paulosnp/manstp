import { forwardRef } from "react";
import { DraggableElement } from "./CertificateEditor";

interface CertificatePrintPreviewProps {
  titulo: string;
  backgroundFrente: string;
  elementosFrente: DraggableElement[];
}

export const CertificatePrintPreview = forwardRef<
  HTMLDivElement,
  CertificatePrintPreviewProps
>(({ titulo, backgroundFrente, elementosFrente }, ref) => {
  return (
    <div ref={ref} className="hidden print:block">
      <div className="w-full min-h-screen p-8 bg-white">
        <h1 className="text-4xl font-bold text-center mb-8">{titulo}</h1>
        <div
          className="relative w-full h-[800px]"
          style={{
            backgroundImage: backgroundFrente ? `url(${backgroundFrente})` : undefined,
            backgroundSize: "cover",
            backgroundPosition: "center",
            backgroundRepeat: "no-repeat",
          }}
        >
          {elementosFrente.map((el) => (
            <div
              key={el.id}
              style={{
                position: "absolute",
                left: el.x,
                top: el.y,
                width: el.width,
                height: el.height,
              }}
            >
              {el.type === "image" ? (
                <img src={el.content} alt="" className="w-full h-full object-contain" />
              ) : (
                <div
                  style={{
                    fontSize: el.fontSize,
                    fontFamily: el.fontFamily,
                    color: el.color,
                    textAlign: el.textAlign as any,
                  }}
                >
                  {el.content}
                </div>
              )}
            </div>
          ))}
        </div>
      </div>
    </div>
  );
});

CertificatePrintPreview.displayName = "CertificatePrintPreview";
