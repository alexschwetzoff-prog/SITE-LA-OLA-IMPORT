"""Recoloreado de fotos de producto por luminancia (fase 4.2), compartido por los tres scripts de fotos.

Idea: la foto base aporta la luz (pliegues, costuras, textura, sombras) y el color de destino aporta el tono. Se
trabaja en coma flotante y a resolución completa, sin desenfocar la foto:

  1. Máscara del objeto con una banda de alfa en el borde. Dentro, alfa = 1; fuera, 0; en la banda de ~3 px del
     contorno se estima la cobertura real de la tela contra el fondo blanco de la foto (alfa = cuánto se aleja el
     píxel del blanco respecto a la tela vecina) y se separa la tela del blanco mezclado (`desmezclar`), para que el
     borde recoloreado quede limpio: ni halo claro en los colores oscuros ni halo oscuro en los claros.
  2. Luminancia: Y lineal de la tela, normalizada por su mediana en una ventana de referencia (sombreado relativo
     s = Y / Y_ref). El ruido de JPEG se recorta con un umbral suave sobre el residuo de alta frecuencia (los
     pliegues y las costuras, de amplitud mayor, se conservan enteros); el jaspeado (gris vigoré) se alisa con un
     filtro de mediana para que los colores lisos salgan lisos.
  3. Destino en Lab: L*, a*, b* del hex del catálogo (los «negros» de las fichas, que son grises oscuros, se llevan
     a negro de verdad). La luminancia nueva es Y_t · s^γ, con γ calibrado para que el contraste en L* de la prenda
     recoloreada sea el que tienen las fotos reales de ese nivel de claridad (medido en las parejas de fotos reales
     del mismo producto: Atomic blanco/naranja, Austral blanco/negro, Pointer marino/rojo, Imola negro/amarillo y
     Shura negro/fucsia: el contraste en L* es máximo en los tonos medios y menor en blancos y negros).
  4. Croma: a* y b* del destino, atenuados hacia las sombras profundas y las luces quemadas; se vuelve a sRGB con
     reducción de croma donde el color se sale del gamut (nunca recortando canales, que vira el tono).
  5. Un poco de ruido de dither antes de cuantizar a 8 bits, para no dejar bandas en los degradados, y salida WebP
     de alta calidad (una sola compresión desde el original).
"""
import os

import numpy as np
from PIL import Image
from scipy import ndimage

# --- Calibración ---------------------------------------------------------------------------------
# Contraste de la tela en L* según su claridad (campana medida en las fotos reales, ver docstring).
CONTRASTE_BASE, CONTRASTE_PICO, CONTRASTE_CENTRO, CONTRASTE_ANCHO = 0.40, 1.20, 45.0, 25.0
UMBRAL_RUIDO_L = 0.35  # amplitud (L*) del residuo de alta frecuencia que se considera ruido de JPEG
BASE_OSCURA_L = 22.0  # por debajo de esta L* la base trae bloques de JPEG que conviene alisar
NEGRO_L_MAX = 13.0  # los colores llamados «Negro» no pasan de esta L* (sus hex de ficha son grises oscuros)
CALIDAD_WEBP = 95  # fase 4.4: a 92 el polo negro perdía el 41 % de su textura fina (medido); a 95, el 32 %, con el doble de peso
BANDA_PX = 3  # anchura de la banda de alfa en el contorno (en px de una foto de 600)
# La iluminación general de la foto (degradados de más de ~25 px: un hombro más iluminado que el bajo) se conserva casi
# tal cual en vez de estirarse con el contraste de los pliegues: en las fotos reales no cambia con el color de la tela.
GANANCIA_BAJA_MIN, GANANCIA_BAJA_MAX, SIGMA_BAJA = 0.7, 1.35, 25.0

# Fase 4.4: todas las medidas en píxeles de este módulo (banda, sigmas, áreas mínimas, iteraciones) se calibraron en
# fotos de 600 px; con las fotos hd (1200 px publicadas) se escalan con ESCALA = ancho de la foto / 600, que fija cada
# script antes de procesar cada foto.
ESCALA = 1.0


def fijar_escala(escala):
    global ESCALA
    ESCALA = float(escala)


