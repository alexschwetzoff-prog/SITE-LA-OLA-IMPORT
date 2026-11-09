"""Informe de la revisión de fotos de la fase 10: docs/FOTOS-REVISION.md.

Una fila por producto, color y vista con el estado («limpia»: la foto no enseñaba ninguna marca del fabricante;
«retocada»: se ha quitado la etiqueta, y cómo; «dudosa»: no se ha podido dejar limpia con seguridad, y no se
publica) y qué se hizo con ella (etiqueta retocada y método del relleno, encuadre normalizado o reencuadrado, foto
de 600 px por error del proveedor en la hd, recoloreado, foto del equipo). Al final, la lista de dudosas y el
resumen de las comprobaciones (OCR, grep, metadatos, auditorías).

Lee data/fotos-catalogo.json, docs/fotos-proveedor/proceso.csv (28 productos), docs/fotos-proveedor/
proceso-estudio.csv (Atomic 150 y Austral), docs/revision-colores/marcas.csv (candidatas a marca con su veredicto),
docs/revision-colores/ocr.csv y docs/revision-colores/ocr-recortes.csv (alertas del OCR). Las dudosas y las notas
se escriben aquí a mano tras la revisión a ojo (DUDOSAS, NOTAS).

Uso: python -I -X utf8 scripts/fotos/informe-revision.py
"""
import csv
import json
import os
import re

INDICE = "data/fotos-catalogo.json"
PROCESO = "docs/fotos-proveedor/proceso.csv"
PROCESO_ESTUDIO = "docs/fotos-proveedor/proceso-estudio.csv"
MARCAS = "docs/revision-colores/marcas.csv"
OCR = "docs/revision-colores/ocr.csv"
OCR_RECORTES = "docs/revision-colores/ocr-recortes.csv"
SALIDA = "docs/FOTOS-REVISION.md"
FECHA = "19/10/2026"

# Fotos que no se dejan limpias con seguridad: no se publican (el índice las omite) y se listan al final.
DUDOSAS = {
    # (slug, color, lado): motivo
}
# Notas a mano por foto (encuadre que no se normaliza, errores del proveedor…).
NOTAS = {
    ("andre", "Rojo", "detras"): "encuadre sin normalizar: es otra toma del proveedor, mucho más cerrada y con los tirantes fuera de la foto; llevarla al encuadre de las demás la cortaría",
    ("mercury", "Amarillo flúor", "delante"): "la foto hd del proveedor es otra (la trasera negra): se usa la de 600 px, reencuadrada como el resto de colores",
    ("estambul-woman", "Negro", "detras"): "la foto hd del proveedor es una vista lateral de la chaqueta azul acero: se usa la de 600 px, que sí es la trasera negra",
    ("urban", "Rosa claro y gris vigoré", "detras"): "la foto hd del proveedor es una vista lateral de la sudadera verde: se usa la de 600 px, que sí es la trasera rosa",
    ("karby", "Bambú · redondo", "delante"): "otro objeto (el formato redondo): sin normalizar respecto al rectangular",
    ("andre", "Royal", "detras"): "la auditoría automática avisa de que la tela es más oscura que delante (ΔE 31): es la foto real del proveedor, con menos luz que la delantera; revisada a ojo, es la misma prenda y el mismo color, y se publica tal cual",
    ("pointer", "Gris vigoré", "delante"): "la detección automática no distinguía la etiqueta sobre la tela jaspeada: caja fijada a mano (ETIQUETAS_MANUALES) y rellenada igual que las demás",
    ("jamaica", "Gris", "delante"): "la caja detectada se pasaba hacia el hombro y el relleno dejaba una marca clara: caja fijada a mano",
    ("jamaica", "Marino", "delante"): "la caja detectada se quedaba corta por arriba y quedaba un punto blanco de la etiqueta: caja fijada a mano",
    ("austral", "Blanco", "delante"): "la caja detectada dejaba una línea oscura de la etiqueta bajo la costura del cuello: caja fijada a mano (estudio y catálogo)",
}


