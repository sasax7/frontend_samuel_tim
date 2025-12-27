import { Link } from "react-router-dom";
import { content } from "../content";

export default function Footer() {
  const scrollToTop = () => {
    window.scrollTo({ top: 0, behavior: "smooth" });
  };

  return (
    <footer className="bg-secondary text-white py-12">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex flex-col md:flex-row justify-between items-center">
          {/* Left Side - Copyright */}
          <div className="mb-6 md:mb-0 text-center md:text-left">
            <p className="text-gray-300 mb-2">{content.footer.text}</p>
            <p className="text-gray-400 text-sm">{content.footer.copyright}</p>
          </div>

          {/* Right Side - Quick Links */}
          <div className="flex flex-col md:flex-row items-center space-y-4 md:space-y-0 md:space-x-8">
            <div className="flex space-x-6">
              {content.nav.links.map((link) => (
                <Link
                  key={link.href}
                  to={link.href}
                  className="text-gray-300 hover:text-white transition-colors"
                >
                  {link.label}
                </Link>
              ))}
            </div>

            {/* Back to Top Button */}
            <button
              onClick={scrollToTop}
              className="p-2 bg-primary rounded-full hover:bg-blue-600 transition-all transform hover:scale-110"
              aria-label="Scroll to top"
            >
              <svg
                className="w-6 h-6"
                fill="none"
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth="2"
                viewBox="0 0 24 24"
                stroke="currentColor"
              >
                <path d="M5 10l7-7m0 0l7 7m-7-7v18" />
              </svg>
            </button>
          </div>
        </div>

        {/* Social Links */}
        <div className="mt-8 pt-8 border-t border-gray-700">
          <div className="flex justify-center space-x-6">
            {content.social.map((social) => (
              <a
                key={social.name}
                href={social.url}
                target="_blank"
                rel="noopener noreferrer"
                className="text-gray-400 hover:text-white transition-colors"
                aria-label={social.name}
              >
                {social.name}
              </a>
            ))}
          </div>
        </div>
      </div>
    </footer>
  );
}
