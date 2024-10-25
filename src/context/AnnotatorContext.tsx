// AnnotatorContext.tsx
import React, { createContext, useState, useRef } from "react";

type Tool = "cursor" | "pencil" | "highlighter" | "eraser" | "text" | "image";

interface Point {
  x: number;
  y: number;
}

interface BaseAnnotation {
  id: string;
  page: number;
  type: string;
}

interface DrawAnnotation extends BaseAnnotation {
  type: "pencil" | "highlighter" | "eraser";
  path: Point[];
  color: string;
  lineWidth: number;
}

interface TextAnnotation extends BaseAnnotation {
  type: "text";
  content: string;
  position: Point;
  fontSize: number;
  color: string;
  fontFamily: string;
  textAlign: "left" | "center" | "right";
  textStyle: string[];
}

interface ImageAnnotation extends BaseAnnotation {
  type: "image";
  url: string;
  position: Point;
  size: { width: number; height: number };
}

type Annotation = DrawAnnotation | TextAnnotation | ImageAnnotation;

interface PageAnnotations {
  [pageNumber: number]: Annotation[];
}

interface AnnotatorContextType {
  selectedTool: Tool;
  setSelectedTool: (tool: Tool) => void;
  color: string;
  setColor: (color: string) => void;
  lineWidth: number;
  setLineWidth: (width: number) => void;
  fontSize: number;
  setFontSize: (size: number) => void;
  fontFamily: string;
  setFontFamily: (font: string) => void;
  canUndo: boolean;
  requestUndo: () => void;
  clearLastAction: boolean;
  addAnnotation: (
    annotation: Omit<Annotation, "id" | "page">,
    page: number
  ) => void;
  getAnnotationsForPage: (page: number) => Annotation[];
  currentPage: number;
  setCurrentPage: (page: number) => void;
  selectedAnnotation: string | null;
  setSelectedAnnotation: (id: string | null) => void;
  updateAnnotation: (id: string, updates: Partial<Annotation>) => void;
  deleteAnnotation: (id: string) => void;
  textAlign: "left" | "center" | "right";
  setTextAlign: (align: "left" | "center" | "right") => void;
  textStyle: string[];
  setTextStyle: (style: string) => void;
}

const AnnotatorContext = createContext<AnnotatorContextType | undefined>(
  undefined
);

export const AnnotatorProvider: React.FC<{ children: React.ReactNode }> = ({
  children,
}) => {
  const [selectedTool, setSelectedTool] = useState<Tool>("cursor");
  const [color, setColor] = useState<string>("#000000");
  const [lineWidth, setLineWidth] = useState<number>(1);
  const [fontSize, setFontSize] = useState<number>(16);
  const [fontFamily, setFontFamily] = useState<string>("Arial");
  const [canUndo, setCanUndo] = useState(false);
  const [clearLastAction, setClearLastAction] = useState(false);
  const [currentPage, setCurrentPage] = useState(1);
  const [selectedAnnotation, setSelectedAnnotation] = useState<string | null>(
    null
  );
  const annotations = useRef<PageAnnotations>({});
  const undoHistory = useRef<{ page: number; annotationId: string }[]>([]);
  const [textAlign, setTextAlign] = useState<"left" | "center" | "right">(
    "left"
  );
  const [textStyle, setTextStyleState] = useState<string[]>([]);

  const setTextStyle = (style: string) => {
    setTextStyleState((prev) => {
      if (prev.includes(style)) {
        return prev.filter((s) => s !== style);
      }
      return [...prev, style];
    });
  };

  const addAnnotation = (
    annotation: Omit<Annotation, "id" | "page">,
    page: number
  ) => {
    const id = `${Date.now()}-${Math.random()}`;
    let newAnnotation: Annotation;

    switch (annotation.type) {
      case "pencil":
      case "highlighter":
      case "eraser":
        newAnnotation = {
          ...annotation,
          id,
          page,
          path: (annotation as DrawAnnotation).path,
          color: (annotation as DrawAnnotation).color,
          lineWidth: (annotation as DrawAnnotation).lineWidth,
        } as DrawAnnotation;
        break;
      case "text":
        newAnnotation = {
          ...annotation,
          id,
          page,
          textAlign,
          textStyle: [...textStyle],
          content: (annotation as TextAnnotation).content,
          position: (annotation as TextAnnotation).position,
          fontSize: (annotation as TextAnnotation).fontSize,
          color: (annotation as TextAnnotation).color,
          fontFamily: (annotation as TextAnnotation).fontFamily,
        } as TextAnnotation;
        break;
      case "image":
        newAnnotation = {
          ...annotation,
          id,
          page,
          url: (annotation as ImageAnnotation).url,
          position: (annotation as ImageAnnotation).position,
          size: (annotation as ImageAnnotation).size,
        } as ImageAnnotation;
        break;
      default:
        throw new Error(`Invalid annotation type: ${annotation.type}`);
    }

    annotations.current[page] = annotations.current[page] || [];
    annotations.current[page].push(newAnnotation);
    undoHistory.current.push({ page, annotationId: id });
    setCanUndo(true);
  };

  const updateAnnotation = (id: string, updates: Partial<Annotation>) => {
    Object.values(annotations.current).forEach((pageAnnotations) => {
      const index = pageAnnotations.findIndex(
        (ann: Annotation) => ann.id === id
      );
      if (index !== -1) {
        pageAnnotations[index] = { ...pageAnnotations[index], ...updates };
      }
    });
    setClearLastAction(true);
    setTimeout(() => setClearLastAction(false), 100);
  };

  const deleteAnnotation = (id: string) => {
    Object.values(annotations.current).forEach((pageAnnotations) => {
      const index = pageAnnotations.findIndex(
        (ann: Annotation) => ann.id === id
      );
      if (index !== -1) {
        pageAnnotations.splice(index, 1);
      }
    });
    setSelectedAnnotation(null);
    setClearLastAction(true);
    setTimeout(() => setClearLastAction(false), 100);
  };

  const getAnnotationsForPage = (page: number): Annotation[] => {
    return annotations.current[page] || [];
  };

  const requestUndo = () => {
    if (undoHistory.current.length > 0) {
      const lastAction = undoHistory.current.pop();
      if (lastAction) {
        const { page, annotationId } = lastAction;
        annotations.current[page] = annotations.current[page].filter(
          (ann: Annotation) => ann.id !== annotationId
        );
        setClearLastAction(true);
        setTimeout(() => setClearLastAction(false), 100);
        setCanUndo(undoHistory.current.length > 0);
      }
    }
  };

  return (
    <AnnotatorContext.Provider
      value={{
        selectedTool,
        setSelectedTool,
        color,
        setColor,
        lineWidth,
        setLineWidth,
        fontSize,
        setFontSize,
        fontFamily,
        setFontFamily,
        canUndo,
        requestUndo,
        clearLastAction,
        addAnnotation,
        getAnnotationsForPage,
        currentPage,
        setCurrentPage,
        selectedAnnotation,
        setSelectedAnnotation,
        updateAnnotation,
        deleteAnnotation,
        textAlign,
        setTextAlign,
        textStyle,
        setTextStyle,
      }}
    >
      {children}
    </AnnotatorContext.Provider>
  );
};

export { AnnotatorContext };
