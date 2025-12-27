import { content } from '../content';

export default function Hero() {
  return (
    <section
      id="home"
      className="min-h-screen flex items-center justify-center bg-gradient-to-br from-blue-50 to-indigo-100 pt-16"
    >
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-20">
        <div className="text-center">
          {/* Greeting */}
          <p className="text-lg sm:text-xl text-gray-600 mb-4 animate-fade-in">
            {content.hero.greeting}
          </p>

          {/* Name */}
          <h1 className="text-5xl sm:text-6xl lg:text-7xl font-bold text-gray-900 mb-4 animate-fade-in-up">
            {content.hero.name}
          </h1>

          {/* Title */}
          <h2 className="text-3xl sm:text-4xl lg:text-5xl font-bold text-primary mb-6 animate-fade-in-up animation-delay-200">
            {content.hero.title}
          </h2>

          {/* Subtitle */}
          <p className="text-lg sm:text-xl text-gray-600 max-w-2xl mx-auto mb-10 animate-fade-in-up animation-delay-400">
            {content.hero.subtitle}
          </p>

          {/* CTA Buttons */}
          <div className="flex flex-col sm:flex-row gap-4 justify-center animate-fade-in-up animation-delay-600">
            <a
              href={content.hero.cta.primary.href}
              className="px-8 py-4 bg-primary text-white rounded-lg font-semibold hover:bg-blue-600 transition-all transform hover:scale-105 shadow-lg"
              aria-label={content.hero.cta.primary.text}
            >
              {content.hero.cta.primary.text}
            </a>
            <a
              href={content.hero.cta.secondary.href}
              className="px-8 py-4 bg-white text-primary border-2 border-primary rounded-lg font-semibold hover:bg-primary hover:text-white transition-all transform hover:scale-105 shadow-lg"
              aria-label={content.hero.cta.secondary.text}
            >
              {content.hero.cta.secondary.text}
            </a>
          </div>

          {/* Scroll Indicator */}
          <div className="mt-16 animate-bounce">
            <a href="#about" aria-label="Scroll to about section">
              <svg
                className="w-6 h-6 mx-auto text-gray-400"
                fill="none"
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth="2"
                viewBox="0 0 24 24"
                stroke="currentColor"
              >
                <path d="M19 14l-7 7m0 0l-7-7m7 7V3" />
              </svg>
            </a>
          </div>
        </div>
      </div>
    </section>
  );
}
