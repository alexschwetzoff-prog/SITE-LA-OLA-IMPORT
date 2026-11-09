"""Fotos de catálogo de los 28 productos sin estudio (fase 4.4: fotos hd a dos tamaños; fases 4.1 a 4.3 debajo).

Para cada producto:
  1. Foto real de cada color (fase 4.3): docs/fotos-proveedor/lista-descargas.csv dice qué archivo corresponde a
     cada color y vista (delante / detrás). Fase 4.4: se toma la foto «hd» del proveedor (2000 px, en
     assets/productos/originales-proveedor-hd/, carpeta ignorada por git) y, si no existe o es menor, la «large»
     de 600 px (scripts/fotos/fuentes.py). Cada foto se reduce a 1200 px de ancho (nunca se amplía: las que el
     proveedor solo tiene a 460 px se publican a 460 px) y se publica en dos tamaños, 1200 y 800 px, desde el mismo
     original (una sola compresión, WebP de alta calidad). La foto base de cada producto (su color predeterminado)
     es ahora la hd de ese color; la del equipo (assets/productos/) sigue siendo la referencia donde se midió la
     geometría a mano (uniones de visera, capuchas, zonas de marcaje), que se lleva a la base hd caja → caja.
  2. Etiqueta del fabricante: se detecta y retoca foto a foto en la zona del cuello (scripts/fotos/etiquetas.py);
     la de la manga de Imola es un rectángulo fijo clonado de la tela vecina. Nada más de la prenda cambia: la foto
     publicada tiene la misma luz, el mismo contraste y los mismos pliegues que el original. Las fotos limpias del
     color predeterminado se guardan además, a 600 px, en public/productos/<slug>-delante.jpg y -detras.jpg
     (miniaturas y reserva). Fred y Mercury se reencuadran (fase 4.2) con la misma transformación en todos sus
     colores, para que la gorra ocupe en la foto la misma proporción que en la de Freya.
  3. Encuadre: la caja del objeto de cada foto se compara con la de la foto base. Si coincide (±1 px por cada 600),
     vale la misma geometría; si no, la geometría de la base se lleva a la foto con la transformación caja → caja y
     la calibración se repite sobre la propia foto.
  4. Calibración en píxeles por cm con la ficha técnica (fase 4.1), foto a foto:
     - prendas: largo B de la talla M (del punto más alto del hombro al bajo) medido sobre la silueta;
     - fase 4.4, prendas con `ancho_cm` (Shura): además la anchura A de la ficha (1 cm bajo la sisa) medida sobre la
       silueta da la escala horizontal, que es la que manda en el ancho del diseño: en esa foto la prenda sale
       mucho más estirada a lo alto que a lo ancho y el largo daba un diseño demasiado grande;
     - gorras: la corona mide 58 cm de contorno, así que su anchura de frente se toma como 58/π cm;
     - bolsas: la anchura de la bolsa (36 cm en Crest, 37 cm en Zenith).
  5. Colores sin foto real (hoy, Tarek Plateado y Marino): se recolorea la base con recolor.py (fase 4.2) solo si
     el resultado pasa la revisión a ojo (SIN_RECOLOREAR lista los que no); si no, el color se enseña con nombre y
     la foto del color predeterminado. Los goodies que ya traen el diseño en su foto (Davos, Uldon, Roldi, Zora,
     Luxor) siguen con la foto del equipo (1024 px).
  6. El diseño «Tu logo aquí» no se incrusta: se guarda su colocación (centro, ancho y giro en px de la foto grande,
     la capucha que lo tapa por detrás y el tamaño de la foto) y el navegador lo dibuja (FotoProducto.tsx).
  7. Escribe data/fotos-catalogo.json (conserva Atomic 150 y Austral, de preparar-fotos-catalogo.py) con `anchos`
     por lado (los tamaños publicados), una hoja de contactos por producto en docs/revision-colores/, las hojas de
     cuellos en docs/revision-colores/etiquetas/ y el detalle de cada foto en docs/fotos-proveedor/proceso.csv.

Uso: python -I -X utf8 scripts/fotos/preparar-fotos-productos.py [--sin-hojas] [--ancho 1200] [solo-slug ...]
     python -I -X utf8 scripts/fotos/preparar-fotos-productos.py --solo-hojas [solo-slug ...]   (solo redibuja las hojas)
Requisitos: Pillow, numpy y scipy.
"""
import csv
import json
import math
import os
import re
import sys
import unicodedata

import numpy as np
from PIL import Image, ImageDraw, ImageFilter

sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))
import diseno as D  # noqa: E402
import etiquetas as E  # noqa: E402
import fuentes as F  # noqa: E402
import recolor as R  # noqa: E402
from geometria import Transformacion, caja, escala_uniforme, mapa_cajas, normalizacion  # noqa: E402
from scipy import ndimage  # noqa: E402

SALIDA = "public/productos/catalogo"
INDICE = "data/fotos-catalogo.json"
HOJAS = "docs/revision-colores"
HOJAS_ETIQUETAS = os.path.join(HOJAS, "etiquetas")
PROCESO = "docs/fotos-proveedor/proceso.csv"
TORSO = (0.33, 0.42, 0.67, 0.93)  # ventana de referencia de la luminancia (fracciones x0, y0, x1, y1)
LADO_HOJA = 560  # px: lo que mide la foto de la ficha en escritorio
ANCHO_LIMPIA = 600  # px de las fotos limpias de reserva (public/productos/<slug>-<lado>.jpg)

# Colocación del diseño en cm (fase 4.1): sale de las anclas del estudio (data/siluetas/camiseta-unisex.json, talla M
# de 71 cm) medidas desde el punto más alto del hombro (HPS), para que valgan en prendas de otro largo.
ANCHO_CORAZON_CM = 8.0
ANCHO_ESPALDA_CM = 20.0
CORAZON_CM = (9.0, 17.0)  # (lateral hacia la izquierda del que la lleva, por debajo del HPS)
CENTRO_PECHO_CM = (0.0, 17.0)
ESPALDA_CM = (0.0, 22.0)
ANCHO_GORRA_CM = 6.0
CORONA_CM = 58.0 / math.pi
CORONA_FREYA_PX = 432  # anchura de la corona en la foto de Freya de 600 px: el encuadre de referencia de las gorras
CENTRO_FREYA_PX = (303, 325)  # corona centrada en x = 303 y gorra (sin sombra) entre y = 132 y 519 (foto de 600 px)
# Fase 10: el reencuadre de las gorras y la normalización del encuadre se renderizan desde el original (2000 px), así
# que pueden ampliar respecto a la foto publicada (Fred ×1,22, el ajuste exacto a Freya) sin ampliar nunca el original:
# el tope es la resolución del archivo (ancho original / ancho publicado). Para las fotos de 600 px, 1,0.
# Fotos que no se normalizan (otra toma del proveedor que no se puede llevar al encuadre de la base sin cortarla).
SIN_NORMALIZAR = {
    ("andre", "Rojo", "detras"),  # toma mucho más cerrada, con los tirantes fuera del encuadre
}
# Fotos cuya prenda sale más ancha que en la base (otra toma del proveedor): tras normalizar la altura, se escala
# en horizontal alrededor del centro para que la caja de la prenda tenga la anchura de la base (fase 10b).
ANCHURA_A_LA_BASE = {
    ("jamaica", "Gris vigoré", "delante"),  # un 6 % más ancha que los demás colores
}
# Umbrales de la normalización (px de la foto publicada): por debajo, el encuadre se deja tal cual.
NORMALIZAR_ESCALA = 0.008
NORMALIZAR_PX = 2.0
ANCHO_BOLSA_CM = 22.0
MARGEN_PLACA = 0.85

# Colores sin foto real cuyo recoloreado no pasa la revisión a ojo: se enseñan con la foto del color predeterminado.
SIN_RECOLOREAR = {}

