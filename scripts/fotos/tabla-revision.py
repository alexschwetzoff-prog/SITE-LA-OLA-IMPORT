"""Tabla producto × color de la revisión de fotos (fase 4.3; regenerada en la fase 10): docs/revision-colores/README.md.

Lee data/fotos-catalogo.json (qué foto enseña cada color y si es real) y docs/fotos-proveedor/proceso.csv (origen,
tamaño, encuadre y etiqueta de cada foto) y escribe la tabla con el estado de cada color: foto real, recoloreado
(revisado a ojo: OK o no alcanza) o sin foto (se enseña el color predeterminado). Los veredictos de los
recoloreados que quedan van en VEREDICTOS; las hojas de contactos (<slug>.jpg) y las de cuellos (etiquetas/) las
escriben los scripts de fotos.

Uso: python -I -X utf8 scripts/fotos/tabla-revision.py
"""
import csv
import json
import os
import re
from collections import Counter

INDICE = "data/fotos-catalogo.json"
PROCESO = "docs/fotos-proveedor/proceso.csv"
SALIDA = "docs/revision-colores/README.md"
FECHA = "19/10/2026"

# Recoloreados que siguen publicándose (colores sin foto real), revisados a ojo en la hoja de contactos.
VEREDICTOS = {
    ("tarek", "Plateado"): ("OK", "sin foto real en el proveedor; recoloreado desde la foto amarilla, revisado"),
    ("tarek", "Marino"): ("OK", "sin foto real en el proveedor; recoloreado desde la foto amarilla, revisado"),
}
# Colores que se enseñan con la foto de otro color del mismo producto.
NOTAS_SIN_FOTO = {
    ("luxor", "Piel reciclada · redondo"): "la foto del equipo (con el diseño) enseña los dos formatos; el proveedor tiene foto del redondo, sin diseño",
}


def nombres_productos():
    fuente = open("data/catalogo.ts", encoding="utf-8").read()
    return dict(re.findall(r"slug: '([^']+)',\s*nombre: '([^']+)'", fuente))


def main():
    indice = json.load(open(INDICE, encoding="utf-8"))
    nombres = nombres_productos()
    proceso = {}
    if os.path.exists(PROCESO):
        for r in csv.DictReader(open(PROCESO, encoding="utf-8")):
            proceso[(r["producto"], r["color"], r["lado"])] = r
    filas = []
    resumen = Counter()
    for slug_p, colores in indice.items():
        for color, e in colores.items():
            real = bool(e.get("real"))
            tiene_detras = "detras" in e
            real_detras = bool(e.get("realDetras")) if tiene_detras else None
            p = proceso.get((slug_p, color, "delante"), {})
            origen = p.get("origen", "")
            if real:
                estado, motivo = "Foto real", ""
                if tiene_detras and not real_detras:
                    estado, motivo = "Foto real (delante)", "la trasera es recoloreada"
                resumen["real"] += 1
            elif origen.startswith("recoloreado") or (slug_p in ("atomic-150", "austral")):
                veredicto, motivo = VEREDICTOS.get((slug_p, color), ("OK", ""))
                estado = "Recoloreado OK" if veredicto == "OK" else "Recoloreado: no alcanza"
                resumen["recoloreado"] += 1
            else:
                estado = "Sin foto"
                motivo = NOTAS_SIN_FOTO.get((slug_p, color), "se enseña la foto del color predeterminado")
                resumen["sin foto"] += 1
            tam = f"{p['ancho']} px" if p.get("ancho") else ("600 px" if slug_p in ("atomic-150", "austral") else "")
            if p.get("desviacion_encuadre_px") not in ("", "0", None):
                motivo = (motivo + " · " if motivo else "") + f"encuadre propio ({p['desviacion_encuadre_px']} px respecto a la base): calibración propia"
            delante = "foto real" if real else ("recoloreado" if estado.startswith("Recoloreado") else "foto del color predeterminado")
            detras = "—" if not tiene_detras else ("foto real" if real_detras else ("recoloreado" if estado.startswith("Recoloreado") else "foto del color predeterminado"))
            filas.append((nombres.get(slug_p, slug_p), color, delante, detras, tam, estado, motivo))
    total = sum(resumen.values())
    lineas = [
        f"# Revisión de color · fase 10 ({FECHA})",
        "",
        "Una hoja de contactos por producto (`<slug>.jpg`: todos sus colores, delante y detrás, a 560 px, el tamaño de la ficha en escritorio, con el diseño de ejemplo dibujado como lo dibuja el navegador) y, en `etiquetas/`, la zona del cuello de cada foto delantera antes y después de retocar la etiqueta del fabricante (solo los productos que la enseñan). Revisadas a ojo imagen por imagen: foto del color correcto y de la vista correcta, etiqueta retocada sin rastro, diseño de ejemplo bien colocado y encuadre coherente entre colores.",
        "",
        f"Resumen: {total} entradas de color en {len(indice)} productos · {resumen['real']} con foto real · {resumen['recoloreado']} recoloreadas (sin foto real en el proveedor) · {resumen['sin foto']} sin foto propia (se enseña otra del mismo producto). Las fotos del proveedor son de 600 × 600 px (460 × 460 en Crest verde y azul y en 7 colores de Tarek): no se amplían.",
        "",
        "| Producto | Color | Delante | Detrás | Foto | Estado | Notas |",
        "| --- | --- | --- | --- | --- | --- | --- |",
    ]
    for f in filas:
        lineas.append("| " + " | ".join(f) + " |")
    with open(SALIDA, "w", encoding="utf-8", newline="\n") as fh:
        fh.write("\n".join(lineas) + "\n")
    print(f"{SALIDA}: {total} filas · {dict(resumen)}")


if __name__ == "__main__":
    main()
