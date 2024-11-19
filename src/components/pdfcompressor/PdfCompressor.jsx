import React, { useState, useCallback } from "react";
import { Upload, FileDown, RotateCw } from "lucide-react";
import { Card, CardContent } from "../ui/card";
import { Button } from "../ui/button";
import * as pdfjsLib from "pdfjs-dist";

pdfjsLib.GlobalWorkerOptions.workerSrc = `//cdnjs.cloudflare.com/ajax/libs/pdf.js/${pdfjsLib.version}/pdf.worker.js`;

const CompressionOptions = {
  HIGH: { quality: 0.9, label: "High Quality", reduction: "25%" },
  STANDARD: { quality: 0.7, label: "Standard", reduction: "50%" },
  LOW: { quality: 0.5, label: "Low Quality", reduction: "75%" },
};

const PdfCompress = () => {
  const [file, setFile] = useState(null);
  const [compressedFile, setCompressedFile] = useState(null);
  const [preview, setPreview] = useState(null);
  const [compressedPreview, setCompressedPreview] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [stats, setStats] = useState(null);
  const [showCompressedPreview, setShowCompressedPreview] = useState(false);

  const generatePreview = async (pdfFile) => {
    try {
      const arrayBuffer = await pdfFile.arrayBuffer();
      const pdf = await pdfjsLib.getDocument(arrayBuffer).promise;
      const page = await pdf.getPage(1);
      const viewport = page.getViewport({ scale: 1 });

      const canvas = document.createElement("canvas");
      const context = canvas.getContext("2d");
      canvas.width = viewport.width;
      canvas.height = viewport.height;

      await page.render({
        canvasContext: context,
        viewport: viewport,
      }).promise;

      setPreview(canvas.toDataURL());
    } catch (err) {
      setError("Error generating preview");
    }
  };

  const handleDrop = useCallback((e) => {
    e.preventDefault();
    const droppedFile = e.dataTransfer?.files[0] || e.target.files[0];

    if (droppedFile?.type === "application/pdf") {
      setFile(droppedFile);
      generatePreview(droppedFile);
      setError(null);
      setShowCompressedPreview(false);
      setCompressedPreview(null);
      setCompressedFile(null);
      setStats(null);
    } else {
      setError("Please upload a PDF file");
    }
  }, []);

  const compressPDF = async (quality) => {
    if (!file) return;

    setLoading(true);
    try {
      const arrayBuffer = await file.arrayBuffer();
      const pdf = await pdfjsLib.getDocument(arrayBuffer).promise;
      const compressedPages = [];

      for (let pageNum = 1; pageNum <= pdf.numPages; pageNum++) {
        const page = await pdf.getPage(pageNum);
        const viewport = page.getViewport({ scale: 1 });

        const canvas = document.createElement("canvas");
        const context = canvas.getContext("2d");
        canvas.width = viewport.width;
        canvas.height = viewport.height;

        await page.render({
          canvasContext: context,
          viewport: viewport,
        }).promise;

        compressedPages.push(canvas.toDataURL("image/jpeg", quality));
      }

      const compressedBlob = new Blob(compressedPages, {
        type: "application/pdf",
      });
      setCompressedFile(compressedBlob);
      setCompressedPreview(compressedPages[0]);
      setShowCompressedPreview(true);

      setStats({
        originalSize: file.size,
        compressedSize: compressedBlob.size,
        reduction: (
          ((file.size - compressedBlob.size) / file.size) *
          100
        ).toFixed(1),
      });
    } catch (err) {
      setError("Compression failed. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gray-100 p-6">
      <div className="max-w-full mx-auto bg-white p-8 rounded-lg shadow-lg">
        <div className="flex items-center justify-between mb-8">
          <h1 className="text-3xl font-bold text-gray-900">Compress PDF</h1>
          <Button variant="outline" onClick={() => window.location.reload()}>
            <RotateCw className="w-4 h-4 mr-2" />
            Start over
          </Button>
        </div>

        {!file ? (
          <Card className="border-dashed border-2 border-gray-300 p-12">
            <CardContent className="flex flex-col items-center justify-center">
              <input
                type="file"
                accept="application/pdf"
                onChange={handleDrop}
                className="hidden"
                id="pdf-upload"
              />
              <label
                htmlFor="pdf-upload"
                className="flex flex-col items-center cursor-pointer"
              >
                <Upload className="w-16 h-16 text-gray-400 mb-4" />
                <p className="text-xl mb-2 text-gray-700">
                  Drop your PDF here or click to upload
                </p>
                <p className="text-sm text-gray-500">Maximum file size: 10MB</p>
              </label>
            </CardContent>
          </Card>
        ) : (
          <div className="grid grid-cols-2 gap-6">
            {/* Left Side - Preview */}
            <Card className="shadow-md">
              <CardContent className="p-6">
                <h2 className="text-xl font-semibold mb-4 text-gray-800">
                  {showCompressedPreview
                    ? "Compressed Preview"
                    : "Original PDF"}
                </h2>
                <div className="aspect-[210/297] bg-white rounded-lg overflow-hidden shadow-inner mb-4">
                  <img
                    src={showCompressedPreview ? compressedPreview : preview}
                    alt={
                      showCompressedPreview
                        ? "Compressed Preview"
                        : "Original Preview"
                    }
                    className="w-full h-full object-contain"
                  />
                </div>
              </CardContent>
            </Card>

            {/* Right Side - Compression Options or Result */}
            <Card className="shadow-md">
              <CardContent className="p-6">
                {!compressedFile ? (
                  <div>
                    <h2 className="text-xl font-semibold mb-4 text-gray-800">
                      Choose Compression Level
                    </h2>
                    <div className="space-y-4">
                      {Object.entries(CompressionOptions).map(
                        ([key, option]) => (
                          <Button
                            key={key}
                            onClick={() => compressPDF(option.quality)}
                            disabled={loading}
                            className="w-full justify-between bg-blue-500 text-white hover:bg-green-600"
                          >
                            <span>{option.label}</span>
                            <span className="text-sm opacity-70">
                              Expected reduction: {option.reduction}
                            </span>
                          </Button>
                        )
                      )}
                    </div>
                  </div>
                ) : (
                  <div>
                    <h2 className="text-xl font-semibold mb-4 text-gray-800">
                      Compression Results
                    </h2>
                    <div className="space-y-3 mb-6">
                      <div className="flex justify-between items-center p-3 bg-gray-50 rounded">
                        <span className="text-gray-600">Original Size</span>
                        <span className="font-medium">
                          {(stats.originalSize / 1024).toFixed(1)} KB
                        </span>
                      </div>
                      <div className="flex justify-between items-center p-3 bg-gray-50 rounded">
                        <span className="text-gray-600">Compressed Size</span>
                        <span className="font-medium">
                          {(stats.compressedSize / 1024).toFixed(1)} KB
                        </span>
                      </div>
                      <div className="flex justify-between items-center p-3 bg-green-50 rounded">
                        <span className="text-green-600">Size Reduction</span>
                        <span className="font-medium text-green-600">
                          {stats.reduction}%
                        </span>
                      </div>
                    </div>
                    <Button
                      className="w-full bg-blue-500 text-white hover:bg-blue-600"
                      onClick={() => {
                        const url = URL.createObjectURL(compressedFile);
                        const a = document.createElement("a");
                        a.href = url;
                        a.download = "compressed.pdf";
                        a.click();
                      }}
                    >
                      <FileDown className="w-4 h-4 mr-2" />
                      Download Compressed PDF
                    </Button>
                  </div>
                )}
              </CardContent>
            </Card>
          </div>
        )}
      </div>
    </div>
  );
};

export default PdfCompress;
