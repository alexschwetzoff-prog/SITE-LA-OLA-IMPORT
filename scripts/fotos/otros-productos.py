#!/usr/bin/env python3
"""Recorta las fotos de «otros productos» (atrapasueños, bolsos, sombreros, toallas…) de los carteles de catálogo.

Cada cartel contiene varios productos; este script recorta una foto por variante (color o diseño) a partir de las
coordenadas de scripts/fotos/otros-productos-recortes.json, quita el fondo con GrabCut cuando el resultado es limpio
y exporta un WebP cuadrado con fondo blanco por variante:

    public/productos/catalogo/<slug-modelo>/<slug-variante>.webp

Nunca se amplía por encima del tamaño real del recorte (los carteles son de baja resolución: cada variante ocupa
unos 150-350 px). Los nombres de archivo no llevan referencias del proveedor.

Cuando lleguen fotos mejores (HD): sustituye el cartel en assets/productos/otros-productos-origen/ (o añade las fotos
sueltas y cambia «cartel» y «caja» en el JSON) y vuelve a lanzar el script. Los carteles originales no se suben a git.

Uso (desde la raíz del proyecto; necesita numpy, opencv-python-headless y Pillow):

    python3 scripts/fotos/otros-productos.py                 # todo
    python3 scripts/fotos/otros-productos.py --solo toalla-playa-70x140
    python3 scripts/fotos/otros-productos.py --hojas DIR     # además, hojas de contacto para revisar a ojo

Modos del JSON, por variante: "blanco" (fotos que ya tienen fondo blanco o casi: lo conectado a los bordes pasa a blanco puro
y se recorta al producto, sin tocar nada más), "ia" ( quita el fondo con un modelo de segmentación, rembg/ISNet),
"bbox" (IA + rectángulo que envuelve el producto: toallas), "bolso" (IA: asas con su máscara y cuerpo con contorno
relleno), "hull" (IA + contorno convexo relleno: productos que llenan la caja, como toallas y bolsos; si el contorno
es demasiado pequeño usa el rectángulo), "recorte" (GrabCut, sin IA) o "rect" (recorte rectangular, sin quitar el fondo). «excluir» lista rectángulos (textos
de referencia, precios, detalles ampliados) que nunca entran en la foto: se rellenan antes de recortar.

El modo "ia" necesita `pip install rembg onnxruntime` (descarga el modelo isnet-general-use la primera vez).
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


_SESION = None


def segmentar_ia(roi: np.ndarray) -> np.ndarray:
    """Máscara (0-255) del producto con rembg/ISNet; se queda con el objeto principal y lo que cuelga de él."""
    global _SESION
    from rembg import new_session, remove

    if _SESION is None:
        _SESION = new_session('isnet-general-use')
    rgb = cv2.cvtColor(roi, cv2.COLOR_BGR2RGB)
    alfa = np.asarray(remove(Image.fromarray(rgb), session=_SESION, only_mask=True))
    fuerte = (alfa > 128).astype(np.uint8)
    n, lab, st, _ = cv2.connectedComponentsWithStats(fuerte, 8)
    if n <= 1:
        return alfa
    area = fuerte.shape[0] * fuerte.shape[1]
    grandes = [i for i in range(1, n) if st[i, cv2.CC_STAT_AREA] >= 0.04 * area]
    if not grandes:
        grandes = [1 + int(np.argmax(st[1:, cv2.CC_STAT_AREA]))]
    base = np.isin(lab, grandes).astype(np.uint8)
    # lo que cuelga cerca del objeto (borlas, plumas, cuentas) se conserva; los vecinos lejanos del cartel, no
    cerca = cv2.dilate(base, np.ones((2 * max(5, int(0.04 * max(fuerte.shape))) + 1,) * 2, np.uint8))
    mantener = np.isin(lab, [i for i in range(1, n) if (cerca[lab == i] > 0).any() and st[i, cv2.CC_STAT_AREA] >= 0.0008 * area])
    return np.where(mantener, alfa, 0).astype(np.uint8)


def calidad_mascara(mask: np.ndarray) -> float:
    return float(mask.mean())


def recortar(cartel: np.ndarray, caja: list[int], excluir: list[list[int]], modo: str) -> Image.Image:
    """Devuelve un RGB cuadrado, fondo blanco, con el producto centrado."""
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
    elif modo == 'blanco':
        rgb = cv2.cvtColor(roi, cv2.COLOR_BGR2RGB)
        claro = (roi.min(axis=2) >= 243).astype(np.uint8)
        n, lab, st, _ = cv2.connectedComponentsWithStats(claro, 4)
        borde = set(np.unique(np.concatenate([lab[0], lab[-1], lab[:, 0], lab[:, -1]]))) - {0}
        fondo = np.isin(lab, list(borde))
        alfa = np.where(fondo, 0, 255).astype(np.uint8)
        if fondo.mean() < 0.03 or fondo.mean() > 0.97:
            print('   ! fondo dudoso, se usa el rectángulo', file=sys.stderr)
            alfa = np.full(roi.shape[:2], 255, np.uint8)
        else:
            alfa = cv2.GaussianBlur(alfa, (0, 0), 0.7)
    elif modo in ('bbox', 'bolso'):
        hueco = np.zeros(roi.shape[:2], np.uint8)
        for a, b, c, d in rel:
            hueco[max(0, b) : max(0, d), max(0, a) : max(0, c)] = 255
        limpio = cv2.inpaint(roi, hueco, 6, cv2.INPAINT_TELEA) if hueco.any() else roi
        rgb = cv2.cvtColor(limpio, cv2.COLOR_BGR2RGB)
        ia = segmentar_ia(limpio)
        fuerte = (ia > 128).astype(np.uint8)
        alfa = np.full(roi.shape[:2], 255, np.uint8)
        pts = cv2.findNonZero(fuerte)
        if pts is not None:
            x, y, w, h = cv2.boundingRect(pts)
            if modo == 'bbox':
                forma = np.zeros_like(fuerte)
                m = int(0.02 * max(w, h))  # unos px hacia dentro: quita el borde de arena del cartel
                forma[y + m : y + h - m, x + m : x + w - m] = 1
            else:
                casco = np.zeros_like(fuerte)
                cv2.fillConvexPoly(casco, cv2.convexHull(pts), 1)
                anchos = fuerte.sum(axis=1)
                cuerpo = np.where(anchos > 0.55 * anchos.max())[0]
                y0 = int(cuerpo[0]) if len(cuerpo) else y
                forma = fuerte.copy()
                forma[y0:] = casco[y0:]
            if forma.mean() >= 0.45:
                alfa = cv2.GaussianBlur((forma * 255).astype(np.uint8), (0, 0), 0.9)
            else:
                print('   ! contorno pequeño, se usa el rectángulo', file=sys.stderr)
    elif modo == 'hull':
        hueco = np.zeros(roi.shape[:2], np.uint8)
        for a, b, c, d in rel:
            hueco[max(0, b) : max(0, d), max(0, a) : max(0, c)] = 255
        limpio = cv2.inpaint(roi, hueco, 6, cv2.INPAINT_TELEA) if hueco.any() else roi
        rgb = cv2.cvtColor(limpio, cv2.COLOR_BGR2RGB)
        fuerte = (segmentar_ia(limpio) > 128).astype(np.uint8)
        alfa = np.full(roi.shape[:2], 255, np.uint8)
        pts = cv2.findNonZero(fuerte)
        if pts is not None:
            casco = np.zeros_like(fuerte)
            cv2.fillConvexPoly(casco, cv2.convexHull(pts), 1)
            if casco.mean() >= 0.5:
                alfa = cv2.GaussianBlur((casco * 255).astype(np.uint8), (0, 0), 0.9)
            else:
                print('   ! contorno pequeño, se usa el rectángulo', file=sys.stderr)
    elif modo == 'ia':
        hueco = np.zeros(roi.shape[:2], np.uint8)
        for a, b, c, d in rel:
            hueco[max(0, b) : max(0, d), max(0, a) : max(0, c)] = 255
        limpio = cv2.inpaint(roi, hueco, 6, cv2.INPAINT_TELEA) if hueco.any() else roi
        rgb = cv2.cvtColor(limpio, cv2.COLOR_BGR2RGB)
        alfa = segmentar_ia(limpio)
        if not 0.05 < float((alfa > 128).mean()) < 0.97:  # algo falló: se vuelve a GrabCut
            print('   ! IA dudosa, se usa GrabCut', file=sys.stderr)
            mask8 = (segmentar(roi, rel) * 255).astype(np.uint8)
            alfa = cv2.GaussianBlur(cv2.erode(mask8, np.ones((2, 2), np.uint8)), (0, 0), 0.9)
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
    LADO_MAX = 1200  # nunca se amplía: si la foto es más pequeña, el lienzo se queda en su tamaño
    if max(img.size) > LADO_MAX / (1 + 2 * MARGEN):
        k = LADO_MAX / (1 + 2 * MARGEN) / max(img.size)
        img = img.resize((max(1, round(img.width * k)), max(1, round(img.height * k))), Image.LANCZOS)
    lado = int(round(max(img.size) * (1 + 2 * MARGEN)))
    # fondo blanco opaco: el producto resalta igual en la tarjeta, la ficha y la cesta
    lienzo = Image.new('RGBA', (lado, lado), (255, 255, 255, 255))
    lienzo.alpha_composite(img, ((lado - img.width) // 2, (lado - img.height) // 2))
    return lienzo.convert('RGB')


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
        fondo.paste(v, ((celda - 6 - v.width) // 2, (celda - 6 - v.height) // 2))
        hoja.paste(fondo, (x + 3, y + 3))
        d.text((x + 4, y + celda - 1), nombre[:34], fill=(0, 6, 61), font=fuente)
    destino.parent.mkdir(parents=True, exist_ok=True)
    hoja.save(destino)


def main():
    ap = argparse.ArgumentParser(description=__doc__, formatter_class=argparse.RawDescriptionHelpFormatter)
    ap.add_argument('--json', default=str(JSON_RECORTES), help='JSON con los recortes (por defecto otros-productos-recortes.json)')
    ap.add_argument('--solo', help='slug de un solo modelo')
    ap.add_argument('--hojas', help='carpeta donde guardar hojas de contacto (una por modelo)')
    args = ap.parse_args()

    cfg = json.loads(Path(args.json).read_text(encoding='utf-8'))
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
            im = recortar(carteles[v['cartel']], v['caja'], v.get('excluir', []), v.get('modo', 'ia'))
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
