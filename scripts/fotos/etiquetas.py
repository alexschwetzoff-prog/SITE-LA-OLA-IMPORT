"""Etiqueta del fabricante en el cuello: detección foto a foto y retoque (fase 4.3; fase 10: detección más robusta y
relleno por clonado de Poisson). Común a los scripts de fotos.

Hasta la fase 4.2 cada producto llevaba un rectángulo medido a mano sobre su única foto. Con una foto real por color,
la etiqueta cambia de aspecto (blanca sobre tela de color, negra con el logo en blanco sobre tela oscura, tinta oscura
sobre tela clara) y a veces de sitio (las fotos de Jamaica no comparten encuadre), así que se detecta en cada foto:

  1. Dentro de una zona del cuello (rectángulo generoso por producto, en px de la foto) se mide el color típico de la
     tela (mediana en Lab de la prenda, o de todo lo que no es fondo blanco cuando la máscara no llega: en una prenda
     blanca de tirantes el interior del escote se confunde con el fondo).
  2. Es etiqueta lo que se aparta mucho de la tela (ΔE > UMBRAL_DE): la etiqueta blanca sobre tela de color, la
     tinta o el logo sobre la etiqueta, el cuerpo negro de las etiquetas tejidas sobre tela clara. Las sombras del
     cuello y las costuras se apartan menos y no entran. El fondo blanco puro nunca cuenta. En las telas jaspeadas
     (gris vigoré) las motas oscuras de la veta se apartan también: ahí el umbral sube y el mapa se filtra con una
     mediana (fase 10: antes la veta encadenaba motas y la etiqueta de la Jamaica gris no se detectaba).
  3. Las manchas vecinas (logo, talla, borde) se unen y se toma su rectángulo. Si lo unido es más grande que una
     etiqueta (la sombra del cuello se ha pegado), se repite con un umbral más alto. El rectángulo crece después
     por cada lado mientras la fila o columna vecina siga apartándose de la tela más que la tela de alrededor (el
     borde de la etiqueta, su sombra; en una etiqueta blanca sobre tela blanca, una línea tenue), pero nunca hacia
     el fondo blanco ni hacia una banda que se aparte también a ambos lados del rectángulo (el ribete del cuello, una
     costura): fase 10, antes se colaba por encima del escote en Andre y Bahrain y dejaba fuera la sombra.
  4. Relleno (fase 10): clonado de Poisson. Se copia un parche de tela vecina del mismo tamaño (de debajo, de encima,
     de los lados, o el espejo de la franja de un lado) pero solo sus gradientes: la solución de Poisson con el
     contorno del rectángulo fijo lleva la luz y el color de alrededor al interior y conserva la textura y las
     costuras finas de la tela real; sin manchas lisas ni bordes. Los puntos del contorno que no son tela (fondo,
     borde del escote, un resto de etiqueta) quedan libres: ahí el relleno continúa la fuente. Si no hay tela vecina
     que valga, se vuelve al relleno de Laplace (fases 4.3 y 4.4) con la textura real de una franja vecina repetida
     en espejo.

La detección se revisa a ojo con las hojas de docs/revision-colores/etiquetas/ (zona del cuello antes y después).
"""
import numpy as np
from scipy import ndimage
from scipy.sparse import coo_matrix
from scipy.sparse.linalg import spsolve

UMBRAL_DE = 30.0  # distancia en Lab a partir de la cual un píxel no es tela
UMBRAL_DE_JASPEADO = 42.0  # en gris vigoré las motas de la veta llegan a ΔE 30-38
AREA_MINIMA = 12  # px de mancha (la etiqueta de Clásica es una pestaña de unos 11 × 8 px con un logo de pocos píxeles)
MOTA = 4  # px: manchas más pequeñas son ruido
HALO = 4.0  # ΔE por encima de los flancos con el que una fila o columna vecina sigue siendo etiqueta o su sombra
HALO_CLARO = 2.5  # en telas muy claras (L* > 85) la sombra de la etiqueta es tenue
CRECER = 12  # px máximos de crecimiento por lado
MARGEN = 2  # px de margen fijo tras el crecimiento
UMBRAL_CONTORNO = 22.0  # ΔE a partir del cual un punto del contorno del parche no es tela y no manda en el relleno
TAMANO_MAXIMO = (60, 80)  # ancho, alto máximos del rectángulo (más grande no es una etiqueta: es el cuello pegado)
TAMANO_MINIMO = (6, 6)
LUM_FONDO = 250.5  # luminancia a partir de la cual un píxel es fondo blanco (nunca es etiqueta)
LUM_TELA_MAX = 253.5  # un parche de tela, aunque sea blanca, no llega al blanco puro del fondo
HUECO_CLON = 3  # px de separación entre el rectángulo y el parche de tela que se clona
CONTORNO_MINIMO = 0.5  # fracción del contorno que tiene que ser tela para clonar; si no, relleno de Laplace
COSTURA_MIN = 30.0  # residuo de alta frecuencia a partir del cual un parche trae una costura o un pliegue fuerte (mínimo; sube con la textura de la tela)
LUZ_PROPIA_MAX = 6.0  # luminancia (0-255): un parche con más degradado que esto solo aporta su textura, no su luz

# Fase 4.4: las medidas en píxeles de arriba se calibraron en fotos de 600 px; con las fotos hd se escalan con
# ESCALA = ancho de la foto / 600 (lo fija cada script antes de procesar cada foto, igual que en recolor.py).
ESCALA = 1.0


def fijar_escala(escala):
    global ESCALA
    ESCALA = float(escala)


def px(valor):
    return max(1, int(round(valor * ESCALA)))


M_RGB_XYZ = np.array([[0.4124564, 0.3575761, 0.1804375], [0.2126729, 0.7151522, 0.0721750], [0.0193339, 0.1191920, 0.9503041]])
BLANCO_D65 = np.array([0.95047, 1.0, 1.08883])


def _lab(rgb):
    c = np.asarray(rgb, dtype=np.float64) / 255.0
    lin = np.where(c <= 0.04045, c / 12.92, ((c + 0.055) / 1.055) ** 2.4)
    xyz = lin @ M_RGB_XYZ.T / BLANCO_D65
    f = np.where(xyz > 0.008856, np.cbrt(np.maximum(xyz, 1e-9)), 7.787 * xyz + 16.0 / 116.0)
    return np.stack([116 * f[..., 1] - 16, 500 * (f[..., 0] - f[..., 1]), 200 * (f[..., 1] - f[..., 2])], axis=-1)


def _luminancia(rgb):
    a = np.asarray(rgb, dtype=np.float64)
    return 0.299 * a[..., 0] + 0.587 * a[..., 1] + 0.114 * a[..., 2]


