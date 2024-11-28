import { Outlet, Route, Routes, useNavigate } from "react-router-dom";
import Layout from "./components/layout/Layout";
import PDFUploader from "./components/pdf/PDFUploader";
import PDFOrganizer from "./components/pdf/PDFOrganizer";
import PDFAnnotator from "./components/pdf/PDFAnnotator";
import PDFLandingPage from "./components/layout/PDFLandingPage";
import PDFMerge from "./components/organizer/PDFMerge";
import ExportPage from "./components/export/Exportpage";
import { AnnotatorProvider } from "./context/AnnotatorContext";
import { useState } from "react";
import { Button } from "./components/ui/button";

import { Loader2, Edit, Crop, FileText } from "lucide-react";
import { ThemeProvider } from "./providers";
import Split from "./components/organizer/SplitPDF";
import SplitResultsPage from "./components/export/SplitResultsPage";
import PDFRotate from "./components/organizer/PDFRotate";
import PDFDelete from "./components/organizer/PDFDelete";
import PdfExtractor from "./components/organizer/PdfExtractor";
import ExtractResultsPage from "./components/export/ExtractResultsPage";
import PDFConverterPage from "./components/pdfconverter/PDFConverterPage";
import PdfCompress from "./components/pdfcompressor/PdfCompressor";
import PDFSignComponent from "./components/pdfsign/PDFSignComponent";
import Protect from "./components/more/Protect";
import Unlock from "./components/more/Unlock";
import Flatten from "./components/more/Flatten";
import CropPdfComponent from "./components/pdf/CropPdfComponent";
import WaterMarkComponent from "./components/pdf/WaterMarkComponent";

