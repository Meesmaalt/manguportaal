import { build } from 'esbuild'
await build({entryPoints:['frontend/src/games/uno-flex/rules.ts'],outfile:'pb/pb_hooks/uno-flex-rules.cjs',bundle:true,format:'cjs',platform:'neutral',target:'es2019'})
