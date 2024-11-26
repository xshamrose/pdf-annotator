import React, { useState } from "react";
import { useNavigate } from "react-router-dom";
import {
  ZoomIn,
  Plus,
  RotateCcw,
  RotateCw,
  Trash2,
  FileText,
  X,
  ChevronLeft,
  ChevronRight,
  Loader2,
} from "lucide-react";
import { Button } from "../ui/button";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogClose,
} from "../ui/dialog";
import * as pdfjsLib from "pdfjs-dist";

// Initialize PDF.js worker
pdfjsLib.GlobalWorkerOptions.workerSrc = `//cdnjs.cloudflare.com/ajax/libs/pdf.js/${pdfjsLib.version}/pdf.worker.min.js`;

const PDFRotate = () => {
  const [files, setFiles] = useState([]);
  const [rotation, setRotation] = useState({});
  const [zoomedFile, setZoomedFile] = useState(null);
  const [currentPage, setCurrentPage] = useState(1);
  const [currentPageImage, setCurrentPageImage] = useState(null);
  const [isLoadingPage, setIsLoadingPage] = useState(false);
  const [isProcessing, setIsProcessing] = useState(false);
  const navigate = useNavigate();

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

  const handleRotate = (direction) => {
    setRotation((prev) => {
      const newRotation = { ...prev };
      files.forEach((file) => {
        const currentRotation = prev[file.id] || 0;
        newRotation[file.id] =
          (currentRotation + (direction === "left" ? -90 : 90)) % 360;
        if (newRotation[file.id] < 0) {
          newRotation[file.id] += 360;
        }
      });
      return newRotation;
    });
  };

  const handleSingleRotate = (id, direction) => {
    setRotation((prev) => ({
      ...prev,
      [id]: ((prev[id] || 0) + (direction === "left" ? -90 : 90)) % 360,
    }));
  };

  const handleDelete = (id) => {
    setFiles(files.filter((file) => file.id !== id));
    setRotation((prev) => {
      const { [id]: removed, ...rest } = prev;
      return rest;
    });
  };

  const loadPage = async (file, pageNum) => {
    setIsLoadingPage(true);
    try {
      const arrayBuffer = await file.file.arrayBuffer();
      const pdf = await pdfjsLib.getDocument({ data: arrayBuffer }).promise;
      const page = await pdf.getPage(pageNum);
      const viewport = page.getViewport({ scale: 1.5 });
      const canvas = document.createElement("canvas");
      const context = canvas.getContext("2d");

      canvas.height = viewport.height;
      canvas.width = viewport.width;

      await page.render({
        canvasContext: context,
        viewport,
      }).promise;

      setCurrentPageImage(canvas.toDataURL("image/png"));
    } catch (error) {
      console.error("Error loading page:", error);
    }
    setIsLoadingPage(false);
  };

  const handleZoom = async (file) => {
    setZoomedFile(file);
    setCurrentPage(1);
    loadPage(file, 1);
  };

  const handlePageChange = async (direction) => {
    if (!zoomedFile) return;

    let newPage = currentPage;
    if (direction === "next" && currentPage < zoomedFile.pages) {
      newPage = currentPage + 1;
    } else if (direction === "prev" && currentPage > 1) {
      newPage = currentPage - 1;
    }

    if (newPage !== currentPage) {
      setCurrentPage(newPage);
      await loadPage(zoomedFile, newPage);
    }
  };

  const processRotatedPDFs = async () => {
    if (files.length === 0) return;

    setIsProcessing(true);
    try {
      const PDFLib = await import("pdf-lib");
      const processedPdfs = new Map(); // Use Map to store filename -> processed PDF pairs
      let totalPages = 0;
      let totalSize = 0;

      // Group pages by original file
      const fileGroups = files.reduce((groups, page) => {
        const key = page.fileName;
        if (!groups[key]) {
          groups[key] = [];
        }
        groups[key].push(page);
        return groups;
      }, {});

      // Process each original file
      for (const [fileName, pages] of Object.entries(fileGroups)) {
        const fileArrayBuffer = await pages[0].file.arrayBuffer();
        const pdfDoc = await PDFLib.PDFDocument.load(fileArrayBuffer);
        const pdfPages = pdfDoc.getPages();

        // Apply rotations for each page
        pages.forEach((page) => {
          if (rotation[page.id]) {
            const pdfPage = pdfPages[page.pageNumber - 1];
            pdfPage.setRotation(PDFLib.degrees(rotation[page.id]));
          }
        });

        const pdfBytes = await pdfDoc.save();
        const processedPdf = new Blob([pdfBytes], { type: "application/pdf" });

        processedPdfs.set(fileName, processedPdf);
        totalPages += pages.length;
        totalSize += processedPdf.size;
      }

      // If only one PDF, send directly to export page
      if (processedPdfs.size === 1) {
        const [fileName, pdfBlob] = processedPdfs.entries().next().value;
        navigate("/export", {
          state: {
            file: pdfBlob,
            fileName: `rotated_${fileName}`,
            fileSize: formatFileSize(pdfBlob.size),
            pageCount: totalPages,
          },
        });
      } else {
        // For multiple PDFs, create a zip file
        const JSZip = await import("jszip");
        const zip = new JSZip.default();

        processedPdfs.forEach((pdf, fileName) => {
          zip.file(`rotated_${fileName}`, pdf);
        });

        const zipBlob = await zip.generateAsync({ type: "blob" });
        navigate("/export", {
          state: {
            file: zipBlob,
            fileName: "rotated_documents.zip",
            fileSize: formatFileSize(zipBlob.size),
            pageCount: totalPages,
            isZip: true,
            fileCount: processedPdfs.size,
          },
        });
      }
    } catch (error) {
      console.error("Error processing PDFs:", error);
      // You might want to show an error message to the user here
    } finally {
      setIsProcessing(false);
    }
  };
  // Add formatFileSize function from merge component
  const formatFileSize = (bytes) => {
    if (bytes === 0) return "0 Bytes";
    const k = 1024;
    const sizes = ["Bytes", "KB", "MB", "GB"];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + " " + sizes[i];
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
          <div className="flex gap-2">
            <Button
              variant="outline"
              size="sm"
              className="flex items-center gap-1"
              onClick={() => handleRotate("left")}
            >
              <RotateCcw className="w-4 h-4" />
              Left
            </Button>
            <Button
              variant="outline"
              size="sm"
              className="flex items-center gap-1"
              onClick={() => handleRotate("right")}
            >
              <RotateCw className="w-4 h-4" />
              Right
            </Button>
          </div>
        </div>
        <Button
          className="bg-blue-600 hover:bg-blue-700 text-white"
          onClick={processRotatedPDFs}
          disabled={files.length === 0 || isProcessing}
        >
          {isProcessing ? (
            <>
              <Loader2 className="w-4 h-4 mr-2 animate-spin" />
              Processing...
            </>
          ) : (
            "Export"
          )}
        </Button>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 xl:grid-cols-5 gap-8">
        {files.map((page, index) => (
          <div key={page.id} className="relative">
            <div className="group bg-white rounded-lg border border-gray-200 hover:shadow-lg transition-shadow duration-200">
              <div className="aspect-[3/4] relative bg-gray-50 rounded-t-lg overflow-hidden">
                <div className="absolute inset-0 flex items-center justify-center">
                  {page.preview ? (
                    <img
                      src={page.preview}
                      alt={`${page.fileName} - Page ${page.pageNumber}`}
                      className="w-[70%] h-[70%] object-contain transition-transform duration-200"
                      style={{
                        transform: `rotate(${rotation[page.id] || 0}deg)`,
                      }}
                    />
                  ) : (
                    <FileText className="w-12 h-12 text-gray-400" />
                  )}
                </div>

                <div className="absolute left-2 top-2 bg-white/90 rounded-full w-6 h-6 flex items-center justify-center text-sm font-medium text-gray-700">
                  {index + 1}
                </div>

                <div className="absolute left-2 bottom-2 bg-white/90 rounded-full px-2 py-0.5 text-xs font-medium text-gray-700">
                  Page {page.pageNumber} of {page.totalPages}
                </div>

                <div className="absolute inset-0 bg-black/50 opacity-0 group-hover:opacity-100 transition-opacity duration-200">
                  <div className="absolute top-2 right-2 flex gap-2">
                    <button
                      className="p-1.5 rounded-lg bg-white/10 hover:bg-white/20 transition-colors"
                      onClick={() => handleZoom(page)}
                    >
                      <ZoomIn className="w-4 h-4 text-white" />
                    </button>
                    <button
                      className="p-1.5 rounded-lg bg-white/10 hover:bg-white/20 transition-colors"
                      onClick={() => handleDelete(page.id)}
                    >
                      <Trash2 className="w-4 h-4 text-white" />
                    </button>
                  </div>
                  <div className="absolute bottom-2 right-2 flex gap-2">
                    <button
                      className="p-1.5 rounded-lg bg-white/10 hover:bg-white/20 transition-colors"
                      onClick={() => handleSingleRotate(page.id, "left")}
                    >
                      <RotateCcw className="w-4 h-4 text-white" />
                    </button>
                    <button
                      className="p-1.5 rounded-lg bg-white/10 hover:bg-white/20 transition-colors"
                      onClick={() => handleSingleRotate(page.id, "right")}
                    >
                      <RotateCw className="w-4 h-4 text-white" />
                    </button>
                  </div>
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

      <Dialog
        open={!!zoomedFile}
        onOpenChange={(open) => {
          if (!open) {
            setZoomedFile(null);
            setCurrentPageImage(null);
            setCurrentPage(1);
          }
        }}
      >
        <DialogContent className="max-w-4xl w-[95vw] min-h-[80vh] bg-gray-100">
          <DialogHeader className="bg-white  px-4 py-2">
            <DialogTitle className="flex items-center justify-between">
              <span>{zoomedFile?.file.name}</span>
              <DialogClose asChild>
                <Button variant="ghost" size="sm" className="w-8 h-8 p-0">
                  <X className="w-4 h-4" />
                </Button>
              </DialogClose>
            </DialogTitle>
          </DialogHeader>
          <div className="relative flex-1 w-full h-full flex items-center justify-center p-4">
            {isLoadingPage ? (
              <div className="text-gray-500">Loading page...</div>
            ) : (
              <div className="relative flex items-center justify-center w-full h-full">
                {currentPage > 1 && (
                  <Button
                    variant="ghost"
                    size="sm"
                    className="absolute left-2 z-10"
                    onClick={() => handlePageChange("prev")}
                  >
                    <ChevronLeft className="w-6 h-6" />
                  </Button>
                )}
                {currentPage < (zoomedFile?.pages || 1) && (
                  <Button
                    variant="ghost"
                    size="sm"
                    className="absolute right-2 z-10"
                    onClick={() => handlePageChange("next")}
                  >
                    <ChevronRight className="w-6 h-6" />
                  </Button>
                )}
                {currentPageImage && (
                  <div className="relative max-w-full max-h-full">
                    <img
                      src={currentPageImage}
                      alt={`Page ${currentPage}`}
                      className="max-w-full max-h-[70vh] object-contain shadow-lg"
                      style={{
                        transform: `rotate(${
                          rotation[zoomedFile?.id] || 0
                        }deg)`,
                      }}
                    />
                    <div className="absolute bottom-4 left-1/2 transform -translate-x-1/2 bg-black/50 text-white px-3 py-1 rounded-full text-sm">
                      Page {currentPage} of {zoomedFile?.pages}
                    </div>
                  </div>
                )}
              </div>
            )}
            <div className="absolute bottom-4 right-4 flex gap-2">
              <Button
                variant="secondary"
                size="sm"
                onClick={() => handleSingleRotate(zoomedFile?.id, "left")}
              >
                <RotateCcw className="w-4 h-4 mr-1" />
                Rotate Left
              </Button>
              <Button
                variant="secondary"
                size="sm"
                onClick={() => handleSingleRotate(zoomedFile?.id, "right")}
              >
                <RotateCw className="w-4 h-4 mr-1" />
                Rotate Right
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default PDFRotate;
