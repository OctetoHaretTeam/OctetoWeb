import { defineConfig } from 'vite'
import { devtools } from '@tanstack/devtools-vite'
import { tanstackStart } from '@tanstack/react-start/plugin/vite'
import viteReact from '@vitejs/plugin-react'
import tailwindcss from '@tailwindcss/vite'
import { nitro } from 'nitro/vite'

export default defineConfig({
  server: {
    port: 3000,
  },
  resolve: {
    // Vite 8 resolves the `paths` in tsconfig.json natively; no vite-tsconfig-paths needed.
    tsconfigPaths: true,
  },
  plugins: [
    devtools(),
    // Vercel has no dedicated preset — it is served by Nitro, which detects the
    // Vercel build environment and emits the correct output. See README.
    nitro(),
    tailwindcss(),
    tanstackStart({ srcDirectory: 'src' }),
    // react's plugin must come after start's plugin
    viteReact(),
  ],
})
