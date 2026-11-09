"""Fuentes de las fotos de producto (fase 4.4): las fotos del proveedor por color (hd de 2000 px, fase 4.4, o
«large» de 600 px, fase 4.3: se toma la mayor de las dos) y su lectura al tamaño de publicación.

Reglas:
  - Los originales no se tocan ni se suben (los hd viven en assets/productos/originales-proveedor-hd/, carpeta
    ignorada por git). Ninguna foto se amplía: la de 460 px se publica a 460 px.
  - Tamaño de publicación: ANCHO_PUBLICADO (1200 px) y una versión de 800 px para pantallas pequeñas, las dos
    desde el mismo original (una sola compresión, en WebP de alta calidad).
  - Las fotos casi cuadradas del proveedor (2000 × 2001) se recortan al cuadrado antes de reducirlas.
"""
import csv
import os

import numpy as np
from PIL import Image

LISTA_PROVEEDOR = "docs/fotos-proveedor/lista-descargas.csv"
ORIGINALES_PROVEEDOR = "assets/productos/originales-proveedor"
ORIGINALES_PROVEEDOR_HD = "assets/productos/originales-proveedor-hd"
ANCHO_PUBLICADO = 1200
ANCHOS_PUBLICADOS = (1200, 800)
ANCHO_REFERENCIA = 600  # las medidas a mano de las fases 4.1 a 4.3 están en px de fotos de 600

# Fotos cuya versión hd del proveedor no es la misma foto que la «large» (lo cazaron la auditoría automática
# muestra ↔ foto, scripts/fotos/auditar-colores.py, y la de coherencia delante ↔ detrás de la fase 10): se usa la
# «large» de 600 px, que sí es la buena, y se publica a 600 px (nunca se amplía).
PREFERIR_LARGE = {
    ("mercury", "Amarillo flúor", "delante"),  # la hd es la trasera de la gorra negra (error del proveedor)
    ("estambul-woman", "Negro", "detras"),  # la hd es una vista lateral de la chaqueta azul acero (error del proveedor)
    ("urban", "Rosa claro y gris vigoré", "detras"),  # la hd es una vista lateral de la sudadera verde (error del proveedor)
}


def anchos_de(ancho):
    """Anchos que se publican de una foto de `ancho` px: el propio y los menores de ANCHOS_PUBLICADOS."""
    return [ancho] + [a for a in ANCHOS_PUBLICADOS if a < ancho]


def fotos_del_proveedor():
    """{(producto, color, lado): ruta} de las fotos reales descargadas: la hd si existe y es mayor que la «large»."""
    fotos = {}
    if not os.path.exists(LISTA_PROVEEDOR):
        return fotos
    for fila in csv.DictReader(open(LISTA_PROVEEDOR, encoding="utf-8")):
        nombre = fila["url"].rsplit("/", 1)[-1]
        candidatas = []
        clave = (fila["producto"], fila["color_nombre"], fila["vista"])
        carpetas = (ORIGINALES_PROVEEDOR,) if clave in PREFERIR_LARGE else (ORIGINALES_PROVEEDOR_HD, ORIGINALES_PROVEEDOR)
        for carpeta in carpetas:
            ruta = os.path.join(carpeta, fila["producto"], nombre)
            if os.path.exists(ruta):
                try:
                    with Image.open(ruta) as im:
                        candidatas.append((im.width, carpeta == ORIGINALES_PROVEEDOR_HD, ruta))
                except OSError:
                    continue
        if candidatas:
            candidatas.sort(reverse=True)
            fotos[clave] = candidatas[0][2]
    return fotos


def abrir_foto(ruta):
    """La foto original tal cual (RGB), recortada al cuadrado si es casi cuadrada (2000 × 2001)."""
    im = Image.open(ruta).convert("RGB")
    w, h = im.size
    if w != h and abs(w - h) <= 4:
        lado = min(w, h)
        x0, y0 = (w - lado) // 2, (h - lado) // 2
        im = im.crop((x0, y0, x0 + lado, y0 + lado))
    return im


def leer_foto(ruta, ancho_max=ANCHO_PUBLICADO):
    """RGB uint8 de la foto reducida a `ancho_max` como mucho (nunca ampliada), recortada al cuadrado si es casi
    cuadrada. Devuelve (array, ancho original)."""
    im = Image.open(ruta)
    ancho_original = im.width
    im = abrir_foto(ruta)
    w, h = im.size
    if w > ancho_max:
        im = im.resize((ancho_max, max(1, round(h * ancho_max / w))), Image.LANCZOS)
    return np.asarray(im), ancho_original


def renderizar(ruta, t, ancho, alto):
    """La foto original llevada por la transformación `t` (en px del lienzo de salida de `ancho` × `alto`, medida
    sobre la foto ya reducida a ese ancho: x' = x·sx + dx) y dibujada sobre blanco, con un único remuestreo desde el
    original (fase 10: el reencuadre de las gorras y la normalización del encuadre no pasan dos veces por el
    reescalado, y una ampliación respecto a la foto publicada sale de la resolución del original). Nunca se amplía
    por encima del original: si hiciera falta, se avisa y se amplía igual (es la única salida)."""
    im = abrir_foto(ruta)
    w_src, h_src = im.size
    k = t.sx * ancho / w_src
    ky = t.sy * ancho / w_src  # fase 10b: escala vertical propia (ANCHURA_A_LA_BASE); igual a `k` salvo ahí
    if max(k, ky) > 1.0001:
        print(f"    AVISO: {ruta} se amplía ×{max(k, ky):.2f} por encima del original")
    grande = im.resize((max(1, round(w_src * k)), max(1, round(h_src * ky))), Image.LANCZOS)
    lienzo = Image.new("RGB", (ancho, alto), (255, 255, 255))
    lienzo.paste(grande, (int(round(t.dx)), int(round(t.dy))))
    return np.asarray(lienzo)
