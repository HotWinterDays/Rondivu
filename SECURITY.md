# Security

This document summarizes the security posture of Rondivu and provides guidance for safe deployment.

## Security Measures Implemented

### Authentication & Authorization
- **bcrypt** (cost 12) for password hashing
- JWT sessions (24h, HttpOnly, SameSite=Lax, Secure in production)
- Permission-based access: Create Event, Modify Settings gated by user roles
- Admin key for event management: treat as a shared secret; anyone with it can manage the event

### Input Validation
- **Open redirect prevention**: `returnTo` in login/setup/migrate is validated server-side; only relative paths (`/...`) are accepted
- **Email provider whitelist**: `provider` must be `none`, `smtp`, or `resend`; `smtpSecure` must be `true`/`false`/`1`/`0`
- **Event creation**: Zod schema validates title (max 140), description (2000), guests, etc.
- **Guest message**: Truncated to 2000 characters server-side; client enforces `maxLength`

### Output
- React escapes all user content by default (no `dangerouslySetInnerHTML`)
- Guest names, messages, notes, event titles rendered as text

### HTTP Headers (next.config.ts)
- `X-Frame-Options: SAMEORIGIN`
- `X-Content-Type-Options: nosniff`
- `Referrer-Policy: strict-origin-when-cross-origin`
- `Permissions-Policy`: camera, microphone, geolocation disabled

### Secrets
- Session secret stored in DB, generated on first setup
- SMTP/Resend credentials stored in DB (Settings); env vars override when set
- Admin and guest tokens are high-entropy (base64url, 18–24 bytes)

---

## Deployment Recommendations

### Production Checklist
1. **HTTPS only**: Ensure `NODE_ENV=production` and your reverse proxy (Nginx, Caddy, etc.) terminates TLS
2. **Database**: Prefer PostgreSQL for production; SQLite is fine for single-user/low-traffic
3. **Email**: Configure SMTP or Resend and set `APP_URL` to your public base URL
4. **Backups**: Regularly backup the database and `prisma/migrations`

### Cookie Security
- In production, cookies use `Secure` only when `NODE_ENV === "production"`
- If running behind HTTPS with a different NODE_ENV, consider setting `secure: true` in `auth.ts` explicitly

---

## Known Considerations (Not Fixes, By Design)

| Topic | Notes |
|-------|------|
| **Admin key in URL** | Event admin links include `?key=...`. These URLs appear in logs, browser history, and referrer headers. Treat them as secrets; don't share publicly. |
| **User enumeration** | Login returns the same "Incorrect email or password" for invalid email vs wrong password to avoid leaking account existence. |
| **Guest token auth** | RSVP is authorized by guest token only. Tokens are unguessable; possession = authorization. |

---

## Future Hardening Ideas

- **Rate limiting**: Add rate limits for login, invite, and RSVP actions (e.g. 5 attempts per IP per 15 min)
- **Account lockout**: After N failed logins, temporary lock or captcha
- **CSP**: Add Content-Security-Policy header (may require tuning for inline scripts if any)
- **Audit logging**: Log sensitive actions (login, invite sent, user created) for forensics

---

## Reporting Vulnerabilities

If you discover a security issue, please report it responsibly. See the project’s GitHub security policy or contact the maintainers directly.
