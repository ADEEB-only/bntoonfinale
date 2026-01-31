import { useState, useCallback } from "react";
import { Document, Page, pdfjs } from "react-pdf";
import { Skeleton } from "@/components/ui/skeleton";

// Set up PDF.js worker
pdfjs.GlobalWorkerOptions.workerSrc = `//unpkg.com/pdfjs-dist@${pdfjs.version}/build/pdf.worker.min.mjs`;

interface PDFReaderProps {
  pdfUrl: string;
}

export function PDFReader({ pdfUrl }: PDFReaderProps) {
  const [numPages, setNumPages] = useState<number | null>(null);
  const [pageWidth, setPageWidth] = useState<number>(800);

  const onDocumentLoadSuccess = useCallback(({ numPages }: { numPages: number }) => {
    setNumPages(numPages);
  }, []);

  // Responsive width based on container
  const containerRef = useCallback((node: HTMLDivElement | null) => {
    if (node) {
      const observer = new ResizeObserver((entries) => {
        for (const entry of entries) {
          setPageWidth(Math.min(entry.contentRect.width, 1000));
        }
      });
      observer.observe(node);
      return () => observer.disconnect();
    }
  }, []);

  return (
    <div 
      ref={containerRef}
      className="flex flex-col items-center bg-background pdf-page-container"
    >
      <Document
        file={pdfUrl}
        onLoadSuccess={onDocumentLoadSuccess}
        loading={
          <div className="w-full max-w-4xl space-y-0">
            {[1, 2, 3].map((i) => (
              <Skeleton key={i} className="w-full aspect-[2/3]" />
            ))}
          </div>
        }
        error={
          <div className="flex items-center justify-center py-20 text-destructive">
            Failed to load PDF. Please try again.
          </div>
        }
      >
        {numPages &&
          Array.from(new Array(numPages), (_, index) => (
            <Page
              key={`page_${index + 1}`}
              pageNumber={index + 1}
              width={pageWidth}
              className="!m-0 !p-0"
              renderTextLayer={false}
              renderAnnotationLayer={false}
              loading={<Skeleton className="w-full aspect-[2/3]" />}
            />
          ))}
      </Document>
    </div>
  );
}

