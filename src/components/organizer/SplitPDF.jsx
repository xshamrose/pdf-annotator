import React, { useState, useCallback } from "react";
import { PDFDocument } from "pdf-lib";
import { useNavigate } from "react-router-dom";
import { Upload, Scissors, Plus, FileText } from "lucide-react";
import * as pdfjs from "pdfjs-dist";

// Initialize PDF.js worker
pdfjs.GlobalWorkerOptions.workerSrc = `//cdnjs.cloudflare.com/ajax/libs/pdf.js/${pdfjs.version}/pdf.worker.min.js`;

const PdfSplitter = () => {
  const [pdfPages, setPdfPages] = useState([]);
  const [splitPoints, setSplitPoints] = useState(new Set());
  const [splitAfterEvery, setSplitAfterEvery] = useState(1);
  const [splitEveryEnabled, setSplitEveryEnabled] = useState(false);
  const [isDragging, setIsDragging] = useState(false);
  const [fileNames, setFileNames] = useState([]);
  const [pdfDocuments, setPdfDocuments] = useState([]);
  const [isProcessing, setIsProcessing] = useState(false);
  const navigate = useNavigate();

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

      const renderContext = {
        canvasContext: context,
        viewport: scaledViewport,
      };

      await page.render(renderContext).promise;
      return canvas.toDataURL();
    } catch (error) {
      console.error("Error generating thumbnail:", error);
      return null;
    }
  };

  const toggleSplitPoint = (pageIndex) => {
    const newSplitPoints = new Set(splitPoints);
    if (newSplitPoints.has(pageIndex)) {
      newSplitPoints.delete(pageIndex);
    } else {
      newSplitPoints.add(pageIndex);
    }
    setSplitPoints(newSplitPoints);
  };

  const handleSplitEveryToggle = (checked) => {
    setSplitEveryEnabled(checked);
    if (checked) {
      const newSplitPoints = new Set();
      for (
        let i = splitAfterEvery - 1;
        i < pdfPages.length - 1;
        i += splitAfterEvery
      ) {
        newSplitPoints.add(i);
      }
      setSplitPoints(newSplitPoints);
    } else {
      setSplitPoints(new Set());
    }
  };

  const handleSplitAfterEveryChange = (value) => {
    const newValue = Math.max(1, value);
    setSplitAfterEvery(newValue);
    if (splitEveryEnabled) {
      const newSplitPoints = new Set();
      for (let i = newValue - 1; i < pdfPages.length - 1; i += newValue) {
        newSplitPoints.add(i);
      }
      setSplitPoints(newSplitPoints);
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

  const handleDrop = useCallback(
    (e) => {
      e.preventDefault();
      setIsDragging(false);
      const files = Array.from(e.dataTransfer.files);
      const pdfFiles = files.filter((file) => file.type === "application/pdf");
      if (pdfFiles.length > 0) {
        handleFileUpload(pdfFiles, pdfPages.length > 0);
      }
    },
    [pdfPages.length]
  );

  const handleFileInputChange = (e, shouldAppend = false) => {
    const files = Array.from(e.target.files);
    const pdfFiles = files.filter((file) => file.type === "application/pdf");
    if (pdfFiles.length > 0) {
      handleFileUpload(pdfFiles, shouldAppend);
    }
  };

  const getSplitCount = () => {
    return splitPoints.size + 1;
  };

  const handleFileUpload = async (files, shouldAppend = false) => {
    try {
      setIsProcessing(true);
      const newPages = [];
      const newPdfDocuments = [];
      const newFileNames = [];

      for (const file of files) {
        if (file.type !== "application/pdf") continue;

        const arrayBuffer = await file.arrayBuffer();
        const pdfDoc = await PDFDocument.load(arrayBuffer);
        newPdfDocuments.push({ bytes: arrayBuffer, name: file.name });
        newFileNames.push(file.name);

        const pageCount = pdfDoc.getPageCount();
        const batchSize = 5;

        for (let i = 0; i < pageCount; i += batchSize) {
          const batch = await Promise.all(
            Array.from(
              { length: Math.min(batchSize, pageCount - i) },
              async (_, index) => {
                const pageIndex = i + index;
                const thumbnail = await generateThumbnail(file, pageIndex + 1);
                return {
                  pageNumber: pageIndex + 1,
                  fileName: `${file.name.replace(".pdf", "")}_${pageIndex + 1}`,
                  source: file.name,
                  thumbnail,
                  originalFile: file.name,
                  originalPageIndex: pageIndex,
                };
              }
            )
          );
          newPages.push(...batch);
        }
      }

      setPdfPages((prevPages) =>
        shouldAppend ? [...prevPages, ...newPages] : newPages
      );
      setPdfDocuments((prevDocs) =>
        shouldAppend ? [...prevDocs, ...newPdfDocuments] : newPdfDocuments
      );
      setFileNames((prevNames) =>
        shouldAppend ? [...prevNames, ...newFileNames] : newFileNames
      );

      if (!shouldAppend) {
        setSplitPoints(new Set());
      }
    } catch (error) {
      console.error("Error loading PDFs:", error);
    } finally {
      setIsProcessing(false);
    }
  };

  const splitPDF = async () => {
    try {
      setIsProcessing(true);
      if (pdfDocuments.length === 0) {
        throw new Error("No PDF files loaded");
      }

      const splitResults = [];
      let currentStartPage = 0;
      const splitPointsArray = Array.from(splitPoints).sort((a, b) => a - b);

      if (!splitPointsArray.includes(pdfPages.length - 1)) {
        splitPointsArray.push(pdfPages.length - 1);
      }

      const mergedPdf = await PDFDocument.create();
      for (const doc of pdfDocuments) {
        const sourcePdf = await PDFDocument.load(doc.bytes);
        const pages = await mergedPdf.copyPages(
          sourcePdf,
          sourcePdf.getPageIndices()
        );
        pages.forEach((page) => mergedPdf.addPage(page));
      }

      for (let i = 0; i < splitPointsArray.length; i++) {
        const endPage = splitPointsArray[i];
        const newPdfDoc = await PDFDocument.create();

        const pageIndices = [];
        for (let pageNum = currentStartPage; pageNum <= endPage; pageNum++) {
          pageIndices.push(pageNum);
        }

        const pages = await newPdfDoc.copyPages(mergedPdf, pageIndices);
        pages.forEach((page) => newPdfDoc.addPage(page));

        const newPdfBytes = await newPdfDoc.save();
        const blob = new Blob([newPdfBytes], { type: "application/pdf" });

        splitResults.push({
          name: `split_part${i + 1}.pdf`,
          pages: pageIndices.length,
          size: `${(blob.size / (1024 * 1024)).toFixed(1)} MB`,
          url: URL.createObjectURL(blob),
        });

        currentStartPage = endPage + 1;
      }

      navigate("/organize/split/results", {
        state: { splitFiles: splitResults, isProcessing: false },
      });
    } catch (error) {
      console.error("Error splitting PDFs:", error);
    } finally {
      setIsProcessing(false);
    }
  };

  return (
    <div className="max-w-7xl mx-auto p-4 space-y-6">
      {isProcessing && (
        <div className="fixed inset-0 bg-white bg-opacity-80 flex items-center justify-center z-50">
          <div className="text-center">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mb-4"></div>
            <p className="text-gray-600">Processing PDF...</p>
          </div>
        </div>
      )}

      {pdfPages.length > 0 && (
        <div className="flex items-center justify-between mb-6">
          <div className="flex gap-2">
            <label
              htmlFor="pdf-upload"
              className="inline-flex items-center gap-1 px-4 py-2 bg-white border rounded-md hover:bg-gray-50 cursor-pointer"
            >
              <Upload className="w-4 h-4" />
              Add New
            </label>
            <input
              type="file"
              accept=".pdf"
              onChange={(e) => handleFileInputChange(e, false)}
              className="hidden"
              id="pdf-upload"
            />
          </div>

          <div className="flex items-center gap-4">
            <label className="flex items-center gap-2">
              <input
                type="checkbox"
                className="w-4 h-4"
                checked={splitEveryEnabled}
                onChange={(e) => handleSplitEveryToggle(e.target.checked)}
              />
              Split after every
            </label>
            <div className="flex items-center gap-2">
              <button
                className="px-2 py-1 border rounded"
                onClick={() => handleSplitAfterEveryChange(splitAfterEvery - 1)}
              >
                -
              </button>
              <input
                type="number"
                value={splitAfterEvery}
                onChange={(e) =>
                  handleSplitAfterEveryChange(parseInt(e.target.value) || 1)
                }
                className="w-16 px-2 py-1 border rounded text-center"
              />
              <button
                className="px-2 py-1 border rounded"
                onClick={() => handleSplitAfterEveryChange(splitAfterEvery + 1)}
              >
                +
              </button>
            </div>
            <span>pages</span>
            <button
              className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-md"
              onClick={splitPDF}
            >
              <span className="flex items-center gap-2">
                <Scissors className="w-4 h-4" />
                Split ({getSplitCount()} PDFs)
              </span>
            </button>
          </div>
        </div>
      )}

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 xl:grid-cols-5 gap-8 relative">
        {pdfPages.map((page, index) => (
          <div key={index} className="relative">
            <div className="group bg-white rounded-lg border border-gray-200 hover:shadow-lg transition-shadow duration-200">
              <div className="aspect-[3/4] relative bg-gray-50 rounded-t-lg overflow-hidden">
                <div className="absolute inset-0 flex items-center justify-center">
                  {page.thumbnail ? (
                    <img
                      src={page.thumbnail}
                      alt={`Page ${page.pageNumber}`}
                      className="w-[70%] h-[70%] object-contain"
                    />
                  ) : (
                    <div className="w-full h-full flex items-center justify-center">
                      <FileText className="w-12 h-12 text-gray-400" />
                    </div>
                  )}
                </div>
                <div className="px-2 text-xs font-medium bg-black/10 text-gray-700">
                  {page.fileName}
                </div>
                <div className="absolute left-2 top-5 bg-white/90 rounded-full w-6 h-6 flex items-center justify-center text-sm font-medium text-gray-700">
                  {index + 1}
                </div>
              </div>
            </div>

            {index < pdfPages.length - 1 && (
              <button
                onClick={() => toggleSplitPoint(index)}
                className={`absolute -right-4 top-1/2 transform -translate-y-1/2 translate-x-1/2 w-8 h-8 rounded-full flex items-center justify-center z-10 ${
                  splitPoints.has(index)
                    ? "bg-blue-500 text-white"
                    : "bg-white text-gray-400 border border-gray-200"
                } hover:scale-110 transition-all duration-200 shadow-lg`}
              >
                <Scissors className="w-4 h-4" />
              </button>
            )}
          </div>
        ))}
        {/* Add Files Card */}
        <div
          className={`aspect-[3/4] flex flex-col items-center justify-center border-2 border-dashed rounded-xl transition-colors bg-gray-50 cursor-pointer
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
            onChange={(e) => handleFileInputChange(e, pdfPages.length > 0)}
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

export default PdfSplitter;
