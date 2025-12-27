import { content } from "../content";
import bachelorPdf from "../assets/bachelor.pdf";

export default function AnomalyDetection() {
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
                href={bachelorPdf}
                target="_blank"
                rel="noopener noreferrer"
                className="px-8 py-4 rounded-lg font-semibold text-white bg-blue-600 hover:bg-blue-700 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-offset-2 focus-visible:ring-blue-600 transition-all transform hover:scale-105 shadow-lg"
              >
                Open PDF
              </a>
              <a
                href={bachelorPdf}
                download
                className="px-8 py-4 rounded-lg font-semibold border-2 border-blue-600 text-blue-600 bg-white hover:bg-blue-50 hover:text-blue-700 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-offset-2 focus-visible:ring-blue-600 transition-all transform hover:scale-105 shadow-lg"
              >
                Download Thesis
              </a>
            </div>
          </div>

          <div className="bg-white rounded-3xl shadow-2xl p-4">
            <object
              data={`${bachelorPdf}#view=FitH`}
              type="application/pdf"
              className="w-full h-[720px] rounded-2xl"
              aria-label="Bachelor thesis PDF preview"
            >
              <p className="text-gray-600">
                This browser cannot display embedded PDFs.{" "}
                <a
                  href={bachelorPdf}
                  className="text-primary underline"
                  target="_blank"
                  rel="noopener noreferrer"
                >
                  Open the document in a new tab
                </a>
                .
              </p>
            </object>
          </div>
        </div>
      </div>
    </section>
  );
}