# Por producto: foto base (delante) y trasera, color de cada una, tipo, calibración, retoques, zonas y diseño.
# Las coordenadas son px de la foto base del equipo (600 px); se llevan a la base hd y a cada foto caja → caja.
P = {
    "bull": dict(origen="Camiseta BULL.jpg", detras="BULL (back).jpg", color_foto="Blanco", fondo="conectado", largo_cm=76, diseno="corazon"),
    "cobain": dict(origen="Polo COBAIN.jpg", detras="COBAIN (back).jpg", color_foto="Verde salvia", largo_cm=72, diseno="corazon"),
    # fase 10b: Royal es el color predeterminado (base de la geometría y del encuadre) y la etiqueta se rellena
    # continuando la costura del cuello (fuente «costura» de etiquetas.py)
    "jamaica": dict(origen="Mujer economica JAMAICA.jpg", detras="JAMAICA (back).jpg", color_foto="Royal", jaspeado=True, etiqueta_zona=(250, 5, 350, 110), etiqueta_fuente="costura", largo_cm=64, diseno="corazon"),
    "pointer": dict(origen="Camiseta POINTER.jpg", detras="POINTER (back).jpg", color_foto="Rojo", etiqueta_zona=(262, 5, 338, 62), largo_cm=72, diseno="corazon"),
    "bahrain": dict(origen="Deportiva economica BAHRAIN.jpg", detras="BAHRAIN (back).jpg", color_foto="Gris", etiqueta_zona=(268, 8, 338, 82), largo_cm=71, diseno="corazon"),
    "imola": dict(
        origen="Deportivo ecologico IMOL.jpg",
        detras="IMOLA (back).jpg",
        color_foto="Amarillo",
        etiqueta_zona=(268, 5, 338, 76),
        etiqueta_minima=(290, 15, 317, 52),  # el borde superior de la etiqueta blanca no se distingue de la tela blanca: rectángulo medido a mano (fase 4)
        etiquetas=[("clonar", (536, 196, 550, 214), (-16, 0))],  # la etiqueta de la manga: tela vecina clonada
        largo_cm=71,
        diseno="corazon",
    ),
    "andre": dict(origen="Camiseta tirantes ANDRE.jpg", detras="ANDRE (back).jpg", color_foto="Naranja flúor", etiqueta_zona=(262, 55, 338, 150), etiqueta_fuente="espejo-arriba", largo_cm=71, hps="cima", diseno="centro_pecho"),
    # Shura (fase 4.4): la escala horizontal sale de la anchura A de la ficha (40 cm en la talla M), no del largo
    # Shura (fase 10): el diseño de la espalda va más abajo (26 cm bajo el HPS) y más pequeño (14 cm): la espalda de la
    # camiseta de tirantes es estrecha entre los tirantes y el de 20 cm a 22 cm quedaba pegado al escote
    "shura": dict(origen="Tirantes mujer SHURA.jpg", detras="SHURA (back).jpg", color_foto="Fucsia", etiqueta_zona=(258, 15, 342, 108), largo_cm=64, ancho_cm=40, hps="cima", diseno="centro_pecho", espalda_cm=(0.0, 26.0), ancho_espalda_cm=14.0),
    "clasica": dict(origen="Sudadera CLASICA.jpg", detras="CLASICA (back).jpg", color_foto="Ciruela", etiqueta_zona=(262, 5, 332, 58), largo_cm=69, diseno="corazon"),
    "urban": dict(
        origen="Sudadera capucha URBAN.jpg",
        detras="URBAN (back).jpg",
        color_foto="Verde oliva",
        largo_cm=69,
        hps="capucha",
        diseno="corazon",
        secundaria=[(195, 2), (405, 2), (401, 36), (330, 47), (300, 52), (270, 47), (199, 36)],  # forro visible de la capucha (delante)
        capucha=[(175, 0), (175, 50), (187, 50), (195, 75), (207, 100), (224, 125), (245, 150), (270, 175), (287, 185), (300, 193), (313, 185), (330, 175), (355, 150), (370, 125), (382, 100), (396, 75), (410, 50), (425, 50), (425, 0)],
    ),
    "montblanc": dict(
        origen="Sudadera cremallera MONTBLANC.jpg",
        detras="MONTBLANC (back).jpg",
        color_foto="Gris vigoré",
        jaspeado=True,
        forro_claro=True,
        largo_cm=69,
        hps="capucha",
        diseno="corazon",
        capucha=[(195, 0), (195, 60), (210, 75), (232, 100), (257, 125), (275, 140), (300, 152), (325, 140), (345, 125), (367, 100), (390, 75), (405, 60), (405, 0)],
    ),
    "otto": dict(
        origen="Sudadera OTTO.jpg",
        detras="OTTO (back).jpg",
        color_foto="Azul denim",
        largo_cm=69,
        hps="capucha",
        diseno="corazon",
        capucha=[(190, 0), (190, 70), (200, 75), (222, 100), (242, 125), (262, 150), (285, 175), (300, 190), (315, 175), (337, 150), (357, 125), (377, 100), (397, 75), (410, 70), (410, 0)],
    ),
    "estambul-woman": dict(origen="Chaqueta cremallera mujer ESTAMBUL WOMAN.jpg", detras="ESTAMBUL WOMAN (back).jpg", color_foto="Azul denim", largo_cm=64, diseno="corazon"),
    "valier": dict(origen="Chaqueta con cremallera VALIER.jpg", detras="VALIER (back).jpg", color_foto="Negro", largo_cm=71, diseno="corazon"),
    # Gorras (fase 4.2): máscara por zonas dibujadas sobre la foto base. `union_visera` es la polilínea donde la corona
    # se une a la visera (por encima, corona; por debajo, visera, con su cara inferior); `boton`, el botón superior.
    "freya": dict(
        origen="Gorra FREYA.jpg",
        color_foto="Blanco",
        tipo="gorra",
        umbral=254.5,  # gorra blanca sobre blanco: solo el blanco puro es fondo
        fondo="borde",
        rellenar_huecos=True,  # los brillos clipados de la corona
        cerrar_corona=(380, 10),  # por encima de y=380, cierre de radio 10: muescas de brillo en el contorno
        # el borde delantero de la visera (arco oscuro medido sobre la foto a 3×): todo lo que queda por debajo (el
        # suelo, su penumbra y la sombra) sale de la máscara
        sombra_bajo=[(0, 458), (100, 458), (108, 458), (120, 452), (135, 446), (150, 442), (170, 438), (200, 436), (230, 433), (260, 432), (300, 432), (340, 434), (370, 438), (400, 446), (420, 455), (440, 467), (455, 478), (465, 486), (472, 491), (478, 492), (485, 486), (492, 472), (497, 458), (502, 447), (510, 444), (520, 441), (599, 440)],
        ventana=(0.35, 0.3, 0.65, 0.52),
        visera_y=380,
        union_visera=[(60, 326), (95, 332), (140, 342), (190, 348), (240, 350), (300, 345), (360, 345), (420, 352), (470, 368), (505, 392), (530, 425), (599, 440)],
        boton=(300, 132, 14),
        # los bicolores (corona blanca, visera de color) vienen de otra sesión de fotos con otro encuadre: su referencia
        bicolor=dict(origen="FREYA (referencia bicolor).jpg", color_foto="Blanco y rojo", visera_y=358, ventana=(0.35, 0.62, 0.65, 0.75)),
    ),
    "fred": dict(
        origen="Gorra FRED.jpg",
        color_foto="Azul acero",
        tipo="gorra",
        ventana=(0.35, 0.3, 0.65, 0.5),
        sombra_clara=[(440, 300, 600, 600), (0, 400, 600, 600)],  # la sombra del suelo: a la derecha y bajo la visera
        sombra_chroma=12,  # la tela azul acero es poco saturada en sus brillos: solo los grises casi puros son sombra
        visera_y=355,
        reencuadrar=True,
        union_visera=[(100, 352), (125, 350), (170, 342), (220, 336), (300, 332), (380, 336), (430, 342), (475, 352), (500, 356)],
        boton=(300, 140, 12),
    ),
    "mercury": dict(
        origen="Gorra MERCURY.jpg",
        color_foto="Negro",
        tipo="gorra",
        ventana=(0.35, 0.25, 0.65, 0.48),
        sombra_clara=[(0, 470, 600, 600)],
        visera_y=395,
        reencuadrar=True,
        union_visera=[(0, 405), (35, 395), (100, 375), (200, 362), (300, 358), (400, 362), (500, 375), (565, 395), (599, 405)],
        boton=(300, 78, 18),
        detras_real=True,  # la trasera (con el cierre) solo existe como foto real del proveedor; sin diseño
    ),
    "crest": dict(origen="Tote Bag CREST.jpg", color_foto="Rojo", tipo="bolsa", ancho_cm=36, ventana=(0.35, 0.5, 0.65, 0.85), diseno=(300, 420), detras_real=True),
    "zenith": dict(origen="Tote Bag Zenith.jpg", color_foto="Natural", tipo="bolsa", ancho_cm=37, ventana=(0.35, 0.5, 0.65, 0.85), diseno=(300, 410), detras_real=True),
    "tarek": dict(origen="Botella TAREK.jpg", color_foto="Amarillo", tipo="goodie", recolorear=True, ventana=(0.42, 0.45, 0.58, 0.75), sombra_clara=[(0, 440, 600, 600)], sombra_lum=60, diseno=(300, 330, 100, 0)),
    "kranston": dict(
        origen="Botella KRANSTON.jpg",
        color_foto="Rojo",
        tipo="goodie",
        recolorear=True,
        ventana=(0.4, 0.4, 0.55, 0.62),
        excluir=[(185, 110, 355, 180, 40)],  # tapa transparente y aro de acero: no se tiñen
        sombra_clara=[(0, 500, 600, 600)],
        sombra_lum=100,
        diseno=(276, 300, 104, 0),
    ),
    "ranic": dict(origen="Libreta RANIC.jpg", color_foto="Natural", tipo="goodie", recolorear=True, ventana=(0.35, 0.3, 0.7, 0.7), sombra_clara=[(0, 0, 600, 600)], excluir=[(50, 80, 128, 550, 25)], diseno=(315, 300, 170, 0)),  # excluir: la espiral metálica
    "karby": dict(origen="Llavero KARBY.jpg", color_foto="Bambú · rectangular", tipo="goodie", diseno="placa"),
    # Goodies con la foto del equipo, que ya trae el diseño (fases 4.1 y 4.2): sin capa de diseño y sin fotos del proveedor.
    "uldon": dict(origen="Usb ULDON.jpg", color_foto="Bambú natural", tipo="goodie", diseno_en_foto=True, foto_equipo=True),
    "roldi": dict(origen="Navaja ROLDI.jpg", color_foto="Bambú natural", tipo="goodie", diseno_en_foto=True, foto_equipo=True),
    "zora": dict(origen="Navaja multi ZORA.jpg", color_foto="Plateado", tipo="goodie", diseno_en_foto=True, foto_equipo=True),
    "luxor": dict(origen="Llaveros LUXOR.jpg", color_foto="Piel reciclada · rectangular", tipo="goodie", diseno_en_foto=True, foto_equipo=True),
    "davos": dict(origen="Boligrafo DAVOS.jpg", color_foto="Bambú natural", tipo="goodie", diseno_en_foto=True, foto_equipo=True),
}


