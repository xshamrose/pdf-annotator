import React, { useRef, useEffect, useState } from 'react';
import { useAnnotator } from '../../hooks/useAnnotator';

interface Point {
  x: number;
  y: number;
}

type AnnotationType = 'pencil' | 'highlighter' | 'eraser' | 'text' | 'image';

interface BaseAnnotation {
  type: AnnotationType;
  color?: string;
}

interface DrawAnnotation extends BaseAnnotation {
  type: 'pencil' | 'highlighter' | 'eraser';
  path: Point[];
  color: string;
  lineWidth: number;
}

interface TextAnnotation extends BaseAnnotation {
  type: 'text';
  content: string;
  position: Point;
  fontSize: number;
  color: string;
  fontFamily: string;
}

interface ImageAnnotation extends BaseAnnotation {
  type: 'image';
  url: string;
  position: Point;
  size: {
    width: number;
    height: number;
  };
}

type Annotation = DrawAnnotation | TextAnnotation | ImageAnnotation;

interface TextInputPosition {
  x: number;
  y: number;
  active: boolean;
}
const Canvas: React.FC = () => {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [textInput, setTextInput] = useState<TextInputPosition | null>(null);
  const [textValue, setTextValue] = useState('');
  const {
    selectedTool,
    color,
    lineWidth,
    fontSize,
    fontFamily,
    addAnnotation,
    currentPage,
    getAnnotationsForPage,
    requestUndo,
    clearLastAction
  } = useAnnotator();
  const [isDrawing, setIsDrawing] = useState(false);
  const currentPath = useRef<Point[]>([]);
  const [ctx, setCtx] = useState<CanvasRenderingContext2D | null>(null);
  const offscreenCanvasRef = useRef<HTMLCanvasElement | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const parent = canvas.parentElement;
    if (!parent) return;

    canvas.width = parent.clientWidth;
    canvas.height = parent.clientHeight;

    const context = canvas.getContext('2d');
    if (!context) return;

    offscreenCanvasRef.current = document.createElement('canvas');
    offscreenCanvasRef.current.width = canvas.width;
    offscreenCanvasRef.current.height = canvas.height;

    setCtx(context);
    initializeContext(context);
  }, []);

  useEffect(() => {
    if (!ctx || !canvasRef.current) return;
    
    ctx.clearRect(0, 0, canvasRef.current.width, canvasRef.current.height);
    const pageAnnotations = getAnnotationsForPage(currentPage);
    redrawAnnotations(pageAnnotations);
  }, [currentPage, ctx, getAnnotationsForPage]);

  useEffect(() => {
    if (clearLastAction && ctx && canvasRef.current) {
      ctx.clearRect(0, 0, canvasRef.current.width, canvasRef.current.height);
      const pageAnnotations = getAnnotationsForPage(currentPage);
      redrawAnnotations(pageAnnotations);
    }
  }, [clearLastAction, currentPage, ctx]);

  // Handle text input visibility based on selected tool
  useEffect(() => {
    if (selectedTool !== 'text') {
      setTextInput(null);
      setTextValue('');
    }
  }, [selectedTool]);

  const redrawAnnotations = (annotations: any[]) => {
    if (!ctx) return;
    
    annotations.forEach(annotation => {
      if (annotation.type === 'text') {
        // Draw text annotation
        ctx.font = `${annotation.fontSize}px ${annotation.fontFamily}`;
        ctx.fillStyle = annotation.color;
        ctx.fillText(annotation.content, annotation.position.x, annotation.position.y);
      } else if (annotation.type === 'image') {
        // Draw image annotation
        const img = new Image();
        img.src = annotation.url;
        img.onload = () => {
          ctx.drawImage(img, annotation.position.x, annotation.position.y, annotation.size.width, annotation.size.height);
        };
      } else {
        // Draw other annotations (pencil, highlighter, eraser)
        updateContextStyle(ctx, annotation.type, annotation.color, annotation.lineWidth);
        
        annotation.path.forEach((point: Point, index: number) => {
          if (index === 0) {
            drawPoint(point);
          } else {
            drawLine(annotation.path[index - 1], point);
          }
        });
      }
    });
  };

  const initializeContext = (context: CanvasRenderingContext2D) => {
    context.lineCap = 'round';
    context.lineJoin = 'round';
    updateContextStyle(context, selectedTool, color, lineWidth);
  };

  const updateContextStyle = (
    context: CanvasRenderingContext2D,
    tool: string,
    color: string,
    width: number
  ) => {
    switch (tool) {
      case 'highlighter':
        context.globalAlpha = 0.3;
        context.strokeStyle = color;
        context.lineWidth = width * 3;
        break;
      case 'pencil':
        context.globalAlpha = 1;
        context.strokeStyle = color;
        context.lineWidth = width;
        break;
      case 'eraser':
        context.globalAlpha = 1;
        context.strokeStyle = '#ffffff';
        context.lineWidth = width * 2;
        break;
      default:
        context.globalAlpha = 1;
        context.strokeStyle = color;
        context.lineWidth = width;
    }
  };

  const handleCanvasClick = (e: React.MouseEvent<HTMLCanvasElement>) => {
    if (selectedTool === 'text') {
      const rect = canvasRef.current?.getBoundingClientRect();
      if (!rect) return;

      const x = e.clientX - rect.left;
      const y = e.clientY - rect.top;

      setTextInput({ x, y, active: true });
    } else if (selectedTool === 'image') {
      fileInputRef.current?.click();
    }
  };

  const handleTextSubmit = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter' && textInput && textValue.trim()) {
      const textAnnotation: TextAnnotation = {
        type: 'text',
        content: textValue,
        position: { x: textInput.x, y: textInput.y },
        fontSize,
        color,
        fontFamily
      };
      addAnnotation(textAnnotation, currentPage);
      setTextInput(null);
      setTextValue('');
    }
  };

  const handleImageUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (event) => {
      const img = new Image();
      img.src = event.target?.result as string;
      img.onload = () => {
        const maxWidth = 300;
        const maxHeight = 300;
        let width = img.width;
        let height = img.height;

        if (width > maxWidth) {
          height = (height * maxWidth) / width;
          width = maxWidth;
        }
        if (height > maxHeight) {
          width = (width * maxHeight) / height;
          height = maxHeight;
        }

        const imageAnnotation: ImageAnnotation = {
          type: 'image',
          url: event.target?.result as string,
          position: { x: 100, y: 100 },
          size: { width, height }
        };
        addAnnotation(imageAnnotation, currentPage);
      };
    };
    reader.readAsDataURL(file);
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  const startDrawing = (e: React.MouseEvent<HTMLCanvasElement>) => {
    if (selectedTool === 'cursor' || selectedTool === 'text' || selectedTool === 'image' || !ctx) return;
    
    setIsDrawing(true);
    updateContextStyle(ctx, selectedTool, color, lineWidth);
    
    const rect = canvasRef.current?.getBoundingClientRect();
    if (!rect) return;
    
    const point = {
      x: e.clientX - rect.left,
      y: e.clientY - rect.top
    };
    
    currentPath.current = [point];
    
    if (selectedTool === 'eraser') {
      ctx.globalCompositeOperation = 'destination-out';
    } else {
      ctx.globalCompositeOperation = 'source-over';
    }
    
    drawPoint(point);
  };

  const draw = (e: React.MouseEvent<HTMLCanvasElement>) => {
    if (!isDrawing || !ctx || selectedTool === 'text' || selectedTool === 'image') return;
    
    const rect = canvasRef.current?.getBoundingClientRect();
    if (!rect) return;
    
    const point = {
      x: e.clientX - rect.left,
      y: e.clientY - rect.top
    };
    
    currentPath.current.push(point);
    drawLine(currentPath.current[currentPath.current.length - 2], point);
  };

  const stopDrawing = () => {
    if (!isDrawing) return;
    setIsDrawing(false);

    if (currentPath.current.length > 0 && (selectedTool === 'pencil' || selectedTool === 'highlighter' || selectedTool === 'eraser')) {
      const drawAnnotation: DrawAnnotation = {
        path: currentPath.current,
        color,
        lineWidth,
        type: selectedTool
      };
      addAnnotation(drawAnnotation, currentPage);
    }

    currentPath.current = [];
    
    if (ctx) {
      ctx.globalCompositeOperation = 'source-over';
    }
  };

  const handleUndo = () => {
    requestUndo();
  };

  const drawPoint = (point: Point) => {
    if (!ctx) return;

    ctx.beginPath();
    ctx.arc(point.x, point.y, ctx.lineWidth / 2, 0, Math.PI * 2);
    ctx.fillStyle = ctx.strokeStyle;
    ctx.fill();
  };

  const drawLine = (start: Point, end: Point) => {
    if (!ctx) return;

    ctx.beginPath();
    ctx.moveTo(start.x, start.y);
    ctx.lineTo(end.x, end.y);
    ctx.stroke();
  };

  useEffect(() => {
    const handleKeyPress = (e: KeyboardEvent) => {
      if ((e.ctrlKey || e.metaKey) && e.key === 'z') {
        e.preventDefault();
        handleUndo();
      }
    };

    window.addEventListener('keydown', handleKeyPress);
    return () => window.removeEventListener('keydown', handleKeyPress);
  }, []);

  return (
    <>
      <canvas
        ref={canvasRef}
        className="absolute top-0 left-0 pointer-events-auto"
        style={{
          cursor: selectedTool === 'cursor' ? 'default' : 'crosshair',
          pointerEvents: selectedTool === 'cursor' ? 'none' : 'auto',
        }}
        onMouseDown={startDrawing}
        onMouseMove={draw}
        onMouseUp={stopDrawing}
        onMouseLeave={stopDrawing}
        onClick={handleCanvasClick}
      />
      {textInput && (
        <input
          type="text"
          value={textValue}
          onChange={(e) => setTextValue(e.target.value)}
          onKeyDown={handleTextSubmit}
          style={{
            position: 'absolute',
            left: textInput.x,
            top: textInput.y - fontSize,
            font: `${fontSize}px ${fontFamily}`,
            color: color,
            border: 'none',
            outline: 'none',
            background: 'transparent',
            minWidth: '100px'
          }}
          autoFocus
        />
      )}
      <input
        type="file"
        ref={fileInputRef}
        style={{ display: 'none' }}
        accept="image/*"
        onChange={handleImageUpload}
      />
    </>
  );
};

export default Canvas;