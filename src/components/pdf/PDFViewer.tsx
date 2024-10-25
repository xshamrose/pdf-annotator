import React, {
  useRef,
  useEffect,
  useState,
  forwardRef,
  useImperativeHandle,
} from "react";
import * as pdfjsLib from "pdfjs-dist";

pdfjsLib.GlobalWorkerOptions.workerSrc =
  "https://cdnjs.cloudflare.com/ajax/libs/pdf.js/3.4.120/pdf.worker.min.js";

interface PDFPage {
  pageNumber: number;
  rotation: number;
}

interface PDFViewerProps {
  file: File | string;
  scale: number;
  currentPage: number;
  onNumPagesChange: (pages: number) => void;
  onPageDeleted: (pageNumber: number) => void;
}

export interface PDFViewerHandle {
  rotatePage: (pageNumber: number) => Promise<void>;
  duplicatePage: (pageNumber: number) => Promise<void>;
  deletePage: (pageNumber: number) => Promise<void>;
}

const PDFViewer = forwardRef<PDFViewerHandle, PDFViewerProps>((props, ref) => {
  const { file, scale, currentPage, onNumPagesChange, onPageDeleted } = props;
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [pdfDoc, setPdfDoc] = useState<any>(null);
  const [pages, setPages] = useState<PDFPage[]>([]);
  const [pdfBytes, setPdfBytes] = useState<Uint8Array | null>(null);

  useImperativeHandle(ref, () => ({
    rotatePage: async (pageNumber: number) => {
      setPages((prevPages) =>
        prevPages.map((page) =>
          page.pageNumber === pageNumber
            ? { ...page, rotation: (page.rotation + 90) % 360 }
            : page
        )
      );
    },
    duplicatePage: async (pageNumber: number) => {
      if (!pdfBytes) return;

      try {
        const loadingTask = pdfjsLib.getDocument({ data: pdfBytes });
        const pdf = await loadingTask.promise;
        console.log(pdf);

        const newPages = [...pages];
        const pageToClone = newPages.find((p) => p.pageNumber === pageNumber);
        if (pageToClone) {
          newPages.splice(pageNumber, 0, {
            pageNumber: pageNumber + 1,
            rotation: pageToClone.rotation,
          });
          newPages.forEach((page, index) => {
            page.pageNumber = index + 1;
          });
          setPages(newPages);
          onNumPagesChange(newPages.length);
        }
      } catch (error) {
        console.error("Error duplicating page:", error);
      }
    },
    deletePage: async (pageNumber: number) => {
      if (pages.length <= 1) {
        console.warn("Cannot delete the last page");
        return;
      }

      try {
        const newPages = pages.filter((page) => page.pageNumber !== pageNumber);
        newPages.forEach((page, index) => {
          page.pageNumber = index + 1;
        });
        setPages(newPages);
        onNumPagesChange(newPages.length);
        onPageDeleted(pageNumber);
      } catch (error) {
        console.error("Error deleting page:", error);
      }
    },
  }));

  useEffect(() => {
    const loadPDF = async () => {
      try {
        let url = file instanceof File ? URL.createObjectURL(file) : file;

        const response = await fetch(url);
        const arrayBuffer = await response.arrayBuffer();
        setPdfBytes(new Uint8Array(arrayBuffer));

        const loadingTask = pdfjsLib.getDocument(url);
        const pdf = await loadingTask.promise;
        setPdfDoc(pdf);

        const pagesArray: PDFPage[] = Array.from(
          { length: pdf.numPages },
          (_, i) => ({ pageNumber: i + 1, rotation: 0 })
        );
        setPages(pagesArray);
        onNumPagesChange(pdf.numPages);
      } catch (error) {
        console.error("Error loading PDF:", error);
      }
    };

    loadPDF();
  }, [file, onNumPagesChange]);

  useEffect(() => {
    const renderPage = async () => {
      if (!pdfDoc || !canvasRef.current) return;

      try {
        const page = await pdfDoc.getPage(currentPage);
        const canvas = canvasRef.current;

        const pageInfo = pages.find((p) => p.pageNumber === currentPage);
        const rotation = (page.rotate + (pageInfo?.rotation || 0)) % 360;

        const viewport = page.getViewport({ scale, rotation });
        canvas.width = viewport.width;
        canvas.height = viewport.height;

        const context = canvas.getContext("2d");
        if (!context) return;

        await page.render({
          canvasContext: context,
          viewport,
        }).promise;
      } catch (error) {
        console.error("Error rendering page:", error);
      }
    };

    renderPage();
  }, [pdfDoc, currentPage, scale, pages]);

  return (
    <div className="h-full overflow-auto">
      <canvas ref={canvasRef} className="mx-auto" />
    </div>
  );
});

PDFViewer.displayName = "PDFViewer";

export default PDFViewer;
