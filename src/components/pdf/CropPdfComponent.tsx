import React, { useState, useRef, useCallback, useEffect } from "react";
import * as pdfjsLib from "pdfjs-dist";
import { Card } from "../ui/card";
import { Button } from "../ui/button";
import { toast } from "../ui/toast";
import {
  ChevronLeft,
  ChevronRight,
  Minus,
  Plus,
  ArrowLeftRight,
  ArrowUpDown,
  RotateCw,
  Trash2,
  Copy,
  LayoutGrid as Organize,
  ZoomIn as Zoom,
  ArrowLeftRight as ArrowsLeftRight,
  Crop,
  X,
  Check,
} from "lucide-react";

// PDF Page interface
interface PDFPage {
  pageNumber: number;
  rotation: number;
  thumbnail?: string;
}

interface CropCoordinates {
  startX: number;
  startY: number;
  endX: number;
  endY: number;
}

// Component Props
interface CropPdfComponentProps {
  file: File | string;
}

// PDF Crop Component
const CropPdfComponent: React.FC<CropPdfComponentProps> = ({ file }) => {
  // PDF State
  const [pdfDoc, setPdfDoc] = useState<any>(null);
  const [pages, setPages] = useState<PDFPage[]>([]);
  const [currentPage, setCurrentPage] = useState(1);
  const [scale, setScale] = useState(1);
  const [pdfBytes, setPdfBytes] = useState<Uint8Array | null>(null);

  const [isCropping, setIsCropping] = useState(false);
  const [cropCoordinates, setCropCoordinates] =
    useState<CropCoordinates | null>(null);
  const [isDrawing, setIsDrawing] = useState(false);
  const [showCropActions, setShowCropActions] = useState(false);
  const [fitMode, setFitMode] = useState<"width" | "height">("width");
  const [originalDimensions, setOriginalDimensions] = useState<{
    width: number;
    height: number;
  } | null>(null);

  // Refs
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const thumbnailCanvasRef = useRef<HTMLCanvasElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  const cropOverlayRef = useRef<HTMLDivElement>(null);
  const selectionBoxRef = useRef<HTMLDivElement>(null);
  const canvasPositionRef = useRef<{ left: number; top: number }>({
    left: 0,
    top: 0,
  });
  const canvasWrapperRef = useRef<HTMLDivElement>(null);

  // Load PDF and generate thumbnails
  useEffect(() => {
    const loadPDF = async () => {
      try {
        let url = file instanceof File ? URL.createObjectURL(file) : file;

        const response = await fetch(url);
        const arrayBuffer = await response.arrayBuffer();
        setPdfBytes(new Uint8Array(arrayBuffer));

        const loadingTask = pdfjsLib.getDocument(url);
        const pdf = await loadingTask.promise;
        setPdfDoc(pdf);

        // Generate pages with thumbnails
        const pagesArray: PDFPage[] = await Promise.all(
          Array.from({ length: pdf.numPages }, async (_, i) => {
            const page = await pdf.getPage(i + 1);
            const thumbnailViewport = page.getViewport({ scale: 0.2 });
            const thumbnailCanvas = document.createElement("canvas");
            thumbnailCanvas.width = thumbnailViewport.width;
            thumbnailCanvas.height = thumbnailViewport.height;
            const thumbnailContext = thumbnailCanvas.getContext("2d");

            await page.render({
              canvasContext: thumbnailContext!,
              viewport: thumbnailViewport,
            }).promise;

            return {
              pageNumber: i + 1,
              rotation: 0,
              thumbnail: thumbnailCanvas.toDataURL(),
            };
          })
        );

        setPages(pagesArray);
      } catch (error) {
        console.error("Error loading PDF:", error);
        toast({
          title: "PDF Loading Error",
          description: "Could not load the PDF file",
          variant: "destructive",
        });
      }
    };

    loadPDF();
  }, [file]);

  const startCropping = () => {
    setIsCropping(true);
    setCropCoordinates(null);
    setShowCropActions(false);
  };

  const handleMouseDown = (e: React.MouseEvent) => {
    if (!isCropping || !canvasRef.current) return;

    const canvas = canvasRef.current;
    const rect = canvas.getBoundingClientRect();
    const containerRect = containerRef.current?.getBoundingClientRect();

    if (!containerRect) return;

    const x = e.clientX - rect.left;
    const y = e.clientY - rect.top;

    // Check if click is within canvas bounds
    if (x >= 0 && x <= canvas.width && y >= 0 && y <= canvas.height) {
      setCropCoordinates({
        startX: x,
        startY: y,
        endX: x,
        endY: y,
      });
      setIsDrawing(true);
    }
  };

  const handleMouseMove = (e: React.MouseEvent) => {
    if (!isDrawing || !canvasRef.current || !cropCoordinates) return;

    const canvas = canvasRef.current;
    const rect = canvas.getBoundingClientRect();

    let x = e.clientX - rect.left;
    let y = e.clientY - rect.top;

    // Constrain coordinates to canvas bounds
    x = Math.max(0, Math.min(x, canvas.width));
    y = Math.max(0, Math.min(y, canvas.height));

    setCropCoordinates({
      ...cropCoordinates,
      endX: x,
      endY: y,
    });
  };

  const handleMouseUp = () => {
    if (isDrawing) {
      setIsDrawing(false);
      setShowCropActions(true);
    }
  };

  const cancelCrop = () => {
    setIsCropping(false);
    setCropCoordinates(null);
    setShowCropActions(false);
  };

  const handleCrop = async () => {
    if (!cropCoordinates || !canvasRef.current || !pdfDoc) return;

    try {
      // Create a new canvas for the cropped area
      const cropCanvas = document.createElement("canvas");
      const ctx = cropCanvas.getContext("2d");
      if (!ctx) return;

      // Calculate crop dimensions
      const width = Math.abs(cropCoordinates.endX - cropCoordinates.startX);
      const height = Math.abs(cropCoordinates.endY - cropCoordinates.startY);

      const startX = Math.min(cropCoordinates.startX, cropCoordinates.endX);
      const startY = Math.min(cropCoordinates.startY, cropCoordinates.endY);

      cropCanvas.width = width;
      cropCanvas.height = height;

      // Draw the cropped portion
      ctx.drawImage(
        canvasRef.current,
        startX,
        startY,
        width,
        height,
        0,
        0,
        width,
        height
      );

      // Create a new page with the cropped content
      const newPageData = cropCanvas.toDataURL();
      const newPages = [...pages];

      // Add the cropped page as the last page
      newPages.push({
        pageNumber: newPages.length + 1,
        rotation: 0,
        thumbnail: newPageData,
      });

      // Renumber pages
      const renumberedPages = newPages.map((page, index) => ({
        ...page,
        pageNumber: index + 1,
      }));

      setPages(renumberedPages);
      cancelCrop();

      toast({
        title: "Page Cropped",
        description: "New page created from cropped area",
      });
    } catch (error) {
      console.error("Error cropping page:", error);
      toast({
        title: "Crop Error",
        description: "Failed to crop the page",
        variant: "destructive",
      });
    }
  };

  // Render current page
  useEffect(() => {
    const renderPage = async () => {
      if (
        !pdfDoc ||
        !canvasRef.current ||
        currentPage < 1 ||
        currentPage > pages.length
      )
        return;

      try {
        const page = await pdfDoc.getPage(currentPage);
        const canvas = canvasRef.current;

        const pageInfo = pages.find((p) => p.pageNumber === currentPage);
        const rotation = pageInfo?.rotation || 0;

        const originalViewport = page.getViewport({ scale: 1, rotation });

        if (!originalDimensions) {
          setOriginalDimensions({
            width: originalViewport.width,
            height: originalViewport.height,
          });
        }

        const viewport = page.getViewport({ scale, rotation });
        canvas.width = viewport.width;
        canvas.height = viewport.height;

        // Calculate and store canvas position
        const rect = canvas.getBoundingClientRect();
        const containerRect = containerRef.current?.getBoundingClientRect();
        if (containerRect) {
          canvasPositionRef.current = {
            left: rect.left - containerRect.left,
            top: rect.top - containerRect.top,
          };
        }

        const context = canvas.getContext("2d");
        if (!context) return;

        await page.render({
          canvasContext: context,
          viewport,
        }).promise;

        // Center the canvas wrapper if needed
        if (canvasWrapperRef.current && containerRef.current) {
          const containerWidth = containerRef.current.clientWidth;
          const canvasWidth = viewport.width;
          if (canvasWidth < containerWidth) {
            canvasWrapperRef.current.style.marginLeft = `${
              (containerWidth - canvasWidth) / 2
            }px`;
          } else {
            canvasWrapperRef.current.style.marginLeft = "0";
          }
        }
      } catch (error) {
        console.error("Error rendering page:", error);
      }
    };

    renderPage();
  }, [pdfDoc, currentPage, scale, pages, originalDimensions]);

  // Modify the existing fitToWidth function
  const toggleFit = useCallback(() => {
    if (!containerRef.current || !originalDimensions) return;

    const containerWidth = containerRef.current.clientWidth;
    const containerHeight = containerRef.current.clientHeight;

    if (fitMode === "width") {
      // Switch to height mode
      const heightScale = containerHeight / originalDimensions.height;
      setScale(heightScale);
      setFitMode("height");
    } else {
      // Switch to width mode
      const widthScale = containerWidth / originalDimensions.width;
      setScale(widthScale);
      setFitMode("width");
    }
  }, [fitMode, originalDimensions]);

  // Page Manipulation Methods
  const handleRotatePage = (pageNumber: number) => {
    setPages((prevPages) =>
      prevPages.map((page) =>
        page.pageNumber === pageNumber
          ? { ...page, rotation: (page.rotation + 90) % 360 }
          : page
      )
    );
    toast({
      title: "Page Rotated",
      description: `Page ${pageNumber} has been rotated`,
    });
  };

  const handleDeletePage = (pageNumber: number) => {
    if (pages.length <= 1) {
      toast({
        title: "Cannot Delete",
        description: "You cannot delete the last page",
        variant: "destructive",
      });
      return;
    }

    const newPages = pages
      .filter((page) => page.pageNumber !== pageNumber)
      .map((page, index) => ({ ...page, pageNumber: index + 1 }));

    setPages(newPages);

    // Adjust current page if needed
    if (currentPage > newPages.length) {
      setCurrentPage(newPages.length);
    } else if (currentPage === pageNumber) {
      setCurrentPage(Math.max(1, currentPage - 1));
    }

    toast({
      title: "Page Deleted",
      description: `Page ${pageNumber} has been deleted`,
    });
  };

  const handleDuplicatePage = (pageNumber: number) => {
    const pageToDuplicate = pages.find(
      (page) => page.pageNumber === pageNumber
    );
    if (!pageToDuplicate) return;

    const newPages = [...pages];
    const duplicateIndex = pages.findIndex(
      (page) => page.pageNumber === pageNumber
    );

    newPages.splice(duplicateIndex + 1, 0, {
      ...pageToDuplicate,
      pageNumber: duplicateIndex + 2,
    });

    // Renumber subsequent pages
    const renumberedPages = newPages.map((page, index) => ({
      ...page,
      pageNumber: index + 1,
    }));

    setPages(renumberedPages);

    toast({
      title: "Page Duplicated",
      description: `Page ${pageNumber} has been duplicated`,
    });
  };

  return (
    <Card className="relative w-full h-full">
      {/* Toolbar */}
      <div className="flex justify-between items-center bg-gray-100 px-4 py-2 border-b">
        <div className="flex items-center gap-2">
          <Button variant="ghost" size="icon">
            <Organize className="h-5 w-5" />
          </Button>
          <Button variant="ghost" size="icon">
            <Zoom className="h-5 w-5" />
          </Button>
          <Button
            variant="ghost"
            size="icon"
            onClick={startCropping}
            className={isCropping ? "bg-blue-100" : ""}
          >
            <Crop className="h-5 w-5" />
          </Button>
          <Button variant="ghost" size="icon">
            <ArrowsLeftRight className="h-5 w-5" />
          </Button>
        </div>

        {/* Add any other toolbar buttons or controls here */}
      </div>
      <div className="flex h-[600px]">
        {/* Thumbnail Sidebar */}
        <div className="w-48 border-r overflow-auto p-2 bg-gray-50">
          {pages.map((page) => (
            <div
              key={page.pageNumber}
              className={`mb-2 cursor-pointer p-1 rounded ${
                currentPage === page.pageNumber
                  ? "bg-blue-100"
                  : "hover:bg-gray-200"
              }`}
              onClick={() => setCurrentPage(page.pageNumber)}
            >
              <img
                src={page.thumbnail}
                alt={`Page ${page.pageNumber}`}
                className="w-full mb-2"
              />
              <div className="flex justify-between">
                <Button
                  size="icon"
                  variant="ghost"
                  onClick={(e) => {
                    e.stopPropagation();
                    handleRotatePage(page.pageNumber);
                  }}
                >
                  <RotateCw className="h-4 w-4" />
                </Button>
                <Button
                  size="icon"
                  variant="ghost"
                  onClick={(e) => {
                    e.stopPropagation();
                    handleDuplicatePage(page.pageNumber);
                  }}
                >
                  <Copy className="h-4 w-4" />
                </Button>
                <Button
                  size="icon"
                  variant="ghost"
                  onClick={(e) => {
                    e.stopPropagation();
                    handleDeletePage(page.pageNumber);
                  }}
                >
                  <Trash2 className="h-4 w-4" />
                </Button>
              </div>
            </div>
          ))}
        </div>

        {/* PDF Viewer */}
        <div
          ref={containerRef}
          className="relative flex-1 overflow-auto"
          onMouseDown={handleMouseDown}
          onMouseMove={handleMouseMove}
          onMouseUp={handleMouseUp}
          onMouseLeave={handleMouseUp}
        >
          <div className="min-w-full min-h-full flex items-center justify-center p-6">
            <div className="relative inline-block">
              <canvas ref={canvasRef} />

              {isCropping && canvasRef.current && (
                <div
                  ref={cropOverlayRef}
                  className="absolute inset-0 bg-black bg-opacity-30"
                >
                  {cropCoordinates && (
                    <div
                      ref={selectionBoxRef}
                      className="absolute border-2 border-blue-500 bg-blue-200 bg-opacity-20"
                      style={{
                        left: Math.min(
                          cropCoordinates.startX,
                          cropCoordinates.endX
                        ),
                        top: Math.min(
                          cropCoordinates.startY,
                          cropCoordinates.endY
                        ),
                        width: Math.abs(
                          cropCoordinates.endX - cropCoordinates.startX
                        ),
                        height: Math.abs(
                          cropCoordinates.endY - cropCoordinates.startY
                        ),
                      }}
                    />
                  )}
                </div>
              )}
            </div>
          </div>

          {showCropActions && (
            <div className="fixed bottom-20 left-1/2 -translate-x-1/2 bg-white rounded-lg shadow-lg p-2 flex gap-2">
              <Button
                variant="default"
                size="sm"
                onClick={handleCrop}
                className="bg-green-500 hover:bg-green-600"
              >
                <Check className="h-4 w-4" />
              </Button>
              <Button
                variant="default"
                size="sm"
                onClick={cancelCrop}
                className="bg-red-500 hover:bg-red-600"
              >
                <X className="h-4 w-4" />
              </Button>
            </div>
          )}

          {/* Navigation Controls */}
          <div className="fixed bottom-6 left-1/2 -translate-x-1/2 bg-navy-800 rounded-full py-2 px-4 flex items-center justify-center gap-4 shadow-lg">
            <div className="flex items-center gap-1">
              <Button
                variant="ghost"
                size="icon"
                onClick={() => setCurrentPage(Math.max(1, currentPage - 1))}
                disabled={currentPage === 1}
                className="text-white hover:bg-navy-700 h-8 w-8"
              >
                <ChevronLeft className="h-4 w-4" />
              </Button>

              <div className="bg-navy-700 px-3 py-1 rounded-md mx-1">
                <span className="text-sm text-white">{currentPage}</span>
                <span className="text-sm text-gray-400">/{pages.length}</span>
              </div>

              <Button
                variant="ghost"
                size="icon"
                onClick={() =>
                  setCurrentPage(Math.min(pages.length, currentPage + 1))
                }
                disabled={currentPage === pages.length}
                className="text-white hover:bg-navy-700 h-8 w-8"
              >
                <ChevronRight className="h-4 w-4" />
              </Button>
            </div>

            <div className="flex items-center gap-1 ml-2">
              <Button
                variant="ghost"
                size="icon"
                onClick={() => setScale(Math.max(0.1, scale - 0.1))}
                className="text-white hover:bg-navy-700 h-8 w-8"
              >
                <Minus className="h-4 w-4" />
              </Button>

              <Button
                variant="ghost"
                size="icon"
                onClick={toggleFit}
                className="text-white hover:bg-navy-700 h-8 w-8"
              >
                {fitMode === "width" ? (
                  <ArrowLeftRight className="h-4 w-4" />
                ) : (
                  <ArrowUpDown className="h-4 w-4" />
                )}
              </Button>

              <Button
                variant="ghost"
                size="icon"
                onClick={() => setScale(scale + 0.1)}
                className="text-white hover:bg-navy-700 h-8 w-8"
              >
                <Plus className="h-4 w-4" />
              </Button>
            </div>
          </div>
        </div>
      </div>
    </Card>
  );
};

export default CropPdfComponent;
