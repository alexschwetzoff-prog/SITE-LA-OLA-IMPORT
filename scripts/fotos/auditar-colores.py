"""Auditoría automática muestra ↔ foto (fase 4.4): el color medio de la prenda en cada foto publicada frente al hex
de la muestra del catálogo, para cazar fotos asignadas a otro color (Valier: amarillo → azul).

Para cada producto, color y lado del índice (data/fotos-catalogo.json) se mide el color de la tela en la foto
publicada: la mediana (en Lab) de los píxeles del objeto dentro de una ventana centrada en la colocación del diseño
(donde seguro hay tela) o, sin diseño, en el centro de la foto. Se compara con el hex de la muestra en Lab:
  - ΔE (CIE76) entre ambos, orientativo: las fotos salen más oscuras y saturadas que los chips (fase 4.2);
  - diferencia de tono (ángulo de matiz) cuando los dos colores tienen croma: es lo que delata un color cambiado
    (un amarillo frente a un azul), al margen de lo claro u oscuro que salga la foto.
Un color se marca como DISCREPANCIA si el tono se aparta más de 45° con croma en ambos, o si uno es neutro
(croma < 12) y el otro no (croma > 30), o si ambos son neutros y L* difiere más de 45 (blanco frente a negro).
Para cada producto con discrepancias se busca además, entre las fotos de ese producto, la que mejor casa con cada
muestra (asignación por tono y claridad), para proponer la corrección.

Uso: python -I -X utf8 scripts/fotos/auditar-colores.py [--csv docs/revision-colores/auditoria-colores.csv]
Requisitos: Pillow, numpy y scipy.
"""
import csv
import json
import math
import os
import re
import sys

import numpy as np
from PIL import Image

sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))
import recolor as R  # noqa: E402

INDICE = "data/fotos-catalogo.json"
SALIDA = "docs/revision-colores/auditoria-colores.csv"
TONO_MAX = 45.0  # grados de matiz a partir de los cuales el color de la foto no es el de la muestra
CROMA_NEUTRO = 12.0
CROMA_COLOR = 30.0
L_NEUTROS_MAX = 45.0


def colores_del_catalogo():
    fuente = open("data/catalogo.ts", encoding="utf-8").read()
    salida = {}
    for m in re.finditer(r"slug: '([a-z0-9-]+)'", fuente):
        ini = m.end()
        fin = fuente.find("slug: '", ini)
        bloque = fuente[ini : fin if fin > 0 else None]
        salida[m.group(1)] = [(n, h, s or None) for n, h, _, s in re.findall(r"\{ nombre: '([^']+)', hex: '(#[0-9A-Fa-f]{6})'(, hexSecundario: '(#[0-9A-Fa-f]{6})')?", bloque)]
    return salida


def lab_hex(h):
    return R.lineal_a_lab(R.a_lineal(R.hex_a_rgb(h)))


def tono(lab):
    return math.degrees(math.atan2(lab[2], lab[1])) % 360


def croma(lab):
    return math.hypot(lab[1], lab[2])


def dif_tono(a, b):
    d = abs(tono(a) - tono(b)) % 360
    return min(d, 360 - d)


def color_de_la_foto(ruta, colocacion):
    """Mediana Lab de la tela en una ventana alrededor del diseño (o del centro) dentro del objeto."""
    a = np.asarray(Image.open(ruta).convert("RGB"))
    h, w = a.shape[:2]
    mascara = R.mascara_objeto(a, "todo", 250.0)
    if colocacion:
        cx, cy, r = colocacion["x"], colocacion["y"], max(12, colocacion["ancho"] * 0.6)
        lienzo = colocacion.get("lienzo") or [w, h]
        cx, cy, r = cx * w / lienzo[0], cy * h / lienzo[1], r * w / lienzo[0]
    else:
        cx, cy, r = w / 2, h / 2, w * 0.12
    x0, x1 = int(max(0, cx - r)), int(min(w, cx + r))
    y0, y1 = int(max(0, cy - r)), int(min(h, cy + r))
    zona = mascara[y0:y1, x0:x1]
    if zona.sum() < 40:
        zona = mascara
        sub = a
    else:
        sub = a[y0:y1, x0:x1]
    lab = R.lineal_a_lab(R.a_lineal(sub.astype(np.float64)))
    return np.median(lab[zona], axis=0)


def discrepancia(lab_foto, lab_muestra):
    cf, cm = croma(lab_foto), croma(lab_muestra)
    if cf > CROMA_COLOR and cm > CROMA_COLOR:
        return dif_tono(lab_foto, lab_muestra) > TONO_MAX, "tono"
    if cf > CROMA_COLOR and cm < CROMA_NEUTRO or cm > CROMA_COLOR and cf < CROMA_NEUTRO:
        return True, "neutro frente a color"
    if cf < CROMA_NEUTRO and cm < CROMA_NEUTRO:
        return abs(lab_foto[0] - lab_muestra[0]) > L_NEUTROS_MAX, "claridad"
    return False, "croma medio"


def coste(lab_foto, lab_muestra):
    """Distancia para proponer la foto que mejor casa con una muestra: tono (si hay croma) y claridad."""
    cf, cm = croma(lab_foto), croma(lab_muestra)
    if cf > CROMA_NEUTRO and cm > CROMA_NEUTRO:
        return dif_tono(lab_foto, lab_muestra) + abs(lab_foto[0] - lab_muestra[0]) * 0.5
    if cf < CROMA_NEUTRO and cm < CROMA_NEUTRO:
        return abs(lab_foto[0] - lab_muestra[0])
    return 180 + abs(cf - cm)