def px(valor):
    """Un número de píxeles de referencia (600 px) llevado a la foto actual (entero, al menos 1)."""
    return max(1, int(round(valor * ESCALA)))


def sigma(valor):
    """Un sigma o radio de referencia (600 px) llevado a la foto actual (en coma flotante)."""
    return valor * ESCALA

M_RGB_XYZ = np.array([[0.4124564, 0.3575761, 0.1804375], [0.2126729, 0.7151522, 0.0721750], [0.0193339, 0.1191920, 0.9503041]])
M_XYZ_RGB = np.linalg.inv(M_RGB_XYZ)
BLANCO_D65 = np.array([0.95047, 1.0, 1.08883])


# --- Color ---------------------------------------------------------------------------------------
def a_lineal(c):
    c = np.asarray(c, dtype=np.float64) / 255.0
    return np.where(c <= 0.04045, c / 12.92, ((c + 0.055) / 1.055) ** 2.4)


def a_srgb(c):
    c = np.clip(c, 0, 1)
    return np.where(c <= 0.0031308, c * 12.92, 1.055 * c ** (1 / 2.4) - 0.055) * 255.0


def luminancia(lineal):
    return 0.2126 * lineal[..., 0] + 0.7152 * lineal[..., 1] + 0.0722 * lineal[..., 2]


def _f_lab(t):
    return np.where(t > 0.008856, np.cbrt(np.maximum(t, 1e-9)), 7.787 * t + 16.0 / 116.0)


def _f_lab_inv(f):
    return np.where(f > 0.206893, f ** 3, (f - 16.0 / 116.0) / 7.787)


def lineal_a_lab(lin):
    xyz = lin @ M_RGB_XYZ.T / BLANCO_D65
    f = _f_lab(xyz)
    return np.stack([116 * f[..., 1] - 16, 500 * (f[..., 0] - f[..., 1]), 200 * (f[..., 1] - f[..., 2])], axis=-1)


def lab_a_lineal(lab):
    fy = (lab[..., 0] + 16) / 116
    fx = fy + lab[..., 1] / 500
    fz = fy - lab[..., 2] / 200
    xyz = np.stack([_f_lab_inv(fx), _f_lab_inv(fy), _f_lab_inv(fz)], axis=-1) * BLANCO_D65
    return xyz @ M_XYZ_RGB.T


def L_de_Y(Y):
    return 116 * _f_lab(np.maximum(Y, 0)) - 16


def Y_de_L(L):
    return _f_lab_inv((L + 16) / 116)


def hex_a_rgb(h):
    return np.array([int(h[i : i + 2], 16) for i in (1, 3, 5)], dtype=np.float64)


def contraste(L):
    """Amplitud típica del sombreado en L* para una tela de claridad L* (campana calibrada)."""
    return CONTRASTE_BASE + CONTRASTE_PICO * np.exp(-(((L - CONTRASTE_CENTRO) / CONTRASTE_ANCHO) ** 2))


def destino_lab(hex_color, nombre=""):
    """L*, a*, b* a los que se lleva la tela: el hex del catálogo, con los negros llevados a negro."""
    lab = lineal_a_lab(a_lineal(hex_a_rgb(hex_color)))
    L, a, b = float(lab[0]), float(lab[1]), float(lab[2])
    objetivo = L
    if nombre.lower().startswith("negro"):
        objetivo = min(L, NEGRO_L_MAX)
    elif L < 40:
        # los chips oscuros de las fichas salen más oscuros en las fotos (medido): 25 → 15, 40 → 38
        objetivo = np.interp(L, [0, 25, 40], [0, 15, 38])
    else:
        # tonos medios: las fotos reales salen algo más oscuras y saturadas que los chips (naranja 65 → 61,
        # fucsia 62 → 54, rojo 38 → 36; amarillo y blanco apenas cambian)
        objetivo = L - 7.0 * np.exp(-(((L - 58.0) / 18.0) ** 2))
    if objetivo < L and L > 0:
        escala = objetivo / L
        a, b = a * escala, b * escala
    croma = 1.0 + 0.2 * np.exp(-(((L - 55.0) / 25.0) ** 2))
    return float(objetivo), float(a * croma), float(b * croma)


