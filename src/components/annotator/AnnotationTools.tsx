import React from "react";
import {
  Pencil,
  Highlighter,
  Eraser,
  MousePointer,
  Undo,
  Type,
  Image as ImageIcon,
  AlignLeft,
  AlignCenter,
  AlignRight,
  Bold,
  Italic,
  Underline,
} from "lucide-react";
import { Button } from "../ui/button";
import { Card } from "../ui/card";
import { useAnnotator } from "../../hooks/useAnnotator";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "../ui/tooltip";
import { Slider } from "../ui/slider";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "../ui/select";

const tools = [
  { id: "cursor", Icon: MousePointer, label: "Cursor" },
  { id: "pencil", Icon: Pencil, label: "Pencil" },
  { id: "highlighter", Icon: Highlighter, label: "Highlighter" },
  { id: "eraser", Icon: Eraser, label: "Eraser" },
  { id: "text", Icon: Type, label: "Text" },
  { id: "image", Icon: ImageIcon, label: "Image" },
] as const;

const fontFamilies = [
  "Arial",
  "Times New Roman",
  "Courier New",
  "Georgia",
  "Verdana",
];

const AnnotationTools: React.FC = () => {
  const {
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
    textAlign,
    setTextAlign,
    textStyle,
    setTextStyle,
    canUndo,
    requestUndo,
  } = useAnnotator();

  const showTextControls = selectedTool === "text";
  const showDrawingControls = ["pencil", "highlighter", "eraser"].includes(
    selectedTool
  );

  return (
    <Card className="absolute top-4 left-4 z-10 p-2">
      <div className="flex flex-col gap-2">
        {/* Main Tools */}
        <div className="flex items-center gap-2">
          {tools.map(({ id, Icon, label }) => (
            <TooltipProvider key={id}>
              <Tooltip>
                <TooltipTrigger asChild>
                  <Button
                    variant={selectedTool === id ? "default" : "outline"}
                    size="icon"
                    onClick={() => setSelectedTool(id as any)}
                  >
                    <Icon className="h-5 w-5" />
                  </Button>
                </TooltipTrigger>
                <TooltipContent>
                  <p>{label}</p>
                </TooltipContent>
              </Tooltip>
            </TooltipProvider>
          ))}

          <div className="ml-auto">
            <TooltipProvider>
              <Tooltip>
                <TooltipTrigger asChild>
                  <Button
                    variant="outline"
                    size="icon"
                    onClick={requestUndo}
                    disabled={!canUndo}
                  >
                    <Undo className="h-5 w-5" />
                  </Button>
                </TooltipTrigger>
                <TooltipContent>
                  <p>Undo</p>
                </TooltipContent>
              </Tooltip>
            </TooltipProvider>
          </div>
        </div>

        {/* Text Controls */}
        {showTextControls && (
          <div className="flex flex-col gap-2 pt-2 border-t">
            <div className="flex items-center gap-2">
              <Select value={fontFamily} onValueChange={setFontFamily}>
                <SelectTrigger className="w-40">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {fontFamilies.map((font) => (
                    <SelectItem key={font} value={font}>
                      {font}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>

              <input
                type="number"
                value={fontSize}
                onChange={(e) => setFontSize(Number(e.target.value))}
                className="w-16 h-9 px-2 border rounded"
                min="8"
                max="72"
              />

              <input
                type="color"
                value={color}
                onChange={(e) => setColor(e.target.value)}
                className="w-9 h-9 p-1 rounded border cursor-pointer"
              />
            </div>

            <div className="flex items-center gap-2">
              <Button
                variant={textStyle.includes("bold") ? "default" : "outline"}
                size="icon"
                onClick={() => setTextStyle("bold")}
              >
                <Bold className="h-4 w-4" />
              </Button>
              <Button
                variant={textStyle.includes("italic") ? "default" : "outline"}
                size="icon"
                onClick={() => setTextStyle("italic")}
              >
                <Italic className="h-4 w-4" />
              </Button>
              <Button
                variant={
                  textStyle.includes("underline") ? "default" : "outline"
                }
                size="icon"
                onClick={() => setTextStyle("underline")}
              >
                <Underline className="h-4 w-4" />
              </Button>

              <div className="border-l pl-2 ml-2">
                <Button
                  variant={textAlign === "left" ? "default" : "outline"}
                  size="icon"
                  onClick={() => setTextAlign("left")}
                >
                  <AlignLeft className="h-4 w-4" />
                </Button>
                <Button
                  variant={textAlign === "center" ? "default" : "outline"}
                  size="icon"
                  onClick={() => setTextAlign("center")}
                >
                  <AlignCenter className="h-4 w-4" />
                </Button>
                <Button
                  variant={textAlign === "right" ? "default" : "outline"}
                  size="icon"
                  onClick={() => setTextAlign("right")}
                >
                  <AlignRight className="h-4 w-4" />
                </Button>
              </div>
            </div>
          </div>
        )}

        {/* Drawing Controls */}
        {showDrawingControls && (
          <div className="flex items-center gap-2 pt-2 border-t">
            {selectedTool !== "eraser" && (
              <input
                type="color"
                value={color}
                onChange={(e) => setColor(e.target.value)}
                className="w-9 h-9 p-1 rounded border cursor-pointer"
              />
            )}

            <div className="w-32">
              <Slider
                value={[lineWidth]}
                onValueChange={(value) => setLineWidth(value[0])}
                min={1}
                max={
                  selectedTool === "eraser"
                    ? 20
                    : selectedTool === "highlighter"
                    ? 12
                    : 8
                }
                step={1}
              />
            </div>
          </div>
        )}
      </div>
    </Card>
  );
};

export default AnnotationTools;
