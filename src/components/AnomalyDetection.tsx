import { useCallback } from "react";
import { content } from "../content";

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
              <a
                href="#pdf-preview"
                className="px-8 py-4 rounded-lg font-semibold text-white bg-blue-600 hover:bg-blue-700 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-offset-2 focus-visible:ring-blue-600 transition-all transform hover:scale-105 shadow-lg"
              >
                View PDF
              </a>
              <button
                type="button"
                onClick={handleDownload}
                className="px-8 py-4 rounded-lg font-semibold border-2 border-blue-600 text-blue-600 bg-white hover:bg-blue-50 hover:text-blue-700 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-offset-2 focus-visible:ring-blue-600 transition-all transform hover:scale-105 shadow-lg"
              >
                Download PDF
              </button>
              <a
                href={pdfUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="px-8 py-4 rounded-lg font-semibold text-blue-700 bg-blue-50 hover:bg-blue-100 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-offset-2 focus-visible:ring-blue-600 transition-all"
              >
                Open in New Tab
              </a>
            </div>
          </div>

          <div
            id="pdf-preview"
            className="bg-white rounded-3xl shadow-2xl p-4 scroll-mt-24"
          >
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
          </div>
        </div>
      </div>
    </section>
  );
}