def _mejor_mancha(candidatos, tam_max, tam_min, area_minima):
    """Une las manchas vecinas y devuelve (puntuación, x0, y0, x1, y1) de la más centrada y mayor que cabe en una
    etiqueta, o None."""
    unidos = ndimage.binary_dilation(candidatos, iterations=px(4))
    et, n = ndimage.label(unidos)
    mejor = None
    for e in range(1, n + 1):
        comp = (et == e) & candidatos
        area = int(comp.sum())
        if area < area_minima:
            continue
        ys, xs = np.where(comp)
        bw, bh = xs.max() - xs.min() + 1, ys.max() - ys.min() + 1
        if bw > tam_max[0] or bh > tam_max[1] or bw < tam_min[0] or bh < tam_min[1]:
            continue
        # la etiqueta está cerca del eje de la zona: se prefiere la mancha más centrada y mayor
        cx = (xs.min() + xs.max()) / 2
        puntuacion = area - 2.0 * abs(cx - candidatos.shape[1] / 2)
        if mejor is None or puntuacion > mejor[0]:
            mejor = (puntuacion, int(xs.min()), int(ys.min()), int(xs.max()) + 1, int(ys.max()) + 1)
    return mejor


def detectar(a, mascara, zona, jaspeado=False):
    """Rectángulo (x0, y0, x1, y1) de la etiqueta dentro de `zona` (x0, y0, x1, y1), o None si no se ve ninguna."""
    h, w = mascara.shape
    zx0, zy0, zx1, zy1 = max(0, zona[0]), max(0, zona[1]), min(w, zona[2]), min(h, zona[3])
    sub = a[zy0:zy1, zx0:zx1].astype(np.float64)
    if sub.size == 0:
        return None
    dentro = ndimage.binary_erosion(mascara, iterations=px(3), border_value=0)[zy0:zy1, zx0:zx1]
    no_fondo = _luminancia(sub) < LUM_FONDO
    area_minima = AREA_MINIMA * ESCALA * ESCALA
    mota = MOTA * ESCALA * ESCALA
    tam_max = (TAMANO_MAXIMO[0] * ESCALA, TAMANO_MAXIMO[1] * ESCALA)
    tam_min = (TAMANO_MINIMO[0] * ESCALA, TAMANO_MINIMO[1] * ESCALA)
    # la tela de referencia: la prenda dentro de la zona; si la máscara no llega (prenda blanca cuyo escote se
    # confunde con el fondo), todo lo que no es fondo blanco
    referencia = dentro if dentro.sum() >= 100 * ESCALA * ESCALA else no_fondo
    if referencia.sum() < 100 * ESCALA * ESCALA:
        return None
    lab = _lab(sub)
    tela = np.median(lab[referencia], axis=0)
    de = np.sqrt(((lab - tela) ** 2).sum(axis=-1))
    umbral = UMBRAL_DE
    if jaspeado:
        de = ndimage.median_filter(de, size=3)
        umbral = UMBRAL_DE_JASPEADO
    buscar = dentro | no_fondo
    # el cuerpo blanco de una etiqueta puede haber quedado fuera de la máscara del objeto (el blanco puro cuenta como
    # fondo en recolor.mascara_objeto): los huecos de la máscara dentro de la zona también son etiqueta
    mz = mascara[zy0:zy1, zx0:zx1]
    huecos = ndimage.binary_fill_holes(mz) & ~mz
    mejor = None
    for factor in (1.0, 1.5, 2.2):
        candidatos = ((de > umbral * factor) & buscar) | huecos
        # motas sueltas fuera (sin apertura morfológica: borraría los trazos finos del logo)
        et0, n0 = ndimage.label(candidatos)
        if n0:
            tam = ndimage.sum(candidatos, et0, range(1, n0 + 1))
            candidatos &= np.isin(et0, [i + 1 for i, t in enumerate(tam) if t >= mota])
        if candidatos.sum() < area_minima:
            break
        mejor = _mejor_mancha(candidatos, tam_max, tam_min, area_minima)
        if mejor is not None:
            break
        # nada cabe en una etiqueta: lo unido es demasiado grande (la sombra del escote se ha pegado): umbral más alto
    if mejor is None:
        return None
    _, x0, y0, x1, y1 = mejor
    H, W = de.shape
    flanco = px(8)
    # la tela local: la que rodea a la mancha (en una prenda blanca de tirantes, el interior del escote queda en
    # sombra y la etiqueta blanca se distingue de él, no del blanco de la prenda); desde aquí ΔE es respecto a ella
    cerca = np.zeros_like(buscar)
    cy0, cy1, cx0, cx1 = max(0, y0 - px(12)), min(H, y1 + px(12)), max(0, x0 - px(12)), min(W, x1 + px(12))
    cerca[cy0:cy1, cx0:cx1] = True
    cerca[y0:y1, x0:x1] = False
    cerca &= buscar
    if cerca.sum() >= 40 * ESCALA * ESCALA:
        tela_local = np.median(lab[cerca], axis=0)
        de = np.sqrt(((lab - tela_local) ** 2).sum(axis=-1))
        if jaspeado:
            de = ndimage.median_filter(de, size=3)

    halo = HALO_CLARO if (tela_local[0] if cerca.sum() >= 40 * ESCALA * ESCALA else tela[0]) > 85 else HALO

    def contraste_fila(y):
        """Cuánto se aparta la fila `y` dentro de las columnas del rectángulo respecto a sus flancos: positivo en el
        borde de la etiqueta y su sombra; nulo en una banda (el ribete, una costura) o en tela lisa."""
        izq = de[y, max(0, x0 - flanco) : x0]
        der = de[y, x1 : min(W, x1 + flanco)]
        centro = de[y, x0:x1]
        if izq.size < 2 or der.size < 2 or not centro.size:
            return 0.0
        return float(centro.mean() - (izq.mean() + der.mean()) / 2)

    def contraste_columna(x):
        arr = de[max(0, y0 - flanco) : y0, x]
        aba = de[y1 : min(H, y1 + flanco), x]
        centro = de[y0:y1, x]
        if arr.size < 2 or aba.size < 2 or not centro.size:
            return 0.0
        return float(centro.mean() - (arr.mean() + aba.mean()) / 2)

    def es_banda(y):
        """Fila que se aparta de la tela por igual dentro y fuera del rectángulo: el ribete del cuello o una costura."""
        return float(de[y, x0:x1].mean()) > UMBRAL_DE / 2 and contraste_fila(y) < halo

    # crecimiento: el borde de la etiqueta y su sombra (se apartan más que sus flancos), nunca el fondo ni una banda
    for _ in range(px(CRECER)):
        creció = False
        if y0 > 0 and buscar[y0 - 1, x0:x1].mean() > 0.9 and contraste_fila(y0 - 1) > halo and y1 - y0 < tam_max[1]:
            y0, creció = y0 - 1, True
        if y1 < H and buscar[y1, x0:x1].mean() > 0.9 and contraste_fila(y1) > halo and y1 - y0 < tam_max[1]:
            y1, creció = y1 + 1, True
        if x0 > 0 and buscar[y0:y1, x0 - 1].mean() > 0.9 and contraste_columna(x0 - 1) > halo and x1 - x0 < tam_max[0]:
            x0, creció = x0 - 1, True
        if x1 < W and buscar[y0:y1, x1].mean() > 0.9 and contraste_columna(x1) > halo and x1 - x0 < tam_max[0]:
            x1, creció = x1 + 1, True
        if not creció:
            break
    m = px(MARGEN)
    x0, y0, x1, y1 = max(0, x0 - m), max(0, y0 - m), min(W, x1 + m), min(H, y1 + m)
    # el margen no sale de la prenda ni se come el ribete del cuello
    while y1 - y0 > tam_min[1] and (buscar[y0, x0:x1].mean() < 0.5 or es_banda(y0)):
        y0 += 1
    while y1 - y0 > tam_min[1] and (buscar[y1 - 1, x0:x1].mean() < 0.5 or es_banda(y1 - 1)):
        y1 -= 1
    while x1 - x0 > tam_min[0] and buscar[y0:y1, x0].mean() < 0.5:
        x0 += 1
    while x1 - x0 > tam_min[0] and buscar[y0:y1, x1 - 1].mean() < 0.5:
        x1 -= 1
    x0, y0, x1, y1 = x0 + zx0, y0 + zy0, x1 + zx0, y1 + zy0
    return (max(px(10), x0), max(1, y0), min(w - px(10), x1), min(h - 1, y1))


