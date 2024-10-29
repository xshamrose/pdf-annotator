import React, { useState, useEffect } from "react";
import { Plus, RotateCcw, RotateCw, Trash2, FileText } from "lucide-react";
import { Button } from "../ui/button";
// import { Card, CardContent } from "../ui/card";
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
  TooltipProvider,
} from "../ui/tooltip";
import * as pdfjsLib from "pdfjs-dist";

// Initialize PDF.js worker
pdfjsLib.GlobalWorkerOptions.workerSrc = `//cdnjs.cloudflare.com/ajax/libs/pdf.js/${pdfjsLib.version}/pdf.worker.min.js`;

const PDFMerge = () => {
  const [files, setFiles] = useState([]);
  const [rotation, setRotation] = useState({});

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
        <Button className="bg-blue-600 hover:bg-blue-700 text-white">
          Finish
        </Button>
      </div>
      {/* File Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 xl:grid-cols-5 gap-4">
        {files.map((file, index) => (
          <div
            key={file.id}
            className="group relative bg-white rounded-lg border border-gray-200 hover:shadow-lg transition-shadow duration-200"
          >
            <div className="aspect-[3/4] relative bg-gray-50 rounded-t-lg">
              {file.preview ? (
                <img
                  src={file.preview}
                  alt={file.file.name}
                  className="w-full h-full object-contain transition-transform duration-200 rounded-t-lg"
                  style={{
                    transform: `rotate(${rotation[file.id] || 0}deg)`,
                  }}
                />
              ) : (
                <div className="w-full h-full flex items-center justify-center">
                  <FileText className="w-12 h-12 text-gray-400" />
                </div>
              )}

              {/* File Number Badge */}
              <div className="absolute left-2 top-2 bg-white/90 rounded-full w-6 h-6 flex items-center justify-center text-sm font-medium text-gray-700">
                {index + 1}
              </div>

              {/* Hover Actions */}
              <div className="absolute inset-0 bg-black/50 opacity-0 group-hover:opacity-100 transition-opacity duration-200 rounded-t-lg">
                <div className="absolute top-2 right-2 flex gap-2">
                  <button
                    className="p-1.5 rounded-lg bg-white/10 hover:bg-white/20 transition-colors"
                    onClick={(e) => {
                      e.stopPropagation();
                      handleSingleRotate(file.id, "left");
                    }}
                  >
                    <RotateCcw className="w-4 h-4 text-white" />
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
                      handleDelete(file.id);
                    }}
                  >
                    <Trash2 className="w-4 h-4 text-white" />
                  </button>
                </div>
              </div>
            </div>

            {/* File Info */}
            <div className="p-3 border-t">
              <p className="truncate text-sm font-medium text-gray-700">
                {file.file.name}
              </p>
              <div className="flex items-center gap-2 mt-1">
                <span className="inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium bg-gray-100 text-gray-600">
                  {file.pages} page{file.pages !== 1 ? "s" : ""}
                </span>
                <span className="text-xs text-gray-500">
                  {(file.file.size / 1024 / 1024).toFixed(1)} MB
                </span>
              </div>
            </div>
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
    </div>
  );
};

export default PDFMerge;
