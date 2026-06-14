#!/usr/bin/env python3
"""抓取 ESRI World Imagery 衛星鑲嵌影像，拼接並對齊桶狹間 DEM 範圍。

ESRI World Imagery 為 Web Mercator(EPSG:3857)XYZ 圖磚；DEM 為等距經緯(EPSG:4326)。
緯度範圍小(0.25°)，mercator 與等距差異約 2~3px，直接以 mercator 裁切作貼圖。
輸出：assets/terrain/okehazama-sat.jpg
（原用 GSI seamlessphoto，因航照圖磚跨年份色差嚴重改用 ESRI；色彩較一致。
  ESRI 圖磚路徑為 {z}/{row}/{col} = {z}/{y}/{x}，軸序與 GSI 相反。）
"""
import math, io, sys, time, urllib.request
from concurrent.futures import ThreadPoolExecutor
from PIL import Image

# 與 fetch_dem_okehazama.py 同範圍
LNG_MIN, LNG_MAX = 136.800, 137.140
LAT_MIN, LAT_MAX = 34.990, 35.240
Z = 15                                   # ~4.8 m/px
TILE = 256
MAX_W = 6144                             # 最終貼圖最大寬度（控制檔案大小/GPU）
URL = "https://server.arcgisonline.com/ArcGIS/rest/services/World_Imagery/MapServer/tile/{z}/{y}/{x}"
SEA = (60, 96, 120)                      # 缺磚(海域)填色

def lonlat_to_px(lon, lat, z):
    n = (2 ** z) * TILE
    x = (lon + 180.0) / 360.0 * n
    s = math.sin(math.radians(lat))
    y = (0.5 - math.log((1 + s) / (1 - s)) / (4 * math.pi)) * n
    return x, y

# 全域像素座標(左上=NW、右下=SE)
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
            req = urllib.request.Request(url, headers={"User-Agent": "okehazama-map/1.0"})
            with urllib.request.urlopen(req, timeout=20) as r:
                if r.status == 200:
                    return tx, ty, Image.open(io.BytesIO(r.read())).convert("RGB")
        except Exception:
            time.sleep(0.3)
    return tx, ty, None   # 缺磚(海/無資料)

jobs = [(tx, ty) for tx in range(tx0, tx1 + 1) for ty in range(ty0, ty1 + 1)]
done = 0
with ThreadPoolExecutor(max_workers=8) as ex:
    for tx, ty, img in ex.map(lambda a: fetch(*a), jobs):
        if img is not None:
            mosaic.paste(img, ((tx - tx0) * TILE, (ty - ty0) * TILE))
        done += 1
        if done % 100 == 0:
            print(f"  {done}/{len(jobs)}", flush=True)

# 裁切到精確 bbox（mercator 像素）。緯度範圍小(0.25°)，mercator 與等距差異約 2~3px，
# 直接以 mercator 裁切結果作貼圖（誤差可忽略），免去 numpy 重採樣。
crop = mosaic.crop((round(x0p - tx0 * TILE), round(y0p - ty0 * TILE),
                    round(x1p - tx0 * TILE), round(y1p - ty0 * TILE)))
if crop.size[0] > MAX_W:
    crop = crop.resize((MAX_W, round(crop.size[1] * MAX_W / crop.size[0])), Image.LANCZOS)
crop.save("assets/terrain/okehazama-sat.jpg", quality=80, optimize=True)
print(f"DONE  {crop.size[0]}x{crop.size[1]}px  -> assets/terrain/okehazama-sat.jpg", flush=True)
