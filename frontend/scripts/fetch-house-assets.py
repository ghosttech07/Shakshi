"""
Downloads the free (CC0) Poly Haven furniture, materials and sky used by the 3D house,
then shrinks them for the web. Run from the repository: python frontend/scripts/fetch-house-assets.py
Output: frontend/public/house/  (models/*.gltf staging, textures/*.webp, env/*)
All assets: https://polyhaven.com (CC0, free for commercial use).
"""
import json, os, sys, urllib.request
from io import BytesIO
from PIL import Image

ROOT = os.path.join(os.path.dirname(__file__), "..", "public", "house")
STAGE = os.path.join(os.path.dirname(__file__), "..", ".house-stage")  # raw downloads (gitignored)

MODELS = [
    "mid_century_lounge_chair", "modern_arm_chair_01", "modern_coffee_table_01", "modern_wooden_cabinet",
    "potted_plant_02", "potted_plant_04", "potted_plant_01", "ceramic_vase_01",
    "book_encyclopedia_set_01", "hanging_picture_frame_02", "standing_picture_frame_01", "standing_picture_frame_02",
    "modern_ceiling_lamp_01", "dining_chair_02", "side_table_01", "steel_frame_shelves_01",
]
# texture name -> maps to fetch (Poly Haven map keys) and output size
TEXTURES = {
    "herringbone_parquet": 1024, "painted_plaster_wall": 1024, "marble_01": 1024, "rough_linen": 1024,
    "poly_wool_herringbone": 1024, "black_oak_veneer": 1024, "exterior_wall_cladding": 1024,
    "exterior_wall_cladding_03": 1024, "grass_ground": 1024, "stone_tiles_02": 1024, "brushed_concrete": 1024,
}
MAPS = {"Diffuse": "diff", "nor_gl": "nor", "Rough": "rough"}
SKY = "belfast_sunset_puresky"


def get(url):
    req = urllib.request.Request(url, headers={"User-Agent": "shakshi-house/1.0"})
    with urllib.request.urlopen(req, timeout=120) as r:
        return r.read()


def files(asset):
    return json.loads(get(f"https://api.polyhaven.com/files/{asset}"))


def save(path, data):
    os.makedirs(os.path.dirname(path), exist_ok=True)
    with open(path, "wb") as f:
        f.write(data)


def fetch_model(name):
    f = files(name)
    if "gltf" not in f:
        print("  skipped (no web format):", name)
        return None
    info = f["gltf"]["1k"]["gltf"]
    base = os.path.join(STAGE, "models", name)
    if os.path.exists(os.path.join(base, f"{name}.gltf")):
        return base  # already downloaded
    save(os.path.join(base, f"{name}.gltf"), get(info["url"]))
    for rel, inc in info.get("include", {}).items():
        save(os.path.join(base, rel), get(inc["url"]))
    return base


def fetch_texture(name, size):
    info = files(name)
    for key, short in MAPS.items():
        if key not in info:
            continue
        raw = get(info[key]["1k"]["jpg"]["url"])
        im = Image.open(BytesIO(raw))
        im = im.convert("L") if short == "rough" else im.convert("RGB")
        if im.size[0] != size:
            im = im.resize((size, size), Image.LANCZOS)
        out = os.path.join(ROOT, "textures", f"{name}_{short}.webp")
        os.makedirs(os.path.dirname(out), exist_ok=True)
        im.save(out, "WEBP", quality=82 if short == "diff" else 88, method=6)


def fetch_sky():
    info = files(SKY)
    save(os.path.join(ROOT, "env", f"{SKY}_1k.hdr"), get(info["hdri"]["1k"]["hdr"]["url"]))  # lighting
    tm = info.get("tonemapped") or {}
    if tm.get("url"):
        im = Image.open(BytesIO(get(tm["url"]))).convert("RGB")
        im = im.resize((4096, 2048), Image.LANCZOS) if im.size[0] > 4096 else im
        im.save(os.path.join(ROOT, "env", f"{SKY}_bg.webp"), "WEBP", quality=84, method=6)  # visible sky


if __name__ == "__main__":
    what = sys.argv[1:] or ["models", "textures", "sky"]
    if "sky" in what:
        fetch_sky(); print("sky ok")
    if "textures" in what:
        for n, s in TEXTURES.items():
            fetch_texture(n, s); print("texture", n)
    if "models" in what:
        for m in MODELS:
            fetch_model(m); print("model", m)