def nombres_productos():
    fuente = open("data/catalogo.ts", encoding="utf-8").read()
    return dict(re.findall(r"slug: '([^']+)',\s*nombre: '([^']+)'", fuente))


def leer_csv(ruta):
    if not os.path.exists(ruta):
        return []
    return list(csv.DictReader(open(ruta, encoding="utf-8")))


def main():
    indice = json.load(open(INDICE, encoding="utf-8"))
    nombres = nombres_productos()
    proceso = {(r["producto"], r["color"], r["lado"]): r for r in leer_csv(PROCESO)}
    proceso.update({(r["producto"], r["color"], r["lado"]): r for r in leer_csv(PROCESO_ESTUDIO)})
    marcas = {}
    for r in leer_csv(MARCAS):
        marcas.setdefault((r["producto"], r["color"], r["lado"]), []).append(r)
    alertas_ocr = [r for r in leer_csv(OCR) + leer_csv(OCR_RECORTES) if r.get("alertas")]
    filas = []
    resumen = {"limpia": 0, "retocada": 0, "dudosa": 0}
    dudosas = []
    archivos_vistos = set()
    for slug, colores in indice.items():
        for color, e in colores.items():
            for lado in ("delante", "detras"):
                ruta = e.get(lado)
                if not ruta:
                    continue
                propia = bool(e.get("real" if lado == "delante" else "realDetras"))
                clave = (slug, color, lado)
                p = proceso.get(clave, {})
                hecho = []
                if ruta in archivos_vistos or (not propia and (p.get("origen", "").startswith("sin foto") or not p)):
                    if not propia and not p.get("origen", "").startswith("recoloreado"):
                        hecho.append("sin foto propia: se enseña la foto del color predeterminado")
                archivos_vistos.add(ruta)
                if p.get("origen", "").startswith("recoloreado"):
                    hecho.append("sin foto real en el proveedor: la foto base recoloreada, revisada a ojo")
                etiqueta = p.get("etiqueta", "")
                if etiqueta:
                    hecho.append(f"etiqueta del cuello retocada en {etiqueta} px" + (f" ({p.get('relleno')})" if p.get("relleno") else ""))
                if p.get("encuadre"):
                    hecho.append(p["encuadre"].replace("reencuadre", "reencuadre a la corona de Freya").replace("normalizado", "encuadre normalizado"))
                if p.get("ancho_original") and p.get("ancho") and p["ancho_original"] not in ("", "2000", "4096") and int(p["ancho"]) < 1200:
                    hecho.append(f"foto de {p['ancho']} px (el proveedor no la tiene mayor)")
                if clave in NOTAS:
                    hecho.append(NOTAS[clave])
                pendientes = [m for m in marcas.get(clave, []) if m.get("veredicto", "") not in ("ok", "producto", "diseño", "retocada")]
                revisadas = len(marcas.get(clave, [])) - len(pendientes)
                if revisadas:
                    hecho.append(f"{revisadas} mancha(s) candidata(s) del barrido revisada(s) a ojo y por OCR: costuras, huecos de fondo o piezas del producto, ninguna marca")
                estado = "retocada" if etiqueta else "limpia"
                if clave in DUDOSAS or pendientes:
                    estado = "dudosa"
                    dudosas.append((slug, color, lado, DUDOSAS.get(clave) or f"{len(pendientes)} mancha(s) candidata(s) sin veredicto en {MARCAS}"))
                resumen[estado] += 1
                filas.append((nombres.get(slug, slug), color, "delante" if lado == "delante" else "detrás", estado, "; ".join(hecho) or "nada: la foto del proveedor ya estaba limpia"))
    total = sum(resumen.values())
    lineas = [
        f"# Revisión de fotos del catálogo · fase 10 ({FECHA})",
        "",
        "Revisión estricta de las fotos publicadas de los 30 productos, todos los colores, delante y detrás: etiquetas, marcas y textos del fabricante (etiqueta interior del cuello, etiquetas laterales, hang tags, estampados interiores, marcas en gorras), encuadre y coherencia entre colores y vistas. Se parte siempre de los originales del proveedor sin tocar (`assets/productos/originales-proveedor-hd/` y `originales-proveedor/`, carpetas ignoradas por git y fuera de `public/`): cada foto publicada sale de su original en una sola pasada (`scripts/fotos/preparar-fotos-estudio.py` y `preparar-fotos-productos.py`), nunca de un retoque anterior.",
        "",
        "## Cómo se ha comprobado",
        "",
        "- **Etiquetas**: detección foto a foto en la zona del cuello (`scripts/fotos/etiquetas.py`: ΔE respecto a la tela local, umbral propio para telas jaspeadas, crecimiento hasta la sombra de la etiqueta sin tragarse el ribete) y relleno por clonado de Poisson de un parche de tela vecina (textura y costuras reales; relleno de Laplace con textura cuando no hay parche que valga). Hojas antes/después de cada cuello, a 2×, en `docs/revision-colores/etiquetas/`.",
        "- **Marcas por todo el objeto**: `scripts/fotos/revisar-marcas.py` busca en cada foto publicada manchas pequeñas de alto contraste (candidatas a etiqueta lateral, hang tag o marca) y las saca ampliadas a 3× en `docs/revision-colores/marcas/<slug>.jpg`; cada candidata tiene su veredicto en `docs/revision-colores/marcas.csv`.",
        "- **OCR**: `scripts/fotos/ocr-fotos.mjs` (tesseract.js) lee todas las imágenes de `public/` (`docs/revision-colores/ocr.csv`) y, en modo bloque, los recortes ampliados de las candidatas (`ocr-recortes.csv`), buscando el nombre del proveedor y los de su grupo con variantes de mayúsculas, espacios y confusiones del OCR.",
        "- **Grep** en el repositorio (rutas, `alt`, JSON del catálogo, comentarios, nombres de archivo) de esos nombres; **metadatos** EXIF/XMP/IPTC/ICC de todas las imágenes publicadas (`scripts/fotos/limpiar-metadatos.py`).",
        "- **Encuadre**: `docs/fotos-proveedor/proceso.csv` lleva, por foto, la desviación respecto a la base y la normalización aplicada (gorras: reencuadre foto a foto a la corona de Freya, delanteras y traseras; bolsas: anchura y centro; prendas: altura y centro cuando difieren más de un 0,8 % o 2 px). Auditoría automática muestra ↔ foto y delante ↔ detrás: `scripts/fotos/auditar-colores.py`.",
        "",
        f"## Resumen: {total} fotos · {resumen['limpia']} limpias · {resumen['retocada']} retocadas · {resumen['dudosa']} dudosas",
        "",
        "| Producto | Color | Vista | Estado | Qué se hizo |",
        "| --- | --- | --- | --- | --- |",
    ]
    for f in filas:
        lineas.append("| " + " | ".join(f) + " |")
    lineas += ["", "## Dudosas (no se publican)", ""]
    if dudosas:
        for slug, color, lado, motivo in dudosas:
            lineas.append(f"- {nombres.get(slug, slug)} · {color} · {lado}: {motivo}")
    else:
        lineas.append("Ninguna: todas las fotos publicadas han pasado la revisión a ojo, el OCR y la búsqueda de marcas.")
    lineas += ["", "## Alertas del OCR", ""]
    if alertas_ocr:
        for r in alertas_ocr:
            lineas.append(f"- `{r['archivo']}`: {r['alertas']} (texto leído: {r.get('texto', '')[:120]})")
    else:
        lineas.append("Ninguna alerta: en ninguna imagen publicada ni en ningún recorte ampliado el OCR lee el nombre del proveedor ni los de su grupo.")
    with open(SALIDA, "w", encoding="utf-8", newline="\n") as fh:
        fh.write("\n".join(lineas) + "\n")
    print(f"{SALIDA}: {total} fotos · {resumen}")


if __name__ == "__main__":
    main()
