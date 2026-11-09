"""Diseño de ejemplo («Tu logo aquí», logo y estrella de [MARCA]) para las hojas de contactos y la portada.

Desde la fase 4.2 la web no lleva el diseño incrustado en las fotos: lo dibuja el navegador como capa aparte, a la
resolución real de la pantalla, a partir de los archivos de marca de public/marca/ y de la colocación que guarda el
índice (data/fotos-catalogo.json). Este módulo reproduce ese dibujo en Python, con el mismo sombreado de tela
(el diseño se multiplica por la luz relativa de la tela bajo él), para que las hojas de revisión enseñen lo que
enseña la ficha.

Archivos de marca:
  - assets/marca/tu-logo-aqui.jpg (1024 px): el fondo blanco pasa a transparente (alfa = oscuridad); versión
    blanca del mismo dibujo para telas oscuras.
  - assets/marca/logo-marca-catalogo-pdf.png (2223 × 852) y estrella-marca-catalogo-pdf.png (852 × 852):
    el logo y la estrella tal como van incrustados en el catálogo PDF (los extrae scripts/fotos/extraer-marca-pdf.py);
    si no existen, se usa public/marca/logo-marca.png (537 px).
"""
import os

import numpy as np
from PIL import Image
from scipy import ndimage

TU_LOGO_AQUI = "assets/marca/tu-logo-aqui.jpg"
LOGO_PDF = "assets/marca/logo-marca-catalogo-pdf.png"
ESTRELLA_PDF = "assets/marca/estrella-marca-catalogo-pdf.png"
LOGO_PNG = "public/marca/logo-marca.png"
ESTRELLA_PNG = "public/marca/estrella-marca.png"
# Lo que sirve la web (los escribe preparar-fotos-catalogo.py)
PUBLICO = {
    "tu-logo-aqui": "public/marca/tu-logo-aqui.png",
    # fase 4.4: el logo y la estrella en WebP con alfa (calidad 95): 467 KB y 765 KB en PNG eran demasiado para
    # descargarlos en cada tarjeta y ficha
    "marca-logo": "public/marca/logo-marca-catalogo.webp",
    "marca-estrella": "public/marca/estrella-marca-catalogo.webp",
}
ANCHO_LOGO_PUBLICO = 1400  # px: sobra para los 8 cm del corazón incluso al 200 % en una pantalla 2×

FUERZA_SOMBRA = 0.9  # cuánto sigue el diseño la luz de la tela (igual que el visor del estudio)
UMBRAL_DISENO_BLANCO = 135  # luminancia sRGB media bajo el diseño por debajo de la cual se usa la versión blanca (fase 4.4: 135, el mismo que lib/diseno-ejemplo.ts; antes 118)


def cargar_tu_logo_aqui():
    """(negro, blanco) RGBA a 1024 px, recortados al dibujo: el papel pasa a transparente."""
    im = Image.open(TU_LOGO_AQUI).convert("L")
    oscuridad = 255.0 - np.asarray(im).astype(np.float64)
    oscuridad = np.clip((oscuridad - 8.0) * 255.0 / (255.0 - 8.0), 0, 255).astype(np.uint8)
    ys, xs = np.where(oscuridad > 20)
    y0, y1, x0, x1 = ys.min(), ys.max() + 1, xs.min(), xs.max() + 1
    alfa = oscuridad[y0:y1, x0:x1]
    negro = np.zeros((*alfa.shape, 4), dtype=np.uint8)
    negro[..., 3] = alfa
    blanco = negro.copy()
    blanco[..., :3] = 255
    return Image.fromarray(negro, "RGBA"), Image.fromarray(blanco, "RGBA")


