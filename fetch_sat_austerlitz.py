#!/usr/bin/env python3
"""抓取 ESRI World Imagery 衛星鑲嵌影像，拼接並對齊奧斯特利茨（Austerlitz）DEM 範圍。

ESRI World Imagery 為 Web Mercator(EPSG:3857)XYZ 圖磚；DEM 為等距經緯(EPSG:4326)。
緯度範圍小(0.15°)，mercator 與等距差異約數 px，直接以 mercator 裁切作貼圖。
輸出：assets/terrain/austerlitz-sat.jpg
"""
import math, io, sys, time, urllib.request, os
from concurrent.futures import ThreadPoolExecutor
from PIL import Image
Image.MAX_IMAGE_PIXELS = None             # 放大範圍鑲嵌圖較大,解除 PIL 解壓炸彈防護(來源為自家拼接,非攻擊)

# 與 fetch_dem_austerlitz.py 同範圍（放大 3 倍 bbox）
LNG_MIN, LNG_MAX = 16.460, 17.120
LAT_MIN, LAT_MAX = 48.900, 49.350
Z = 14                                   # 放大 3 倍 bbox 下,Z15 鑲嵌圖達 2.4 億像素過大;Z14 原生≈7690px 已足
TILE = 256
MAX_W = 8192
URL = "https://server.arcgisonline.com/ArcGIS/rest/services/World_Imagery/MapServer/tile/{z}/{y}/{x}"
FILL = (150, 160, 140)                    # 缺磚填色（摩拉維亞農地灰綠）

def lonlat_to_px(lon, lat, z):
    n = (2 ** z) * TILE
    x = (lon + 180.0) / 360.0 * n
    s = math.sin(math.radians(lat))
    y = (0.5 - math.log((1 + s) / (1 - s)) / (4 * math.pi)) * n
    return x, y

x0p, y0p = lonlat_to_px(LNG_MIN, LAT_MAX, Z)
x1p, y1p = lonlat_to_px(LNG_MAX, LAT_MIN, Z)
tx0, tx1 = int(x0p // TILE), int(x1p // TILE)
ty0, ty1 = int(y0p // TILE), int(y1p // TILE)
ncol, nrow = tx1 - tx0 + 1, ty1 - ty0 + 1
print(f"zoom={Z}  tiles {ncol}x{nrow} = {ncol*nrow}  mosaic {ncol*TILE}x{nrow*TILE}px", flush=True)

mosaic = Image.new("RGB", (ncol * TILE, nrow * TILE), FILL)

def fetch(tx, ty):
    url = URL.format(z=Z, y=ty, x=tx)
    for attempt in range(3):
        try:
            req = urllib.request.Request(url, headers={"User-Agent": "austerlitz-map/1.0"})
            with urllib.request.urlopen(req, timeout=20) as r:
                if r.status == 200:
                    return tx, ty, Image.open(io.BytesIO(r.read())).convert("RGB")
        except Exception:
            time.sleep(0.3)
    return tx, ty, None

jobs = [(tx, ty) for tx in range(tx0, tx1 + 1) for ty in range(ty0, ty1 + 1)]
done = 0
with ThreadPoolExecutor(max_workers=8) as ex:
    for tx, ty, img in ex.map(lambda a: fetch(*a), jobs):
        if img is not None:
            mosaic.paste(img, ((tx - tx0) * TILE, (ty - ty0) * TILE))
        done += 1
        if done % 100 == 0:
            print(f"  {done}/{len(jobs)}", flush=True)

crop = mosaic.crop((round(x0p - tx0 * TILE), round(y0p - ty0 * TILE),
                    round(x1p - tx0 * TILE), round(y1p - ty0 * TILE)))
if crop.size[0] > MAX_W:
    crop = crop.resize((MAX_W, round(crop.size[1] * MAX_W / crop.size[0])), Image.LANCZOS)
os.makedirs("assets/terrain", exist_ok=True)
crop.save("assets/terrain/austerlitz-sat.jpg", quality=80, optimize=True)
print(f"DONE  {crop.size[0]}x{crop.size[1]}px  -> assets/terrain/austerlitz-sat.jpg", flush=True)