# ---------------------------------------------------------------------------------------------
# Utilidades
# ---------------------------------------------------------------------------------------------
def slug(texto):
    t = unicodedata.normalize("NFD", texto).encode("ascii", "ignore").decode().lower()
    return re.sub(r"[^a-z0-9]+", "-", t).strip("-")


def colores_del_catalogo(slug_producto):
    """[(nombre, hex, hexSecundario | None)] de un producto en data/catalogo.ts."""
    fuente = open("data/catalogo.ts", encoding="utf-8").read()
    ini = fuente.index(f"slug: '{slug_producto}'")
    fin = fuente.find("slug: '", ini + 10)
    bloque = fuente[ini : fin if fin > 0 else None]
    return [(n, h, s or None) for n, h, _, s in re.findall(r"\{ nombre: '([^']+)', hex: '(#[0-9A-Fa-f]{6})'(, hexSecundario: '(#[0-9A-Fa-f]{6})')?", bloque)]


def leer_equipo(nombre, ancho_max=None):
    """Foto del equipo de assets/productos/ (tal cual o reducida al ancho de publicación)."""
    ruta = os.path.join("assets/productos", nombre)
    if ancho_max is None:
        return np.asarray(Image.open(ruta).convert("RGB"))
    return F.leer_foto(ruta, ancho_max)[0]


def escala_de(a):
    """Escala de una foto respecto a las medidas de referencia (600 px) y la fija en recolor.py y etiquetas.py."""
    s = a.shape[1] / F.ANCHO_REFERENCIA
    R.fijar_escala(s)
    E.fijar_escala(s)
    return s


def mascara_poligono(forma, puntos):
    im = Image.new("L", (forma[1], forma[0]), 0)
    ImageDraw.Draw(im).polygon([tuple(p) for p in puntos], fill=255)
    return np.asarray(im) > 127


def bajo_polilinea(forma, puntos):
    """Máscara de lo que queda por debajo (y mayor) de una polilínea."""
    h, w = forma
    xs = np.array([p[0] for p in puntos], dtype=np.float64)
    ys = np.array([p[1] for p in puntos], dtype=np.float64)
    limite = np.interp(np.arange(w), xs, ys, left=ys[0], right=ys[-1])
    return np.arange(h)[:, None] >= limite[None, :]


# ---------------------------------------------------------------------------------------------
# Transformaciones: geometría medida sobre la base, reencuadre de las gorras (fase 4.2) y paso caja → caja (fase 4.3)
# ---------------------------------------------------------------------------------------------
def transformar_cfg(cfg, t):
    """La geometría medida sobre la base (polilíneas, rectángulos, puntos, filas) llevada por `t`."""
    if t.identidad:
        return dict(cfg)
    c = dict(cfg)
    for clave in ("union_visera", "sombra_bajo", "secundaria", "capucha"):
        if clave in c:
            c[clave] = t.puntos(c[clave])
    for clave in ("sombra_clara",):
        if clave in c:
            c[clave] = [t.rect(r) for r in c[clave]]
    if "excluir" in c:
        c["excluir"] = [(*t.rect(r[:4]), r[4]) for r in c["excluir"]]
    if "etiquetas" in c:
        c["etiquetas"] = [(e[0], t.rect(e[1]), (round(e[2][0] * t.sx), round(e[2][1] * t.sy))) if e[0] == "clonar" else (e[0], t.rect(e[1]), *e[2:]) for e in c["etiquetas"]]
    for clave in ("etiqueta_zona", "etiqueta_minima"):
        if clave in c:
            c[clave] = t.rect(c[clave])
    if "boton" in c:
        bx, by = t.punto(c["boton"][:2])
        c["boton"] = (bx, by, c["boton"][2] * t.sx)
    if "visera_y" in c:
        c["visera_y"] = round(c["visera_y"] * t.sy + t.dy)
    if "cerrar_corona" in c:
        c["cerrar_corona"] = (round(c["cerrar_corona"][0] * t.sy + t.dy), max(1, round(c["cerrar_corona"][1] * t.sx)))
    if isinstance(c.get("diseno"), tuple):
        d = c["diseno"]
        x, y = t.punto(d[:2])
        c["diseno"] = (x, y, d[2] * t.sx, d[3]) if len(d) == 4 else (x, y)
    return c


def transformacion_reencuadre(a, cfg, escala_max=1.0):
    """Escala para que la corona mida lo que en la foto de Freya y desplazamiento para dejar la gorra donde la de Freya.
    Fase 10: se calcula foto a foto (cada color tiene su propio encuadre) y la ampliación llega hasta `escala_max`
    (la resolución que sobra en el original respecto a la foto publicada)."""
    s = escala_de(a)
    m = R.mascara_objeto(a, cfg.get("fondo", "todo"), cfg.get("umbral", 251.0))
    if cfg.get("sombra_clara"):
        m = quitar_sombra_clara(m, a, cfg["sombra_clara"], chroma_max=cfg.get("sombra_chroma", 22), lum_min=cfg.get("sombra_lum", 140))
    cal = calibrar(m, cfg, "delante")
    escala = min(CORONA_FREYA_PX * s / cal["anchoCorona"], max(1.0, escala_max))
    ys, xs = np.where(m)
    cx, cy = cal["centroX"], (ys.min() + ys.max()) / 2
    return Transformacion(escala, escala, CENTRO_FREYA_PX[0] * s - cx * escala, CENTRO_FREYA_PX[1] * s - cy * escala)


def reencuadrar(a, t):
    h, w = a.shape[:2]
    im = Image.fromarray(a)
    grande = im.resize((round(w * t.sx), round(h * t.sy)), Image.LANCZOS)
    if t.sx > 1:
        grande = grande.filter(ImageFilter.UnsharpMask(radius=R.sigma(1.0), percent=35, threshold=2))
    lienzo = Image.new("RGB", (w, h), (255, 255, 255))
    lienzo.paste(grande, (round(t.dx), round(t.dy)))
    return np.asarray(lienzo)


def caja_de_referencia(nombre_equipo, cfg):
    """Caja del objeto en la foto del equipo (600 px) donde se midió la geometría de `cfg`."""
    a = leer_equipo(nombre_equipo)
    escala_de(a)
    return caja(mascara_bruta(a, cfg))


def geometria_para(a_base, nombre_equipo, cfg):
    """`cfg` con su geometría llevada de la foto del equipo (600 px, donde se midió) a la foto base `a_base` (hd
    reducida), caja → caja. Sin foto del equipo (la base es la misma foto), identidad."""
    if not nombre_equipo:
        return dict(cfg), Transformacion()
    caja_600 = caja_de_referencia(nombre_equipo, cfg)
    s = escala_de(a_base)
    provisional = transformar_cfg(cfg, escala_uniforme(F.ANCHO_REFERENCIA, a_base.shape[1]))
    caja_nueva = caja(mascara_bruta(a_base, provisional))
    t = mapa_cajas(caja_600, caja_nueva, tolerancia=0.0 if s != 1 else None)
    return transformar_cfg(cfg, t), t


