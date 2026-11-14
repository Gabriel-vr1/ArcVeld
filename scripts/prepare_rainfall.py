"""Acquire and validate the NASA POWER Kasungu rainfall evidence bundle."""

import argparse
import csv
import hashlib
import json
import math
import sys
from datetime import UTC, date, datetime, timedelta
from decimal import Decimal
from pathlib import Path
from tempfile import NamedTemporaryFile
from urllib.error import HTTPError, URLError
from urllib.parse import urlencode
from urllib.request import Request, urlopen

ROOT = Path(__file__).resolve().parents[1]
REFERENCE_CSV = ROOT / "Arcveld_Malawi_2022_Research_Rainfall_Reference.csv"
REFERENCE_PROVENANCE = ROOT / "Arcveld_Malawi_2022_Rainfall_Reference_Provenance.json"
POWER_ENDPOINT = "https://power.larc.nasa.gov/api/temporal/daily/point"
DATASET = "NASA_POWER_PRECTOTCORR_MERRA2"
VARIABLE = "PRECTOTCORR"
LONGITUDE, LATITUDE = Decimal("33.45"), Decimal("-13.05")
REQUEST_START, REQUEST_END = date(2018, 11, 1), date(2024, 1, 15)
SPOT_DAY = date(2022, 12, 27)
YEARS = range(2018, 2023)
RESEARCH_TOTALS = dict(zip(YEARS, map(Decimal, ["627.32", "631.15", "430.65", "530.21", "616.35"])))
RESEARCH_STATUS = "transcribed_from_Arcveld_research_report__raw_NASA_response_not_attached"


def query_url(start, end):
    return POWER_ENDPOINT + "?" + urlencode({
        "parameters": VARIABLE, "community": "AG",
        "longitude": str(LONGITUDE), "latitude": str(LATITUDE),
        "start": start.strftime("%Y%m%d"), "end": end.strftime("%Y%m%d"),
        "format": "JSON", "time-standard": "UTC",
    })


def inclusive_days(start, end):
    if start > end:
        raise ValueError("Invalid UTC interval: start is after end")
    return [start + timedelta(days=index) for index in range((end - start).days + 1)]


def season_days(year):
    return inclusive_days(date(year, 11, 1), date(year + 1, 1, 15))


def sha256(data):
    return hashlib.sha256(data).hexdigest()


def unique_object(pairs):
    result = {}
    for key, value in pairs:
        if key in result:
            raise ValueError(f"Duplicate JSON key: {key}")
        result[key] = value
    return result


def reject_constant(value):
    raise ValueError(f"Non-finite JSON value: {value}")


def decode_json(raw):
    return json.loads(raw.decode("utf-8-sig"), object_pairs_hook=unique_object,
                      parse_float=Decimal, parse_constant=reject_constant)


def number(value, field):
    if type(value) not in (int, Decimal) or not math.isfinite(value):
        raise ValueError(f"Expected a finite numeric {field}")
    return Decimal(value)


def validate_power(raw, start, end):
    """Validate metadata and every record in the requested UTC interval."""
    document = decode_json(raw)
    try:
        geometry = document["geometry"]
        coordinates = geometry["coordinates"]
        header = document["header"]
        api = header["api"]
        parameter = document["parameters"][VARIABLE]
        values = document["properties"]["parameter"][VARIABLE]
        fill = number(header["fill_value"], "provider fill value")
    except (KeyError, TypeError, IndexError) as error:
        raise ValueError(f"Missing or invalid NASA POWER response metadata: {error}") from error

    if (document.get("type") != "Feature" or geometry.get("type") != "Point"
            or not isinstance(coordinates, list) or len(coordinates) < 2
            or number(coordinates[0], "longitude") != LONGITUDE
            or number(coordinates[1], "latitude") != LATITUDE):
        raise ValueError("NASA POWER response does not match the Kasungu query point")
    if header.get("sources") != ["MERRA2"] or api.get("name") != "POWER Daily API":
        raise ValueError("Expected NASA POWER Daily API with MERRA2 as the sole reported source")
    if not isinstance(api.get("version"), str) or not api["version"].strip():
        raise ValueError("NASA POWER response has no API version")
    if header.get("time_standard") != "UTC":
        raise ValueError("NASA POWER response must report UTC")
    if (header.get("start"), header.get("end")) != (start.strftime("%Y%m%d"), end.strftime("%Y%m%d")):
        raise ValueError("NASA POWER response header dates differ from the request")
    if parameter.get("units") != "mm/day":
        raise ValueError("Expected PRECTOTCORR in mm/day")
    if not isinstance(parameter.get("longname"), str) or not parameter["longname"].strip():
        raise ValueError("Missing PRECTOTCORR description")
    if not isinstance(header.get("title"), str) or not header["title"].strip():
        raise ValueError("Missing NASA POWER product title")
    if document.get("messages") != []:
        raise ValueError(f"Unexpected NASA POWER response messages: {document.get('messages')!r}")
    if not isinstance(values, dict):
        raise ValueError("Expected a daily PRECTOTCORR date map")

    dates = inclusive_days(start, end)
    keys = [day.strftime("%Y%m%d") for day in dates]
    expected = set(keys)
    missing, unexpected = sorted(expected - values.keys()), sorted(values.keys() - expected)
    if missing or unexpected:
        raise ValueError(f"NASA POWER date coverage mismatch. Missing ({len(missing)}): {missing[:8]}. "
                         f"Unexpected ({len(unexpected)}): {unexpected[:8]}.")

    observations = {}
    for day, key in zip(dates, keys):
        value = number(values[key], f"rainfall on {day}")
        if value == fill:
            raise ValueError(f"Provider fill value {fill} on {day}")
        if value < 0:
            raise ValueError(f"Negative precipitation on {day}: {value}")
        # Each provider value describes one full UTC day, so mm/day × 1 day = mm.
        observations[day] = value

    return observations, {
        "provider": "NASA",
        "product": header["title"],
        "apiName": api["name"],
        "apiVersion": api["version"],
        "sources": header["sources"],
        "variable": VARIABLE,
        "variableDescription": parameter["longname"],
        "providerUnits": parameter["units"],
        "normalizedUnits": "mm",
        "timeStandard": header["time_standard"],
        "fillValue": float(fill),
        "community": "AG",
        "queryLatitude": float(LATITUDE),
        "queryLongitude": float(LONGITUDE),
    }


