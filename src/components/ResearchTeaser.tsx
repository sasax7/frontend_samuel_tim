import { Link } from "react-router-dom";
import { content } from "../content";

export default function ResearchTeaser() {
  return (
    <section className="py-20 bg-gradient-to-bl from-indigo-50 via-white to-blue-100">
      <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="rounded-3xl bg-white/90 backdrop-blur shadow-2xl p-10 md:p-14 flex flex-col gap-8">
          <div>
            <p className="text-sm font-semibold tracking-[0.3em] uppercase text-primary mb-4">
              Bachelor Thesis
            </p>
            <h3 className="text-3xl sm:text-4xl font-bold text-gray-900 mb-4">
              {content.anomalyDetection.title}
            </h3>
            <p className="text-lg text-gray-700 max-w-3xl leading-relaxed">
              {content.anomalyDetection.description}
            </p>
          </div>

          <div className="grid md:grid-cols-3 gap-6">
            {content.anomalyDetection.highlights.map((highlight, index) => (
              <div
                key={`${index}-${highlight.slice(0, 12)}`}
                className="bg-gray-50 rounded-2xl p-5 border border-gray-100 shadow-inner"
              >
                <p className="text-sm text-gray-600">Insight</p>
                <p className="text-gray-900 font-semibold mt-2 leading-relaxed">
                  {highlight}
                </p>
              </div>
            ))}
          </div>

          <div className="flex flex-wrap gap-4">
            <Link
              to="/anomaly-detection"
              className="px-8 py-4 rounded-lg font-semibold text-white bg-blue-600 hover:bg-blue-700 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-offset-2 focus-visible:ring-blue-600 transition-all transform hover:scale-105 shadow-lg"
            >
              Dive into the Thesis
            </Link>
            <Link
              to="/anomaly-detection"
              className="px-8 py-4 rounded-lg font-semibold border-2 border-blue-600 text-blue-600 bg-white hover:bg-blue-50 hover:text-blue-700 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-offset-2 focus-visible:ring-blue-600 transition-all"
            >
              View PDF Preview
            </Link>
          </div>
        </div>
      </div>
    </section>
  );
}
