# VyteKit

Self-hosted, minimalist invite and RSVP kit for creating events, managing guest lists, and tracking responses.

## Features

- Create events with named guest lists (plus-ones, notes)
- Per-guest RSVP links (private; not exposed on the public event page)
- Admin dashboard with counts and copy/send invite
- Pluggable email: SMTP, Resend, or copy-link-only (no email)

## Local development

```bash
npm install
npx prisma generate
npx prisma migrate dev
npm run dev
```

Open `http://localhost:3000`.

## Docker

```bash
docker compose up --build
```

Data persists in the `vytekit_data` volume.

## Configuration

| Variable | Description |
|----------|-------------|
| `DATABASE_URL` | SQLite: `file:./dev.db` or `file:/data/dev.db` (Docker) |
| `APP_URL` | Base URL for invite links (e.g. `https://yourdomain.com`) |
| `EMAIL_PROVIDER` | `none`, `smtp`, or `resend` |
| `EMAIL_FROM` | Sender address (e.g. `VyteKit <noreply@yourdomain.com>`) |

### SMTP (`EMAIL_PROVIDER=smtp`)

- `SMTP_HOST` - Server hostname
- `SMTP_PORT` - Usually 587 (TLS) or 465 (SSL)
- `SMTP_SECURE` - `true` for port 465
- `SMTP_USER` / `SMTP_PASS` - Optional auth

### Resend (`EMAIL_PROVIDER=resend`)

- `RESEND_API_KEY` - From [resend.com](https://resend.com)

Copy `.env.example` to `.env` and set values as needed.
