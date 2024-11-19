import React, { useState } from "react";
import { useLocation } from "react-router-dom";
import {
  Upload,
  FileText,
  File,
  Image,
  FileSpreadsheet,
  Presentation,
} from "lucide-react";
import { Card, CardContent } from "../ui/card";

const ConversionTypes = {
  "to-pdf": {
    title: "PDF Converter",
    icon: File,
    description: "Convert any file to PDF format",
    formats: ["DOC", "DOCX", "XLS", "XLSX", "PPT", "PPTX", "JPG", "PNG"],
  },
  word: {
    title: "PDF ↔ Word",
    icon: FileText,
    description: "Convert between PDF and Word documents",
    formats: ["PDF", "DOC", "DOCX"],
  },
  powerpoint: {
    title: "PDF ↔ PowerPoint",
    icon: Presentation,
    description: "Convert between PDF and PowerPoint presentations",
    formats: ["PDF", "PPT", "PPTX"],
  },
  excel: {
    title: "PDF ↔ Excel",
    icon: FileSpreadsheet,
    description: "Convert between PDF and Excel spreadsheets",
    formats: ["PDF", "XLS", "XLSX"],
  },
  image: {
    title: "PDF ↔ Image",
    icon: Image,
    description: "Convert between PDF and image formats",
    formats: ["PDF", "JPG", "PNG", "TIFF"],
  },
};

const PDFConverterPage = () => {
  const location = useLocation();
  const [files, setFiles] = useState([]);
  const [isUploading, setIsUploading] = useState(false);
  const [showOptions, setShowOptions] = useState(false);

  // Get the conversion type from the current path
  const conversionType = location.pathname.split("/").pop();
  const currentConverter =
    ConversionTypes[conversionType] || ConversionTypes["to-pdf"];

  const handleFileChange = (e) => {
    const selectedFiles = Array.from(e.target.files);
    setFiles(selectedFiles);
    setIsUploading(true);

    // Simulate upload process
    setTimeout(() => {
      setIsUploading(false);
      setShowOptions(true);
    }, 1500);
  };

  const handleDragOver = (e) => {
    e.preventDefault();
    e.stopPropagation();
  };

  const handleDrop = (e) => {
    e.preventDefault();
    e.stopPropagation();
    const droppedFiles = Array.from(e.dataTransfer.files);
    setFiles(droppedFiles);
    setIsUploading(true);

    // Simulate upload process
    setTimeout(() => {
      setIsUploading(false);
      setShowOptions(true);
    }, 1500);
  };

  return (
    <div className="flex p-6 bg-gray-100">
      <div className="w-full mx-auto">
        <div className="mb-6">
          <h1 className="text-2xl font-bold text-gray-900 flex items-center gap-2">
            <currentConverter.icon className="w-6 h-6" />
            {currentConverter.title}
          </h1>
          <p className="text-gray-600 mt-1">{currentConverter.description}</p>
        </div>

        {!showOptions ? (
          <Card className="border-2 border-dashed border-gray-300 bg-white">
            <CardContent>
              <div
                className="flex flex-col items-center justify-center py-12"
                onDragOver={handleDragOver}
                onDrop={handleDrop}
              >
                {isUploading ? (
                  <div className="text-center">
                    <div className="w-16 h-16 mx-auto mb-4">
                      <img
                        src="/api/placeholder/64/64"
                        alt="PDF icon"
                        className="w-full h-full"
                      />
                    </div>
                    <p className="text-lg font-medium text-gray-900">
                      Working...
                    </p>
                    <p className="text-sm text-gray-500 mt-1">
                      This might take a few seconds.
                    </p>
                  </div>
                ) : (
                  <>
                    <div className="w-16 h-16 mb-4 bg-blue-50 rounded-full flex items-center justify-center">
                      <Upload className="w-8 h-8 text-blue-600" />
                    </div>
                    <h3 className="text-lg font-medium text-gray-900 mb-2">
                      Drop your files here or click to upload
                    </h3>
                    <p className="text-sm text-gray-500 mb-4">
                      Supported formats: {currentConverter.formats.join(", ")}
                    </p>
                    <label className="inline-flex items-center px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 cursor-pointer">
                      <span>Select files</span>
                      <input
                        type="file"
                        className="hidden"
                        multiple
                        onChange={handleFileChange}
                        accept={currentConverter.formats
                          .map((format) => `.${format.toLowerCase()}`)
                          .join(",")}
                      />
                    </label>
                  </>
                )}
              </div>
            </CardContent>
          </Card>
        ) : (
          <Card className="bg-white">
            <CardContent className="p-6">
              <div className="flex items-center justify-between mb-6">
                <div className="flex items-center gap-4">
                  <div className="w-12 h-12">
                    <img
                      src="/api/placeholder/48/48"
                      alt="File preview"
                      className="w-full h-full rounded"
                    />
                  </div>
                  <div>
                    <h3 className="font-medium text-gray-900">
                      {files[0]?.name || "Selected file"}
                    </h3>
                    <p className="text-sm text-gray-500">
                      {files[0]?.size
                        ? `${(files[0].size / 1024).toFixed(1)} KB`
                        : ""}
                    </p>
                  </div>
                </div>
                <button
                  onClick={() => {
                    setFiles([]);
                    setShowOptions(false);
                  }}
                  className="text-sm text-gray-500 hover:text-gray-700"
                >
                  Remove
                </button>
              </div>

              <div className="space-y-4">
                <h4 className="font-medium text-gray-900">Convert to:</h4>
                <div className="grid grid-cols-1 gap-3">
                  {currentConverter.formats
                    .filter((format) => format !== "PDF")
                    .map((format) => (
                      <button
                        key={format}
                        className="flex items-center justify-between p-4 border rounded-lg hover:bg-gray-50"
                      >
                        <div className="flex items-center gap-3">
                          <div className="w-10 h-10 bg-gray-100 rounded-lg flex items-center justify-center">
                            <FileText className="w-5 h-5 text-gray-600" />
                          </div>
                          <span className="font-medium text-gray-900">
                            {format}
                          </span>
                        </div>
                        <svg
                          className="w-5 h-5 text-gray-400"
                          fill="none"
                          viewBox="0 0 24 24"
                          stroke="currentColor"
                        >
                          <path
                            strokeLinecap="round"
                            strokeLinejoin="round"
                            strokeWidth={2}
                            d="M9 5l7 7-7 7"
                          />
                        </svg>
                      </button>
                    ))}
                </div>
              </div>
            </CardContent>
          </Card>
        )}
      </div>
    </div>
  );
};

export default PDFConverterPage;
