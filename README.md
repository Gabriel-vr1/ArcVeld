# ArcVeld

ArcVeld is a project for **Field Shift: Adapting Farms with NASA Data**, part of the 2026 NASA Space Apps Challenge. It uses a rainfed groundnut-to-maize transition near Kasungu, Central Malawi, to explore how variable historical rainfall can change the effect of residue-return timing on soil-cover exposure. [Field Shift challenge](https://www.spaceappschallenge.org/2026/challenges/field-shift-adapting-farms-with-nasa-data/)

## Explore the reference case

- **Overview** locates the reference area and shows a bundled Landsat 9 Collection 2 natural-colour image for geographic context.
- **Rotation Planner** compares crop sequences, lets users edit residue-return dates and illustrative soil cover, and records their feasibility answers.
- **Earth Observations** compares five validated NASA POWER / MERRA-2 seasons and includes 76 validated GPM IMERG Final Daily V07 estimates for a matched 2022/23 comparison. The Planner and Earth Observations share the scenario, season and rainfall-source selection.
- **Research & Methodology** documents provenance, assumptions, research citations and limitations. The image and rainfall data are bundled for use without NASA requests or Earthdata sign-in.

The exposure model sums daily regional precipitation multiplied by the estimated uncovered fraction of ground, `Σ Pᵢ(1 − cᵢ)`, in mm-equivalent. The cover curves are illustrative. The result compares historical scenarios. Field-level erosion, crop yield and future risk require separate evidence and are outside the model's scope.

## Run locally

Use Node.js 24 LTS and npm. Node.js 22.13+ on the 22.x line is also supported.

```sh
npm ci
npm run dev
```

## Checks

```sh
python -m unittest discover -s scripts/tests -v
npm run lint
npm run typecheck
npm test
npm run build
npx playwright install chromium
npm run test:e2e
```

The Python checks use Python 3.11 or newer. Playwright serves the production build under `/ArcVeld/` using Vite Preview. Set `ARCVELD_BROWSER=msedge` or `ARCVELD_BROWSER=chrome` to use an installed browser, or install Playwright Firefox and set `ARCVELD_BROWSER=firefox`.

## Deployment

The intended GitHub Pages URL is [gabriel-vr1.github.io/ArcVeld](https://gabriel-vr1.github.io/ArcVeld/). Public deployment verification is pending.

In the repository’s **Settings → Pages → Build and deployment**, set **Source** to **GitHub Actions**. The [deployment workflow](.github/workflows/deploy.yml) runs on pushes to `main` and supports manual runs from the Actions tab. It tests and builds the application, then publishes `dist/` via the `github-pages` environment. The base URL opens Welcome. The hash routes `#/`, `#/planner`, `#/observations` and `#/research` support direct links and refreshes.

After the first successful deployment, run the browser suite with `ARCVELD_E2E_URL=https://gabriel-vr1.github.io/ArcVeld/` set in the shell. This targets the deployed site. In a signed-out browser, also check the Welcome and Landsat views, edit a return date in the Planner, switch between POWER and IMERG in Earth Observations, and open the Research & Methodology citations.

## Research files

An independent POWER acquisition matched all 76 values in the [2022/23 research reference](Arcveld_Malawi_2022_Research_Rainfall_Reference.csv). See the [engineering blueprint](Arcveld_Malawi_Final_MVP_Product_and_Engineering_Blueprint.md), [research provenance](Arcveld_Malawi_2022_Rainfall_Reference_Provenance.json), [data audit](data/README.md) and [third-party notices](THIRD_PARTY_NOTICES.md).

## Submission readiness

- [x] Public repository and Field Shift challenge identification. [Source repository](https://github.com/Gabriel-vr1/ArcVeld)
- [x] Listed NASA data used and credited. The team confirmed the POWER, IMERG and Landsat resource listings, and the audit records their use and scientific limitations. [Field Shift resource evidence](data/README.md#field-shift-resource-eligibility)
- [x] Demo sequence prepared. Enter ArcVeld, switch the Kasungu map to Landsat, modify a managed-return date, compare POWER with IMERG in 2022/23, inspect the 2021/22 reversal, and open the provenance.
- [ ] Publish the Pages workflow and verify the public URL, routes, assets and demo sequence.
- [ ] Team owner supplies team information and confirms event-specific submission fields, demo format and deadline in the official dashboard or with the event lead. [2026 event information](https://www.spaceappschallenge.org/2026/) · [Organizer guidance on resources and credits](https://github.com/nasa/spaceapps/discussions/1827)
