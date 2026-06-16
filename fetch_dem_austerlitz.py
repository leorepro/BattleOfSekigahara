#!/usr/bin/env python3
"""抓取奧斯特利茨（Austerlitz / Slavkov u Brna）一帶 SRTM 30m 高程，
存成 data/austerlitz/heightmap.js。

範圍涵蓋：普拉欽高地(中央要地)、桑頓山(北線)、Goldbach 溪、Telnitz/Sokolnitz 兩村(南線)、
扎錢湖(Satschan)南緣、拿破崙本陣(Žuráň)、奧斯特利茨城堡(東)。摩拉維亞為緩丘地形(峰約 300+m)。

用法：python3 fetch_dem_austerlitz.py   （需網路連 opentopodata；尊重 1 req/sec 限速）
"""
import json, time, urllib.request, urllib.parse, sys

# bbox：放大 3 倍範圍(面積 9 倍)——戰場周圍保留充足摩拉維亞景觀,鏡頭拉開不再是浮空小塊。
#   戰場核心仍居中(普拉欽/桑頓/兩村/冰湖/Žuráň/奧斯特利茨城堡)。
LNG_MIN, LNG_MAX = 16.460, 17.120    # 西:法軍/布爾諾來向   東:奧洛穆茨方向(聯軍來向)
LAT_MIN, LAT_MAX = 48.900, 49.350    # 南:扎錢湖以南   北:桑頓/本陣以北
COLS, ROWS = 251, 201                  # 約 200m 解析度(放大範圍下兼顧細節與下載時間)
API = "https://api.opentopodata.org/v1/srtm30m"

# 由南到北(row 0 = LAT_MIN)、由西到東(col 0 = LNG_MIN)建格點
pts = []
for r in range(ROWS):
    lat = LAT_MIN + (LAT_MAX - LAT_MIN) * r / (ROWS - 1)
    for c in range(COLS):
        lng = LNG_MIN + (LNG_MAX - LNG_MIN) * c / (COLS - 1)
        pts.append((lat, lng))

elev = [None] * len(pts)
CHUNK = 100
i = 0
while i < len(pts):
    chunk = pts[i:i+CHUNK]
    locs = "|".join(f"{la:.5f},{ln:.5f}" for la, ln in chunk)
    url = f"{API}?locations={urllib.parse.quote(locs)}"
    for attempt in range(4):
        try:
            with urllib.request.urlopen(url, timeout=30) as resp:
                data = json.load(resp)
            if data.get("status") == "OK":
                for j, res in enumerate(data["results"]):
                    e = res.get("elevation")
                    elev[i+j] = float(e) if e is not None else 0.0
                break
            else:
                print("status not OK:", data.get("status"), file=sys.stderr); time.sleep(2)
        except Exception as ex:
            print(f"chunk {i} attempt {attempt} err: {ex}", file=sys.stderr); time.sleep(2)
    print(f"  fetched {min(i+CHUNK,len(pts))}/{len(pts)}", flush=True)
    i += CHUNK
    time.sleep(1.2)  # 尊重 1 req/sec 限速

# 補洞；負值夾到 0
for k in range(len(elev)):
    if elev[k] is None:
        elev[k] = 0.0
    elif elev[k] < 0:
        elev[k] = 0.0

out = {
    "lngMin": LNG_MIN, "lngMax": LNG_MAX,
    "latMin": LAT_MIN, "latMax": LAT_MAX,
    "cols": COLS, "rows": ROWS,
    "data": [round(e, 1) for e in elev],
}
with open("data/austerlitz/heightmap.js", "w") as f:
    f.write("/* 奧斯特利茨 SRTM 30m 真實高程網格（由 fetch_dem_austerlitz.py 產生）\n")
    f.write(" * data 為列優先：index = row*cols + col；row 0 = latMin（南），col 0 = lngMin（西）\n")
    f.write(" * 普拉欽高地(中央)/桑頓山(北)/Goldbach 溪/扎錢湖(南) */\n")
    f.write("window.SEKI = window.SEKI || {};\n")
    f.write("SEKI.heightmap = " + json.dumps(out) + ";\n")

mn, mx = min(elev), max(elev)
print(f"DONE  points={len(elev)}  elev min={mn} max={mx}")
print("→ 已寫入 data/austerlitz/heightmap.js（取代 Phase 0 的溫泉關 placeholder）")
