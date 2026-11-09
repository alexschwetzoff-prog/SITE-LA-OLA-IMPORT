"""Índice del catálogo de Atomic 150 y Austral y archivos de marca (fases 4, 4.2, 4.3 y 4.4).

Fase 4.4: las fotos vienen a 1200 px (y 800) de preparar-fotos-estudio.py; la colocación del diseño se calcula en
px de la foto grande (`lienzo` [1200, 1200]) y el índice lleva los `anchos` publicados de cada lado.

El catálogo no lleva el diseño incrustado: la web dibuja el logo de [MARCA] en el corazón (8 cm) y la estrella en
la espalda (20 cm, dentro del A4) como capa aparte, a la resolución real de la pantalla, desde public/marca/
(components/producto/FotoProducto.tsx). Este script:
  - escribe los archivos de marca que usa el navegador (public/marca/tu-logo-aqui.png, logo-marca-catalogo.png,
    estrella-marca-catalogo.png) a partir de assets/marca/ (el logo y la estrella tal como van incrustados en el
    catálogo PDF, extraídos por extraer-marca-pdf.py: 2223 × 852 y 852 × 852 px);
  - toma las fotos del catálogo que ha escrito preparar-fotos-estudio.py (public/productos/catalogo/
    <slug>-<color>-<lado>.webp, una por color y lado: reales desde la fase 4.3) y calcula la colocación del logo y de
    la estrella con la calibración cm → px de cada foto en data/siluetas/*.json;
  - escribe en data/fotos-catalogo.json las entradas de Atomic 150 y Austral (conserva las de los otros 28, que
    escribe preparar-fotos-productos.py) y una hoja de contactos de cada una en docs/revision-colores/.

Uso: python -I -X utf8 scripts/fotos/preparar-fotos-catalogo.py   (después de preparar-fotos-estudio.py)
Requisitos: Pillow, numpy y scipy. Los originales de assets/ no se tocan.
"""
import json
import os
import re
import sys
import unicodedata

import numpy as np
from PIL import Image, ImageDraw

sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))
import diseno as D  # noqa: E402

SILUETAS = {
    "camiseta-unisex": "atomic-150",
    "polo": "austral",
}
SALIDA = "public/productos/catalogo"
INDICE = "data/fotos-catalogo.json"
HOJAS = "docs/revision-colores"
ANCHO_LOGO_CM = 8.0  # el corazón del catálogo
ANCHO_ESTRELLA_CM = 20.0  # la estrella cabe en el A4 (21 × 29,7) de la espalda
LADO_HOJA = 560


def slug(texto):
    t = unicodedata.normalize("NFD", texto).encode("ascii", "ignore").decode().lower()
    return re.sub(r"[^a-z0-9]+", "-", t).strip("-")


def cm_a_px(foto, lado, x_cm, z_cm):
    signo = 1 if lado == "delante" else -1
    return foto["centroX"] + signo * x_cm * foto["pxPorCm"], foto["bajoY"] - z_cm * foto["pxPorCm"]


def fotos_de_silueta(s):
    """(nombre de color, {lado: calibración con src}, real) para la base (Blanco), las reales y las recoloreadas."""
    fotos = s["fotos"]
    base = fotos["base"]
    salida = [("Blanco", base, True)]
    for nombre, lados in fotos["reales"].items():
        salida.append((nombre, lados, True))
    for nombre, lados in fotos["recoloreadas"].items():
        salida.append((nombre, {l: {**base[l], "src": lados[l]} for l in ("delante", "detras")}, False))
    return salida


def foto_catalogo(slug_producto, nombre, lado, recorte):
    """La foto del catálogo (RGB uint8) y la máscara de la prenda (del alfa del recorte del estudio)."""
    rgb = np.asarray(Image.open(f"{SALIDA}/{slug_producto}-{slug(nombre)}-{lado}.webp").convert("RGB"))
    alfa = np.asarray(Image.open("public" + recorte).convert("RGBA"))[..., 3]
    return rgb, alfa > 8


