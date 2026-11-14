# Kasungu rainfall audit

## NASA POWER acquisition

The app bundles NASA POWER Daily API corrected precipitation (`PRECTOTCORR`, AG community) for the query point at **13.05° S, 33.45° E**. NASA’s response identifies the source as `MERRA2` and the service as POWER Daily API **v2.10.3**. The version refers to the API. The supplied research provenance identifies the same product, variable, community and UTC day basis, and supplies no original API version. [POWER Daily API](https://power.larc.nasa.gov/docs/services/api/temporal/daily/) · [POWER meteorological sources](https://power.larc.nasa.gov/docs/methodology/data/sources_meteorology/)

The canonical query returned **HTTP 200** at **2026-11-14 12:21:39 UTC** and contained **1,902 consecutive daily values**, from 1 November 2018 through 15 January 2024. The saved response SHA-256 is `ffd1e2fcee278c679b011b53beeda18c6ca3d6626c8cdc6e7d5d0a14667f8767`. NASA reported UTC, units of mm/day and a fill sentinel of −999. Each returned value covers one full UTC day, so the numerical value is also the daily amount in mm. The pipeline rejects fill values, duplicate keys, gaps, extra dates, malformed or negative amounts, and mismatched source metadata. This acquisition had zero such defects. POWER supplied no per-day quality flags in this response.

All **76 of 76** 2022/23 daily amounts matched the [frozen research CSV](../Arcveld_Malawi_2022_Research_Rainfall_Reference.csv) exactly, with zero missing dates and zero unexpected values. A separate one-day request returned **83.34 mm** on 27 December 2022. The two new requests returned identical source, units and API metadata. The original research response hash differs from this acquisition’s hash. The research response bytes are unavailable for direct comparison, and separate requests can produce different raw bytes, including service timing metadata. The day-by-day match establishes numerical agreement for the 76 frozen values. The earlier four research seasons have published totals and rounded exposure differences for comparison.

The [normalised bundle](../src/data/rainfall.json) and [validation manifest](../src/data/rainfall-provenance.json) contain the five 76-day seasons. The original response bytes, separate spot check and HTTP receipts stay under Git-ignored `data/raw/`. The research CSV and its provenance remain separate test and fallback evidence. Browser analysis uses bundled data. A failed provider-bundle validation falls back to the labeled 2022/23 research reference if it passes its own validation.

## Reproduce the bundle

Run from the repository root with Python 3.11 or newer.

```sh
# Download a fresh copy for comparison in a separate directory
python scripts/prepare_rainfall.py --fetch --raw-dir data/raw/recheck --output-dir data/raw/recheck

# Rebuild offline from the working copy’s original acquisition and receipts
python scripts/prepare_rainfall.py

# Test the parser, generation, and byte-for-byte replay when raw files are available
python -m unittest discover -s scripts/tests -v
```

A fresh acquisition gets its own UTC timestamp and raw hashes. Replay with the same raw bytes, receipts and frozen research inputs yields identical normalised output. To build a new app snapshot from fresh provider responses, run `python scripts/prepare_rainfall.py --fetch` and review the generated changes, including any day-by-day differences in the manifest.

## Historical exposure

The table uses the unchanged reference assumptions, with residue return on 15 November and 6 December of each season, 15% baseline cover, and the same illustrative cover pulse. Both schedules have **59.225 uncovered area-days** in each season. Exposure and contributions are in mm-equivalent.

| Season | Rainfall (mm) | Uniform, both | Daily earlier | Daily later | Later − earlier | Largest daily contribution by magnitude |
| --- | ---: | ---: | ---: | ---: | ---: | --- |
| 2018/19 | 627.32 | 488.855618 | 487.403250 | 471.131821 | −16.271429 | 24 Nov 2018, 45.47 mm, +11.3675 |
| 2019/20 | 631.15 | 491.840247 | 503.470000 | 493.228214 | −10.241786 | 25 Nov 2019, 25.58 mm, +6.3950 |
| 2020/21 | 430.65 | 335.595345 | 346.605179 | 332.504643 | −14.100536 | 13 Dec 2020, 39.81 mm, −9.9525 |
| 2021/22 | 530.21 | 413.180095 | 434.946357 | 438.472071 | +3.525714 | 26 Nov 2021, 48.95 mm, +12.2375 |
| 2022/23 | 616.35 | 480.306957 | 506.826607 | 468.473929 | −38.352679 | 27 Dec 2022, 83.34 mm, −10.4175 |

The seasonal totals match the five research totals, and the rounded exposure differences match the blueprint, including the **2021/22 reversal**. On 27 December 2022 the model gives 15% earlier and 27.5% later cover. The exposure proxy describes regional historical rainfall under illustrative cover assumptions. Field cover, workability and agricultural outcomes require separate evidence.

## IMERG Final Daily V07

NASA’s public catalog returned 76 distinct UTC granule dates spanning the 2022/23 window for `GPM_3IMERGDF` Version 07. Its 27 December 2022 record identifies a V07B NetCDF granule for 00:00–23:59:59 UTC. NASA documents a daily 0.1° × 0.1° grid and combined `precipitation` in mm/day. The daily rate uses the mean of valid half-hourly rates multiplied by 24. The product includes `precipitation_cnt` for valid half-hourly samples and `randomError` in mm/day. [NASA GES DISC product and variables](https://disc.gsfc.nasa.gov/datasets/GPM_3IMERGDF_07/summary?keywords=imerg) · [NASA granule catalog query](https://cmr.earthdata.nasa.gov/search/granules.umm_json?concept_id=C2723754864-GES_DISC&temporal=2022-11-01T12%3A00%3A00Z%2C2023-01-15T12%3A00%3A00Z&page_size=100)

The follow-up CMR lookup confirmed the Earthdata Cloud HTTPS `GET DATA` link for 27 December 2022. An anonymous request returned HTTP 302 to `urs.earthdata.nasa.gov`. An earlier bearer-token download returned HTTP 401. On 14 November 2026, local login succeeded with `earthaccess==0.17.0` using `earthaccess.login(strategy="interactive", persist=False)`. Its authenticated request reached `data.gesdisc.earthdata.nasa.gov` directly and returned **HTTP 403**, with `application/json` and an `eula` marker in the response. The local receipt was written at **13:17:42 UTC**, before the project owner reported approving the archive application. It records the status, hostname and marker without retaining the response body or authentication information. [NASA CMR granule lookup](https://cmr.earthdata.nasa.gov/search/granules.umm_json?concept_id=C2723754864-GES_DISC&temporal=2022-12-27T12%3A00%3A00Z%2C2022-12-27T12%3A01%3A00Z)

NASA documents Earthaccess over HTTPS for GES DISC Cloud collections. In the installed Earthaccess version, the HTTPS session used for the probe provides the authentication that `earthaccess.download` uses. The downloader follows redirects and recognizes an `eula` marker in a 401 or 403 as an agreement error. CMR lists this collection’s access constraints as `None` and provides citation guidance in its use constraints. The anonymous redirect’s OAuth client matches NASA’s published authorization link for **NASA GESDISC DATA ARCHIVE**. The direct 403 points to that application’s authorization or terms. The exact account requirement could not be verified from the sanitized receipt. The account holder can review the archive under Earthdata Login **Applications → Authorized Apps** and review pending agreements under **EULAs**. [NASA CMR collection metadata](https://cmr.earthdata.nasa.gov/search/collections.umm_json?concept_id=C2723754864-GES_DISC) · [GES DISC Cloud access guide](https://github.com/nasa/gesdisc-tutorials/blob/main/user-guidance/GES_DISC_Migration_to_Earthdata_Website_and_Earthdata_Cloud.md) · [Earthdata application authorization instructions](https://urs.earthdata.nasa.gov/documentation/for_users/how_to_preauth_app) · [NASA archive authorization reference](https://omps.gesdisc.eosdis.nasa.gov/data/)

After the owner confirmed approval of **NASA GESDISC DATA ARCHIVE**, the single interactive retry followed HTTP 303 from GES DISC to its distribution host and returned **HTTP 200**. The full granule was saved at **13:41:00 UTC**. After verifying its NetCDF metadata and nearest grid cell, the same in-memory Earthaccess session retrieved the other 75 days as single-cell NetCDF subsets from the CMR-listed Cloud OPeNDAP service. The collection and filename revision are `GPM_3IMERGDF.07` and `V07B`. The spot granule is `G2833498864-GES_DISC`, SHA-256 `847d0bf93b8cd5887f0d6af05b7ae23762ad5a0200ed152f3fe0bb96f306f081`. [NASA guidance for Cloud OPeNDAP](https://github.com/nasa/gesdisc-tutorials/blob/main/notebooks/How_to_Access_GES_DISC_Data_Using_Python.ipynb)

Validation found **76 consecutive UTC dates** from 1 November 2022 through 15 January 2023, with 48 valid half-hourly samples per day and zero fill, negative, or non-finite rainfall values. The nearest 0.1° cell to the Kasungu query point is centred on **13.05° S, 33.45° E**. All 76 files reported `precipitation` in mm/day, unity scale, zero offset, and a fill sentinel of approximately −9999.9. Each interval starts at midnight UTC and covers the date through 23:59:59. Multiplying the reported daily rate by one day gives the daily amount in mm. The published bundle retains the per-day sample counts, product-reported `randomError`, UTC bounds, granule identifiers, acquisition times and SHA-256 hashes. Only the validated daily rainfall amounts feed the exposure model.

The extraction selected the nearest cell from the full granule’s latitude and longitude axes. The OPeNDAP requests reused those grid indices and retained the coordinate axes, time and time bounds, `precipitation`, `precipitation_cnt` and `randomError`. Each subset’s returned coordinates and UTC bounds were checked against the target cell and date. Provider `randomError` values were preserved as reported, including 3,043.01 mm on 1 December 2022. The app’s exposure calculations do not propagate this uncertainty.

The [published IMERG bundle](../src/data/imerg-2022.json) is loaded locally by both workspaces. Switching to a season outside 2022/23 selects POWER and disables IMERG with an availability label. Raw files and the extraction audit are Git-ignored under `data/raw/imerg/`. From the repository root, `python scripts/prepare_imerg.py` checks the acquisition metadata and downloaded hashes and regenerates the published bundle from the audit.

### Matched 2022/23 results

Both products use the historical UTC window and the same illustrative cover curves and return dates. Exposure is reported in mm-equivalent.

| Measure | NASA POWER / MERRA-2 | GPM IMERG Final Daily V07B |
| --- | ---: | ---: |
| Total precipitation (mm) | 616.35 | 284.40 |
| Earlier exposure | 506.83 | 224.09 |
| Later exposure | 468.47 | 217.47 |
| Later minus earlier | −38.35 | −6.62 |
| 27 December precipitation (mm) | 83.34 | 0.145 |

Both sources give lower modelled exposure for the later return under the reference assumptions. The magnitudes differ substantially. POWER supplies corrected reanalysis precipitation for the query location. IMERG combines satellite estimates and gauge adjustment on a separate grid. Comparing them shows how sensitive this historical exposure result is to the precipitation product. Local gauge and field measurements would be needed to assess conditions at the site.

### Source-file sanity check

The full 27 December NetCDF identifies Final Daily Level 3 `GPM_3IMERGDF` in its title and lists DOI `10.5067/GPM/IMERGDF/DAY/07`. Its CMR granule name identifies the V07B revision. The original `precipitation` field labels itself as the combined microwave–infrared daily mean rate. It is stored as float32 in mm/day, with no scale or offset attributes. Reading with NetCDF automatic scaling disabled yielded the same value. NASA computes the daily rate from the mean of valid half-hourly rates and converts from mm/hour to mm/day. The integer `precipitation_cnt` describes how many half-hourly retrievals went into that estimate. ArcVeld uses the published daily rate over one day without further aggregation. [NASA Final Daily algorithm and variable definitions](https://doi.org/10.5067/GPM/IMERGDF/DAY/07)

The full grid’s nearest centre is 33.45000076° E, 13.05° S at zero-based longitude index 2134 and latitude index 769, in variable order `(time, lon, lat)`. The eight neighbouring cells on 27 December range from 0.090 to 0.525 mm. The 75 OPeNDAP files retain the same cell coordinates. A direct reread of all 76 acquired files reproduced the bundled values. For each day, the granule filename, CMR interval, NetCDF `FileHeader` and decoded `time_bnds` identify the same UTC date as the raw POWER response. The granule header ends at 23:59:59.999 UTC and the NetCDF bounds encode approximately 23:59:59 UTC. Both mark the end of the same daily product interval.

| UTC date | POWER (mm) | IMERG (mm) | IMERG source |
| --- | ---: | ---: | --- |
| 1 November 2022 | 0.05 | 0.000 | First-day NetCDF subset |
| 22 December 2022 | 9.32 | 31.365 | Wettest IMERG day in the window, NetCDF subset |
| 27 December 2022 | 83.34 | 0.145 | Full NetCDF granule |
| 15 January 2023 | 7.63 | 7.625 | Last-day NetCDF subset |

Each example retained all 48 valid half-hourly retrievals. The source-file reread reproduced the totals of 616.35 mm for POWER and 284.40 mm for IMERG. This verifies the extraction and date matching. The products sample different spatial areas and use different estimation methods, and the comparison cannot attribute the discrepancy to a specific cause or determine the rainfall at the farm. [NASA POWER precipitation methodology](https://power.larc.nasa.gov/docs/methodology/data/sources_meteorology/) · [NASA IMERG V07 technical documentation](https://gpm.nasa.gov/resources/documents/imerg-v07-technical-documentation)

## Landsat geographic context

The Overview bundles a natural-colour RGB crop of **Landsat 9 Collection 2**, Level-2 surface reflectance (L2SP), Tier 1, product `LC09_L2SP_169069_20221107_20221110_02_T1`, acquired 7 November 2022 at 07:52:59 UTC. The crop uses bands 4, 3 and 2 through the Planetary Computer public mirror’s render service. The product ID identifies the mirror’s processing revision. The USGS catalogue separately lists the same acquisition reprocessed on 23 March 2023. The direct USGS browse download returned the EROS login page, so the bundled derivative uses the mirror revision recorded in the manifest.

The crop covers **33.20–33.70° E, 12.91–13.19° S**. The four crop corners and the reference point (33.45° E, 13.05° S) are inside the published scene polygon. Catalogued scene cloud cover was 0.96%. The crop was visually reviewed and had no transparent or missing pixels in the rendered PNG. The Overview displays the full crop with no pixel-level location marker. The display image uses a contrast stretch for interpretation and provides geographic context independently of the selected rainfall season. It supplies no ground-cover input to the exposure model.

The [Landsat manifest](../src/data/landsatKasungu.json) records the STAC item, render URL, extent and SHA-256 hashes of the source PNG and locally bundled lossless WebP. To reproduce the asset, download the manifest’s `imageSourceUrl`, verify the PNG hash and dimensions (1200 × 690), then encode RGB as lossless WebP with Pillow 12.1.1 (method 6). The image and its provenance are bundled locally. Landsat imagery is public domain. [USGS reuse and citation](https://www.usgs.gov/media/images/landsat-product-citation-screenshot) · [USGS Landsat 8–9 Level-2 Collection 2 DOI](https://doi.org/10.5066/P9OGBGM6)

## Field Shift resource eligibility

**Confirmed by project-team review of the official Resources page on 14 November 2026.** The exact listed titles are “NASA POWER: Agroclimatology & Meteorological Data”, “Global Precipitation Measurement (GPM) & IMERG”, and “Landsat and MODIS/VIIRS: Reflectance, NDVI, Vegetation Indices”. POWER is used in the exposure model. Landsat provides geographic context. The automated Resources fetch was inaccessible during Stage 4. The [team review record](../src/data/challengeResources.json) supersedes the eligibility status captured in the Stage 3 POWER acquisition manifest. Resource listing establishes inclusion in the challenge’s resource list. Independent rainfall validation and field-level agricultural validation are separate. [Official Field Shift Resources](https://www.spaceappschallenge.org/2026/challenges/field-shift-adapting-farms-with-nasa-data/?tab=resources) · [NASA Space Apps GO Team guidance](https://github.com/nasa/spaceapps/discussions/1827)