# ---------------------------------------------------------------------------------------------
# Relleno
# ---------------------------------------------------------------------------------------------
def _poisson(dest, fuente, fijo):
    """Resuelve Δf = Δfuente en el interior del parche con f = dest en el contorno donde `fijo` (Dirichlet) y
    gradiente libre donde no (el contorno continúa la fuente). `dest` y `fuente` son (H, W, 3) con el anillo de 1 px
    incluido; `fijo` es (H, W) y solo cuenta en el anillo. Devuelve el interior (H-2, W-2, 3)."""
    H, W = fijo.shape
    h, w = H - 2, W - 2
    n = h * w
    ids = -np.ones((H, W), dtype=np.int64)
    ids[1:-1, 1:-1] = np.arange(n).reshape(h, w)
    interior = ids >= 0
    filas, cols, vals = [], [], []
    diag = np.zeros(n)
    b = np.zeros((n, 3))
    pi = ids[interior]
    p_fuente = fuente[interior]
    for dy, dx in ((-1, 0), (1, 0), (0, -1), (0, 1)):
        q_ids = np.roll(np.roll(ids, -dy, axis=0), -dx, axis=1)[interior]
        q_fijo = np.roll(np.roll(fijo, -dy, axis=0), -dx, axis=1)[interior]
        q_dest = np.roll(np.roll(dest, -dy, axis=0), -dx, axis=1)[interior]
        q_fuente = np.roll(np.roll(fuente, -dy, axis=0), -dx, axis=1)[interior]
        es_interior = q_ids >= 0
        # vecino interior: término de la matriz y gradiente de la fuente
        filas.append(pi[es_interior])
        cols.append(q_ids[es_interior])
        vals.append(-np.ones(int(es_interior.sum())))
        diag[pi[es_interior]] += 1
        b[pi[es_interior]] += p_fuente[es_interior] - q_fuente[es_interior]
        # vecino del contorno fijo: pasa al término independiente
        borde_fijo = ~es_interior & q_fijo
        diag[pi[borde_fijo]] += 1
        b[pi[borde_fijo]] += p_fuente[borde_fijo] - q_fuente[borde_fijo] + q_dest[borde_fijo]
        # vecino del contorno libre: no aporta ecuación (gradiente libre)
    sin_ecuacion = diag == 0
    diag[sin_ecuacion] = 1.0
    b[sin_ecuacion] = p_fuente[sin_ecuacion]
    filas.append(pi)
    cols.append(pi)
    vals.append(diag)
    A = coo_matrix((np.concatenate(vals), (np.concatenate(filas), np.concatenate(cols))), shape=(n, n)).tocsc()
    x = spsolve(A, b)
    return np.asarray(x).reshape(h, w, 3)


def _amplitud(parche):
    """Amplitud del residuo de alta frecuencia (textura, costuras) de un parche: percentil 99,5 del máximo por canal."""
    suave = ndimage.gaussian_filter(parche, (2.0 * ESCALA, 2.0 * ESCALA, 0))
    return float(np.percentile(np.abs(parche - suave).max(axis=-1), 99.5))


def _desajuste_contorno(parche, anillo, fijo):
    """Cuánto difiere la forma de la luz del parche de la del contorno del rectángulo (en luminancia, quitada la
    diferencia media, solo en los puntos fijos del anillo): un parche que trae el borde del escote o un pliegue que
    el contorno no tiene desajusta mucho, aunque sea del mismo color."""
    # el anillo como secuencia (arriba, derecha, abajo, izquierda), suavizada a lo largo del contorno (nunca hacia el
    # interior: ahí está la etiqueta en el destino)
    def secuencia(x):
        lum = _luminancia(x)
        return np.concatenate([lum[0, :], lum[1:, -1], lum[-1, -2::-1], lum[-2:0:-1, 0]])

    def mascara_seq(f):
        return np.concatenate([f[0, :], f[1:, -1], f[-1, -2::-1], f[-2:0:-1, 0]])

    sel = mascara_seq(fijo)
    if sel.sum() < 8:
        return 0.0
    lp = ndimage.gaussian_filter1d(secuencia(parche), 2.0 * ESCALA, mode="wrap")[sel]
    la = ndimage.gaussian_filter1d(secuencia(anillo), 2.0 * ESCALA, mode="wrap")[sel]
    return float(np.mean(np.abs((lp - lp.mean()) - (la - la.mean()))))


DESAJUSTE_BASE = 6.0  # luminancia (0-255): por encima (más la tolerancia por la textura de la tela), el parche no sirve


def _vale_parche(parche, m, tela, costura_max, anillo=None, fijo=None):
    """(puntuación o None) de un parche candidato con su anillo: dentro de la prenda (o tela blanca que no llega al
    blanco del fondo), del color de la tela, sin costuras marcadas y con la misma forma de luz que el contorno."""
    lum = _luminancia(parche)
    if m.mean() < 0.995 and float(np.percentile(lum, 99)) > LUM_TELA_MAX:
        return None
    de = np.sqrt(((_lab(parche) - tela) ** 2).sum(axis=-1))
    if (de < UMBRAL_CONTORNO).mean() < 0.97:
        return None  # trae otra cosa (borde del escote, otra etiqueta, fondo)
    costura = _amplitud(parche)
    if costura > costura_max:
        return None  # una costura o un pliegue fuerte se clonaría tal cual
    desajuste = _desajuste_contorno(parche, anillo, fijo) if anillo is not None else 0.0
    if desajuste > DESAJUSTE_BASE + 0.12 * costura_max:
        return None
    return float(np.median(de)) + 0.25 * costura + 1.5 * desajuste


