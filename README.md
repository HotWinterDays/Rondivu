# VyteKit

Self-hosted, minimalist invite and RSVP kit for creating events, managing guest lists, and tracking responses.

## Features

- Create events with named guest lists (plus-ones, notes)
- Per-guest RSVP links (private; not exposed on the public event page)
- Admin dashboard with counts, copy/send invite
- Email: SMTP, Resend, or copy-link-only (no email)
- **Settings UI** – configure email and app URL in the browser (stored in DB)
- **First-run admin setup** – create a password on first use (stored hashed in DB); protects Settings and event dashboards

## Local development

```bash
npm install
npx prisma generate
npx prisma migrate dev
npm run dev
```

Open `http://localhost:3000`. On first visit to Settings or an event dashboard, you’ll be prompted to set an admin password.

## Docker

```bash
docker compose up --build
```

Data persists in the `vytekit_data` volume.

## Configuration

### Environment variables (minimal)

| Variable | Description |
|----------|-------------|
| `DATABASE_URL` | SQLite: `file:./dev.db` (local) or `file:/data/dev.db` (Docker) |

`DATABASE_URL` is the only required env var. Copy `.env.example` to `.env` and set it.

### Settings UI (recommended)

Most configuration is done in the **Settings** page after you’ve set an admin password:

1. Go to Settings (or create an event and use the admin link).
2. On first run, set an admin password at `/admin/setup`.
3. Configure **App URL**, **Email provider** (none / SMTP / Resend), **From address**, and provider-specific fields.

Values are stored in the database. Env vars override these if both are set.

### Optional env overrides

If you prefer env vars (or need them for Docker), you can set:

| Variable | Overrides |
|----------|-----------|
| `APP_URL` | App URL for invite links |
| `EMAIL_PROVIDER` | `none`, `smtp`, or `resend` |
| `EMAIL_FROM` | Sender address (e.g. `VyteKit <noreply@yourdomain.com>`) |
| `SMTP_HOST`, `SMTP_PORT`, `SMTP_SECURE`, `SMTP_USER`, `SMTP_PASS` | SMTP settings |
| `RESEND_API_KEY` | Resend API key |

See `.env.example` for the full list. Values set in the Settings UI take effect immediately; env vars are read at startup.
