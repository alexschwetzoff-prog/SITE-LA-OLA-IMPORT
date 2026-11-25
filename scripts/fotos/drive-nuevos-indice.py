#!/usr/bin/env python3
"""Registra en data/fotos-catalogo.json las fotos de las casquettes y los couteaux nuevos (y de Zora) con la colocación del
motivo « Votre logo ici » (scripts/fotos/drive-nuevos-logo.json). Idempotente: se puede relanzar.

    python3 scripts/fotos/drive-nuevos-indice.py
"""
import json
from pathlib import Path
from PIL import Image

RAIZ = Path(__file__).resolve().parents[2]
colocaciones = json.loads((RAIZ / 'scripts/fotos/drive-nuevos-logo.json').read_text(encoding='utf-8'))
ruta = RAIZ / 'data/fotos-catalogo.json'
indice = json.loads(ruta.read_text(encoding='utf-8'))

# slug de variante en el JSON de recortes por nombre de color (los nombres de color son la clave del índice)
VARIANTES = {
    'barny': {'Blanc et rouge': 'blanc-rouge', 'Blanc et bleu royal': 'blanc-bleu', 'Blanc et noir': 'blanc-noir'},
    'calisto': {'Rouge': 'rouge'},
    'eris': {'Blanc': 'blanc', 'Bleu roi': 'bleu-roi', 'Orange': 'orange', 'Bleu marine': 'bleu-marine', 'Noir': 'noir', 'Rouge': 'rouge', 'Vert citron': 'vert-citron', 'Turquoise': 'turquoise'},
    'tarvos': {'Écru': 'ecru'},
    'couteau-kaide': {'Bambou': 'bambou'},
    'zora': {'Argenté': 'argente'},
    'couteau-multifonction-noir': {'Noir': 'noir'},
    'couteau-multifonction-bois': {'Bois': 'bois'},
}


def pos(frac, lienzo):
    x, y, ancho, giro = frac
    w, h = lienzo
    return {'x': round(x * w, 1), 'y': round(y * h, 1), 'ancho': round(ancho * w, 1), 'giro': giro, 'marca': 'tu-logo-aqui', 'lienzo': [w, h]}


for modelo, colores in colocaciones.items():
    if modelo.startswith('_'):
        continue
    for color, lados in colores.items():
        v = VARIANTES[modelo][color]
        base = f'/productos/catalogo/{modelo}/{v}'
        entrada = {'delante': f'{base}.webp', 'real': True, 'ejemplo': 'tu-logo-aqui'}
        entrada['diseno'] = pos(lados['delante'], Image.open(RAIZ / 'public' / f'{base[1:]}.webp').size)
        tras = RAIZ / 'public' / f'{base[1:]}-detras.webp'
        if tras.exists():
            entrada['detras'] = f'{base}-detras.webp'
            entrada['realDetras'] = True
            if 'detras' in lados:
                entrada['disenoDetras'] = pos(lados['detras'], Image.open(tras).size)
        indice.setdefault(modelo, {})[color] = entrada
ruta.write_text(json.dumps(indice, ensure_ascii=False, indent=2) + '\n', encoding='utf-8')
print('índice actualizado:', ', '.join(k for k in colocaciones if not k.startswith('_')))