def main():
    args = sys.argv[1:]
    salida = args[args.index("--csv") + 1] if "--csv" in args else SALIDA
    indice = json.load(open(INDICE, encoding="utf-8"))
    catalogo = colores_del_catalogo()
    filas = []
    por_producto = {}
    for slug, entradas in indice.items():
        hexes = {n: (h, s) for n, h, s in catalogo.get(slug, [])}
        for nombre, e in entradas.items():
            if nombre not in hexes:
                continue
            hex_color, hex_sec = hexes[nombre]
            for lado in ("delante", "detras"):
                ruta = e.get(lado)
                if not ruta or not e.get("real" if lado == "delante" else "realDetras"):
                    continue
                archivo = "public" + ruta
                if not os.path.exists(archivo):
                    continue
                lab_f = color_de_la_foto(archivo, e.get("diseno" if lado == "delante" else "disenoDetras"))
                # en los bicolores (Freya: corona blanca, visera de color) el diseño cae en la corona = hex principal
                lab_m = lab_hex(hex_color)
                de = float(np.sqrt(((lab_f - lab_m) ** 2).sum()))
                mal, criterio = discrepancia(lab_f, lab_m)
                fila = {
                    "producto": slug,
                    "color": nombre,
                    "lado": lado,
                    "hex_muestra": hex_color,
                    "foto": ruta,
                    "L_foto": f"{lab_f[0]:.0f}",
                    "tono_foto": f"{tono(lab_f):.0f}",
                    "croma_foto": f"{croma(lab_f):.0f}",
                    "L_muestra": f"{lab_m[0]:.0f}",
                    "tono_muestra": f"{tono(lab_m):.0f}",
                    "croma_muestra": f"{croma(lab_m):.0f}",
                    "dif_tono": f"{dif_tono(lab_f, lab_m):.0f}" if croma(lab_f) > CROMA_NEUTRO and croma(lab_m) > CROMA_NEUTRO else "",
                    "dE": f"{de:.0f}",
                    "criterio": criterio,
                    "discrepancia": "SÍ" if mal else "",
                    "propuesta": "",
                }
                filas.append(fila)
                por_producto.setdefault(slug, []).append((fila, lab_f, lab_m))
    # fase 10: coherencia delante ↔ detrás de cada color (la trasera tiene que ser el mismo color y la misma
    # prenda: una vista lateral u otro color en la ranura de la trasera, como pasó con dos fotos hd del proveedor,
    # se delata por la proporción de la caja del objeto y por el color medio de la tela)
    for slug, lista in por_producto.items():
        por_color = {}
        for fila, lab_f, lab_m in lista:
            por_color.setdefault(fila["color"], {})[fila["lado"]] = (fila, lab_f)
        for color, lados in por_color.items():
            if "delante" not in lados or "detras" not in lados:
                continue
            (fd, ld), (ft, lt) = lados["delante"], lados["detras"]
            de = float(np.sqrt(((ld - lt) ** 2).sum()))
            prop = []
            for f in (fd, ft):
                a = np.asarray(Image.open("public" + f["foto"]).convert("RGB"))
                m = R.mascara_objeto(a, "todo", 250.0)
                ys, xs = np.where(m)
                prop.append((xs.max() - xs.min() + 1) / max(1, ys.max() - ys.min() + 1))
            cambio = abs(prop[1] / prop[0] - 1)
            if de > 25 or cambio > 0.2:
                ft["discrepancia"] = "SÍ"
                ft["criterio"] = "delante ↔ detrás"
                ft["propuesta"] = f"la trasera no casa con la delantera: ΔE de tela {de:.0f}, proporción de la caja {prop[1]:.2f} frente a {prop[0]:.2f}"
    # propuesta: para cada muestra con discrepancia, la foto del producto (mismo lado) que mejor casa
    n_mal = 0
    for slug, lista in por_producto.items():
        malas = [t for t in lista if t[0]["discrepancia"]]
        if not malas:
            continue
        for fila, lab_f, lab_m in malas:
            n_mal += 1
            if fila["propuesta"]:
                continue  # discrepancia delante ↔ detrás, ya explicada
            candidatas = [(coste(lf, lab_m), f["color"], f["foto"]) for f, lf, _ in lista if f["lado"] == fila["lado"]]
            candidatas.sort()
            mejor = candidatas[0]
            fila["propuesta"] = f"la foto publicada como «{mejor[1]}» ({mejor[2].rsplit('/', 1)[-1]})" if mejor[1] != fila["color"] else "ninguna foto del producto casa"
    os.makedirs(os.path.dirname(salida), exist_ok=True)
    campos = list(filas[0].keys())
    with open(salida, "w", encoding="utf-8", newline="") as f:
        w = csv.DictWriter(f, fieldnames=campos)
        w.writeheader()
        w.writerows(filas)
    print(f"{len(filas)} fotos comprobadas · {n_mal} discrepancias → {salida}")
    for fila in filas:
        if fila["discrepancia"]:
            print(f"  {fila['producto']:16} {fila['color']:20} {fila['lado']:8} muestra {fila['hex_muestra']} (tono {fila['tono_muestra']}°, L {fila['L_muestra']}) · foto tono {fila['tono_foto']}°, L {fila['L_foto']}, croma {fila['croma_foto']} · {fila['criterio']} · {fila['propuesta']}")
    return 0


if __name__ == "__main__":
    sys.exit(main())
