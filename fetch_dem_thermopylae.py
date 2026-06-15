#!/usr/bin/env python3
"""抓取溫泉關（Thermopylae）一帶 SRTM 30m 高程，存成 data/thermopylae/heightmap.js

範圍涵蓋：馬利亞灣(北)→古海岸窄道→中門/科洛諾斯小丘→卡利德羅莫山北坡(南)。
※ 古地形：西元前 480 年海岸線遠在今日南方數公里（斯佩爾刻俄斯河三角洲淤積），
  當年隘道僅容少數人並肩。本作以 SEKI.config.ancientCoast.seaLevel 把今日低沖積平原
  視為古海面（夾平+海藍），重建「一邊大海、一邊陡崖」的窄道（比照桶狹間年魚市潟）。

用法：python3 fetch_dem_thermopylae.py   （需網路連 opentopodata；尊重 1 req/sec 限速）
"""
import json, time, urllib.request, urllib.parse, sys

# bbox：經度東西沿隘道、緯度南(山)北(灣)
LNG_MIN, LNG_MAX = 22.490, 22.620    # 西↔東 沿溫泉關隘道
LAT_MIN, LAT_MAX = 38.770, 38.860    # 南:卡利德羅莫山北坡   北:馬利亞灣
COLS, ROWS = 141, 141                 # 約 70m 解析度
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
with open("data/thermopylae/heightmap.js", "w") as f:
    f.write("/* 溫泉關 SRTM 30m 真實高程網格（由 fetch_dem_thermopylae.py 產生）\n")
    f.write(" * data 為列優先：index = row*cols + col；row 0 = latMin（南），col 0 = lngMin（西）\n")
    f.write(" * 馬利亞灣(北)以 0 表示；古海岸窄道由 config.ancientCoast.seaLevel 夾平呈現 */\n")
    f.write("window.SEKI = window.SEKI || {};\n")
    f.write("SEKI.heightmap = " + json.dumps(out) + ";\n")

mn, mx = min(elev), max(elev)
print(f"DONE  points={len(elev)}  elev min={mn} max={mx}")
print("→ 已寫入 data/thermopylae/heightmap.js（取代 Phase 0 的 okehazama placeholder）")
