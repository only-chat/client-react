#!/usr/bin/env node

import esbuild from 'esbuild'

let ctx = await esbuild.context({
  entryPoints: ['src/index.tsx'],
  bundle: true,
  outdir: 'build',
  sourcemap: true,
  define: {
    'process.env.WS_HOST': '"http://github.vyatkin.com/only-chat/ws"',
  }
})

let { host, port } = await ctx.serve({
  servedir: 'build',
})

console.log(`Server started on http://${host}:${port}`)