// src/components/pdf/PDFAnnotator.tsx

import React, { useState, useRef, useCallback, useEffect } from "react";
import { Card } from "../ui/card";
import { Button } from "../ui/button";
import { toast } from "../ui/toast";
import {
  ChevronLeft,
  ChevronRight,
  Minus,
  Plus,
  ArrowLeftRight,
} from "lucide-react";
import PDFViewer from "./PDFViewer";
import ThumbnailSidebar from "../layout/ThumbnailSidebar";
import AnnotationTools from "../annotator/AnnotationTools";
import Canvas from "../annotator/Canvas";
import { AnnotatorProvider } from "../../context/AnnotatorContext";

interface PDFAnnotatorProps {
  file: File | string;
}

const PDFAnnotator: React.FC<PDFAnnotatorProps> = ({ file }) => {
  const [scale, setScale] = useState(1);
  const [currentPage, setCurrentPage] = useState(1);
  const [numPages, setNumPages] = useState(1);
  const [showControls, setShowControls] = useState(true);
  const containerRef = useRef<HTMLDivElement>(null);
  const lastScrollPosition = useRef(0);
  const controlsTimeoutRef = useRef<NodeJS.Timeout>();
  const pdfViewerRef = useRef<any>(null);
  const handleScroll = useCallback(() => {
    if (!containerRef.current) return;

    const currentScrollPosition = containerRef.current.scrollTop;
    const isScrollingDown = currentScrollPosition > lastScrollPosition.current;

    lastScrollPosition.current = currentScrollPosition;

    // Clear existing timeout
    if (controlsTimeoutRef.current) {
      clearTimeout(controlsTimeoutRef.current);
    }

    // Show controls on scroll
    setShowControls(true);

    // Hide controls after 2 seconds of no scrolling
    controlsTimeoutRef.current = setTimeout(() => {
      setShowControls(true); // Always show controls
    }, 2000);
  }, []);

  useEffect(() => {
    const container = containerRef.current;
    if (container) {
      container.addEventListener("scroll", handleScroll);
    }
    return () => {
      if (container) {
        container.removeEventListener("scroll", handleScroll);
      }
      if (controlsTimeoutRef.current) {
        clearTimeout(controlsTimeoutRef.current);
      }
    };
  }, [handleScroll]);

  const fitToWidth = useCallback(() => {
    if (!containerRef.current) return;
    const containerWidth = containerRef.current.clientWidth;
    const currentWidth =
      containerRef.current.querySelector("canvas")?.width || 0;
    if (currentWidth) {
      const newScale = (containerWidth / currentWidth) * scale;
      setScale(newScale);
    }
  }, [scale]);

  const handleRotatePage = async (pageNum: number) => {
    try {
      await pdfViewerRef.current?.rotatePage(pageNum);
      toast({
        title: "Page Rotated",
        description: `Page ${pageNum} has been rotated`,
      });
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to rotate page",
        variant: "destructive",
      });
    }
  };

  const handleDeletePage = async (pageNum: number) => {
    try {
      await pdfViewerRef.current?.deletePage(pageNum);
      toast({
        title: "Page Deleted",
        description: `Page ${pageNum} has been deleted`,
      });
      // Update current page if necessary
      if (currentPage > numPages - 1) {
        setCurrentPage(numPages - 1);
      }
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to delete page",
        variant: "destructive",
      });
    }
  };

  const handleDuplicatePage = async (pageNum: number) => {
    try {
      await pdfViewerRef.current?.duplicatePage(pageNum);
      toast({
        title: "Page Duplicated",
        description: `Page ${pageNum} has been duplicated`,
      });
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to duplicate page",
        variant: "destructive",
      });
    }
  };
  const handlePageDeleted = (pageNumber: number) => {
    // Update current page if needed
    if (currentPage > pageNumber) {
      setCurrentPage(currentPage - 1);
    } else if (currentPage === pageNumber) {
      setCurrentPage(Math.max(1, pageNumber - 1));
    }
  };
  return (
    <AnnotatorProvider>
      <Card className="relative w-full h-full">
        <AnnotationTools />
        <div className="flex h-[600px]">
          <ThumbnailSidebar
            file={file}
            currentPage={currentPage}
            onPageSelect={setCurrentPage}
            numPages={numPages}
            onRotatePage={handleRotatePage}
            onDeletePage={handleDeletePage}
            onDuplicatePage={handleDuplicatePage}
          />
          <div ref={containerRef} className="relative flex-1 overflow-auto">
            <PDFViewer
              ref={pdfViewerRef}
              file={file}
              scale={scale}
              currentPage={currentPage}
              onNumPagesChange={setNumPages}
              onPageDeleted={handlePageDeleted}
            />
            <Canvas />

            {/* Fixed navigation controls */}
            <div
              className={`fixed bottom-6 left-1/2 -translate-x-1/2 bg-navy-800 rounded-full py-2 px-4 flex items-center justify-center gap-4 shadow-lg transition-opacity duration-300 ${
                showControls ? "opacity-100" : "opacity-0"
              }`}
            >
              <div className="flex items-center gap-1">
                <Button
                  variant="ghost"
                  size="icon"
                  onClick={() => setCurrentPage(currentPage - 1)}
                  disabled={currentPage === 1}
                  className="text-white hover:bg-navy-700 h-8 w-8"
                >
                  <ChevronLeft className="h-4 w-4" />
                </Button>

                <div className="bg-navy-700 px-3 py-1 rounded-md mx-1">
                  <span className="text-sm text-white">{currentPage}</span>
                  <span className="text-sm text-gray-400">/{numPages}</span>
                </div>

                <Button
                  variant="ghost"
                  size="icon"
                  onClick={() => setCurrentPage(currentPage + 1)}
                  disabled={currentPage === numPages}
                  className="text-white hover:bg-navy-700 h-8 w-8"
                >
                  <ChevronRight className="h-4 w-4" />
                </Button>
              </div>

              <div className="flex items-center gap-1 ml-2">
                <Button
                  variant="ghost"
                  size="icon"
                  onClick={() => setScale(scale - 0.1)}
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
    </AnnotatorProvider>
  );
};

export default PDFAnnotator;