# --- Máscara y alfa ------------------------------------------------------------------------------
def mascara_objeto(a, fondo="todo", umbral=251.0):
    """Objeto = lo que no es fondo blanco (binaria). 'todo': cualquier mancha blanca grande es fondo (huecos de asas,
    anillas); 'conectado' (prendas blancas): solo el blanco conectado con el borde y el hueco del cuello; 'borde':
    solo el blanco conectado con el borde (gorras blancas: los brillos de la corona no son fondo)."""
    lum = 0.299 * a[..., 0] + 0.587 * a[..., 1] + 0.114 * a[..., 2]
    brillante = lum >= umbral
    et, n = ndimage.label(brillante)
    h, w = lum.shape
    borde = set(np.unique(np.concatenate([et[0, :], et[-1, :], et[:, 0], et[:, -1]])))
    borde.discard(0)
    fondo_m = np.isin(et, list(borde)) if borde else np.zeros_like(brillante)
    top = int(np.where((~fondo_m).any(axis=1))[0].min()) if (~fondo_m).any() else 0
    area_todo = 30 * ESCALA * ESCALA
    area_cuello = 40 * ESCALA * ESCALA
    for e in range(1, n + 1):
        if e in borde:
            continue
        comp = et == e
        area = int(comp.sum())
        if fondo == "todo":
            if area >= area_todo:
                fondo_m |= comp
        elif fondo == "borde":
            continue
        else:
            ys, xs = np.where(comp)
            if area >= area_cuello and ys.min() <= top + px(14) and ys.mean() < 0.22 * h and abs(xs.mean() - w / 2) < 0.12 * w:
                fondo_m |= comp
    objeto = ~fondo_m
    et2, n2 = ndimage.label(objeto)
    if n2 > 1:
        tam = ndimage.sum(objeto, et2, range(1, n2 + 1))
        objeto = et2 == (1 + int(np.argmax(tam)))
    return cerrar(objeto, px(2))


def cerrar(mascara, iteraciones):
    """Cierre morfológico con el borde de la imagen prolongado, para no erosionar lo que toca el encuadre."""
    m = np.pad(mascara, iteraciones + 2, mode="edge")
    m = ndimage.binary_closing(m, iterations=iteraciones)
    r = iteraciones + 2
    return m[r:-r, r:-r]


def _rellenar_desde(valores, pesos, sigma):
    """Convolución normalizada: extiende `valores` (donde pesos = 1) a todo el plano."""
    num = ndimage.gaussian_filter(valores * pesos[..., None], sigma, axes=(0, 1)) if valores.ndim == 3 else ndimage.gaussian_filter(valores * pesos, sigma)
    den = ndimage.gaussian_filter(pesos, sigma)
    den = np.maximum(den, 1e-4)
    return num / (den[..., None] if valores.ndim == 3 else den)


def alfa_y_tela(a, mascara, fondo_blanco=True):
    """Alfa de cobertura del objeto y la foto «desmezclada» (sin el fondo que se cuela en el borde).

    Dentro de la máscara (erosionada 1 px) alfa = 1; fuera (dilatada BANDA_PX) alfa = 0; en la banda, la cobertura
    se estima contra el fondo local: alfa = (fondo - c) / (fondo - tela_vecina), por canal (el mayor), mezclada con
    la cobertura geométrica (máscara suavizada) cuando la tela es casi blanca y la estimación es poco fiable.
    Devuelve (alfa float32 [0, 1], tela float64 RGB desmezclada)."""
    a = a.astype(np.float64)
    interior = ndimage.binary_erosion(mascara, iterations=px(1), border_value=1)
    exterior = ~ndimage.binary_dilation(mascara, iterations=px(BANDA_PX))
    banda = ~interior & ~exterior
    geometrica = ndimage.gaussian_filter(mascara.astype(np.float64), sigma(0.6))
    # tela vecina (desde el interior) y fondo vecino (desde el exterior) extendidos a la banda
    tela_cerca = _rellenar_desde(a, interior.astype(np.float64), sigma(2.5))
    if fondo_blanco:
        fondo_cerca = np.full_like(a, 255.0)
    else:
        fondo_cerca = _rellenar_desde(a, exterior.astype(np.float64), sigma(3.0))
    dif = fondo_cerca - tela_cerca
    with np.errstate(divide="ignore", invalid="ignore"):
        cobertura = np.where(np.abs(dif) > 1e-3, (fondo_cerca - a) / dif, 0.0)
    # el canal con más separación entre fondo y tela es el más fiable
    canal = np.argmax(np.abs(dif), axis=-1)
    cob = np.take_along_axis(cobertura, canal[..., None], axis=-1)[..., 0]
    cob = np.clip(cob, 0, 1)
    separacion = np.abs(np.take_along_axis(dif, canal[..., None], axis=-1)[..., 0])
    peso_clave = np.clip((separacion - 12.0) / 50.0, 0, 1)  # tela casi blanca → geometría; tela oscura → clave
    alfa = np.where(banda, peso_clave * cob + (1 - peso_clave) * geometrica, np.where(interior, 1.0, 0.0))
    # suavizado mínimo para que la banda no deje escalones
    alfa = np.clip(alfa, 0, 1)
    # tela desmezclada en la banda: c = alfa·tela + (1 - alfa)·fondo
    tela = a.copy()
    con_alfa = banda & (alfa > 0.08)
    tela[con_alfa] = (a[con_alfa] - (1 - alfa[con_alfa])[:, None] * fondo_cerca[con_alfa]) / alfa[con_alfa][:, None]
    tela[banda & (alfa <= 0.08)] = tela_cerca[banda & (alfa <= 0.08)]
    tela = np.clip(tela, 0, 255)
    return alfa.astype(np.float32), tela


