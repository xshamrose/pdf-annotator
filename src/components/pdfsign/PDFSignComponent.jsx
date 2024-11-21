import React, { useState, useRef, useEffect, useCallback } from "react";
import { Card } from "../ui/card";
import {
  Upload,
  Pen,
  Calendar,
  Type,
  ChevronLeft,
  ChevronRight,
  Minus,
  Plus,
  ArrowLeftRight,
  Download,
  Undo2,
} from "lucide-react";
import PDFViewer from "../pdf/PDFViewer";

const PDFSignComponent = () => {
  const [file, setFile] = useState(null);
  const [showSignModal, setShowSignModal] = useState(false);
  const [showDateModal, setShowDateModal] = useState(false);
  const [showTextModal, setShowTextModal] = useState(false);
  const [signatures, setSignatures] = useState([]);
  const [dates, setDates] = useState([]);
  const [texts, setTexts] = useState([]);
  const [scale, setScale] = useState(1);
  const [currentPage, setCurrentPage] = useState(1);
  const [numPages, setNumPages] = useState(1);
  const [isDragging, setIsDragging] = useState(false);
  const [selectedDate, setSelectedDate] = useState(new Date());
  const [textInput, setTextInput] = useState("");
  const [textColor, setTextColor] = useState("#000000");
  const [fontSize, setFontSize] = useState(16);
  const [activeSignatureTab, setActiveSignatureTab] = useState("draw");
  const [signatureImage, setSignatureImage] = useState(null);

  const fileInputRef = useRef(null);
  const signatureCanvasRef = useRef(null);
  const containerRef = useRef(null);
  const pdfViewerRef = useRef(null);

  // Handle file selection
  const handleFileChange = (e) => {
    const selectedFile = e.target.files[0];
    if (selectedFile) {
      if (selectedFile.type !== "application/pdf") {
        alert("Please upload a PDF file");
        return;
      }
      if (selectedFile.size > 10 * 1024 * 1024) {
        alert("File size must be less than 10MB");
        return;
      }
      setFile(selectedFile);
    }
  };

  // Handle drag and drop for file upload
  const handleDragOver = (e) => {
    e.preventDefault();
    e.stopPropagation();
  };

  const handleDrop = (e) => {
    e.preventDefault();
    e.stopPropagation();
    const droppedFile = e.dataTransfer.files[0];
    if (droppedFile) {
      if (droppedFile.type !== "application/pdf") {
        alert("Please upload a PDF file");
        return;
      }
      if (droppedFile.size > 10 * 1024 * 1024) {
        alert("File size must be less than 10MB");
        return;
      }
      setFile(droppedFile);
    }
  };

  // Date Modal Component
  const DateModal = ({ onClose }) => {
    return (
      <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
        <Card className="w-[400px] p-6">
          <h3 className="text-lg font-semibold mb-4">Add Date</h3>
          <input
            type="date"
            value={selectedDate.toISOString().split("T")[0]}
            onChange={(e) => setSelectedDate(new Date(e.target.value))}
            className="w-full p-2 border rounded-lg mb-4"
          />
          <div className="flex justify-end gap-3">
            <button
              onClick={onClose}
              className="px-4 py-2 border rounded-lg hover:bg-gray-50"
            >
              Cancel
            </button>
            <button
              onClick={handleDateCreate}
              className="px-4 py-2 bg-blue-500 text-white rounded-lg hover:bg-blue-600"
            >
              Add
            </button>
          </div>
        </Card>
      </div>
    );
  };

  // Text Modal Component
  const TextModal = ({ onClose }) => {
    return (
      <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
        <Card className="w-[400px] p-6">
          <h3 className="text-lg font-semibold mb-4">Add Text</h3>
          <input
            type="text"
            value={textInput}
            onChange={(e) => setTextInput(e.target.value)}
            placeholder="Enter text"
            className="w-full p-2 border rounded-lg mb-4"
          />
          <div className="flex gap-4 mb-4">
            <input
              type="color"
              value={textColor}
              onChange={(e) => setTextColor(e.target.value)}
              className="w-8 h-8"
            />
            <div className="flex items-center gap-2">
              <button
                onClick={() => setFontSize(Math.max(8, fontSize - 2))}
                className="p-1 border rounded"
              >
                <Minus className="w-4 h-4" />
              </button>
              <span>{fontSize}px</span>
              <button
                onClick={() => setFontSize(Math.min(72, fontSize + 2))}
                className="p-1 border rounded"
              >
                <Plus className="w-4 h-4" />
              </button>
            </div>
          </div>
          <div className="flex justify-end gap-3">
            <button
              onClick={onClose}
              className="px-4 py-2 border rounded-lg hover:bg-gray-50"
            >
              Cancel
            </button>
            <button
              onClick={handleTextCreate}
              className="px-4 py-2 bg-blue-500 text-white rounded-lg hover:bg-blue-600"
            >
              Add
            </button>
          </div>
        </Card>
      </div>
    );
  };

  // Handle date creation
  const handleDateCreate = () => {
    setDates([
      ...dates,
      {
        type: "date",
        value: selectedDate.toLocaleDateString(),
        position: { x: 100, y: 100 },
        size: { width: 120, height: 40 },
      },
    ]);
    setShowDateModal(false);
  };

  // Handle text creation
  const handleTextCreate = () => {
    setTexts([
      ...texts,
      {
        type: "text",
        value: textInput,
        position: { x: 100, y: 100 },
        size: { width: 200, height: 40 },
        color: textColor,
        fontSize: fontSize,
      },
    ]);
    setShowTextModal(false);
  };

  // Handle signature creation
  const handleSignatureCreate = (signatureData) => {
    setSignatures([
      ...signatures,
      {
        type: "signature",
        image: signatureData,
        position: { x: 100, y: 100 },
        size: { width: 200, height: 100 },
      },
    ]);
    setShowSignModal(false);
  };

  // // Handle element dragging
  // const handleDragElement = (type, index, newPosition) => {
  //   if (type === "signature") {
  //     const newSignatures = [...signatures];
  //     newSignatures[index].position = newPosition;
  //     setSignatures(newSignatures);
  //   } else if (type === "date") {
  //     const newDates = [...dates];
  //     newDates[index].position = newPosition;
  //     setDates(newDates);
  //   } else if (type === "text") {
  //     const newTexts = [...texts];
  //     newTexts[index].position = newPosition;
  //     setTexts(newTexts);
  //   }
  // };

  // Updated DraggableElement component with resize functionality
  const DraggableElement = ({
    type,
    element,
    index,
    onDragEnd,
    onDelete,
    scale = 1,
  }) => {
    const [isDragging, setIsDragging] = useState(false);
    const [isResizing, setIsResizing] = useState(false);
    const [position, setPosition] = useState(element.position);
    const [size, setSize] = useState(element.size);
    const elementRef = useRef(null);
    const dragStartRef = useRef({ x: 0, y: 0 });

    // Handle mouse down for dragging
    const handleMouseDown = (e) => {
      if (
        e.target.classList.contains("delete-btn") ||
        e.target.classList.contains("resize-handle")
      )
        return;

      setIsDragging(true);
      dragStartRef.current = {
        x: e.clientX,
        y: e.clientY,
        initialX: position.x,
        initialY: position.y,
      };
      e.preventDefault();
    };

    // Handle mouse down for resizing
    const handleResizeStart = (e, direction) => {
      setIsResizing(true);
      dragStartRef.current = {
        x: e.clientX,
        y: e.clientY,
        initialWidth: size.width,
        initialHeight: size.height,
        initialX: position.x,
        initialY: position.y,
        direction,
      };
      e.preventDefault();
    };

    // Handle mouse move
    const handleMouseMove = useCallback(
      (e) => {
        if (!isDragging && !isResizing) return;

        if (isDragging) {
          const deltaX = (e.clientX - dragStartRef.current.x) / scale;
          const deltaY = (e.clientY - dragStartRef.current.y) / scale;

          const newPosition = {
            x: dragStartRef.current.initialX + deltaX,
            y: dragStartRef.current.initialY + deltaY,
          };

          setPosition(newPosition);
        }

        if (isResizing) {
          const deltaX = (e.clientX - dragStartRef.current.x) / scale;
          const deltaY = (e.clientY - dragStartRef.current.y) / scale;
          const { direction } = dragStartRef.current;

          let newWidth = dragStartRef.current.initialWidth;
          let newHeight = dragStartRef.current.initialHeight;
          let newX = dragStartRef.current.initialX;
          let newY = dragStartRef.current.initialY;

          // Handle different resize directions
          if (direction.includes("e")) {
            newWidth = Math.max(50, dragStartRef.current.initialWidth + deltaX);
          }
          if (direction.includes("w")) {
            const width = Math.max(
              50,
              dragStartRef.current.initialWidth - deltaX
            );
            newX =
              dragStartRef.current.initialX +
              (dragStartRef.current.initialWidth - width);
            newWidth = width;
          }
          if (direction.includes("s")) {
            newHeight = Math.max(
              50,
              dragStartRef.current.initialHeight + deltaY
            );
          }
          if (direction.includes("n")) {
            const height = Math.max(
              50,
              dragStartRef.current.initialHeight - deltaY
            );
            newY =
              dragStartRef.current.initialY +
              (dragStartRef.current.initialHeight - height);
            newHeight = height;
          }

          setSize({ width: newWidth, height: newHeight });
          setPosition({ x: newX, y: newY });
        }
      },
      [isDragging, isResizing, scale]
    );

    // Handle mouse up
    const handleMouseUp = useCallback(() => {
      if (isDragging) {
        setIsDragging(false);
        onDragEnd(type, index, position);
      }
      if (isResizing) {
        setIsResizing(false);
        // Update the parent component with new size and position
        onDragEnd(type, index, position, size);
      }
    }, [isDragging, isResizing, onDragEnd, type, index, position, size]);

    // Add and remove event listeners
    useEffect(() => {
      if (isDragging || isResizing) {
        window.addEventListener("mousemove", handleMouseMove);
        window.addEventListener("mouseup", handleMouseUp);
        return () => {
          window.removeEventListener("mousemove", handleMouseMove);
          window.removeEventListener("mouseup", handleMouseUp);
        };
      }
    }, [isDragging, isResizing, handleMouseMove, handleMouseUp]);

    const getContent = () => {
      switch (type) {
        case "signature":
          return (
            <img
              src={element.image}
              alt="Signature"
              className="w-full h-full object-contain pointer-events-none"
              draggable={false}
            />
          );
        case "date":
          return (
            <div className="w-full h-full flex items-center justify-center text-sm pointer-events-none">
              {element.value}
            </div>
          );
        case "text":
          return (
            <div
              className="w-full h-full flex items-center pointer-events-none"
              style={{
                color: element.color,
                fontSize: `${element.fontSize}px`,
              }}
            >
              {element.value}
            </div>
          );
        default:
          return null;
      }
    };

    return (
      <div
        ref={elementRef}
        className={`absolute cursor-move ${
          isDragging || isResizing ? "z-50" : "z-10"
        }`}
        style={{
          left: `${position.x}px`,
          top: `${position.y}px`,
          width: `${size.width}px`,
          height: `${size.height}px`,
          transform: `scale(${scale})`,
          transformOrigin: "top left",
          touchAction: "none",
        }}
        onMouseDown={handleMouseDown}
      >
        <div className="relative w-full h-full group">
          <div className="absolute inset-0 border border-transparent group-hover:border-blue-500 rounded">
            {getContent()}
          </div>
          {/* Resize handles */}
          <div
            className="absolute -top-1 -left-1 w-3 h-3 bg-white border border-blue-500 rounded-full hidden group-hover:block cursor-nw-resize resize-handle"
            onMouseDown={(e) => handleResizeStart(e, "nw")}
          />
          <div
            className="absolute -top-1 -right-1 w-3 h-3 bg-white border border-blue-500 rounded-full hidden group-hover:block cursor-ne-resize resize-handle"
            onMouseDown={(e) => handleResizeStart(e, "ne")}
          />
          <div
            className="absolute -bottom-1 -left-1 w-3 h-3 bg-white border border-blue-500 rounded-full hidden group-hover:block cursor-sw-resize resize-handle"
            onMouseDown={(e) => handleResizeStart(e, "sw")}
          />
          <div
            className="absolute -bottom-1 -right-1 w-3 h-3 bg-white border border-blue-500 rounded-full hidden group-hover:block cursor-se-resize resize-handle"
            onMouseDown={(e) => handleResizeStart(e, "se")}
          />
          <button
            className="delete-btn absolute -top-2 -right-2 w-5 h-5 bg-red-500 text-white rounded-full hidden group-hover:flex items-center justify-center z-50"
            onClick={() => onDelete(type, index)}
          >
            ×
          </button>
        </div>
      </div>
    );
  };

  // Make sure to update the handleDragElement function in the main component:
  const handleDragElement = (type, index, newPosition, newSize) => {
    const updateElements = (elements, setElements) => {
      const newElements = [...elements];
      newElements[index] = {
        ...newElements[index],
        position: newPosition,
        ...(newSize && { size: newSize }),
      };
      setElements(newElements);
    };

    switch (type) {
      case "signature":
        updateElements(signatures, setSignatures);
        break;
      case "date":
        updateElements(dates, setDates);
        break;
      case "text":
        updateElements(texts, setTexts);
        break;
      default:
    }
  };

  const handleDeleteElement = (type, index) => {
    if (type === "signature") {
      const newSignatures = [...signatures];
      newSignatures.splice(index, 1);
      setSignatures(newSignatures);
    } else if (type === "date") {
      const newDates = [...dates];
      newDates.splice(index, 1);
      setDates(newDates);
    } else if (type === "text") {
      const newTexts = [...texts];
      newTexts.splice(index, 1);
      setTexts(newTexts);
    }
  };

  // Signature Modal Component
  const SignatureModal = ({ onClose, onCreate }) => {
    const canvasRef = useRef(null);
    const [isDrawing, setIsDrawing] = useState(false);
    const [context, setContext] = useState(null);
    const [signatureColor, setSignatureColor] = useState("#000000"); // Default black color

    React.useEffect(() => {
      if (canvasRef.current) {
        const canvas = canvasRef.current;
        const ctx = canvas.getContext("2d");
        ctx.strokeStyle = signatureColor; // Use the selected color
        ctx.lineWidth = 2;
        ctx.lineCap = "round";
        ctx.lineJoin = "round";
        setContext(ctx);
      }
    }, [signatureColor]); // Re-run effect when color changes

    const startDrawing = (e) => {
      const rect = canvasRef.current.getBoundingClientRect();
      context.beginPath();
      context.strokeStyle = signatureColor; // Ensure color is set when starting new line
      context.moveTo(e.clientX - rect.left, e.clientY - rect.top);
      setIsDrawing(true);
    };

    const draw = (e) => {
      if (!isDrawing) return;
      const rect = canvasRef.current.getBoundingClientRect();
      context.lineTo(e.clientX - rect.left, e.clientY - rect.top);
      context.stroke();
    };

    const stopDrawing = () => {
      setIsDrawing(false);
      context.closePath();
    };

    const clearCanvas = () => {
      const canvas = canvasRef.current;
      context.clearRect(0, 0, canvas.width, canvas.height);
    };

    const handleCreate = () => {
      const canvas = canvasRef.current;
      const signatureData = canvas.toDataURL();
      onCreate(signatureData);
    };

    const ColorButton = ({ color, isActive }) => (
      <button
        onClick={() => setSignatureColor(color)}
        className={`w-8 h-8 rounded-full border-2 ${
          isActive ? "border-gray-400" : "border-transparent"
        }`}
        style={{ backgroundColor: color }}
      />
    );

    return (
      <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
        <Card className="w-[600px] p-6">
          <div className="flex border-b">
            <button
              className={`px-6 py-3 ${
                activeSignatureTab === "draw"
                  ? "border-b-2 border-blue-500 text-blue-500"
                  : "text-gray-500"
              }`}
              onClick={() => setActiveSignatureTab("draw")}
            >
              Draw
            </button>
            <button
              className={`px-6 py-3 ${
                activeSignatureTab === "type"
                  ? "border-b-2 border-blue-500 text-blue-500"
                  : "text-gray-500"
              }`}
              onClick={() => setActiveSignatureTab("type")}
            >
              Type
            </button>
            <button
              className={`px-6 py-3 ${
                activeSignatureTab === "upload"
                  ? "border-b-2 border-blue-500 text-blue-500"
                  : "text-gray-500"
              }`}
              onClick={() => setActiveSignatureTab("upload")}
            >
              Upload
            </button>
          </div>

          <div className="mt-6">
            {activeSignatureTab === "draw" && (
              <div className="space-y-4">
                {/* Color Selection */}
                <div className="flex gap-3 mb-4">
                  <ColorButton
                    color="#000000"
                    isActive={signatureColor === "#000000"}
                  />
                  <ColorButton
                    color="#0000FF"
                    isActive={signatureColor === "#0000FF"}
                  />
                  <ColorButton
                    color="#FF0000"
                    isActive={signatureColor === "#FF0000"}
                  />
                </div>

                <div className="border rounded-lg p-4 bg-white min-h-[200px] relative">
                  <div className="absolute left-6 top-0 -translate-y-1/2 bg-yellow-400 text-white px-2 py-1 text-sm rounded">
                    Sign
                  </div>
                  <canvas
                    ref={canvasRef}
                    width={500}
                    height={180}
                    className="w-full h-full border border-dashed border-gray-300 rounded"
                    onMouseDown={startDrawing}
                    onMouseMove={draw}
                    onMouseUp={stopDrawing}
                    onMouseLeave={stopDrawing}
                  />
                </div>
                <div className="flex justify-between">
                  <button
                    onClick={clearCanvas}
                    className="flex items-center gap-2 text-gray-600 hover:text-gray-800"
                  >
                    <Undo2 className="w-4 h-4" />
                    Clear
                  </button>
                </div>
              </div>
            )}

            {activeSignatureTab === "type" && (
              <div className="space-y-4">
                <input
                  type="text"
                  placeholder="Type your signature"
                  className="w-full p-3 border rounded-lg"
                />
              </div>
            )}

            {activeSignatureTab === "upload" && (
              <div className="space-y-4">
                <div className="border-2 border-dashed border-gray-300 rounded-lg p-8 text-center">
                  <Upload className="w-8 h-8 mx-auto text-gray-400 mb-2" />
                  <p className="text-gray-600">
                    Click to upload or drag and drop
                  </p>
                  <p className="text-sm text-gray-400">PNG, JPG up to 10MB</p>
                </div>
              </div>
            )}
          </div>

          <div className="flex justify-end gap-3 mt-6">
            <button
              onClick={onClose}
              className="px-4 py-2 border rounded-lg hover:bg-gray-50"
            >
              Cancel
            </button>
            <button
              onClick={handleCreate}
              className="px-4 py-2 bg-blue-500 text-white rounded-lg hover:bg-blue-600"
            >
              Create
            </button>
          </div>
        </Card>
      </div>
    );
  };

  // Document controls
  const handleZoomIn = () => setScale(scale * 1.2);
  const handleZoomOut = () => setScale(scale * 0.8);
  const handleFitToWidth = () => {
    if (!containerRef.current) return;
    const containerWidth = containerRef.current.clientWidth;
    const currentCanvas = containerRef.current.querySelector("canvas");
    if (currentCanvas?.width) {
      setScale((containerWidth / currentCanvas.width) * 0.95);
    }
  };

  return (
    <div className="w-full min-h-screen bg-gray-50">
      {!file ? (
        // Upload Section
        <Card className="mx-auto max-w-2xl mt-8 p-8">
          <div
            className="flex flex-col items-center gap-4 border-2 border-dashed border-gray-300 rounded-lg p-8"
            onDragOver={handleDragOver}
            onDrop={handleDrop}
          >
            <div className="w-16 h-16 bg-blue-50 rounded-full flex items-center justify-center">
              <Upload className="w-8 h-8 text-blue-500" />
            </div>
            <div className="text-center">
              <h3 className="text-xl mb-2 font-semibold">
                Upload Document to Sign
              </h3>
              <p className="text-gray-500">
                Drop your PDF here or click to upload
              </p>
            </div>
            <input
              type="file"
              ref={fileInputRef}
              onChange={handleFileChange}
              accept=".pdf"
              className="hidden"
            />
            <button
              onClick={() => fileInputRef.current?.click()}
              className="bg-blue-500 text-white px-4 py-2 rounded-lg hover:bg-blue-600"
            >
              Select Document
            </button>
            <p className="text-sm text-gray-400">Maximum file size: 10MB</p>
          </div>
        </Card>
      ) : (
        // Document Signing Interface
        <div className="grid grid-cols-[300px_1fr] gap-6 p-4">
          {/* Left Sidebar - Tools */}
          <div className="space-y-4">
            <Card className="p-4">
              <h3 className="font-semibold mb-4">Signing Tools</h3>
              <div className="space-y-2">
                <button
                  onClick={() => setShowSignModal(true)}
                  className="w-full flex items-center gap-2 p-3 hover:bg-gray-50 rounded-lg"
                >
                  <Pen className="w-5 h-5" />
                  <span>Add Signature</span>
                </button>
                <button
                  onClick={() => setShowDateModal(true)}
                  className="w-full flex items-center gap-2 p-3 hover:bg-gray-50 rounded-lg"
                >
                  <Calendar className="w-5 h-5" />
                  <span>Add Date</span>
                </button>
                <button
                  onClick={() => setShowTextModal(true)}
                  className="w-full flex items-center gap-2 p-3 hover:bg-gray-50 rounded-lg"
                >
                  <Type className="w-5 h-5" />
                  <span>Add Text</span>
                </button>
              </div>
            </Card>
            <Card className="p-4">
              <button
                onClick={() => {
                  // Implement save functionality here
                  console.log("Saving document...");
                }}
                className="w-full bg-blue-500 text-white px-4 py-2 rounded-lg hover:bg-blue-600 flex items-center justify-center gap-2"
              >
                <Download className="w-4 h-4" />
                Save Signed Document
              </button>
            </Card>
          </div>

          {/* Main Content - Document Preview */}
          <div className="relative bg-white rounded-lg shadow">
            <div
              ref={containerRef}
              className="relative h-[800px] overflow-auto"
            >
              {/* PDF Viewer */}
              <PDFViewer
                ref={pdfViewerRef}
                file={file}
                scale={scale}
                currentPage={currentPage}
                onNumPagesChange={setNumPages}
              />

              {/* Draggable Elements Overlay */}
              <div className="absolute inset-0">
                {signatures.map((sig, index) => (
                  <DraggableElement
                    key={`sig-${index}`}
                    type="signature"
                    element={sig}
                    index={index}
                    onDragEnd={handleDragElement}
                    onDelete={handleDeleteElement}
                    scale={scale}
                  />
                ))}

                {dates.map((date, index) => (
                  <DraggableElement
                    key={`date-${index}`}
                    type="date"
                    element={date}
                    index={index}
                    onDragEnd={handleDragElement}
                    onDelete={handleDeleteElement}
                    scale={scale}
                  />
                ))}

                {texts.map((text, index) => (
                  <DraggableElement
                    key={`text-${index}`}
                    type="text"
                    element={text}
                    index={index}
                    onDragEnd={handleDragElement}
                    onDelete={handleDeleteElement}
                    scale={scale}
                  />
                ))}
              </div>
            </div>

            {/* Document Controls */}
            <div className="absolute bottom-6 left-1/2 -translate-x-1/2 bg-gray-800 rounded-full py-2 px-4 flex items-center justify-center gap-4 shadow-lg">
              {/* Page Controls */}
              <div className="flex items-center gap-1">
                <button
                  onClick={() => setCurrentPage(Math.max(1, currentPage - 1))}
                  disabled={currentPage === 1}
                  className="text-white hover:bg-gray-700 h-8 w-8 rounded-full flex items-center justify-center disabled:opacity-50"
                >
                  <ChevronLeft className="h-4 w-4" />
                </button>
                <div className="bg-gray-700 px-3 py-1 rounded-md mx-1">
                  <span className="text-sm text-white">{currentPage}</span>
                  <span className="text-sm text-gray-400">/{numPages}</span>
                </div>
                <button
                  onClick={() =>
                    setCurrentPage(Math.min(numPages, currentPage + 1))
                  }
                  disabled={currentPage === numPages}
                  className="text-white hover:bg-gray-700 h-8 w-8 rounded-full flex items-center justify-center disabled:opacity-50"
                >
                  <ChevronRight className="h-4 w-4" />
                </button>
              </div>

              {/* Zoom Controls */}
              <div className="flex items-center gap-1 ml-2">
                <button
                  onClick={handleZoomOut}
                  className="text-white hover:bg-gray-700 h-8 w-8 rounded-full flex items-center justify-center"
                >
                  <Minus className="h-4 w-4" />
                </button>
                <button
                  onClick={handleFitToWidth}
                  className="text-white hover:bg-gray-700 h-8 w-8 rounded-full flex items-center justify-center"
                >
                  <ArrowLeftRight className="h-4 w-4" />
                </button>
                <button
                  onClick={handleZoomIn}
                  className="text-white hover:bg-gray-700 h-8 w-8 rounded-full flex items-center justify-center"
                >
                  <Plus className="h-4 w-4" />
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Modals */}
      {showSignModal && (
        <SignatureModal
          onClose={() => setShowSignModal(false)}
          onCreate={handleSignatureCreate}
        />
      )}
      {showDateModal && <DateModal onClose={() => setShowDateModal(false)} />}
      {showTextModal && <TextModal onClose={() => setShowTextModal(false)} />}
    </div>
  );
};

export default PDFSignComponent;
