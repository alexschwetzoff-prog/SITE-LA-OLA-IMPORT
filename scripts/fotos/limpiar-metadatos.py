"""Metadatos de las imágenes publicadas (fase 10): lista los bloques EXIF, XMP, IPTC, ICC y de texto de todas las
imágenes de public/ (WebP, JPEG y PNG) y, con --limpiar, los quita sin recomprimir nada (solo se reescribe el
contenedor: RIFF, segmentos APP o chunks PNG). Las fotos del pipeline ya salen sin metadatos (Pillow escribe los
arrays limpios); esto lo comprueba y deja constancia en docs/FOTOS-REVISION.md.
Uso: python -I -X utf8 scripts/fotos/limpiar-metadatos.py [--limpiar]"""
import os
import struct
import sys

RAIZ = "public"
limpiar = "--limpiar" in sys.argv


def chunks_webp(datos):
    assert datos[:4] == b"RIFF" and datos[8:12] == b"WEBP"
    pos = 12
    salida = []
    while pos + 8 <= len(datos):
        fourcc = datos[pos : pos + 4]
        tam = struct.unpack("<I", datos[pos + 4 : pos + 8])[0]
        salida.append((fourcc, pos, tam))
        pos += 8 + tam + (tam & 1)
    return salida


def limpiar_webp(datos):
    """Quita EXIF, XMP e ICCP de un WebP sin tocar el bitstream; con VP8X, apaga los bits y, si no queda nada
    extendido (ni alfa ni animación), deja el contenedor como está (VP8X se conserva: es válido)."""
    chunks = chunks_webp(datos)
    quitar = {b"EXIF", b"XMP ", b"ICCP"}
    if not any(c[0] in quitar for c in chunks):
        return None
    cuerpo = bytearray()
    for fourcc, pos, tam in chunks:
        if fourcc in quitar:
            continue
        trozo = bytearray(datos[pos : pos + 8 + tam + (tam & 1)])
        if fourcc == b"VP8X":
            trozo[8] &= ~(0x20 | 0x08 | 0x04)  # ICC, EXIF, XMP
        cuerpo += trozo
    return b"RIFF" + struct.pack("<I", 4 + len(cuerpo)) + b"WEBP" + bytes(cuerpo)


def segmentos_jpeg(datos):
    assert datos[:2] == b"\xff\xd8"
    pos = 2
    salida = []
    while pos + 4 <= len(datos):
        if datos[pos] != 0xFF:
            break
        marcador = datos[pos + 1]
        if marcador == 0xDA:  # SOS: a partir de aquí van los datos
            salida.append((marcador, pos, len(datos) - pos))
            break
        tam = struct.unpack(">H", datos[pos + 2 : pos + 4])[0]
        salida.append((marcador, pos, tam + 2))
        pos += 2 + tam
    return salida


def limpiar_jpeg(datos):
    """Quita APP1 (EXIF/XMP), APP2 (ICC), APP13 (IPTC) y COM sin recomprimir. Se conserva APP0 (JFIF) y APP14 (Adobe)."""
    segs = segmentos_jpeg(datos)
    quitar = {0xE1, 0xE2, 0xED, 0xFE}
    if not any(m in quitar for m, _, _ in segs):
        return None
    salida = bytearray(b"\xff\xd8")
    for m, pos, tam in segs:
        if m in quitar:
            continue
        salida += datos[pos : pos + tam]
    return bytes(salida)


def chunks_png(datos):
    assert datos[:8] == b"\x89PNG\r\n\x1a\n"
    pos = 8
    salida = []
    while pos + 8 <= len(datos):
        tam = struct.unpack(">I", datos[pos : pos + 4])[0]
        tipo = datos[pos + 4 : pos + 8]
        salida.append((tipo, pos, tam))
        pos += 12 + tam
    return salida


def limpiar_png(datos):
    quitar = {b"tEXt", b"iTXt", b"zTXt", b"eXIf", b"iCCP", b"tIME"}
    chunks = chunks_png(datos)
    if not any(t in quitar for t, _, _ in chunks):
        return None
    salida = bytearray(datos[:8])
    for t, pos, tam in chunks:
        if t in quitar:
            continue
        salida += datos[pos : pos + 12 + tam]
    return bytes(salida)


resumen = {"webp": 0, "jpg": 0, "png": 0, "otros": 0}
con_metadatos = []
for carpeta, _, archivos in os.walk(RAIZ):
    for nombre in archivos:
        ruta = os.path.join(carpeta, nombre)
        ext = nombre.lower().rsplit(".", 1)[-1]
        datos = open(ruta, "rb").read()
        detalle = None
        nuevo = None
        if ext == "webp":
            resumen["webp"] += 1
            tipos = [c[0].decode("latin1") for c in chunks_webp(datos)]
            extra = [t for t in tipos if t in ("EXIF", "XMP ", "ICCP")]
            if extra:
                detalle = "webp: " + ", ".join(extra)
                nuevo = limpiar_webp(datos)
        elif ext in ("jpg", "jpeg"):
            resumen["jpg"] += 1
            segs = [m for m, _, _ in segmentos_jpeg(datos)]
            extra = [hex(m) for m in segs if m in (0xE1, 0xE2, 0xED, 0xFE)]
            if extra:
                detalle = "jpeg: " + ", ".join(extra)
                nuevo = limpiar_jpeg(datos)
        elif ext == "png":
            resumen["png"] += 1
            tipos = [t.decode("latin1") for t, _, _ in chunks_png(datos)]
            extra = [t for t in tipos if t in ("tEXt", "iTXt", "zTXt", "eXIf", "iCCP", "tIME")]
            if extra:
                detalle = "png: " + ", ".join(extra)
                nuevo = limpiar_png(datos)
        else:
            resumen["otros"] += 1
        if detalle:
            con_metadatos.append((ruta, detalle))
            if limpiar and nuevo:
                open(ruta, "wb").write(nuevo)
print(f"imágenes revisadas: {resumen}")
print(f"con metadatos: {len(con_metadatos)}" + (" (limpiadas)" if limpiar else ""))
for ruta, detalle in con_metadatos:
    print(f"  {ruta}: {detalle}")
