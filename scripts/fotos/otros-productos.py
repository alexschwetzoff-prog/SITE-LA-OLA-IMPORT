#!/usr/bin/env python3
"""Recorta las fotos de «otros productos» (atrapasueños, bolsos, sombreros, toallas…) de los carteles de catálogo.

Cada cartel contiene varios productos; este script recorta una foto por variante (color o diseño) a partir de las
coordenadas de scripts/fotos/otros-productos-recortes.json, quita el fondo con GrabCut cuando el resultado es limpio
y exporta un WebP cuadrado (fondo transparente) por variante:

    public/productos/catalogo/<slug-modelo>/<slug-variante>.webp

Nunca se amplía por encima del tamaño real del recorte (los carteles son de baja resolución: cada variante ocupa
unos 150-350 px). Los nombres de archivo no llevan referencias del proveedor.

Cuando lleguen fotos mejores (HD): sustituye el cartel en assets/productos/otros-productos-origen/ (o añade las fotos
sueltas y cambia «cartel» y «caja» en el JSON) y vuelve a lanzar el script. Los carteles originales no se suben a git.

Uso (desde la raíz del proyecto; necesita numpy, opencv-python-headless y Pillow):

    python3 scripts/fotos/otros-productos.py                 # todo
    python3 scripts/fotos/otros-productos.py --solo toalla-playa-70x140
    python3 scripts/fotos/otros-productos.py --hojas DIR     # además, hojas de contacto para revisar a ojo

Modos del JSON, por variante: "recorte" (por defecto: quita el fondo) o "rect" (recorte rectangular, sin quitar el
fondo, para los casos en que GrabCut no da un resultado limpio). «excluir» lista rectángulos (textos de referencia,
precios, detalles ampliados) que nunca entran en la foto.
"""
import argparse
import json
import sys
from pathlib import Path

import cv2
import numpy as np
from PIL import Image, ImageDraw, ImageFont

RAIZ = Path(__file__).resolve().parents[2]
JSON_RECORTES = RAIZ / 'scripts' / 'fotos' / 'otros-productos-recortes.json'
MARGEN = 0.06  # aire alrededor del producto, en fracción del lado mayor


def segmentar(roi: np.ndarray, excluir_rel: list[list[int]]) -> np.ndarray:
    """Máscara booleana del producto dentro de `roi` (BGR) con GrabCut."""
    h, w = roi.shape[:2]
    m = np.full((h, w), cv2.GC_BGD, np.uint8)
    pad = 3
    m[pad : h - pad, pad : w - pad] = cv2.GC_PR_BGD
    # el producto ocupa casi toda la caja: el centro es seguro y el interior, probable
    m[int(h * 0.12) : int(h * 0.88), int(w * 0.12) : int(w * 0.88)] = cv2.GC_PR_FGD
    m[int(h * 0.38) : int(h * 0.62), int(w * 0.38) : int(w * 0.62)] = cv2.GC_FGD
    for x0, y0, x1, y1 in excluir_rel:
        m[max(0, y0) : max(0, y1), max(0, x0) : max(0, x1)] = cv2.GC_BGD
    bgd = np.zeros((1, 65), np.float64)
    fgd = np.zeros((1, 65), np.float64)
    cv2.grabCut(roi, m, None, bgd, fgd, 6, cv2.GC_INIT_WITH_MASK)
    fg = ((m == cv2.GC_FGD) | (m == cv2.GC_PR_FGD)).astype(np.uint8)
    # se queda con los trozos grandes y rellena los huecos pequeños
    n, lab, st, _ = cv2.connectedComponentsWithStats(fg, 8)
    area = h * w
    out = np.zeros_like(fg)
    for i in range(1, n):
        if st[i, cv2.CC_STAT_AREA] >= 0.02 * area:
            out[lab == i] = 1
    inv = 1 - out
    n, lab, st, _ = cv2.connectedComponentsWithStats(inv, 4)
    for i in range(1, n):
        if st[i, cv2.CC_STAT_AREA] < 0.012 * area:
            out[lab == i] = 1
    return out.astype(bool)


def calidad_mascara(mask: np.ndarray) -> float:
    return float(mask.mean())


