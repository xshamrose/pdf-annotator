import React, { useState } from "react";
import { Card, CardHeader, CardTitle, CardContent } from "../ui/card";
import { Button } from "../ui/button";
import {
  FileOutput,
  Trash,
  RotateCw,
  Combine,
  Split as SplitIcon,
} from "lucide-react";

type OrganizeOperation =
  | "merge"
  | "split"
  | "rotate"
  | "delete"
  | "extract"
  | null;

interface PDFPage {
  pageNumber: number;
  file: File;
}

interface PDFOrganizerProps {
  onFileSelect: (file: File) => void;
}

const PDFOrganizer: React.FC<PDFOrganizerProps> = ({ onFileSelect }) => {
  const [selectedOperation, setSelectedOperation] =
    useState<OrganizeOperation>(null);
  const [selectedFiles, setSelectedFiles] = useState<File[]>([]);
  const [selectedPages, setSelectedPages] = useState<PDFPage[]>([]);
  const [rotationDegrees, setRotationDegrees] = useState<number>(0);

  const handleFileAdd = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(e.target.files || []);
    const pdfFiles = files.filter((file) => file.type === "application/pdf");
    setSelectedFiles((prev) => [...prev, ...pdfFiles]);
  };

  const handleOperationSelect = (operation: OrganizeOperation) => {
    setSelectedOperation(operation);
    setSelectedFiles([]);
    setSelectedPages([]);
    setRotationDegrees(0);
  };

  const renderOperationContent = () => {
    switch (selectedOperation) {
      case "merge":
        return (
          <div className="space-y-4">
            <div className="flex items-center gap-4">
              <Button
                onClick={() => document.getElementById("fileInput")?.click()}
              >
                Add PDFs
              </Button>
              <input
                id="fileInput"
                type="file"
                multiple
                accept=".pdf"
                className="hidden"
                onChange={handleFileAdd}
              />
              <Button variant="outline" onClick={() => setSelectedFiles([])}>
                Clear All
              </Button>
            </div>
            <div className="space-y-2">
              {selectedFiles.map((file, index) => (
                <div
                  key={index}
                  className="flex items-center justify-between p-2 border rounded"
                >
                  <span>{file.name}</span>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => {
                      const newFiles = [...selectedFiles];
                      newFiles.splice(index, 1);
                      setSelectedFiles(newFiles);
                    }}
                  >
                    <Trash className="h-4 w-4" />
                  </Button>
                </div>
              ))}
            </div>
            {selectedFiles.length > 1 && (
              <Button className="w-full">
                Merge {selectedFiles.length} PDFs
              </Button>
            )}
          </div>
        );

      case "split":
        return (
          <div className="space-y-4">
            <Button
              onClick={() => document.getElementById("splitFileInput")?.click()}
            >
              Choose PDF to Split
            </Button>
            <input
              id="splitFileInput"
              type="file"
              accept=".pdf"
              className="hidden"
              onChange={(e) => {
                const file = e.target.files?.[0];
                if (file) setSelectedFiles([file]);
              }}
            />
            {selectedFiles[0] && (
              <>
                <div className="p-2 border rounded">
                  <p>{selectedFiles[0].name}</p>
                </div>
                <Button className="w-full">Split PDF</Button>
              </>
            )}
          </div>
        );

      case "rotate":
        return (
          <div className="space-y-4">
            <Button
              onClick={() =>
                document.getElementById("rotateFileInput")?.click()
              }
            >
              Choose PDF to Rotate
            </Button>
            <input
              id="rotateFileInput"
              type="file"
              accept=".pdf"
              className="hidden"
              onChange={(e) => {
                const file = e.target.files?.[0];
                if (file) setSelectedFiles([file]);
              }}
            />
            {selectedFiles[0] && (
              <>
                <div className="flex items-center gap-4">
                  <Button
                    variant="outline"
                    onClick={() =>
                      setRotationDegrees((prev) => (prev - 90) % 360)
                    }
                  >
                    Rotate Left
                  </Button>
                  <Button
                    variant="outline"
                    onClick={() =>
                      setRotationDegrees((prev) => (prev + 90) % 360)
                    }
                  >
                    Rotate Right
                  </Button>
                </div>
                <div className="p-2 border rounded">
                  <p>{selectedFiles[0].name}</p>
                  <p>Rotation: {rotationDegrees}°</p>
                </div>
                <Button className="w-full">Apply Rotation</Button>
              </>
            )}
          </div>
        );

      default:
        return (
          <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
            <OperationCard
              title="Merge PDFs"
              icon={Combine}
              onClick={() => handleOperationSelect("merge")}
            />
            <OperationCard
              title="Split PDF"
              icon={SplitIcon}
              onClick={() => handleOperationSelect("split")}
            />
            <OperationCard
              title="Rotate PDF"
              icon={RotateCw}
              onClick={() => handleOperationSelect("rotate")}
            />
            <OperationCard
              title="Delete Pages"
              icon={Trash}
              onClick={() => handleOperationSelect("delete")}
            />
            <OperationCard
              title="Extract Pages"
              icon={FileOutput}
              onClick={() => handleOperationSelect("extract")}
            />
          </div>
        );
    }
  };

  return (
    <Card className="w-full max-w-4xl mx-auto">
      <CardHeader>
        <CardTitle>
          {selectedOperation ? (
            <div className="flex items-center justify-between">
              <span>
                {selectedOperation.charAt(0).toUpperCase() +
                  selectedOperation.slice(1)}{" "}
                PDF
              </span>
              <Button
                variant="ghost"
                onClick={() => handleOperationSelect(null)}
              >
                Back
              </Button>
            </div>
          ) : (
            "Organize PDF"
          )}
        </CardTitle>
      </CardHeader>
      <CardContent>{renderOperationContent()}</CardContent>
    </Card>
  );
};

interface OperationCardProps {
  title: string;
  icon: React.ElementType;
  onClick: () => void;
}

const OperationCard: React.FC<OperationCardProps> = ({
  title,
  icon: Icon,
  onClick,
}) => {
  return (
    <Button
      variant="outline"
      className="h-32 flex flex-col items-center justify-center gap-2 hover:bg-gray-100"
      onClick={onClick}
    >
      <Icon className="h-8 w-8" />
      <span>{title}</span>
    </Button>
  );
};

export default PDFOrganizer;
