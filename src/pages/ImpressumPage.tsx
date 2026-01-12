export default function ImpressumPage() {
  return (
    <div className="pt-24 pb-20">
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
        <p className="text-primary font-semibold uppercase tracking-[0.3em] mb-4">
          Rechtliches
        </p>
        <h1 className="text-4xl sm:text-5xl font-bold text-gray-900 mb-8">
          Impressum
        </h1>

        <div className="prose prose-slate max-w-none">
          <p>Angaben gemäß § 5 DDG</p>

          <p>
            <strong>Samuel Tim</strong>
            <br />
            Rheingutstraße 36
            <br />
            78462 Konstanz
            <br />
            Deutschland
          </p>

          <h2>Kontakt</h2>
          <p>E-Mail: samueltim200@yahoo.de</p>

          <h2>Verantwortlich für den Inhalt</h2>
          <p>Samuel Tim (Anschrift wie oben)</p>

          <h2>Haftung für Links</h2>
          <p>
            Diese Website enthält ggf. Links zu externen Websites Dritter. Auf
            deren Inhalte habe ich keinen Einfluss; für die Inhalte der
            verlinkten Seiten ist stets der jeweilige Anbieter oder Betreiber
            verantwortlich.
          </p>
        </div>
      </div>
    </div>
  );
}
