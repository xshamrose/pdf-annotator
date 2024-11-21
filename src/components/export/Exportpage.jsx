/* eslint-disable react-hooks/exhaustive-deps */
import React, { useState, useEffect } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import { Button } from "../ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "../ui/dropdown-menu";
import { ArrowLeft, Download, Share2, FileDown } from "lucide-react";
import {
  saveAsPDF,
  saveAsWord,
  saveAsPowerPoint,
  // saveAsExcel,
  saveAsImage,
} from "../../utils/exportUtils";
import { toast } from "../ui/toast";

// Loading state component
const LoadingState = () => (
  <div className="flex items-center justify-center h-full">
    <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
  </div>
);

const ExportPage = () => {
  const location = useLocation();
  const navigate = useNavigate();
  const [isLoading, setIsLoading] = useState(true);
  const [previewUrl, setPreviewUrl] = useState("");
  const [isExporting, setIsExporting] = useState(false);
  const {
    file,
    fileName = "merged-document",
    fileSize = "3 MB",
    pageCount = "10",
  } = location.state || {};

  useEffect(() => {
    const setupPreview = async () => {
      if (!file) {
        setIsLoading(false);
        return;
      }

      try {
        // Create a blob URL from the file for preview
        const blob = new Blob([file], { type: "application/pdf" });
        const url = URL.createObjectURL(blob);
        setPreviewUrl(url);
      } catch (error) {
        console.error("Error creating preview:", error);
        toast({
          title: "Error",
          description: "Failed to load preview",
          variant: "destructive",
        });
      } finally {
        setIsLoading(false);
      }
    };

    setupPreview();

    // Cleanup function to revoke the blob URL
    return () => {
      if (previewUrl) {
        URL.revokeObjectURL(previewUrl);
      }
    };
  }, [file]);

  const handleDownload = async () => {
    if (!file) {
      toast({
        title: "Error",
        description: "No file available for download",
        variant: "destructive",
      });
      return;
    }

    const success = await saveAsPDF(file, fileName);
    if (success) {
      toast({
        title: "Success",
        description: "File downloaded successfully",
      });
    } else {
      toast({
        title: "Error",
        description: "Failed to download file",
        variant: "destructive",
      });
    }
  };

  const handleExportAs = async (format) => {
    if (!file) {
      toast({
        title: "Error",
        description: "No file available for export",
        variant: "destructive",
      });
      return;
    }

    setIsExporting(true);
    let success = false;

    try {
      switch (format) {
        case "word":
          success = await saveAsWord(file, fileName);
          break;
        case "powerpoint":
          success = await saveAsPowerPoint(file, fileName);
          break;
        // case "excel":
        //   success = await saveAsExcel(file, fileName);
        //   break;
        case "image":
          success = await saveAsImage(file, fileName);
          break;
        case "compress":
          success = await saveAsPDF(file, `${fileName}-compressed`);
          break;
        default:
          throw new Error("Unsupported format");
      }

      if (success) {
        toast({
          title: "Success",
          description: `File exported as ${format.toUpperCase()} successfully`,
        });
      }
    } catch (error) {
      toast({
        title: "Error",
        description: `Failed to export as ${format.toUpperCase()}`,
        variant: "destructive",
      });
    } finally {
      setIsExporting(false);
    }
  };

  // If no file is available, show a message
  if (!file) {
    return (
      <div className="flex items-center justify-center h-screen">
        <div className="text-center">
          <p className="text-gray-500 mb-4">No file selected</p>
          <Button onClick={() => navigate("/organize/merge")}>Go Back</Button>
        </div>
      </div>
    );
  }

  const exportOptions = [
    { icon: "📄", label: "Compress PDF", value: "compress", extension: "pdf" },
    { icon: "📝", label: "Word Document", value: "word", extension: "docx" },
    // {
    //   icon: "📊",
    //   label: "Excel Spreadsheet",
    //   value: "excel",
    //   extension: "xlsx",
    // },
    { icon: "📑", label: "PowerPoint", value: "powerpoint", extension: "pptx" },
    { icon: "🖼️", label: "Image", value: "image", extension: "jpg" },
  ];

  const continueOptions = [
    { icon: "🔍", label: "Annotate", value: "annotate" },
    { icon: "✍️", label: "Sign", value: "sign" },
    { icon: "🔒", label: "Protect", value: "protect" },
  ];

  return (
    <div className="flex h-screen bg-gray-50">
      {/* Left side - Preview */}
      <div className="flex-1 p-2 h-screen border-r border-gray-200">
        <div className="bg-white h-full rounded-lg shadow-sm overflow-hidden">
          <div className="h-10 border-b border-gray-200 flex items-center px-4">
            <Button
              variant="ghost"
              size="sm"
              className="flex items-center gap-2"
              onClick={() => navigate("/organize/merge")}
            >
              <ArrowLeft className="w-4 h-4" />
              Back
            </Button>
          </div>
          <div className="flex items-center justify-center h-[calc(100%-4rem)]">
            {isLoading ? (
              <LoadingState />
            ) : previewUrl ? (
              <iframe
                src={`${previewUrl}#toolbar=0`}
                title="PDF Preview"
                className="w-full h-full border-0"
              />
            ) : (
              <div className="w-full h-full bg-gray-50 rounded-lg flex items-center justify-center">
                <p className="text-gray-500">Preview not available</p>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Right side - Export options */}
      <div className="w-96 p-4">
        <div className="bg-white rounded-lg shadow-sm p-4 h-full">
          <div className="flex items-center gap-2 mb-4">
            <div className="w-6 h-6 text-green-500">✓</div>
            <span className="font-semibold">Done</span>
          </div>

          <div className="mb-4">
            <h3 className="font-medium text-gray-900">{fileName}.pdf</h3>
            <p className="text-sm text-gray-500">
              {fileSize} · {pageCount} pages
            </p>
          </div>

          <Button
            className="w-full mb-4 bg-blue-600 hover:bg-blue-700"
            onClick={handleDownload}
            disabled={isExporting}
          >
            <Download className="w-4 h-4 mr-2" />
            Download
          </Button>

          <div className="flex gap-2 mb-4">
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button
                  variant="outline"
                  className="flex-1"
                  disabled={isExporting}
                >
                  <FileDown className="w-4 h-4 mr-2" />
                  Export As
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="start" className="w-52">
                {exportOptions.map((option) => (
                  <DropdownMenuItem
                    key={option.value}
                    onClick={() => handleExportAs(option.value)}
                  >
                    <span className="mr-2">{option.icon}</span>
                    <span>{option.label}</span>
                    <span className="ml-auto text-gray-500 text-sm">
                      .{option.extension}
                    </span>
                  </DropdownMenuItem>
                ))}
              </DropdownMenuContent>
            </DropdownMenu>
            <Button variant="outline" className="flex-1" disabled={isExporting}>
              <Share2 className="w-4 h-4 mr-2" />
              Share
            </Button>
          </div>

          <div className="border-t border-gray-200 pt-4">
            <h4 className="text-sm font-medium mb-2">Continue in</h4>
            <div className="space-y-2">
              {continueOptions.map((option) => (
                <Button
                  key={option.value}
                  variant="ghost"
                  className="w-full justify-start text-gray-700 hover:bg-gray-50"
                  onClick={() =>
                    navigate(`/${option.value}`, { state: { file, fileName } })
                  }
                >
                  <span className="mr-2">{option.icon}</span>
                  {option.label}
                </Button>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ExportPage;
