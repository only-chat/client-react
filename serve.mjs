#!/usr/bin/env node

import esbuild from 'esbuild'

let ctx = await esbuild.context({
  entryPoints: ['src/index.tsx'],
  bundle: true,
  outdir: 'build',
  sourcemap: true,
})

let { host, port } = await ctx.serve({
  servedir: 'build',
})

console.log(`Server started on http://${host}:${port}`)