# ---------------------------------------------------------------------------------------------
# Máscara del objeto y zonas
# ---------------------------------------------------------------------------------------------
def quitar_bajo_polilinea(mascara, puntos):
    return mascara & ~bajo_polilinea(mascara.shape, puntos)


def quitar_sombra_clara(mascara, a, regiones, chroma_max=22, lum_min=140):
    """Quita de la máscara los grises claros sin color (la sombra proyectada en el fondo) dentro de las regiones
    indicadas, para no tocar los brillos del propio objeto."""
    ai = a.astype(np.int16)
    chroma = ai.max(axis=2) - ai.min(axis=2)
    lum = 0.299 * ai[..., 0] + 0.587 * ai[..., 1] + 0.114 * ai[..., 2]
    sombra = (chroma < chroma_max) & (lum > lum_min)
    sombra = ndimage.binary_opening(sombra, iterations=R.px(1))
    zona = np.zeros_like(mascara)
    for x0, y0, x1, y1 in regiones:
        zona[max(0, y0) : y1, max(0, x0) : x1] = True
    return mascara & ~(sombra & zona)


def mascara_bruta(a, cfg):
    """Máscara del objeto antes de quitar sombras: la que define la caja del encuadre (igual en base y en cada foto)."""
    mascara = R.mascara_objeto(a, cfg.get("fondo", "todo"), cfg.get("umbral", 251.0))
    if "cerrar_corona" in cfg:
        y_lim, radio = cfg["cerrar_corona"]
        mascara[:y_lim] = R.cerrar(mascara[:y_lim], max(1, int(radio)))
    if cfg.get("rellenar_huecos"):
        mascara = ndimage.binary_fill_holes(R.cerrar(mascara, R.px(3)))
    return mascara


def preparar_mascara(a, cfg, lado, mascara=None):
    """Máscara binaria del objeto y sus zonas: {'principal', 'secundaria' (forro de la capucha, delante), 'corona',
    'visera', 'boton' (gorras)}. `cfg` ya viene con la geometría en las coordenadas de esta foto."""
    if mascara is None:
        mascara = mascara_bruta(a, cfg)
    if "sombra_bajo" in cfg:
        mascara = quitar_bajo_polilinea(mascara, cfg["sombra_bajo"])
    if cfg.get("sombra_clara"):
        mascara = quitar_sombra_clara(mascara, a, cfg["sombra_clara"], chroma_max=cfg.get("sombra_chroma", 22), lum_min=cfg.get("sombra_lum", 140))
    for x0, y0, x1, y1, chroma_max in cfg.get("excluir", []):
        sub = np.zeros_like(mascara)
        sub[y0:y1, x0:x1] = True
        ai = a.astype(np.int16)
        chroma = ai.max(axis=2) - ai.min(axis=2)
        mascara &= ~(sub & (chroma < chroma_max))
    zonas = {}
    if cfg.get("tipo") == "gorra" and "union_visera" in cfg:
        visera = bajo_polilinea(mascara.shape, cfg["union_visera"]) & mascara
        corona = mascara & ~visera
        boton = np.zeros_like(mascara)
        if "boton" in cfg:
            bx, by, br = cfg["boton"]
            yy, xx = np.mgrid[0 : mascara.shape[0], 0 : mascara.shape[1]]
            boton = ((xx - bx) ** 2 + (yy - by) ** 2 <= br**2) & mascara
        zonas = {"corona": corona & ~boton, "visera": visera, "boton": boton}
    if lado == "delante" and "secundaria" in cfg:
        secundaria = mascara_poligono(mascara.shape, cfg["secundaria"]) & mascara
        zonas = {"principal": mascara & ~secundaria, "secundaria": secundaria}
    elif lado == "delante" and cfg.get("forro_claro"):
        # el forro de la capucha es mucho más claro que la tela: se tiñe con su propia referencia para que salga del
        # color de la prenda y no de un tono pastel (la prenda entera cambia de color, interior incluido)
        lab = R.lineal_a_lab(R.a_lineal(a.astype(np.float64)))
        h = mascara.shape[0]
        filas = np.arange(h)[:, None]
        cuerpo = float(np.median(lab[..., 0][mascara & (filas > 0.3 * h)]))
        forro = mascara & (lab[..., 0] > cuerpo + 12) & (filas < 0.25 * h)
        forro = ndimage.binary_opening(forro, iterations=R.px(2))
        et, n = ndimage.label(forro)
        if n:
            tam = ndimage.sum(forro, et, range(1, n + 1))
            forro = et == (1 + int(np.argmax(tam)))
            forro = ndimage.binary_dilation(forro, iterations=R.px(1)) & mascara
        zonas = {"principal": mascara & ~forro, "secundaria": forro}
    if not zonas:
        zonas = {"principal": mascara}
    return mascara, zonas


# ---------------------------------------------------------------------------------------------
# Etiquetas del fabricante
# ---------------------------------------------------------------------------------------------
def rellenar_clonando(a, bbox, desplazamiento):
    """Copia encima la tela vecina desplazada (dx, dy), con el borde fundido."""
    x0, y0, x1, y1 = bbox
    dx, dy = desplazamiento
    img = a.astype(np.float32)
    parche = img[y0 + dy : y1 + dy, x0 + dx : x1 + dx].copy()
    h, w = parche.shape[:2]
    yy, xx = np.mgrid[0:h, 0:w]
    borde = np.minimum(np.minimum(xx, w - 1 - xx), np.minimum(yy, h - 1 - yy)).astype(np.float32)
    peso = np.clip((borde + 1) / (3.0 * R.ESCALA), 0, 1)[..., None]
    img[y0:y1, x0:x1] = parche * peso + img[y0:y1, x0:x1] * (1 - peso)
    return img.clip(0, 255).astype(np.uint8)


# Fase 10: cajas de etiqueta fijadas a mano (px de la foto publicada, 1200 de ancho) donde la detección falla o se
# desvía: la tela jaspeada de Pointer no da contraste con su etiqueta; en Jamaica Gris la caja detectada se pasaba
# hacia el hombro y en Jamaica Marino se quedaba corta por arriba (quedaba un punto blanco de la etiqueta).
ETIQUETAS_MANUALES = {
    ("pointer", "Gris vigoré", "delante"): (570, 35, 632, 63),
    ("jamaica", "Gris", "delante"): (584, 37, 644, 105),
    ("jamaica", "Marino", "delante"): (584, 37, 644, 105),
}

def caja_manual(a, caja):
    """Una caja fijada a mano (medida sobre la foto publicada de 1200 px) en los px de esta foto."""
    if caja is None:
        return None
    k = a.shape[1] / 1200
    return tuple(int(round(v * k)) for v in caja)


def retocar_etiquetas(a, mascara, cfg, lado, jaspeado=False, metodo=None, manual=None):
    """Etiqueta del cuello detectada en esta foto (solo delante) y rectángulos fijos (la manga de Imola). Fase 10:
    detección con umbral para telas jaspeadas, relleno por clonado de Poisson (etiquetas.py) y, por producto, la
    fuente del clonado preferida (`etiqueta_fuente`)."""
    bbox = None
    if manual is not None and lado == "delante":
        # fase 10: caja fijada a mano (ETIQUETAS_MANUALES), sin detección
        a, bbox = E.quitar(a, mascara, None, metodo=metodo, fuente_preferida=cfg.get("etiqueta_fuente"), manual=caja_manual(a, manual))
    elif lado == "delante" and "etiqueta_zona" in cfg:
        bbox = E.detectar(a, mascara, cfg["etiqueta_zona"], jaspeado=jaspeado)
        if bbox and "etiqueta_minima" in cfg:
            m = cfg["etiqueta_minima"]
            bbox = (min(bbox[0], m[0]), min(bbox[1], m[1]), max(bbox[2], m[2]), max(bbox[3], m[3]))
        if bbox:
            a = E.rellenar(a, bbox, mascara=mascara, metodo=metodo, fuente_preferida=cfg.get("etiqueta_fuente"))
    for et in cfg.get("etiquetas" if lado == "delante" else "etiquetas_detras", []):
        if et[0] == "interpolar":
            a = E.rellenar(a, et[1])
        elif et[0] == "clonar":
            a = rellenar_clonando(a, et[1], et[2])
    return a, bbox


