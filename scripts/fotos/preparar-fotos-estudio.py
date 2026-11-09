"""Prepara las fotos del estudio 2D y del catálogo de Atomic 150 y Austral (fase 4.4: fotos hd a dos tamaños).

Por cada prenda, a partir de las fotos reales del proveedor (scripts/fotos/fuentes.py: la hd de 2000 px si existe,
si no la de 600; docs/fotos-proveedor/lista-descargas.csv dice cuál es la de cada color) y de los originales del
equipo en assets/productos/ (donde se midió la zona de la etiqueta):
  1. Foto base en blanco (delante y detrás), reducida a 1200 px: se quita la etiqueta del fabricante del cuello
     (detectada en la foto, scripts/fotos/etiquetas.py: solo ese rectángulo; la zona medida en la foto de 600 px del
     equipo se lleva a cada foto caja → caja), se calibra la escala en píxeles por cm con el largo de la ficha técnica
     (talla M) y se guarda limpia, a 600 px, en public/productos/<slug>-blanco-<lado>.jpg (reserva).
  2. Fotos reales de cada color (fase 4.3): mismo retoque y calibración, foto a foto. Las del color predeterminado
     (naranja de la Atomic, negro del Austral) se guardan además en public/productos/<slug>-<lado>.jpg (600 px), que
     sirven de miniatura. Ningún color se recolorea si tiene foto real.
  3. Recorte sin fondo (fase 4.2): cada foto del estudio se guarda como WebP con transparencia en
     public/productos/estudio/<slug>-<color>-<lado>.webp (1200 px) y -800.webp, con el borde limpio (la cobertura de
     la tela contra el fondo blanco se estima píxel a píxel en una banda del contorno: recolor.alfa_y_tela). El
     estudio las dibuja sobre un único escenario claro con una sombra de contacto; las capturas de 1200 × 1500
     siguen sobre blanco.
  4. Foto del catálogo (public/productos/catalogo/<slug>-<color>-<lado>.webp y -800.webp): la foto limpia tal cual,
     sobre su fondo blanco, con una sola compresión desde el original. Nada se amplía.
  5. Colores sin foto real (hoy ninguno): la foto blanca recoloreada con recolor.py (fase 4.2).
  6. Escribe el bloque "fotos" de data/siluetas/<silueta>.json: base, reales y recoloreadas, con su calibración y
     los anchos publicados.

Uso: python -I -X utf8 scripts/fotos/preparar-fotos-estudio.py [--ancho 1200]
Requisitos: Pillow, numpy y scipy. Después se ejecuta preparar-fotos-catalogo.py (índice, colocación del diseño,
hojas de contactos y portada).
"""
import json
import os
import re
import sys
import unicodedata

import numpy as np
from PIL import Image

sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))
import etiquetas as E  # noqa: E402
import fuentes as F  # noqa: E402
import recolor as R  # noqa: E402
from geometria import caja, mapa_cajas  # noqa: E402

PRENDAS = {
    "camiseta-unisex": {
        "slug": "atomic-150",
        "largo_cm": 71.0,  # largo B de la ficha, talla M, del punto más alto del hombro al bajo
        "base": {
            "delante": "assets/productos/ATOMIC 150 BLANCO (front).jpg",
            "detras": "assets/productos/ATOMIC 150 BLANCO (back).jpg",
        },
        "etiqueta_zona": (255, 5, 345, 110),  # zona del cuello donde se busca la etiqueta (px de la foto del equipo, 600)
        # fotos que el catálogo usa como foto principal: se guardan limpias (600 px) en public/productos/
        "principales": {"Naranja": {"delante": "public/productos/atomic-150-delante.jpg", "detras": "public/productos/atomic-150-detras.jpg"}},
    },
    "polo": {
        "slug": "austral",
        "largo_cm": 71.0,
        "base": {
            "delante": "assets/productos/Polo AUSTRAL BLANCO (front).jpg",
            "detras": "assets/productos/Polo AUSTRAL BLANCO (back).jpg",
        },
        "etiqueta_zona": (255, 10, 345, 115),
        "principales": {"Negro": {"delante": "public/productos/austral-delante.jpg", "detras": "public/productos/austral-detras.jpg"}},
    },
}
ESTUDIO = "public/productos/estudio"
PROCESO = "docs/fotos-proveedor/proceso-estudio.csv"  # fase 10: qué se hizo con cada foto (etiqueta y relleno), para el informe
# Fase 10: cajas de etiqueta fijadas a mano (px de la foto publicada, 1200 de ancho) donde la detección se queda corta:
# en el Austral blanco la caja detectada dejaba una línea oscura de la etiqueta bajo la costura del cuello.
ETIQUETAS_MANUALES = {("austral", "Blanco", "delante"): (580, 58, 618, 113)}