def _costura_y(franja, mascara):
    """Fila de la costura (la más oscura de la mitad de arriba) en una franja, o None si no destaca."""
    H = franja.shape[0]
    tope = max(3, int(round(H * 0.5)))
    lum = _luminancia(franja[:tope])
    m = mascara[:tope] if mascara is not None else np.ones(lum.shape, dtype=bool)
    perfil = np.array([lum[i][m[i]].mean() if m[i].any() else np.nan for i in range(tope)])
    if np.isnan(perfil).all():
        return None
    perfil = np.where(np.isnan(perfil), np.nanmax(perfil), perfil)
    suave = ndimage.gaussian_filter1d(perfil, 1.0 * ESCALA, mode="nearest")
    y = int(np.argmin(suave))
    profundidad = float(np.max(suave) - suave[y])
    return y if profundidad >= 3.0 else None


def _costura_perfil(franja, mascara):
    """Fila de la costura en cada columna de la mitad de arriba (con suavizado horizontal), o NaN. La costura es un
    valle de luminancia: se queda la fila que más sobresale como valle (lo que la superan el máximo de arriba y el de
    abajo), no la más oscura, porque dentro de un escote la tela se oscurece hacia abajo y la más oscura es el borde."""
    H, W = franja.shape[:2]
    tope = max(3, int(round(H * 0.5)))
    lum = _luminancia(franja[:tope]).astype(np.float64)
    m = mascara[:tope] if mascara is not None else np.ones(lum.shape, dtype=bool)
    lum = np.where(m, lum, np.nan)
    lum = np.where(np.isnan(lum), np.nanmax(lum) if not np.isnan(lum).all() else 0.0, lum)
    suave = ndimage.gaussian_filter(lum, (1.0 * ESCALA, 2.5 * ESCALA))
    arriba = np.maximum.accumulate(suave, axis=0)
    abajo = np.maximum.accumulate(suave[::-1], axis=0)[::-1]
    prominencia = np.minimum(arriba, abajo) - suave
    y = np.argmax(prominencia, axis=0)
    cols = np.arange(W)
    yf = y.astype(np.float64)
    yf[(prominencia[y, cols] < 2.0) | (y < 1) | (y > tope - 2)] = np.nan
    return yf




def _perfil_borde(franja, mascara, zona):
    """Fila, columna a columna, del borde más marcado: en la mitad de arriba el salto de claro a oscuro bajando (el borde
    del cuello) y en la de abajo el de oscuro a claro (el borde del ribete). NaN donde no destaca."""
    H, W = franja.shape[:2]
    if zona == "arriba":
        ini, fin = 0, max(3, int(round(H * 0.5)))
    else:
        ini, fin = int(round(H * 0.45)), H
    if fin - ini < 6:
        return np.full(W, np.nan)
    lum = _luminancia(franja[ini:fin]).astype(np.float64)
    m = mascara[ini:fin] if mascara is not None else np.ones(lum.shape, dtype=bool)
    lum = np.where(m, lum, np.nan)
    relleno = np.nanmean(lum) if not np.isnan(lum).all() else 0.0
    lum = np.where(np.isnan(lum), relleno, lum)
    suave = ndimage.gaussian_filter(lum, (1.0 * ESCALA, 2.5 * ESCALA))
    d = np.diff(suave, axis=0) * (-1.0 if zona == "arriba" else 1.0)
    if d.shape[0] < 3:
        return np.full(W, np.nan)
    i = np.argmax(d, axis=0)
    fuerza = d[i, np.arange(W)]
    y = ini + i.astype(np.float64) + 0.5
    y[fuerza < 1.5] = np.nan
    return y