# ---------------------------------------------------------------------------------------------
# Calibración cm → px (fase 4.1)
# ---------------------------------------------------------------------------------------------
def hps_prenda(mascara, modo, estricto=False):
    """(y del punto más alto del hombro, x del centro) medidos en la silueta (véase la fase 4.1). Con `estricto`
    (fotos con una base de referencia), una cima de tirante cortada por el encuadre no vale como medida. Las
    distancias están pensadas para fotos de 600 px y se escalan con el ancho de la máscara."""
    h, w = mascara.shape
    s = w / F.ANCHO_REFERENCIA
    px = lambda v: max(1, int(round(v * s)))  # noqa: E731
    ys, xs = np.where(mascara)
    cx = (xs.min() + xs.max()) / 2
    if modo == "cima":
        if estricto and ys.min() <= px(1):
            raise ValueError("la cima del tirante queda fuera del encuadre")
        return float(ys.min()), cx
    tops = {}
    for x in range(max(0, int(cx) - px(240)), int(cx) - px(20)):
        col = np.where(mascara[:, x])[0]
        if len(col):
            tops[x] = col.min()
    if modo == "capucha":
        empinado = False
        paso = px(6)
        for x in range(int(cx) - px(40), int(cx) - px(240), -1):
            if x not in tops or x + paso not in tops:
                continue
            pendiente = (tops[x] - tops[x + paso]) / float(paso)
            if pendiente > 1.0:
                empinado = True
            elif empinado and pendiente < 0.6:
                return float(np.median([tops[x + d] for d in range(0, paso) if x + d in tops])), cx
        raise ValueError("no se encuentra la unión del hombro con la capucha")
    banda = (int(cx) - px(150), int(cx) - px(90))
    xs_h = [x for x in tops if banda[0] <= x <= banda[1]]
    p = np.polyfit(xs_h, [tops[x] for x in xs_h], 1)
    x_cuello = None
    for x in range(int(cx) - px(90), int(cx) - px(20)):
        if x in tops and (np.polyval(p, x) - tops[x]) > 4 * s:
            x_cuello = x
            break
    if x_cuello is None:
        x_cuello = int(cx) - px(60)
    return float(np.polyval(p, x_cuello)), cx


def ancho_pecho_px(mascara):
    """Anchura máxima de la silueta en su mitad alta (bajo las sisas), en px: la anchura A de la ficha (fase 4.4)."""
    ys = np.where(mascara.any(axis=1))[0]
    y0, y1 = ys.min(), ys.max()
    anchos = []
    for y in range(y0, int(y0 + 0.6 * (y1 - y0))):
        fila = np.where(mascara[y])[0]
        if len(fila):
            anchos.append(fila.max() - fila.min() + 1)
    return float(max(anchos)) if anchos else float(mascara.shape[1])


def calibrar(mascara, cfg, lado, estricto=False):
    """Píxeles por cm de la foto y referencias (centro, HPS, bajo) según el tipo de producto."""
    tipo = cfg.get("tipo", "prenda")
    ys, xs = np.where(mascara)
    if tipo == "prenda":
        y_hps, cx = hps_prenda(mascara, cfg.get("hps", "hombro"), estricto)
        bajo = ys.max() + 0.5
        return dict(pxPorCm=(bajo - y_hps) / cfg["largo_cm"], centroX=cx, hpsY=y_hps, bajoY=bajo, metodo=f"largo {cfg['largo_cm']} cm de la ficha (talla M), HPS {cfg.get('hps', 'hombro')}")
    if tipo == "gorra":
        filas = [(y, np.where(mascara[y])[0]) for y in range(ys.min(), cfg["visera_y"]) if mascara[y].any()]
        y_max, fila = max(filas, key=lambda t: t[1].max() - t[1].min())
        ancho = fila.max() - fila.min()
        cx = (fila.max() + fila.min()) / 2
        return dict(pxPorCm=ancho / CORONA_CM, centroX=cx, topY=float(ys.min()), viseraY=cfg["visera_y"], anchoCorona=int(ancho), metodo=f"corona de {ancho} px = 58/π cm (fila {y_max})")
    if tipo == "bolsa":
        y = int(round(cfg["diseno"][1]))
        fila = np.where(mascara[y])[0]
        ancho = fila.max() - fila.min()
        return dict(pxPorCm=ancho / cfg["ancho_cm"], centroX=(fila.max() + fila.min()) / 2, metodo=f"bolsa de {ancho} px = {cfg['ancho_cm']} cm")
    return None


def calibracion_mapeada(cal_base, cfg, t, mascara):
    """Calibración de una prenda cuyo HPS no se puede medir (queda fuera del encuadre): la de la base llevada por la
    transformación caja → caja en x (la escala horizontal, que no depende del recorte), con el bajo de la propia foto."""
    ys, xs = np.where(mascara)
    bajo = ys.max() + 0.5
    k = cal_base["pxPorCm"] * t.sx
    return dict(pxPorCm=k, centroX=(xs.min() + xs.max()) / 2, hpsY=bajo - cfg["largo_cm"] * k, bajoY=bajo, metodo=f"largo {cfg['largo_cm']} cm de la ficha, escala de la base ×{t.sx:.3f} (cima fuera del encuadre)")


def calibrar_anchura(cal, mascara, cfg):
    """Fase 4.4: en las prendas con `ancho_cm`, la escala horizontal sale de la anchura A de la ficha medida sobre la
    silueta (bajo las sisas). El largo sigue mandando en la escala vertical (posición del diseño)."""
    if not cal or cfg.get("tipo", "prenda") != "prenda" or not cfg.get("ancho_cm"):
        return cal
    ancho = ancho_pecho_px(mascara)
    cal = dict(cal)
    cal["pxPorCmX"] = ancho / cfg["ancho_cm"]
    cal["metodo"] += f" · anchura {ancho:.0f} px = {cfg['ancho_cm']} cm de la ficha (escala horizontal)"
    return cal


def placa_bambu(a):
    """Karby: la placa de bambú por su color; devuelve (centro x, centro y, diámetro del círculo inscrito)."""
    ai = a.astype(np.int16)
    bambu = (ai[..., 0] > 150) & (ai[..., 0] - ai[..., 2] > 40) & (ai[..., 1] - ai[..., 2] > 15)
    bambu = ndimage.binary_opening(bambu, iterations=R.px(2))
    et, n = ndimage.label(bambu)
    tam = ndimage.sum(bambu, et, range(1, n + 1))
    placa = et == (1 + int(np.argmax(tam)))
    ys, xs = np.where(placa)
    cx, cy = xs.mean(), ys.mean()
    cov = np.cov(np.vstack([xs - cx, ys - cy]))
    val, vec = np.linalg.eigh(cov)
    corto = vec[:, 0]
    proy = (xs - cx) * corto[0] + (ys - cy) * corto[1]
    semi_corto = (np.percentile(proy, 99.5) - np.percentile(proy, 0.5)) / 2
    return cx, cy, 2 * semi_corto


def colocacion_diseno(cfg, cal, lado, a):
    """{x, y, ancho, giro, marca, lienzo} del diseño en esta foto (px de la foto), o None si no lleva capa de diseño."""
    tipo = cfg.get("tipo", "prenda")
    if cfg.get("diseno_en_foto") or ("diseno" not in cfg and tipo != "gorra"):
        return None
    if tipo == "gorra" and lado == "detras":
        return None  # las gorras solo se personalizan en el frontal
    if tipo == "prenda":
        if lado == "detras":
            espalda = cfg.get("espalda_cm", ESPALDA_CM)
            lat, bajo_hps, ancho = espalda[0], espalda[1], cfg.get("ancho_espalda_cm", ANCHO_ESPALDA_CM)
        elif cfg["diseno"] == "centro_pecho":
            lat, bajo_hps, ancho = CENTRO_PECHO_CM[0], CENTRO_PECHO_CM[1], ANCHO_CORAZON_CM
        else:
            lat, bajo_hps, ancho = CORAZON_CM[0], CORAZON_CM[1], ANCHO_CORAZON_CM
        signo = 1 if lado == "delante" else -1  # delante, la izquierda del que la lleva queda a la derecha del que mira
        k = cal["pxPorCm"]
        kx = cal.get("pxPorCmX", k)  # fase 4.4: escala horizontal propia (Shura)
        x, y, w, giro = cal["centroX"] + signo * lat * kx, cal["hpsY"] + bajo_hps * k, ancho * kx, 0
    elif tipo == "gorra":
        y = cal["topY"] + 0.52 * (cal["viseraY"] - cal["topY"])
        x, w, giro = cal["centroX"], ANCHO_GORRA_CM * cal["pxPorCm"], 0
    elif tipo == "bolsa":
        x, y = cfg["diseno"]
        w, giro = ANCHO_BOLSA_CM * cal["pxPorCm"], 0
    elif cfg["diseno"] == "placa":
        cx, cy, diametro = placa_bambu(a)
        x, y, w, giro = cx, cy, diametro * MARGEN_PLACA, 0
    else:
        x, y, w, giro = cfg["diseno"]
    return {"x": round(float(x), 1), "y": round(float(y), 1), "ancho": round(float(w), 1), "giro": giro, "marca": "tu-logo-aqui", "lienzo": [int(a.shape[1]), int(a.shape[0])]}


