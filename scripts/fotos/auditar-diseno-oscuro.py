"""Versión clara u oscura del diseño de ejemplo en cada foto (fase 4.4).

El navegador (lib/diseno-ejemplo.ts) y las hojas de contactos (scripts/fotos/diseno.py) deciden foto a foto, por la
luminosidad real de la tela bajo el diseño (delante y detrás): por debajo de UMBRAL, «Tu logo aquí» va en blanco. El
logo y la estrella de [MARCA] (Atomic 150 y Austral) van siempre con sus colores de marca (fase 4.6) y aquí salen
como «marca». Este script mide esa luminosidad en cada
foto publicada y lista lo que queda cerca del umbral y, sobre todo, los colores de nombre oscuro (negro, marino,
antracita…) a los que les tocaría el diseño negro, para revisar el umbral.

Uso: python -I -X utf8 scripts/fotos/auditar-diseno-oscuro.py
Escribe docs/revision-colores/diseno-claro-oscuro.csv.
"""
import csv
import json
import os
import re
import sys

import numpy as np
from PIL import Image
from scipy import ndimage

sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))
import recolor as R  # noqa: E402

INDICE = "data/fotos-catalogo.json"
SALIDA = "docs/revision-colores/diseno-claro-oscuro.csv"
UMBRAL = 135  # el mismo que UMBRAL_BLANCO (lib/diseno-ejemplo.ts) y UMBRAL_DISENO_BLANCO (diseno.py)
OSCUROS = re.compile(r"(?i)negro|marino|antracita|carb[oó]n|grafito|plomo|chocolate|ciruela|granate|burdeos|morado|p[uú]rpura|botella|petr[oó]leo|denim|oliva|militar|azul acero|gris oscuro")


def luminancia_bajo(ruta, colocacion):
    """Luminancia sRGB media (0-255) de la tela bajo el cuadrado del diseño, como la mide el navegador."""
    a = np.asarray(Image.open(ruta).convert("RGB")).astype(np.float64)
    h, w = a.shape[:2]
    lienzo = colocacion.get("lienzo") or [w, h]
    esc = w / lienzo[0]
    cx, cy, ancho = colocacion["x"] * esc, colocacion["y"] * esc, colocacion["ancho"] * esc
    lum = 0.299 * a[..., 0] + 0.587 * a[..., 1] + 0.114 * a[..., 2]
    lum = ndimage.gaussian_filter(lum, 1.5 * esc)
    r = ancho / 2
    y0, y1, x0, x1 = int(max(0, cy - r)), int(min(h, cy + r)), int(max(0, cx - r)), int(min(w, cx + r))
    zona = lum[y0:y1, x0:x1]
    mascara = R.mascara_objeto(a.astype(np.uint8), "todo", 250.0)[y0:y1, x0:x1]
    sel = zona[mascara] if mascara.sum() > 20 else zona
    return float(sel.mean())


def main():
    indice = json.load(open(INDICE, encoding="utf-8"))
    filas = []
    for slug, colores in indice.items():
        for color, e in colores.items():
            for lado, clave in (("delante", "diseno"), ("detras", "disenoDetras")):
                if clave not in e or not e.get(lado):
                    continue
                ruta = "public" + e[lado]
                if not os.path.exists(ruta):
                    continue
                lum = luminancia_bajo(ruta, e[clave])
                version = "marca" if e[clave]["marca"] != "tu-logo-aqui" else ("blanco" if lum < UMBRAL else "negro")
                nombre_oscuro = bool(OSCUROS.search(color))
                aviso = ""
                if version == "marca":
                    aviso = ""
                elif nombre_oscuro and version == "negro":
                    aviso = "nombre oscuro con diseño negro"
                elif abs(lum - UMBRAL) < 15:
                    aviso = "cerca del umbral"
                filas.append({"producto": slug, "color": color, "lado": lado, "luminancia": f"{lum:.0f}", "version": version, "marca": e[clave]["marca"], "aviso": aviso})
    os.makedirs(os.path.dirname(SALIDA), exist_ok=True)
    with open(SALIDA, "w", encoding="utf-8", newline="") as f:
        w = csv.DictWriter(f, fieldnames=list(filas[0].keys()))
        w.writeheader()
        w.writerows(filas)
    blancos = sum(1 for f in filas if f["version"] == "blanco")
    print(f"{len(filas)} fotos con diseño: {blancos} en blanco, {len(filas) - blancos} en negro · umbral {UMBRAL} → {SALIDA}")
    for f in filas:
        if f["aviso"]:
            print(f"  {f['producto']:16} {f['color']:22} {f['lado']:8} luminancia {f['luminancia']:>3} → {f['version']:6} · {f['aviso']}")


if __name__ == "__main__":
    main()