def caja_manual(a, caja):
    """Una caja fijada a mano (medida sobre la foto publicada de 1200 px) en los px de esta foto."""
    if caja is None:
        return None
    k = a.shape[1] / 1200
    return tuple(int(round(v * k)) for v in caja)

FILAS_PROCESO = []
CATALOGO = "public/productos/catalogo"
TORSO = (0.33, 0.42, 0.67, 0.93)
ANCHO_LIMPIA = 600


def slug(texto):
    t = unicodedata.normalize("NFD", texto).encode("ascii", "ignore").decode().lower()
    return re.sub(r"[^a-z0-9]+", "-", t).strip("-")


def colores_del_catalogo(slug_producto):
    """Lee nombre y hex de los colores de un producto en data/catalogo.ts (sin ejecutar TypeScript)."""
    fuente = open("data/catalogo.ts", encoding="utf-8").read()
    ini = fuente.index(f"slug: '{slug_producto}'")
    fin = fuente.find("slug: '", ini + 10)
    bloque = fuente[ini : fin if fin > 0 else None]
    return re.findall(r"\{ nombre: '([^']+)', hex: '(#[0-9A-Fa-f]{6})'", bloque)


def escala_de(a):
    s = a.shape[1] / F.ANCHO_REFERENCIA
    R.fijar_escala(s)
    E.fijar_escala(s)
    return s


def mascara_prenda(a):
    return R.mascara_objeto(a, "conectado", 251.5)


# ---------------------------------------------------------------------------------------------
# Calibración (px por cm)
# ---------------------------------------------------------------------------------------------
def hps_y_bajo(prenda):
    """(y del punto más alto del hombro, y del bajo, x del centro), medidos en la silueta (distancias de referencia
    en fotos de 600 px, escaladas con la anchura de la foto)."""
    s = prenda.shape[1] / F.ANCHO_REFERENCIA
    px = lambda v: max(1, int(round(v * s)))  # noqa: E731
    ys, xs = np.where(prenda)
    cx = (xs.min() + xs.max()) / 2
    bajo = ys.max() + 0.5
    tops = {}
    for x in range(int(cx) - px(170), int(cx) - px(20)):
        col = np.where(prenda[:, x])[0]
        if len(col):
            tops[x] = col.min()
    xs_h = [x for x in tops if int(cx) - px(150) <= x <= int(cx) - px(90)]
    p = np.polyfit(xs_h, [tops[x] for x in xs_h], 1)
    x_cuello = None
    for x in range(int(cx) - px(90), int(cx) - px(20)):
        if x in tops and (np.polyval(p, x) - tops[x]) > 4 * s:
            x_cuello = x
            break
    if x_cuello is None:
        x_cuello = int(cx) - px(60)
    return float(np.polyval(p, x_cuello)), bajo, cx


def calibracion(prenda, largo_cm, src, ancho, alto, anchos):
    y_hps, bajo, cx = hps_y_bajo(prenda)
    return {"src": src, "ancho": ancho, "alto": alto, "anchos": anchos, "pxPorCm": round((bajo - y_hps) / largo_cm, 3), "centroX": round(cx, 1), "bajoY": round(bajo, 1), "hpsY": round(y_hps, 1)}