def validate_receipt(receipt, raw, expected_url):
    if (not isinstance(receipt, dict) or receipt.get("acquisitionUrl") != expected_url
            or receipt.get("httpStatus") != 200 or receipt.get("rawSha256") != sha256(raw)):
        raise ValueError("Acquisition receipt must match the HTTP 200 request and raw response SHA-256")
    timestamp = receipt.get("retrievedAtUtc")
    try:
        if not isinstance(timestamp, str) or not timestamp.endswith("Z"):
            raise ValueError
        datetime.fromisoformat(timestamp)
    except ValueError:
        raise ValueError("Acquisition timestamp must be ISO 8601 UTC") from None


def encode_json(document):
    return (json.dumps(document, indent=2, ensure_ascii=False, allow_nan=False) + "\n").encode("utf-8")


def write_atomic(path, content):
    path.parent.mkdir(parents=True, exist_ok=True)
    with NamedTemporaryFile(dir=path.parent, delete=False) as handle:
        temporary = Path(handle.name)
        handle.write(content)
    try:
        temporary.replace(path)
    finally:
        temporary.unlink(missing_ok=True)


def load_snapshot(directory, name, start, end, fetch):
    url = query_url(start, end)
    raw_path = directory / f"{name}-response.json"
    receipt_path = directory / f"{name}-acquisition.json"
    if fetch:
        request = Request(url, headers={"Accept": "application/json", "User-Agent": "ArcVeld rainfall audit"})
        with urlopen(request, timeout=45) as response:
            if response.geturl() != url or response.status != 200:
                raise ValueError(f"Unexpected NASA POWER response URL or HTTP status: {response.status}")
            raw = response.read()
            receipt = {
                "acquisitionUrl": url,
                "httpStatus": response.status,
                "retrievedAtUtc": datetime.now(UTC).isoformat(timespec="seconds").replace("+00:00", "Z"),
                "rawSha256": sha256(raw),
            }
    else:
        raw = raw_path.read_bytes()
        receipt = decode_json(receipt_path.read_bytes())
    validate_receipt(receipt, raw, url)
    return raw, receipt


def compare_research(observations, metadata, reference_csv=REFERENCE_CSV, reference_provenance=REFERENCE_PROVENANCE):
    provenance = decode_json(reference_provenance.read_bytes())
    dates = season_days(2022)
    if (provenance["queryUrl"] != query_url(REQUEST_START, REQUEST_END)
            or provenance["queryLat"] != LATITUDE or provenance["queryLon"] != LONGITUDE
            or provenance["dayBasis"] != "UTC" or provenance["dayCount"] != len(dates)
            or (provenance["firstDate"], provenance["lastDate"]) != (dates[0].isoformat(), dates[-1].isoformat())
            or provenance["source"] != "NASA POWER Daily Point API, PRECTOTCORR, AG, MERRA2, UTC"):
        raise ValueError("Unexpected frozen research reference provenance")
    with reference_csv.open(encoding="utf-8-sig", newline="") as handle:
        reader = csv.DictReader(handle)
        if reader.fieldnames != ["date_utc", "rain_mm", "source_dataset", "source_status"]:
            raise ValueError("Unexpected frozen research CSV headers")
        rows = list(reader)
    if [row["date_utc"] for row in rows] != [day.isoformat() for day in dates]:
        raise ValueError("Frozen research CSV must contain all 76 ordered 2022/23 UTC dates")

    differences = []
    reference_total = Decimal(0)
    for day, row in zip(dates, rows):
        if row["source_dataset"] != DATASET or row["source_status"] != RESEARCH_STATUS:
            raise ValueError(f"Unexpected frozen research source on {day}")
        reference = number(Decimal(row["rain_mm"]), f"research rainfall on {day}")
        if reference < 0:
            raise ValueError(f"Negative frozen research rainfall on {day}")
        reference_total += reference
        actual = observations[day]
        if actual != reference:
            differences.append({"dateIso": day.isoformat(), "researchMm": float(reference),
                                "providerMm": float(actual), "differenceMm": float(actual - reference)})
    if reference_total != provenance["totalRainMm"]:
        raise ValueError("Frozen research CSV total differs from its provenance")
    return {
        "comparedDays": len(dates),
        "exactMatches": len(dates) - len(differences),
        "differences": differences,
        "missingDates": [],
        "unexpectedValues": [],
        "researchReportedRawSha256": provenance["reportedOriginalRawSHA256"],
        "providerApiVersion": metadata["apiVersion"],
        "researchApiVersion": None,
    }


