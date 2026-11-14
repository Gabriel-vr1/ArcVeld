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

The [granule download](https://data.gesdisc.earthdata.nasa.gov/data/GPM_L3/GPM_3IMERGDF.07/2022/12/3B-DAY.MS.MRG.3IMERG.20221227-S000000-E235959.V07B.nc4) returned HTTP 302 to Earthdata Login. The catalog’s OPeNDAP metadata routes also returned HTTP 302 to the login flow. The catalog supplied dates and file metadata. Zero Kasungu IMERG precipitation values were acquired. Integration requires authenticated retrieval, confirmation of the selected cell centre and UTC bounds from file coordinates, and validation of units, fill values, sample counts and complete daily coverage. POWER remains the dataset used by ArcVeld.

## Field Shift resource eligibility

**Unconfirmed** as of 14 November 2026. The official challenge URL returned HTTP 502 through the web fetch, the Resources tab could not be opened there, and direct HTTPS attempts to both URLs failed certificate-chain verification. These outcomes establish neither inclusion nor exclusion of POWER, IMERG, or other products. Confirm the exact NASA resource titles and links in the official Resources tab or obtain written confirmation from the challenge organiser. Retain the official URL, capture date and a screenshot or confirmation record, and verify which listed source is actually used in the project. The GO Team’s published rule requires use of a NASA source listed for the challenge for Global Awards eligibility. [Official Field Shift Resources](https://www.spaceappschallenge.org/2026/challenges/field-shift-adapting-farms-with-nasa-data/?tab=resources) · [NASA Space Apps GO Team guidance](https://github.com/nasa/spaceapps/discussions/1827)
