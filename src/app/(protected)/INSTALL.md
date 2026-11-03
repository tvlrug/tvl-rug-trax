# TRAX Build 09D — reporting pages

Four pages: Operators, Stations, Trends, Railway periods. Existing Overview is unchanged.

## Preconditions
- TRAX 09C local app and authenticated Supabase session work.
- Tables `trax_coverage_daily`, `trax_service_daily`, `trax_station_daily`, `trax_reporting_periods` are queryable under the existing RLS policies.
- Back up your local app and keep `.env.local` private.

## Install from PowerShell
Extract ZIP to `D:\Apps\TRAX_09D` (so `D:\Apps\TRAX_09D\src` exists). Then:

```powershell
$App = 'D:\Apps\TRAX'
$Patch = 'D:\Apps\TRAX_09D\src'
$Backup = 'D:\Apps\TRAX-Backups\09D_before_install'
New-Item -ItemType Directory -Force $Backup | Out-Null
foreach ($page in @('operators','stations','trends','periods')) {
    $dest = Join-Path $App "src\app\(protected)\$page\page.tsx"
    if (Test-Path -LiteralPath $dest) { Copy-Item -LiteralPath $dest -Destination (Join-Path $Backup "$page-page.tsx") -Force }
    Copy-Item -LiteralPath (Join-Path $Patch "app\(protected)\$page\page.tsx") -Destination $dest -Force
}
Copy-Item -LiteralPath (Join-Path $Patch 'lib\trax-reporting.ts') -Destination (Join-Path $App 'src\lib\trax-reporting.ts') -Force
Copy-Item -LiteralPath (Join-Path $Patch 'components\TraxReportUI.tsx') -Destination (Join-Path $App 'src\components\TraxReportUI.tsx') -Force
Set-Location $App
npm run typecheck
npm run build
```

If an existing `trax-reporting.ts` or `TraxReportUI.tsx` exists, back it up before copying.

Then run `npm run dev` and open `/operators`, `/stations`, `/trends`, `/periods`.

## Acceptance tests
1. Operators: 2025-11-24 to 2025-12-01, all operators. Coverage present; provisional warning; operator comparison.
2. Stations: same range and a known three-letter CRS; arrival/departure measurements and call cancellations.
3. Trends: same range; each day renders, zero-measurement days show em dash.
4. Periods: compare two published period labels; ensure date ranges are correct and provisional status visible.
5. Invalid date range (>31 days) rejects; no KPI aggregates if operator-day counts mismatch.

## Limitations
- No formal source verification; no Supabase writes or schema migrations.
- Range default = last 7 completed UTC days. Operators/stations/trends max 31 days.
- Station counts are measurement-side values and should not be added across arrival/departure as unique station calls.
- Current live deployment and full local typecheck must be verified on the user's machine. No local `.env.local` or production credentials in this ZIP.
- Trends chart is simple HTML and CSS (not a charting dependency).
