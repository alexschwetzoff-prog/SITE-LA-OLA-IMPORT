#!/usr/bin/env python3
"""Genera public/marca/tu-logo-aqui.png: el motivo « Votre logo ici » de La Ola Import (negro sobre transparente).

La web lo dibuja sobre las fotos de producto y lo pasa a blanco sobre tejidos oscuros (lib/diseno-ejemplo.ts).
Diseño propio: texto redondeado y una ola doble debajo (en vez de los arcos de la base). Necesita Pillow y la
tipografía Outfit (la ruta se puede cambiar con --fuente). Tamaño 622 × 644 px, como el archivo anterior.

    python3 scripts/marque/votre-logo-ici.py
"""
import argparse
import math
from pathlib import Path

from PIL import Image, ImageDraw, ImageFont

RAIZ = Path(__file__).resolve().parents[2]
W, H, K = 622, 644, 4  # tamaño final y supermuestreo


def ola(d: ImageDraw.ImageDraw, x0, x1, y, amp, ciclos, ancho):
    pts = [(x0 + (x1 - x0) * t / 800, y + amp * math.sin(2 * math.pi * ciclos * t / 800)) for t in range(801)]
    r = ancho / 2
    for x, yy in pts:  # trazo continuo con puntas redondas (círculos a lo largo de la curva)
        d.ellipse([x - r, yy - r, x + r, yy + r], fill=(0, 0, 0, 255))


def main():
    ap = argparse.ArgumentParser()
    ap.add_argument('--fuente', default='/mnt/skills/examples/canvas-design/canvas-fonts/Outfit-Bold.ttf')
    ap.add_argument('--salida', default=str(RAIZ / 'public' / 'marca' / 'tu-logo-aqui.png'))
    a = ap.parse_args()
    s = K
    lienzo = Image.new('RGBA', (W * s, H * s), (0, 0, 0, 0))
    # texto en una capa aparte, girado unos grados como un sello
    capa = Image.new('RGBA', (W * s, H * s), (0, 0, 0, 0))
    d = ImageDraw.Draw(capa)
    f1 = ImageFont.truetype(a.fuente, 118 * s)
    f2 = ImageFont.truetype(a.fuente, 210 * s)
    for txt, f, cy in (('votre logo', f1, 205), ('ICI', f2, 360)):
        l, t, r, b = d.textbbox((0, 0), txt, font=f)
        d.text(((W * s - (r - l)) / 2 - l, cy * s - (b - t) / 2 - t), txt, font=f, fill=(0, 0, 0, 255))
    capa = capa.rotate(7, resample=Image.BICUBIC, center=(W * s / 2, H * s / 2))
    lienzo.alpha_composite(capa)
    d = ImageDraw.Draw(lienzo)
    ola(d, 70 * s, 552 * s, 505 * s, 22 * s, 3, 22 * s)
    ola(d, 120 * s, 502 * s, 568 * s, 18 * s, 2.5, 16 * s)
    ola(d, 40 * s, 200 * s, 70 * s, 12 * s, 1.5, 14 * s)
    out = lienzo.resize((W, H), Image.LANCZOS)
    Path(a.salida).parent.mkdir(parents=True, exist_ok=True)
    out.save(a.salida, optimize=True)
    print('escrito', a.salida)


if __name__ == '__main__':
    main()
