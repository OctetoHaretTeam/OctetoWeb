import { describe, expect, test } from 'bun:test'

import {
  absoluteUrl,
  buildPageMeta,
  buildSiteJsonLd,
  DEFAULT_SITE_URL,
  SEO_KEYWORDS,
  SITE_URL,
} from './site'

describe('site URL & absoluteUrl', () => {
  test('DEFAULT_SITE_URL points to https://octetoharet.com', () => {
    expect(DEFAULT_SITE_URL).toBe('https://octetoharet.com')
  })

  test('resolves site-relative paths with or without leading slash', () => {
    expect(absoluteUrl('/ro/team')).toBe(`${SITE_URL}/ro/team`)
    expect(absoluteUrl('en/about')).toBe(`${SITE_URL}/en/about`)
  })

  test('is idempotent on already-absolute http(s) URLs', () => {
    const blobUrl = 'https://abc.public.blob.vercel-storage.com/photo.webp'
    expect(absoluteUrl(blobUrl)).toBe(blobUrl)
  })
})

describe('buildPageMeta', () => {
  test('emits title, description, keywords, OpenGraph and Twitter card tags', () => {
    const meta = buildPageMeta({
      title: 'OctetoHaret — FTC #25474',
      description: 'Echipă de robotică din Chișinău',
      locale: 'ro',
      pathname: '/ro',
      image: '/uploads/hero.webp',
    })

    expect(meta).toContainEqual({ title: 'OctetoHaret — FTC #25474' })
    expect(meta).toContainEqual({
      name: 'description',
      content: 'Echipă de robotică din Chișinău',
    })
    expect(meta).toContainEqual({
      name: 'keywords',
      content: SEO_KEYWORDS.ro,
    })
    expect(meta).toContainEqual({
      property: 'og:title',
      content: 'OctetoHaret — FTC #25474',
    })
    expect(meta).toContainEqual({
      property: 'og:url',
      content: `${SITE_URL}/ro`,
    })
    expect(meta).toContainEqual({
      property: 'og:image',
      content: `${SITE_URL}/uploads/hero.webp`,
    })
    expect(meta).toContainEqual({
      name: 'twitter:card',
      content: 'summary_large_image',
    })
  })

  test('falls back to /logo.webp when image is omitted or null', () => {
    const meta = buildPageMeta({
      title: 'Despre — OctetoHaret',
      description: 'Despre noi',
      locale: 'en',
      image: null,
    })

    expect(meta).toContainEqual({
      property: 'og:image',
      content: `${SITE_URL}/logo.webp`,
    })
  })
})

describe('buildSiteJsonLd', () => {
  test('includes Organization and WebSite with team aliases and #25474 identifier', () => {
    const jsonLd = buildSiteJsonLd('ro') as {
      '@context': string
      '@graph': Array<Record<string, unknown>>
    }

    expect(jsonLd['@context']).toBe('https://schema.org')
    expect(jsonLd['@graph']).toHaveLength(2)

    const org = jsonLd['@graph'][0]
    expect(org.name).toBe('OctetoHaret')
    expect(org.identifier).toBe('25474')
    expect(org.alternateName).toContain('Octeto')
    expect(org.alternateName).toContain('Octeto Haret')
    expect(org.alternateName).toContain('FTC 25474')
    expect(org.alternateName).toContain('#25474')
    expect(org.alternateName).toContain('25474')
  })
})
