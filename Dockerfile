# Stage 1: Build
FROM node:20-alpine AS builder

WORKDIR /app

# Abhängigkeiten kopieren und installieren
COPY package*.json ./
RUN npm ci

# Source Code kopieren und bauen
COPY . .
ARG VITE_BACKEND_URL
ENV VITE_BACKEND_URL=${VITE_BACKEND_URL}
RUN npm run build

# Stage 2: Runtime (Nginx)
FROM nginx:stable-alpine

# Kopiere das Build-Ergebnis von Vite (dist Ordner) in das Nginx-Verzeichnis
COPY --from=builder /app/dist /usr/share/nginx/html

# Nginx Konfiguration für Single Page Applications (SPA)
RUN echo 'server { \
    listen 80; \
    location / { \
        root /usr/share/nginx/html; \
        index index.html; \
        try_files $uri $uri/ /index.html; \
    } \
}' > /etc/nginx/conf.d/default.conf

EXPOSE 80

CMD ["nginx", "-g", "daemon off;"]
