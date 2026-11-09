"""Lista de descargas de las fotos por color (fase 4.3): docs/fotos-proveedor/lista-descargas.csv.

Para cada uno de los 30 productos saca de su ficha técnica (docs/fichas-tecnicas/, solo consulta) el código de
modelo (las cuatro cifras de la referencia) y los códigos de color, en el mismo orden en que data/catalogo.ts lista
los colores (comprobado en la fase 3: las muestras del catálogo siguen el orden de las fichas), y genera una
dirección por color y vista con los patrones de docs/fotos-proveedor/patron-url.txt:
  - "prendas": fotos de prenda sin maniquí, vista 1 delante y 2 detrás (las 16 prendas, Mercury y Crest);
  - "producto": fotos de producto, cuya vista cambia por producto (VISTAS, comprobado a mano en la web del
    proveedor el 16/10/2026): gorras, bolsas y goodies. Donde no hay vista trasera, solo se pide la delantera.

Todo lo que sale de aquí es de uso interno: ni la lista ni los códigos se publican en la web.

Uso: python -I -X utf8 scripts/fotos/lista-fotos-proveedor.py
Requisitos: pymupdf (para leer las fichas).
"""
import csv
import os
import re
import sys

import pymupdf

FICHAS = "docs/fichas-tecnicas"
CARPETA = "docs/fotos-proveedor"
LISTA = os.path.join(CARPETA, "lista-descargas.csv")
PATRON = os.path.join(CARPETA, "patron-url.txt")

# (patrón, código de vista delantera, código de vista trasera o None). Por defecto: prendas, 1 y 2.
VISTAS = {
    "mercury": ("prendas", "1", "2"),  # delante y la trasera con el cierre
    "crest": ("prendas", "1", "2"),  # cara A y cara B
    "freya": ("producto", "2", None),  # vista 2: la gorra de frente (la 1 es en escorzo y no existe en todos los colores)
    "fred": ("producto", "2", None),
    "zenith": ("producto", "1", "2"),  # cara A y cara B
    "tarek": ("producto", "1", None),
    "kranston": ("producto", "2", None),
    "ranic": ("producto", "2", None),
    "davos": ("producto", "2", None),
    "uldon": ("producto", "1", None),
    "karby": ("producto", "1", None),
    "roldi": ("producto", "1", None),
    "zora": ("producto", "1", None),
    "luxor": ("producto", "2", None),
}

FICHA_DE = {
    "atomic-150": "Ficha ATOMIC 150.pdf",
    "austral": "Ficha AUSTRAL.pdf",
    "bull": "Ficha BULL.pdf",
    "cobain": "Ficha COBAIN.pdf",
    "jamaica": "Ficha JAMAICA.pdf",
    "pointer": "Ficha POINTER.pdf",
    "bahrain": "Ficha BAHRAIN.pdf",
    "imola": "Ficha IMOLA.pdf",
    "andre": "Ficha ANDRE.pdf",
    "shura": "Ficha SHURA.pdf",
    "clasica": "Ficha CLASICA.pdf",
    "urban": "Ficha URBAN.pdf",
    "montblanc": "Ficha MONTBLANC.pdf",
    "otto": "Ficha OTTO.pdf",
    "estambul-woman": "Ficha ESTAMBUL WOMAN.pdf",
    "valier": "Ficha VALIER.pdf",
    "freya": "Ficha FREYA.pdf",
    "mercury": "Ficha MERCURY.pdf",
    "fred": "Ficha FRED.pdf",
    "crest": "Ficha CREST.pdf",
    "zenith": "Ficha ZENITH.pdf",
    "tarek": "Ficha TAREK.pdf",
    "kranston": "Ficha KRANSTON.pdf",
    "ranic": "FICHA RANIC.pdf",
    "davos": "Ficha DAVOS.pdf",
    "uldon": "Ficha ULDON.pdf",
    "karby": "Ficha KARBY.pdf",
    "roldi": "Ficha ROLDI.pdf",
    "zora": "Ficha ZORA.pdf",
    "luxor": "Ficha LUXOR.pdf",
}


def colores_del_catalogo(fuente, slug_producto):
    ini = fuente.index(f"slug: '{slug_producto}'")
    fin = fuente.find("slug: '", ini + 10)
    bloque = fuente[ini : fin if fin > 0 else None]
    return re.findall(r"\{ nombre: '([^']+)', hex: '(#[0-9A-Fa-f]{6})'", bloque)


def codigos_de_la_ficha(ruta):
    """(código de modelo de 4 cifras, [códigos de color en orden]) a partir de los enlaces de la ficha."""
    doc = pymupdf.open(ruta)
    enlaces = [e["uri"] for pagina in doc for e in pagina.get_links() if "uri" in e]
    modelo = None
    codigos = []
    for uri in enlaces:
        m = re.search(r"/model_[A-Z]{2}(\d{4})(?:/Color_(\d+))?", uri)
        if not m:
            continue
        modelo = modelo or m.group(1)
        if m.group(2) and m.group(2) not in codigos:
            codigos.append(m.group(2))
    return modelo, codigos


def leer_patrones():
    patrones = {}
    for linea in open(PATRON, encoding="utf-8"):
        linea = linea.strip()
        if linea and not linea.startswith("#") and "=" in linea:
            clave, valor = linea.split("=", 1)
            patrones[clave.strip()] = valor.strip()
    return patrones


def main():
    patrones = leer_patrones()
    fuente = open("data/catalogo.ts", encoding="utf-8").read()
    filas = []
    for slug_p, ficha in FICHA_DE.items():
        modelo, codigos = codigos_de_la_ficha(os.path.join(FICHAS, ficha))
        colores = colores_del_catalogo(fuente, slug_p)
        if not modelo:
            print(f"{slug_p}: la ficha no lleva código de modelo", file=sys.stderr)
            continue
        if len(colores) != len(codigos):
            print(f"{slug_p}: {len(colores)} colores en el catálogo y {len(codigos)} códigos en la ficha", file=sys.stderr)
            continue
        patron, delante, detras = VISTAS.get(slug_p, ("prendas", "1", "2"))
        for (nombre, _hex), codigo in zip(colores, codigos):
            for vista, nombre_vista in ((delante, "delante"), (detras, "detras")):
                if vista is None:
                    continue
                filas.append({"producto": slug_p, "modelo": modelo, "color_codigo": codigo, "color_nombre": nombre, "vista": nombre_vista, "url": patrones[patron].format(modelo=modelo, color=codigo, vista=vista)})
        print(f"{slug_p:16} modelo {modelo}  {len(codigos):2} colores · {patron}, vistas {delante}/{detras or '—'}")
    os.makedirs(CARPETA, exist_ok=True)
    with open(LISTA, "w", encoding="utf-8", newline="") as f:
        w = csv.DictWriter(f, fieldnames=["producto", "modelo", "color_codigo", "color_nombre", "vista", "url"])
        w.writeheader()
        w.writerows(filas)
    print(f"{len(filas)} direcciones → {LISTA}")


if __name__ == "__main__":
    main()
