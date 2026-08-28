FROM node:22-alpine AS build
WORKDIR /app

# Ensure devDependencies (vite, etc.) install even if NODE_ENV=production is set by the host
ENV NODE_ENV=development

COPY package.json ./
RUN npm install --no-audit --no-fund --include=dev

COPY . .

ARG VITE_BASE_PATH=/
ENV VITE_BASE_PATH=$VITE_BASE_PATH

# Production build output only
ENV NODE_ENV=production
RUN npm run build

FROM nginx:alpine
COPY --from=build /app/dist /usr/share/nginx/html
COPY nginx.conf /etc/nginx/conf.d/default.conf
COPY docker-entrypoint.sh /docker-entrypoint.sh
RUN chmod +x /docker-entrypoint.sh
EXPOSE 80
ENTRYPOINT ["/docker-entrypoint.sh"]
CMD ["nginx", "-g", "daemon off;"]
