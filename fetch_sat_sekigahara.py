#!/usr/bin/env python3
"""抓取 ESRI World Imagery 衛星鑲嵌影像，拼接並對齊關原 DEM 範圍。
   輸出覆蓋 assets/terrain/satellite.jpg（index.html / 關原頁使用的貼圖）。
   範圍須與 fetch_dem.py 一致。
   （原用 GSI seamlessphoto，因航照圖磚跨年份色差嚴重改用 ESRI；色彩較一致。
     ESRI 圖磚路徑為 {z}/{row}/{col} = {z}/{y}/{x}，軸序與 GSI 相反。）
"""
import math, io, time, urllib.request
from concurrent.futures import ThreadPoolExecutor
from PIL import Image

# 與 fetch_dem.py 同範圍（關原盆地擴大顯示範圍）
LNG_MIN, LNG_MAX = 136.320, 136.800
LAT_MIN, LAT_MAX = 35.240, 35.480
Z = 15
TILE = 256
MAX_W = 6144                                # 最終貼圖最大寬度（控制檔案大小/GPU）
URL = "https://server.arcgisonline.com/ArcGIS/rest/services/World_Imagery/MapServer/tile/{z}/{y}/{x}"
SEA = (60, 96, 120)

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
    for _ in range(3):
        try:
            req = urllib.request.Request(url, headers={"User-Agent": "sekigahara-map/1.0"})
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
        if done % 150 == 0:
            print(f"  {done}/{len(jobs)}", flush=True)

# 裁切到精確 bbox（mercator；緯度範圍小，差異可忽略）
crop = mosaic.crop((round(x0p - tx0 * TILE), round(y0p - ty0 * TILE),
                    round(x1p - tx0 * TILE), round(y1p - ty0 * TILE)))
if crop.size[0] > MAX_W:
    crop = crop.resize((MAX_W, round(crop.size[1] * MAX_W / crop.size[0])), Image.LANCZOS)
crop.save("assets/terrain/satellite.jpg", quality=85, optimize=True)
print(f"DONE  {crop.size[0]}x{crop.size[1]}px  -> assets/terrain/satellite.jpg", flush=True)
