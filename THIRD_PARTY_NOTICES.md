# Third-party notices

| Component or asset | License or credit |
| --- | --- |
| Public Sans and Instrument Serif | SIL Open Font License 1.1. The Fontsource packages ship their license files. [Public Sans](https://github.com/uswds/public-sans) · [Instrument Serif](https://github.com/Instrument/instrument-serif) |
| Lucide icons | ISC, with MIT terms for inherited Feather icons. See the [Lucide license](https://github.com/lucide-icons/lucide/blob/main/LICENSE). |
| Class Variance Authority | Apache-2.0. See the [CVA license](https://github.com/joe-bell/cva/blob/main/LICENSE). |
| shadcn/ui Button pattern | MIT. ArcVeld adapts this primitive locally. See the notice below. |
| Malawi welcome relief and regional reference map | Public-domain Natural Earth boundaries and lakes. See the sources below. |
| Kasungu Landsat 9 RGB crop | Public-domain USGS / NASA Landsat Collection 2 Level-2 imagery, rendered through the Microsoft Planetary Computer public mirror. [Product and image provenance](src/data/landsatKasungu.json) · [USGS reuse and citation](https://www.usgs.gov/media/images/landsat-product-citation-screenshot) |

The application credits NASA POWER Daily `PRECTOTCORR` from MERRA-2 and NASA GES DISC GPM IMERG Final Daily V07 (revision V07B). Provenance, units and processing are documented in the [data audit](data/README.md). [NASA POWER Daily API](https://power.larc.nasa.gov/docs/services/api/temporal/daily/) · [GPM IMERG Final Daily V07 DOI](https://doi.org/10.5067/GPM/IMERGDF/DAY/07)

## Map sources

The bundled map paths are derived from the Natural Earth v5.1.1 distribution of [Admin 0 Countries](https://github.com/nvkelso/natural-earth-vector/blob/v5.1.1/geojson/ne_50m_admin_0_countries.geojson) and [Lakes](https://github.com/nvkelso/natural-earth-vector/blob/v5.1.1/geojson/ne_50m_lakes.geojson). The map uses a locally scaled longitude–latitude grid. The Kasungu point comes from the research query coordinates. [Natural Earth terms of use](https://www.naturalearthdata.com/about/terms-of-use/)

The Welcome relief reuses the regional map’s Natural Earth boundaries, lakes, and Kasungu query coordinates in an oblique view. The relief layers and contours are illustrative and contain no elevation measurements.
The earlier Africa welcome map was based on [Natural Earth 1:110m Admin 0 Countries v5.1.1](https://github.com/nvkelso/natural-earth-vector/blob/v5.1.1/geojson/ne_110m_admin_0_countries.geojson).

## Earlier landscape illustration

The built-in OpenAI ImageGen tool produced the [earlier landscape illustration](src/assets/central-malawi-illustration.jpg) for Stage 1. The current interface uses the Natural Earth reference map.

## shadcn/ui MIT notice

Copyright (c) 2023 shadcn

Permission is hereby granted, free of charge, to any person obtaining a copy
of this software and associated documentation files (the "Software"), to deal
in the Software without restriction, including without limitation the rights
to use, copy, modify, merge, publish, distribute, sublicense, and/or sell
copies of the Software, and to permit persons to whom the Software is
furnished to do so, subject to the following conditions:

The above copyright notice and this permission notice shall be included in all
copies or substantial portions of the Software.

THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND, EXPRESS OR
IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF MERCHANTABILITY,
FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT. IN NO EVENT SHALL THE
AUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM, DAMAGES OR OTHER
LIABILITY, WHETHER IN AN ACTION OF CONTRACT, TORT OR OTHERWISE, ARISING FROM,
OUT OF OR IN CONNECTION WITH THE SOFTWARE OR THE USE OR OTHER DEALINGS IN THE
SOFTWARE.
