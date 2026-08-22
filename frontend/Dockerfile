FROM node:22-alpine AS build
WORKDIR /app

# Install deps first (better layer cache)
COPY package.json ./
RUN npm install --no-audit --no-fund

COPY . .

# Must match public URL subpath, e.g. /mangud/
ARG VITE_BASE_PATH=/
ENV VITE_BASE_PATH=$VITE_BASE_PATH

# Build (vite only – no tsc -b which needs project references)
RUN npm run build

FROM nginx:alpine
COPY --from=build /app/dist /usr/share/nginx/html
COPY nginx.conf /etc/nginx/conf.d/default.conf
COPY docker-entrypoint.sh /docker-entrypoint.sh
RUN chmod +x /docker-entrypoint.sh
EXPOSE 80
ENTRYPOINT ["/docker-entrypoint.sh"]
CMD ["nginx", "-g", "daemon off;"]
