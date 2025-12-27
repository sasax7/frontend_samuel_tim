export const content = {
  // SEO & Meta
  seo: {
    title: "Samuel Tim | Anomaly Detection Thesis",
    description:
      "Bachelor thesis focused on unsupervised anomaly detection for industrial telemetry. Read the paper and explore the research highlights.",
    keywords: "anomaly detection, time-series, industrial IoT, bachelor thesis",
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
    name: "Anomaly Detection",
    title: "Monitoring Industrial Assets in Real Time",
    subtitle:
      "Unsupervised learning techniques that surface anomalies in streaming sensor data before failures escalate.",
    cta: {
      primary: { text: "Read The Thesis", href: "/anomaly-detection" },
      secondary: { text: "Research Context", href: "/#about" },
    },
  },

  // About Section
  about: {
    title: "About This Research",
    description:
      "I spent the final year of my bachelor's program studying how industrial IoT data streams can be monitored with unsupervised anomaly detection models.",
    paragraphs: [
      "The project bridges statistical signal processing with modern representation learning. I built repeatable pipelines that ingest raw OPC-UA telemetry, clean and align the signals, and feed them into deep autoencoders and tree-based models.",
      "Beyond modeling, I focused on operationalizing the findings: packaging inference into lightweight services, validating alerts with domain experts, and translating the insights into actionable maintenance recommendations.",
    ],
    skills: [
      "Python & PyTorch",
      "Scikit-learn & Pandas",
      "Time-Series Modeling",
      "Autoencoders & Isolation Forest",
      "Signal Processing",
      "Edge Deployment",
      "MLOps Fundamentals",
      "Technical Writing",
    ],
  },
  // Anomaly Detection Section
  anomalyDetection: {
    title: "Anomaly Detection",
    subtitle: "Bachelor Thesis · 2025",
    description:
      "The thesis investigates how unsupervised models can surface anomalies across hundreds of industrial sensors before downtime occurs.",
    highlights: [
      "Curated and synchronized 120M+ telemetry points from OPC-UA streams into a reproducible preprocessing pipeline.",
      "Benchmarked statistical baselines against deep autoencoders and isolation forests with custom evaluation metrics tied to maintenance KPIs.",
      "Packaged the best-performing model into a lightweight inference service that production teams can deploy at the edge.",
    ],
  },

  // Social & Footer
  social: [
    { name: "GitHub", url: "https://github.com/samueltim", icon: "github" },
    {
      name: "LinkedIn",
      url: "https://linkedin.com/in/samueltim",
      icon: "linkedin",
    },
    { name: "Twitter", url: "https://twitter.com/samueltim", icon: "twitter" },
    { name: "Email", url: "mailto:hello@samueltim.com", icon: "email" },
  ],

  footer: {
    text: "Anomaly detection thesis built with React, TypeScript, and Tailwind CSS",
    copyright: `© ${new Date().getFullYear()} Samuel Tim. All rights reserved.`,
  },
};
