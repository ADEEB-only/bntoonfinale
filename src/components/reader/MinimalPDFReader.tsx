import { useState, useRef, useEffect } from "react";
import { Document, Page, pdfjs } from "react-pdf";
import "react-pdf/dist/Page/AnnotationLayer.css";
import "react-pdf/dist/Page/TextLayer.css";

pdfjs.GlobalWorkerOptions.workerSrc = `//unpkg.com/pdfjs-dist@${pdfjs.version}/build/pdf.worker.min.mjs`;

interface MinimalPDFReaderProps {
  pdfUrl: string;
}

export function MinimalPDFReader({ pdfUrl }: MinimalPDFReaderProps) {
  const [numPages, setNumPages] = useState<number | null>(null);
  const [pageWidth, setPageWidth] = useState<number>(768);
  const containerRef = useRef<HTMLDivElement>(null);

  // Responsive page width
  useEffect(() => {
    const updateWidth = () => {
      if (containerRef.current) {
        const containerWidth = containerRef.current.clientWidth;
        setPageWidth(Math.min(containerWidth, 768));
      }
    };

    updateWidth();

    const observer = new ResizeObserver(updateWidth);
    if (containerRef.current) {
      observer.observe(containerRef.current);
    }

    return () => observer.disconnect();
  }, []);

  const onDocumentLoadSuccess = ({ numPages }: { numPages: number }) => {
    setNumPages(numPages);
  };

  return (
    <div ref={containerRef} className="w-full max-w-3xl mx-auto">
      <Document
        file={pdfUrl}
        onLoadSuccess={onDocumentLoadSuccess}
        loading={
          <div className="flex items-center justify-center py-20">
            <div className="w-6 h-6 border-2 border-muted-foreground/20 border-t-muted-foreground/60 rounded-full animate-spin" />
          </div>
        }
        error={
          <div className="flex items-center justify-center py-20">
            <p className="text-sm text-muted-foreground">Failed to load PDF</p>
          </div>
        }
        className="flex flex-col"
      >
        {numPages &&
          Array.from({ length: numPages }, (_, i) => (
            <Page
              key={`page_${i + 1}`}
              pageNumber={i + 1}
              width={pageWidth}
              loading={
                <div
                  className="bg-muted/30 flex items-center justify-center"
                  style={{ width: pageWidth, height: pageWidth * 1.4 }}
                >
                  <div className="w-6 h-6 border-2 border-muted-foreground/20 border-t-muted-foreground/60 rounded-full animate-spin" />
                </div>
              }
              className="[&>canvas]:!w-full [&>canvas]:!h-auto"
            />
          ))}
      </Document>
    </div>
  );
}
