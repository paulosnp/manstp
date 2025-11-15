import { useRef, useEffect, useState } from "react";
import { Text, Transformer, Rect } from "react-konva";

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
    opacity?: number;
    lineHeight?: number;
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
  const [cursorPosition, setCursorPosition] = useState(0);
  const [showCursor, setShowCursor] = useState(false);
  const [selectionStart, setSelectionStart] = useState<number | null>(null);
  const [selectionEnd, setSelectionEnd] = useState<number | null>(null);
  const [isMouseDown, setIsMouseDown] = useState(false);
  const [clickCount, setClickCount] = useState(0);
  const clickTimeoutRef = useRef<NodeJS.Timeout>();

  useEffect(() => {
    if (isSelected && trRef.current && textRef.current) {
      trRef.current.nodes([textRef.current]);
      trRef.current.getLayer()?.batchDraw();
    }
  }, [isSelected]);

  // Cursor piscante
  useEffect(() => {
    if (!isSelected) {
      setShowCursor(false);
      return;
    }

    setShowCursor(true);
    const interval = setInterval(() => {
      setShowCursor((prev) => !prev);
    }, 530);

    return () => clearInterval(interval);
  }, [isSelected]);

  useEffect(() => {
    if (!isSelected) return;

    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.target instanceof HTMLInputElement || e.target instanceof HTMLTextAreaElement) {
        return;
      }

      const text = element.text;
      let newCursorPos = cursorPosition;
      const hasSelection = selectionStart !== null && selectionEnd !== null;

      // Ctrl/Cmd + A - Selecionar tudo
      if ((e.ctrlKey || e.metaKey) && e.key === "a") {
        e.preventDefault();
        setSelectionStart(0);
        setSelectionEnd(text.length);
        setCursorPosition(text.length);
        return;
      }

      // Ctrl/Cmd + C - Copiar
      if ((e.ctrlKey || e.metaKey) && e.key === "c" && hasSelection) {
        e.preventDefault();
        const start = Math.min(selectionStart!, selectionEnd!);
        const end = Math.max(selectionStart!, selectionEnd!);
        navigator.clipboard.writeText(text.slice(start, end));
        return;
      }

      // Ctrl/Cmd + X - Cortar
      if ((e.ctrlKey || e.metaKey) && e.key === "x" && hasSelection) {
        e.preventDefault();
        const start = Math.min(selectionStart!, selectionEnd!);
        const end = Math.max(selectionStart!, selectionEnd!);
        navigator.clipboard.writeText(text.slice(start, end));
        const newText = text.slice(0, start) + text.slice(end);
        onChange({ ...element, text: newText });
        setCursorPosition(start);
        setSelectionStart(null);
        setSelectionEnd(null);
        return;
      }

      // Ctrl/Cmd + V - Colar
      if ((e.ctrlKey || e.metaKey) && e.key === "v") {
        e.preventDefault();
        navigator.clipboard.readText().then((clipText) => {
          let newText;
          if (hasSelection) {
            const start = Math.min(selectionStart!, selectionEnd!);
            const end = Math.max(selectionStart!, selectionEnd!);
            newText = text.slice(0, start) + clipText + text.slice(end);
            newCursorPos = start + clipText.length;
          } else {
            newText = text.slice(0, cursorPosition) + clipText + text.slice(cursorPosition);
            newCursorPos = cursorPosition + clipText.length;
          }
          onChange({ ...element, text: newText });
          setCursorPosition(newCursorPos);
          setSelectionStart(null);
          setSelectionEnd(null);
        });
        return;
      }

      // Se há seleção e usuário digita algo (não Ctrl), deletar seleção
      if (hasSelection && e.key.length === 1 && !e.ctrlKey && !e.metaKey && !e.altKey) {
        e.preventDefault();
        const start = Math.min(selectionStart!, selectionEnd!);
        const end = Math.max(selectionStart!, selectionEnd!);
        const newText = text.slice(0, start) + e.key + text.slice(end);
        onChange({ ...element, text: newText });
        newCursorPos = start + 1;
        setSelectionStart(null);
        setSelectionEnd(null);
        setCursorPosition(newCursorPos);
        return;
      }

      if (e.key === "Backspace") {
        e.preventDefault();
        if (hasSelection) {
          const start = Math.min(selectionStart!, selectionEnd!);
          const end = Math.max(selectionStart!, selectionEnd!);
          const newText = text.slice(0, start) + text.slice(end);
          onChange({ ...element, text: newText });
          newCursorPos = start;
          setSelectionStart(null);
          setSelectionEnd(null);
        } else if (cursorPosition > 0) {
          const newText = text.slice(0, cursorPosition - 1) + text.slice(cursorPosition);
          onChange({ ...element, text: newText });
          newCursorPos = cursorPosition - 1;
        }
      } else if (e.key === "Delete") {
        e.preventDefault();
        if (hasSelection) {
          const start = Math.min(selectionStart!, selectionEnd!);
          const end = Math.max(selectionStart!, selectionEnd!);
          const newText = text.slice(0, start) + text.slice(end);
          onChange({ ...element, text: newText });
          newCursorPos = start;
          setSelectionStart(null);
          setSelectionEnd(null);
        } else if (cursorPosition < text.length) {
          const newText = text.slice(0, cursorPosition) + text.slice(cursorPosition + 1);
          onChange({ ...element, text: newText });
        }
      } else if (e.key === "Enter") {
        e.preventDefault();
        if (hasSelection) {
          const start = Math.min(selectionStart!, selectionEnd!);
          const end = Math.max(selectionStart!, selectionEnd!);
          const newText = text.slice(0, start) + "\n" + text.slice(end);
          onChange({ ...element, text: newText });
          newCursorPos = start + 1;
          setSelectionStart(null);
          setSelectionEnd(null);
        } else {
          const newText = text.slice(0, cursorPosition) + "\n" + text.slice(cursorPosition);
          onChange({ ...element, text: newText });
          newCursorPos = cursorPosition + 1;
        }
      } else if (e.key === "ArrowLeft") {
        e.preventDefault();
        if (e.shiftKey) {
          // Shift + Arrow = Seleção
          if (selectionStart === null) {
            setSelectionStart(cursorPosition);
          }
          newCursorPos = Math.max(0, cursorPosition - 1);
          setSelectionEnd(newCursorPos);
        } else if (e.ctrlKey || e.metaKey) {
          // Ctrl + Arrow = Pular palavra
          const beforeCursor = text.slice(0, cursorPosition);
          const words = beforeCursor.match(/\S+\s*$/);
          if (words) {
            newCursorPos = cursorPosition - words[0].length;
          } else {
            newCursorPos = 0;
          }
          setSelectionStart(null);
          setSelectionEnd(null);
        } else {
          newCursorPos = Math.max(0, cursorPosition - 1);
          setSelectionStart(null);
          setSelectionEnd(null);
        }
      } else if (e.key === "ArrowRight") {
        e.preventDefault();
        if (e.shiftKey) {
          if (selectionStart === null) {
            setSelectionStart(cursorPosition);
          }
          newCursorPos = Math.min(text.length, cursorPosition + 1);
          setSelectionEnd(newCursorPos);
        } else if (e.ctrlKey || e.metaKey) {
          const afterCursor = text.slice(cursorPosition);
          const words = afterCursor.match(/^\s*\S+/);
          if (words) {
            newCursorPos = cursorPosition + words[0].length;
          } else {
            newCursorPos = text.length;
          }
          setSelectionStart(null);
          setSelectionEnd(null);
        } else {
          newCursorPos = Math.min(text.length, cursorPosition + 1);
          setSelectionStart(null);
          setSelectionEnd(null);
        }
      } else if (e.key === "ArrowUp") {
        e.preventDefault();
        const lines = text.split("\n");
        const linesBeforeCursor = text.slice(0, cursorPosition).split("\n");
        const currentLine = linesBeforeCursor.length - 1;
        
        if (currentLine > 0) {
          const currentLineText = linesBeforeCursor[linesBeforeCursor.length - 1];
          const columnPos = currentLineText.length;
          const prevLineLength = lines[currentLine - 1].length;
          let charsBeforePrevLine = 0;
          for (let i = 0; i < currentLine - 1; i++) {
            charsBeforePrevLine += lines[i].length + 1;
          }
          newCursorPos = charsBeforePrevLine + Math.min(columnPos, prevLineLength);
        } else {
          newCursorPos = 0;
        }
        
        if (e.shiftKey) {
          if (selectionStart === null) setSelectionStart(cursorPosition);
          setSelectionEnd(newCursorPos);
        } else {
          setSelectionStart(null);
          setSelectionEnd(null);
        }
      } else if (e.key === "ArrowDown") {
        e.preventDefault();
        const lines = text.split("\n");
        const linesBeforeCursor = text.slice(0, cursorPosition).split("\n");
        const currentLine = linesBeforeCursor.length - 1;
        
        if (currentLine < lines.length - 1) {
          const currentLineText = linesBeforeCursor[linesBeforeCursor.length - 1];
          const columnPos = currentLineText.length;
          const nextLineLength = lines[currentLine + 1].length;
          let charsBeforeNextLine = 0;
          for (let i = 0; i <= currentLine; i++) {
            charsBeforeNextLine += lines[i].length + 1;
          }
          newCursorPos = charsBeforeNextLine + Math.min(columnPos, nextLineLength);
        } else {
          newCursorPos = text.length;
        }
        
        if (e.shiftKey) {
          if (selectionStart === null) setSelectionStart(cursorPosition);
          setSelectionEnd(newCursorPos);
        } else {
          setSelectionStart(null);
          setSelectionEnd(null);
        }
      } else if (e.key === "Home") {
        e.preventDefault();
        const lines = text.slice(0, cursorPosition).split("\n");
        const currentLineStart = cursorPosition - lines[lines.length - 1].length;
        newCursorPos = currentLineStart;
        
        if (e.shiftKey) {
          if (selectionStart === null) setSelectionStart(cursorPosition);
          setSelectionEnd(newCursorPos);
        } else {
          setSelectionStart(null);
          setSelectionEnd(null);
        }
      } else if (e.key === "End") {
        e.preventDefault();
        const remainingText = text.slice(cursorPosition);
        const nextNewline = remainingText.indexOf("\n");
        newCursorPos = nextNewline === -1 ? text.length : cursorPosition + nextNewline;
        
        if (e.shiftKey) {
          if (selectionStart === null) setSelectionStart(cursorPosition);
          setSelectionEnd(newCursorPos);
        } else {
          setSelectionStart(null);
          setSelectionEnd(null);
        }
      } else if (e.key.length === 1 && !e.ctrlKey && !e.metaKey && !e.altKey) {
        e.preventDefault();
        const newText = text.slice(0, cursorPosition) + e.key + text.slice(cursorPosition);
        onChange({ ...element, text: newText });
        newCursorPos = cursorPosition + 1;
        setSelectionStart(null);
        setSelectionEnd(null);
      }

      setCursorPosition(newCursorPos);
    };

    window.addEventListener("keydown", handleKeyDown);
    return () => {
      window.removeEventListener("keydown", handleKeyDown);
    };
  }, [isSelected, element, onChange, cursorPosition, selectionStart, selectionEnd]);

  // Atualizar posição do cursor quando o texto muda externamente
  useEffect(() => {
    if (cursorPosition > element.text.length) {
      setCursorPosition(element.text.length);
    }
  }, [element.text, cursorPosition]);

  const getPositionFromClick = (e: any) => {
    if (!textRef.current) return 0;
    
    const stage = e.target.getStage();
    const pointerPosition = stage.getPointerPosition();
    const textNode = textRef.current;
    
    const relativeX = pointerPosition.x - textNode.x();
    const relativeY = pointerPosition.y - textNode.y();
    
    const context = textNode.getContext();
    context.font = `${element.fontWeight === "bold" ? "bold " : ""}${element.fontStyle === "italic" ? "italic " : ""}${element.fontSize}px ${element.fontFamily || "Arial"}`;
    
    const lines = element.text.split("\n");
    const lineHeight = element.fontSize * 1.2;
    const clickedLine = Math.floor(relativeY / lineHeight);
    
    if (clickedLine < 0) return 0;
    if (clickedLine >= lines.length) return element.text.length;
    
    let charsSoFar = 0;
    for (let i = 0; i < clickedLine; i++) {
      charsSoFar += lines[i].length + 1;
    }
    
    const lineText = lines[clickedLine];
    let bestPos = charsSoFar;
    let minDist = Infinity;
    
    for (let i = 0; i <= lineText.length; i++) {
      const substr = lineText.slice(0, i);
      const width = context.measureText(substr).width;
      const dist = Math.abs(width - relativeX);
      
      if (dist < minDist) {
        minDist = dist;
        bestPos = charsSoFar + i;
      }
    }
    
    return bestPos;
  };

  const handleTextClick = (e: any) => {
    onSelect();
    const position = getPositionFromClick(e);
    
    // Detectar double/triple click
    setClickCount((prev) => prev + 1);
    
    if (clickTimeoutRef.current) {
      clearTimeout(clickTimeoutRef.current);
    }
    
    clickTimeoutRef.current = setTimeout(() => {
      if (clickCount === 0) {
        // Single click - posicionar cursor
        setCursorPosition(position);
        setSelectionStart(null);
        setSelectionEnd(null);
      } else if (clickCount === 1) {
        // Double click - selecionar palavra
        const text = element.text;
        let start = position;
        let end = position;
        
        // Encontrar início da palavra
        while (start > 0 && /\S/.test(text[start - 1])) {
          start--;
        }
        
        // Encontrar fim da palavra
        while (end < text.length && /\S/.test(text[end])) {
          end++;
        }
        
        setSelectionStart(start);
        setSelectionEnd(end);
        setCursorPosition(end);
      } else if (clickCount >= 2) {
        // Triple click - selecionar linha
        const text = element.text;
        const lines = text.split("\n");
        const linesBeforeClick = text.slice(0, position).split("\n");
        const currentLine = linesBeforeClick.length - 1;
        
        let start = 0;
        for (let i = 0; i < currentLine; i++) {
          start += lines[i].length + 1;
        }
        
        const end = start + lines[currentLine].length;
        
        setSelectionStart(start);
        setSelectionEnd(end);
        setCursorPosition(end);
      }
      
      setClickCount(0);
    }, 300);
  };

  const handleMouseDown = (e: any) => {
    onSelect();
    const position = getPositionFromClick(e);
    setCursorPosition(position);
    setSelectionStart(position);
    setSelectionEnd(position);
    setIsMouseDown(true);
  };

  const handleMouseMove = (e: any) => {
    if (!isMouseDown) return;
    const position = getPositionFromClick(e);
    setSelectionEnd(position);
    setCursorPosition(position);
  };

  const handleMouseUp = () => {
    setIsMouseDown(false);
    // Se selectionStart === selectionEnd, limpar seleção
    if (selectionStart === selectionEnd) {
      setSelectionStart(null);
      setSelectionEnd(null);
    }
  };

  useEffect(() => {
    if (!isMouseDown) return;
    
    window.addEventListener("mouseup", handleMouseUp);
    return () => {
      window.removeEventListener("mouseup", handleMouseUp);
    };
  }, [isMouseDown, selectionStart, selectionEnd]);

  const getCursorCoordinates = () => {
    if (!textRef.current) return { x: 0, y: 0 };
    
    const textNode = textRef.current;
    const context = textNode.getContext();
    context.font = `${element.fontWeight === "bold" ? "bold " : ""}${element.fontStyle === "italic" ? "italic " : ""}${element.fontSize}px ${element.fontFamily || "Arial"}`;
    
    const textBeforeCursor = element.text.slice(0, cursorPosition);
    const lines = element.text.split("\n");
    const linesBeforeCursor = textBeforeCursor.split("\n");
    
    const lineHeight = element.fontSize * 1.2;
    const currentLine = linesBeforeCursor.length - 1;
    const y = currentLine * lineHeight;
    
    const currentLineText = linesBeforeCursor[linesBeforeCursor.length - 1];
    const x = context.measureText(currentLineText).width;
    
    return { x, y };
  };

  const cursorCoords = getCursorCoordinates();

  // Renderizar seleção de texto
  const renderSelection = () => {
    if (!isSelected || selectionStart === null || selectionEnd === null || selectionStart === selectionEnd) {
      return null;
    }

    const start = Math.min(selectionStart, selectionEnd);
    const end = Math.max(selectionStart, selectionEnd);
    const text = element.text;
    const lines = text.split("\n");
    
    if (!textRef.current) return null;
    
    const textNode = textRef.current;
    const context = textNode.getContext();
    context.font = `${element.fontWeight === "bold" ? "bold " : ""}${element.fontStyle === "italic" ? "italic " : ""}${element.fontSize}px ${element.fontFamily || "Arial"}`;
    
    const lineHeight = element.fontSize * 1.2;
    const selectionRects: JSX.Element[] = [];
    
    let charCount = 0;
    lines.forEach((line, lineIndex) => {
      const lineStart = charCount;
      const lineEnd = charCount + line.length;
      
      if (start < lineEnd && end > lineStart) {
        const selStart = Math.max(start - lineStart, 0);
        const selEnd = Math.min(end - lineStart, line.length);
        
        const beforeSelection = line.slice(0, selStart);
        const selection = line.slice(selStart, selEnd);
        
        const x = context.measureText(beforeSelection).width;
        const width = context.measureText(selection).width;
        const y = lineIndex * lineHeight;
        
        selectionRects.push(
          <Rect
            key={`selection-${lineIndex}`}
            x={element.x + x}
            y={element.y + y}
            width={width}
            height={element.fontSize}
            fill="rgba(0, 123, 255, 0.3)"
            listening={false}
          />
        );
      }
      
      charCount += line.length + 1; // +1 for newline
    });
    
    return selectionRects;
  };

  return (
    <>
      {renderSelection()}
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
        lineHeight={element.lineHeight || 1.2}
        wrap="word"
        opacity={element.opacity !== undefined ? element.opacity : 1}
        draggable
        onClick={handleTextClick}
        onTap={handleTextClick}
        onMouseDown={handleMouseDown}
        onMouseMove={handleMouseMove}
        ref={textRef}
        onDragEnd={(e) =>
          onChange({ ...element, x: e.target.x(), y: e.target.y() })
        }
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
      {isSelected && showCursor && (selectionStart === null || selectionStart === selectionEnd) && (
        <Rect
          x={element.x + cursorCoords.x}
          y={element.y + cursorCoords.y}
          width={2}
          height={element.fontSize}
          fill={element.fill || "#000000"}
          listening={false}
        />
      )}
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
