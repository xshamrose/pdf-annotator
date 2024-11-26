import React, { useState, useCallback } from "react";
import { PDFDocument } from "pdf-lib";
import * as pdfjs from "pdfjs-dist";
import { Plus, ArrowLeft, ArrowRight, Check } from "lucide-react";
import { useNavigate } from "react-router-dom";

const PdfExtractor = () => {
  const [pdfPages, setPdfPages] = useState([]);
  const [selectedPages, setSelectedPages] = useState(new Set());
  const [isDragging, setIsDragging] = useState(false);
  const [isProcessing, setIsProcessing] = useState(false);
  const [createSeparatePdfs, setCreateSeparatePdfs] = useState(false);
  const navigate = useNavigate();
  const handlePageSelect = (pageIndex) => {
    const newSelectedPages = new Set(selectedPages);
    if (newSelectedPages.has(pageIndex)) {
      newSelectedPages.delete(pageIndex);
    } else {
      newSelectedPages.add(pageIndex);
    }
    setSelectedPages(newSelectedPages);
  };

  const generateThumbnail = async (pdfFile, pageNumber) => {
    try {
      const arrayBuffer = await pdfFile.arrayBuffer();
      const pdf = await pdfjs.getDocument({ data: arrayBuffer }).promise;
      const page = await pdf.getPage(pageNumber);

      const desiredWidth = 150;
      const viewport = page.getViewport({ scale: 1.0 });
      const scale = desiredWidth / viewport.width;
      const scaledViewport = page.getViewport({ scale });

      const canvas = document.createElement("canvas");
      const context = canvas.getContext("2d");
      canvas.width = scaledViewport.width;
      canvas.height = scaledViewport.height;

      await page.render({
        canvasContext: context,
        viewport: scaledViewport,
      }).promise;

      return canvas.toDataURL();
    } catch (error) {
      console.error("Error generating thumbnail:", error);
      return null;
    }
  };

  const handleDragOver = useCallback((e) => {
    e.preventDefault();
    setIsDragging(true);
  }, []);

  const handleDragLeave = useCallback((e) => {
    e.preventDefault();
    setIsDragging(false);
  }, []);

  const handleDrop = useCallback((e) => {
    e.preventDefault();
    setIsDragging(false);
    const files = Array.from(e.dataTransfer.files);
    const pdfFiles = files.filter((file) => file.type === "application/pdf");
    if (pdfFiles.length > 0) {
      handleFileUpload(pdfFiles);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const handleFileUpload = async (files) => {
    try {
      setIsProcessing(true);
      const newPages = [];

      for (const file of files) {
        const arrayBuffer = await file.arrayBuffer();
        const pdfDoc = await PDFDocument.load(arrayBuffer);
        const pageCount = pdfDoc.getPageCount();

        for (let i = 0; i < pageCount; i++) {
          const thumbnail = await generateThumbnail(file, i + 1);
          newPages.push({
            pageNumber: i + 1,
            fileName: file.name,
            thumbnail,
            originalFile: file,
          });
        }
      }

      setPdfPages(newPages);
      setSelectedPages(new Set());
    } catch (error) {
      console.error("Error loading PDFs:", error);
    } finally {
      setIsProcessing(false);
    }
  };

  const extractPages = async () => {
    try {
      setIsProcessing(true);
      const selectedPagesArray = Array.from(selectedPages).sort(
        (a, b) => a - b
      );
      const extractedFiles = [];

      if (createSeparatePdfs) {
        // Create separate PDF for each selected page
        for (const pageIndex of selectedPagesArray) {
          const page = pdfPages[pageIndex];
          const newPdfDoc = await PDFDocument.create();
          const sourceBytes = await page.originalFile.arrayBuffer();
          const sourcePdf = await PDFDocument.load(sourceBytes);
          const [copiedPage] = await newPdfDoc.copyPages(sourcePdf, [
            page.pageNumber - 1,
          ]);
          newPdfDoc.addPage(copiedPage);

          const pdfBytes = await newPdfDoc.save();
          const blob = new Blob([pdfBytes], { type: "application/pdf" });
          const url = URL.createObjectURL(blob);

          extractedFiles.push({
            name: `page_${page.pageNumber}.pdf`,
            url: url,
            size: `${Math.round(pdfBytes.length / 1024)} KB`,
            pages: 1,
          });
        }
      } else {
        // Create single PDF with all selected pages
        const newPdfDoc = await PDFDocument.create();
        for (const pageIndex of selectedPagesArray) {
          const page = pdfPages[pageIndex];
          const sourceBytes = await page.originalFile.arrayBuffer();
          const sourcePdf = await PDFDocument.load(sourceBytes);
          const [copiedPage] = await newPdfDoc.copyPages(sourcePdf, [
            page.pageNumber - 1,
          ]);
          newPdfDoc.addPage(copiedPage);
        }

        const pdfBytes = await newPdfDoc.save();
        const blob = new Blob([pdfBytes], { type: "application/pdf" });
        const url = URL.createObjectURL(blob);

        extractedFiles.push({
          name: "extracted_pages.pdf",
          url: url,
          size: `${Math.round(pdfBytes.length / 1024)} KB`,
          pages: selectedPagesArray.length,
        });
      }

      // Navigate to results page with the extracted files
      navigate("/organize/extract/results", {
        state: {
          extractedFiles: extractedFiles,
        },
      });
    } catch (error) {
      console.error("Error extracting pages:", error);
    } finally {
      setIsProcessing(false);
    }
  };

  const selectAll = () => {
    const allPages = new Set(pdfPages.map((_, index) => index));
    setSelectedPages(allPages);
  };

  const deselectAll = () => {
    setSelectedPages(new Set());
  };

  return (
    <div className="max-w-7xl mx-auto p-4 space-y-6">
      {isProcessing && (
        <div className="fixed inset-0 bg-white bg-opacity-80 flex items-center justify-center z-50">
          <div className="text-center">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mb-4" />
            <p className="text-gray-600">Processing PDF...</p>
          </div>
        </div>
      )}

      <div className="flex items-center justify-end mb-6">
        <div className="flex items-center gap-6">
          <label className="flex items-center gap-2">
            <input
              type="checkbox"
              className="w-4 h-4"
              checked={selectedPages.size === pdfPages.length}
              onChange={(e) => (e.target.checked ? selectAll() : deselectAll())}
            />
            Select all
          </label>

          <div className="flex items-center gap-3 border-l pl-6">
            <label className="flex items-center gap-2 text-sm text-gray-600">
              <input
                type="checkbox"
                className="w-4 h-4"
                checked={createSeparatePdfs}
                onChange={(e) => setCreateSeparatePdfs(e.target.checked)}
              />
              Separate PDFs
            </label>
          </div>

          <button
            className="bg-blue-600 hover:bg-blue-700 text-white px-6 py-2 rounded-md"
            onClick={extractPages}
            disabled={selectedPages.size === 0}
          >
            Finish
          </button>
        </div>
      </div>

      <div className="grid grid-cols-5 gap-4">
        {pdfPages.map((page, index) => (
          <div key={index} className="relative">
            <div
              className={`group bg-white rounded-lg border-2 transition-all duration-200 cursor-pointer
                ${
                  selectedPages.has(index)
                    ? "border-blue-500 bg-blue-50"
                    : "border-gray-200 hover:border-blue-300"
                }`}
              onClick={(e) => handlePageSelect(index, e)}
            >
              {/* Checkbox in top-right corner */}
              <div
                className="absolute right-2 top-2 z-10 w-5 h-5 rounded border-2 flex items-center justify-center transition-colors"
                onClick={(e) => handlePageSelect(index, e)}
                style={{
                  backgroundColor: selectedPages.has(index)
                    ? "#2563eb"
                    : "white",
                  borderColor: selectedPages.has(index) ? "#2563eb" : "#d1d5db",
                }}
              >
                {selectedPages.has(index) && (
                  <Check className="w-4 h-4 text-white" />
                )}
              </div>

              <div className="aspect-[3/4] relative bg-gray-50 rounded-t-lg overflow-hidden">
                {page.thumbnail && (
                  <img
                    src={page.thumbnail}
                    alt={`Page ${page.pageNumber}`}
                    className="absolute inset-0 w-full h-full object-contain"
                  />
                )}
                <div className="absolute left-2 top-2 bg-white/90 rounded-full w-6 h-6 flex items-center justify-center text-sm font-medium text-gray-700">
                  {page.pageNumber}
                </div>
              </div>
              <div className="px-3 py-2 text-xs truncate">{page.fileName}</div>
            </div>
          </div>
        ))}

        <div
          className={`aspect-[3/4] flex flex-col items-center justify-center border-2 border-dashed rounded-xl transition-colors cursor-pointer
            ${
              isDragging
                ? "border-blue-500 bg-blue-50"
                : "border-gray-300 hover:border-blue-500"
            }`}
          onClick={() => document.getElementById("file-input").click()}
          onDragOver={handleDragOver}
          onDragLeave={handleDragLeave}
          onDrop={handleDrop}
        >
          <input
            id="file-input"
            type="file"
            accept=".pdf"
            multiple
            className="hidden"
            onChange={(e) => handleFileUpload(Array.from(e.target.files))}
          />
          <Plus className="w-10 h-10 text-gray-400 mb-3" />
          <div className="text-center px-4">
            <p className="text-sm font-medium text-gray-900">Add files</p>
            <p className="text-xs text-gray-500 mt-1">
              Drop PDF here or click to browse
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};

export default PdfExtractor;