# --- Luminancia ----------------------------------------------------------------------------------
def alisar_zonas_planas(L, mascara, sigma, umbral):
    """Alisado que conserva bordes: en las zonas planas (donde la foto no se separa más de `umbral` L* de su versión
    desenfocada) se usa la versión desenfocada; costuras y pliegues, que se separan más, se quedan como están."""
    suave = ndimage.gaussian_filter(L, sigma)
    d = np.abs(L - suave)
    peso = np.clip(1 - (d - umbral * 0.5) / umbral, 0, 1)  # 1 en zonas planas, 0 en los bordes
    peso = np.where(mascara, peso, 0.0)
    return L * (1 - peso) + suave * peso


def quitar_ruido(Y, mascara, jaspeado=False, base_oscura=False):
    """Recorta el ruido de JPEG del mapa de luminancia sin desenfocar los pliegues: umbral suave sobre el residuo de
    alta frecuencia (en L*, que es uniforme a la vista). Con `jaspeado`, antes alisa la veta (mediana y alisado de
    zonas planas); con `base_oscura`, alisa los bloques de JPEG que las telas oscuras traen en las zonas lisas."""
    L = L_de_Y(Y)
    if jaspeado:
        med = ndimage.median_filter(L, size=px(7) | 1)
        L = np.where(mascara, med, L)
        # la veta del gris vigoré tiene manchas de 10-30 px: alisado fuerte en las zonas planas; las costuras, los
        # pliegues y los bolsillos (que se separan más de 5,5 L* de su entorno) se conservan; la cremallera, que es
        # tono sobre tono, se atenúa (decisión documentada en docs/pendientes.md)
        L = alisar_zonas_planas(L, mascara, sigma(4.5), 5.5)
    if base_oscura:
        L = alisar_zonas_planas(L, mascara, sigma(2.0), 1.6)
    suave = ndimage.gaussian_filter(L, sigma(0.8))
    residuo = L - suave
    residuo = np.sign(residuo) * np.maximum(np.abs(residuo) - UMBRAL_RUIDO_L, 0)
    return Y_de_L(suave + residuo)


def referencia(Y, zona, ventana):
    """Luminancia de referencia de la tela: mediana en la ventana (fracciones x0, y0, x1, y1) dentro de la zona."""
    h, w = zona.shape
    x0, y0, x1, y1 = ventana
    vm = np.zeros_like(zona)
    vm[int(h * y0) : int(h * y1), int(w * x0) : int(w * x1)] = True
    sel = zona & vm
    if sel.sum() < 50:
        sel = zona
    return float(max(np.median(Y[sel]), 1e-4))


