import { createFileRoute } from '@tanstack/react-router'

import { SITE_URL } from '@/lib/site'

/**
 * Dynamic `/robots.txt` endpoint — emits crawler rules and points `Sitemap:`
 * at the active `SITE_URL` (`https://octeto.md` by default, or `VITE_SITE_URL`).
 */
export const Route = createFileRoute('/robots.txt')({
  server: {
    handlers: {
      GET: async () => {
        const body = [
          'User-agent: *',
          'Allow: /',
          'Allow: /ro',
          'Allow: /en',
          'Disallow: /admin',
          'Disallow: /api',
          'Disallow: /q/',
          'Disallow: /styleguide',
          '',
          `Sitemap: ${SITE_URL}/sitemap.xml`,
          '',
        ].join('\n')

        return new Response(body, {
          status: 200,
          headers: {
            'content-type': 'text/plain; charset=utf-8',
            'cache-control': 'public, max-age=3600, s-maxage=3600',
          },
        })
      },
    },
  },
})
