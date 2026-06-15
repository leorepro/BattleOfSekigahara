#!/usr/bin/env python3
"""抓取 ESRI World Imagery 衛星鑲嵌影像，拼接並對齊溫泉關（Thermopylae）DEM 範圍。

ESRI World Imagery 為 Web Mercator(EPSG:3857)XYZ 圖磚；DEM 為等距經緯(EPSG:4326)。
緯度範圍小(0.23°)，mercator 與等距差異約數 px，直接以 mercator 裁切作貼圖。
範圍大（東西 0.52°），故用 Z=14（約 9.5 m/px）控制圖檔大小。
輸出：assets/terrain/thermopylae-sat.jpg
"""
import math, io, sys, time, urllib.request, os
from concurrent.futures import ThreadPoolExecutor
from PIL import Image

# 與 fetch_dem_thermopylae.py 同範圍
LNG_MIN, LNG_MAX = 22.300, 22.820    # 西:波斯行軍來向   東:希臘進場/東門外
LAT_MIN, LAT_MAX = 38.700, 38.930    # 南:卡利德羅莫山脈   北:馬利亞灣海面
Z = 14                                   # ~9.5 m/px（範圍大，控制圖檔大小）
TILE = 256
MAX_W = 6144
URL = "https://server.arcgisonline.com/ArcGIS/rest/services/World_Imagery/MapServer/tile/{z}/{y}/{x}"
SEA = (29, 74, 110)                       # 缺磚(愛琴海/馬利亞灣)填色

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

mosaic = Image.new("RGB", (ncol * TILE, nrow * TILE), SEA)

def fetch(tx, ty):
    url = URL.format(z=Z, y=ty, x=tx)
    for attempt in range(3):
        try:
            req = urllib.request.Request(url, headers={"User-Agent": "thermopylae-map/1.0"})
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
crop.save("assets/terrain/thermopylae-sat.jpg", quality=80, optimize=True)
print(f"DONE  {crop.size[0]}x{crop.size[1]}px  -> assets/terrain/thermopylae-sat.jpg", flush=True)
