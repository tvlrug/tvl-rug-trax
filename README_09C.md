# TRAX 09C.1 — Read-only historical overview (patch)

This is a **single page patch**, deliberately not a full project replacement.

1. Back up `D:\Apps\RAPS\trax_09b_security` to a new `D:\Apps\RAPS\trax_09c_web` working copy using robocopy `/E /XD node_modules .next .git`.
2. Copy the enclosed `src\app\(protected)\overview\page.tsx` into the new copy, replacing only that file.
3. In the new directory run `npm install`, `npx eslint .`, `npm run build`, `npm audit --omit=dev`.
4. Test on port 3002: `npm run dev -- -p 3002`. Sign in as approved user.

This page uses the existing user-scoped SSR Supabase client and table RLS. No service key, SQL connection, database writes, browser-accessible secrets, or changes to auth/proxy are required.

The default range is the previous seven complete **UTC** dates (explicitly labelled, pending future railway-day-local refinement). Max 31 days. Up to 124 operator-days; both result sets are limited to 150 to avoid PostgREST default pagination loss. Any missing/duplicate record blocks statistics. Published rows with `UNVERIFIED` status show observed figures labelled unverified. It is not a certification of input completeness. Cancellations are counts only: rate denominators require separate specification.

This is a first functional implementation and has NOT been verified against the live project. Stop at the first build error and share the output. Don't overwrite the existing security workspace.
