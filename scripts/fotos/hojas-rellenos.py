"""Hojas de revisión de los rellenos de etiqueta (fase 11): cada relleno de proceso.csv y proceso-estudio.csv, recortado
de la foto publicada con un margen y ampliado a 3×, en una hoja por producto (docs/revision-colores/rellenos/<slug>.jpg).
Es donde se mira, a ojo, que la costura y el ribete continúan y que no queda ningún rectángulo.

Uso: python -I -X utf8 scripts/fotos/hojas-rellenos.py [solo-slug ...]
"""
import ast
import csv
import json
import os
import re
import sys
import unicodedata

from PIL import Image, ImageDraw

INDICE = "data/fotos-catalogo.json"
PROCESO = "docs/fotos-proveedor/proceso.csv"
PROCESO_ESTUDIO = "docs/fotos-proveedor/proceso-estudio.csv"
CARPETA = "docs/revision-colores/rellenos"
ZOOM = 3
MARGEN = 36  # px (a 1200) alrededor de la caja


def slug(texto):
    t = unicodedata.normalize("NFD", texto).encode("ascii", "ignore").decode().lower()
    return re.sub(r"[^a-z0-9]+", "-", t).strip("-")


def ruta_publicada(indice, producto, color, lado):
    if producto in ("atomic-150", "austral"):
        return f"public/productos/estudio/{producto}-{slug(color)}-{lado}.webp"
    entrada = indice.get(producto, {}).get(color)
    return "public" + entrada[lado] if entrada and entrada.get(lado) else None


def main():
    solo = set(sys.argv[1:])
    indice = json.load(open(INDICE, encoding="utf-8"))
    filas = [r for r in csv.DictReader(open(PROCESO, encoding="utf-8")) if r["etiqueta"]]
    filas += [r for r in csv.DictReader(open(PROCESO_ESTUDIO, encoding="utf-8")) if r["etiqueta"]]
    os.makedirs(CARPETA, exist_ok=True)
    por_producto = {}
    for r in filas:
        por_producto.setdefault(r["producto"], []).append(r)
    for producto, lista in por_producto.items():
        if solo and producto not in solo:
            continue
        piezas = []
        for r in lista:
            ruta = ruta_publicada(indice, producto, r["color"], r["lado"])
            if not ruta or not os.path.exists(ruta):
                print(f"  falta la foto publicada de {producto} · {r['color']} · {r['lado']}")
                continue
            x0, y0, x1, y1 = ast.literal_eval(r["etiqueta"])
            im = Image.open(ruta).convert("RGBA")
            fondo = Image.new("RGBA", im.size, (235, 238, 245, 255))
            fondo.alpha_composite(im)
            im = fondo.convert("RGB")
            escala = im.width / int(r.get("ancho") or 1200)  # la caja está en px de la foto publicada
            cx0, cy0 = int((x0 - MARGEN) * escala), int(max(0, y0 - MARGEN) * escala)
            cx1, cy1 = int((x1 + MARGEN) * escala), int((y1 + MARGEN) * escala)
            recorte = im.crop((cx0, cy0, cx1, cy1))
            k = ZOOM * (1200 / im.width) if im.width < 1200 else ZOOM
            recorte = recorte.resize((max(1, int(recorte.width * k)), max(1, int(recorte.height * k))), Image.LANCZOS)
            piezas.append((f"{r['color']} {r['lado']} · {r['relleno'][:48]}", recorte))
        if not piezas:
            continue
        columnas = 6
        ancho = max(p.width for _, p in piezas)
        alto = max(p.height for _, p in piezas)
        filas_hoja = (len(piezas) + columnas - 1) // columnas
        hoja = Image.new("RGB", (columnas * (ancho + 6), filas_hoja * (alto + 22)), "white")
        dibujo = ImageDraw.Draw(hoja)
        for i, (texto, pieza) in enumerate(piezas):
            x, y = (i % columnas) * (ancho + 6), (i // columnas) * (alto + 22)
            hoja.paste(pieza, (x, y + 20))
            dibujo.text((x + 3, y + 4), texto, fill=(160, 0, 0))
        hoja.save(os.path.join(CARPETA, f"{producto}.jpg"), quality=88)
        print(f"{producto}: {len(piezas)} rellenos → {CARPETA}/{producto}.jpg")


if __name__ == "__main__":
    main()
