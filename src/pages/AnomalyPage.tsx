import AnomalyDetection from "../components/AnomalyDetection";

export default function AnomalyPage() {
  return (
    <div className="pt-24">
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 text-center mb-10">
        <p className="text-primary font-semibold uppercase tracking-[0.3em] mb-4">
          Thesis
        </p>
        <h1 className="text-4xl sm:text-5xl font-bold text-gray-900">
          Full Thesis: Anomaly Detection for Industrial Assets
        </h1>
      </div>
      <AnomalyDetection />
    </div>
  );
}
