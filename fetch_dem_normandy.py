#!/usr/bin/env python3
"""抓取諾曼第奧馬哈海灘一帶 SRTM 30m 高程 → data/normandy/heightmap.js

bbox：北為英吉利海峽外海(艦隊火力支援/運輸錨地)、中為奧馬哈海灘、南為崖頂與內陸村落；
西端含 Pointe du Hoc(突擊隊攀崖)。海面 SRTM 多回傳 0/負值 → 夾到 0 作海面呈現。
data 為列優先：index = row*cols + col；row 0 = latMin（南），col 0 = lngMin（西）。
"""
import json, time, urllib.request, urllib.parse, sys, os

LNG_MIN, LNG_MAX = -1.085, -0.665     # 擴大：西含奧克角以西 東過 Colleville
LAT_MIN, LAT_MAX = 49.265, 49.515     # 擴大：北含更多外海艦隊區 南含更多內陸
COLS, ROWS = 161, 141                  # ~30m DEM、與桶狹間同級網格
API = "https://api.opentopodata.org/v1/srtm30m"

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
os.makedirs("data/normandy", exist_ok=True)
with open("data/normandy/heightmap.js", "w") as f:
    f.write("/* 諾曼第·奧馬哈 SRTM 30m 真實高程網格（由 fetch_dem_normandy.py 產生）\n")
    f.write(" * data 為列優先：index = row*cols + col；row 0 = latMin（南），col 0 = lngMin（西）\n")
    f.write(" * 海面(英吉利海峽)在 SRTM 回傳 0/負值，已夾到 0 作海面。 */\n")
    f.write("window.SEKI = window.SEKI || {};\n")
    f.write("SEKI.heightmap = " + json.dumps(out) + ";\n")
print("wrote data/normandy/heightmap.js")
