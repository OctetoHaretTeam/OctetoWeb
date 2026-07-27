# Environment variables

`.env` is gitignored and holds local development values. `.env.example` keeps
placeholders and **is** committed. Production values belong in Vercel's
project settings — `.env` never deploys.

| Variable | Purpose |
|---|---|
| `DATABASE_URL` | Neon connection string. **Unset locally** so PGlite is used |
| `SESSION_SECRET` | Seals the admin session cookie. Minimum 32 characters |
| `SESSION_MAX_AGE_HOURS` | Session lifetime. Defaults to 8 |
| `ALLOWED_ADMIN_EMAILS` | Comma-separated. The entire authorization decision |
| `GOOGLE_CLIENT_ID` | OAuth client. Public by design |
| `GOOGLE_CLIENT_SECRET` | OAuth secret |
| `GOOGLE_REDIRECT_URI` | Must match Google Console exactly |
| `BLOB_READ_WRITE_TOKEN` | Vercel Blob. Unset → uploads go to `public/uploads/` |
| `VITE_SITE_URL` | Site origin, for canonical and `og:` URLs |

## Rules

> [!danger] Never give a secret a `VITE_` prefix
> Anything `VITE_`-prefixed is inlined into the client bundle. That is why
> `VITE_SITE_URL` is the only one with it — a site's own address is public.

> [!danger] Never commit a real admin email
> `.env.example` keeps placeholders. Real addresses go in `.env` locally and
> in Vercel for production.

Generate a session secret with:

```bash
openssl rand -base64 32
```

## Before the first deploy

- Set every variable above in Vercel
- Add the production callback URL to the Google Console alongside localhost
- Confirm `DATABASE_URL` is set — production refuses to start on PGlite

## Related

[[Running locally]] · [[Auth and admin]] · [[Open questions]]