# ---------------------------------------------------------------------------------------------
# Principal
# ---------------------------------------------------------------------------------------------
def guardar_jpg(a, destino):
    os.makedirs(os.path.dirname(destino), exist_ok=True)
    im = Image.fromarray(a)
    if im.width > ANCHO_LIMPIA:
        im = im.resize((ANCHO_LIMPIA, round(im.height * ANCHO_LIMPIA / im.width)), Image.LANCZOS)
    im.save(destino, quality=92, optimize=True, subsampling=0)


def preparar_foto(a, zona, info, lado, nombre_color, origen, destino_jpg=None):
    """Retoca la etiqueta (solo delante, en `zona`: px de esta foto), guarda la foto limpia (JPG de reserva, si se
    pide), el recorte sin fondo (WebP con alfa, dos tamaños) y la foto del catálogo (WebP sobre blanco, dos tamaños),
    y calibra. Devuelve (foto limpia, máscara, alfa, tela, cal)."""
    escala_de(a)
    prenda = mascara_prenda(a)
    bbox = None
    if lado == "delante":
        # fase 10: umbral para telas jaspeadas (gris vigoré) y relleno por clonado de Poisson (etiquetas.py)
        metodo = []
        manual = caja_manual(a, ETIQUETAS_MANUALES.get((info["slug"], nombre_color, lado)))
        a, bbox = E.quitar(a, prenda, zona, jaspeado=bool(re.search(r"vigor|jaspe|mezcla", nombre_color, re.I)), metodo=metodo, manual=manual)
        FILAS_PROCESO.append({"producto": info["slug"], "color": nombre_color, "lado": lado, "origen": origen.replace("\\", "/"), "ancho": int(a.shape[1]), "etiqueta": str(bbox) if bbox else "", "relleno": " · ".join(metodo)})
    else:
        FILAS_PROCESO.append({"producto": info["slug"], "color": nombre_color, "lado": lado, "origen": origen.replace("\\", "/"), "ancho": int(a.shape[1]), "etiqueta": "", "relleno": ""})
    if destino_jpg:
        guardar_jpg(a, destino_jpg)
    alfa, tela = R.alfa_y_tela(a, prenda)
    anchos = F.anchos_de(int(a.shape[1]))
    recorte = f"{ESTUDIO}/{info['slug']}-{slug(nombre_color)}-{lado}.webp"
    R.guardar_webp_tamanos(tela, recorte, anchos, alfa=alfa)
    R.guardar_webp_tamanos(a.astype(np.float64), f"{CATALOGO}/{info['slug']}-{slug(nombre_color)}-{lado}.webp", anchos)
    cal = calibracion(prenda, info["largo_cm"], "/" + recorte.split("public/")[1], int(a.shape[1]), int(a.shape[0]), anchos)
    print(f"  {nombre_color} {lado}: {os.path.basename(origen)} ({a.shape[1]} px) · etiqueta {bbox or 'no visible'} · {cal['pxPorCm']} px/cm (HPS y={cal['hpsY']}, bajo y={cal['bajoY']})")
    return a, prenda, alfa, tela, cal


def zona_en(a, caja_600, zona_600):
    """La zona de la etiqueta, medida en la foto del equipo de 600 px, llevada a esta foto caja → caja."""
    escala_de(a)
    t = mapa_cajas(caja_600, caja(mascara_prenda(a)), tolerancia=0.0 if a.shape[1] != F.ANCHO_REFERENCIA else None)
    return t.rect(zona_600)


