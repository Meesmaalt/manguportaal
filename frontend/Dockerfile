FROM node:22-alpine AS build
WORKDIR /app

ENV NODE_ENV=development
COPY package.json ./
RUN npm install --no-audit --no-fund --include=dev

COPY . .

ARG VITE_BASE_PATH=/
ENV VITE_BASE_PATH=$VITE_BASE_PATH
ENV NODE_ENV=production

# Show full error if build fails
RUN npm run build || (echo "===== BUILD FAILED =====" && ls -la && exit 1)

FROM nginx:alpine
COPY --from=build /app/dist /usr/share/nginx/html
COPY nginx.conf /etc/nginx/conf.d/default.conf
COPY docker-entrypoint.sh /docker-entrypoint.sh
RUN chmod +x /docker-entrypoint.sh
EXPOSE 80
ENTRYPOINT ["/docker-entrypoint.sh"]
CMD ["nginx", "-g", "daemon off;"]
