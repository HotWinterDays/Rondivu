# Rondivu

Self-hosted, minimalist invite and RSVP kit for creating events, managing guest lists, and tracking online responses.

**This app was built with AI assistance** (Cursor/Claude). Code structure, implementation, and security measures were developed iteratively with an AI coding assistant.

## Tech stack

- **Next.js 16** (App Router), **React 19**, **TypeScript**
- **Prisma** + **SQLite** (PostgreSQL supported via config change)
- **TailwindCSS**, **Zod** (validation), **jose** (JWT), **bcryptjs**
- **next-themes** (dark/light mode)
- **Email**: Nodemailer (SMTP) or Resend

## Features

### Events

- **Create events** — title, subtitle (short tagline), rich-text description, location, dates, host info
- **Banner image** — optional image at top of event page and invite emails; auto-resized to 1MB if larger (JPG/PNG/WebP/GIF)
- **Theme color** — customizable accent color for event page borders and email buttons
- **Edit events** — update title, subtitle, description, and notification preferences from the manage dashboard
- **Delete events** — remove events (with confirmation) from the manage dashboard

### Guests & RSVP

- **Named guest lists** — per-guest plus-ones (granted by creator), internal notes
- **Plus-ones** — creators grant a number (0–10) per guest; guests who are granted plus-ones can add name and email for each person they are bringing
- **Per-guest RSVP links** — private links, not exposed on the public event page
- **RSVP page** — Going / Maybe / Not going, plus-one details (when granted), note to host
- **Public event page** — event info (title, subtitle, description, date, location, host) and banner; no guest list

### Admin dashboard

- **Manage events** — view counts (invited, accepted, maybe, declined, attendees), filter by status, copy RSVP links, send invites
- **Send invites** — individual or bulk email invites with event details, banner, and RSVP link
- **Edit event details** — collapsible section for title, subtitle, description, notification prefs
- **Your events** — logged-in creators see their events on the home page with Manage and View links

### Host notifications

- **RSVP changes** — email host when a guest updates their RSVP
- **New guest** — email host when a guest is added via the manage dashboard
- Configurable per event (on by default for RSVP changes, off for new guests)

### Theming

- **Dark/light mode** — theme toggle in header; persists via `next-themes`; respects system preference

### Users & auth

- **First-run setup** (`/admin/setup`) — create first admin (email + password)
- **Migration** (`/admin/migrate`) — for existing installs with legacy password-only auth
- **User management** (`/users`) — invite users, assign Create Event and Modify Settings permissions
- **Permissions** — admins have all; regular users get permissions via invites
- **Invite flow** — email invite with token; invitee sets password at `/accept-invite/[token]`

### Email

- SMTP, Resend, or copy-link-only (no email)
- **Settings UI** — configure provider, App URL, from address, SMTP/Resend in the browser
- **Test email** — verify config from Settings
- Env vars override DB-stored values when set

### Security

- bcrypt (cost 12), JWT sessions (HttpOnly, SameSite=Lax, Secure in prod)
- Open redirect prevention, input validation, security headers
- See [SECURITY.md](./SECURITY.md) for details and deployment guidance

## Routes

| Route | Description |
|-------|-------------|
| `/` | Home; Your events (when logged in) |
| `/create-event` | Create event (requires permission) |
| `/create-event/success` | Event created — guest & admin links |
| `/e/[publicId]` | Public event page (guests) |
| `/e/[publicId]/g/[token]` | RSVP page (per-guest link) |
| `/event/[publicId]/manage?key=...` | Admin dashboard |
| `/admin/setup` | First-run admin setup |
| `/admin/login` | Log in |
| `/admin/migrate` | Migrate legacy password to user account |
| `/accept-invite/[token]` | Accept user invite, set password |
| `/settings` | Email & app config (requires permission) |
| `/users` | User list & invite form (requires permission) |

## Local development

```bash
npm install
npx prisma generate
npx prisma migrate dev
npm run dev
```

Open `http://localhost:3000`. On first visit to Settings, Create event, or an event dashboard, you’ll be prompted to set up or log in.

## Docker

```bash
docker compose up --build
```

- App runs on port 3000
- Data persists in the `rondivu_data` volume
- DB path: `/data/dev.db`

## Configuration

### Environment variables

| Variable | Description |
|----------|-------------|
| `DATABASE_URL` | **Required**. SQLite: `file:./dev.db` (local) or `file:/data/dev.db` (Docker) |

Copy `.env.example` to `.env` and set `DATABASE_URL`.

### Optional (override Settings UI)

| Variable | Overrides |
|----------|-----------|
| `APP_URL` | Base URL for invite links (e.g. `https://rondivu.example.com`) |
| `EMAIL_PROVIDER` | `none`, `smtp`, or `resend` |
| `EMAIL_FROM` | Sender address (e.g. `Rondivu <noreply@yourdomain.com>`) |
| `SMTP_HOST`, `SMTP_PORT`, `SMTP_SECURE`, `SMTP_USER`, `SMTP_PASS` | SMTP settings |
| `RESEND_API_KEY` | Resend API key |

See `.env.example` for the full list. Settings UI values are stored in the database; env vars override them when set.

### Settings UI (recommended)

1. Run the app; go to `/admin/setup` if first run.
2. After login, open **Settings**.
3. Configure **App URL**, **Email provider** (none / SMTP / Resend), **From address**, and provider-specific fields.
4. Use **Test email** to send a sample and confirm delivery.

## Production

- Use HTTPS (reverse proxy: Nginx, Caddy, etc.)
- Set `NODE_ENV=production`
- For higher traffic, consider PostgreSQL (change `provider` in `prisma/schema.prisma` and `DATABASE_URL` accordingly)
- See [SECURITY.md](./SECURITY.md) for deployment checklist
