"""Revisión estricta de marcas del fabricante en las fotos publicadas (fase 10): busca en cada foto, por todo el
objeto (no solo en el cuello), cualquier mancha pequeña y de alto contraste que pueda ser una etiqueta, un hang tag,
una etiqueta lateral, un estampado interior o una marca en una gorra, y la saca a una hoja de recortes ampliados
para revisarla a ojo y pasarle el OCR.

Para cada foto publicada (la versión grande de data/fotos-catalogo.json): máscara del objeto (como en el pipeline),
color local de la tela (mediana en Lab en una ventana grande) y ΔE de cada píxel respecto a él; es candidata toda
mancha de ΔE alto con el tamaño de una etiqueta (ni una mota ni un panel entero), compacta y dentro del objeto. Los
elementos reales del producto (cremalleras, botones, asas, el anillo de un llavero, la tapa de una botella, el diseño
de ejemplo de las fotos del equipo) salen también: por eso la hoja es para revisar, no para retocar a ciegas.

Escribe docs/revision-colores/marcas/<slug>.jpg (recortes a 3× con la foto y el rectángulo), los recortes sueltos en
docs/revision-colores/marcas/recortes/ (para el OCR: node scripts/fotos/ocr-fotos.mjs --modo bloque
docs/revision-colores/marcas/recortes) y docs/revision-colores/marcas.csv (producto, color, lado, caja, área, ΔE).

Uso: python -I -X utf8 scripts/fotos/revisar-marcas.py [solo-slug ...]
"""
import csv
import importlib.util
import json
import os
import re
import sys
import unicodedata

import numpy as np
from PIL import Image, ImageDraw
from scipy import ndimage

sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))
import etiquetas as E  # noqa: E402
import fuentes as F  # noqa: E402
import recolor as R  # noqa: E402
from geometria import escala_uniforme  # noqa: E402

spec = importlib.util.spec_from_file_location("pfp", os.path.join(os.path.dirname(os.path.abspath(__file__)), "preparar-fotos-productos.py"))
pfp = importlib.util.module_from_spec(spec)
spec.loader.exec_module(pfp)

INDICE = "data/fotos-catalogo.json"
CARPETA = "docs/revision-colores/marcas"
RECORTES = os.path.join(CARPETA, "recortes")
SALIDA_CSV = "docs/revision-colores/marcas.csv"
UMBRAL_DE = 28.0  # ΔE respecto a la tela local a partir del cual un píxel no es tela
VENTANA = 61  # px (a 600): ventana de la mediana local (mayor que una etiqueta, menor que un panel)
AREA_MIN, AREA_MAX = 20, 9000  # px² (a 600)
LADO_MAX = 110  # px (a 600): más grande no es una etiqueta
ZOOM = 3
ANCHO_ANALISIS = 600  # px: ancho al que se analiza cada foto (fase 10)
EROSION = 6  # px (a 600) que se descartan junto al borde del objeto
LADO_MIN = 4  # px (a 600): más pequeño no es una etiqueta legible
RELLENO_MIN = 0.6  # proporción mínima de la caja que ocupa la mancha (una etiqueta es maciza)
UMBRAL_DE_MEDIO = 35.0  # ΔE medio mínimo de la mancha entera (las sombras de las costuras se quedan por debajo)


def slug(texto):
    t = unicodedata.normalize("NFD", texto).encode("ascii", "ignore").decode().lower()
    return re.sub(r"[^a-z0-9]+", "-", t).strip("-")