function App() {
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const navigate = useNavigate();

  const handleFileSelect = async (file: File) => {
    try {
      setIsLoading(true);
      await new Promise((resolve) => setTimeout(resolve, 1500));
      setSelectedFile(file);
      setIsLoading(false);
      navigate("/upload/action-select"); // Navigate to action selection page
    } catch (error) {
      console.error("Error processing file:", error);
      setIsLoading(false);
    }
  };

  const LayoutWrapper = ({ children }: { children: React.ReactNode }) => (
    <Layout>
      <div className="bg-gray-50 p-4">{children}</div>
    </Layout>
  );

  const ActionSelectionPage = () => {
    if (!selectedFile) {
      return (
        <div className="text-center p-8">
          <p className="text-gray-600">No document selected.</p>
          <Button
            onClick={() => navigate("/upload")}
            className="mt-4 bg-blue-600 hover:bg-blue-700 text-white"
          >
            Return to Upload
          </Button>
        </div>
      );
    }
    return (
      <div className="max-w-xl mx-auto space-y-4">
        <h2 className="text-2xl font-bold text-center mb-6">
          What would you like to do?
        </h2>
        <div className="grid grid-cols-3 gap-4">
          <Button
            variant="outline"
            className="flex flex-col items-center p-6"
            onClick={() => navigate("/annotate")}
          >
            <Edit className="h-8 w-8 mb-2" />
            Annotate
          </Button>
          <Button
            variant="outline"
            className="flex flex-col items-center p-6"
            onClick={() => navigate("/edit/crop")}
          >
            <Crop className="h-8 w-8 mb-2" />
            Crop
          </Button>
          <Button
            variant="outline"
            className="flex flex-col items-center p-6"
            onClick={() => navigate("/convert")}
          >
            <FileText className="h-8 w-8 mb-2" />
            Convert
          </Button>
        </div>
        <div className="text-center mt-4">
          <Button
            variant="link"
            onClick={() => navigate("/upload")}
            className="text-gray-600 hover:text-gray-800"
          >
            Upload a different file
          </Button>
        </div>
      </div>
    );
  };
  // Create a wrapper for convert routes that includes the layout
  const ConvertWrapper = () => (
    <LayoutWrapper>
      <Outlet />
    </LayoutWrapper>
  );
  return (
    <ThemeProvider
      attribute="class"
      defaultTheme="system"
      enableSystem={true}
      disableTransitionOnChange={true}
    >
      <AnnotatorProvider>
        <Routes>
          <Route path="/" element={<PDFLandingPage />} />
          <Route
            path="/upload"
            element={
              <LayoutWrapper>
                <div className="max-w-7xl mx-auto">
                  {isLoading ? (
                    <div className="flex flex-col items-center justify-center p-8">
                      <Loader2 className="h-8 w-8 animate-spin" />
                      <p className="mt-2 text-gray-600">Loading document...</p>
                    </div>
                  ) : (
                    <PDFUploader onFileSelect={handleFileSelect} />
                  )}
                </div>
              </LayoutWrapper>
            }
          />
          <Route
            path="/upload/action-select"
            element={
              <LayoutWrapper>
                <ActionSelectionPage />
              </LayoutWrapper>
            }
          />
          <Route
            path="/compress"
            element={
              <LayoutWrapper>
                <PdfCompress />
              </LayoutWrapper>
            }
          />
          <Route
            path="/sign"
            element={
              <LayoutWrapper>
                <PDFSignComponent />
              </LayoutWrapper>
            }
          />
          <Route
            path="/organize/*"
            element={
              <LayoutWrapper>
                <PDFOrganizer onFileSelect={handleFileSelect} />
              </LayoutWrapper>
            }
          />
          <Route
            path="/organize/merge"
            element={
              <LayoutWrapper>
                <PDFMerge />
              </LayoutWrapper>
            }
          />
          <Route
            path="/organize/split"
            element={
              <LayoutWrapper>
                <Split />
              </LayoutWrapper>
            }
          />
          <Route
            path="/organize/rotate"
            element={
              <LayoutWrapper>
                <PDFRotate />
              </LayoutWrapper>
            }
          />
          <Route
            path="/organize/delete"
            element={
              <LayoutWrapper>
                <PDFDelete />
              </LayoutWrapper>
            }
          />
          <Route
            path="/organize/extract"
            element={
              <LayoutWrapper>
                <PdfExtractor />
              </LayoutWrapper>
            }
          />
          <Route
            path="/organize/extract/results"
            element={<ExtractResultsPage />}
          />
          <Route
            path="/organize/split/results"
            element={
              <LayoutWrapper>
                <SplitResultsPage />
              </LayoutWrapper>
            }
          />
          <Route
            path="/annotate"
            element={
              <LayoutWrapper>
                {selectedFile ? (
                  <PDFAnnotator file={selectedFile} />
                ) : (
                  <div className="text-center p-8">
                    <p className="text-gray-600">No document selected.</p>
                    <Button
                      onClick={() => navigate("/upload")}
                      className="mt-4 bg-blue-600 hover:bg-blue-700 text-white"
                    >
                      Return to Upload
                    </Button>
                  </div>
                )}
              </LayoutWrapper>
            }
          />
          <Route
            path="edit/annotate"
            element={
              <LayoutWrapper>
                {selectedFile ? (
                  <PDFAnnotator file={selectedFile} />
                ) : (
                  <div className="text-center p-8">
                    <p className="text-gray-600">No document selected.</p>
                    <Button
                      onClick={() => navigate("/upload")}
                      className="mt-4 bg-blue-600 hover:bg-blue-700 text-white"
                    >
                      Return to Upload
                    </Button>
                  </div>
                )}
              </LayoutWrapper>
            }
          />
          <Route
            path="/edit/crop"
            element={
              <LayoutWrapper>
                {selectedFile ? (
                  <CropPdfComponent file={selectedFile} />
                ) : (
                  <div className="text-center p-8">
                    <p className="text-gray-600">
                      No document selected. Please upload a file first.
                    </p>
                    <Button
                      onClick={() => navigate("/upload")}
                      className="mt-4 bg-blue-600 hover:bg-blue-700 text-white"
                    >
                      Go to Upload
                    </Button>
                  </div>
                )}
              </LayoutWrapper>
            }
          />
          <Route
            path="/edit/watermark"
            element={
              <LayoutWrapper>
                {selectedFile ? (
                  <WaterMarkComponent file={selectedFile} />
                ) : (
                  <div className="text-center p-8">
                    <p className="text-gray-600">
                      No document selected. Please upload a file first.
                    </p>
                    <Button
                      onClick={() => navigate("/upload")}
                      className="mt-4 bg-blue-600 hover:bg-blue-700 text-white"
                    >
                      Go to Upload
                    </Button>
                  </div>
                )}
              </LayoutWrapper>
            }
          />
          <Route path="/convert" element={<ConvertWrapper />}>
            <Route path="to-pdf" element={<PDFConverterPage />} />
            <Route path="word" element={<PDFConverterPage />} />
            <Route path="excel" element={<PDFConverterPage />} />
            <Route path="powerpoint" element={<PDFConverterPage />} />
            <Route path="image" element={<PDFConverterPage />} />
          </Route>
          <Route
            path="/more/protect"
            element={
              <LayoutWrapper>
                <Protect />
              </LayoutWrapper>
            }
          />
          <Route
            path="/more/unlock"
            element={
              <LayoutWrapper>
                <Unlock />
              </LayoutWrapper>
            }
          />
          <Route
            path="/more/flatten"
            element={
              <LayoutWrapper>
                <Flatten />
              </LayoutWrapper>
            }
          />
          <Route
            path="/export"
            element={
              <LayoutWrapper>
                <ExportPage />
              </LayoutWrapper>
            }
          />
        </Routes>
      </AnnotatorProvider>
    </ThemeProvider>
  );
}

export default App;
