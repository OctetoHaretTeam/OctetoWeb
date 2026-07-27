/// <reference types="vite/client" />
import { HeadContent, Scripts, createRootRoute } from '@tanstack/react-router'
import type { ReactNode } from 'react'

import { LOCALE_TAGS } from '@/i18n/locale'
import { useLocale } from '@/i18n/use-locale'
import appCss from '@/styles/app.css?url'

export const Route = createRootRoute({
  head: () => ({
    meta: [
      { charSet: 'utf-8' },
      { name: 'viewport', content: 'width=device-width, initial-scale=1' },
      { title: 'OctetoHaret' },
    ],
    links: [{ rel: 'stylesheet', href: appCss }],
  }),
  shellComponent: RootDocument,
})

function RootDocument({ children }: Readonly<{ children: ReactNode }>) {
  // Derived from the URL rather than route context, because the root renders
  // above the `/$locale` route that owns the param (CLAUDE.md §11).
  const locale = useLocale()

  return (
    <html lang={LOCALE_TAGS[locale]}>
      <head>
        <HeadContent />
      </head>
      {/*
        No devtools overlay. It floated a badge over the bottom-right corner of
        every page in development, which sat on top of real content while the
        design was being reviewed. The router can still be inspected from the
        browser's own devtools.
      */}
      <body>
        {children}
        <Scripts />
      </body>
    </html>
  )
}