# ---------------------------------------------------------------------------------------------
# Una foto (base o real de un color)
# ---------------------------------------------------------------------------------------------
def preparar_foto(a, cfg, lado, t_re=None, ref=None, fuente=None, normalizar=None, jaspeado=False, manual=None):
    """Prepara una foto (ya al tamaño de publicación): reencuadre (gorras), normalización del encuadre (fase 10),
    caja del objeto y transformación respecto a la base, geometría de la base llevada a esta foto, etiqueta retocada,
    máscara y zonas, calibración y colocación del diseño. `cfg` viene en las coordenadas de la base (hd). `ref` es la
    foto base ya preparada (None cuando esta es la base). `fuente` es la ruta del original: con reencuadre o
    normalización, la foto se vuelve a renderizar desde él (un solo remuestreo). `normalizar(caja, ancho)` devuelve la
    transformación que lleva la caja del objeto a la de la referencia, o None. Devuelve un dict con todo."""
    s = escala_de(a)
    ancho_salida, alto_salida = a.shape[1], a.shape[0]
    t_total = Transformacion()
    encuadre = []
    if t_re is not None:
        t_total = t_re
        a = F.renderizar(fuente, t_total, ancho_salida, alto_salida) if fuente else reencuadrar(a, t_re)
        encuadre.append(f"reencuadre ×{t_re.sx:.3f} ({t_re.dx:+.0f}, {t_re.dy:+.0f})")
    bruta = mascara_bruta(a, cfg)
    cj = caja(bruta)
    if normalizar is not None:
        t_n = normalizar(cj, ancho_salida)
        if t_n is not None and not t_n.identidad:
            t_total = t_total.luego(t_n)
            a = F.renderizar(fuente, t_total, ancho_salida, alto_salida) if fuente else reencuadrar(a, t_n)
            bruta = mascara_bruta(a, cfg)
            cj = caja(bruta)
            encuadre.append(f"normalizado ×{t_n.sx:.3f} ({t_n.dx:+.0f}, {t_n.dy:+.0f})")
    if ref is None:
        # la geometría de la base está medida sobre la foto original, antes del reencuadre
        t = t_total
    else:
        t = ref["t_geometria"].luego(mapa_cajas(ref["caja"], cj)) if ref["t_geometria"] is not None else mapa_cajas(ref["caja"], cj)
    cfg_foto = transformar_cfg(cfg, t)
    relleno = []
    a, etiqueta = retocar_etiquetas(a, bruta, cfg_foto, lado, jaspeado, relleno, manual)
    mascara, zonas = preparar_mascara(a, cfg_foto, lado, bruta)
    try:
        cal = calibrar(mascara, cfg_foto, lado, estricto=ref is not None)
        if ref is not None and ref.get("cal") and cfg.get("tipo", "prenda") == "prenda" and "pxPorCm" in cal:
            esperado = ref["cal"]["pxPorCm"] * mapa_cajas(ref["caja"], cj).sx
            if abs(cal["pxPorCm"] / esperado - 1) > 0.15:
                raise ValueError(f"escala {cal['pxPorCm']:.2f} px/cm muy lejos de la esperada {esperado:.2f}")
    except ValueError as e:
        if ref is None or not ref.get("cal"):
            raise
        cal = calibracion_mapeada(ref["cal"], cfg_foto, mapa_cajas(ref["caja"], cj), mascara)
        cal["aviso"] = str(e)
    cal = calibrar_anchura(cal, mascara, cfg_foto)
    colocacion = colocacion_diseno(cfg_foto, cal, lado, a)
    capucha = cfg_foto.get("capucha") if lado == "detras" else None
    if colocacion and capucha:
        colocacion = {**colocacion, "capucha": [[round(float(x), 1), round(float(y), 1)] for x, y in capucha]}
    desviacion = 0 if ref is None else max(abs(p - q) for p, q in zip(ref["caja"], cj))
    return dict(a=a, bruta=bruta, mascara=mascara, zonas=zonas, cal=cal, colocacion=colocacion, caja=cj, etiqueta=etiqueta, desviacion=desviacion, cfg=cfg_foto, escala=s, t_geometria=(t_total if (ref is None and not t_total.identidad) else None), t_total=t_total, encuadre=" · ".join(encuadre), relleno=" · ".join(relleno))


def recolorear(base, cfg, nombre, hex_color, hex_sec):
    """La foto base teñida al color (fase 4.2), compuesta sobre su fondo."""
    cfg_b, zonas, a = base["cfg"], base["zonas"], base["a"]
    escala_de(a)
    fondo_blanco = not (cfg_b.get("sombra_clara") or cfg_b.get("sombra_bajo"))
    alfa, tela = R.alfa_y_tela(a, base["mascara"], fondo_blanco=fondo_blanco)
    destino = R.destino_lab(hex_color, nombre)
    if "corona" in zonas:
        lista = [
            {"mascara": zonas["corona"], "destino": destino},
            {"mascara": zonas["visera"], "destino": R.destino_lab(hex_sec, nombre) if hex_sec else destino},
            {"mascara": zonas["boton"], "destino": destino},
        ]
    else:
        lista = [{"mascara": zonas["principal"], "destino": destino}]
        if "secundaria" in zonas:
            propia = bool(hex_sec) or bool(cfg_b.get("forro_claro"))
            lista.append({"mascara": zonas["secundaria"], "destino": R.destino_lab(hex_sec, nombre) if hex_sec else destino, "ref": "propia" if propia else "principal"})
    rec = R.recolorear_zonas(tela, alfa, lista, cfg_b.get("ventana", TORSO), cfg_b.get("jaspeado", False))
    return R.componer(a, rec, alfa, fondo_blanco=fondo_blanco)


def guardar_limpia(a, slug_p, lado):
    """Foto limpia de reserva a 600 px (miniaturas del estudio, fallback): desde el array procesado, sin pasar por el WebP."""
    os.makedirs("public/productos", exist_ok=True)
    im = Image.fromarray(a)
    if im.width > ANCHO_LIMPIA:
        im = im.resize((ANCHO_LIMPIA, round(im.height * ANCHO_LIMPIA / im.width)), Image.LANCZOS)
    im.save(f"public/productos/{slug_p}-{lado}.jpg", quality=92, optimize=True, subsampling=0)


