import { defineConfig } from 'vite'
import { tanstackStart } from '@tanstack/react-start/plugin/vite'
import viteReact from '@vitejs/plugin-react'
import tailwindcss from '@tailwindcss/vite'
import { nitro } from 'nitro/vite'

/**
 * Security response headers.
 *
 * Deliberately does NOT set a `script-src` CSP. TanStack Start hydrates from
 * inline scripts it injects itself, so a strict script policy needs nonces
 * threaded through the framework's own HTML emission — getting that wrong
 * silently breaks hydration on every page. The directives below are the ones
 * that carry real value without that risk:
 *
 * - `frame-ancestors 'none'` — nothing may frame the site. This is what stops
 *   an attacker overlaying an invisible /admin in an iframe and stealing
 *   clicks from a signed-in administrator (§9 keeps that session for 8 hours).
 *   `X-Frame-Options` repeats it for older browsers that ignore CSP.
 * - `object-src 'none'` and `base-uri 'self'` — kill two injection primitives
 *   (legacy plugin embeds, and rewriting the base URL so every relative script
 *   src resolves to an attacker's host).
 * - `nosniff` — the upload store already forces `image/webp` on stored blobs
 *   (`store.server.ts`), and this stops a browser second-guessing that.
 * - HSTS — the session cookie is `secure` in production, but that only helps
 *   once the browser already knows to use https.
 */
const SECURITY_HEADERS = {
  'content-security-policy':
    "frame-ancestors 'none'; object-src 'none'; base-uri 'self'",
  'x-frame-options': 'DENY',
  'x-content-type-options': 'nosniff',
  'referrer-policy': 'strict-origin-when-cross-origin',
  // No feature here needs these, and denying them is one less thing an
  // injected script could reach for.
  'permissions-policy': 'camera=(), microphone=(), geolocation=(), payment=()',
  'strict-transport-security': 'max-age=31536000; includeSubDomains',
} as const

/**
 * The admin panel additionally must never be cached by a shared proxy and
 * never indexed. Everything under it sits behind a session, and a cached copy
 * on a CDN edge is a copy that outlives the session that produced it.
 */
const ADMIN_HEADERS = {
  ...SECURITY_HEADERS,
  'cache-control': 'no-store, must-revalidate',
  'x-robots-tag': 'noindex, nofollow',
} as const

export default defineConfig({
  server: {
    port: 3000,
  },
  resolve: {
    // Vite 8 resolves the `paths` in tsconfig.json natively; no vite-tsconfig-paths needed.
    tsconfigPaths: true,
  },
  nitro: {
    routeRules: {
      '/**': { headers: { ...SECURITY_HEADERS } },
      /*
       * The admin panel must never be cached by a shared proxy, and must never
       * be indexed. Everything under it is behind a session; a cached copy on
       * a CDN edge is a copy that outlives the session that produced it.
       */
      // Both patterns: `/admin/**` does not match the bare `/admin`, which is
      // the URL that redirects to sign-in and so the one a person types.
      '/admin': { headers: { ...ADMIN_HEADERS } },
      '/admin/**': { headers: { ...ADMIN_HEADERS } },
      '/api/**': {
        headers: {
          ...SECURITY_HEADERS,
          'cache-control': 'no-store',
          'x-robots-tag': 'noindex, nofollow',
        },
      },
    },
  },
  plugins: [
    // No `devtools()` plugin. It injects a floating overlay into every page in
    // development, which covers the bottom-right corner of the real design.
    // Vercel has no dedicated preset — it is served by Nitro, which detects the
    // Vercel build environment and emits the correct output. See README.
    nitro(),
    tailwindcss(),
    tanstackStart({ srcDirectory: 'src' }),
    // react's plugin must come after start's plugin
    viteReact(),
  ],
})