def recortar(cartel: np.ndarray, caja: list[int], excluir: list[list[int]], modo: str) -> Image.Image:
    """Devuelve un RGBA cuadrado con el producto centrado."""
    x0, y0, x1, y1 = caja
    roi = cartel[y0:y1, x0:x1]
    rgb = cv2.cvtColor(roi, cv2.COLOR_BGR2RGB)
    rel = [[a - x0, b - y0, c - x0, d - y0] for a, b, c, d in excluir]
    if modo == 'rect':
        # recorte rectangular: los textos y detalles de «excluir» se rellenan por inpainting (no queda un hueco)
        hueco = np.zeros(roi.shape[:2], np.uint8)
        for a, b, c, d in rel:
            hueco[max(0, b) : max(0, d), max(0, a) : max(0, c)] = 255
        if hueco.any():
            rgb = cv2.cvtColor(cv2.inpaint(roi, hueco, 6, cv2.INPAINT_TELEA), cv2.COLOR_BGR2RGB)
        alfa = np.full(roi.shape[:2], 255, np.uint8)
    else:
        mask = segmentar(roi, rel)
        if not 0.08 < calidad_mascara(mask) < 0.985:  # algo falló: caja entera
            print('   ! máscara dudosa, se usa el rectángulo', file=sys.stderr)
            mask = np.ones_like(mask)
        mask8 = (mask * 255).astype(np.uint8)
        mask8 = cv2.erode(mask8, np.ones((2, 2), np.uint8))  # quita el halo del fondo
        alfa = cv2.GaussianBlur(mask8, (0, 0), 0.9)
    img = Image.fromarray(np.dstack([rgb, alfa]), 'RGBA')
    bbox = img.getchannel('A').point(lambda v: 255 if v > 20 else 0).getbbox()
    if bbox:
        img = img.crop(bbox)
    lado = int(round(max(img.size) * (1 + 2 * MARGEN)))
    lienzo = Image.new('RGBA', (lado, lado), (0, 0, 0, 0))
    lienzo.alpha_composite(img, ((lado - img.width) // 2, (lado - img.height) // 2))
    return lienzo


def hoja_de_contacto(items: list[tuple[str, Image.Image]], destino: Path, columnas: int = 6, celda: int = 210):
    filas = (len(items) + columnas - 1) // columnas
    hoja = Image.new('RGB', (columnas * celda, filas * (celda + 22)), (236, 236, 240))
    d = ImageDraw.Draw(hoja)
    fuente = ImageFont.load_default()
    for i, (nombre, im) in enumerate(items):
        x, y = (i % columnas) * celda, (i // columnas) * (celda + 22)
        fondo = Image.new('RGB', (celda - 6, celda - 6), (255, 255, 255))
        v = im.copy()
        v.thumbnail((celda - 6, celda - 6))
        fondo.paste(v, ((celda - 6 - v.width) // 2, (celda - 6 - v.height) // 2), v)
        hoja.paste(fondo, (x + 3, y + 3))
        d.text((x + 4, y + celda - 1), nombre[:34], fill=(0, 6, 61), font=fuente)
    destino.parent.mkdir(parents=True, exist_ok=True)
    hoja.save(destino)


def main():
    ap = argparse.ArgumentParser(description=__doc__, formatter_class=argparse.RawDescriptionHelpFormatter)
    ap.add_argument('--solo', help='slug de un solo modelo')
    ap.add_argument('--hojas', help='carpeta donde guardar hojas de contacto (una por modelo)')
    args = ap.parse_args()

    cfg = json.loads(JSON_RECORTES.read_text(encoding='utf-8'))
    origen = RAIZ / cfg['origen']
    salida = RAIZ / cfg['salida']
    carteles: dict[str, np.ndarray] = {}
    total = 0
    for modelo, variantes in cfg['modelos'].items():
        if args.solo and modelo != args.solo:
            continue
        items = []
        for slug, v in variantes.items():
            ruta = origen / v['cartel']
            if v['cartel'] not in carteles:
                carteles[v['cartel']] = cv2.imread(str(ruta))
                if carteles[v['cartel']] is None:
                    sys.exit(f'No encuentro el cartel: {ruta}')
            print(f'{modelo}/{slug}')
            im = recortar(carteles[v['cartel']], v['caja'], v.get('excluir', []), v.get('modo', 'recorte'))
            destino = salida / modelo / f'{slug}.webp'
            destino.parent.mkdir(parents=True, exist_ok=True)
            im.save(destino, 'WEBP', quality=92, method=6)
            items.append((slug, im))
            total += 1
        if args.hojas:
            hoja_de_contacto(items, Path(args.hojas) / f'{modelo}.png')
    print(f'{total} fotos escritas en {salida}')


if __name__ == '__main__':
    main()
