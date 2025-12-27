export interface Project {
  id: number;
  title: string;
  description: string;
  image: string;
  technologies: string[];
  category: string;
  link?: string;
  github?: string;
}

export interface SocialLink {
  name: string;
  url: string;
  icon: string;
}

export const content = {
  // SEO & Meta
  seo: {
    title: "Samuel Tim | Full-Stack Developer Portfolio",
    description: "Full-stack developer specializing in React, TypeScript, and Node.js. View my projects and get in touch.",
    keywords: "web developer, full-stack developer, react, typescript, portfolio",
    author: "Samuel Tim",
    siteUrl: "https://samueltim.com",
    image: "/og-image.jpg"
  },

  // Navigation
  nav: {
    logo: "ST",
    links: [
      { label: "Home", href: "#home" },
      { label: "About", href: "#about" },
      { label: "Projects", href: "#projects" },
      { label: "Contact", href: "#contact" }
    ]
  },

  // Hero Section
  hero: {
    greeting: "Hi, I'm",
    name: "Samuel Tim",
    title: "Full-Stack Developer",
    subtitle: "I build exceptional web applications with modern technologies",
    cta: {
      primary: { text: "View Projects", href: "#projects" },
      secondary: { text: "Contact Me", href: "#contact" }
    }
  },

  // About Section
  about: {
    title: "About Me",
    description: "I'm a passionate full-stack developer with expertise in building modern web applications. I love creating user-friendly, performant, and scalable solutions.",
    paragraphs: [
      "With several years of experience in web development, I specialize in React, TypeScript, Node.js, and modern web technologies. I'm committed to writing clean, maintainable code and building products that make a difference.",
      "When I'm not coding, you can find me exploring new technologies, contributing to open-source projects, or sharing knowledge with the developer community."
    ],
    skills: [
      "React & TypeScript",
      "Node.js & Express",
      "Next.js & Vite",
      "Tailwind CSS",
      "PostgreSQL & MongoDB",
      "REST & GraphQL APIs",
      "Git & CI/CD",
      "AWS & Docker"
    ]
  },

  // Projects Section
  projects: {
    title: "Projects",
    subtitle: "A collection of my recent work",
    categories: ["All", "Web App", "E-commerce", "API", "Mobile"],
    items: [
      {
        id: 1,
        title: "E-Commerce Platform",
        description: "A full-featured online shopping platform with payment integration, inventory management, and admin dashboard.",
        image: "https://images.unsplash.com/photo-1557821552-17105176677c?w=800&h=500&fit=crop",
        technologies: ["React", "Node.js", "PostgreSQL", "Stripe"],
        category: "E-commerce",
        link: "https://example.com",
        github: "https://github.com"
      },
      {
        id: 2,
        title: "Task Management App",
        description: "Collaborative task management tool with real-time updates, team collaboration features, and analytics.",
        image: "https://images.unsplash.com/photo-1454165804606-c3d57bc86b40?w=800&h=500&fit=crop",
        technologies: ["Next.js", "TypeScript", "MongoDB", "Socket.io"],
        category: "Web App",
        link: "https://example.com"
      },
      {
        id: 3,
        title: "Weather Dashboard",
        description: "Real-time weather information dashboard with forecasts, alerts, and interactive maps.",
        image: "https://images.unsplash.com/photo-1504608524841-42fe6f032b4b?w=800&h=500&fit=crop",
        technologies: ["React", "TypeScript", "Weather API", "Tailwind"],
        category: "Web App",
        github: "https://github.com"
      },
      {
        id: 4,
        title: "RESTful API Service",
        description: "Scalable REST API with authentication, rate limiting, and comprehensive documentation.",
        image: "https://images.unsplash.com/photo-1558494949-ef010cbdcc31?w=800&h=500&fit=crop",
        technologies: ["Node.js", "Express", "PostgreSQL", "JWT"],
        category: "API",
        github: "https://github.com"
      },
      {
        id: 5,
        title: "Portfolio Website",
        description: "Modern, responsive portfolio website with smooth animations and SEO optimization.",
        image: "https://images.unsplash.com/photo-1467232004584-a241de8bcf5d?w=800&h=500&fit=crop",
        technologies: ["React", "TypeScript", "Vite", "Tailwind"],
        category: "Web App",
        link: "https://example.com",
        github: "https://github.com"
      },
      {
        id: 6,
        title: "Mobile App Backend",
        description: "Backend service for mobile application with push notifications and real-time data sync.",
        image: "https://images.unsplash.com/photo-1512941937669-90a1b58e7e9c?w=800&h=500&fit=crop",
        technologies: ["Node.js", "MongoDB", "Firebase", "Express"],
        category: "Mobile",
        github: "https://github.com"
      }
    ] as Project[]
  },

  // Contact Section
  contact: {
    title: "Get In Touch",
    subtitle: "I'm always interested in hearing about new projects and opportunities",
    email: "hello@samueltim.com",
    phone: "+1 (555) 123-4567",
    location: "San Francisco, CA",
    social: [
      { name: "GitHub", url: "https://github.com/samueltim", icon: "github" },
      { name: "LinkedIn", url: "https://linkedin.com/in/samueltim", icon: "linkedin" },
      { name: "Twitter", url: "https://twitter.com/samueltim", icon: "twitter" },
      { name: "Email", url: "mailto:hello@samueltim.com", icon: "email" }
    ] as SocialLink[]
  },

  // Footer
  footer: {
    text: "Built with React, TypeScript, and Tailwind CSS",
    copyright: `© ${new Date().getFullYear()} Samuel Tim. All rights reserved.`
  }
};
