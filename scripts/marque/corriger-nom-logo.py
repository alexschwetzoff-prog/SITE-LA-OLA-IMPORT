"""Corrige « La Ola Impression » en « La Ola Import » sur le logo raster (version provisoire).
Garde « La Ola Imp », efface « ression », recolle « o » et « r » d'origine et construit
un « t » avec le « l » de « Ola » raccourci + une barre.
Usage : python3 corriger.py <source.jpeg> <sortie.png>
"""
import sys
import numpy as np
import cv2
from PIL import Image

src, out = sys.argv[1], sys.argv[2]
im = np.array(Image.open(src).convert("RGB")).astype(np.float32)
H, W = im.shape[:2]
YY, XX = np.mgrid[0:H, 0:W]
mx = im.max(2); mn = im.min(2)
white = (mn > 175) & (mx - mn < 60)
wave = ((mx - mn) > 90) & (mx > 130)          # pixel coloré du fond de vague
fill = white.astype(np.uint8).copy()
cv2.floodFill(fill, np.zeros((H + 2, W + 2), np.uint8), (0, 0), 2)
outside = fill == 2
def disk(r): return cv2.getStructuringElement(cv2.MORPH_ELLIPSE, (2 * r + 1, 2 * r + 1))
near_out = cv2.dilate(outside.astype(np.uint8), disk(12)) > 0

P_END = 912   # fin du « p » (le « r » commence après)

# ---------- glyphes source (découpe par zones) ----------
def glyph(core, rad=17):
    reg = cv2.dilate(core.astype(np.uint8), disk(rad)) > 0
    m = reg & ~wave & ~outside & ~(white & ~core)
    a = cv2.GaussianBlur(m.astype(np.float32), (3, 3), 0)
    a[~reg] = 0
    return a

band = (YY >= 600) & (YY <= 752)
o_core = white & band & (XX >= 1212) & (XX <= 1302)
r_core = white & band & (XX >= P_END + 2) & (XX <= 962) & (YY >= 612)
l_xmax = np.where(YY < 650, 562, 545 - (YY - 650) * 0.33)
l_core = white & (YY >= 568) & (YY <= 752) & (XX >= 486) & (XX <= l_xmax)
def largest(m):
    n, lab, st, _ = cv2.connectedComponentsWithStats(m.astype(np.uint8), connectivity=8)
    k = 1 + np.argmax(st[1:, cv2.CC_STAT_AREA]); return lab == k
o_core, r_core, l_core = largest(o_core), largest(r_core), largest(l_core)
o_a, r_a, l_a = glyph(o_core), glyph(r_core), glyph(l_core)

# ---------- 1. effacer « ression » ----------
txt = ~wave & ~outside
E = txt & (XX >= P_END - 1) & (XX <= 1430) & (YY >= 568) & (YY <= 785)
E &= ~(near_out & ~white)                       # garder le contour du bord de vague
und = (YY >= 755) & (XX <= 1045)                # garder le soulignement
E &= ~und
p_keep = cv2.dilate((white & (XX < P_END) & (YY > 600)).astype(np.uint8), disk(16)) > 0
E &= ~p_keep
E = (cv2.dilate(E.astype(np.uint8), disk(7)) > 0) & ~outside & ~und & ~p_keep & ~(near_out & ~white)
E &= (YY >= 566)

# remplissage : ajustement polynomial local sur la vague autour, puis inpainting des détails
ring = (cv2.dilate(E.astype(np.uint8), disk(40)) > 0) & ~E & wave & (YY > 540)
ry, rx = np.where(ring)
def feats(x, y):
    x = (x - 1150) / 300.0; y = (y - 670) / 150.0
    return np.stack([np.ones_like(x), x, y, x * x, x * y, y * y, x ** 3, x * x * y, x * y * y, y ** 3], 1)
