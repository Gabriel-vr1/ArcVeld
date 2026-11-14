"""Replay the Kasungu IMERG bundle from the local audited NetCDF acquisition."""

import hashlib
import json
import math
import re
from datetime import date, datetime, timedelta
from pathlib import Path


ROOT = Path(__file__).resolve().parents[1]
RAW = ROOT / "data" / "raw" / "imerg"
OUTPUT = ROOT / "src" / "data" / "imerg-2022.json"
COLLECTION = "C2723754864-GES_DISC"
FIRST = date(2022, 11, 1)
SPOT = "2022-12-27"


def build_bundle(raw):
    audit = json.loads((raw / "kasungu-imerg-2022-audit.json").read_bytes())
    rows = audit["observations"]
    if audit["collection"] != COLLECTION or audit["subsetDiagnostic"] is not None or len(rows) != 76:
        raise ValueError("Unexpected IMERG acquisition or incomplete series.")

    day_records = []
    granule_ids = set()
    for index, row in enumerate(rows):
        day = FIRST + timedelta(days=index)
        date_iso = day.isoformat()
        name = f"3B-DAY.MS.MRG.3IMERG.{day:%Y%m%d}-S000000-E235959.V07B.nc4"
        subset = date_iso != SPOT
        method = "Cloud OPeNDAP NetCDF subset" if subset else "HTTPS full granule"
        cell = row["cell"]
        granule_id = row["granuleId"]
        if (row["dateIso"] != date_iso or row["granule"] != name or row["method"] != method
                or not re.fullmatch(r"G\d+-GES_DISC", granule_id) or granule_id in granule_ids
                or not math.isclose(cell["lat"], -13.05, abs_tol=0.00001)
                or not math.isclose(cell["lon"], 33.45, abs_tol=0.00001)
                or row["reportedUnits"] != "mm/day" or row["scaleFactor"] != 1 or row["addOffset"] != 0
                or row["fillValue"] != -9999.900390625
                or not math.isfinite(row["rainMm"]) or row["rainMm"] < 0
                or not math.isfinite(row["randomErrorMm"]) or row["randomErrorMm"] < 0
                or type(row["sampleCount"]) is not int or not 1 <= row["sampleCount"] <= 48):
            raise ValueError(f"Invalid observation metadata for {date_iso}.")
        granule_ids.add(granule_id)
        begin, end = map(datetime.fromisoformat, row["timeBoundsUtc"])
        if (begin.utcoffset() != timedelta(0) or end.utcoffset() != timedelta(0)
                or begin.date() != day or begin.time() != datetime.min.time()
                or not 86_398.99 <= (end - begin).total_seconds() <= 86_400.01):
            raise ValueError(f"Invalid UTC interval for {date_iso}.")
        retrieved = datetime.fromisoformat(row["retrievedAtUtc"])
        if retrieved.utcoffset() != timedelta(0):
            raise ValueError(f"Non-UTC acquisition time for {date_iso}.")
        file = raw / "season-2022" / (name + ".subset.nc4") if subset else raw / name
        if hashlib.sha256(file.read_bytes()).hexdigest() != row["sha256"]:
            raise ValueError(f"Downloaded bytes disagree with the audit for {date_iso}.")
        day_records.append({
            key: row[key] for key in (
                "dateIso", "rainMm", "sampleCount", "randomErrorMm", "timeBoundsUtc",
                "granuleId", "granule", "retrievedAtUtc", "sha256", "method",
            )
        })

    spot = next(row for row in day_records if row["dateIso"] == SPOT)
    return {
        "schemaVersion": 1,
        "collection": COLLECTION,
        "doi": "10.5067/GPM/IMERGDF/DAY/07",
        "version": "V07B",
        "variable": "precipitation",
        "timeStandard": "UTC",
        "sourceUnits": "mm/day",
        "units": "mm",
        "startYear": FIRST.year,
        "cell": rows[0]["cell"],
        "gridSpacingDegrees": 0.1,
        "scaleFactor": 1,
        "addOffset": 0,
        "fillValue": rows[0]["fillValue"],
        "sampleCountRange": {
            "min": min(day["sampleCount"] for day in day_records),
            "max": max(day["sampleCount"] for day in day_records),
        },
        "spotCheck": {"dateIso": SPOT, "rainMm": spot["rainMm"]},
        "totalRainMm": math.fsum(day["rainMm"] for day in day_records),
        "days": day_records,
    }


if __name__ == "__main__":
    OUTPUT.write_text(json.dumps(build_bundle(RAW), indent=2, allow_nan=False) + "\n", encoding="utf-8", newline="\n")