def tenir_luminancia(Y, Y_ref, destino, zona, Y_baja=None):
    """Lineal RGB de la zona teñida: luminancia Y_t · (Y/Y_ref)^γ y croma del destino. `Y_baja` (la componente de
    baja frecuencia de Y) se estira menos que el resto, para no exagerar la iluminación general de la foto."""
    L_t, a_t, b_t = destino
    L_b = float(L_de_Y(Y_ref))
    k = contraste(L_t) / contraste(L_b)
    gamma = k * (L_b + 16) / (L_t + 16)
    gamma = float(np.clip(gamma, 0.25, 6.0))
    s = np.clip(Y / Y_ref, 0.02, 3.0)
    if Y_baja is not None:
        k_baja = float(np.clip(k, GANANCIA_BAJA_MIN, GANANCIA_BAJA_MAX))
        s = s * np.clip(Y_baja / Y_ref, 0.05, 3.0) ** (k_baja / k - 1.0)
    Y_new = Y_de_L(L_t) * s**gamma
    L_new = L_de_Y(Y_new)
    # hombro suave hacia el blanco: las luces se comprimen en vez de quemarse (importa en los destinos claros)
    margen = max(100.0 - L_t, 1.0)
    exceso = np.maximum(L_new - L_t, 0)
    L_new = np.where(L_new > L_t, L_t + margen * (1 - np.exp(-exceso / margen)), L_new)
    # croma: hacia el negro y hacia el blanco quemado el color pierde saturación
    m = np.where(L_new < L_t, np.clip(L_new / max(L_t, 1e-3), 0, 1), np.clip((100 - L_new) / max(100 - L_t, 1e-3), 0, 1))
    m = 0.15 + 0.85 * m
    lab = np.stack([L_new, a_t * m, b_t * m], axis=-1)
    lin = lab_a_lineal(lab)
    # fuera de gamut: se reduce el croma de cada píxel justo lo necesario (bisección), de forma continua, para no
    # recortar canales (viraría el tono) ni dejar manchas entre píxeles dentro y fuera del gamut
    fuera = (lin.min(axis=-1) < -0.002) | (lin.max(axis=-1) > 1.002)
    if fuera.any():
        sub = lab[fuera]
        lo = np.zeros(len(sub))
        hi = np.ones(len(sub))
        for _ in range(9):
            mid = (lo + hi) / 2
            prueba = sub.copy()
            prueba[:, 1:] *= mid[:, None]
            l2 = lab_a_lineal(prueba)
            ok = (l2.min(axis=-1) >= -0.002) & (l2.max(axis=-1) <= 1.002)
            lo = np.where(ok, mid, lo)
            hi = np.where(ok, hi, mid)
        sub[:, 1:] *= lo[:, None]
        lin[fuera] = lab_a_lineal(sub)
    return np.clip(lin, 0, 1)


def recolorear_zonas(tela, alfa, zonas, ventana, jaspeado=False):
    """Recolorea `tela` (RGB desmezclada, float) por zonas. Cada zona es un dict con `mascara` (binaria), `destino`
    (L*, a*, b* de `destino_lab`, o None para dejarla como está) y, opcionalmente, `ref`: 'principal' (por defecto:
    la luminancia de referencia es la de la primera zona, medida en la ventana, así se conserva la relación de luz
    entre zonas) o 'propia' (la mediana de la propia zona: piezas de otro color en la foto base, como la visera roja
    de la Freya bicolor o el forro de la capucha). Devuelve RGB float 0-255 (la composición la hace `componer`)."""
    lin = a_lineal(tela)
    Y = luminancia(lin)
    union = np.zeros(alfa.shape, dtype=bool)
    for z in zonas:
        union |= z["mascara"]
    principal = zonas[0]["mascara"]
    Y_ref = referencia(Y, principal, ventana)
    Y = quitar_ruido(Y, union, jaspeado, base_oscura=float(L_de_Y(Y_ref)) < BASE_OSCURA_L)
    # componente de baja frecuencia de la luminancia dentro del objeto (convolución normalizada en log)
    logY = np.log(np.maximum(Y, 1e-4))
    pesos = union.astype(np.float64)
    num = ndimage.gaussian_filter(logY * pesos, sigma(SIGMA_BAJA))
    den = np.maximum(ndimage.gaussian_filter(pesos, sigma(SIGMA_BAJA)), 1e-4)
    Y_baja = np.exp(num / den)
    salida = lin.copy()
    for z in zonas:
        zona, destino = z["mascara"], z["destino"]
        if destino is None or not zona.any():
            continue
        if z.get("ref") == "propia":
            # pieza con su propia referencia: se funde con el tinte de la zona principal en un borde de ~2 px para
            # que la costura entre ambas no quede marcada
            ref = float(max(np.median(Y[zona]), 1e-4))
            ancha = ndimage.binary_dilation(zona, iterations=px(2)) & union
            propia = tenir_luminancia(Y[ancha], ref, destino, ancha, Y_baja[ancha])
            general = tenir_luminancia(Y[ancha], Y_ref, destino, ancha, Y_baja[ancha])
            peso = ndimage.gaussian_filter(zona.astype(np.float64), sigma(1.2))[ancha][:, None]
            salida[ancha] = propia * peso + general * (1 - peso)
        else:
            salida[zona] = tenir_luminancia(Y[zona], Y_ref, destino, zona, Y_baja[zona])
    return a_srgb(salida)


