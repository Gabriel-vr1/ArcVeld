import json
import unittest
from datetime import date
from decimal import Decimal
from pathlib import Path

from scripts import prepare_rainfall as power


def fixture(start, end, values=None):
    if values is None:
        values = {day.strftime("%Y%m%d"): 0.0 for day in power.inclusive_days(start, end)}
    return {
        "type": "Feature",
        "geometry": {"type": "Point", "coordinates": [33.45, -13.05, 1004.84]},
        "header": {"title": "Synthetic test fixture", "api": {"name": "POWER Daily API", "version": "test"},
                   "sources": ["MERRA2"], "fill_value": -999.0, "time_standard": "UTC",
                   "start": start.strftime("%Y%m%d"), "end": end.strftime("%Y%m%d")},
        "properties": {"parameter": {"PRECTOTCORR": values}},
        "parameters": {"PRECTOTCORR": {"units": "mm/day", "longname": "Precipitation Corrected"}},
        "messages": [],
    }


def receipt(raw, start, end):
    return {"acquisitionUrl": power.query_url(start, end), "httpStatus": 200,
            "rawSha256": power.sha256(raw), "retrievedAtUtc": "2026-11-14T12:00:00Z"}


class PowerValidationTests(unittest.TestCase):
    def setUp(self):
        self.start = date(2020, 2, 28)
        self.end = date(2020, 3, 1)
        self.payload = fixture(self.start, self.end)
        self.values = self.payload["properties"]["parameter"]["PRECTOTCORR"]

    def validate(self):
        return power.validate_power(json.dumps(self.payload).encode(), self.start, self.end)

    def test_leap_day_and_daily_units(self):
        self.values["20200229"] = 12.34
        observations, product = self.validate()
        self.assertEqual(list(observations), [date(2020, 2, 28), date(2020, 2, 29), date(2020, 3, 1)])
        self.assertEqual(observations[date(2020, 2, 29)], Decimal("12.34"))
        self.assertEqual(product["providerUnits"], "mm/day")
        self.assertEqual(product["normalizedUnits"], "mm")
        self.assertEqual(observations[self.start], Decimal(0))
        for year in power.YEARS:
            days = power.season_days(year)
            self.assertEqual(len(days), 76)
            self.assertEqual((days[0], days[-1]), (date(year, 11, 1), date(year + 1, 1, 15)))
        self.assertEqual(len(power.inclusive_days(power.REQUEST_START, power.REQUEST_END)), 1902)

    def test_duplicate_date_key(self):
        raw = json.dumps(self.payload).replace('"20200229": 0.0', '"20200229": 0.0, "20200229": 1.0')
        with self.assertRaisesRegex(ValueError, "Duplicate JSON key: 20200229"):
            power.validate_power(raw.encode(), self.start, self.end)

    def test_missing_and_unexpected_dates(self):
        self.values.pop("20200229")
        self.values["20200230"] = 0
        with self.assertRaisesRegex(ValueError, r"Missing .*20200229.*Unexpected .*20200230"):
            self.validate()

    def test_fill_negative_and_invalid_values(self):
        for value, message in [(-999, "fill value"), (-1, "Negative"), (None, "numeric"),
                               (True, "numeric"), ("0.2", "numeric"), (float("nan"), "Non-finite")]:
            with self.subTest(value=value):
                self.values["20200229"] = value
                with self.assertRaisesRegex(ValueError, message):
                    self.validate()

    def test_source_metadata(self):
        cases = [
            (("header", "time_standard"), "LST", "report UTC"),
            (("header", "sources"), ["IMERG"], "sole reported source"),
            (("header", "start"), "20200229", "header dates"),
            (("parameters", "PRECTOTCORR", "units"), "mm/hr", "mm/day"),
            (("geometry", "coordinates"), [33, -13.05], "query point"),
        ]
        for path, value, message in cases:
            with self.subTest(path=path):
                self.payload = fixture(self.start, self.end)
                parent = self.payload
                for key in path[:-1]:
                    parent = parent[key]
                parent[path[-1]] = value
                with self.assertRaisesRegex(ValueError, message):
                    self.validate()

    def test_receipt_is_bound_to_raw_bytes_and_successful_query(self):
        raw = power.encode_json(self.payload)
        metadata = receipt(raw, self.start, self.end)
        url = power.query_url(self.start, self.end)
        power.validate_receipt(metadata, raw, url)
        for change in ({"httpStatus": 500}, {"rawSha256": "0" * 64}, {"acquisitionUrl": "https://example.com"}):
            with self.subTest(change=change), self.assertRaisesRegex(ValueError, "Acquisition receipt"):
                power.validate_receipt(metadata | change, raw, url)
        with self.assertRaisesRegex(ValueError, "UTC"):
            power.validate_receipt(metadata | {"retrievedAtUtc": "2026-11-14T12:00:00+02:00"}, raw, url)


class PreparationTests(unittest.TestCase):
    def test_deterministic_output_and_differences_preserve_provider_values(self):
        # Test-only input. The real snapshot is tested separately.
        start, end, spot = power.REQUEST_START, power.REQUEST_END, power.SPOT_DAY
        values = {day.strftime("%Y%m%d"): 1 for day in power.inclusive_days(start, end)}
        raw = power.encode_json(fixture(start, end, values))
        spot_raw = power.encode_json(fixture(spot, spot, {spot.strftime("%Y%m%d"): 1}))
        args = raw, receipt(raw, start, end), spot_raw, receipt(spot_raw, spot, spot)
        bundle, manifest = power.prepare(*args)
        self.assertEqual(tuple(map(power.encode_json, (bundle, manifest))),
                         tuple(map(power.encode_json, power.prepare(*args))))
        self.assertEqual([len(season["days"]) for season in bundle["seasons"]], [76] * 5)
        self.assertEqual(bundle["seasons"][-1]["days"][0]["rainMm"], 1)
        self.assertEqual(manifest["seasons"][-1]["totalRainMm"], 76)
        self.assertGreater(len(manifest["researchComparison2022"]["differences"]), 0)
        self.assertEqual(manifest["challengeEligibility"], "unconfirmed")
        self.assertEqual(manifest["sourceVerification"], "provider_validated")
        self.assertNotIn("quality", bundle["seasons"][0]["days"][0])

        wrong_spot = power.encode_json(fixture(spot, spot, {spot.strftime("%Y%m%d"): 2}))
        with self.assertRaisesRegex(ValueError, "spot check disagrees"):
            power.prepare(raw, args[1], wrong_spot, receipt(wrong_spot, spot, spot))

    def test_replay_of_current_raw_snapshot_if_available(self):
        raw_dir = power.ROOT / "data/raw"
        if not (raw_dir / "power-kasungu-20221227-acquisition.json").exists():
            self.skipTest("Private raw acquisition is available through the --fetch workflow")
        full = power.load_snapshot(raw_dir, "power-kasungu", power.REQUEST_START, power.REQUEST_END, False)
        spot = power.load_snapshot(raw_dir, "power-kasungu-20221227", power.SPOT_DAY, power.SPOT_DAY, False)
        for name, document in zip(("rainfall.json", "rainfall-provenance.json"), power.prepare(*full, *spot)):
            shipped = Path(power.ROOT, "src/data", name).read_bytes()
            self.assertEqual(shipped.replace(b"\r\n", b"\n"), power.encode_json(document))


if __name__ == "__main__":
    unittest.main()
