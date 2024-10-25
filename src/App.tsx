import { Route, Routes, useNavigate } from "react-router-dom";
import Layout from "./components/layout/Layout";
import PDFUploader from "./components/pdf/PDFUploader";
import PDFOrganizer from "./components/pdf/PDFOrganizer";
import { AnnotatorProvider } from "./context/AnnotatorContext";
import { useState } from "react";
import { Button } from "./components/ui/button";
import { Loader2 } from "lucide-react";
import PDFAnnotator from "./components/pdf/PDFAnnotator";
import PDFLandingPage from "./components/layout/PDFLandingPage";
import { ThemeProvider } from "./providers";

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
                    <>
                      <div className="h-screen">
                        <PDFUploader onFileSelect={handleFileSelect} />
                        {selectedFile && !isLoading && (
                          <div className="mt-4 text-center">
                            <Button
                              onClick={() => navigate("/annotate")}
                              className="bg-blue-600 hover:bg-blue-700 text-white"
                            >
                              Start Annotating
                            </Button>
                          </div>
                        )}
                      </div>
                    </>
                  )}
                </div>
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
        </Routes>
      </AnnotatorProvider>
    </ThemeProvider>
  );
}

export default App;
