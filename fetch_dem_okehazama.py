#!/usr/bin/env python3
"""抓取桶狹間一帶 SRTM 30m 高程，存成 data/okehazama/heightmap.js

範圍涵蓋：熱田神宮(北)→鳴海/大高五砦→桶狹間兩比定地→沓掛城(東)。
海岸/伊勢灣(古「年魚市潟」)在 SRTM 多回傳 0 或負值，作海面呈現。
"""
import json, time, urllib.request, urllib.parse, sys

# 大幅擴大顯示範圍（約 5 倍面積，填滿畫面）：
#   西北納入清洲城(信長出陣起點)、名古屋；東至三河方向；南含知多・伊勢灣
LNG_MIN, LNG_MAX = 136.800, 137.140   # 西:清洲・名古屋   東:沓掛以東三河方向
LAT_MIN, LAT_MAX = 34.990, 35.240     # 南:知多・三河灣   北:清洲・名古屋市中心
COLS, ROWS = 161, 141                  # 約 190m 解析度（更大範圍）
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

# 補洞；海面負值夾到 0
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
with open("data/okehazama/heightmap.js", "w") as f:
    f.write("/* 桶狹間 SRTM 30m 真實高程網格（由 fetch_dem_okehazama.py 產生）\n")
    f.write(" * data 為列優先：index = row*cols + col；row 0 = latMin（南），col 0 = lngMin（西）\n")
    f.write(" * 海面(伊勢灣/年魚市潟)以 0 表示 */\n")
    f.write("window.SEKI = window.SEKI || {};\n")
    f.write("SEKI.heightmap = " + json.dumps(out) + ";\n")

mn, mx = min(elev), max(elev)
print(f"DONE  points={len(elev)}  elev min={mn} max={mx}")
