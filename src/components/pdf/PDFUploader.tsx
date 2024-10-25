import React from "react";
import { Upload, Link as LinkIcon } from "lucide-react";
import { Button } from "../ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "../ui/card";
import { Input } from "../ui/input";

interface PDFUploaderProps {
  onFileSelect: (file: File) => void;
}

const PDFUploader: React.FC<PDFUploaderProps> = ({ onFileSelect }) => {
  const [urlInput, setUrlInput] = React.useState("");
  const [isLoading, setIsLoading] = React.useState(false);
  const [error, setError] = React.useState<string | null>(null);

  const handleFileDrop = (e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    const file = e.dataTransfer.files[0];
    if (file?.type === "application/pdf") {
      onFileSelect(file);
      setError(null);
    } else {
      setError("Please upload a PDF file");
    }
  };

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file?.type === "application/pdf") {
      onFileSelect(file);
      setError(null);
    } else {
      setError("Please upload a PDF file");
    }
  };

  const handleUrlUpload = async () => {
    setIsLoading(true);
    setError(null);

    try {
      if (!urlInput.trim() || !isValidUrl(urlInput)) {
        throw new Error("Please enter a valid URL");
      }

      const response = await fetch(urlInput);
      const contentType = response.headers.get("content-type");

      if (!contentType?.includes("application/pdf")) {
        throw new Error("The provided URL does not point to a PDF file");
      }

      const blob = await response.blob();
      const file = new File([blob], "document.pdf", {
        type: "application/pdf",
      });

      onFileSelect(file);
      setUrlInput("");
    } catch (err) {
      setError(
        err instanceof Error ? err.message : "Failed to load PDF from URL"
      );
    } finally {
      setIsLoading(false);
    }
  };

  const isValidUrl = (urlString: string): boolean => {
    try {
      new URL(urlString);
      return true;
    } catch {
      return false;
    }
  };

  return (
    <Card className="h-full w-full flex flex-col">
      <CardHeader className="flex-none">
        <CardTitle>Upload PDF Document</CardTitle>
      </CardHeader>
      <CardContent className="flex-1 flex flex-col">
        <div
          className="flex-1 flex flex-col items-center justify-center border-2 border-dashed border-gray-300 rounded-lg p-8 text-center"
          onDrop={handleFileDrop}
          onDragOver={(e) => e.preventDefault()}
        >
          <Upload className="h-12 w-12 text-gray-400" />
          <div className="mt-4">
            <label className="cursor-pointer">
              <span className="text-blue-600 hover:text-blue-700">
                Upload a file
              </span>
              <input
                type="file"
                className="hidden"
                accept="application/pdf"
                onChange={handleFileSelect}
              />
            </label>
            <p className="text-sm text-gray-500 mt-1">or drag and drop</p>
            <p className="text-xs text-gray-500 mt-1">PDF (up to 10MB)</p>
          </div>
        </div>

        <div className="mt-6">
          <div className="flex items-center gap-2">
            <Input
              type="url"
              placeholder="Enter PDF URL"
              value={urlInput}
              onChange={(e: React.ChangeEvent<HTMLInputElement>) => {
                setUrlInput(e.target.value);
                setError(null);
              }}
            />
            <Button
              onClick={handleUrlUpload}
              disabled={isLoading || !urlInput.trim()}
            >
              <LinkIcon className="mr-2 h-4 w-4" />
              {isLoading ? "Loading..." : "Upload"}
            </Button>
          </div>
          {error && <p className="text-sm text-red-500 mt-2">{error}</p>}
        </div>
      </CardContent>
    </Card>
  );
};

export default PDFUploader;