def componer(original, recolor, alfa, fondo_blanco=True):
    """Compone la tela recoloreada sobre la foto original con el alfa de cobertura. En la banda del borde el fondo es el
    de la foto (blanco), no el píxel mezclado, así que no quedan halos."""
    original = original.astype(np.float64)
    if fondo_blanco:
        fondo = np.full_like(original, 255.0)
    else:
        exterior = alfa < 0.02
        fondo = _rellenar_desde(original, exterior.astype(np.float64), sigma(3.0))
    al = alfa[..., None].astype(np.float64)
    mezcla = al * recolor + (1 - al) * fondo
    return np.where(al > 0.0, mezcla, original)


def dither_a_uint8(rgb, semilla=7):
    rng = np.random.default_rng(semilla)
    ruido = rng.normal(0, 0.35, rgb.shape)
    return np.clip(np.rint(rgb + ruido), 0, 255).astype(np.uint8)


def guardar_webp(rgb, destino, alfa=None, calidad=CALIDAD_WEBP):
    """WebP de alta calidad; con `alfa` (float 0-1) guarda RGBA (recorte sin fondo)."""
    if alfa is None:
        Image.fromarray(dither_a_uint8(rgb), "RGB").save(destino, quality=calidad, method=6)
    else:
        a8 = np.clip(np.rint(alfa * 255), 0, 255).astype(np.uint8)
        Image.fromarray(np.dstack([dither_a_uint8(rgb), a8]), "RGBA").save(destino, quality=calidad, method=6, exact=False)


def nombre_tamano(destino, ancho):
    """`foto.webp` → `foto-800.webp` para la versión de 800 px (el archivo sin sufijo es el grande)."""
    raiz, ext = os.path.splitext(destino)
    return f"{raiz}-{ancho}{ext}"


def guardar_webp_tamanos(rgb, destino, anchos, alfa=None, calidad=CALIDAD_WEBP):
    """La foto a su tamaño (`anchos[0]`, el archivo `destino`) y las versiones menores (`destino-<ancho>.webp`), todas
    desde el mismo array procesado: ninguna se vuelve a comprimir a partir de otra. Devuelve la lista de archivos."""
    entero = dither_a_uint8(rgb)
    if alfa is not None:
        a8 = np.clip(np.rint(alfa * 255), 0, 255).astype(np.uint8)
        imagen = Image.fromarray(np.dstack([entero, a8]), "RGBA")
    else:
        imagen = Image.fromarray(entero, "RGB")
    archivos = []
    for ancho in anchos:
        ruta = destino if ancho == anchos[0] else nombre_tamano(destino, ancho)
        im = imagen if ancho == imagen.width else imagen.resize((ancho, max(1, round(imagen.height * ancho / imagen.width))), Image.LANCZOS)
        if alfa is None:
            im.save(ruta, quality=calidad, method=6)
        else:
            im.save(ruta, quality=calidad, method=6, exact=False)
        archivos.append(ruta)
    return archivos


def recortar_sin_fondo(original, alfa, tela):
    """Foto sin el fondo blanco: RGB desmezclado y alfa de cobertura (para el escenario del estudio)."""
    rgb = np.where(alfa[..., None] > 0, tela, original.astype(np.float64))
    return rgb, alfa
