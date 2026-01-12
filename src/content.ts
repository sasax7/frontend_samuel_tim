export const content = {
  // SEO & Meta
  seo: {
    title: "Samuel Tim | Energy Anomaly Detection Thesis",
    description:
      "Bachelor thesis on probabilistic foundation models for contextual energy anomaly detection, with root cause attribution and financial impact quantification.",
    keywords:
      "energy anomaly detection, contextual anomalies, probabilistic forecasting, time-series foundation models, root cause attribution, financial impact quantification, smart buildings, Eliona, BOPTEST",
    author: "Samuel Tim",
    siteUrl: "https://samueltim.com",
    image: "/og-image.jpg",
  },

  // Navigation
  nav: {
    logo: "Samuel Tim",
    links: [
      { label: "Home", href: "/" },
      { label: "About", href: "/#about" },
      { label: "Anomaly Detection", href: "/anomaly-detection" },
    ],
  },

  // Hero Section
  hero: {
    greeting: "Bachelor Thesis",
    name: "Contextual Energy Anomaly Detection",
    title: "Probabilistic Foundation Models",
    subtitle:
      "Towards universal probabilistic foundation models for contextual energy anomaly detection with root cause attribution and financial impact quantification.",
    cta: {
      primary: { text: "Read The Thesis", href: "/anomaly-detection" },
      secondary: { text: "Research Context", href: "/#about" },
    },
  },

  // About Section
  about: {
    title: "About This Research",
    description:
      "This thesis investigates how building-energy telemetry can be monitored with contextual, probabilistic anomaly detection that is deployable at portfolio scale and actionable for operations.",
    paragraphs: [
      "Many building automation systems rely on static rules or deterministic residual thresholds and struggle with non-stationarity, multimodality, and contextual regime changes. This work reframes anomaly detection as a distribution-aware, context-dependent modelling problem.",
      "The core contributions combine probabilistic time-series modelling (including time-series foundation models) with distribution-aware scoring, signed financial impact estimates, and hierarchy-aware root cause attribution. The system is implemented and integrated into the Eliona smart building platform, backed by a domain-specific benchmark based on BOPTEST.",
    ],
    skills: [
      "Probabilistic Forecasting",
      "Time-Series Foundation Models",
      "Mixture Density Networks",
      "Distribution-Aware Scoring",
      "Root Cause Attribution",
      "Financial Impact Quantification",
      "Python",
      "Production System Integration",
    ],
  },
  // Anomaly Detection Section
  anomalyDetection: {
    title: "Contextual Energy Anomaly Detection",
    subtitle: "Bachelor Thesis · 2025",
    description:
      "A production-oriented framework for detecting contextual anomalies in multivariate building-energy time series using probabilistic models, with root cause attribution and conservative financial impact quantification.",
    // Served directly from this site's /public directory.
    pdfUrl: "/bachelor.pdf",
    highlights: [
      "Formalizes contextual anomaly detection under non-stationarity and multimodality and critiques sequential forecasting-based detectors for sustained faults.",
      "Implements distribution-aware anomaly scoring (e.g., quantile-based bounds and density/quantile severity) and translates deviations into signed, conservative monetary impact estimates.",
      "Delivers an end-to-end, multi-tenant implementation integrated into the Eliona platform, including hierarchy-aware root cause attribution and a BOPTEST-based benchmark for realistic evaluation.",
    ],
  },

  // Social & Footer
  social: [
    { name: "GitHub", url: "https://github.com/sasax7", icon: "github" },
    {
      name: "LinkedIn",
      url: "https://www.linkedin.com/in/samuel-tim-77b326387/",
      icon: "linkedin",
    },
  ],

  footer: {
    text: "Bachelor thesis on contextual energy anomaly detection built with React, TypeScript, and Tailwind CSS",
    copyright: `© ${new Date().getFullYear()} Samuel Tim. All rights reserved.`,
  },
};