def _curva_hermite(pi, pd, W, con_pendiente=True):
    """Curva (fila en cada columna de la caja) que continúa un borde medido en la franja izquierda reflejada (`pi`,
    columna 0 pegada a la caja) y en la derecha reflejada (`pd`, columna W-1 pegada a la caja), con el valor y la
    pendiente de cada lado junto a la caja (Hermite cúbica). Devuelve (curva, ajuste izq (a, b), ajuste der) o None."""
    k = max(4, W // 3)
    ji = np.arange(W)[~np.isnan(pi)]
    ji = ji[ji < k]
    jd = np.arange(W)[~np.isnan(pd)]
    jd = jd[jd >= W - k]
    if len(ji) < 4 or len(jd) < 4:
        return None
    ai, bi = np.polyfit(ji, pi[ji], 1)  # franja izq: la columna j está a j + 1 px a la izquierda de la caja
    ad, bd = np.polyfit(jd, pd[jd], 1)  # franja der: la columna j está a W - j px a la derecha
    y_izq, y_der = bi - ai, bd + ad * W  # extrapolados al borde de la caja
    m_izq, m_der = (-ai, -ad) if con_pendiente else (0.0, 0.0)  # pendiente real (x hacia la derecha): la reflexión invierte el signo
    if abs(y_izq - y_der) > px(10):
        return None
    t = np.arange(W) / W
    curva = (2 * t**3 - 3 * t**2 + 1) * y_izq + (t**3 - 2 * t**2 + t) * W * m_izq + (-2 * t**3 + 3 * t**2) * y_der + (t**3 - t**2) * W * m_der
    return curva, (ai, bi), (ad, bd)


def _desplazar_2d(franja, mascara, desplazamientos):
    """Desplaza cada píxel verticalmente según `desplazamientos` (H, W), replicando el borde."""
    H, W = franja.shape[:2]
    filas = np.clip(np.arange(H)[:, None] - np.asarray(desplazamientos), 0, H - 1)
    cols = np.arange(W)[None, :].repeat(H, axis=0)
    return franja[filas, cols], (mascara[filas, cols] if mascara is not None else None)


def _desplazar_columnas(franja, mascara, desplazamientos, desde_tela=False):
    """Desplaza cada columna verticalmente (cizalla), replicando el borde. Con `desde_tela`, lo que falta por arriba
    al bajar una columna replica su primera fila de tela (sin el borde antialiasado), nunca el fondo."""
    H, W = franja.shape[:2]
    filas = np.arange(H)[:, None] - np.asarray(desplazamientos)[None, :]
    suelo = np.zeros(W, dtype=int)
    if desde_tela and mascara is not None:
        hay = mascara.any(axis=0)
        suelo = np.where(hay, np.minimum(mascara.argmax(axis=0) + px(1), H - 1), 0)
    filas = np.clip(filas, suelo[None, :], H - 1)
    cols = np.arange(W)[None, :].repeat(H, axis=0)
    return franja[filas, cols], (mascara[filas, cols] if mascara is not None else None)


def _fundir_franjas(izq, der, m_izq, m_der, curva=False, recorte=(0, 0)):
    """Fuente para el clonado hecha con las dos franjas laterales reflejadas: la costura del cuello de cada lado se
    alinea con una cizalla suave (lineal; con `curva`, siguiendo la parábola de las costuras de los dos lados) (la etiqueta cuelga de esa costura y el relleno tiene que continuarla), la baja
    frecuencia se funde de lado a lado y el grano se parte por el centro (sin promediar texturas)."""
    H, W = izq.shape[:2]
    yi, yd = _costura_y(izq, m_izq), _costura_y(der, m_der)
    salto = (yd - yi) if (yi is not None and yd is not None and abs(yd - yi) <= px(6)) else 0
    t = np.linspace(0.0, 1.0, W)
    # la costura de cada lado, columna a columna, en las coordenadas de la caja (las franjas van reflejadas: la
    # columna 0 de `izq` está pegada al borde izquierdo de la caja; la columna W-1 de `der`, al derecho)
    perfil_i, perfil_d = _costura_perfil(izq, m_izq), _costura_perfil(der, m_der)
    xs = np.concatenate([-1.0 - np.arange(W), W + np.arange(W)[::-1]])
    ys = np.concatenate([perfil_i, perfil_d[::-1]])
    ok = ~np.isnan(ys)
    objetivo = None
    if curva and ok.sum() >= 8 and (~np.isnan(perfil_i)).sum() >= 3 and (~np.isnan(perfil_d)).sum() >= 3:
        # parábola ajustada a las dos costuras (sin los puntos atípicos): dentro de la caja la costura sigue el arco
        # en vez de un pico. Cada franja se desplaza como un bloque (su costura, la mediana de las columnas pegadas a
        # la caja) y se curva solo lo que marca la parábola: nada de escalones columna a columna.
        coef = np.polyfit(xs[ok], ys[ok], 2)
        residuo = np.abs(ys - np.polyval(coef, xs))
        ok2 = ok & (residuo <= px(2.5))
        if ok2.sum() >= 8:
            coef = np.polyfit(xs[ok2], ys[ok2], 2)
        objetivo = np.polyval(coef, np.arange(W))
        cerca_i = np.nanmedian(perfil_i[: max(2, W // 4)])
        cerca_d = np.nanmedian(perfil_d[-max(2, W // 4) :])
        if np.isnan(cerca_i) or np.isnan(cerca_d) or np.nanmax(np.abs(objetivo - np.linspace(cerca_i, cerca_d, W))) > px(5):
            objetivo = None  # ajuste raro: cizalla lineal de siempre
    fila_costura = None
    if objetivo is not None:
        tope = px(6)
        # cada columna de la franja reflejada se lleva de donde la parábola pasa por su posición real (la columna j de
        # `izq` está en -1 - j; la j de `der`, en 2W - 1 - j) a donde pasa dentro de la caja: la reflexión invierte el
        # arco y, desplazando cada lado en bloque, la costura hacía un pico en el centro; así lo continúa, y sin
        # escalones (la diferencia de dos parábolas es suave)
        desp_i = np.clip(np.round(objetivo - np.polyval(coef, -1.0 - np.arange(W))), -tope, tope).astype(int)
        desp_d = np.clip(np.round(objetivo - np.polyval(coef, 2.0 * W - 1.0 - np.arange(W))), -tope, tope).astype(int)
        izq2, m_izq2 = _desplazar_columnas(izq, m_izq, desp_i, desde_tela=True)
        der2, m_der2 = _desplazar_columnas(der, m_der, desp_d, desde_tela=True)
        salto = int(round(float(objetivo[-1] - objetivo[0])))
        fila_costura = float(np.mean(objetivo))
    else:
        # cizalla lineal arriba (la costura) y, si se ve, otra abajo (el borde del ribete inferior, que la caja
        # suele pisar): el desplazamiento de cada franja va de una a otra fila a fila, y así las dos mitades se
        # encuentran en el centro con la costura y el ribete a la misma altura
        # los dos bordes del hueco (el del cuello arriba y el del ribete abajo) son arcos que la reflexión invierte:
        # se continúan con una curva de Hermite (valor y pendiente de cada franja junto a la caja) y cada franja se
        # deforma columna a columna para seguirlas, interpolando fila a fila entre el borde de arriba y el de abajo
        tope = px(8)
        desp_i = np.zeros((H, W), dtype=int)
        desp_d = np.zeros((H, W), dtype=int)
        # arriba, el borde del cuello es casi recto: basta la cizalla lineal de las medianas (salto); abajo, el ribete
        # es un arco de verdad y va con la curva de Hermite
        fila_costura = float((yi + yd) / 2) if (yi is not None and yd is not None) else 0.0
        bordes = []
        for zona in ("arriba", "abajo"):
            pi, pd = _perfil_borde(izq, m_izq, zona), _perfil_borde(der, m_der, zona)
            # arriba sin pendientes (el borde del cuello es casi recto y extrapolar su pendiente lo hunde); abajo con ellas
            ajuste = _curva_hermite(pi, pd, W, con_pendiente=(zona == "abajo"))
            if ajuste is None:
                if zona == "arriba":
                    bordes.append((fila_costura, salto * t, -salto * (1.0 - t)))
                continue
            curva, (ai, bi), (ad, bd) = ajuste
            # el borde propio de cada franja, por su ajuste lineal junto a la caja (sin el ruido columna a columna)
            propio_i = ai * np.arange(W) + bi
            propio_d = ad * np.arange(W) + bd
            bordes.append((float(np.nanmean(curva)), np.clip(curva - propio_i, -tope, tope), np.clip(curva - propio_d, -tope, tope)))
        if len(bordes) == 2:
            (fila_a, da_i, da_d), (fila_b, db_i, db_d) = bordes
            f = np.clip((np.arange(H) - fila_a) / max(1.0, fila_b - fila_a), 0.0, 1.0)[:, None]
            desp_i = np.round(da_i[None, :] * (1.0 - f) + db_i[None, :] * f).astype(int)
            desp_d = np.round(da_d[None, :] * (1.0 - f) + db_d[None, :] * f).astype(int)
        else:
            _, d_i, d_d = bordes[0]
            desp_i = np.round(np.repeat(d_i[None, :], H, axis=0)).astype(int)
            desp_d = np.round(np.repeat(d_d[None, :], H, axis=0)).astype(int)
        izq2, m_izq2 = _desplazar_2d(izq, m_izq, desp_i)
        der2, m_der2 = _desplazar_2d(der, m_der, desp_d)
    ea, eb = recorte
    if ea or eb:
        # las franjas venían con filas de más por arriba y por abajo: el desplazamiento ya ha traído tela real (el
        # ribete del cuello, que también baja hacia el centro) y ahora se recortan a la altura de la caja
        izq2, der2 = izq2[ea : H - eb], der2[ea : H - eb]
        m_izq2 = m_izq2[ea : H - eb] if m_izq2 is not None else None
        m_der2 = m_der2[ea : H - eb] if m_der2 is not None else None
        H -= ea + eb
        if fila_costura is not None:
            fila_costura -= ea
    sigma = (4.0 * ESCALA, 4.0 * ESCALA, 0)
    baja_i = ndimage.gaussian_filter(izq2, sigma)
    baja_d = ndimage.gaussian_filter(der2, sigma)
    baja = baja_i * (1.0 - t)[None, :, None] + baja_d * t[None, :, None]
    # el grano se parte por la columna del tercio central donde las dos franjas más se parecen (como en el
    # acolchado de texturas), con un fundido de unos píxeles para que no se vea la línea
    alta_i, alta_d = izq2 - baja_i, der2 - baja_d
    c0, c1 = int(W * 0.3), max(int(W * 0.3) + 1, int(W * 0.7))
    diferencia = np.abs(_luminancia(izq2) - _luminancia(der2)).mean(axis=0)
    corte = c0 + int(np.argmin(diferencia[c0:c1]))
    ancho_fundido = max(2, int(round(px(2))))
    peso = np.clip((np.arange(W) - corte) / ancho_fundido + 0.5, 0.0, 1.0)[None, :, None]
    alta = alta_i * (1.0 - peso) + alta_d * peso
    fuente = baja + alta
    m = np.concatenate([m_izq2[:, :corte], m_der2[:, corte:]], axis=1) if (m_izq2 is not None and m_der2 is not None) else None
    return fuente, m, salto, fila_costura


def _solo_arriba(fuente, mascara, fila=None):
    """Para las camisetas de tirantes (el ribete sube por los lados y las franjas laterales lo traen abajo): la parte de
    arriba de la fuente, con la costura, se queda; la de abajo se rellena reflejando en ping-pong la tela que hay justo
    bajo la costura (`fila`, la de la parábola; si no se conoce, la fila más oscura de la mitad de arriba)."""
    H = fuente.shape[0]
    ys = int(round(fila)) if fila is not None else _costura_y(fuente, mascara)
    inicio = min(H - 4, (ys if ys is not None else 0) + px(4))
    arriba = max(inicio + 2, (H + 1) // 2)
    bloque = fuente[inicio:arriba]
    bloque_m = mascara[inicio:arriba] if mascara is not None else None
    n = H - arriba
    filas, filas_m, flip = [], [], True
    while sum(len(f) for f in filas) < n:
        filas.append(bloque[::-1] if flip else bloque)
        if bloque_m is not None:
            filas_m.append(bloque_m[::-1] if flip else bloque_m)
        flip = not flip
    salida = np.concatenate([fuente[:arriba], np.concatenate(filas, axis=0)[:n]], axis=0)
    m = np.concatenate([mascara[:arriba], np.concatenate(filas_m, axis=0)[:n]], axis=0) if mascara is not None else None
    return salida, m


def _parche_fuente(img, bbox, mascara, tela, costura_max, anillo=None, fijo=None, preferida=None):
    """Elige la fuente del clonado para el rectángulo (con su anillo de 1 px): un parche vecino del mismo tamaño
    (debajo, encima, a los lados, en diagonal), o la franja de un lado reflejada (o las de los dos lados, media y
    media) cuando no hay sitio para un parche entero. Con `preferida` = 'espejo-arriba' solo vale la fuente hecha con
    las franjas laterales y su mitad de arriba (el interior del escote de una camiseta de tirantes, donde el ribete
    sube por los lados y cualquier parche entero lo trae); con `preferida` = 'costura' (fase 11) manda la fuente de
    las franjas laterales fundidas con la costura alineada, la única que continúa la costura de la que cuelga la
    etiqueta. Devuelve (fuente (h+2, w+2, 3), descripción) o None."""
    x0, y0, x1, y1 = bbox
    h, w = y1 - y0, x1 - x0
    H, W = img.shape[:2]
    hueco = px(HUECO_CLON)
    mascara_ok = mascara if mascara is not None else np.ones((H, W), dtype=bool)
    candidatos = []
    desplazamientos = [(h + hueco, 0), (-(h + hueco), 0), (0, w + hueco), (0, -(w + hueco)), (h + hueco, w // 2), (h + hueco, -(w // 2)), (h // 2 + hueco, w + hueco), (h // 2 + hueco, -(w + hueco))]
    if preferida == "espejo-arriba":
        desplazamientos = []
    for dy, dx in desplazamientos:
        sy0, sx0 = y0 + dy - 1, x0 + dx - 1
        sy1, sx1 = sy0 + h + 2, sx0 + w + 2
        if sy0 < 0 or sx0 < 0 or sy1 > H or sx1 > W:
            continue
        if not (sy1 <= y0 - 1 or sy0 >= y1 + 1 or sx1 <= x0 - 1 or sx0 >= x1 + 1):
            continue  # se solapa con la etiqueta
        parche = img[sy0:sy1, sx0:sx1]
        p = _vale_parche(parche, mascara_ok[sy0:sy1, sx0:sx1], tela, costura_max, anillo, fijo)
        if p is not None:
            # los parches en diagonal (otra luz, otro pliegue) solo si no hay uno recto que valga
            diagonal = 6.0 if (dy and dx) else 0.0
            candidatos.append((p + diagonal + 0.02 * (abs(dy) + abs(dx)) / ESCALA, parche, f"parche ({dx:+d}, {dy:+d})"))
    # la franja de un lado reflejada (misma altura, misma luz del escote), entera si hay sitio
    ancho = w + 2
    for nombre, (sx0, sx1) in (("izquierda", (x0 - 1 - hueco - ancho, x0 - 1 - hueco)), ("derecha", (x1 + 1 + hueco, x1 + 1 + hueco + ancho))):
        if sx0 < 0 or sx1 > W or preferida == "espejo-arriba":
            continue
        parche = img[y0 - 1 : y1 + 1, sx0:sx1][:, ::-1]
        p = _vale_parche(parche, mascara_ok[y0 - 1 : y1 + 1, sx0:sx1], tela, costura_max, anillo, fijo)
        if p is not None:
            candidatos.append((p + 2.0, parche, f"espejo de la franja {nombre}"))
    # fase 11: las dos franjas laterales reflejadas, enteras y con la costura del cuello alineada y fundidas en el
    # centro: es la fuente que continúa la costura de la que cuelga la etiqueta (Jamaica y el resto de cuellos redondos)
    if x0 - 1 - hueco - ancho >= 0 and x1 + 1 + hueco + ancho <= W and preferida != "espejo-arriba":
        # en el escote en U (Andre) las franjas van con filas de más por arriba y por abajo: al seguir el arco, el
        # centro de la caja baja varios píxeles y tiene que traer el ribete real del cuello, no la fila replicada
        extra = px(6) if preferida == "costura-arriba" else 0
        ea, eb = min(extra, y0 - 1), min(extra, img.shape[0] - (y1 + 1))
        izq = img[y0 - 1 - ea : y1 + 1 + eb, x0 - 1 - hueco - ancho : x0 - 1 - hueco][:, ::-1]
        der = img[y0 - 1 - ea : y1 + 1 + eb, x1 + 1 + hueco : x1 + 1 + hueco + ancho][:, ::-1]
        m_i = mascara_ok[y0 - 1 - ea : y1 + 1 + eb, x0 - 1 - hueco - ancho : x0 - 1 - hueco][:, ::-1]
        m_d = mascara_ok[y0 - 1 - ea : y1 + 1 + eb, x1 + 1 + hueco : x1 + 1 + hueco + ancho][:, ::-1]
        # la curva (parábola) solo en los escotes en U de las camisetas de tirantes; en los cuellos redondos, cizalla lineal
        fundida, m_f, salto, fila_costura = _fundir_franjas(
            izq.astype(np.float64), der.astype(np.float64), m_i, m_d, curva=(preferida == "costura-arriba"), recorte=(ea, eb)
        )
        if preferida in ("costura", "costura-arriba"):
            # forzada por producto: solo exige que las franjas sean tela (la puntuación del anillo no manda)
            if m_f is None or float(m_f.mean()) >= 0.6:
                if preferida == "costura-arriba":
                    fundida, m_f = _solo_arriba(fundida, m_f, fila_costura)
                    return fundida, f"franjas laterales fundidas con la costura alineada ({salto:+d} px), abajo la tela bajo la costura reflejada"
                return fundida, f"franjas laterales fundidas con la costura alineada ({salto:+d} px)"
        # (fase 10b: esta fuente solo se usa cuando el producto la fuerza con `etiqueta_fuente`; el resto de productos
        # sigue eligiendo como en la fase 10)
    # las dos franjas laterales reflejadas, media y media (lo que queda cuando el hueco del escote es estrecho); y la
    # misma fuente con solo su mitad de arriba reflejada hacia abajo, para cuando el ribete del escote sube por los
    # lados y se colaría por abajo (el interior del escote de una camiseta de tirantes)
    mitad = (ancho + 1) // 2
    if x0 - 1 - hueco - mitad >= 0 and x1 + 1 + hueco + mitad <= W:
        izq = img[y0 - 1 : y1 + 1, x0 - 1 - hueco - mitad : x0 - 1 - hueco][:, ::-1]
        der = img[y0 - 1 : y1 + 1, x1 + 1 + hueco : x1 + 1 + hueco + mitad][:, ::-1]
        parche = np.concatenate([izq, der], axis=1)[:, :ancho]
        m = np.concatenate([mascara_ok[y0 - 1 : y1 + 1, x0 - 1 - hueco - mitad : x0 - 1 - hueco][:, ::-1], mascara_ok[y0 - 1 : y1 + 1, x1 + 1 + hueco : x1 + 1 + hueco + mitad][:, ::-1]], axis=1)[:, :ancho]
        p = _vale_parche(parche, m, tela, costura_max, anillo, fijo) if preferida != "espejo-arriba" else None
        if p is not None:
            candidatos.append((p + 5.0, parche, "espejo de las dos franjas laterales"))
        # la mitad de arriba de esas franjas, sin las primeras filas (la costura del ribete), reflejada hacia abajo
        alto = h + 2
        arriba = (alto + 1) // 2
        salto = min(px(8), max(0, alto - arriba))
        trozo = parche[salto : salto + arriba]
        trozo_m = m[salto : salto + arriba]
        parche_v = np.concatenate([trozo, trozo[::-1]], axis=0)[:alto]
        m_v = np.concatenate([trozo_m, trozo_m[::-1]], axis=0)[:alto]
        if parche_v.shape[0] == alto:
            p = _vale_parche(parche_v, m_v, tela, costura_max, anillo if preferida != "espejo-arriba" else None, fijo)
            if p is not None:
                candidatos.append((p + 4.0, parche_v, "espejo de las dos franjas laterales, mitad de arriba"))
    if not candidatos:
        return None
    candidatos.sort(key=lambda c: c[0])
    return candidatos[0][1].astype(np.float64), candidatos[0][2]


def _textura_vecina(img, bbox, mascara, tela, costura_max):
    """La textura real de la tela (su residuo de alta frecuencia) tomada de una franja vecina del rectángulo (a los
    lados, encima o debajo, la que mejor casa con la tela) y extendida al tamaño del rectángulo repitiéndola en
    espejo, para que el relleno liso de Laplace tenga el grano y la trama de la prenda. Devuelve (h, w, 3) o None."""
    x0, y0, x1, y1 = bbox
    h, w = y1 - y0, x1 - x0
    H, W = img.shape[:2]
    ancho_franja = px(14)
    hueco = px(2)
    candidatas = []
    for fy0, fy1, fx0, fx1 in ((y0, y1, x0 - hueco - ancho_franja, x0 - hueco), (y0, y1, x1 + hueco, x1 + hueco + ancho_franja), (y0 - hueco - ancho_franja, y0 - hueco, x0, x1), (y1 + hueco, y1 + hueco + ancho_franja, x0, x1)):
        if fy0 < 0 or fx0 < 0 or fy1 > H or fx1 > W or fy1 - fy0 < px(6) or fx1 - fx0 < px(6):
            continue
        franja = img[fy0:fy1, fx0:fx1]
        m = mascara[fy0:fy1, fx0:fx1] if mascara is not None else np.ones(franja.shape[:2], dtype=bool)
        lum = _luminancia(franja)
        if m.mean() < 0.995 and float(np.percentile(lum, 99)) > LUM_TELA_MAX:
            continue
        de = np.sqrt(((_lab(franja) - tela) ** 2).sum(axis=-1))
        if (de < UMBRAL_CONTORNO).mean() < 0.95:
            continue
        amplitud = _amplitud(franja)
        if amplitud > costura_max:
            continue
        residuo = franja - ndimage.gaussian_filter(franja, (2.0 * ESCALA, 2.0 * ESCALA, 0))
        candidatas.append((float(np.median(de)) + 0.2 * amplitud, residuo))
    if not candidatas:
        return None
    candidatas.sort(key=lambda c: c[0])
    residuo = candidatas[0][1]
    # repetición en espejo hasta cubrir (h, w): sin bordes entre losetas
    fh, fw = residuo.shape[:2]
    filas = [residuo if (i % 2 == 0) else residuo[::-1] for i in range((h + fh - 1) // fh)]
    bloque = np.concatenate(filas, axis=0)[:h]
    cols = [bloque if (j % 2 == 0) else bloque[:, ::-1] for j in range((w + fw - 1) // fw)]
    return np.concatenate(cols, axis=1)[:, :w]


def _rellenar_laplace(img, bbox, mascara, tela, costura_max, semilla):
    """Relleno de reserva: interpolación de Laplace desde el contorno (los puntos que no son tela se reflejan desde
    dentro) más la textura real de una franja vecina (o grano, si no hay franja)."""
    x0, y0, x1, y1 = bbox
    ancho = x1 - x0
    f6, f12 = px(6), px(12)
    izq = img[y0:y1, max(0, x0 - f6) : x0 - 1].mean(axis=1)
    der = img[y0:y1, x1 + 1 : x1 + f6].mean(axis=1)
    t = ((np.arange(ancho) + 0.5) / ancho)[None, :, None]
    img[y0:y1, x0:x1] = izq[:, None, :] * (1 - t) + der[:, None, :] * t
    sub = img[y0 - 1 : y1 + 1, x0 - 1 : x1 + 1]
    de_contorno = np.sqrt(((_lab(sub) - tela) ** 2).sum(axis=-1)) > UMBRAL_CONTORNO
    if mascara is not None:
        de_contorno |= ~mascara[y0 - 1 : y1 + 1, x0 - 1 : x1 + 1] & (_luminancia(sub) >= LUM_FONDO)
    arriba, abajo, izquierda, derecha = de_contorno[0, 1:-1], de_contorno[-1, 1:-1], de_contorno[1:-1, 0], de_contorno[1:-1, -1]
    for _ in range(int(300 * max(1.0, ESCALA * ESCALA))):
        sub[0, 1:-1][arriba] = sub[1, 1:-1][arriba]
        sub[-1, 1:-1][abajo] = sub[-2, 1:-1][abajo]
        sub[1:-1, 0][izquierda] = sub[1:-1, 1][izquierda]
        sub[1:-1, -1][derecha] = sub[1:-1, -2][derecha]
        sub[1:-1, 1:-1] = 0.25 * (sub[:-2, 1:-1] + sub[2:, 1:-1] + sub[1:-1, :-2] + sub[1:-1, 2:])
    alto = y1 - y0
    fuente = _textura_vecina(img, (x0, y0, x1, y1), mascara, tela, costura_max)
    if fuente is not None:
        img[y0:y1, x0:x1] += fuente
    else:
        franjas = np.concatenate([img[y0:y1, max(0, x0 - f12) : x0 - 1], img[y0:y1, x1 + 1 : x1 + f12]], axis=1)
        if franjas.shape[1] >= 4:
            suave = ndimage.gaussian_filter(franjas, (1.2 * ESCALA, 1.2 * ESCALA, 0))
            ruido_std = (franjas - suave).std(axis=(0, 1)).clip(0, 12)
            rng = np.random.default_rng(semilla)
            grano = rng.normal(0, 1, (alto, ancho, 3)).astype(np.float32) * ruido_std
            img[y0:y1, x0:x1] += ndimage.gaussian_filter(grano, (0.6 * ESCALA, 0.6 * ESCALA, 0)) * 1.4
    return img


def rellenar(a, bbox, semilla=7, mascara=None, metodo=None, fuente_preferida=None):
    """Rellena el rectángulo con tela: clonado de Poisson de un parche vecino (textura y costuras finas reales, con
    la luz y el color del contorno) o, si no hay parche que valga, la interpolación de Laplace con la textura de una
    franja vecina. Los puntos del contorno que no son prenda (`mascara`: el fondo blanco sobre el escote de una
    camiseta de tirantes) o que no son tela (el borde del escote, un resto de etiqueta) no mandan: ahí el relleno
    continúa libre. Devuelve la foto; con `metodo` (lista) añade qué se hizo."""
    x0, y0, x1, y1 = bbox
    img = a.astype(np.float32)
    h, w = img.shape[:2]
    x0, y0, x1, y1 = max(1, x0), max(1, y0), min(w - 1, x1), min(h - 1, y1)
    if x1 - x0 < 2 or y1 - y0 < 2:
        return a
    f12 = px(12)
    # la tela de alrededor: las franjas laterales (sin fondo), para el color de referencia y su textura
    franjas = np.concatenate([img[y0:y1, max(0, x0 - f12) : x0 - 1], img[y0:y1, x1 + 1 : x1 + f12]], axis=1)
    costura_max = max(COSTURA_MIN, 2.5 * _amplitud(franjas)) if franjas.shape[1] >= 4 else COSTURA_MIN
    if mascara is not None:
        m_franjas = np.concatenate([mascara[y0:y1, max(0, x0 - f12) : x0 - 1], mascara[y0:y1, x1 + 1 : x1 + f12]], axis=1)
        sel = m_franjas | (_luminancia(franjas) < LUM_FONDO)
        if sel.sum() >= 20:
            franjas = franjas[sel][None, :, :]
    tela = np.median(_lab(franjas).reshape(-1, 3), axis=0)
    anillo = img[y0 - 1 : y1 + 1, x0 - 1 : x1 + 1]
    de_anillo = np.sqrt(((_lab(anillo) - tela) ** 2).sum(axis=-1))
    fijo = de_anillo <= UMBRAL_CONTORNO
    if fuente_preferida in ("costura", "costura-arriba"):
        # la fuente continúa las propias franjas (ribete incluido): todo el anillo que sea tela manda, también el
        # ribete casi blanco (si quedara libre, el Poisson se desborda y deja una mancha clara)
        fijo = np.ones_like(fijo)
    if mascara is not None:
        fijo &= mascara[y0 - 1 : y1 + 1, x0 - 1 : x1 + 1] | (_luminancia(anillo) < LUM_FONDO)
    fijo[1:-1, 1:-1] = False
    borde = np.ones_like(fijo)
    borde[1:-1, 1:-1] = False
    fraccion_fija = float(fijo[borde].mean())
    origen = _parche_fuente(img, (x0, y0, x1, y1), mascara, tela, costura_max, anillo, fijo, fuente_preferida) if fraccion_fija >= CONTORNO_MINIMO else None
    if origen is None:
        if metodo is not None:
            metodo.append("laplace con textura")
        return _rellenar_laplace(img, (x0, y0, x1, y1), mascara, tela, costura_max, semilla).clip(0, 255).astype(np.uint8)
    fuente, descripcion = origen
    # si el parche trae su propia iluminación (un degradado de más de unos puntos de luminancia), solo se clona su
    # textura: la luz del interior la pone el contorno (así una franja más clara no deja un rectángulo más claro)
    baja = ndimage.gaussian_filter(_luminancia(fuente), 4.0 * ESCALA)[1:-1, 1:-1]
    if not descripcion.startswith("franjas laterales fundidas") and baja.size and float(np.percentile(baja, 95) - np.percentile(baja, 5)) > LUZ_PROPIA_MAX:
        fuente = fuente - ndimage.gaussian_filter(fuente, (4.0 * ESCALA, 4.0 * ESCALA, 0)) + fuente.mean(axis=(0, 1))
        descripcion += ", solo textura"
    img[y0:y1, x0:x1] = _poisson(anillo.astype(np.float64), fuente, fijo)
    if metodo is not None:
        metodo.append(f"poisson, {descripcion}")
    return img.clip(0, 255).astype(np.uint8)


def quitar(a, mascara, zona, jaspeado=False, metodo=None, fuente_preferida=None, manual=None):
    """Detecta y rellena la etiqueta; devuelve (foto, rectángulo o None). Con `manual` (x0, y0, x1, y1, en px de esta
    foto) no se detecta nada: se rellena ese rectángulo (fase 10: fotos donde la detección falla o se desvía)."""
    if manual is not None:
        h, w = mascara.shape
        bbox = (max(0, int(manual[0])), max(0, int(manual[1])), min(w, int(manual[2])), min(h, int(manual[3])))
        if metodo is not None:
            metodo.append("caja fijada a mano")
        return rellenar(a, bbox, mascara=mascara, metodo=metodo, fuente_preferida=fuente_preferida), bbox
    bbox = detectar(a, mascara, zona, jaspeado)
    if bbox is None:
        return a, None
    return rellenar(a, bbox, mascara=mascara, metodo=metodo, fuente_preferida=fuente_preferida), bbox
