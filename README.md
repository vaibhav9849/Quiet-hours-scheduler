# Quiet Hours Scheduler — Advanced Scaffold

**What's new (advanced):**
- Supabase auth token verification for API routes.
- Email provider fallback: SendGrid (preferred) -> SMTP (nodemailer).
- Atomic reminder marking to avoid duplicate emails (safe for concurrent cron runs).
- Protected cron endpoint (requires CRON_SECRET header).
- Dockerfile and GitHub Actions workflow to schedule the cron endpoint.
- Improved overlap detection and DB indexes suggestion.

## Quick start
1. Copy `.env.example` -> `.env.local` and fill values.
2. `npm install`
3. `npm run dev`
4. Configure scheduler to call `/api/cron-protected` every minute (or every 5 mins for GitHub Actions).

## Notes
- This scaffold is for development/proof-of-concept. Harden secrets, add logging, retries, monitoring for production.
- GitHub Actions cron runs every 5 minutes minimum.
