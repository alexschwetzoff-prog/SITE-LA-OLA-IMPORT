"""Geometría común de los scripts de fotos (fase 4.4): transformaciones afines sencillas, caja del objeto y el paso
caja → caja entre dos encuadres (fase 4.3), que ahora también lleva la geometría medida a mano sobre las fotos de
600 px de la fase 4.1 a las fotos hd de la fase 4.4.
"""
import numpy as np

TOLERANCIA_ENCUADRE = 1.0  # px por cada 600 px de foto: hasta aquí dos cajas son el mismo encuadre


class Transformacion:
    """x' = x·sx + dx ; y' = y·sy + dy (identidad por defecto)."""

    def __init__(self, sx=1.0, sy=1.0, dx=0.0, dy=0.0):
        self.sx, self.sy, self.dx, self.dy = sx, sy, dx, dy

    @property
    def identidad(self):
        return self.sx == 1 and self.sy == 1 and self.dx == 0 and self.dy == 0

    def punto(self, p):
        return (p[0] * self.sx + self.dx, p[1] * self.sy + self.dy)

    def puntos(self, lista):
        return [self.punto(p) for p in lista]

    def rect(self, r):
        x0, y0 = self.punto((r[0], r[1]))
        x1, y1 = self.punto((r[2], r[3]))
        return (int(round(x0)), int(round(y0)), int(round(x1)), int(round(y1)))

    def luego(self, otra):
        """La composición: primero esta, luego `otra`."""
        return Transformacion(self.sx * otra.sx, self.sy * otra.sy, self.dx * otra.sx + otra.dx, self.dy * otra.sy + otra.dy)

    def __repr__(self):
        return f"Transformacion(sx={self.sx:.4f}, sy={self.sy:.4f}, dx={self.dx:.1f}, dy={self.dy:.1f})"


def caja(mascara):
    ys, xs = np.where(mascara)
    return (int(xs.min()), int(ys.min()), int(xs.max()), int(ys.max()))


def mapa_cajas(caja_base, caja_foto, tolerancia=None):
    """Transformación que lleva la caja del objeto en la foto base a la de otra foto (identidad si coinciden). La
    tolerancia por defecto es TOLERANCIA_ENCUADRE por cada 600 px de anchura de la caja de destino."""
    if tolerancia is None:
        tolerancia = TOLERANCIA_ENCUADRE * max(1.0, (caja_foto[2] - caja_foto[0]) / 600.0)
    if all(abs(a - b) <= tolerancia for a, b in zip(caja_base, caja_foto)):
        return Transformacion()
    sx = (caja_foto[2] - caja_foto[0]) / max(1, caja_base[2] - caja_base[0])
    sy = (caja_foto[3] - caja_foto[1]) / max(1, caja_base[3] - caja_base[1])
    return Transformacion(sx, sy, caja_foto[0] - caja_base[0] * sx, caja_foto[1] - caja_base[1] * sy)


def escala_uniforme(ancho_origen, ancho_destino):
    """Transformación de un simple cambio de tamaño (la misma foto a otra resolución)."""
    s = ancho_destino / ancho_origen
    return Transformacion(s, s, 0.0, 0.0)


def normalizacion(caja_foto, caja_ref, modo, umbral_escala=0.008, umbral_px=2.0):
    """Transformación (uniforme, en px de la foto) que lleva la caja del objeto de una foto a la de su referencia
    (fase 10: el mismo encuadre entre los colores de un producto y entre la vista delantera y la trasera).
    `modo`: 'alto' (escala por la altura de la caja y centros alineados: prendas, que el proveedor encuadra a la
    altura), 'ancho' (escala por la anchura: bolsas, traseras de las gorras) o 'centro' (sin escala, solo centrar).
    Devuelve la identidad si la diferencia no llega a `umbral_escala` (relativa) ni a `umbral_px` (centros)."""
    wf, hf = caja_foto[2] - caja_foto[0] + 1, caja_foto[3] - caja_foto[1] + 1
    wr, hr = caja_ref[2] - caja_ref[0] + 1, caja_ref[3] - caja_ref[1] + 1
    if modo == "alto":
        s = hr / max(1, hf)
    elif modo == "ancho":
        s = wr / max(1, wf)
    else:
        s = 1.0
    if abs(s - 1) <= umbral_escala:
        s = 1.0
    cxf, cyf = (caja_foto[0] + caja_foto[2]) / 2, (caja_foto[1] + caja_foto[3]) / 2
    cxr, cyr = (caja_ref[0] + caja_ref[2]) / 2, (caja_ref[1] + caja_ref[3]) / 2
    dx, dy = cxr - cxf * s, cyr - cyf * s
    if s == 1.0 and abs(dx) <= umbral_px and abs(dy) <= umbral_px:
        return Transformacion()
    return Transformacion(s, s, dx, dy)
