import React, { useState, useRef, useCallback } from "react";
import { Plus } from "lucide-react";
import * as pdfjsLib from "pdfjs-dist";
import { toast } from "../ui/toast";

interface Page {
  pageNumber: number;
  file: File;
  originalPageNumber: number;
}

interface PDFPageInserterProps {
  position: number;
  file: File | string;
  onInsertPages: (position: number, pages: Page[]) => void;
}

const PDFPageInserter: React.FC<PDFPageInserterProps> = ({
  position,
  file,
  onInsertPages,
}) => {
  const [isHovered, setIsHovered] = useState(false);
  const [isDragging, setIsDragging] = useState(false);
  const [isProcessing, setIsProcessing] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const processPDFFile = useCallback(
    async (selectedFile: File) => {
      if (!selectedFile || !selectedFile.type.includes("pdf")) {
        toast({
          title: "Invalid File",
          description: "Please select a PDF file",
          variant: "destructive",
        });
        return;
      }

      setIsProcessing(true);
      try {
        // Initialize PDF.js with workerSrc if not already done
        if (!pdfjsLib.GlobalWorkerOptions.workerSrc) {
          pdfjsLib.GlobalWorkerOptions.workerSrc = `//cdnjs.cloudflare.com/ajax/libs/pdf.js/${pdfjsLib.version}/pdf.worker.min.js`;
        }

        const arrayBuffer = await selectedFile.arrayBuffer();
        const loadingTask = pdfjsLib.getDocument({ data: arrayBuffer });
        const pdf = await loadingTask.promise;
        const numPages = pdf.numPages;

        // Create array of pages from the new PDF
        const newPages: Page[] = Array.from({ length: numPages }, (_, i) => ({
          pageNumber: position + i,
          file: selectedFile,
          originalPageNumber: i + 1,
        }));

        // Call onInsertPages with the position and new pages
        await onInsertPages(position, newPages);

        toast({
          title: "Success",
          description: `Inserted ${numPages} page${numPages > 1 ? "s" : ""}`,
        });
      } catch (error) {
        console.error("Error processing PDF:", error);
        toast({
          title: "Error",
          description: "Failed to process PDF file",
          variant: "destructive",
        });
      } finally {
        setIsProcessing(false);
      }
    },
    [position, onInsertPages]
  );

  const handleFileSelect = useCallback(
    async (selectedFile: File) => {
      if (selectedFile) {
        await processPDFFile(selectedFile);
      }
    },
    [processPDFFile]
  );

  const handleInputChange = useCallback(
    (e: React.ChangeEvent<HTMLInputElement>) => {
      const selectedFile = e.target.files?.[0];
      if (selectedFile) {
        handleFileSelect(selectedFile);
      }
      // Reset input value to allow selecting the same file again
      e.target.value = "";
    },
    [handleFileSelect]
  );

  const handleDragEnter = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragging(true);
  }, []);

  const handleDragLeave = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragging(false);
  }, []);

  const handleDrop = useCallback(
    async (e: React.DragEvent) => {
      e.preventDefault();
      e.stopPropagation();
      setIsDragging(false);

      const droppedFile = e.dataTransfer.files[0];
      if (droppedFile) {
        await handleFileSelect(droppedFile);
      }
    },
    [handleFileSelect]
  );

  return (
    <div
      className={`relative w-full ${
        isProcessing ? "opacity-50 pointer-events-none" : ""
      }`}
      onDragEnter={handleDragEnter}
      onDragOver={(e) => e.preventDefault()}
      onDragLeave={handleDragLeave}
      onDrop={handleDrop}
    >
      <input
        type="file"
        ref={fileInputRef}
        className="hidden"
        accept="application/pdf"
        onChange={handleInputChange}
      />

      <div className="flex items-center justify-center py-2">
        <button
          className={`w-8 h-8 rounded-full flex items-center justify-center transition-all duration-200 ${
            isHovered || isDragging
              ? "bg-blue-500 text-white"
              : "bg-gray-200 text-gray-600"
          } ${isProcessing ? "cursor-wait" : "cursor-pointer"}`}
          onMouseEnter={() => setIsHovered(true)}
          onMouseLeave={() => setIsHovered(false)}
          onClick={() => fileInputRef.current?.click()}
          disabled={isProcessing}
        >
          <Plus className={`w-5 h-5 ${isProcessing ? "animate-pulse" : ""}`} />
        </button>
      </div>

      {isDragging && (
        <div className="absolute inset-0 bg-blue-100/50 border-2 border-dashed border-blue-500 rounded-lg flex items-center justify-center">
          <div className="text-blue-500 font-medium">Drop PDF here</div>
        </div>
      )}
    </div>
  );
};

export default PDFPageInserter;