def main():
    args = sys.argv[1:]
    ancho = int(args[args.index("--ancho") + 1]) if "--ancho" in args else F.ANCHO_PUBLICADO
    os.makedirs(ESTUDIO, exist_ok=True)
    os.makedirs(CATALOGO, exist_ok=True)
    proveedor = F.fotos_del_proveedor()
    for silueta, info in PRENDAS.items():
        slug_p = info["slug"]
        ruta_json = f"data/siluetas/{silueta}.json"
        datos = json.load(open(ruta_json, encoding="utf-8"))
        fotos = {"base": {}, "reales": {}, "recoloreadas": {}}
        base = {}
        cajas_600 = {}
        print(f"{slug_p}:")
        for lado, origen_equipo in info["base"].items():
            # la caja de la prenda en la foto del equipo (600 px), donde se midió la zona de la etiqueta
            a_equipo = np.asarray(Image.open(origen_equipo).convert("RGB"))
            escala_de(a_equipo)
            cajas_600[lado] = caja(mascara_prenda(a_equipo))
            ruta = proveedor.get((slug_p, "Blanco", lado))
            a, _ = F.leer_foto(ruta, ancho) if ruta else F.leer_foto(origen_equipo, ancho)
            zona = zona_en(a, cajas_600[lado], info["etiqueta_zona"])
            a, prenda, alfa, tela, cal = preparar_foto(a, zona, info, lado, "Blanco", ruta or origen_equipo, f"public/productos/{slug_p}-blanco-{lado}.jpg")
            base[lado] = (a, prenda, alfa, tela)
            fotos["base"][lado] = cal
        colores = colores_del_catalogo(slug_p)
        for nombre, hex_color in colores:
            if nombre == "Blanco":
                continue
            lados_reales = {lado: proveedor.get((slug_p, nombre, lado)) for lado in ("delante", "detras")}
            if all(lados_reales.values()):
                fotos["reales"][nombre] = {}
                for lado, origen in lados_reales.items():
                    destino_jpg = info.get("principales", {}).get(nombre, {}).get(lado)
                    a, _ = F.leer_foto(origen, ancho)
                    zona = zona_en(a, cajas_600[lado], info["etiqueta_zona"])
                    _, _, _, _, cal = preparar_foto(a, zona, info, lado, nombre, origen, destino_jpg)
                    fotos["reales"][nombre][lado] = cal
                continue
            # sin foto real: la blanca recoloreada (recorte para el estudio y foto sobre blanco para el catálogo)
            fotos["recoloreadas"][nombre] = {}
            destino_lab = R.destino_lab(hex_color, nombre)
            for lado, (a, prenda, alfa, tela) in base.items():
                escala_de(a)
                rec = R.recolorear_zonas(tela, alfa, [{"mascara": prenda, "destino": destino_lab}], TORSO)
                anchos = F.anchos_de(int(a.shape[1]))
                destino = f"{ESTUDIO}/{slug_p}-{slug(nombre)}-{lado}.webp"
                R.guardar_webp_tamanos(rec, destino, anchos, alfa=alfa)
                R.guardar_webp_tamanos(R.componer(a, rec, alfa), f"{CATALOGO}/{slug_p}-{slug(nombre)}-{lado}.webp", anchos)
                fotos["recoloreadas"][nombre][lado] = "/" + destino.split("public/")[1]
            print(f"  recoloreada {nombre} {hex_color} (L* {destino_lab[0]:.0f}): sin foto real")
        datos = {"id": datos["id"], "nota": datos.get("nota", ""), "posiciones": datos["posiciones"], "fotos": fotos}
        with open(ruta_json, "w", encoding="utf-8", newline="\n") as f:
            json.dump(datos, f, ensure_ascii=False, indent=2)
            f.write("\n")
        print(f"  escrito {ruta_json}: {len(fotos['reales']) + 1} colores con foto real, {len(fotos['recoloreadas'])} recoloreados")
    import csv

    os.makedirs(os.path.dirname(PROCESO), exist_ok=True)
    with open(PROCESO, "w", encoding="utf-8", newline="") as f:
        w = csv.DictWriter(f, fieldnames=["producto", "color", "lado", "origen", "ancho", "etiqueta", "relleno"])
        w.writeheader()
        w.writerows(FILAS_PROCESO)
    print(f"proceso → {PROCESO} ({len(FILAS_PROCESO)} fotos)")


if __name__ == "__main__":
    main()
