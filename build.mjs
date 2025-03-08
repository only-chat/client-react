#!/usr/bin/env node

import esbuild from 'esbuild'
import { copyFile, writeFile } from 'node:fs/promises'

const result = await esbuild.build({
  entryPoints: ['src/index.tsx'],
  bundle: true,
  outfile: 'build/index.js',
  sourcemap: true,
  metafile: true,
  define: {
    'process.env.WS_HOST': '"http://github.vyatkin.com/only-chat/ws"',
  }
})

await copyFile('src/index.html', 'build/index.html')
await copyFile('src/favicon.ico', 'build/favicon.ico')
await copyFile('src/index.css', 'build/index.css')

await writeFile('build/meta.json', JSON.stringify(result.metafile))