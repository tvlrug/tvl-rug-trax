# TRAX — Train Reporting & Analytics eXplorer

TVL-RUG private historical railway reporting portal. This source package combines the approved 09B secure-member foundation and 09C historical overview.

See `DEPLOYMENT.md` for the complete launch checklist. Dashboard sections other than Overview remain explicitly marked as in development.

```bash
npm install
npm run typecheck
npm run lint
npm run build
npm run dev
```

Copy `.env.example` to `.env.local` and configure only public Supabase project keys.
