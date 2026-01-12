import { useCallback } from "react";
import { content } from "../content";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";

export default function AnomalyDetection() {
  const pdfUrl = content.anomalyDetection.pdfUrl;
  const pdfEmbedUrl = `${pdfUrl}#view=FitH`;
  const pdfFilename = "bachelor.pdf";

  const handleDownload = useCallback(() => {
    const a = document.createElement("a");
    a.href = pdfUrl;
    a.download = pdfFilename;
    a.rel = "noopener noreferrer";
    document.body.appendChild(a);
    a.click();
    a.remove();
  }, [pdfUrl]);

  return (
    <section id="anomaly-detection" className="py-20 bg-gray-50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="grid lg:grid-cols-2 gap-12 items-start">
          <div>
            <p className="text-primary font-semibold uppercase tracking-wide mb-4">
              {content.anomalyDetection.subtitle}
            </p>
            <h2 className="text-4xl sm:text-5xl font-bold text-gray-900 mb-6">
              {content.anomalyDetection.title}
            </h2>
            <p className="text-lg text-gray-700 mb-8 leading-relaxed">
              {content.anomalyDetection.description}
            </p>
            <ul className="space-y-4">
              {content.anomalyDetection.highlights.map((highlight, index) => (
                <li
                  key={highlight}
                  className="flex items-start space-x-4 bg-white p-4 rounded-2xl shadow-sm"
                >
                  <div className="flex-shrink-0 w-10 h-10 rounded-full bg-blue-100 text-primary flex items-center justify-center font-semibold">
                    {index + 1}
                  </div>
                  <p className="text-gray-700 leading-relaxed">{highlight}</p>
                </li>
              ))}
            </ul>

            <div className="mt-10 flex flex-wrap gap-4">
              <Button asChild size="lg" className="shadow-lg">
                <a href="#pdf-preview">View PDF</a>
              </Button>

              <Button
                type="button"
                variant="outline"
                size="lg"
                onClick={handleDownload}
                className="shadow-lg"
              >
                Download PDF
              </Button>

              <Button asChild variant="secondary" size="lg">
                <a href={pdfUrl} target="_blank" rel="noopener noreferrer">
                  Open in New Tab
                </a>
              </Button>
            </div>
          </div>

          <Card id="pdf-preview" className="scroll-mt-24 shadow-2xl">
            <CardContent className="p-4">
              <iframe
                src={pdfEmbedUrl}
                title="Bachelor thesis PDF preview"
                className="w-full h-[720px] rounded-2xl"
              />

              <p className="text-gray-600 mt-4">
                If the PDF preview is blocked by your browser, use{" "}
                <a
                  href={pdfUrl}
                  className="text-primary underline"
                  target="_blank"
                  rel="noopener noreferrer"
                >
                  Open in New Tab
                </a>
                .
              </p>
            </CardContent>
          </Card>
        </div>
      </div>
    </section>
  );
}