def candidatas(a, mascara, escala):
    """Rectángulos (x0, y0, x1, y1, área, ΔE medio) de las manchas sospechosas dentro del objeto, en px de la foto.
    Se analiza a 600 px de ancho y la mediana local (la tela de alrededor) se calcula sobre una copia a 300 px y se
    amplía: a 1200 px la mediana tardaba minutos por foto y el resultado es el mismo (una etiqueta mide 6 px o más a
    600 px y no pesa en una ventana de 31 px a 300)."""
    k = min(1.0, ANCHO_ANALISIS / a.shape[1])
    if k < 1.0:
        tam = (ANCHO_ANALISIS, max(1, int(round(a.shape[0] * k))))
        a6 = np.asarray(Image.fromarray(a).resize(tam, Image.LANCZOS))
        m6 = np.asarray(Image.fromarray((mascara.astype(np.uint8) * 255)).resize(tam, Image.NEAREST)) > 127
    else:
        a6, m6 = a, mascara
    lab = E._lab(a6.astype(np.float64))
    pequena = np.asarray(Image.fromarray(a6).resize((max(1, a6.shape[1] // 2), max(1, a6.shape[0] // 2)), Image.BOX))
    lab_p = E._lab(pequena.astype(np.float64))
    v = (VENTANA // 2) | 1
    local_p = np.stack([ndimage.median_filter(lab_p[..., i], size=v, mode="nearest") for i in range(3)], axis=-1)
    local = np.stack(
        [np.asarray(Image.fromarray(local_p[..., i].astype(np.float32), mode="F").resize((a6.shape[1], a6.shape[0]), Image.BILINEAR)) for i in range(3)],
        axis=-1,
    ).astype(np.float64)
    de = np.sqrt(((lab - local) ** 2).sum(axis=-1))
    # el borde de la prenda (escote, sisas, bajo) tiene degradado y sombra: lejos de él
    dentro = ndimage.binary_erosion(m6, iterations=EROSION, border_value=0)
    cand = (de > UMBRAL_DE) & dentro
    cand = ndimage.binary_opening(cand, iterations=1)
    et, n = ndimage.label(ndimage.binary_dilation(cand, iterations=3))
    salida = []
    for e in range(1, n + 1):
        comp = (et == e) & cand
        area = int(comp.sum())
        if area < AREA_MIN or area > AREA_MAX:
            continue
        ys, xs = np.where(comp)
        w, h = xs.max() - xs.min() + 1, ys.max() - ys.min() + 1
        # una etiqueta es un rectángulo macizo; los restos de borde y las costuras son arcos finos
        if w > LADO_MAX or h > LADO_MAX or min(w, h) < LADO_MIN or area < RELLENO_MIN * w * h:
            continue
        x0, y0, x1, y1 = (int(round(v_ / k)) for v_ in (xs.min(), ys.min(), xs.max() + 1, ys.max() + 1))
        de_medio = float(de[comp].mean())
        if de_medio < UMBRAL_DE_MEDIO:
            continue
        salida.append((x0, y0, min(a.shape[1], x1), min(a.shape[0], y1), area, de_medio))
    return salida


def main():
    solo = set(sys.argv[1:])
    indice = json.load(open(INDICE, encoding="utf-8"))
    os.makedirs(RECORTES, exist_ok=True)
    filas = []
    total_fotos = 0
    for slug_p, colores in indice.items():
        if solo and slug_p not in solo:
            continue
        cfg = pfp.P.get(slug_p)
        recortes = []
        vistos = set()
        for color, e in colores.items():
            for lado in ("delante", "detras"):
                ruta = e.get(lado)
                if not ruta or ruta in vistos:
                    continue
                vistos.add(ruta)
                total_fotos += 1
                a = np.asarray(Image.open("public" + ruta).convert("RGB"))
                escala = pfp.escala_de(a)
                if cfg:
                    m = pfp.mascara_bruta(a, pfp.transformar_cfg(cfg, escala_uniforme(F.ANCHO_REFERENCIA, a.shape[1])))
                else:
                    m = R.mascara_objeto(a, "conectado", 251.5)
                for x0, y0, x1, y1, area, de in candidatas(a, m, escala):
                    filas.append({"producto": slug_p, "color": color, "lado": lado, "archivo": ruta.rsplit("/", 1)[-1], "x0": x0, "y0": y0, "x1": x1, "y1": y1, "area_600": f"{area:.0f}", "dE": f"{de:.0f}", "veredicto": ""})
                    mx, my = int(round(10 * escala)), int(round(10 * escala))
                    cx0, cy0, cx1, cy1 = max(0, x0 - mx * 3), max(0, y0 - my * 3), min(a.shape[1], x1 + mx * 3), min(a.shape[0], y1 + my * 3)
                    recorte = Image.fromarray(a[cy0:cy1, cx0:cx1]).resize(((cx1 - cx0) * ZOOM, (cy1 - cy0) * ZOOM), Image.LANCZOS)
                    d = ImageDraw.Draw(recorte)
                    d.rectangle([(x0 - cx0) * ZOOM, (y0 - cy0) * ZOOM, (x1 - cx0) * ZOOM, (y1 - cy0) * ZOOM], outline=(255, 0, 0), width=2)
                    nombre = f"{slug_p}-{slug(color)}-{lado}-{x0}-{y0}"
                    Image.fromarray(a[cy0:cy1, cx0:cx1]).resize(((cx1 - cx0) * ZOOM, (cy1 - cy0) * ZOOM), Image.LANCZOS).save(os.path.join(RECORTES, nombre + ".png"))
                    recortes.append((f"{color} · {lado} · ({x0}, {y0}, {x1}, {y1}) · ΔE {de:.0f}", recorte))
        if recortes:
            ancho = min(900, max(r[1].width for r in recortes))
            alto = min(900, max(r[1].height for r in recortes))
            por_fila = 3
            filas_hoja = (len(recortes) + por_fila - 1) // por_fila
            hoja = Image.new("RGB", (por_fila * (ancho + 10), filas_hoja * (alto + 24)), (255, 255, 255))
            d = ImageDraw.Draw(hoja)
            for i, (texto, im) in enumerate(recortes):
                cx, cy = (i % por_fila) * (ancho + 10), (i // por_fila) * (alto + 24)
                im.thumbnail((ancho, alto))
                hoja.paste(im, (cx, cy + 22))
                d.text((cx + 3, cy + 5), texto, fill=(190, 0, 0))
            hoja.save(os.path.join(CARPETA, f"{slug_p}.jpg"), quality=88, optimize=True)
        print(f"{slug_p}: {len(vistos)} fotos · {len(recortes)} manchas candidatas", flush=True)
    os.makedirs(os.path.dirname(SALIDA_CSV), exist_ok=True)
    campos = ["producto", "color", "lado", "archivo", "x0", "y0", "x1", "y1", "area_600", "dE", "veredicto"]
    with open(SALIDA_CSV, "w", encoding="utf-8", newline="") as f:
        w = csv.DictWriter(f, fieldnames=campos)
        w.writeheader()
        w.writerows(filas)
    print(f"{total_fotos} fotos revisadas · {len(filas)} candidatas → {SALIDA_CSV} y {CARPETA}/")


if __name__ == "__main__":
    main()
