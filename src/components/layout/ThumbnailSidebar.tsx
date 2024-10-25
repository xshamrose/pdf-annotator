import React, { useState, useEffect, useRef } from "react";
import {
  ChevronLeft,
  ChevronRight,
  ChevronUp,
  ChevronDown,
  RotateCw,
  Trash2,
  Copy,
} from "lucide-react";
import * as pdfjsLib from "pdfjs-dist";
import { Button } from "../ui/button";
import {
  Tooltip,
  TooltipTrigger,
  TooltipContent,
  TooltipProvider,
} from "../ui/tooltip";
import PDFPageInserter from "../pdf/PDFPageInserter";

interface Page {
  pageNumber: number;
  file: File;
  originalPageNumber: number;
}

interface ThumbnailSidebarProps {
  file: File | string;
  currentPage: number;
  onPageSelect: (page: number) => void;
  numPages: number;
  onRotatePage?: (pageNum: number) => void;
  onDeletePage?: (pageNum: number) => void;
  onDuplicatePage?: (pageNum: number) => void;
  onInsertPages?: (position: number, pages: Page[]) => void;
}

const ThumbnailSidebar: React.FC<ThumbnailSidebarProps> = ({
  file,
  currentPage,
  onPageSelect,
  numPages,
  onRotatePage,
  onDeletePage,
  onDuplicatePage,
  onInsertPages,
}) => {
  const [isOpen, setIsOpen] = useState(true);
  const [thumbnails, setThumbnails] = useState<string[]>([]);
  const [hoveredPage, setHoveredPage] = useState<number | null>(null);
  const scrollContainerRef = useRef<HTMLDivElement>(null);
  const [deletedPage, setDeletedPage] = useState<number | null>(null);

  const regenerateThumbnails = async () => {
    if (!(file instanceof File)) return;

    try {
      const url = URL.createObjectURL(file);
      const loadingTask = pdfjsLib.getDocument(url);
      const pdf = await loadingTask.promise;
      const newThumbnails: string[] = [];

      for (let i = 1; i <= pdf.numPages; i++) {
        const page = await pdf.getPage(i);
        const viewport = page.getViewport({ scale: 0.2 });
        const canvas = document.createElement("canvas");
        const context = canvas.getContext("2d");

        if (!context) continue;

        canvas.width = viewport.width;
        canvas.height = viewport.height;

        await page.render({
          canvasContext: context,
          viewport,
        }).promise;

        newThumbnails.push(canvas.toDataURL());
      }

      setThumbnails(newThumbnails);
    } catch (error) {
      console.error("Error regenerating thumbnails:", error);
    }
  };
  useEffect(() => {
    regenerateThumbnails();
  }, [file]);

  const handleDeletePage = async (pageNum: number) => {
    if (onDeletePage) {
      setDeletedPage(pageNum);
      await onDeletePage(pageNum);

      setThumbnails((prev) => {
        const newThumbnails = [...prev];
        newThumbnails.splice(pageNum - 1, 1);
        return newThumbnails;
      });

      setDeletedPage(null);
    }
  };

  const handleScrollUp = () => {
    if (scrollContainerRef.current) {
      scrollContainerRef.current.scrollBy({
        top: -200,
        behavior: "smooth",
      });
    }
  };

  const handleScrollDown = () => {
    if (scrollContainerRef.current) {
      scrollContainerRef.current.scrollBy({
        top: 200,
        behavior: "smooth",
      });
    }
  };

  const handleInsertPages = async (position: number, pages: Page[]) => {
    if (onInsertPages) {
      onInsertPages(position, pages);

      // Force regeneration of thumbnails
      await regenerateThumbnails();

      // Update the total number of pages
      if (pages.length > 0) {
        setThumbnails((prev) => {
          const newThumbnails = [...prev];
          // Insert empty placeholders for new pages
          newThumbnails.splice(
            position - 1,
            0,
            ...Array(pages.length).fill("")
          );
          return newThumbnails;
        });
      }
    }
  };

  return (
    <div className="relative flex h-full">
      <div
        className={`bg-navy-900 transition-all duration-300 ${
          isOpen ? "w-48" : "w-0"
        } h-full overflow-hidden flex flex-col`}
      >
        {/* Scroll Up Button */}
        <Button
          variant="ghost"
          size="sm"
          className="w-full text-black hover:bg-navy-700"
          onClick={handleScrollUp}
        >
          <ChevronUp className="h-4 w-4" />
        </Button>

        {/* Thumbnails Container */}
        <div
          ref={scrollContainerRef}
          className="flex-1 overflow-y-auto p-2 space-y-2 scrollbar-thin scrollbar-thumb-navy-700 scrollbar-track-navy-900"
        >
          {thumbnails.map((thumbnail, index) => (
            <React.Fragment key={index}>
              <PDFPageInserter
                position={index + 1}
                file={file}
                onInsertPages={(position, pages) => {
                  handleInsertPages(position, pages);
                  regenerateThumbnails(); // Make sure to regenerate thumbnails after insertion
                }}
              />

              <div
                className={`relative cursor-pointer transition-all group ${
                  currentPage === index + 1
                    ? "ring-2 ring-blue-500"
                    : "hover:ring-2 hover:ring-blue-300"
                }`}
                onClick={() => onPageSelect(index + 1)}
                onMouseEnter={() => setHoveredPage(index + 1)}
                onMouseLeave={() => setHoveredPage(null)}
              >
                <img
                  src={thumbnail}
                  alt={`Page ${index + 1}`}
                  className="w-full object-contain bg-white"
                />
                <div className="absolute bottom-0 right-0 bg-navy-800 text-white text-xs px-2 py-1 rounded-tl">
                  {index + 1}
                </div>

                {/* Page Operations */}
                {hoveredPage === index + 1 && (
                  <div className="absolute top-0 right-0 flex flex-col gap-1 p-1 bg-navy-800/90 rounded-bl">
                    <TooltipProvider>
                      <Tooltip>
                        <TooltipTrigger asChild>
                          <Button
                            variant="ghost"
                            size="icon"
                            className="h-6 w-6 text-white hover:bg-navy-700"
                            onClick={(e) => {
                              e.stopPropagation();
                              onRotatePage?.(index + 1);
                            }}
                          >
                            <RotateCw className="h-3 w-3" />
                          </Button>
                        </TooltipTrigger>
                        <TooltipContent>
                          <p>Rotate</p>
                        </TooltipContent>
                      </Tooltip>
                    </TooltipProvider>
                    <TooltipProvider>
                      <Tooltip>
                        <TooltipTrigger asChild>
                          <Button
                            variant="ghost"
                            size="icon"
                            className="h-6 w-6 text-white hover:bg-navy-700"
                            onClick={(e) => {
                              e.stopPropagation();
                              onDuplicatePage?.(index + 1);
                            }}
                          >
                            <Copy className="h-3 w-3" />
                          </Button>
                        </TooltipTrigger>
                        <TooltipContent>
                          <p>Duplicate</p>
                        </TooltipContent>
                      </Tooltip>
                    </TooltipProvider>
                    <TooltipProvider>
                      <Tooltip>
                        <TooltipTrigger asChild>
                          <Button
                            variant="ghost"
                            size="icon"
                            className="h-6 w-6 text-white hover:bg-navy-700 hover:text-red-400"
                            onClick={(e) => {
                              e.stopPropagation();
                              handleDeletePage(index + 1);
                            }}
                          >
                            <Trash2 className="h-3 w-3" />
                          </Button>
                        </TooltipTrigger>
                        <TooltipContent>
                          <p>Delete</p>
                        </TooltipContent>
                      </Tooltip>
                    </TooltipProvider>
                  </div>
                )}
              </div>
            </React.Fragment>
          ))}

          {/* Final PDF Page Inserter after all thumbnails */}
          <PDFPageInserter
            position={thumbnails.length + 1}
            file={file}
            onInsertPages={(position, pages) => {
              handleInsertPages(position, pages);
              regenerateThumbnails();
            }}
          />

          {/* Scroll Down Button */}
          <Button
            variant="ghost"
            size="sm"
            className="w-full text-black hover:bg-navy-700"
            onClick={handleScrollDown}
          >
            <ChevronDown className="h-4 w-4" />
          </Button>
        </div>

        {/* Toggle Sidebar Button */}
        <button
          onClick={() => setIsOpen(!isOpen)}
          className="absolute -right-4 top-1/2 transform -translate-y-1/2 bg-navy-800 text-white p-1 rounded-full hover:bg-navy-700 z-10"
        >
          {isOpen ? (
            <ChevronLeft className="h-4 w-4" />
          ) : (
            <ChevronRight className="h-4 w-4" />
          )}
        </button>
      </div>
    </div>
  );
};

export default ThumbnailSidebar;
