import React, { useState, useCallback } from "react";
import { PDFDocument } from "pdf-lib";
import { Upload, Scissors } from "lucide-react";

const PdfSplitter = () => {
  const [pdfPages, setPdfPages] = useState([]);
  const [splitAfter, setSplitAfter] = useState(1);
  const [isDragging, setIsDragging] = useState(false);
  const [fileName, setFileName] = useState("");

  const handleFileUpload = async (file) => {
    try {
      const arrayBuffer = await file.arrayBuffer();
      const pdfDoc = await PDFDocument.load(arrayBuffer);
      const pageCount = pdfDoc.getPageCount();

      // Create preview data for each page
      const pages = Array.from({ length: pageCount }, (_, i) => ({
        pageNumber: i + 1,
        fileName: `${file.name.replace(".pdf", "")}_${i + 1}`,
      }));

      setPdfPages(pages);
      setFileName(file.name);
    } catch (error) {
      console.error("Error loading PDF:", error);
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

    const file = e.dataTransfer.files[0];
    if (file?.type === "application/pdf") {
      handleFileUpload(file);
    }
  }, []);

  const handleFileInputChange = (e) => {
    const file = e.target.files[0];
    if (file?.type === "application/pdf") {
      handleFileUpload(file);
    }
  };

  return (
    <div className="w-full max-w-6xl mx-auto p-6">
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center space-x-4">
          <button className="px-4 py-2 bg-white border rounded-md hover:bg-gray-50">
            <span className="flex items-center gap-2">
              <Upload size={20} />
              Add
            </span>
          </button>
        </div>

        {pdfPages.length > 0 && (
          <div className="flex items-center gap-4">
            <label className="flex items-center gap-2">
              <input type="checkbox" className="w-4 h-4" />
              Split after every
            </label>
            <div className="flex items-center gap-2">
              <button
                className="px-2 py-1 border rounded"
                onClick={() => setSplitAfter((prev) => Math.max(1, prev - 1))}
              >
                -
              </button>
              <input
                type="number"
                value={splitAfter}
                onChange={(e) =>
                  setSplitAfter(Math.max(1, parseInt(e.target.value) || 1))
                }
                className="w-16 px-2 py-1 border rounded text-center"
              />
              <button
                className="px-2 py-1 border rounded"
                onClick={() => setSplitAfter((prev) => prev + 1)}
              >
                +
              </button>
            </div>
            <span>pages</span>
            <button className="px-4 py-2 bg-blue-500 text-white rounded-md hover:bg-blue-600">
              <span className="flex items-center gap-2">
                <Scissors size={20} />
                Split ({Math.ceil(pdfPages.length / splitAfter)} PDFs)
              </span>
            </button>
          </div>
        )}
      </div>

      {pdfPages.length === 0 ? (
        <div
          className={`border-2 border-dashed rounded-lg p-8 text-center ${
            isDragging ? "border-blue-500 bg-blue-50" : "border-gray-300"
          }`}
          onDragOver={handleDragOver}
          onDragLeave={handleDragLeave}
          onDrop={handleDrop}
        >
          <input
            type="file"
            accept=".pdf"
            onChange={handleFileInputChange}
            className="hidden"
            id="pdf-upload"
          />
          <label
            htmlFor="pdf-upload"
            className="cursor-pointer flex flex-col items-center gap-4"
          >
            <Upload size={48} className="text-gray-400" />
            <div className="text-gray-600">
              <span className="text-blue-500 font-medium">Click to upload</span>{" "}
              or drag and drop
            </div>
            <div className="text-sm text-gray-500">PDF (up to 50MB)</div>
          </label>
        </div>
      ) : (
        <div className="grid grid-cols-5 gap-4">
          {pdfPages.map((page, index) => (
            <div
              key={index}
              className="relative bg-gray-50 border rounded-lg p-4 aspect-[3/4] flex flex-col"
            >
              <div className="flex-1 bg-white border rounded-md mb-2 flex items-center justify-center">
                <img
                  src="/api/placeholder/150/200"
                  alt={`Page ${page.pageNumber}`}
                  className="max-w-full max-h-full object-contain"
                />
              </div>
              <div className="text-sm text-gray-600 truncate">
                {page.fileName}
              </div>
              {(index + 1) % splitAfter === 0 &&
                index !== pdfPages.length - 1 && (
                  <div className="absolute -right-6 top-1/2 transform -translate-y-1/2">
                    <Scissors className="text-blue-500" size={24} />
                  </div>
                )}
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

export default PdfSplitter;