def hoja(slug_p, muestras, marca):
    os.makedirs(HOJAS, exist_ok=True)
    por_fila = 4
    filas = (len(muestras) + por_fila - 1) // por_fila
    T = LADO_HOJA
    im_hoja = Image.new("RGB", (por_fila * T, filas * (T + 18)), (255, 255, 255))
    d = ImageDraw.Draw(im_hoja)
    for i, (nombre, rgb, mascara, colocacion, es_real) in enumerate(muestras):
        cx, cy = (i % por_fila) * T, (i // por_fila) * (T + 18)
        tile = Image.fromarray(rgb).resize((T, T), Image.LANCZOS)
        m_tile = np.asarray(Image.fromarray(mascara.astype(np.uint8) * 255).resize((T, T), Image.NEAREST)) > 127
        tile, _ = D.componer_diseno(tile, marca, colocacion, m_tile, T / rgb.shape[1])
        im_hoja.paste(tile, (cx, cy + 18))
        d.text((cx + 4, cy + 3), f"{nombre}{' · FOTO REAL' if es_real else ''} · diseño [MARCA]", fill=(190, 0, 0))
    im_hoja.save(os.path.join(HOJAS, f"{slug_p}.jpg"), quality=90, optimize=True)


def main():
    os.makedirs(SALIDA, exist_ok=True)
    marca = D.cargar_marca()
    publicos = D.escribir_publicos(marca)
    print(f"marca ({marca['origen']}): " + " · ".join(f"{k} {v[0][0]}×{v[0][1]} px, {v[1] // 1024} KB" for k, v in publicos.items()))
    indice = json.load(open(INDICE, encoding="utf-8")) if os.path.exists(INDICE) else {}
    for silueta, slug_producto in SILUETAS.items():
        s = json.load(open(f"data/siluetas/{silueta}.json", encoding="utf-8"))
        corazon = s["posiciones"]["corazon"]["ancla"]
        espalda = s["posiciones"]["espalda_a4"]["ancla"]
        indice[slug_producto] = {}
        muestras = []
        n_reales = 0
        for nombre, lados, real in fotos_de_silueta(s):
            entrada = {"real": real, "realDetras": real, "ejemplo": "marca"}
            # fase 4.4: tamaños publicados de cada lado (el archivo sin sufijo es el grande; -800.webp, el pequeño)
            if lados["delante"].get("anchos"):
                entrada["anchos"] = lados["delante"]["anchos"]
                entrada["anchosDetras"] = lados["detras"]["anchos"]
            n_reales += real
            for lado, marca_clave, ancla, ancho_cm in (
                ("delante", "marca-logo", (corazon["x"], corazon["z"]), ANCHO_LOGO_CM),
                ("detras", "marca-estrella", (espalda["x"], espalda["z"]), ANCHO_ESTRELLA_CM),
            ):
                foto = lados[lado]
                rgb, mascara = foto_catalogo(slug_producto, nombre, lado, foto["src"])
                x, y = cm_a_px(foto, lado, *ancla)
                colocacion = {"x": round(x, 1), "y": round(y, 1), "ancho": round(ancho_cm * foto["pxPorCm"], 1), "giro": 0, "marca": marca_clave, "lienzo": [foto["ancho"], foto["alto"]]}
                entrada[lado] = f"/productos/catalogo/{slug_producto}-{slug(nombre)}-{lado}.webp"
                entrada["diseno" if lado == "delante" else "disenoDetras"] = colocacion
                muestras.append((f"{nombre} · {lado}", rgb, mascara, colocacion, real))
            indice[slug_producto][nombre] = entrada
        print(f"{slug_producto}: {len(indice[slug_producto])} colores, {n_reales} con foto real")
        hoja(slug_producto, muestras, marca)
    with open(INDICE, "w", encoding="utf-8", newline="\n") as f:
        json.dump(indice, f, ensure_ascii=False, indent=2)
        f.write("\n")
    print(f"índice → {INDICE}")


if __name__ == "__main__":
    sys.exit(main())
