import React, { useEffect, useState } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import { Download, Share2, ArrowLeft } from "lucide-react";
import { Button } from "../ui/button";

const LoadingState = () => (
  <div className="fixed inset-0 bg-white bg-opacity-80 flex items-center justify-center z-50">
    <div className="text-center">
      <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mb-4"></div>
      <p className="text-gray-600">Loading extracted files...</p>
    </div>
  </div>
);

const ExtractResultsPage = () => {
  const location = useLocation();
  const navigate = useNavigate();
  const [isLoading, setIsLoading] = useState(true);
  const [extractedFiles, setExtractedFiles] = useState([]);

  useEffect(() => {
    if (location.state?.extractedFiles) {
      setExtractedFiles(location.state.extractedFiles);
      setIsLoading(false);
    } else {
      // If no files found, redirect back to extractor
      navigate("/organize/extract");
    }
  }, [location.state, navigate]);

  const downloadFile = (file) => {
    const link = document.createElement("a");
    link.href = file.url;
    link.download = file.name;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const downloadAll = () => {
    extractedFiles.forEach((file) => {
      downloadFile(file);
    });
  };

  if (isLoading) {
    return <LoadingState />;
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-6xl mx-auto p-6">
        <div className="flex items-center gap-4 mb-6">
          <Button
            variant="ghost"
            className="flex items-center gap-2"
            onClick={() => navigate("/organize/extract")}
          >
            <ArrowLeft className="w-4 h-4" />
            Back
          </Button>
        </div>

        <div className="bg-white rounded-lg shadow-sm p-6">
          <div className="flex items-center gap-3 mb-6">
            <div className="w-6 h-6 rounded-full bg-green-50 flex items-center justify-center">
              <span className="text-green-600 text-lg">✓</span>
            </div>
            <span className="font-semibold text-gray-900">
              Extraction Complete
            </span>
          </div>

          <div className="space-y-4 mb-6">
            {extractedFiles.map((file, index) => (
              <div
                key={index}
                className="flex items-center justify-between p-4 border rounded-lg hover:bg-gray-50"
              >
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 bg-red-50 rounded flex items-center justify-center">
                    <span className="text-red-600 text-sm">PDF</span>
                  </div>
                  <div>
                    <h3 className="font-medium text-gray-900">{file.name}</h3>
                    <p className="text-sm text-gray-500">
                      {file.size} · {file.pages} pages
                    </p>
                  </div>
                </div>
                <Button
                  size="sm"
                  variant="ghost"
                  onClick={() => downloadFile(file)}
                >
                  <Download className="w-4 h-4" />
                </Button>
              </div>
            ))}
          </div>

          <div className="flex gap-3">
            <Button
              className="flex-1 bg-blue-600 hover:bg-blue-700"
              onClick={downloadAll}
            >
              <Download className="w-4 h-4 mr-2" />
              Download All
            </Button>
            <Button variant="outline" className="flex-1">
              <Share2 className="w-4 h-4 mr-2" />
              Share
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ExtractResultsPage;
