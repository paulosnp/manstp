import { useState } from "react";
import Draggable from "react-draggable";
import { ResizableBox } from "react-resizable";
import { Button } from "@/components/ui/button";
import { Trash2 } from "lucide-react";
import "react-resizable/css/styles.css";

export interface DraggableElement {
  id: string;
  type: "image" | "text";
  content: string;
  x: number;
  y: number;
  width: number;
  height: number;
  fontSize?: number;
  fontFamily?: string;
  color?: string;
  textAlign?: string;
}

interface CertificateEditorProps {
  elements: DraggableElement[];
  onElementsChange: (elements: DraggableElement[]) => void;
  backgroundImage?: string;
  editorTitle: string;
}

export const CertificateEditor = ({
  elements,
  onElementsChange,
  backgroundImage,
  editorTitle,
}: CertificateEditorProps) => {
  const [selectedId, setSelectedId] = useState<string | null>(null);

  const handleDrag = (id: string, data: any) => {
    const newElements = elements.map((el) =>
      el.id === id ? { ...el, x: data.x, y: data.y } : el
    );
    onElementsChange(newElements);
  };

  const handleResize = (id: string, width: number, height: number) => {
    const newElements = elements.map((el) =>
      el.id === id ? { ...el, width, height } : el
    );
    onElementsChange(newElements);
  };

  const handleDelete = (id: string) => {
    onElementsChange(elements.filter((el) => el.id !== id));
  };

  const handleContentEdit = (id: string, content: string) => {
    const newElements = elements.map((el) =>
      el.id === id ? { ...el, content } : el
    );
    onElementsChange(newElements);
  };

  return (
    <div className="space-y-4">
      <h3 className="font-semibold text-lg">{editorTitle}</h3>
      <div
        className="relative w-full h-[600px] border-4 border-primary rounded-lg bg-white overflow-hidden shadow-lg"
        style={{
          backgroundImage: backgroundImage ? `url(${backgroundImage})` : undefined,
          backgroundSize: "cover",
          backgroundPosition: "center",
          backgroundRepeat: "no-repeat",
        }}
      >
        {elements.map((element) => (
          <Draggable
            key={element.id}
            position={{ x: element.x, y: element.y }}
            onStop={(e, data) => handleDrag(element.id, data)}
          >
            <div className="absolute cursor-move">
              <ResizableBox
                width={element.width}
                height={element.height}
                onResizeStop={(e, data) =>
                  handleResize(element.id, data.size.width, data.size.height)
                }
                minConstraints={[50, 30]}
                maxConstraints={[800, 500]}
              >
                <div
                  className={`w-full h-full border-2 ${
                    selectedId === element.id
                      ? "border-destructive shadow-lg"
                      : "border-dashed border-primary/50"
                  } p-2 bg-white/80 backdrop-blur-sm rounded transition-all`}
                  onClick={() => setSelectedId(element.id)}
                >
                  {element.type === "image" ? (
                    <img
                      src={element.content}
                      alt=""
                      className="w-full h-full object-contain"
                    />
                  ) : (
                    <div
                      contentEditable
                      suppressContentEditableWarning
                      style={{
                        fontSize: element.fontSize,
                        fontFamily: element.fontFamily,
                        color: element.color,
                        textAlign: element.textAlign as any,
                      }}
                      className="w-full h-full outline-none overflow-auto"
                      onBlur={(e) =>
                        handleContentEdit(element.id, e.currentTarget.textContent || "")
                      }
                    >
                      {element.content}
                    </div>
                  )}
                  <Button
                    size="sm"
                    variant="destructive"
                    className="absolute -top-2 -right-2 h-6 w-6 p-0 rounded-full shadow-md"
                    onClick={(e) => {
                      e.stopPropagation();
                      handleDelete(element.id);
                    }}
                  >
                    <Trash2 className="h-3 w-3" />
                  </Button>
                </div>
              </ResizableBox>
            </div>
          </Draggable>
        ))}
      </div>
    </div>
  );
};
