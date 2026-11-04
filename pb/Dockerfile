# PocketBase + mängude serveriosa (hooks) ja migratsioonid samas image'is.
# Redeploy (`docker compose up -d --build`) uuendab seega kõike korraga: ei mingeid käsitsi samme.

# 1) Genereeri reeglimoodulid alati värskest lähtekoodist (ei sõltu hostis olevast vanast .cjs failist)
FROM node:22-alpine AS rules
WORKDIR /src
RUN npm install --no-audit --no-fund --prefix /tmp/tools esbuild@0.25.12
COPY frontend/src/games ./frontend/src/games
COPY pb/pb_hooks ./pb/pb_hooks
RUN NODE_PATH=/tmp/tools/node_modules node -e " \
  const {build}=require('esbuild'); \
  const o={bundle:true,format:'cjs',platform:'neutral',target:'es2019'}; \
  Promise.all([ \
    build({...o,entryPoints:['frontend/src/games/uno-flex/rules.ts'],outfile:'pb/pb_hooks/uno-flex-rules.cjs'}), \
    build({...o,entryPoints:['frontend/src/games/kinnistu-deal/logic.ts'],outfile:'pb/pb_hooks/kinnistu-deal-rules.cjs'}) \
  ]).catch(e=>{console.error(e);process.exit(1)})"

# 2) PocketBase koos hooks'i ja migratsioonidega
FROM ghcr.io/muchobien/pocketbase:latest
COPY pb/pb_migrations /pb_migrations
COPY --from=rules /src/pb/pb_hooks /pb_hooks