A = feats(rx.astype(float), ry.astype(float))
ey, ex = np.where(E)
F = feats(ex.astype(float), ey.astype(float))
fit = im.copy()
for ch in range(3):
    coef, *_ = np.linalg.lstsq(A, im[ry, rx, ch], rcond=None)
    fit[ey, ex, ch] = F @ coef
fit = np.clip(fit, 0, 255)
inp = cv2.inpaint(np.clip(im, 0, 255).astype(np.uint8), E.astype(np.uint8) * 255, 9, cv2.INPAINT_TELEA).astype(np.float32)
dist = cv2.distanceTransform(E.astype(np.uint8), cv2.DIST_L2, 5)
w = np.clip(dist / 4.0, 0, 1)[..., None]       # près du bord : inpainting ; au cœur : ajustement lisse
canvas = im.copy()
canvas[E] = (inp * (1 - w) + fit * w)[E]
canvas = cv2.GaussianBlur(canvas, (0, 0), 2.0) * E[..., None] + canvas * (~E)[..., None]

# ---------- 2. recoller o, r et construire t ----------
def bounds(m):
    ys, xs = np.where(m); return xs.min(), ys.min(), xs.max(), ys.max()

def paste(a, dx, dy, sy=1.0):
    global canvas
    x0, y0, x1, y1 = bounds(a > 0.02)
    x0 -= 2; y0 -= 2; x1 += 3; y1 += 3
    patch = im[y0:y1, x0:x1]; pa = a[y0:y1, x0:x1]
    oy = y0
    if sy != 1.0:
        nh = int(round((y1 - y0) * sy))
        patch = cv2.resize(patch, (x1 - x0, nh), interpolation=cv2.INTER_CUBIC)
        pa = cv2.resize(pa, (x1 - x0, nh), interpolation=cv2.INTER_LINEAR)
        oy = y1 - nh
    h, w_ = pa.shape
    X, Y = x0 + dx, oy + dy
    pa = np.clip(pa, 0, 1)[..., None]
    canvas[Y:Y + h, X:X + w_] = canvas[Y:Y + h, X:X + w_] * (1 - pa) + patch * pa

pb = bounds(white & (XX < P_END) & (XX > 860) & band)
ob, rb, lb = bounds(o_core), bounds(r_core), bounds(l_core)
GAP = 12
slope = -0.03
base = rb[3]                                   # ligne de base au niveau du r d'origine
dx_o = pb[2] + GAP - ob[0]
dy_o = int(round(base + slope * (pb[2] - rb[0]) - ob[3]))
paste(o_a, dx_o, dy_o)
o_right = ob[2] + dx_o
dx_r = o_right + GAP - rb[0]
dy_r = int(round(slope * dx_r))
paste(r_a, dx_r, dy_r)
r_right = rb[2] + dx_r

SY = 0.82
dx_t = r_right + GAP + 16 - lb[0]
base_t = int(round(base + slope * (r_right - rb[0])))
dy_t = base_t - lb[3]
navy_c = np.median(im[(mx < 90) & ~outside], 0)
white_c = np.median(im[white & ~outside], 0)
xh = int(round(base_t - (rb[3] - rb[1]) * 0.86))
cx = int((lb[0] + lb[2]) / 2 + dx_t + 4)
pA, pB = (cx - 32, xh + 3), (cx + 36, xh - 2)
def line_alpha(width):
    m = np.zeros((H, W), np.uint8); cv2.line(m, pA, pB, 255, width, cv2.LINE_AA)
    return (m.astype(np.float32) / 255)[..., None]
a = line_alpha(22 + 2 * 11); canvas = canvas * (1 - a) + navy_c * a
paste(l_a, dx_t, dy_t, SY)
a = line_alpha(22); canvas = canvas * (1 - a) + white_c * a

Image.fromarray(np.clip(canvas, 0, 255).astype(np.uint8)).save(out)
print("ok", dict(dx_o=int(dx_o), dy_o=dy_o, dx_r=int(dx_r), dx_t=int(dx_t), dy_t=int(dy_t), xh=xh))
