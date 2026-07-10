# Deployment checklist

Use this list for the initial release and after dependency, authentication, PWA, or database changes.

## Before deploying

- [ ] Run `nvm use` and confirm Node.js 24 is active.
- [ ] Run `npm ci` from a clean checkout.
- [ ] Run `npm run check` and confirm lint, typechecking, tests, and the production build pass.
- [ ] Review `npm audit --omit=dev`; investigate any new production advisory before release.
- [ ] Back up the Supabase database before applying migrations.
- [ ] Apply all unapplied files in `supabase/migrations/` in filename order.
- [ ] Confirm `APP_ALLOWED_EMAILS` contains every intended production user.
- [ ] Confirm public Supabase signup is disabled unless intentionally supported.
- [ ] Set `NEXT_PUBLIC_COOKIE_DOMAIN` only if authentication must span subdomains.
- [ ] Verify Gemini and optional fallback Notion credentials are present in the deployment environment.

## Immediately after deploying

- [ ] Open `/login` in a private window and confirm unauthenticated users cannot access `/`, `/library`, `/settings`, or protected APIs.
- [ ] Sign in with an allowlisted account and confirm `/login` redirects to Capture.
- [ ] Try a non-allowlisted account and confirm it is signed out with an access-denied message.
- [ ] Upload a harmless screenshot and verify analysis, the success message, and the new Stash card.
- [ ] Paste a public HTTPS link and verify its preview saves immediately and enrichment appears after refresh.
- [ ] Record a short voice note, allow microphone access, and verify the transcription can be saved as a Note.
- [ ] Search for each new item and exercise the type/link filters.
- [ ] Add and edit card notes, refresh, and confirm the changes persist.
- [ ] Send one discovery and one link to Notion; verify the correct configured page receives them.
- [ ] Delete a test item and confirm it disappears locally and remains deleted after refresh.

## Mobile and PWA checks

- [ ] Test at 320px, 390px, and 430px widths with no horizontal scrolling.
- [ ] On iOS Safari, add the app to the Home Screen and launch it in standalone mode.
- [ ] On Android Chrome, install the app and verify the Capture and Stash shortcuts.
- [ ] Confirm the icon, title, theme color, portrait orientation, bottom safe-area spacing, and 44px touch targets.
- [ ] Visit Capture and Stash once, enable airplane mode, then confirm previously visited screens remain available.
- [ ] While offline, queue a screenshot or voice capture and confirm the pending badge appears.
- [ ] Reconnect and confirm the queue drains exactly once and the item becomes available after refresh.
- [ ] Deny microphone permission and confirm the app shows a useful error without becoming stuck.
- [ ] Inspect `/sw.js` and confirm `Cache-Control: no-cache, no-store, must-revalidate` is present.

## API and security checks

- [ ] Call `GET /api/control/stash` without a token and confirm it returns `401`.
- [ ] Call it with an allowlisted user's token and verify discoveries, links, and note-type discoveries are returned once.
- [ ] Test `q`, `kind`, `archived`, `limit`, and `offset` parameters.
- [ ] Confirm CORS headers are returned only for the approved origins in `proxy.ts`.
- [ ] Confirm security headers include `X-Content-Type-Options`, `X-Frame-Options`, `Referrer-Policy`, and `Permissions-Policy`.
- [ ] Inspect Supabase RLS policies and verify one user cannot read or modify another user's rows.
- [ ] Confirm API keys and Notion tokens never appear in browser logs, screenshots, or repository files.

## Monitoring after release

- [ ] Watch deployment logs for authentication refresh loops, sync retries, Gemini failures, and Notion errors.
- [ ] Check Supabase row counts after the legacy-note migration.
- [ ] Test a real mobile capture again after the first service-worker update.
- [ ] Create a GitHub release and record any known dependency advisory that has no stable upstream fix.