def prepare(raw, receipt, spot_raw, spot_receipt):
    validate_receipt(receipt, raw, query_url(REQUEST_START, REQUEST_END))
    validate_receipt(spot_receipt, spot_raw, query_url(SPOT_DAY, SPOT_DAY))
    observations, metadata = validate_power(raw, REQUEST_START, REQUEST_END)
    spot, spot_metadata = validate_power(spot_raw, SPOT_DAY, SPOT_DAY)
    if spot_metadata != metadata or spot[SPOT_DAY] != observations[SPOT_DAY]:
        raise ValueError("Separate NASA POWER spot check disagrees with the full response")

    reference = compare_research(observations, metadata)
    reference["rawHashMatchesResearch"] = reference["researchReportedRawSha256"] == receipt["rawSha256"]
    seasons, summaries = [], []
    for year in YEARS:
        dates = season_days(year)
        total = sum(observations[day] for day in dates)
        period = {"startYear": year, "startIso": dates[0].isoformat(), "endIso": dates[-1].isoformat()}
        seasons.append({**period, "days": [
            {"dateIso": day.isoformat(), "rainMm": float(observations[day]),
             "sourceId": DATASET, "sourceStatus": "provider_validated"}
            for day in dates
        ]})
        summaries.append({**period, "dayCount": len(dates), "totalRainMm": float(total),
                          "researchTotalMm": float(RESEARCH_TOTALS[year]),
                          "differenceMm": float(total - RESEARCH_TOTALS[year])})

    bundle = {"schemaVersion": 1, "sourceId": DATASET, "rawSha256": receipt["rawSha256"], "seasons": seasons}
    manifest = {
        "schemaVersion": 1, "caseId": "kasungu-reference", "sourceId": DATASET,
        "sourceVerification": "provider_validated",
        "scientificMode": "historical_exposure_proxy", "coverBasis": "illustrative",
        "challengeEligibility": "unconfirmed",
        "product": metadata,
        "acquisition": {**receipt, "startIso": REQUEST_START.isoformat(), "endIso": REQUEST_END.isoformat(),
                        "recordCount": len(observations)},
        "validation": {"missingDates": 0, "duplicateDates": 0, "fillValues": 0, "invalidValues": 0,
                       "publishedRecordCount": sum(season["dayCount"] for season in summaries)},
        "spotCheck": {**spot_receipt, "dateIso": SPOT_DAY.isoformat(), "rainMm": float(spot[SPOT_DAY])},
        "researchComparison2022": reference,
        "seasons": summaries,
    }
    return bundle, manifest


def main():
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument("--fetch", action="store_true", help="retrieve fresh NASA POWER responses and receipts")
    parser.add_argument("--raw-dir", type=Path, default=ROOT / "data/raw")
    parser.add_argument("--output-dir", type=Path, default=ROOT / "src/data")
    args = parser.parse_args()
    try:
        full_name = "power-kasungu"
        spot_name = "power-kasungu-20221227"
        full = load_snapshot(args.raw_dir, full_name, REQUEST_START, REQUEST_END, args.fetch)
        spot = load_snapshot(args.raw_dir, spot_name, SPOT_DAY, SPOT_DAY, args.fetch)
        bundle, manifest = prepare(*full, *spot)
        if args.fetch:
            for name, (raw, receipt) in ((full_name, full), (spot_name, spot)):
                write_atomic(args.raw_dir / f"{name}-response.json", raw)
                write_atomic(args.raw_dir / f"{name}-acquisition.json", encode_json(receipt))
        write_atomic(args.output_dir / "rainfall.json", encode_json(bundle))
        write_atomic(args.output_dir / "rainfall-provenance.json", encode_json(manifest))
    except (OSError, ValueError, ArithmeticError, KeyError, TypeError, AttributeError) as error:
        prefix = f"HTTP {error.code}: " if isinstance(error, HTTPError) else ""
        if isinstance(error, URLError) and not isinstance(error, HTTPError):
            prefix = "Network failure: "
        parser.exit(1, f"Rainfall preparation failed: {prefix}{error}\n")
    reference = manifest["researchComparison2022"]
    print(f"Validated {manifest['acquisition']['recordCount']} provider records and published "
          f"{manifest['validation']['publishedRecordCount']} records across {len(bundle['seasons'])} seasons. "
          f"2022/23: {reference['exactMatches']}/{reference['comparedDays']} exact daily matches.")


if __name__ == "__main__":
    main()
