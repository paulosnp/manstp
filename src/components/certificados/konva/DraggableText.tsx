import { useRef, useEffect, useState } from "react";
import { Text, Transformer } from "react-konva";

interface DraggableTextProps {
  element: {
    id: string;
    text: string;
    x: number;
    y: number;
    fontSize: number;
    fontFamily?: string;
    fill?: string;
    fontWeight?: string;
    textAlign?: string;
    fontStyle?: string;
    width?: number;
  };
  isSelected: boolean;
  onSelect: () => void;
  onChange: (updated: any) => void;
}

export const DraggableText = ({
  element,
  isSelected,
  onSelect,
  onChange,
}: DraggableTextProps) => {
  const textRef = useRef<any>();
  const trRef = useRef<any>();
  const [isEditing, setIsEditing] = useState(false);

  useEffect(() => {
    if (isSelected && trRef.current && textRef.current) {
      trRef.current.nodes([textRef.current]);
      trRef.current.getLayer()?.batchDraw();
    }
  }, [isSelected]);

  const handleDblClick = () => {
    setIsEditing(true);
    
    const textNode = textRef.current;
    const stage = textNode.getStage();
    const stageBox = stage.container().getBoundingClientRect();
    const areaPosition = {
      x: stageBox.left + textNode.absolutePosition().x,
      y: stageBox.top + textNode.absolutePosition().y,
    };

    const textarea = document.createElement("textarea");
    document.body.appendChild(textarea);

    textarea.value = element.text;
    textarea.style.position = "absolute";
    textarea.style.top = areaPosition.y + "px";
    textarea.style.left = areaPosition.x + "px";
    textarea.style.width = (element.width || textNode.width()) + "px";
    textarea.style.fontSize = element.fontSize + "px";
    textarea.style.fontFamily = element.fontFamily || "Arial";
    textarea.style.color = element.fill || "#000000";
    textarea.style.fontWeight = element.fontWeight || "normal";
    textarea.style.fontStyle = element.fontStyle || "normal";
    textarea.style.textAlign = element.textAlign || "left";
    textarea.style.border = "2px solid #4CAF50";
    textarea.style.padding = "4px";
    textarea.style.margin = "0px";
    textarea.style.overflow = "hidden";
    textarea.style.background = "white";
    textarea.style.outline = "none";
    textarea.style.resize = "none";
    textarea.style.lineHeight = "1.2";
    textarea.style.transformOrigin = "left top";
    textarea.style.zIndex = "1000";

    textarea.focus();
    textarea.select();

    const removeTextarea = () => {
      textarea.parentNode?.removeChild(textarea);
      setIsEditing(false);
    };

    textarea.addEventListener("keydown", (e) => {
      if (e.key === "Escape") {
        removeTextarea();
      }
      if (e.key === "Enter" && e.ctrlKey) {
        onChange({ ...element, text: textarea.value });
        removeTextarea();
      }
    });

    textarea.addEventListener("blur", () => {
      onChange({ ...element, text: textarea.value });
      removeTextarea();
    });
  };

  return (
    <>
      <Text
        x={element.x}
        y={element.y}
        text={element.text}
        fontSize={element.fontSize}
        fontFamily={element.fontFamily || "Arial"}
        fill={element.fill || "#000000"}
        fontStyle={`${element.fontWeight === "bold" ? "bold " : ""}${element.fontStyle === "italic" ? "italic" : ""}`.trim() || "normal"}
        align={element.textAlign || "left"}
        width={element.width}
        draggable
        onClick={onSelect}
        onTap={onSelect}
        ref={textRef}
        onDragEnd={(e) =>
          onChange({ ...element, x: e.target.x(), y: e.target.y() })
        }
        onDblClick={handleDblClick}
        onTransformEnd={(e) => {
          const node = textRef.current;
          const scaleX = node.scaleX();
          const scaleY = node.scaleY();
          
          onChange({
            ...element,
            x: node.x(),
            y: node.y(),
            width: Math.max(node.width() * scaleX, 30),
            fontSize: Math.max(node.fontSize() * scaleY, 8),
          });
          node.scaleX(1);
          node.scaleY(1);
        }}
      />
      {isSelected && (
        <Transformer
          ref={trRef}
          enabledAnchors={["middle-left", "middle-right", "top-center", "bottom-center"]}
          boundBoxFunc={(oldBox, newBox) => {
            newBox.width = Math.max(30, newBox.width);
            return newBox;
          }}
        />
      )}
    </>
  );
};
