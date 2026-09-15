FROM node:22-alpine
WORKDIR /app
ENV NODE_ENV=production

COPY package.json ./
COPY frontend/package.json ./frontend/
RUN npm install --no-audit --no-fund --include=dev

COPY . .

ARG VITE_BASE_PATH=/
ENV VITE_BASE_PATH=$VITE_BASE_PATH
RUN npm run build || (echo "===== BUILD FAILED =====" && ls -la && exit 1)

EXPOSE 3000
CMD ["npm", "run", "start"]
