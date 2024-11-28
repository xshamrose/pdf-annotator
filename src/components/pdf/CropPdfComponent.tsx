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
  RotateCw,
  Trash2,
  Copy,
  Square,
  LayoutGrid as Organize, // Using LayoutGrid as Organize
  ZoomIn as Zoom, // Using ZoomIn as Zoom
  ArrowLeftRight as ArrowsLeftRight, // Using ArrowLeftRight for ArrowsLeftRight
} from "lucide-react";

// PDF Page interface
interface PDFPage {
  pageNumber: number;
  rotation: number;
  thumbnail?: string;
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

  // Refs
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const thumbnailCanvasRef = useRef<HTMLCanvasElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);

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

  // Render current page
  useEffect(() => {
    const renderPage = async () => {
      if (!pdfDoc || !canvasRef.current) return;

      try {
        const page = await pdfDoc.getPage(currentPage);
        const canvas = canvasRef.current;

        const pageInfo = pages.find((p) => p.pageNumber === currentPage);
        const rotation = pageInfo?.rotation || 0;

        const viewport = page.getViewport({ scale, rotation });
        canvas.width = viewport.width;
        canvas.height = viewport.height;

        const context = canvas.getContext("2d");
        if (!context) return;

        await page.render({
          canvasContext: context,
          viewport,
        }).promise;
      } catch (error) {
        console.error("Error rendering page:", error);
      }
    };

    renderPage();
  }, [pdfDoc, currentPage, scale, pages]);

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

  // Fit to width function
  const fitToWidth = useCallback(() => {
    if (!containerRef.current || !canvasRef.current) return;
    const containerWidth = containerRef.current.clientWidth;
    const currentWidth = canvasRef.current.width;
    if (currentWidth) {
      const newScale = containerWidth / currentWidth;
      setScale(newScale);
    }
  }, []);

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
          <Button variant="ghost" size="icon">
            <Square className="h-5 w-5" />
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
        <div ref={containerRef} className="relative flex-1 overflow-auto">
          <canvas ref={canvasRef} className="mx-auto" />

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
                onClick={fitToWidth}
                className="text-white hover:bg-navy-700 h-8 w-8"
              >
                <ArrowLeftRight className="h-4 w-4" />
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
