# TRAX web deployment checklist

Target: `https://trax.tvl-rug.org.uk`

## Existing scope

Next.js + TypeScript / responsive TVL-RUG dark branding / Supabase Auth / active membership gate / historical overview with coverage checks. Operators, Stations, Trends, Railway periods, Data quality are **placeholders** and MUST NOT be described as implemented.

## Local validation

1. Run `npm ci` (or `npm install` initially to generate a reviewed lockfile), `npm run typecheck`, `npm run lint`, and `npm run build` in this directory.
2. Set `NEXT_PUBLIC_SUPABASE_URL` and `NEXT_PUBLIC_SUPABASE_ANON_KEY` in `.env.local` locally. Use the public anon key ONLY; never use SQL Server credentials, Supabase service-role keys, or private RAPS files in web environment variables.
3. Confirm `trax_members` RLS and publication tables `trax_coverage_daily` / `trax_service_daily` policies. Confirm logout; session refresh; anonymous, inactive, and nonmember denial.
4. Deploy GitHub repository `tvlrug/tvl-rug-trax` to Vercel as a Next.js project (project root `/`). Add the same two public environment variables to Vercel project settings.
5. Register custom domain `trax.tvl-rug.org.uk` in Vercel, then set the Cloudflare DNS record **exactly** as the Vercel project domain panel directs; do not guess the value. Configure Supabase Auth Site URL and redirect allowlist to use the real TRAX domain, preserving the specific callback URLs required by the auth flow.
6. Set up a custom domain HTTPS certificate; verify redirect from HTTP; enable Vercel deployment protection for previews if confidential.
7. Production smoke test: authorized member, invalid credentials, denied users, changed password, log out, desktop/mobile, missing Supabase data, unverified coverage banner, and published data range queries.

## Data integrity gate

A successful historical SQL recovery does not update Supabase by itself. Publish trusted daily rows only after your publication process has refreshed them and coverage validation explicitly allows it. The overview labels unverified data as provisional. Do not claim all history is verified: 2025-10-10, 2025-10-11 and 2025-10-12 RTT source exceptions remain unresolved.

## Status

This package is deployment source, **not confirmation of a successful live deployment**. Runtime build and production connectivity require your environment.
