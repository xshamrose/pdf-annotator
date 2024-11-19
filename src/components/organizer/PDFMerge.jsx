import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";

import {
  ZoomIn,
  Plus,
  RotateCcw,
  RotateCw,
  Trash2,
  FileText,
  Copy,
  X,
  ChevronLeft,
  ChevronRight,
  Loader2,
} from "lucide-react";
import { Button } from "../ui/button";
// import { Card, CardContent } from "../ui/card";
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
  TooltipProvider,
} from "../ui/tooltip";
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

const PDFMerge = () => {
  const [files, setFiles] = useState([]);
  const [rotation, setRotation] = useState({});
  const [zoomedFile, setZoomedFile] = useState(null);
  const [currentPage, setCurrentPage] = useState(1);
  const [currentPageImage, setCurrentPageImage] = useState(null);
  const [isLoadingPage, setIsLoadingPage] = useState(false);
  const [isMerging, setIsMerging] = useState(false);

  const generatePDFThumbnail = async (file) => {
    try {
      // Read the PDF file
      const arrayBuffer = await file.arrayBuffer();

      // Load the PDF document
      const pdf = await pdfjsLib.getDocument({ data: arrayBuffer }).promise;

      // Get the first page
      const page = await pdf.getPage(1);

      // Set the scale for thumbnail
      const viewport = page.getViewport({ scale: 1 });
      const canvas = document.createElement("canvas");
      const context = canvas.getContext("2d");

      // Scale to fit within a reasonable thumbnail size while maintaining aspect ratio
      const maxDimension = 400;
      const scale = maxDimension / Math.max(viewport.width, viewport.height);
      const scaledViewport = page.getViewport({ scale });

      canvas.height = scaledViewport.height;
      canvas.width = scaledViewport.width;

      // Render PDF page to canvas
      await page.render({
        canvasContext: context,
        viewport: scaledViewport,
      }).promise;

      // Convert canvas to data URL
      const thumbnail = canvas.toDataURL("image/png");

      return {
        preview: thumbnail,
        pages: pdf.numPages,
      };
    } catch (error) {
      console.error("Error generating PDF thumbnail:", error);
      return null;
    }
  };

  const generatePagePreview = async (file, pageNum, scale = 1.5) => {
    try {
      const arrayBuffer = await file.arrayBuffer();
      const pdf = await pdfjsLib.getDocument({ data: arrayBuffer }).promise;
      const page = await pdf.getPage(pageNum);
      const viewport = page.getViewport({ scale });
      const canvas = document.createElement("canvas");
      const context = canvas.getContext("2d");

      canvas.height = viewport.height;
      canvas.width = viewport.width;

      await page.render({
        canvasContext: context,
        viewport,
      }).promise;

      return canvas.toDataURL("image/png");
    } catch (error) {
      console.error(`Error generating preview for page ${pageNum}:`, error);
      return null;
    }
  };

  const loadPage = async (file, pageNum) => {
    setIsLoadingPage(true);
    try {
      const preview = await generatePagePreview(file.file, pageNum);
      setCurrentPageImage(preview);
    } catch (error) {
      console.error("Error loading page:", error);
    }
    setIsLoadingPage(false);
  };

  const handleZoom = async (file) => {
    setZoomedFile(file);
    setCurrentPage(1);
    // Immediately start loading the first page
    loadPage(file, 1);
  };
  // Effect to handle initial page load when dialog opens
  useEffect(() => {
    if (zoomedFile) {
      loadPage(zoomedFile, 1);
    }
  }, [zoomedFile]);

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

  const handleFileAdd = async (event) => {
    const selectedFiles = Array.from(event.target.files);

    // Process each file
    const newFiles = await Promise.all(
      selectedFiles.map(async (file) => {
        const id = Math.random().toString(36).substr(2, 9);

        if (file.type === "application/pdf") {
          // Generate thumbnail for PDFs
          const pdfData = await generatePDFThumbnail(file);
          if (pdfData) {
            return {
              id,
              file,
              preview: pdfData.preview,
              pages: pdfData.pages,
            };
          }
        } else if (file.type.startsWith("image/")) {
          // Handle images as before
          return {
            id,
            file,
            preview: URL.createObjectURL(file),
            pages: 1,
          };
        }

        // Fallback for other file types
        return {
          id,
          file,
          preview: null,
          pages: 1,
        };
      })
    );

    setFiles((prev) => [...prev, ...newFiles]);
  };

  const handleRotate = (direction) => {
    setRotation((prev) => {
      const newRotation = { ...prev };
      files.forEach((file) => {
        const currentRotation = prev[file.id] || 0;
        newRotation[file.id] =
          (currentRotation + (direction === "left" ? -90 : 90)) % 360;
        // Handle negative rotation
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

  // Cleanup function to revoke object URLs when component unmounts
  useEffect(() => {
    return () => {
      files.forEach((file) => {
        if (file.preview && file.file.type.startsWith("image/")) {
          URL.revokeObjectURL(file.preview);
        }
      });
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const handleDuplicate = (file) => {
    const newFile = {
      ...file,
      id: Math.random().toString(36).substr(2, 9),
    };
    setFiles((prev) => [...prev, newFile]);
  };
  const navigate = useNavigate();

  const mergePDFs = async () => {
    if (files.length === 0) return;

    setIsMerging(true);
    try {
      // Initialize PDF.js
      const PDFLib = await import("pdf-lib");
      const mergedPdf = await PDFLib.PDFDocument.create();

      // Process each file
      for (const file of files) {
        if (file.file.type === "application/pdf") {
          // Read the PDF file
          const fileArrayBuffer = await file.file.arrayBuffer();
          const pdfDoc = await PDFLib.PDFDocument.load(fileArrayBuffer);

          // Copy all pages from the source PDF
          const pages = await mergedPdf.copyPages(
            pdfDoc,
            pdfDoc.getPageIndices()
          );

          // Add each page to the merged PDF
          for (let i = 0; i < pages.length; i++) {
            const page = pages[i];

            // Apply rotation if needed
            if (rotation[file.id]) {
              page.setRotation(PDFLib.degrees(rotation[file.id]));
            }

            mergedPdf.addPage(page);
          }
        }
        // Handle images if needed
        else if (file.file.type.startsWith("image/")) {
          // Convert image to PDF page and add it
          const imageBytes = await file.file.arrayBuffer();
          let image;

          if (file.file.type === "image/png") {
            image = await mergedPdf.embedPng(imageBytes);
          } else if (file.file.type === "image/jpeg") {
            image = await mergedPdf.embedJpg(imageBytes);
          }

          if (image) {
            const page = mergedPdf.addPage();
            const { width, height } = image.scale(1);
            page.drawImage(image, {
              x: 0,
              y: 0,
              width,
              height,
            });

            // Apply rotation if needed
            if (rotation[file.id]) {
              page.setRotation(PDFLib.degrees(rotation[file.id]));
            }
          }
        }
      }

      // Save the merged PDF
      const mergedPdfBytes = await mergedPdf.save();
      const mergedFile = new Blob([mergedPdfBytes], {
        type: "application/pdf",
      });

      // Calculate file size and page count
      const exportInfo = {
        fileName: "merged-document",
        fileSize: formatFileSize(mergedFile.size),
        pageCount: mergedPdf.getPageCount(),
      };

      // Navigate to export page with the merged file
      navigate("/export", {
        state: {
          file: mergedFile,
          ...exportInfo,
        },
      });
    } catch (error) {
      console.error("Error merging PDFs:", error);
      // You might want to show an error message to the user here
    } finally {
      setIsMerging(false);
    }
  };

  const formatFileSize = (bytes) => {
    if (bytes === 0) return "0 Bytes";
    const k = 1024;
    const sizes = ["Bytes", "KB", "MB", "GB"];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + " " + sizes[i];
  };

  const handleFileInsert = async (event, insertIndex) => {
    event.stopPropagation();
    const input = document.createElement("input");
    input.type = "file";
    input.multiple = true;
    input.accept = ".pdf,.doc,.docx,.xls,.xlsx,.ppt,.pptx,image/*";

    input.onchange = async (e) => {
      const selectedFiles = Array.from(e.target.files);

      // Process each file
      const newFiles = await Promise.all(
        selectedFiles.map(async (file) => {
          const id = Math.random().toString(36).substr(2, 9);

          if (file.type === "application/pdf") {
            const pdfData = await generatePDFThumbnail(file);
            if (pdfData) {
              return {
                id,
                file,
                preview: pdfData.preview,
                pages: pdfData.pages,
              };
            }
          } else if (file.type.startsWith("image/")) {
            return {
              id,
              file,
              preview: URL.createObjectURL(file),
              pages: 1,
            };
          }

          return {
            id,
            file,
            preview: null,
            pages: 1,
          };
        })
      );

      // Insert the new files at the specified index
      setFiles((prev) => {
        const newFileList = [...prev];
        newFileList.splice(insertIndex + 1, 0, ...newFiles);
        return newFileList;
      });
    };

    input.click();
  };

  return (
    <div className="max-w-7xl mx-auto p-4 space-y-6">
      {/* Top Navigation */}
      <div className="flex items-center justify-between mb-6">
        <div className="flex gap-2">
          <Button
            variant="outline"
            size="sm"
            className="flex items-center gap-1"
          >
            <Plus className="w-4 h-4" />
            Add
          </Button>
          <div className="flex gap-2">
            <TooltipProvider>
              <Tooltip>
                <TooltipTrigger asChild>
                  <Button
                    variant="outline"
                    size="sm"
                    className="flex items-center gap-1"
                    onClick={() => handleRotate("left")}
                  >
                    <RotateCcw className="w-4 h-4" />
                  </Button>
                </TooltipTrigger>
                <TooltipContent>
                  <span>Rotate Left</span>
                </TooltipContent>
              </Tooltip>
            </TooltipProvider>

            <TooltipProvider>
              <Tooltip>
                <TooltipTrigger asChild>
                  <Button
                    variant="outline"
                    size="sm"
                    className="flex items-center gap-1"
                    onClick={() => handleRotate("right")}
                  >
                    <RotateCw className="w-4 h-4" />
                  </Button>
                </TooltipTrigger>
                <TooltipContent>
                  <span>Rotate Right</span>
                </TooltipContent>
              </Tooltip>
            </TooltipProvider>
          </div>
        </div>
        <Button
          className="bg-blue-600 hover:bg-blue-700 text-white"
          onClick={mergePDFs}
          disabled={files.length === 0 || isMerging}
        >
          {isMerging ? (
            <>
              <Loader2 className="w-4 h-4 mr-2 animate-spin" />
              Merging...
            </>
          ) : (
            "Finish"
          )}
        </Button>
      </div>

      {/* File Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 xl:grid-cols-5 gap-8  relative">
        {files.map((file, index) => (
          <div key={file.id} className="relative">
            <div className="group bg-white rounded-lg border border-gray-200 hover:shadow-lg transition-shadow duration-200">
              <div className="aspect-[3/4] relative bg-gray-50 rounded-t-lg overflow-hidden">
                <div className="absolute inset-0 flex items-center justify-center">
                  {file.preview ? (
                    <img
                      src={file.preview}
                      alt={file.file.name}
                      className="w-[70%] h-[70%] object-contain transition-transform duration-200"
                      style={{
                        transform: `rotate(${rotation[file.id] || 0}deg)`,
                      }}
                    />
                  ) : (
                    <div className="w-full h-full flex items-center justify-center">
                      <FileText className="w-12 h-12 text-gray-400" />
                    </div>
                  )}
                </div>

                {/* File Name Badge */}
                <div className=" px-2  text-xs font-medium bg-black/10 text-gray-700">
                  {file.file.name}
                </div>
                {/* File Number Badge */}
                <div className="absolute left-2 top-5 bg-white/90 rounded-full w-6 h-6 flex items-center justify-center text-sm font-medium text-gray-700">
                  {index + 1}
                </div>

                {/* Pages Badge */}
                <div className="absolute left-2 bottom-2 bg-white/90 rounded-full px-2 py-0.5 text-xs font-medium text-gray-700">
                  {file.pages} page{file.pages !== 1 ? "s" : ""}
                </div>

                {/* Hover Actions */}
                <div className="absolute inset-0 bg-black/50 opacity-0 group-hover:opacity-100 transition-opacity duration-200 rounded-t-lg">
                  <div className="absolute top-2 right-2 flex gap-2">
                    <button
                      className="p-1.5 rounded-lg bg-white/10 hover:bg-white/20 transition-colors"
                      onClick={(e) => {
                        e.stopPropagation();
                        setZoomedFile(file);
                      }}
                    >
                      <ZoomIn className="w-4 h-4 text-white" />
                    </button>
                    <button
                      className="p-1.5 rounded-lg bg-white/10 hover:bg-white/20 transition-colors"
                      onClick={(e) => {
                        e.stopPropagation();
                        handleSingleRotate(file.id, "right");
                      }}
                    >
                      <RotateCw className="w-4 h-4 text-white" />
                    </button>
                    <button
                      className="p-1.5 rounded-lg bg-white/10 hover:bg-white/20 transition-colors"
                      onClick={(e) => {
                        e.stopPropagation();
                        handleDuplicate(file);
                      }}
                    >
                      <Copy className="w-4 h-4 text-white" />
                    </button>
                    <button
                      className="p-1.5 rounded-lg bg-white/10 hover:bg-white/20 transition-colors"
                      onClick={(e) => {
                        e.stopPropagation();
                        handleDelete(file.id);
                      }}
                    >
                      <Trash2 className="w-4 h-4 text-white" />
                    </button>
                  </div>
                </div>
              </div>
            </div>
            {index < files.length - 1 && (
              <button
                className="absolute -right-4 top-1/2 transform -translate-y-1/2 translate-x-1/2 w-8 h-8 rounded-full border-2 border-gray-200 bg-white hover:bg-black hover:border-black transition-colors duration-200 flex items-center justify-center group/add z-10"
                onClick={(e) => handleFileInsert(e, index)}
              >
                <Plus className="w-4 h-4 text-gray-400 group-hover/add:text-white" />
              </button>
            )}
          </div>
        ))}

        {/* Add Files Card */}
        {/* <Card
          className="relative group cursor-pointer hover:shadow-lg transition-shadow duration-200"   
        >
          <CardContent className="p-0"> */}
        <div
          className="aspect-[3/4] flex flex-col items-center justify-center border-2 border-dashed border-gray-300 rounded-xl hover:border-blue-500 transition-colors bg-gray-50"
          onClick={() => document.getElementById("file-input").click()}
        >
          <input
            id="file-input"
            type="file"
            multiple
            accept=".pdf,.doc,.docx,.xls,.xlsx,.ppt,.pptx,image/*"
            className="hidden"
            onChange={handleFileAdd}
          />
          <Plus className="w-10 h-10 text-gray-400 mb-3" />
          <div className="text-center px-4">
            <p className="text-sm font-medium text-gray-900">Add files</p>
            <p className="text-xs text-gray-500 mt-1">
              PDF, Word, Excel, PowerPoint, Images
            </p>
          </div>
        </div>
      </div>
      {/* Zoom Modal */}
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
          <DialogHeader className="bg-white px-4 py-2">
            <DialogTitle className="flex items-center justify-between">
              <div className="flex items-center justify-between gap-4">
                <span>{zoomedFile?.file.name}</span>

                <DialogClose asChild>
                  <Button variant="ghost" size="sm" className="w-8 h-8 p-0">
                    <X className="w-4 h-4" />
                  </Button>
                </DialogClose>
              </div>
            </DialogTitle>
          </DialogHeader>
          <div className="relative flex-1 w-full h-full flex items-center justify-center p-4">
            {isLoadingPage ? (
              <div className="text-gray-500">Loading page...</div>
            ) : (
              <div className="relative flex items-center justify-center w-full h-full">
                {/* Previous Page Button */}
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

                {/* PDF Page */}
                <div className="bg-white shadow-lg max-h-full">
                  {currentPageImage && (
                    <img
                      src={currentPageImage}
                      alt={`Page ${currentPage}`}
                      className="max-w-full max-h-[70vh] object-contain"
                      style={{
                        transform: `rotate(${
                          rotation[zoomedFile?.id] || 0
                        }deg)`,
                      }}
                    />
                  )}
                </div>

                {/* Next Page Button */}
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
              </div>
            )}
          </div>
          <span className="flex items-center justify-center text-sm text-gray-500">
            Page {currentPage} of {zoomedFile?.pages}
          </span>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default PDFMerge;
