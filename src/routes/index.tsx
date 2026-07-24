import { createFileRoute } from '@tanstack/react-router'

// Placeholder shell only. The real `/` resolves the locale from the `locale`
// cookie, then Accept-Language, then `ro`, and redirects 302 to `/ro` | `/en`
// (CLAUDE.md §11). No UI is built yet.
export const Route = createFileRoute('/')({
  component: Home,
})

function Home() {
  return <main />
}