def recortar_estrella_de(logo):
    """La estrella es el bloque opaco de la izquierda del logo, separado del texto por un hueco."""
    alfa = np.asarray(logo)[..., 3]
    columnas = (alfa > 10).any(axis=0)
    inicio = int(np.argmax(columnas))
    fin = inicio
    vacias = 0
    while fin < len(columnas):
        if columnas[fin]:
            vacias = 0
        else:
            vacias += 1
            if vacias >= max(4, logo.width // 130):
                fin -= vacias - 1
                break
        fin += 1
    ys, xs = np.where(alfa[:, inicio:fin] > 10)
    return logo.crop((inicio + int(xs.min()), int(ys.min()), inicio + int(xs.max()) + 1, int(ys.max()) + 1))


def cargar_marca():
    """{'tu-logo-aqui': (negro, blanco), 'marca-logo': logo, 'marca-estrella': estrella} como RGBA."""
    marca = {"tu-logo-aqui": cargar_tu_logo_aqui()}
    if os.path.exists(LOGO_PDF):
        logo = Image.open(LOGO_PDF).convert("RGBA")
        alfa = np.asarray(logo)[..., 3]
        ys, xs = np.where(alfa > 10)
        logo = logo.crop((int(xs.min()), int(ys.min()), int(xs.max()) + 1, int(ys.max()) + 1))
        marca["origen"] = "catálogo PDF"
    else:
        logo = Image.open(LOGO_PNG).convert("RGBA")
        marca["origen"] = "public/marca/logo-marca.png"
    marca["marca-logo"] = logo
    if os.path.exists(ESTRELLA_PDF):
        estrella = Image.open(ESTRELLA_PDF).convert("RGBA")
        alfa = np.asarray(estrella)[..., 3]
        ys, xs = np.where(alfa > 10)
        estrella = estrella.crop((int(xs.min()), int(ys.min()), int(xs.max()) + 1, int(ys.max()) + 1))
    else:
        estrella = recortar_estrella_de(logo)
    marca["marca-estrella"] = estrella
    return marca


def escribir_publicos(marca):
    """Los archivos que usa el navegador para dibujar el diseño de ejemplo."""
    os.makedirs("public/marca", exist_ok=True)
    negro, _ = marca["tu-logo-aqui"]
    negro.save(PUBLICO["tu-logo-aqui"], optimize=True)
    logo = marca["marca-logo"]
    if logo.width > ANCHO_LOGO_PUBLICO:
        logo = logo.resize((ANCHO_LOGO_PUBLICO, round(logo.height * ANCHO_LOGO_PUBLICO / logo.width)), Image.LANCZOS)
    logo.save(PUBLICO["marca-logo"], quality=95, method=6, exact=False)
    marca["marca-estrella"].save(PUBLICO["marca-estrella"], quality=95, method=6, exact=False)
    return {k: (Image.open(v).size, os.path.getsize(v)) for k, v in PUBLICO.items()}


def reducir_con_calidad(capa, ancho, alto):
    """Reduce por pasos (mitades) hasta el tamaño pedido: los trazos finos no se pierden al bajar mucho de golpe."""
    while capa.width > 2 * ancho and capa.height > 2 * alto:
        capa = capa.resize((capa.width // 2, capa.height // 2), Image.LANCZOS)
    return capa.resize((max(1, ancho), max(1, alto)), Image.LANCZOS)


def version_diseno(foto_rgb, mascara, x, y, radio):
    """'blanco' si la tela bajo el diseño es oscura; si no, 'negro' (solo cuenta para «Tu logo aquí»)."""
    a = np.asarray(foto_rgb)
    y0, y1, x0, x1 = max(0, y - radio), min(a.shape[0], y + radio), max(0, x - radio), min(a.shape[1], x + radio)
    zona = a[y0:y1, x0:x1]
    m = mascara[y0:y1, x0:x1] if mascara is not None else np.ones(zona.shape[:2], dtype=bool)
    lum = 0.299 * zona[..., 0] + 0.587 * zona[..., 1] + 0.114 * zona[..., 2]
    media = float(lum[m].mean()) if m.any() else float(lum.mean())
    return "blanco" if media < UMBRAL_DISENO_BLANCO else "negro"


def componer_diseno(foto_rgb, marca, colocacion, mascara=None, escala=1.0, capucha=None):
    """Dibuja el diseño de ejemplo sobre la foto (PIL RGB) tal como lo dibuja el navegador: centrado en (x, y) de la
    foto original con `ancho` px, girado `giro` grados, multiplicado por la luz relativa de la tela. `escala` es la
    relación entre la imagen dada y la foto original (hojas a otro tamaño). Con `capucha` (polígono en px de la foto
    original), la foto vuelve a cubrir esa zona: el diseño queda por debajo. Devuelve (imagen, versión)."""
    x, y, ancho, giro = colocacion["x"], colocacion["y"], colocacion["ancho"], colocacion.get("giro", 0)
    clave = colocacion["marca"]
    # tela oscura bajo el diseño: solo «Tu logo aquí» pasa a blanco; el logo y la estrella de [MARCA] van siempre
    # con sus colores de marca (corrección de la fase 4.6), igual que hace el navegador (lib/diseno-ejemplo.ts)
    if clave == "tu-logo-aqui":
        oscura = version_diseno(foto_rgb, mascara, round(x * escala), round(y * escala), max(8, round(ancho * escala / 2))) == "blanco"
        version = "blanco" if oscura else "negro"
        capa = marca["tu-logo-aqui"][1 if oscura else 0]
    else:
        version = "marca"
        capa = marca[clave]
    w = max(1, round(ancho * escala))
    h = max(1, round(w * capa.height / capa.width))
    capa = reducir_con_calidad(capa, w, h)
    if giro:
        capa = capa.rotate(giro, resample=Image.BICUBIC, expand=True)
    a = np.asarray(foto_rgb).astype(np.float32)
    lum = 0.299 * a[..., 0] + 0.587 * a[..., 1] + 0.114 * a[..., 2]
    lum = ndimage.gaussian_filter(lum, 1.5 * escala)
    cx, cy = x * escala, y * escala
    x0, y0 = round(cx - capa.width / 2), round(cy - capa.height / 2)
    cw, ch = capa.width, capa.height
    # recorte a la imagen
    sx0, sy0 = max(0, -x0), max(0, -y0)
    sx1, sy1 = min(cw, a.shape[1] - x0), min(ch, a.shape[0] - y0)
    if sx1 <= sx0 or sy1 <= sy0:
        return foto_rgb, version
    md = np.asarray(capa).astype(np.float32)[sy0:sy1, sx0:sx1]
    rgb, alfa = md[..., :3], md[..., 3:4] / 255.0
    zona = lum[y0 + sy0 : y0 + sy1, x0 + sx0 : x0 + sx1]
    opaco = alfa[..., 0] > 0.03
    media = max(8.0, float(zona[opaco].mean())) if opaco.any() else 128.0
    factor = np.clip(1 + (zona / media - 1) * FUERZA_SOMBRA, 0.45, 1.3)[..., None]
    rgb = np.clip(rgb * factor, 0, 255)
    fondo = a[y0 + sy0 : y0 + sy1, x0 + sx0 : x0 + sx1]
    salida = a.copy()
    salida[y0 + sy0 : y0 + sy1, x0 + sx0 : x0 + sx1] = fondo * (1 - alfa) + rgb * alfa
    if capucha is not None:
        from PIL import ImageDraw

        im = Image.new("L", (a.shape[1], a.shape[0]), 0)
        ImageDraw.Draw(im).polygon([(px * escala, py * escala) for px, py in capucha], fill=255)
        peso = ndimage.gaussian_filter(np.asarray(im).astype(np.float32) / 255.0, 1.0 * escala)[..., None]
        salida = a * peso + salida * (1 - peso)
    return Image.fromarray(salida.clip(0, 255).astype(np.uint8)), version
