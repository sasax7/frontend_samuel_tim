import { useEffect } from 'react';
import { content } from '../content';

export default function SEO() {
  useEffect(() => {
    // Set document title
    document.title = content.seo.title;

    // Set or update meta tags
    const setMetaTag = (property: string, content: string, isProperty = false) => {
      const attribute = isProperty ? 'property' : 'name';
      let element = document.querySelector(`meta[${attribute}="${property}"]`);
      
      if (!element) {
        element = document.createElement('meta');
        element.setAttribute(attribute, property);
        document.head.appendChild(element);
      }
      
      element.setAttribute('content', content);
    };

    // Standard meta tags
    setMetaTag('description', content.seo.description);
    setMetaTag('keywords', content.seo.keywords);
    setMetaTag('author', content.seo.author);

    // Open Graph tags
    setMetaTag('og:title', content.seo.title, true);
    setMetaTag('og:description', content.seo.description, true);
    setMetaTag('og:type', 'website', true);
    setMetaTag('og:url', content.seo.siteUrl, true);
    setMetaTag('og:image', `${content.seo.siteUrl}${content.seo.image}`, true);

    // Twitter Card tags
    setMetaTag('twitter:card', 'summary_large_image');
    setMetaTag('twitter:title', content.seo.title);
    setMetaTag('twitter:description', content.seo.description);
    setMetaTag('twitter:image', `${content.seo.siteUrl}${content.seo.image}`);

    // Additional SEO tags
    setMetaTag('robots', 'index, follow');
    setMetaTag('viewport', 'width=device-width, initial-scale=1.0');
    
    // Canonical URL
    let canonical = document.querySelector('link[rel="canonical"]') as HTMLLinkElement;
    if (!canonical) {
      canonical = document.createElement('link');
      canonical.rel = 'canonical';
      document.head.appendChild(canonical);
    }
    canonical.href = content.seo.siteUrl;
  }, []);

  return null;
}