# ---------------------------------------------------------------------------------------------
# Hojas de revisión
# ---------------------------------------------------------------------------------------------
def hoja_de_contactos(slug_p, muestras, marca, carpeta):
    """Hoja de contactos del producto: cada color, delante y detrás, al tamaño de la ficha y con el diseño dibujado."""
    os.makedirs(carpeta, exist_ok=True)
    por_fila = 4
    filas = (len(muestras) + por_fila - 1) // por_fila
    T = LADO_HOJA
    hoja = Image.new("RGB", (por_fila * T, filas * (T + 18)), (255, 255, 255))
    d = ImageDraw.Draw(hoja)
    for i, (nombre, im, es_real, colocacion, mascara) in enumerate(muestras):
        cx, cy = (i % por_fila) * T, (i // por_fila) * (T + 18)
        escala = T / im.width
        tile = im.resize((T, round(im.height * escala)), Image.LANCZOS)
        version = ""
        if colocacion:
            m_tile = np.asarray(Image.fromarray(mascara.astype(np.uint8) * 255).resize(tile.size, Image.NEAREST)) > 127
            tile, version = D.componer_diseno(tile, marca, colocacion, m_tile, escala, colocacion.get("capucha"))
        hoja.paste(tile, (cx, cy + 18))
        d.text((cx + 4, cy + 3), f"{nombre}{' · FOTO REAL' if es_real else ''}{' · diseño ' + version if version else ''}", fill=(190, 0, 0))
    hoja.save(os.path.join(carpeta, f"{slug_p}.jpg"), quality=90, optimize=True)


def hoja_de_cuellos(slug_p, recortes, carpeta):
    """Zona del cuello de cada foto delantera, antes y después del retoque, a tamaño de pantalla ×2 (revisión de etiquetas)."""
    if not recortes:
        return
    os.makedirs(carpeta, exist_ok=True)
    w = max(r[1].width for r in recortes)
    h = max(r[1].height for r in recortes)
    # a 600 px se ampliaba ×2; las fotos hd ya traen ese detalle
    E2 = 2 if w < 150 else 1
    w, h = w * E2, h * E2
    por_fila = 4
    filas = (len(recortes) + por_fila - 1) // por_fila
    hoja = Image.new("RGB", (por_fila * (2 * w + 6), filas * (h + 18)), (255, 255, 255))
    d = ImageDraw.Draw(hoja)
    for i, (nombre, antes, despues, bbox) in enumerate(recortes):
        cx, cy = (i % por_fila) * (2 * w + 6), (i // por_fila) * (h + 18)
        hoja.paste(antes.resize((antes.width * E2, antes.height * E2), Image.LANCZOS), (cx, cy + 18))
        hoja.paste(despues.resize((despues.width * E2, despues.height * E2), Image.LANCZOS), (cx + w + 6, cy + 18))
        d.text((cx + 3, cy + 3), f"{nombre} · {'etiqueta ' + str(bbox) if bbox else 'sin etiqueta'}", fill=(190, 0, 0))
    hoja.save(os.path.join(carpeta, f"{slug_p}.jpg"), quality=88, optimize=True)


# ---------------------------------------------------------------------------------------------
# Principal
# ---------------------------------------------------------------------------------------------
def foto_base(slug_p, cfg, lado, reales, color, ancho):
    """La foto base de un lado al tamaño de publicación: la hd del proveedor del color de la base si existe (y no es
    un producto con foto del equipo); si no, la foto del equipo. Devuelve (array, origen, nombre de la foto del equipo
    donde se midió la geometría o None)."""
    nombre_equipo = cfg["origen"] if lado == "delante" else cfg.get("detras")
    ruta = None if cfg.get("foto_equipo") else reales.get((slug_p, color, lado))
    if ruta:
        a, ancho_original = F.leer_foto(ruta, ancho)
        return a, os.path.relpath(ruta).replace("\\", "/"), nombre_equipo, ruta, ancho_original
    if nombre_equipo:
        a = leer_equipo(nombre_equipo, ancho)
        return a, nombre_equipo, nombre_equipo, os.path.join("assets/productos", nombre_equipo), Image.open(os.path.join("assets/productos", nombre_equipo)).width
    return None, None, None, None, None


def procesar(slug_p, cfg, marca, hojas, proveedor, proceso, ancho):
    origen = os.path.join("assets/productos", cfg["origen"])
    if not os.path.exists(origen):
        print(f"{slug_p}: FALTA el original {cfg['origen']} (se deja la entrada vacía)")
        return None
    colores = colores_del_catalogo(slug_p)
    tipo = cfg.get("tipo", "prenda")
    recolorear_ok = cfg.get("recolorear", tipo != "goodie")
    entradas = {nombre: {} for nombre, _, _ in colores}
    muestras, cuellos = [], []
    con_diseno = bool(cfg.get("diseno_en_foto"))
    print(f"{slug_p}:")
    reales = {} if cfg.get("foto_equipo") else {k: v for k, v in proveedor.items() if k[0] == slug_p}
    lados = ["delante"]
    if cfg.get("detras") or (cfg.get("detras_real") and any(k[2] == "detras" for k in reales)):
        lados.append("detras")
    base_delante = None
    cfg_delante = None
    t_re = None

    def jaspeado_de(nombre):
        return bool(re.search(r"vigor|jaspe|mezcla|heather", nombre, re.I))

    def reencuadre_de(a, cfg_base_px, ancho_base, ancho_original):
        """Reencuadre de una gorra medido sobre esta misma foto (fase 10), con la geometría de la base llevada a sus px."""
        if not cfg.get("reencuadrar"):
            return None
        cfg_px = transformar_cfg(cfg_base_px, escala_uniforme(ancho_base, a.shape[1]))
        return transformacion_reencuadre(a, cfg_px, (ancho_original or a.shape[1]) / a.shape[1])

    def normalizador(ref, lado_foto, nombre, ancho_original):
        """Función caja → transformación que lleva el objeto de una foto al encuadre de la base (fase 10): prendas
        por la altura (el proveedor encuadra a la altura), bolsas y traseras de gorras por la anchura; goodies, los
        colores excluidos y las fotos que tendrían que ampliarse por encima del original, tal cual."""
        if ref is None or tipo == "goodie" or (slug_p, nombre, lado_foto) in SIN_NORMALIZAR:
            return None
        modo = "alto" if tipo == "prenda" else "ancho"
        if tipo == "gorra" and lado_foto == "delante":
            return None  # las delanteras de las gorras ya van reencuadradas una a una
        ancho_ref = ref["a"].shape[1]

        def f(cj, ancho_foto):
            k = ancho_foto / ancho_ref
            caja_ref = tuple(v * k for v in ref["caja"])
            t = normalizacion(cj, caja_ref, modo, NORMALIZAR_ESCALA, NORMALIZAR_PX)
            if t.sx * ancho_foto / (ancho_original or ancho_foto) > 1.0001:
                print(f"    {nombre} {lado_foto}: no se normaliza (habría que ampliar ×{t.sx:.3f} por encima del original)")
                return None
            if (slug_p, nombre, lado_foto) in ANCHURA_A_LA_BASE:
                # anchura de la caja a la de la base, escalando en horizontal alrededor del centro de la referencia
                wf, wr = (cj[2] - cj[0] + 1) * t.sx, caja_ref[2] - caja_ref[0] + 1
                kx = wr / max(1.0, wf)
                if abs(kx - 1) > NORMALIZAR_ESCALA:
                    cxr = (caja_ref[0] + caja_ref[2]) / 2
                    t = Transformacion(t.sx * kx, t.sy, (t.dx - cxr) * kx + cxr, t.dy)
                    print(f"    {nombre} {lado_foto}: anchura igualada a la base (×{kx:.3f})")
            return t

        return f
    for lado in lados:
        color_base = cfg["color_foto"] if lado == "delante" else cfg.get("color_detras", cfg["color_foto"])
        a_base, origen_base, nombre_equipo, ruta_base, ancho_original_base = foto_base(slug_p, cfg, lado, reales, color_base, ancho)
        if a_base is None:
            continue
        # la geometría medida en la foto del equipo (600 px) llevada a esta base; sin foto del equipo de este lado
        # (la trasera real de Mercury y las bolsas) vale la de delante, que preparar_foto lleva caja → caja
        if nombre_equipo:
            cfg_lado, t_geo = geometria_para(a_base, nombre_equipo, cfg)
        else:
            cfg_lado, t_geo = cfg_delante, Transformacion()
        if lado == "delante":
            cfg_delante = cfg_lado
            # reencuadre de las gorras (fase 10: medido foto a foto, también en la base)
            t_re = reencuadre_de(a_base, cfg_lado, a_base.shape[1], ancho_original_base)
            base = preparar_foto(a_base, cfg_lado, lado, t_re, None, ruta_base, None, jaspeado_de(color_base), ETIQUETAS_MANUALES.get((slug_p, color_base, lado)))
        else:
            # la trasera de la base: al encuadre de la delantera (anchura en las gorras, altura en las prendas)
            base = preparar_foto(a_base, cfg_lado, lado, None, base_delante, ruta_base, normalizador(base_delante, lado, color_base, ancho_original_base), jaspeado_de(color_base), ETIQUETAS_MANUALES.get((slug_p, color_base, lado)))
        if lado == "delante":
            base_delante = base
        guardar_limpia(base["a"], slug_p, lado)
        # referencia de los bicolores de Freya (otra sesión de fotos): su propia base y geometría
        base_bicolor = None
        if "bicolor" in cfg and lado == "delante":
            cfg_bi = {k: v for k, v in cfg.items() if k != "bicolor"}
            cfg_bi.update({k: v for k, v in cfg["bicolor"].items() if k not in ("origen", "color_foto")})
            ruta_bi = reales.get((slug_p, cfg["bicolor"]["color_foto"], lado))
            a_bi, ancho_original_bi = F.leer_foto(ruta_bi, ancho) if ruta_bi else (leer_equipo(cfg["bicolor"]["origen"], ancho), 600)
            cfg_bi_lado, _ = geometria_para(a_bi, cfg["bicolor"]["origen"], cfg_bi)
            base_bicolor = preparar_foto(a_bi, cfg_bi_lado, lado, reencuadre_de(a_bi, cfg_bi_lado, a_bi.shape[1], ancho_original_bi), None, ruta_bi or os.path.join("assets/productos", cfg["bicolor"]["origen"]), None, False)
            base_bicolor["cfg_base"] = cfg_bi_lado
        for nombre, hex_color, hex_sec in colores:
            ref = base_bicolor if (hex_sec and base_bicolor is not None) else base
            cfg_ref = ref.get("cfg_base", cfg_lado)
            es_base = nombre == (cfg["bicolor"]["color_foto"] if ref is base_bicolor else color_base)
            ruta_real = reales.get((slug_p, nombre, lado))
            origen_foto = ""
            ancho_original = ""
            if ruta_real and not es_base:
                a_real, ancho_original = F.leer_foto(ruta_real, ancho)
                t_re_foto = reencuadre_de(a_real, cfg_ref, ref["a"].shape[1], ancho_original) if lado == "delante" else None
                foto = preparar_foto(a_real, cfg_ref, lado, t_re_foto, ref, ruta_real, normalizador(ref if lado == "delante" else base_delante, lado, nombre, ancho_original), jaspeado_de(nombre), ETIQUETAS_MANUALES.get((slug_p, nombre, lado)))
                es_real = True
                origen_foto = os.path.relpath(ruta_real).replace("\\", "/")
            elif es_base:
                foto, es_real, origen_foto = ref, True, origen_base if ref is base else (reales.get((slug_p, nombre, lado)) or cfg["bicolor"]["origen"])
                if isinstance(origen_foto, str) and os.path.exists(origen_foto):
                    ancho_original = Image.open(origen_foto).width
            elif recolorear_ok and nombre not in SIN_RECOLOREAR.get(slug_p, ()):
                foto = dict(ref, a=recolorear(ref, cfg_ref, nombre, hex_color, hex_sec))
                es_real = False
                origen_foto = f"recoloreado desde {origen_base}"
            else:
                foto, es_real, origen_foto = ref, False, f"sin foto: se enseña {color_base}"
            propia = es_real or (origen_foto.startswith("recoloreado"))
            color_archivo = nombre if propia else (cfg["bicolor"]["color_foto"] if ref is base_bicolor else color_base)
            destino = f"{SALIDA}/{slug_p}-{slug(color_archivo)}-{lado}.webp"
            anchos = F.anchos_de(int(foto["a"].shape[1]))
            if propia:
                R.guardar_webp_tamanos(foto["a"], destino, anchos)
            entradas[nombre][lado] = "/" + destino.replace("public/", "", 1)
            entradas[nombre]["real" if lado == "delante" else "realDetras"] = es_real
            entradas[nombre]["anchos" if lado == "delante" else "anchosDetras"] = anchos
            colocacion = foto["colocacion"]
            if colocacion:
                entradas[nombre]["diseno" if lado == "delante" else "disenoDetras"] = colocacion
                con_diseno = True
            muestras.append((f"{nombre} · {lado}", Image.open(destino).convert("RGB"), es_real, colocacion, foto["mascara"]))
            if lado == "delante" and "etiqueta_zona" in foto["cfg"] and ruta_real:
                z = foto["cfg"]["etiqueta_zona"]
                m15, m5 = round(15 * foto["escala"]), round(5 * foto["escala"])
                z = (max(0, z[0] - m15), max(0, z[1] - m5), z[2] + m15, z[3] + m5)
                antes = Image.fromarray(F.renderizar(ruta_real, foto["t_total"], foto["a"].shape[1], foto["a"].shape[0]) if not foto["t_total"].identidad else F.leer_foto(ruta_real, ancho)[0])
                cuellos.append((nombre, antes.crop(z), Image.fromarray(foto["a"]).crop(z), foto["etiqueta"]))
            cal = foto["cal"]
            proceso.append(
                {
                    "producto": slug_p,
                    "color": nombre,
                    "lado": lado,
                    "origen": origen_foto,
                    "ancho_original": ancho_original,
                    "ancho": foto["a"].shape[1],
                    "alto": foto["a"].shape[0],
                    "anchos_publicados": " ".join(str(x) for x in anchos),
                    "foto_real": "sí" if es_real else "no",
                    "desviacion_encuadre_px": foto["desviacion"] if ruta_real else "",
                    "etiqueta": str(foto["etiqueta"]) if foto["etiqueta"] else "",
                    "px_por_cm": f"{cal['pxPorCm']:.2f}" if cal else "",
                    "px_por_cm_x": f"{cal['pxPorCmX']:.2f}" if cal and "pxPorCmX" in cal else "",
                    "calibracion": (cal.get("metodo", "") + (f" · AVISO: {cal['aviso']}" if cal.get("aviso") else "")) if cal else "zona de marcaje medida en la foto",
                    "diseno": f"({colocacion['x']:.0f}, {colocacion['y']:.0f}) {colocacion['ancho']:.0f} px" if colocacion else "",
                    "encuadre": foto.get("encuadre", ""),
                    "relleno": foto.get("relleno", ""),
                }
            )
        n_reales = sum(1 for n, _, _ in colores if entradas[n].get("real" if lado == "delante" else "realDetras"))
        detalle = f"{base['cal']['metodo']}: {base['cal']['pxPorCm']:.2f} px/cm" if base["cal"] else "sin calibración (zona de marcaje medida en la foto)"
        print(f"  {lado}: base {color_base} ({base['a'].shape[1]} px, {origen_base}) · geometría {t_geo} · {detalle} · {n_reales}/{len(colores)} fotos reales")
    for entrada in entradas.values():
        entrada["ejemplo"] = "tu-logo-aqui" if con_diseno else None
    if hojas:
        hoja_de_contactos(slug_p, muestras, marca, HOJAS)
        hoja_de_cuellos(slug_p, cuellos, HOJAS_ETIQUETAS)
    return entradas


def solo_hojas(solo, marca):
    """Vuelve a dibujar las hojas de contactos desde las fotos publicadas y el índice, sin reprocesar nada (por ejemplo,
    tras cambiar el umbral de la versión blanca del diseño)."""
    indice = json.load(open(INDICE, encoding="utf-8"))
    for slug_p, cfg in P.items():
        if (solo and slug_p not in solo) or slug_p not in indice:
            continue
        muestras = []
        for nombre, e in indice[slug_p].items():
            for lado, clave_diseno, clave_real in (("delante", "diseno", "real"), ("detras", "disenoDetras", "realDetras")):
                if not e.get(lado):
                    continue
                im = Image.open("public" + e[lado]).convert("RGB")
                a = np.asarray(im)
                escala_de(a)
                mascara = mascara_bruta(a, transformar_cfg(cfg, escala_uniforme(F.ANCHO_REFERENCIA, a.shape[1])))
                muestras.append((f"{nombre} · {lado}", im, bool(e.get(clave_real)), e.get(clave_diseno), mascara))
        hoja_de_contactos(slug_p, muestras, marca, HOJAS)
        print(f"{slug_p}: hoja de contactos ({len(muestras)} fotos)")


def main():
    args = [x for x in sys.argv[1:]]
    hojas = "--sin-hojas" not in args
    args = [x for x in args if x != "--sin-hojas"]
    if "--solo-hojas" in args:
        args.remove("--solo-hojas")
        solo_hojas(set(args), D.cargar_marca())
        return
    ancho = F.ANCHO_PUBLICADO
    if "--ancho" in args:
        i = args.index("--ancho")
        ancho = int(args[i + 1])
        del args[i : i + 2]
    solo = set(args)
    os.makedirs(SALIDA, exist_ok=True)
    marca = D.cargar_marca()
    proveedor = F.fotos_del_proveedor()
    n_hd = sum(1 for r in proveedor.values() if r.startswith(F.ORIGINALES_PROVEEDOR_HD))
    print(f"diseño «Tu logo aquí»: {marca['tu-logo-aqui'][0].width} × {marca['tu-logo-aqui'][0].height} px útiles · {len(proveedor)} fotos reales del proveedor ({n_hd} hd) · publicación a {ancho} px")
    indice = json.load(open(INDICE, encoding="utf-8")) if os.path.exists(INDICE) else {}
    proceso_previo = []
    if os.path.exists(PROCESO):
        proceso_previo = [r for r in csv.DictReader(open(PROCESO, encoding="utf-8")) if solo and r["producto"] not in solo]
    proceso = list(proceso_previo)
    for slug_p, cfg in P.items():
        if solo and slug_p not in solo:
            continue
        entradas = procesar(slug_p, cfg, marca, hojas, proveedor, proceso, ancho)
        if entradas is None:
            indice.pop(slug_p, None)
        else:
            indice[slug_p] = entradas
    with open(INDICE, "w", encoding="utf-8", newline="\n") as f:
        json.dump(indice, f, ensure_ascii=False, indent=2)
        f.write("\n")
    os.makedirs(os.path.dirname(PROCESO), exist_ok=True)
    campos = ["producto", "color", "lado", "origen", "ancho_original", "ancho", "alto", "anchos_publicados", "foto_real", "desviacion_encuadre_px", "etiqueta", "relleno", "encuadre", "px_por_cm", "px_por_cm_x", "calibracion", "diseno"]
    with open(PROCESO, "w", encoding="utf-8", newline="") as f:
        w = csv.DictWriter(f, fieldnames=campos)
        w.writeheader()
        w.writerows([{k: r.get(k, "") for k in campos} for r in proceso])
    print(f"índice → {INDICE} ({sum(len(v) for v in indice.values())} fotos de {len(indice)} productos) · proceso → {PROCESO}")


if __name__ == "__main__":
    sys.exit(main())
