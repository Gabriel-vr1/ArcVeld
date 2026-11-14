# ArcVeld

ArcVeld is a soil-cover scenario explorer for a rainfed groundnut-to-maize transition near Kasungu, Central Malawi. Stage 1 provides the one-page application, agricultural scenarios, NASA comparison structure, and source provenance. It displays the research example context and illustrative return dates. Historical calculations and daily rainfall are pending integration.

## Run locally

Use Node.js 24 LTS and npm. Node.js 22.13+ on the 22.x line is also supported.

```sh
npm ci
npm run dev
```

## Checks

```sh
npm run lint
npm run typecheck
npm test
npm run build
npx playwright install chromium
npm run test:e2e
```

The browser tests serve the production build with Vite Preview. Set `ARCVELD_BROWSER=msedge` or `ARCVELD_BROWSER=chrome` in the shell to run against an installed browser channel.

The static build is in `dist/`. Run `npm run preview` to inspect it locally.

## Research files

The [engineering blueprint](Arcveld_Malawi_Final_MVP_Product_and_Engineering_Blueprint.md), [2022/23 reference CSV](Arcveld_Malawi_2022_Research_Rainfall_Reference.csv), and [provenance record](Arcveld_Malawi_2022_Rainfall_Reference_Provenance.json) are project research artifacts. The original NASA POWER provider response and the Field Shift resource listing remain pending verification. The foundation runs without provider requests.

See [third-party notices](THIRD_PARTY_NOTICES.md) for asset and dependency credits.
