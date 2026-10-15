// Compila server.ts → dist/server.cjs (multiplataforma: Windows, Linux, macOS)
import { build } from 'esbuild';

await build({
  entryPoints: ['server.ts'],
  bundle: true,
  platform: 'node',
  format: 'cjs',
  target: 'node20',
  packages: 'external',
  sourcemap: true,
  outfile: 'dist/server.cjs',
  define: { 'process.env.NODE_ENV': '"production"' },
  logLevel: 'info',
});
