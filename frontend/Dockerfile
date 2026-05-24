# Build all 4 Angular projects (shell + 3 remotes) in one stage, serve shell via nginx.
# Remotes are served by separate images (Dockerfile.remote-*).
ARG PROJECT=shell
ARG PORT=4200

FROM node:22-alpine AS builder
WORKDIR /app
COPY package.json package-lock.json ./
RUN npm ci --prefer-offline
COPY . .
RUN npm run build -- --project ${PROJECT} --configuration production

FROM nginx:1.27-alpine
ARG PROJECT=shell
ARG PORT=4200
COPY --from=builder /app/dist/${PROJECT}/browser /usr/share/nginx/html
RUN printf "server {\n  listen ${PORT};\n  root /usr/share/nginx/html;\n  index index.html;\n  location / { try_files \$uri \$uri/ /index.html; }\n}\n" \
    > /etc/nginx/conf.d/default.conf
EXPOSE ${PORT}
