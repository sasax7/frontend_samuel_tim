# Samuel Tim Portfolio

A modern, responsive one-page portfolio website built with React, TypeScript, and Vite.

## 🚀 Features

- **Responsive Design**: Fully responsive across all devices (mobile, tablet, desktop)
- **Modern UI**: Clean and professional design using Tailwind CSS
- **SEO Optimized**: Complete meta tags, OpenGraph, and Twitter Card support
- **Accessible**: ARIA labels, semantic HTML, and keyboard navigation
- **Filterable Projects**: Interactive project gallery with category filters
- **Smooth Animations**: Elegant animations and transitions
- **Easy Content Management**: All content editable through `src/content.ts`

## 📋 Sections

1. **Navbar** - Sticky navigation with mobile menu
2. **Hero** - Eye-catching introduction with CTAs
3. **About** - Personal information and skills showcase
4. **Projects** - Filterable project cards with live demos and GitHub links
5. **Contact** - Contact information, social links, and contact form
6. **Footer** - Quick links and social media

## 🛠️ Tech Stack

- **React 19** - UI library
- **TypeScript** - Type safety
- **Vite** - Build tool and dev server
- **Tailwind CSS** - Utility-first CSS framework
- **ESLint** - Code linting

## 📦 Installation

1. Clone the repository:
```bash
git clone https://github.com/sasax7/frontend_samuel_tim.git
cd frontend_samuel_tim
```

2. Install dependencies:
```bash
npm install
```

3. Start the development server:
```bash
npm run dev
```

The application will be available at `http://localhost:5173`

## 🎨 Customization

All content can be easily customized by editing the `src/content.ts` file:

```typescript
export const content = {
  seo: { /* SEO meta tags */ },
  nav: { /* Navigation links */ },
  hero: { /* Hero section content */ },
  about: { /* About section content */ },
  projects: { /* Projects and categories */ },
  contact: { /* Contact information */ },
  footer: { /* Footer content */ }
};
```

### Adding Projects

Add new projects to the `projects.items` array in `src/content.ts`:

```typescript
{
  id: 7,
  title: "Your Project",
  description: "Project description",
  image: "https://your-image-url.com/image.jpg",
  technologies: ["React", "TypeScript"],
  category: "Web App",
  link: "https://demo.com",
  github: "https://github.com/username/repo"
}
```

### Customizing Colors

Edit the Tailwind configuration in `tailwind.config.js`:

```javascript
theme: {
  extend: {
    colors: {
      primary: '#3b82f6',  // Change primary color
      secondary: '#1e293b', // Change secondary color
    },
  },
}
```

## 🏗️ Build

Create a production build:

```bash
npm run build
```

The built files will be in the `dist/` directory.

Preview the production build:

```bash
npm run preview
```

### Backend API konfigurieren

Das Frontend erwartet eine Build-Variable `VITE_BACKEND_URL`, die auf den öffentlich
erreichbaren Backend-Endpunkt zeigt (z. B. `https://api.samueltim.com`).

1. Kopiere `.env.example` nach `.env` oder `.env.production` und passe den Wert an.
2. Stelle sicher, dass beim Docker-Build (bzw. CI/CD) die Variable gesetzt wird, z. B.

```bash
docker build --build-arg VITE_BACKEND_URL=https://api.samueltim.com .
```

Für lokale Entwicklung kann `VITE_BACKEND_URL=http://127.0.0.1:8000` genutzt werden.

## 🚀 Deployment

### Deploy to Vercel

1. Install Vercel CLI:
```bash
npm install -g vercel
```

2. Deploy:
```bash
vercel
```

### Deploy to Netlify

1. Install Netlify CLI:
```bash
npm install -g netlify-cli
```

2. Build and deploy:
```bash
npm run build
netlify deploy --prod --dir=dist
```

### Deploy to GitHub Pages

1. Install gh-pages:
```bash
npm install -g gh-pages
```

2. Add to `package.json`:
```json
"scripts": {
  "deploy": "npm run build && gh-pages -d dist"
}
```

3. Set base in `vite.config.ts`:
```typescript
export default defineConfig({
  base: '/frontend_samuel_tim/',
  plugins: [react()],
})
```

4. Deploy:
```bash
npm run deploy
```

### Deploy to Other Platforms

The `dist/` folder contains static files that can be deployed to:
- **AWS S3 + CloudFront**
- **Firebase Hosting**
- **DigitalOcean App Platform**
- **Render**
- Any static hosting service

## 📝 Scripts

- `npm run dev` - Start development server
- `npm run build` - Build for production
- `npm run preview` - Preview production build
- `npm run lint` - Run ESLint

## 🔧 Configuration Files

- `vite.config.ts` - Vite configuration
- `tailwind.config.js` - Tailwind CSS configuration
- `tsconfig.json` - TypeScript configuration
- `eslint.config.js` - ESLint configuration
- `postcss.config.js` - PostCSS configuration

## 📱 Browser Support

- Chrome (latest)
- Firefox (latest)
- Safari (latest)
- Edge (latest)

## 📄 License

This project is open source and available under the MIT License.

## 🤝 Contributing

Contributions, issues, and feature requests are welcome!

## 👤 Author

**Samuel Tim**
- Website: [samueltim.com](https://samueltim.com)
- GitHub: [@samueltim](https://github.com/samueltim)
- LinkedIn: [Samuel Tim](https://linkedin.com/in/samueltim)

---

Built with ❤️ using React, TypeScript, and Tailwind CSS
