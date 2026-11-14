import hashlib
import json
import unittest
from pathlib import Path
from urllib.parse import parse_qs, urlparse

ROOT = Path(__file__).resolve().parents[2]


def inside_footprint(point, polygon):
    lon, lat = point
    crossings = 0
    for (x1, y1), (x2, y2) in zip(polygon, polygon[1:]):
        if (y1 > lat) != (y2 > lat) and lon < x1 + (x2 - x1) * (lat - y1) / (y2 - y1):
            crossings += 1
    return crossings % 2 == 1


class LandsatAssetTests(unittest.TestCase):
    def test_crop_metadata_matches_reference_footprint_and_asset(self):
        scene = json.loads((ROOT / "src/data/landsatKasungu.json").read_bytes())
        reference = json.loads((ROOT / "Arcveld_Malawi_2022_Rainfall_Reference_Provenance.json").read_bytes())
        point = (reference["queryLon"], reference["queryLat"])
        west, south, east, north = scene["cropBoundsWgs84"]
        self.assertEqual(tuple(scene["referenceCoordinates"]), point)
        self.assertTrue(west < point[0] < east and south < point[1] < north)
        corners = [(west, south), (west, north), (east, south), (east, north)]
        for coordinate in [point, *corners]:
            self.assertTrue(inside_footprint(coordinate, scene["sceneFootprint"]), coordinate)

        render_url = urlparse(scene["imageSourceUrl"])
        crop, dimensions = render_url.path.split("/")[-2:]
        self.assertEqual(tuple(map(float, crop.split(","))), (west, south, east, north))
        self.assertEqual(dimensions, f"{scene['width']}x{scene['height']}.png")
        self.assertEqual(parse_qs(render_url.query)["assets"], ["red", "green", "blue"])
        self.assertEqual(scene["acquiredAtUtc"][:10], scene["acquiredOn"])

        image = (ROOT / "src/assets/kasungu-landsat9.webp").read_bytes()
        self.assertEqual(image[:4], b"RIFF")
        self.assertEqual(image[8:12], b"WEBP")
        self.assertEqual(hashlib.sha256(image).hexdigest(), scene["bundledWebpSha256"])
