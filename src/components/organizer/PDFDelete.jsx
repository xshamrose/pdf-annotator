import React, { useState } from "react";
import { Plus, Trash2, FileText, Loader2 } from "lucide-react";
import { Button } from "../ui/button";
import * as pdfjsLib from "pdfjs-dist";

// Initialize PDF.js worker
pdfjsLib.GlobalWorkerOptions.workerSrc = `//cdnjs.cloudflare.com/ajax/libs/pdf.js/${pdfjsLib.version}/pdf.worker.min.js`;

const PDFDelete = () => {
  const [files, setFiles] = useState([]);
  const [selectedPages, setSelectedPages] = useState(new Set());
  const [isProcessing, setIsProcessing] = useState(false);

  const generatePageThumbnail = async (file, pageNum) => {
    try {
      const arrayBuffer = await file.arrayBuffer();
      const pdf = await pdfjsLib.getDocument({ data: arrayBuffer }).promise;
      const page = await pdf.getPage(pageNum);
      const viewport = page.getViewport({ scale: 1 });
      const canvas = document.createElement("canvas");
      const context = canvas.getContext("2d");

      const maxDimension = 400;
      const scale = maxDimension / Math.max(viewport.width, viewport.height);
      const scaledViewport = page.getViewport({ scale });

      canvas.height = scaledViewport.height;
      canvas.width = scaledViewport.width;

      await page.render({
        canvasContext: context,
        viewport: scaledViewport,
      }).promise;

      return canvas.toDataURL("image/png");
    } catch (error) {
      console.error("Error generating page thumbnail:", error);
      return null;
    }
  };

  const handleFileAdd = async (event) => {
    const selectedFiles = Array.from(event.target.files);

    const newPages = [];
    for (const file of selectedFiles) {
      if (file.type === "application/pdf") {
        const arrayBuffer = await file.arrayBuffer();
        const pdf = await pdfjsLib.getDocument({ data: arrayBuffer }).promise;
        const numPages = pdf.numPages;

        for (let pageNum = 1; pageNum <= numPages; pageNum++) {
          const preview = await generatePageThumbnail(file, pageNum);
          if (preview) {
            newPages.push({
              id: `${Math.random().toString(36).substr(2, 9)}_page${pageNum}`,
              file,
              fileName: file.name,
              pageNumber: pageNum,
              totalPages: numPages,
              preview,
            });
          }
        }
      }
    }

    setFiles((prev) => [...prev, ...newPages]);
  };

  const togglePageSelection = (pageId) => {
    setSelectedPages((prev) => {
      const newSelection = new Set(prev);
      if (newSelection.has(pageId)) {
        newSelection.delete(pageId);
      } else {
        newSelection.add(pageId);
      }
      return newSelection;
    });
  };

  const handleDeleteSelected = async () => {
    if (selectedPages.size === 0) return;

    setIsProcessing(true);
    try {
      const PDFLib = await import("pdf-lib");
      const groupedFiles = {};

      // Group pages by original PDF file
      files.forEach((page) => {
        if (!selectedPages.has(page.id)) {
          const fileKey = page.fileName;
          if (!groupedFiles[fileKey]) {
            groupedFiles[fileKey] = {
              file: page.file,
              pages: [],
            };
          }
          groupedFiles[fileKey].pages.push(page.pageNumber);
        }
      });

      const processedPdfs = [];
      for (const [fileName, fileData] of Object.entries(groupedFiles)) {
        const fileArrayBuffer = await fileData.file.arrayBuffer();
        const pdfDoc = await PDFLib.PDFDocument.load(fileArrayBuffer);

        // Create new PDF with only non-deleted pages
        const newPdf = await PDFLib.PDFDocument.create();
        for (const pageNum of fileData.pages) {
          const [copiedPage] = await newPdf.copyPages(pdfDoc, [pageNum - 1]);
          newPdf.addPage(copiedPage);
        }

        const pdfBytes = await newPdf.save();
        processedPdfs.push({
          name: `deleted_pages_${fileName}`,
          blob: new Blob([pdfBytes], { type: "application/pdf" }),
        });
      }

      // Download processed PDFs
      for (const pdf of processedPdfs) {
        const url = URL.createObjectURL(pdf.blob);
        const link = document.createElement("a");
        link.href = url;
        link.download = pdf.name;
        link.click();
        URL.revokeObjectURL(url);
      }

      // Clear selected pages and remove them from the files array
      setFiles(files.filter((file) => !selectedPages.has(file.id)));
      setSelectedPages(new Set());
    } catch (error) {
      console.error("Error processing PDFs:", error);
    } finally {
      setIsProcessing(false);
    }
  };

  return (
    <div className="max-w-7xl mx-auto p-4 space-y-6">
      <div className="flex items-center justify-between mb-6">
        <div className="flex gap-2">
          <Button
            variant="outline"
            size="sm"
            onClick={() => document.getElementById("file-input").click()}
            className="flex items-center gap-1"
          >
            <Plus className="w-4 h-4" />
            Add
          </Button>
          <input
            id="file-input"
            type="file"
            multiple
            accept=".pdf"
            className="hidden"
            onChange={handleFileAdd}
          />
        </div>
        <Button
          className="bg-blue-600 hover:bg-blue-700 text-white"
          onClick={handleDeleteSelected}
          disabled={selectedPages.size === 0 || isProcessing}
        >
          {isProcessing ? (
            <>
              <Loader2 className="w-4 h-4 mr-2 animate-spin" />
              Processing...
            </>
          ) : (
            "Finish"
          )}
        </Button>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 xl:grid-cols-5 gap-8">
        {files.map((page, index) => (
          <div key={page.id} className="relative">
            <div
              className={`group bg-white rounded-lg border ${
                selectedPages.has(page.id)
                  ? "border-red-500 shadow-lg"
                  : "border-gray-200 hover:shadow-lg"
              } transition-all duration-200 cursor-pointer`}
              onClick={() => togglePageSelection(page.id)}
            >
              <div className="aspect-[3/4] relative bg-gray-50 rounded-t-lg overflow-hidden">
                <div className="absolute inset-0 flex items-center justify-center">
                  {page.preview ? (
                    <img
                      src={page.preview}
                      alt={`${page.fileName} - Page ${page.pageNumber}`}
                      className="w-[70%] h-[70%] object-contain"
                    />
                  ) : (
                    <FileText className="w-12 h-12 text-gray-400" />
                  )}
                </div>

                {/* Centered Delete Icon with Overlay */}
                <div className="absolute inset-0 bg-black/50 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
                  <div
                    className={`w-12 h-12 rounded-full ${
                      selectedPages.has(page.id)
                        ? "bg-red-500"
                        : "bg-white/20 hover:bg-white/30"
                    } flex items-center justify-center transition-colors`}
                  >
                    <Trash2
                      className={`w-6 h-6 ${
                        selectedPages.has(page.id) ? "text-white" : "text-white"
                      }`}
                    />
                  </div>
                </div>

                <div className="absolute left-2 top-2 bg-white/90 rounded-full w-6 h-6 flex items-center justify-center text-sm font-medium text-gray-700">
                  {index + 1}
                </div>

                <div className="absolute left-2 bottom-2 bg-white/90 rounded-full px-2 py-0.5 text-xs font-medium text-gray-700">
                  Page {page.pageNumber} of {page.totalPages}
                </div>
              </div>
              <div className="p-2 text-xs truncate">
                {page.fileName} - Page {page.pageNumber}
              </div>
            </div>
          </div>
        ))}

        <div
          className="aspect-[3/4] flex flex-col items-center justify-center border-2 border-dashed border-gray-300 rounded-xl hover:border-blue-500 transition-colors bg-gray-50 cursor-pointer"
          onClick={() => document.getElementById("file-input").click()}
        >
          <Plus className="w-10 h-10 text-gray-400 mb-3" />
          <div className="text-center px-4">
            <p className="text-sm font-medium text-gray-900">Add PDFs</p>
            <p className="text-xs text-gray-500 mt-1">
              Click to upload PDF files
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};

export default PDFDelete;
