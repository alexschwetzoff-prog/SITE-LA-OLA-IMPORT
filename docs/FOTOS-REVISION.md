# Revisión de fotos del catálogo · fase 10 (19/10/2026)

Revisión estricta de las fotos publicadas de los 30 productos, todos los colores, delante y detrás: etiquetas, marcas y textos del fabricante (etiqueta interior del cuello, etiquetas laterales, hang tags, estampados interiores, marcas en gorras), encuadre y coherencia entre colores y vistas. Se parte siempre de los originales del proveedor sin tocar (`assets/productos/originales-proveedor-hd/` y `originales-proveedor/`, carpetas ignoradas por git y fuera de `public/`): cada foto publicada sale de su original en una sola pasada (`scripts/fotos/preparar-fotos-estudio.py` y `preparar-fotos-productos.py`), nunca de un retoque anterior.

## Cómo se ha comprobado

- **Etiquetas**: detección foto a foto en la zona del cuello (`scripts/fotos/etiquetas.py`: ΔE respecto a la tela local, umbral propio para telas jaspeadas, crecimiento hasta la sombra de la etiqueta sin tragarse el ribete) y relleno por clonado de Poisson de un parche de tela vecina (textura y costuras reales; relleno de Laplace con textura cuando no hay parche que valga). Hojas antes/después de cada cuello, a 2×, en `docs/revision-colores/etiquetas/`.
- **Marcas por todo el objeto**: `scripts/fotos/revisar-marcas.py` busca en cada foto publicada manchas pequeñas de alto contraste (candidatas a etiqueta lateral, hang tag o marca) y las saca ampliadas a 3× en `docs/revision-colores/marcas/<slug>.jpg`; cada candidata tiene su veredicto en `docs/revision-colores/marcas.csv`.
- **OCR**: `scripts/fotos/ocr-fotos.mjs` (tesseract.js) lee todas las imágenes de `public/` (`docs/revision-colores/ocr.csv`) y, en modo bloque, los recortes ampliados de las candidatas (`ocr-recortes.csv`), buscando el nombre del proveedor y los de su grupo con variantes de mayúsculas, espacios y confusiones del OCR.
- **Grep** en el repositorio (rutas, `alt`, JSON del catálogo, comentarios, nombres de archivo) de esos nombres; **metadatos** EXIF/XMP/IPTC/ICC de todas las imágenes publicadas (`scripts/fotos/limpiar-metadatos.py`).
- **Encuadre**: `docs/fotos-proveedor/proceso.csv` lleva, por foto, la desviación respecto a la base y la normalización aplicada (gorras: reencuadre foto a foto a la corona de Freya, delanteras y traseras; bolsas: anchura y centro; prendas: altura y centro cuando difieren más de un 0,8 % o 2 px). Auditoría automática muestra ↔ foto y delante ↔ detrás: `scripts/fotos/auditar-colores.py`.

## Resumen: 590 fotos · 433 limpias · 157 retocadas · 0 dudosas

| Producto | Color | Vista | Estado | Qué se hizo |
| --- | --- | --- | --- | --- |
| Atomic 150 | Blanco | delante | retocada | etiqueta del cuello retocada en (570, 68, 615, 129) px (poisson, parche (+51, +0)) |
| Atomic 150 | Blanco | detrás | limpia | nada: la foto del proveedor ya estaba limpia |
| Atomic 150 | Negro | delante | retocada | etiqueta del cuello retocada en (576, 68, 610, 123) px (poisson, parche (-40, +0)) |
| Atomic 150 | Negro | detrás | limpia | nada: la foto del proveedor ya estaba limpia |
| Atomic 150 | Amarillo | delante | retocada | etiqueta del cuello retocada en (570, 68, 615, 129) px (poisson, espejo de las dos franjas laterales, mitad de arriba, solo textura) |
| Atomic 150 | Amarillo | detrás | limpia | nada: la foto del proveedor ya estaba limpia |
| Atomic 150 | Royal | delante | retocada | etiqueta del cuello retocada en (571, 68, 614, 129) px (poisson, parche (-49, +0)) |
| Atomic 150 | Royal | detrás | limpia | nada: la foto del proveedor ya estaba limpia |
| Atomic 150 | Turquesa | delante | retocada | etiqueta del cuello retocada en (570, 67, 615, 129) px (poisson, parche (+51, +0)) |
| Atomic 150 | Turquesa | detrás | limpia | nada: la foto del proveedor ya estaba limpia |
| Atomic 150 | Verde kelly | delante | retocada | etiqueta del cuello retocada en (571, 68, 614, 128) px (poisson, parche (+49, +0)) |
| Atomic 150 | Verde kelly | detrás | limpia | nada: la foto del proveedor ya estaba limpia |
| Atomic 150 | Naranja | delante | retocada | etiqueta del cuello retocada en (571, 68, 614, 129) px (poisson, parche (-49, +0)) |
| Atomic 150 | Naranja | detrás | limpia | nada: la foto del proveedor ya estaba limpia |
| Atomic 150 | Marino | delante | retocada | etiqueta del cuello retocada en (572, 68, 614, 128) px (poisson, parche (-48, +0)) |
| Atomic 150 | Marino | detrás | limpia | nada: la foto del proveedor ya estaba limpia |
| Atomic 150 | Gris vigoré | delante | retocada | etiqueta del cuello retocada en (571, 67, 614, 129) px (poisson, parche (+49, +0), solo textura) |
| Atomic 150 | Gris vigoré | detrás | limpia | nada: la foto del proveedor ya estaba limpia |
| Atomic 150 | Rojo | delante | retocada | etiqueta del cuello retocada en (571, 68, 614, 129) px (poisson, parche (-49, +0)) |
| Atomic 150 | Rojo | detrás | limpia | nada: la foto del proveedor ya estaba limpia |
| Atomic 150 | Fucsia | delante | retocada | etiqueta del cuello retocada en (570, 67, 616, 129) px (poisson, parche (+52, +0)) |
| Atomic 150 | Fucsia | detrás | limpia | nada: la foto del proveedor ya estaba limpia |
| Austral | Blanco | delante | retocada | etiqueta del cuello retocada en (580, 58, 618, 113) px (caja fijada a mano · poisson, parche (+44, +0), solo textura); la caja detectada dejaba una línea oscura de la etiqueta bajo la costura del cuello: caja fijada a mano (estudio y catálogo) |
| Austral | Blanco | detrás | limpia | nada: la foto del proveedor ya estaba limpia |
| Austral | Negro | delante | retocada | etiqueta del cuello retocada en (581, 60, 619, 113) px (poisson, parche (+44, +0)) |
| Austral | Negro | detrás | limpia | nada: la foto del proveedor ya estaba limpia |
| Austral | Amarillo | delante | retocada | etiqueta del cuello retocada en (580, 59, 619, 113) px (poisson, parche (+45, +0), solo textura); 1 mancha(s) candidata(s) del barrido revisada(s) a ojo y por OCR: costuras, huecos de fondo o piezas del producto, ninguna marca |
| Austral | Amarillo | detrás | limpia | 2 mancha(s) candidata(s) del barrido revisada(s) a ojo y por OCR: costuras, huecos de fondo o piezas del producto, ninguna marca |
| Austral | Royal | delante | retocada | etiqueta del cuello retocada en (580, 59, 619, 113) px (poisson, parche (+45, +0), solo textura) |
| Austral | Royal | detrás | limpia | nada: la foto del proveedor ya estaba limpia |
| Austral | Turquesa | delante | retocada | etiqueta del cuello retocada en (580, 59, 619, 113) px (poisson, parche (+45, +0), solo textura); 1 mancha(s) candidata(s) del barrido revisada(s) a ojo y por OCR: costuras, huecos de fondo o piezas del producto, ninguna marca |
| Austral | Turquesa | detrás | limpia | 1 mancha(s) candidata(s) del barrido revisada(s) a ojo y por OCR: costuras, huecos de fondo o piezas del producto, ninguna marca |
| Austral | Verde kelly | delante | retocada | etiqueta del cuello retocada en (580, 59, 619, 113) px (poisson, parche (+45, +0), solo textura); 1 mancha(s) candidata(s) del barrido revisada(s) a ojo y por OCR: costuras, huecos de fondo o piezas del producto, ninguna marca |
| Austral | Verde kelly | detrás | limpia | 1 mancha(s) candidata(s) del barrido revisada(s) a ojo y por OCR: costuras, huecos de fondo o piezas del producto, ninguna marca |
| Austral | Marino | delante | retocada | etiqueta del cuello retocada en (581, 59, 619, 113) px (poisson, parche (+44, +0)) |
| Austral | Marino | detrás | limpia | nada: la foto del proveedor ya estaba limpia |
| Austral | Rojo | delante | retocada | etiqueta del cuello retocada en (580, 59, 620, 113) px (poisson, parche (+46, +0), solo textura); 2 mancha(s) candidata(s) del barrido revisada(s) a ojo y por OCR: costuras, huecos de fondo o piezas del producto, ninguna marca |
| Austral | Rojo | detrás | limpia | nada: la foto del proveedor ya estaba limpia |
| Bull | Blanco | delante | limpia | nada: la foto del proveedor ya estaba limpia |
| Bull | Blanco | detrás | limpia | nada: la foto del proveedor ya estaba limpia |
| Bull | Negro | delante | limpia | nada: la foto del proveedor ya estaba limpia |
| Bull | Negro | detrás | limpia | nada: la foto del proveedor ya estaba limpia |
| Bull | Camel | delante | limpia | nada: la foto del proveedor ya estaba limpia |
| Bull | Camel | detrás | limpia | nada: la foto del proveedor ya estaba limpia |
| Bull | Gris | delante | limpia | nada: la foto del proveedor ya estaba limpia |
| Bull | Gris | detrás | limpia | nada: la foto del proveedor ya estaba limpia |
| Bull | Coral | delante | limpia | nada: la foto del proveedor ya estaba limpia |
| Bull | Coral | detrás | limpia | nada: la foto del proveedor ya estaba limpia |
| Bull | Blanco roto | delante | limpia | nada: la foto del proveedor ya estaba limpia |
| Bull | Blanco roto | detrás | limpia | nada: la foto del proveedor ya estaba limpia |
| Bull | Salmón | delante | limpia | nada: la foto del proveedor ya estaba limpia |
| Bull | Salmón | detrás | limpia | nada: la foto del proveedor ya estaba limpia |
| Bull | Gris plomo | delante | limpia | nada: la foto del proveedor ya estaba limpia |
| Bull | Gris plomo | detrás | limpia | nada: la foto del proveedor ya estaba limpia |
| Bull | Azul claro | delante | limpia | nada: la foto del proveedor ya estaba limpia |
| Bull | Azul claro | detrás | limpia | nada: la foto del proveedor ya estaba limpia |
| Bull | Verde menta | delante | limpia | nada: la foto del proveedor ya estaba limpia |
| Bull | Verde menta | detrás | limpia | nada: la foto del proveedor ya estaba limpia |
| Bull | Esmeralda | delante | limpia | nada: la foto del proveedor ya estaba limpia |
| Bull | Esmeralda | detrás | limpia | nada: la foto del proveedor ya estaba limpia |
| Bull | Naranja mandarina | delante | limpia | nada: la foto del proveedor ya estaba limpia |
| Bull | Naranja mandarina | detrás | limpia | nada: la foto del proveedor ya estaba limpia |
| Bull | Rojo | delante | limpia | nada: la foto del proveedor ya estaba limpia |
| Bull | Rojo | detrás | limpia | nada: la foto del proveedor ya estaba limpia |
| Bull | Malva | delante | limpia | nada: la foto del proveedor ya estaba limpia |
| Bull | Malva | detrás | limpia | nada: la foto del proveedor ya estaba limpia |
| Bull | Lila | delante | limpia | nada: la foto del proveedor ya estaba limpia |
| Bull | Lila | detrás | limpia | nada: la foto del proveedor ya estaba limpia |
| Cobain | Amarillo vainilla | delante | limpia | nada: la foto del proveedor ya estaba limpia |
| Cobain | Amarillo vainilla | detrás | limpia | nada: la foto del proveedor ya estaba limpia |
| Cobain | Gris perla | delante | limpia | nada: la foto del proveedor ya estaba limpia |
| Cobain | Gris perla | detrás | limpia | nada: la foto del proveedor ya estaba limpia |
| Cobain | Gris lavanda | delante | limpia | 1 mancha(s) candidata(s) del barrido revisada(s) a ojo y por OCR: costuras, huecos de fondo o piezas del producto, ninguna marca |
| Cobain | Gris lavanda | detrás | limpia | nada: la foto del proveedor ya estaba limpia |
| Cobain | Caqui | delante | limpia | nada: la foto del proveedor ya estaba limpia |
| Cobain | Caqui | detrás | limpia | nada: la foto del proveedor ya estaba limpia |
| Cobain | Melocotón | delante | limpia | nada: la foto del proveedor ya estaba limpia |
| Cobain | Melocotón | detrás | limpia | nada: la foto del proveedor ya estaba limpia |
| Cobain | Verde salvia | delante | limpia | nada: la foto del proveedor ya estaba limpia |
| Cobain | Verde salvia | detrás | limpia | nada: la foto del proveedor ya estaba limpia |
| Jamaica | Blanco | delante | retocada | etiqueta del cuello retocada en (570, 44, 642, 105) px (poisson, franjas laterales fundidas con la costura alineada (+0 px)) |
| Jamaica | Blanco | detrás | limpia | nada: la foto del proveedor ya estaba limpia |
| Jamaica | Negro | delante | retocada | etiqueta del cuello retocada en (589, 40, 640, 103) px (poisson, franjas laterales fundidas con la costura alineada (+0 px)) |
| Jamaica | Negro | detrás | limpia | nada: la foto del proveedor ya estaba limpia |
| Jamaica | Amarillo | delante | retocada | etiqueta del cuello retocada en (586, 39, 643, 103) px (poisson, franjas laterales fundidas con la costura alineada (-3 px)) |
| Jamaica | Amarillo | detrás | limpia | nada: la foto del proveedor ya estaba limpia |
| Jamaica | Royal | delante | retocada | etiqueta del cuello retocada en (586, 39, 643, 104) px (poisson, franjas laterales fundidas con la costura alineada (-3 px)) |
| Jamaica | Royal | detrás | limpia | nada: la foto del proveedor ya estaba limpia |
| Jamaica | Celeste | delante | retocada | etiqueta del cuello retocada en (587, 39, 640, 103) px (poisson, franjas laterales fundidas con la costura alineada (-2 px)) |
| Jamaica | Celeste | detrás | limpia | nada: la foto del proveedor ya estaba limpia |
| Jamaica | Celeste claro | delante | retocada | etiqueta del cuello retocada en (586, 39, 643, 103) px (poisson, franjas laterales fundidas con la costura alineada (-3 px)) |
| Jamaica | Celeste claro | detrás | limpia | nada: la foto del proveedor ya estaba limpia |
| Jamaica | Gris | delante | retocada | etiqueta del cuello retocada en (584, 37, 644, 105) px (caja fijada a mano · poisson, franjas laterales fundidas con la costura alineada (-2 px)); la caja detectada se pasaba hacia el hombro y el relleno dejaba una marca clara: caja fijada a mano |
| Jamaica | Gris | detrás | limpia | nada: la foto del proveedor ya estaba limpia |
| Jamaica | Verde manzana | delante | retocada | etiqueta del cuello retocada en (586, 39, 642, 103) px (poisson, franjas laterales fundidas con la costura alineada (-3 px)) |
| Jamaica | Verde manzana | detrás | limpia | nada: la foto del proveedor ya estaba limpia |
| Jamaica | Turquesa | delante | retocada | etiqueta del cuello retocada en (588, 39, 640, 103) px (poisson, franjas laterales fundidas con la costura alineada (-3 px)) |
| Jamaica | Turquesa | detrás | limpia | nada: la foto del proveedor ya estaba limpia |
| Jamaica | Coral | delante | retocada | etiqueta del cuello retocada en (587, 39, 642, 103) px (poisson, franjas laterales fundidas con la costura alineada (-3 px)) |
| Jamaica | Coral | detrás | limpia | nada: la foto del proveedor ya estaba limpia |
| Jamaica | Blanco roto | delante | retocada | etiqueta del cuello retocada en (586, 39, 643, 104) px (poisson, franjas laterales fundidas con la costura alineada (-3 px)) |
| Jamaica | Blanco roto | detrás | limpia | nada: la foto del proveedor ya estaba limpia |
| Jamaica | Verde oliva | delante | retocada | etiqueta del cuello retocada en (588, 40, 640, 103) px (poisson, franjas laterales fundidas con la costura alineada (-3 px)) |
| Jamaica | Verde oliva | detrás | limpia | nada: la foto del proveedor ya estaba limpia |
| Jamaica | Verde kelly | delante | retocada | etiqueta del cuello retocada en (572, 44, 634, 104) px (poisson, franjas laterales fundidas con la costura alineada (-11 px)) |
| Jamaica | Verde kelly | detrás | limpia | nada: la foto del proveedor ya estaba limpia |
| Jamaica | Beige | delante | retocada | etiqueta del cuello retocada en (587, 39, 641, 104) px (poisson, franjas laterales fundidas con la costura alineada (-3 px)) |
| Jamaica | Beige | detrás | limpia | nada: la foto del proveedor ya estaba limpia |
| Jamaica | Verde agua | delante | retocada | etiqueta del cuello retocada en (588, 39, 640, 103) px (poisson, franjas laterales fundidas con la costura alineada (-3 px)) |
| Jamaica | Verde agua | detrás | limpia | nada: la foto del proveedor ya estaba limpia |
| Jamaica | Dorado | delante | retocada | etiqueta del cuello retocada en (586, 39, 643, 104) px (poisson, franjas laterales fundidas con la costura alineada (-3 px)) |
| Jamaica | Dorado | detrás | limpia | nada: la foto del proveedor ya estaba limpia |
| Jamaica | Rosa palo | delante | retocada | etiqueta del cuello retocada en (571, 44, 642, 104) px (poisson, franjas laterales fundidas con la costura alineada (+0 px)) |
| Jamaica | Rosa palo | detrás | limpia | nada: la foto del proveedor ya estaba limpia |
| Jamaica | Naranja | delante | retocada | etiqueta del cuello retocada en (587, 39, 642, 103) px (poisson, franjas laterales fundidas con la costura alineada (-3 px)) |
| Jamaica | Naranja | detrás | limpia | nada: la foto del proveedor ya estaba limpia |
| Jamaica | Azul cielo | delante | retocada | etiqueta del cuello retocada en (587, 39, 641, 103) px (poisson, franjas laterales fundidas con la costura alineada (-3 px)) |
| Jamaica | Azul cielo | detrás | limpia | nada: la foto del proveedor ya estaba limpia |
| Jamaica | Azul petróleo | delante | retocada | etiqueta del cuello retocada en (587, 39, 641, 103) px (poisson, franjas laterales fundidas con la costura alineada (-3 px)) |
| Jamaica | Azul petróleo | detrás | limpia | nada: la foto del proveedor ya estaba limpia |
| Jamaica | Antracita | delante | retocada | etiqueta del cuello retocada en (589, 44, 639, 103) px (poisson, franjas laterales fundidas con la costura alineada (-2 px)) |
| Jamaica | Antracita | detrás | limpia | nada: la foto del proveedor ya estaba limpia |
| Jamaica | Rosa claro | delante | retocada | etiqueta del cuello retocada en (569, 39, 647, 103) px (poisson, franjas laterales fundidas con la costura alineada (-1 px)) |
| Jamaica | Rosa claro | detrás | limpia | nada: la foto del proveedor ya estaba limpia |
| Jamaica | Rosa | delante | retocada | etiqueta del cuello retocada en (587, 39, 641, 103) px (poisson, franjas laterales fundidas con la costura alineada (-3 px)); 1 mancha(s) candidata(s) del barrido revisada(s) a ojo y por OCR: costuras, huecos de fondo o piezas del producto, ninguna marca |
| Jamaica | Rosa | detrás | limpia | nada: la foto del proveedor ya estaba limpia |
| Jamaica | Marino | delante | retocada | etiqueta del cuello retocada en (584, 37, 644, 105) px (caja fijada a mano · poisson, franjas laterales fundidas con la costura alineada (+0 px)); la caja detectada se quedaba corta por arriba y quedaba un punto blanco de la etiqueta: caja fijada a mano |
| Jamaica | Marino | detrás | limpia | nada: la foto del proveedor ya estaba limpia |
| Jamaica | Verde botella | delante | retocada | etiqueta del cuello retocada en (587, 40, 640, 103) px (poisson, franjas laterales fundidas con la costura alineada (-3 px)) |
| Jamaica | Verde botella | detrás | limpia | nada: la foto del proveedor ya estaba limpia |
| Jamaica | Granate | delante | retocada | etiqueta del cuello retocada en (573, 44, 633, 104) px (poisson, franjas laterales fundidas con la costura alineada (+0 px)) |
| Jamaica | Granate | detrás | limpia | nada: la foto del proveedor ya estaba limpia |
| Jamaica | Gris vigoré | delante | retocada | etiqueta del cuello retocada en (554, 49, 633, 103) px (poisson, franjas laterales fundidas con la costura alineada (-2 px)); encuadre normalizado ×0.942 (+35, +0) |
| Jamaica | Gris vigoré | detrás | limpia | nada: la foto del proveedor ya estaba limpia |
| Jamaica | Rojo | delante | retocada | etiqueta del cuello retocada en (586, 39, 643, 104) px (poisson, franjas laterales fundidas con la costura alineada (-3 px)); 2 mancha(s) candidata(s) del barrido revisada(s) a ojo y por OCR: costuras, huecos de fondo o piezas del producto, ninguna marca |
| Jamaica | Rojo | detrás | limpia | nada: la foto del proveedor ya estaba limpia |
| Jamaica | Frambuesa | delante | retocada | etiqueta del cuello retocada en (588, 40, 640, 104) px (poisson, franjas laterales fundidas con la costura alineada (+0 px)) |
| Jamaica | Frambuesa | detrás | limpia | nada: la foto del proveedor ya estaba limpia |
| Jamaica | Púrpura | delante | retocada | etiqueta del cuello retocada en (588, 39, 641, 103) px (poisson, franjas laterales fundidas con la costura alineada (-2 px)) |
| Jamaica | Púrpura | detrás | limpia | nada: la foto del proveedor ya estaba limpia |
| Jamaica | Lila | delante | retocada | etiqueta del cuello retocada en (587, 39, 641, 104) px (poisson, franjas laterales fundidas con la costura alineada (-3 px)) |
| Jamaica | Lila | detrás | limpia | nada: la foto del proveedor ya estaba limpia |
| Jamaica | Crema | delante | retocada | etiqueta del cuello retocada en (582, 38, 649, 103) px (poisson, franjas laterales fundidas con la costura alineada (-2 px)) |
| Jamaica | Crema | detrás | limpia | nada: la foto del proveedor ya estaba limpia |
| Jamaica | Fucsia | delante | retocada | etiqueta del cuello retocada en (584, 39, 645, 103) px (poisson, franjas laterales fundidas con la costura alineada (-2 px)); 1 mancha(s) candidata(s) del barrido revisada(s) a ojo y por OCR: costuras, huecos de fondo o piezas del producto, ninguna marca |
| Jamaica | Fucsia | detrás | limpia | nada: la foto del proveedor ya estaba limpia |
| Jamaica | Verde primavera | delante | retocada | etiqueta del cuello retocada en (584, 39, 644, 104) px (poisson, franjas laterales fundidas con la costura alineada (-2 px)) |
| Jamaica | Verde primavera | detrás | limpia | nada: la foto del proveedor ya estaba limpia |
| Jamaica | Azul lavanda | delante | retocada | etiqueta del cuello retocada en (587, 39, 641, 103) px (poisson, franjas laterales fundidas con la costura alineada (-3 px)) |
| Jamaica | Azul lavanda | detrás | limpia | nada: la foto del proveedor ya estaba limpia |
| Jamaica | Aguamarina | delante | retocada | etiqueta del cuello retocada en (588, 39, 640, 103) px (poisson, franjas laterales fundidas con la costura alineada (-2 px)) |
| Jamaica | Aguamarina | detrás | limpia | nada: la foto del proveedor ya estaba limpia |
| Pointer | Blanco | delante | retocada | etiqueta del cuello retocada en (573, 35, 617, 61) px (poisson, parche (-50, +0)) |
| Pointer | Blanco | detrás | limpia | nada: la foto del proveedor ya estaba limpia |
| Pointer | Negro | delante | retocada | etiqueta del cuello retocada en (573, 38, 629, 59) px (poisson, parche (+0, +27)) |
| Pointer | Negro | detrás | limpia | 4 mancha(s) candidata(s) del barrido revisada(s) a ojo y por OCR: costuras, huecos de fondo o piezas del producto, ninguna marca |
| Pointer | Royal | delante | retocada | etiqueta del cuello retocada en (574, 36, 615, 61) px (poisson, parche (-47, +0)); 2 mancha(s) candidata(s) del barrido revisada(s) a ojo y por OCR: costuras, huecos de fondo o piezas del producto, ninguna marca |
| Pointer | Royal | detrás | limpia | 3 mancha(s) candidata(s) del barrido revisada(s) a ojo y por OCR: costuras, huecos de fondo o piezas del producto, ninguna marca |
| Pointer | Marino | delante | retocada | etiqueta del cuello retocada en (571, 38, 630, 59) px (poisson, parche (+0, +27)) |
| Pointer | Marino | detrás | limpia | 4 mancha(s) candidata(s) del barrido revisada(s) a ojo y por OCR: costuras, huecos de fondo o piezas del producto, ninguna marca |
| Pointer | Verde botella | delante | retocada | etiqueta del cuello retocada en (571, 38, 629, 60) px (poisson, parche (-64, +0)) |
| Pointer | Verde botella | detrás | limpia | 4 mancha(s) candidata(s) del barrido revisada(s) a ojo y por OCR: costuras, huecos de fondo o piezas del producto, ninguna marca |
| Pointer | Gris vigoré | delante | retocada | etiqueta del cuello retocada en (570, 35, 632, 63) px (caja fijada a mano · poisson, parche (-68, +0)); la detección automática no distinguía la etiqueta sobre la tela jaspeada: caja fijada a mano (ETIQUETAS_MANUALES) y rellenada igual que las demás |
| Pointer | Gris vigoré | detrás | limpia | nada: la foto del proveedor ya estaba limpia |
| Pointer | Rojo | delante | retocada | etiqueta del cuello retocada en (571, 38, 631, 60) px (poisson, parche (-66, +0)); 1 mancha(s) candidata(s) del barrido revisada(s) a ojo y por OCR: costuras, huecos de fondo o piezas del producto, ninguna marca |
| Pointer | Rojo | detrás | limpia | 3 mancha(s) candidata(s) del barrido revisada(s) a ojo y por OCR: costuras, huecos de fondo o piezas del producto, ninguna marca |
| Bahrain | Blanco | delante | retocada | etiqueta del cuello retocada en (587, 49, 628, 111) px (poisson, parche (-47, +0)) |
| Bahrain | Blanco | detrás | limpia | encuadre normalizado ×1.000 (-9, -0) |
| Bahrain | Negro | delante | retocada | etiqueta del cuello retocada en (586, 45, 628, 112) px (poisson, parche (-48, +0), solo textura); 2 mancha(s) candidata(s) del barrido revisada(s) a ojo y por OCR: costuras, huecos de fondo o piezas del producto, ninguna marca |
| Bahrain | Negro | detrás | limpia | encuadre normalizado ×1.000 (-8, +0) |
| Bahrain | Amarillo | delante | retocada | etiqueta del cuello retocada en (585, 48, 628, 112) px (poisson, parche (-49, +0), solo textura) |
| Bahrain | Amarillo | detrás | limpia | encuadre normalizado ×1.000 (-9, +0) |
| Bahrain | Royal | delante | retocada | etiqueta del cuello retocada en (586, 44, 628, 112) px (poisson, parche (-48, +0), solo textura) |
| Bahrain | Royal | detrás | limpia | encuadre normalizado ×1.000 (-9, +0) |
| Bahrain | Celeste | delante | retocada | etiqueta del cuello retocada en (586, 44, 628, 112) px (poisson, parche (-48, +0), solo textura) |
| Bahrain | Celeste | detrás | limpia | encuadre normalizado ×1.000 (-9, +0) |
| Bahrain | Turquesa | delante | retocada | etiqueta del cuello retocada en (586, 47, 628, 112) px (poisson, parche (-48, +0), solo textura) |
| Bahrain | Turquesa | detrás | limpia | encuadre normalizado ×1.000 (-9, +0) |
| Bahrain | Rosa coral | delante | retocada | etiqueta del cuello retocada en (586, 45, 628, 112) px (poisson, parche (-48, +0), solo textura); 2 mancha(s) candidata(s) del barrido revisada(s) a ojo y por OCR: costuras, huecos de fondo o piezas del producto, ninguna marca |
| Bahrain | Rosa coral | detrás | limpia | encuadre normalizado ×1.000 (-9, +0) |
| Bahrain | Verde militar | delante | retocada | etiqueta del cuello retocada en (586, 45, 628, 112) px (poisson, parche (-48, +0), solo textura) |
| Bahrain | Verde militar | detrás | limpia | encuadre normalizado ×1.000 (-9, +0) |
| Bahrain | Caqui | delante | retocada | etiqueta del cuello retocada en (586, 45, 628, 112) px (poisson, parche (-48, +0), solo textura) |
| Bahrain | Caqui | detrás | limpia | encuadre normalizado ×1.000 (-9, +0) |
| Bahrain | Amarillo flúor | delante | retocada | etiqueta del cuello retocada en (585, 44, 628, 112) px (poisson, parche (-49, +0), solo textura) |
| Bahrain | Amarillo flúor | detrás | limpia | encuadre normalizado ×1.000 (-9, +0) |
| Bahrain | Verde lima | delante | retocada | etiqueta del cuello retocada en (585, 48, 628, 112) px (poisson, parche (-49, +0), solo textura) |
| Bahrain | Verde lima | detrás | limpia | encuadre normalizado ×1.000 (-9, +0) |
| Bahrain | Naranja flúor | delante | retocada | etiqueta del cuello retocada en (585, 44, 628, 112) px (poisson, parche (-49, +0), solo textura) |
| Bahrain | Naranja flúor | detrás | limpia | encuadre normalizado ×1.000 (-9, +0) |
| Bahrain | Verde flúor | delante | retocada | etiqueta del cuello retocada en (586, 44, 628, 112) px (poisson, parche (-48, +0), solo textura) |
| Bahrain | Verde flúor | detrás | limpia | encuadre normalizado ×1.000 (-9, +0) |
| Bahrain | Verde | delante | retocada | etiqueta del cuello retocada en (585, 47, 628, 112) px (poisson, parche (-49, +0), solo textura) |
| Bahrain | Verde | detrás | limpia | encuadre normalizado ×1.000 (-9, +0) |
| Bahrain | Fucsia flúor | delante | retocada | etiqueta del cuello retocada en (586, 44, 628, 112) px (poisson, parche (-48, +0), solo textura); 2 mancha(s) candidata(s) del barrido revisada(s) a ojo y por OCR: costuras, huecos de fondo o piezas del producto, ninguna marca |
| Bahrain | Fucsia flúor | detrás | limpia | encuadre normalizado ×1.000 (-9, +0) |
| Bahrain | Coral flúor | delante | retocada | etiqueta del cuello retocada en (586, 45, 628, 112) px (poisson, parche (-48, +0), solo textura); 2 mancha(s) candidata(s) del barrido revisada(s) a ojo y por OCR: costuras, huecos de fondo o piezas del producto, ninguna marca |
| Bahrain | Coral flúor | detrás | limpia | encuadre normalizado ×1.000 (-9, +0) |
| Bahrain | Azul petróleo | delante | retocada | etiqueta del cuello retocada en (586, 43, 628, 112) px (poisson, parche (-48, +0), solo textura) |
| Bahrain | Azul petróleo | detrás | limpia | encuadre normalizado ×1.000 (-9, +0) |
| Bahrain | Antracita | delante | retocada | etiqueta del cuello retocada en (586, 45, 628, 112) px (poisson, parche (-48, +0), solo textura); 2 mancha(s) candidata(s) del barrido revisada(s) a ojo y por OCR: costuras, huecos de fondo o piezas del producto, ninguna marca |
| Bahrain | Antracita | detrás | limpia | encuadre normalizado ×1.000 (-9, +0) |
| Bahrain | Gris | delante | retocada | etiqueta del cuello retocada en (586, 44, 627, 111) px (poisson, parche (-47, +0), solo textura) |
| Bahrain | Gris | detrás | limpia | encuadre normalizado ×1.000 (-8, +0) |
| Bahrain | Marino | delante | retocada | etiqueta del cuello retocada en (586, 44, 628, 113) px (poisson, parche (-48, +0), solo textura); 2 mancha(s) candidata(s) del barrido revisada(s) a ojo y por OCR: costuras, huecos de fondo o piezas del producto, ninguna marca |
| Bahrain | Marino | detrás | limpia | encuadre normalizado ×1.000 (-9, +0) |
| Bahrain | Rojo | delante | retocada | etiqueta del cuello retocada en (586, 48, 628, 112) px (poisson, parche (-48, +0), solo textura) |
| Bahrain | Rojo | detrás | limpia | encuadre normalizado ×1.000 (-9, +0) |
| Bahrain | Morado | delante | retocada | etiqueta del cuello retocada en (585, 44, 628, 113) px (poisson, parche (-49, +0), solo textura); 1 mancha(s) candidata(s) del barrido revisada(s) a ojo y por OCR: costuras, huecos de fondo o piezas del producto, ninguna marca |
| Bahrain | Morado | detrás | limpia | encuadre normalizado ×1.000 (-8, +0) |
| Bahrain | Fucsia | delante | retocada | etiqueta del cuello retocada en (586, 47, 628, 112) px (poisson, parche (-48, +0), solo textura) |
| Bahrain | Fucsia | detrás | limpia | encuadre normalizado ×1.000 (-9, +0) |
| Bahrain | Aguamarina | delante | retocada | etiqueta del cuello retocada en (587, 45, 628, 112) px (poisson, parche (-47, +0), solo textura) |
| Bahrain | Aguamarina | detrás | limpia | encuadre normalizado ×1.000 (-9, +0) |
| Imola | Blanco | delante | retocada | etiqueta del cuello retocada en (581, 30, 634, 104) px (poisson, parche (-59, +0)) |
| Imola | Blanco | detrás | limpia | nada: la foto del proveedor ya estaba limpia |
| Imola | Negro | delante | retocada | etiqueta del cuello retocada en (581, 30, 634, 104) px (poisson, parche (-59, +0), solo textura); 2 mancha(s) candidata(s) del barrido revisada(s) a ojo y por OCR: costuras, huecos de fondo o piezas del producto, ninguna marca |
| Imola | Negro | detrás | limpia | nada: la foto del proveedor ya estaba limpia |
| Imola | Amarillo | delante | retocada | etiqueta del cuello retocada en (581, 30, 634, 104) px (poisson, espejo de las dos franjas laterales, mitad de arriba) |
| Imola | Amarillo | detrás | limpia | nada: la foto del proveedor ya estaba limpia |
| Imola | Royal | delante | retocada | etiqueta del cuello retocada en (581, 30, 634, 104) px (poisson, parche (-59, +0), solo textura); 1 mancha(s) candidata(s) del barrido revisada(s) a ojo y por OCR: costuras, huecos de fondo o piezas del producto, ninguna marca |
| Imola | Royal | detrás | limpia | nada: la foto del proveedor ya estaba limpia |
| Imola | Turquesa | delante | retocada | etiqueta del cuello retocada en (581, 30, 634, 104) px (poisson, parche (-59, +0), solo textura) |
| Imola | Turquesa | detrás | limpia | nada: la foto del proveedor ya estaba limpia |
| Imola | Amarillo flúor | delante | retocada | etiqueta del cuello retocada en (581, 30, 634, 104) px (poisson, espejo de las dos franjas laterales, mitad de arriba) |
| Imola | Amarillo flúor | detrás | limpia | nada: la foto del proveedor ya estaba limpia |
| Imola | Verde lima | delante | retocada | etiqueta del cuello retocada en (581, 30, 634, 104) px (poisson, parche (-59, +0), solo textura); 2 mancha(s) candidata(s) del barrido revisada(s) a ojo y por OCR: costuras, huecos de fondo o piezas del producto, ninguna marca |
| Imola | Verde lima | detrás | limpia | nada: la foto del proveedor ya estaba limpia |
| Imola | Naranja flúor | delante | retocada | etiqueta del cuello retocada en (581, 30, 634, 104) px (poisson, espejo de las dos franjas laterales, mitad de arriba, solo textura) |
| Imola | Naranja flúor | detrás | limpia | nada: la foto del proveedor ya estaba limpia |
| Imola | Verde flúor | delante | retocada | etiqueta del cuello retocada en (581, 30, 634, 104) px (poisson, espejo de las dos franjas laterales, mitad de arriba); 2 mancha(s) candidata(s) del barrido revisada(s) a ojo y por OCR: costuras, huecos de fondo o piezas del producto, ninguna marca |
| Imola | Verde flúor | detrás | limpia | nada: la foto del proveedor ya estaba limpia |
| Imola | Verde | delante | retocada | etiqueta del cuello retocada en (581, 30, 634, 104) px (poisson, espejo de las dos franjas laterales, mitad de arriba); 1 mancha(s) candidata(s) del barrido revisada(s) a ojo y por OCR: costuras, huecos de fondo o piezas del producto, ninguna marca |
| Imola | Verde | detrás | limpia | nada: la foto del proveedor ya estaba limpia |
| Imola | Fucsia flúor | delante | retocada | etiqueta del cuello retocada en (581, 30, 634, 104) px (poisson, espejo de las dos franjas laterales, mitad de arriba, solo textura); 2 mancha(s) candidata(s) del barrido revisada(s) a ojo y por OCR: costuras, huecos de fondo o piezas del producto, ninguna marca |
| Imola | Fucsia flúor | detrás | limpia | nada: la foto del proveedor ya estaba limpia |
| Imola | Coral flúor | delante | retocada | etiqueta del cuello retocada en (581, 30, 634, 104) px (poisson, espejo de las dos franjas laterales, mitad de arriba); 2 mancha(s) candidata(s) del barrido revisada(s) a ojo y por OCR: costuras, huecos de fondo o piezas del producto, ninguna marca |
| Imola | Coral flúor | detrás | limpia | nada: la foto del proveedor ya estaba limpia |
| Imola | Antracita | delante | retocada | etiqueta del cuello retocada en (581, 30, 634, 104) px (poisson, parche (-59, +0), solo textura); 2 mancha(s) candidata(s) del barrido revisada(s) a ojo y por OCR: costuras, huecos de fondo o piezas del producto, ninguna marca |
| Imola | Antracita | detrás | limpia | nada: la foto del proveedor ya estaba limpia |
| Imola | Marino | delante | retocada | etiqueta del cuello retocada en (581, 30, 634, 104) px (poisson, parche (-59, +0), solo textura); 2 mancha(s) candidata(s) del barrido revisada(s) a ojo y por OCR: costuras, huecos de fondo o piezas del producto, ninguna marca |
| Imola | Marino | detrás | limpia | nada: la foto del proveedor ya estaba limpia |
| Imola | Rojo | delante | retocada | etiqueta del cuello retocada en (581, 30, 634, 104) px (poisson, espejo de las dos franjas laterales, mitad de arriba); 2 mancha(s) candidata(s) del barrido revisada(s) a ojo y por OCR: costuras, huecos de fondo o piezas del producto, ninguna marca |
| Imola | Rojo | detrás | limpia | nada: la foto del proveedor ya estaba limpia |
| Imola | Morado | delante | retocada | etiqueta del cuello retocada en (581, 30, 634, 104) px (poisson, espejo de las dos franjas laterales, mitad de arriba); 2 mancha(s) candidata(s) del barrido revisada(s) a ojo y por OCR: costuras, huecos de fondo o piezas del producto, ninguna marca |
| Imola | Morado | detrás | limpia | nada: la foto del proveedor ya estaba limpia |
| Imola | Fucsia | delante | retocada | etiqueta del cuello retocada en (581, 30, 634, 104) px (poisson, espejo de las dos franjas laterales, mitad de arriba, solo textura); 2 mancha(s) candidata(s) del barrido revisada(s) a ojo y por OCR: costuras, huecos de fondo o piezas del producto, ninguna marca |
| Imola | Fucsia | detrás | limpia | nada: la foto del proveedor ya estaba limpia |
| Andre | Blanco | delante | retocada | etiqueta del cuello retocada en (578, 157, 618, 230) px (poisson, espejo de las dos franjas laterales, mitad de arriba, solo textura); encuadre normalizado ×1.000 (+0, -3) |
| Andre | Blanco | detrás | limpia | encuadre normalizado ×1.070 (-37, -36) |
| Andre | Negro | delante | retocada | etiqueta del cuello retocada en (570, 147, 625, 234) px (poisson, espejo de las dos franjas laterales, mitad de arriba) |
| Andre | Negro | detrás | limpia | encuadre normalizado ×1.070 (-37, -36) |
| Andre | Royal | delante | retocada | etiqueta del cuello retocada en (571, 147, 625, 234) px (poisson, espejo de las dos franjas laterales, mitad de arriba) |
| Andre | Royal | detrás | limpia | encuadre normalizado ×1.070 (-37, -36); la auditoría automática avisa de que la tela es más oscura que delante (ΔE 31): es la foto real del proveedor, con menos luz que la delantera; revisada a ojo, es la misma prenda y el mismo color, y se publica tal cual |
| Andre | Turquesa | delante | retocada | etiqueta del cuello retocada en (578, 147, 618, 234) px (poisson, espejo de las dos franjas laterales, mitad de arriba, solo textura) |
| Andre | Turquesa | detrás | limpia | encuadre normalizado ×1.070 (-37, -36) |
| Andre | Amarillo flúor | delante | retocada | etiqueta del cuello retocada en (577, 147, 618, 233) px (poisson, espejo de las dos franjas laterales, mitad de arriba, solo textura) |
| Andre | Amarillo flúor | detrás | limpia | encuadre normalizado ×1.070 (-37, -36) |
| Andre | Naranja flúor | delante | retocada | etiqueta del cuello retocada en (572, 147, 623, 234) px (poisson, espejo de las dos franjas laterales, mitad de arriba, solo textura) |
| Andre | Naranja flúor | detrás | limpia | encuadre normalizado ×1.070 (-37, -36) |
| Andre | Verde flúor | delante | retocada | etiqueta del cuello retocada en (572, 147, 623, 234) px (poisson, espejo de las dos franjas laterales, mitad de arriba, solo textura) |
| Andre | Verde flúor | detrás | limpia | encuadre normalizado ×1.070 (-37, -36) |
| Andre | Rojo | delante | retocada | etiqueta del cuello retocada en (570, 147, 625, 234) px (poisson, espejo de las dos franjas laterales, mitad de arriba, solo textura); 1 mancha(s) candidata(s) del barrido revisada(s) a ojo y por OCR: costuras, huecos de fondo o piezas del producto, ninguna marca |
| Andre | Rojo | detrás | limpia | encuadre sin normalizar: es otra toma del proveedor, mucho más cerrada y con los tirantes fuera de la foto; llevarla al encuadre de las demás la cortaría |
| Shura | Blanco | delante | retocada | etiqueta del cuello retocada en (575, 67, 614, 151) px (poisson, parche (+0, +90)) |
| Shura | Blanco | detrás | limpia | nada: la foto del proveedor ya estaba limpia |
| Shura | Negro | delante | retocada | etiqueta del cuello retocada en (575, 66, 617, 151) px (poisson, parche (-48, +0)) |
| Shura | Negro | detrás | limpia | 1 mancha(s) candidata(s) del barrido revisada(s) a ojo y por OCR: costuras, huecos de fondo o piezas del producto, ninguna marca |
| Shura | Turquesa | delante | retocada | etiqueta del cuello retocada en (575, 67, 617, 151) px (poisson, espejo de las dos franjas laterales, mitad de arriba, solo textura) |
| Shura | Turquesa | detrás | limpia | 1 mancha(s) candidata(s) del barrido revisada(s) a ojo y por OCR: costuras, huecos de fondo o piezas del producto, ninguna marca |
| Shura | Amarillo flúor | delante | retocada | etiqueta del cuello retocada en (575, 66, 617, 152) px (poisson, espejo de las dos franjas laterales, mitad de arriba) |
| Shura | Amarillo flúor | detrás | limpia | 1 mancha(s) candidata(s) del barrido revisada(s) a ojo y por OCR: costuras, huecos de fondo o piezas del producto, ninguna marca |
| Shura | Naranja flúor | delante | retocada | etiqueta del cuello retocada en (575, 66, 617, 151) px (poisson, espejo de las dos franjas laterales, mitad de arriba, solo textura) |
| Shura | Naranja flúor | detrás | limpia | nada: la foto del proveedor ya estaba limpia |
| Shura | Verde flúor | delante | retocada | etiqueta del cuello retocada en (575, 66, 617, 152) px (poisson, espejo de las dos franjas laterales, mitad de arriba, solo textura) |
| Shura | Verde flúor | detrás | limpia | nada: la foto del proveedor ya estaba limpia |
| Shura | Rojo | delante | retocada | etiqueta del cuello retocada en (575, 66, 617, 151) px (poisson, espejo de las dos franjas laterales, mitad de arriba) |
| Shura | Rojo | detrás | limpia | nada: la foto del proveedor ya estaba limpia |
| Shura | Fucsia | delante | retocada | etiqueta del cuello retocada en (575, 66, 617, 152) px (poisson, espejo de las dos franjas laterales, mitad de arriba, solo textura) |
| Shura | Fucsia | detrás | limpia | 1 mancha(s) candidata(s) del barrido revisada(s) a ojo y por OCR: costuras, huecos de fondo o piezas del producto, ninguna marca |
| Clásica | Blanco | delante | retocada | etiqueta del cuello retocada en (577, 35, 610, 58) px (poisson, parche (+39, +0), solo textura) |
| Clásica | Blanco | detrás | limpia | nada: la foto del proveedor ya estaba limpia |
| Clásica | Negro | delante | retocada | etiqueta del cuello retocada en (577, 35, 611, 58) px (poisson, parche (+40, +0)); 3 mancha(s) candidata(s) del barrido revisada(s) a ojo y por OCR: costuras, huecos de fondo o piezas del producto, ninguna marca |
| Clásica | Negro | detrás | limpia | nada: la foto del proveedor ya estaba limpia |
| Clásica | Amarillo | delante | retocada | etiqueta del cuello retocada en (577, 34, 611, 58) px (poisson, parche (+40, +0), solo textura); 2 mancha(s) candidata(s) del barrido revisada(s) a ojo y por OCR: costuras, huecos de fondo o piezas del producto, ninguna marca |
| Clásica | Amarillo | detrás | limpia | nada: la foto del proveedor ya estaba limpia |
| Clásica | Royal | delante | retocada | etiqueta del cuello retocada en (553, 35, 630, 58) px (poisson, parche (+0, +29)); 2 mancha(s) candidata(s) del barrido revisada(s) a ojo y por OCR: costuras, huecos de fondo o piezas del producto, ninguna marca |
| Clásica | Royal | detrás | limpia | nada: la foto del proveedor ya estaba limpia |
| Clásica | Arena | delante | retocada | etiqueta del cuello retocada en (566, 35, 630, 58) px (poisson, espejo de las dos franjas laterales, solo textura); 2 mancha(s) candidata(s) del barrido revisada(s) a ojo y por OCR: costuras, huecos de fondo o piezas del producto, ninguna marca |
| Clásica | Arena | detrás | limpia | nada: la foto del proveedor ya estaba limpia |
| Clásica | Camel | delante | retocada | etiqueta del cuello retocada en (553, 35, 634, 58) px (poisson, parche (+87, +0), solo textura); 3 mancha(s) candidata(s) del barrido revisada(s) a ojo y por OCR: costuras, huecos de fondo o piezas del producto, ninguna marca |
| Clásica | Camel | detrás | limpia | nada: la foto del proveedor ya estaba limpia |
| Clásica | Celeste | delante | retocada | etiqueta del cuello retocada en (576, 35, 610, 58) px (poisson, parche (+40, +0), solo textura); 1 mancha(s) candidata(s) del barrido revisada(s) a ojo y por OCR: costuras, huecos de fondo o piezas del producto, ninguna marca |
| Clásica | Celeste | detrás | limpia | nada: la foto del proveedor ya estaba limpia |
| Clásica | Azul océano | delante | retocada | etiqueta del cuello retocada en (577, 35, 628, 58) px (poisson, espejo de las dos franjas laterales, solo textura); 1 mancha(s) candidata(s) del barrido revisada(s) a ojo y por OCR: costuras, huecos de fondo o piezas del producto, ninguna marca |
| Clásica | Azul océano | detrás | limpia | nada: la foto del proveedor ya estaba limpia |
| Clásica | Gris | delante | retocada | etiqueta del cuello retocada en (567, 35, 610, 58) px (poisson, parche (+49, +0), solo textura); 2 mancha(s) candidata(s) del barrido revisada(s) a ojo y por OCR: costuras, huecos de fondo o piezas del producto, ninguna marca |
| Clásica | Gris | detrás | limpia | nada: la foto del proveedor ya estaba limpia |
| Clásica | Verde manzana | delante | retocada | etiqueta del cuello retocada en (577, 35, 628, 58) px (poisson, espejo de las dos franjas laterales, solo textura); 3 mancha(s) candidata(s) del barrido revisada(s) a ojo y por OCR: costuras, huecos de fondo o piezas del producto, ninguna marca |
| Clásica | Verde manzana | detrás | limpia | nada: la foto del proveedor ya estaba limpia |
| Clásica | Turquesa | delante | retocada | etiqueta del cuello retocada en (576, 35, 610, 58) px (poisson, parche (+40, +0), solo textura); 1 mancha(s) candidata(s) del barrido revisada(s) a ojo y por OCR: costuras, huecos de fondo o piezas del producto, ninguna marca |
| Clásica | Turquesa | detrás | limpia | nada: la foto del proveedor ya estaba limpia |
| Clásica | Coral | delante | retocada | etiqueta del cuello retocada en (553, 35, 634, 58) px (poisson, parche (+0, +29)); 1 mancha(s) candidata(s) del barrido revisada(s) a ojo y por OCR: costuras, huecos de fondo o piezas del producto, ninguna marca |
| Clásica | Coral | detrás | limpia | nada: la foto del proveedor ya estaba limpia |
| Clásica | Ciruela | delante | retocada | etiqueta del cuello retocada en (577, 35, 611, 58) px (poisson, parche (+40, +0), solo textura); 2 mancha(s) candidata(s) del barrido revisada(s) a ojo y por OCR: costuras, huecos de fondo o piezas del producto, ninguna marca |
| Clásica | Ciruela | detrás | limpia | nada: la foto del proveedor ya estaba limpia |
| Clásica | Blanco roto | delante | retocada | etiqueta del cuello retocada en (567, 35, 628, 58) px (poisson, espejo de las dos franjas laterales, solo textura) |
| Clásica | Blanco roto | detrás | limpia | nada: la foto del proveedor ya estaba limpia |
| Clásica | Verde oliva | delante | retocada | etiqueta del cuello retocada en (577, 35, 630, 58) px (poisson, espejo de las dos franjas laterales, solo textura); 3 mancha(s) candidata(s) del barrido revisada(s) a ojo y por OCR: costuras, huecos de fondo o piezas del producto, ninguna marca |
| Clásica | Verde oliva | detrás | limpia | nada: la foto del proveedor ya estaba limpia |
| Clásica | Salmón | delante | retocada | etiqueta del cuello retocada en (577, 35, 611, 58) px (poisson, parche (-40, +0), solo textura); 1 mancha(s) candidata(s) del barrido revisada(s) a ojo y por OCR: costuras, huecos de fondo o piezas del producto, ninguna marca |
| Clásica | Salmón | detrás | limpia | nada: la foto del proveedor ya estaba limpia |
| Clásica | Burdeos | delante | retocada | etiqueta del cuello retocada en (577, 35, 611, 58) px (poisson, parche (+40, +0)); 2 mancha(s) candidata(s) del barrido revisada(s) a ojo y por OCR: costuras, huecos de fondo o piezas del producto, ninguna marca |
| Clásica | Burdeos | detrás | limpia | nada: la foto del proveedor ya estaba limpia |
| Clásica | Azul denim | delante | retocada | etiqueta del cuello retocada en (577, 35, 611, 58) px (poisson, parche (+40, +0), solo textura); 3 mancha(s) candidata(s) del barrido revisada(s) a ojo y por OCR: costuras, huecos de fondo o piezas del producto, ninguna marca |
| Clásica | Azul denim | detrás | limpia | nada: la foto del proveedor ya estaba limpia |
| Clásica | Mostaza | delante | retocada | etiqueta del cuello retocada en (553, 35, 634, 58) px (poisson, parche (+0, +29)); 3 mancha(s) candidata(s) del barrido revisada(s) a ojo y por OCR: costuras, huecos de fondo o piezas del producto, ninguna marca |
| Clásica | Mostaza | detrás | limpia | nada: la foto del proveedor ya estaba limpia |
| Clásica | Gris claro | delante | retocada | etiqueta del cuello retocada en (577, 35, 610, 58) px (poisson, espejo de la franja izquierda, solo textura) |
| Clásica | Gris claro | detrás | limpia | nada: la foto del proveedor ya estaba limpia |
| Clásica | Verde kelly | delante | retocada | etiqueta del cuello retocada en (576, 35, 610, 58) px (poisson, parche (+40, +0), solo textura); 3 mancha(s) candidata(s) del barrido revisada(s) a ojo y por OCR: costuras, huecos de fondo o piezas del producto, ninguna marca |
| Clásica | Verde kelly | detrás | limpia | nada: la foto del proveedor ya estaba limpia |
| Clásica | Beige | delante | retocada | etiqueta del cuello retocada en (576, 35, 611, 58) px (poisson, parche (+41, +0), solo textura) |
| Clásica | Beige | detrás | limpia | nada: la foto del proveedor ya estaba limpia |
| Clásica | Gris plomo | delante | retocada | etiqueta del cuello retocada en (288, 17, 306, 29) px (poisson, parche (-21, +0), solo textura); foto de 600 px (el proveedor no la tiene mayor); 2 mancha(s) candidata(s) del barrido revisada(s) a ojo y por OCR: costuras, huecos de fondo o piezas del producto, ninguna marca |
| Clásica | Gris plomo | detrás | limpia | nada: la foto del proveedor ya estaba limpia |
| Clásica | Azul claro | delante | retocada | etiqueta del cuello retocada en (577, 35, 614, 64) px (poisson, parche (+43, +0), solo textura); 3 mancha(s) candidata(s) del barrido revisada(s) a ojo y por OCR: costuras, huecos de fondo o piezas del producto, ninguna marca |
| Clásica | Azul claro | detrás | limpia | nada: la foto del proveedor ya estaba limpia |
| Clásica | Verde menta | delante | retocada | etiqueta del cuello retocada en (572, 35, 620, 58) px (poisson, espejo de las dos franjas laterales, solo textura) |
| Clásica | Verde menta | detrás | limpia | nada: la foto del proveedor ya estaba limpia |
| Clásica | Verde salvia | delante | retocada | etiqueta del cuello retocada en (288, 17, 306, 29) px (poisson, parche (+21, +0), solo textura); foto de 600 px (el proveedor no la tiene mayor); 2 mancha(s) candidata(s) del barrido revisada(s) a ojo y por OCR: costuras, huecos de fondo o piezas del producto, ninguna marca |
| Clásica | Verde salvia | detrás | limpia | nada: la foto del proveedor ya estaba limpia |
| Clásica | Naranja | delante | retocada | etiqueta del cuello retocada en (553, 35, 634, 58) px (poisson, parche (+0, +29)); 3 mancha(s) candidata(s) del barrido revisada(s) a ojo y por OCR: costuras, huecos de fondo o piezas del producto, ninguna marca |
| Clásica | Naranja | detrás | limpia | nada: la foto del proveedor ya estaba limpia |
| Clásica | Verde petróleo | delante | retocada | etiqueta del cuello retocada en (577, 35, 611, 58) px (poisson, parche (+40, +0), solo textura); 3 mancha(s) candidata(s) del barrido revisada(s) a ojo y por OCR: costuras, huecos de fondo o piezas del producto, ninguna marca |
| Clásica | Verde petróleo | detrás | limpia | nada: la foto del proveedor ya estaba limpia |
| Clásica | Antracita | delante | retocada | etiqueta del cuello retocada en (577, 35, 611, 58) px (poisson, parche (+40, +0), solo textura); 3 mancha(s) candidata(s) del barrido revisada(s) a ojo y por OCR: costuras, huecos de fondo o piezas del producto, ninguna marca |
| Clásica | Antracita | detrás | limpia | nada: la foto del proveedor ya estaba limpia |
| Clásica | Rosa claro | delante | retocada | etiqueta del cuello retocada en (577, 35, 610, 58) px (poisson, parche (+39, +0), solo textura) |
| Clásica | Rosa claro | detrás | limpia | nada: la foto del proveedor ya estaba limpia |
| Clásica | Marino | delante | retocada | etiqueta del cuello retocada en (577, 35, 611, 58) px (poisson, parche (+40, +0)); 3 mancha(s) candidata(s) del barrido revisada(s) a ojo y por OCR: costuras, huecos de fondo o piezas del producto, ninguna marca |
| Clásica | Marino | detrás | limpia | nada: la foto del proveedor ya estaba limpia |
| Clásica | Verde botella | delante | retocada | etiqueta del cuello retocada en (577, 35, 611, 58) px (poisson, parche (+40, +0), solo textura); 3 mancha(s) candidata(s) del barrido revisada(s) a ojo y por OCR: costuras, huecos de fondo o piezas del producto, ninguna marca |
| Clásica | Verde botella | detrás | limpia | nada: la foto del proveedor ya estaba limpia |
| Clásica | Granate | delante | retocada | etiqueta del cuello retocada en (553, 35, 634, 58) px (poisson, parche (+0, +29)); 2 mancha(s) candidata(s) del barrido revisada(s) a ojo y por OCR: costuras, huecos de fondo o piezas del producto, ninguna marca |
| Clásica | Granate | detrás | limpia | nada: la foto del proveedor ya estaba limpia |
| Clásica | Gris vigoré | delante | retocada | etiqueta del cuello retocada en (565, 35, 610, 57) px (poisson, parche (+51, +0), solo textura); 1 mancha(s) candidata(s) del barrido revisada(s) a ojo y por OCR: costuras, huecos de fondo o piezas del producto, ninguna marca |
| Clásica | Gris vigoré | detrás | limpia | nada: la foto del proveedor ya estaba limpia |
| Clásica | Rojo | delante | retocada | etiqueta del cuello retocada en (553, 35, 634, 58) px (poisson, parche (+0, +29)); 4 mancha(s) candidata(s) del barrido revisada(s) a ojo y por OCR: costuras, huecos de fondo o piezas del producto, ninguna marca |
| Clásica | Rojo | detrás | limpia | 1 mancha(s) candidata(s) del barrido revisada(s) a ojo y por OCR: costuras, huecos de fondo o piezas del producto, ninguna marca |
| Clásica | Púrpura | delante | retocada | etiqueta del cuello retocada en (576, 35, 610, 58) px (poisson, parche (+40, +0)); 2 mancha(s) candidata(s) del barrido revisada(s) a ojo y por OCR: costuras, huecos de fondo o piezas del producto, ninguna marca |
| Clásica | Púrpura | detrás | limpia | 3 mancha(s) candidata(s) del barrido revisada(s) a ojo y por OCR: costuras, huecos de fondo o piezas del producto, ninguna marca |
| Clásica | Lila | delante | retocada | etiqueta del cuello retocada en (577, 35, 611, 58) px (poisson, parche (+40, +0), solo textura); 2 mancha(s) candidata(s) del barrido revisada(s) a ojo y por OCR: costuras, huecos de fondo o piezas del producto, ninguna marca |
| Clásica | Lila | detrás | limpia | nada: la foto del proveedor ya estaba limpia |
| Clásica | Fucsia | delante | retocada | etiqueta del cuello retocada en (576, 35, 610, 58) px (poisson, parche (+40, +0), solo textura); 3 mancha(s) candidata(s) del barrido revisada(s) a ojo y por OCR: costuras, huecos de fondo o piezas del producto, ninguna marca |
| Clásica | Fucsia | detrás | limpia | 2 mancha(s) candidata(s) del barrido revisada(s) a ojo y por OCR: costuras, huecos de fondo o piezas del producto, ninguna marca |
| Urban | Blanco | delante | limpia | nada: la foto del proveedor ya estaba limpia |
| Urban | Blanco | detrás | limpia | nada: la foto del proveedor ya estaba limpia |
| Urban | Blanco y marino | delante | limpia | nada: la foto del proveedor ya estaba limpia |
| Urban | Blanco y marino | detrás | limpia | nada: la foto del proveedor ya estaba limpia |
| Urban | Negro | delante | limpia | 4 mancha(s) candidata(s) del barrido revisada(s) a ojo y por OCR: costuras, huecos de fondo o piezas del producto, ninguna marca |
| Urban | Negro | detrás | limpia | 1 mancha(s) candidata(s) del barrido revisada(s) a ojo y por OCR: costuras, huecos de fondo o piezas del producto, ninguna marca |
| Urban | Negro y gris vigoré | delante | limpia | 4 mancha(s) candidata(s) del barrido revisada(s) a ojo y por OCR: costuras, huecos de fondo o piezas del producto, ninguna marca |
| Urban | Negro y gris vigoré | detrás | limpia | 1 mancha(s) candidata(s) del barrido revisada(s) a ojo y por OCR: costuras, huecos de fondo o piezas del producto, ninguna marca |
| Urban | Amarillo | delante | limpia | 4 mancha(s) candidata(s) del barrido revisada(s) a ojo y por OCR: costuras, huecos de fondo o piezas del producto, ninguna marca |
| Urban | Amarillo | detrás | limpia | 4 mancha(s) candidata(s) del barrido revisada(s) a ojo y por OCR: costuras, huecos de fondo o piezas del producto, ninguna marca |
| Urban | Royal | delante | limpia | 4 mancha(s) candidata(s) del barrido revisada(s) a ojo y por OCR: costuras, huecos de fondo o piezas del producto, ninguna marca |
| Urban | Royal | detrás | limpia | 1 mancha(s) candidata(s) del barrido revisada(s) a ojo y por OCR: costuras, huecos de fondo o piezas del producto, ninguna marca |
| Urban | Royal y blanco | delante | limpia | 6 mancha(s) candidata(s) del barrido revisada(s) a ojo y por OCR: costuras, huecos de fondo o piezas del producto, ninguna marca |
| Urban | Royal y blanco | detrás | limpia | 1 mancha(s) candidata(s) del barrido revisada(s) a ojo y por OCR: costuras, huecos de fondo o piezas del producto, ninguna marca |
| Urban | Arena | delante | limpia | 2 mancha(s) candidata(s) del barrido revisada(s) a ojo y por OCR: costuras, huecos de fondo o piezas del producto, ninguna marca |
| Urban | Arena | detrás | limpia | nada: la foto del proveedor ya estaba limpia |
| Urban | Camel | delante | limpia | 4 mancha(s) candidata(s) del barrido revisada(s) a ojo y por OCR: costuras, huecos de fondo o piezas del producto, ninguna marca |
| Urban | Camel | detrás | limpia | 2 mancha(s) candidata(s) del barrido revisada(s) a ojo y por OCR: costuras, huecos de fondo o piezas del producto, ninguna marca |
| Urban | Celeste y blanco | delante | limpia | 2 mancha(s) candidata(s) del barrido revisada(s) a ojo y por OCR: costuras, huecos de fondo o piezas del producto, ninguna marca |
| Urban | Celeste y blanco | detrás | limpia | 1 mancha(s) candidata(s) del barrido revisada(s) a ojo y por OCR: costuras, huecos de fondo o piezas del producto, ninguna marca |
| Urban | Gris | delante | limpia | nada: la foto del proveedor ya estaba limpia |
| Urban | Gris | detrás | limpia | nada: la foto del proveedor ya estaba limpia |
| Urban | Turquesa | delante | limpia | 3 mancha(s) candidata(s) del barrido revisada(s) a ojo y por OCR: costuras, huecos de fondo o piezas del producto, ninguna marca |
| Urban | Turquesa | detrás | limpia | 2 mancha(s) candidata(s) del barrido revisada(s) a ojo y por OCR: costuras, huecos de fondo o piezas del producto, ninguna marca |
| Urban | Coral | delante | limpia | 4 mancha(s) candidata(s) del barrido revisada(s) a ojo y por OCR: costuras, huecos de fondo o piezas del producto, ninguna marca |
| Urban | Coral | detrás | limpia | 3 mancha(s) candidata(s) del barrido revisada(s) a ojo y por OCR: costuras, huecos de fondo o piezas del producto, ninguna marca |
| Urban | Ciruela | delante | limpia | 4 mancha(s) candidata(s) del barrido revisada(s) a ojo y por OCR: costuras, huecos de fondo o piezas del producto, ninguna marca |
| Urban | Ciruela | detrás | limpia | 1 mancha(s) candidata(s) del barrido revisada(s) a ojo y por OCR: costuras, huecos de fondo o piezas del producto, ninguna marca |
| Urban | Blanco roto | delante | limpia | nada: la foto del proveedor ya estaba limpia |
| Urban | Blanco roto | detrás | limpia | 2 mancha(s) candidata(s) del barrido revisada(s) a ojo y por OCR: costuras, huecos de fondo o piezas del producto, ninguna marca |
| Urban | Verde oliva | delante | limpia | 4 mancha(s) candidata(s) del barrido revisada(s) a ojo y por OCR: costuras, huecos de fondo o piezas del producto, ninguna marca |
| Urban | Verde oliva | detrás | limpia | 1 mancha(s) candidata(s) del barrido revisada(s) a ojo y por OCR: costuras, huecos de fondo o piezas del producto, ninguna marca |
| Urban | Salmón | delante | limpia | 3 mancha(s) candidata(s) del barrido revisada(s) a ojo y por OCR: costuras, huecos de fondo o piezas del producto, ninguna marca |
| Urban | Salmón | detrás | limpia | 2 mancha(s) candidata(s) del barrido revisada(s) a ojo y por OCR: costuras, huecos de fondo o piezas del producto, ninguna marca |
| Urban | Burdeos | delante | limpia | 3 mancha(s) candidata(s) del barrido revisada(s) a ojo y por OCR: costuras, huecos de fondo o piezas del producto, ninguna marca |
| Urban | Burdeos | detrás | limpia | 2 mancha(s) candidata(s) del barrido revisada(s) a ojo y por OCR: costuras, huecos de fondo o piezas del producto, ninguna marca |
| Urban | Azul denim | delante | limpia | 4 mancha(s) candidata(s) del barrido revisada(s) a ojo y por OCR: costuras, huecos de fondo o piezas del producto, ninguna marca |
| Urban | Azul denim | detrás | limpia | 1 mancha(s) candidata(s) del barrido revisada(s) a ojo y por OCR: costuras, huecos de fondo o piezas del producto, ninguna marca |
| Urban | Mostaza | delante | limpia | 6 mancha(s) candidata(s) del barrido revisada(s) a ojo y por OCR: costuras, huecos de fondo o piezas del producto, ninguna marca |
| Urban | Mostaza | detrás | limpia | 4 mancha(s) candidata(s) del barrido revisada(s) a ojo y por OCR: costuras, huecos de fondo o piezas del producto, ninguna marca |
| Urban | Gris claro | delante | limpia | nada: la foto del proveedor ya estaba limpia |
| Urban | Gris claro | detrás | limpia | 2 mancha(s) candidata(s) del barrido revisada(s) a ojo y por OCR: costuras, huecos de fondo o piezas del producto, ninguna marca |
| Urban | Verde kelly y blanco | delante | limpia | 5 mancha(s) candidata(s) del barrido revisada(s) a ojo y por OCR: costuras, huecos de fondo o piezas del producto, ninguna marca |
| Urban | Verde kelly y blanco | detrás | limpia | 4 mancha(s) candidata(s) del barrido revisada(s) a ojo y por OCR: costuras, huecos de fondo o piezas del producto, ninguna marca |
| Urban | Beige | delante | limpia | 2 mancha(s) candidata(s) del barrido revisada(s) a ojo y por OCR: costuras, huecos de fondo o piezas del producto, ninguna marca |
| Urban | Beige | detrás | limpia | 2 mancha(s) candidata(s) del barrido revisada(s) a ojo y por OCR: costuras, huecos de fondo o piezas del producto, ninguna marca |
| Urban | Gris plomo | delante | limpia | 4 mancha(s) candidata(s) del barrido revisada(s) a ojo y por OCR: costuras, huecos de fondo o piezas del producto, ninguna marca |
| Urban | Gris plomo | detrás | limpia | 1 mancha(s) candidata(s) del barrido revisada(s) a ojo y por OCR: costuras, huecos de fondo o piezas del producto, ninguna marca |
| Urban | Azul claro | delante | limpia | 2 mancha(s) candidata(s) del barrido revisada(s) a ojo y por OCR: costuras, huecos de fondo o piezas del producto, ninguna marca |
| Urban | Azul claro | detrás | limpia | 1 mancha(s) candidata(s) del barrido revisada(s) a ojo y por OCR: costuras, huecos de fondo o piezas del producto, ninguna marca |
| Urban | Verde menta | delante | limpia | nada: la foto del proveedor ya estaba limpia |
| Urban | Verde menta | detrás | limpia | 2 mancha(s) candidata(s) del barrido revisada(s) a ojo y por OCR: costuras, huecos de fondo o piezas del producto, ninguna marca |
| Urban | Verde salvia | delante | limpia | 4 mancha(s) candidata(s) del barrido revisada(s) a ojo y por OCR: costuras, huecos de fondo o piezas del producto, ninguna marca |
| Urban | Verde salvia | detrás | limpia | 2 mancha(s) candidata(s) del barrido revisada(s) a ojo y por OCR: costuras, huecos de fondo o piezas del producto, ninguna marca |
| Urban | Naranja | delante | limpia | 4 mancha(s) candidata(s) del barrido revisada(s) a ojo y por OCR: costuras, huecos de fondo o piezas del producto, ninguna marca |
| Urban | Naranja | detrás | limpia | 5 mancha(s) candidata(s) del barrido revisada(s) a ojo y por OCR: costuras, huecos de fondo o piezas del producto, ninguna marca |
| Urban | Verde petróleo | delante | limpia | 4 mancha(s) candidata(s) del barrido revisada(s) a ojo y por OCR: costuras, huecos de fondo o piezas del producto, ninguna marca |
| Urban | Verde petróleo | detrás | limpia | 1 mancha(s) candidata(s) del barrido revisada(s) a ojo y por OCR: costuras, huecos de fondo o piezas del producto, ninguna marca |
| Urban | Rosa claro | delante | limpia | 1 mancha(s) candidata(s) del barrido revisada(s) a ojo y por OCR: costuras, huecos de fondo o piezas del producto, ninguna marca |
| Urban | Rosa claro | detrás | limpia | nada: la foto del proveedor ya estaba limpia |
| Urban | Rosa claro y gris vigoré | delante | limpia | 3 mancha(s) candidata(s) del barrido revisada(s) a ojo y por OCR: costuras, huecos de fondo o piezas del producto, ninguna marca |
| Urban | Rosa claro y gris vigoré | detrás | limpia | foto de 600 px (el proveedor no la tiene mayor); la foto hd del proveedor es una vista lateral de la sudadera verde: se usa la de 600 px, que sí es la trasera rosa; 2 mancha(s) candidata(s) del barrido revisada(s) a ojo y por OCR: costuras, huecos de fondo o piezas del producto, ninguna marca |
| Urban | Marino | delante | limpia | 3 mancha(s) candidata(s) del barrido revisada(s) a ojo y por OCR: costuras, huecos de fondo o piezas del producto, ninguna marca |
| Urban | Marino | detrás | limpia | 1 mancha(s) candidata(s) del barrido revisada(s) a ojo y por OCR: costuras, huecos de fondo o piezas del producto, ninguna marca |
| Urban | Marino y gris vigoré | delante | limpia | 4 mancha(s) candidata(s) del barrido revisada(s) a ojo y por OCR: costuras, huecos de fondo o piezas del producto, ninguna marca |
| Urban | Marino y gris vigoré | detrás | limpia | 1 mancha(s) candidata(s) del barrido revisada(s) a ojo y por OCR: costuras, huecos de fondo o piezas del producto, ninguna marca |
| Urban | Verde botella | delante | limpia | 4 mancha(s) candidata(s) del barrido revisada(s) a ojo y por OCR: costuras, huecos de fondo o piezas del producto, ninguna marca |
| Urban | Verde botella | detrás | limpia | 2 mancha(s) candidata(s) del barrido revisada(s) a ojo y por OCR: costuras, huecos de fondo o piezas del producto, ninguna marca |
| Urban | Verde botella y gris vigoré | delante | limpia | 3 mancha(s) candidata(s) del barrido revisada(s) a ojo y por OCR: costuras, huecos de fondo o piezas del producto, ninguna marca |
| Urban | Verde botella y gris vigoré | detrás | limpia | 1 mancha(s) candidata(s) del barrido revisada(s) a ojo y por OCR: costuras, huecos de fondo o piezas del producto, ninguna marca |
| Urban | Granate | delante | limpia | 3 mancha(s) candidata(s) del barrido revisada(s) a ojo y por OCR: costuras, huecos de fondo o piezas del producto, ninguna marca |
| Urban | Granate | detrás | limpia | 2 mancha(s) candidata(s) del barrido revisada(s) a ojo y por OCR: costuras, huecos de fondo o piezas del producto, ninguna marca |
| Urban | Granate y gris vigoré | delante | limpia | 5 mancha(s) candidata(s) del barrido revisada(s) a ojo y por OCR: costuras, huecos de fondo o piezas del producto, ninguna marca |
| Urban | Granate y gris vigoré | detrás | limpia | 3 mancha(s) candidata(s) del barrido revisada(s) a ojo y por OCR: costuras, huecos de fondo o piezas del producto, ninguna marca |
| Urban | Gris vigoré | delante | limpia | 1 mancha(s) candidata(s) del barrido revisada(s) a ojo y por OCR: costuras, huecos de fondo o piezas del producto, ninguna marca |
| Urban | Gris vigoré | detrás | limpia | 2 mancha(s) candidata(s) del barrido revisada(s) a ojo y por OCR: costuras, huecos de fondo o piezas del producto, ninguna marca |
| Urban | Gris vigoré y negro | delante | limpia | 1 mancha(s) candidata(s) del barrido revisada(s) a ojo y por OCR: costuras, huecos de fondo o piezas del producto, ninguna marca |
| Urban | Gris vigoré y negro | detrás | limpia | 2 mancha(s) candidata(s) del barrido revisada(s) a ojo y por OCR: costuras, huecos de fondo o piezas del producto, ninguna marca |
| Urban | Rojo | delante | limpia | 5 mancha(s) candidata(s) del barrido revisada(s) a ojo y por OCR: costuras, huecos de fondo o piezas del producto, ninguna marca |
| Urban | Rojo | detrás | limpia | 3 mancha(s) candidata(s) del barrido revisada(s) a ojo y por OCR: costuras, huecos de fondo o piezas del producto, ninguna marca |
| Urban | Rojo y negro | delante | limpia | 4 mancha(s) candidata(s) del barrido revisada(s) a ojo y por OCR: costuras, huecos de fondo o piezas del producto, ninguna marca |
| Urban | Rojo y negro | detrás | limpia | 3 mancha(s) candidata(s) del barrido revisada(s) a ojo y por OCR: costuras, huecos de fondo o piezas del producto, ninguna marca |
| Urban | Púrpura | delante | limpia | 3 mancha(s) candidata(s) del barrido revisada(s) a ojo y por OCR: costuras, huecos de fondo o piezas del producto, ninguna marca |
| Urban | Púrpura | detrás | limpia | 3 mancha(s) candidata(s) del barrido revisada(s) a ojo y por OCR: costuras, huecos de fondo o piezas del producto, ninguna marca |
| Urban | Lila | delante | limpia | 4 mancha(s) candidata(s) del barrido revisada(s) a ojo y por OCR: costuras, huecos de fondo o piezas del producto, ninguna marca |
| Urban | Lila | detrás | limpia | 2 mancha(s) candidata(s) del barrido revisada(s) a ojo y por OCR: costuras, huecos de fondo o piezas del producto, ninguna marca |
| Urban | Fucsia | delante | limpia | 5 mancha(s) candidata(s) del barrido revisada(s) a ojo y por OCR: costuras, huecos de fondo o piezas del producto, ninguna marca |
| Urban | Fucsia | detrás | limpia | 3 mancha(s) candidata(s) del barrido revisada(s) a ojo y por OCR: costuras, huecos de fondo o piezas del producto, ninguna marca |
| Montblanc | Negro | delante | limpia | encuadre normalizado ×1.000 (+0, -14) |
| Montblanc | Negro | detrás | limpia | encuadre normalizado ×0.974 (+15, -0); 1 mancha(s) candidata(s) del barrido revisada(s) a ojo y por OCR: costuras, huecos de fondo o piezas del producto, ninguna marca |
| Montblanc | Royal | delante | limpia | encuadre normalizado ×0.975 (+15, -0); 3 mancha(s) candidata(s) del barrido revisada(s) a ojo y por OCR: costuras, huecos de fondo o piezas del producto, ninguna marca |
| Montblanc | Royal | detrás | limpia | encuadre normalizado ×0.974 (+15, -0); 2 mancha(s) candidata(s) del barrido revisada(s) a ojo y por OCR: costuras, huecos de fondo o piezas del producto, ninguna marca |
| Montblanc | Marino | delante | limpia | encuadre normalizado ×1.000 (+1, -14); 1 mancha(s) candidata(s) del barrido revisada(s) a ojo y por OCR: costuras, huecos de fondo o piezas del producto, ninguna marca |
| Montblanc | Marino | detrás | limpia | encuadre normalizado ×0.974 (+15, -0); 1 mancha(s) candidata(s) del barrido revisada(s) a ojo y por OCR: costuras, huecos de fondo o piezas del producto, ninguna marca |
| Montblanc | Verde botella | delante | limpia | encuadre normalizado ×0.975 (+15, -0); 3 mancha(s) candidata(s) del barrido revisada(s) a ojo y por OCR: costuras, huecos de fondo o piezas del producto, ninguna marca |
| Montblanc | Verde botella | detrás | limpia | encuadre normalizado ×0.974 (+15, -0); 1 mancha(s) candidata(s) del barrido revisada(s) a ojo y por OCR: costuras, huecos de fondo o piezas del producto, ninguna marca |
| Montblanc | Granate | delante | limpia | encuadre normalizado ×0.975 (+15, -0); 2 mancha(s) candidata(s) del barrido revisada(s) a ojo y por OCR: costuras, huecos de fondo o piezas del producto, ninguna marca |
| Montblanc | Granate | detrás | limpia | encuadre normalizado ×0.974 (+15, -0); 3 mancha(s) candidata(s) del barrido revisada(s) a ojo y por OCR: costuras, huecos de fondo o piezas del producto, ninguna marca |
| Montblanc | Gris vigoré | delante | limpia | nada: la foto del proveedor ya estaba limpia |
| Montblanc | Gris vigoré | detrás | limpia | encuadre normalizado ×0.974 (+15, -0) |
| Montblanc | Rojo | delante | limpia | encuadre normalizado ×0.975 (+15, -0); 3 mancha(s) candidata(s) del barrido revisada(s) a ojo y por OCR: costuras, huecos de fondo o piezas del producto, ninguna marca |
| Montblanc | Rojo | detrás | limpia | encuadre normalizado ×0.974 (+15, -0); 2 mancha(s) candidata(s) del barrido revisada(s) a ojo y por OCR: costuras, huecos de fondo o piezas del producto, ninguna marca |
| Otto | Blanco | delante | limpia | nada: la foto del proveedor ya estaba limpia |
| Otto | Blanco | detrás | limpia | nada: la foto del proveedor ya estaba limpia |
| Otto | Negro | delante | limpia | 2 mancha(s) candidata(s) del barrido revisada(s) a ojo y por OCR: costuras, huecos de fondo o piezas del producto, ninguna marca |
| Otto | Negro | detrás | limpia | nada: la foto del proveedor ya estaba limpia |
| Otto | Gris | delante | limpia | 1 mancha(s) candidata(s) del barrido revisada(s) a ojo y por OCR: costuras, huecos de fondo o piezas del producto, ninguna marca |
| Otto | Gris | detrás | limpia | 2 mancha(s) candidata(s) del barrido revisada(s) a ojo y por OCR: costuras, huecos de fondo o piezas del producto, ninguna marca |
| Otto | Blanco roto | delante | limpia | nada: la foto del proveedor ya estaba limpia |
| Otto | Blanco roto | detrás | limpia | nada: la foto del proveedor ya estaba limpia |
| Otto | Azul denim | delante | limpia | nada: la foto del proveedor ya estaba limpia |
| Otto | Azul denim | detrás | limpia | nada: la foto del proveedor ya estaba limpia |
| Otto | Beige | delante | limpia | nada: la foto del proveedor ya estaba limpia |
| Otto | Beige | detrás | limpia | nada: la foto del proveedor ya estaba limpia |
| Otto | Marino | delante | limpia | nada: la foto del proveedor ya estaba limpia |
| Otto | Marino | detrás | limpia | nada: la foto del proveedor ya estaba limpia |
| Estambul Woman | Negro | delante | limpia | 1 mancha(s) candidata(s) del barrido revisada(s) a ojo y por OCR: costuras, huecos de fondo o piezas del producto, ninguna marca |
| Estambul Woman | Negro | detrás | limpia | foto de 600 px (el proveedor no la tiene mayor); la foto hd del proveedor es una vista lateral de la chaqueta azul acero: se usa la de 600 px, que sí es la trasera negra; 1 mancha(s) candidata(s) del barrido revisada(s) a ojo y por OCR: costuras, huecos de fondo o piezas del producto, ninguna marca |
| Estambul Woman | Azul denim | delante | limpia | nada: la foto del proveedor ya estaba limpia |
| Estambul Woman | Azul denim | detrás | limpia | nada: la foto del proveedor ya estaba limpia |
| Estambul Woman | Verde salvia | delante | limpia | nada: la foto del proveedor ya estaba limpia |
| Estambul Woman | Verde salvia | detrás | limpia | nada: la foto del proveedor ya estaba limpia |
| Estambul Woman | Naranja mandarina | delante | limpia | nada: la foto del proveedor ya estaba limpia |
| Estambul Woman | Naranja mandarina | detrás | limpia | nada: la foto del proveedor ya estaba limpia |
| Estambul Woman | Marino | delante | limpia | 1 mancha(s) candidata(s) del barrido revisada(s) a ojo y por OCR: costuras, huecos de fondo o piezas del producto, ninguna marca |
| Estambul Woman | Marino | detrás | limpia | nada: la foto del proveedor ya estaba limpia |
| Estambul Woman | Malva | delante | limpia | 3 mancha(s) candidata(s) del barrido revisada(s) a ojo y por OCR: costuras, huecos de fondo o piezas del producto, ninguna marca |
| Estambul Woman | Malva | detrás | limpia | nada: la foto del proveedor ya estaba limpia |
| Valier | Negro | delante | limpia | 1 mancha(s) candidata(s) del barrido revisada(s) a ojo y por OCR: costuras, huecos de fondo o piezas del producto, ninguna marca |
| Valier | Negro | detrás | limpia | 4 mancha(s) candidata(s) del barrido revisada(s) a ojo y por OCR: costuras, huecos de fondo o piezas del producto, ninguna marca |
| Valier | Royal | delante | limpia | 1 mancha(s) candidata(s) del barrido revisada(s) a ojo y por OCR: costuras, huecos de fondo o piezas del producto, ninguna marca |
| Valier | Royal | detrás | limpia | 3 mancha(s) candidata(s) del barrido revisada(s) a ojo y por OCR: costuras, huecos de fondo o piezas del producto, ninguna marca |
| Valier | Azul brillante | delante | limpia | 2 mancha(s) candidata(s) del barrido revisada(s) a ojo y por OCR: costuras, huecos de fondo o piezas del producto, ninguna marca |
| Valier | Azul brillante | detrás | limpia | 3 mancha(s) candidata(s) del barrido revisada(s) a ojo y por OCR: costuras, huecos de fondo o piezas del producto, ninguna marca |
| Valier | Amarillo flúor | delante | limpia | 2 mancha(s) candidata(s) del barrido revisada(s) a ojo y por OCR: costuras, huecos de fondo o piezas del producto, ninguna marca |
| Valier | Amarillo flúor | detrás | limpia | 4 mancha(s) candidata(s) del barrido revisada(s) a ojo y por OCR: costuras, huecos de fondo o piezas del producto, ninguna marca |
| Valier | Verde lima | delante | limpia | 3 mancha(s) candidata(s) del barrido revisada(s) a ojo y por OCR: costuras, huecos de fondo o piezas del producto, ninguna marca |
| Valier | Verde lima | detrás | limpia | 3 mancha(s) candidata(s) del barrido revisada(s) a ojo y por OCR: costuras, huecos de fondo o piezas del producto, ninguna marca |
| Valier | Verde | delante | limpia | nada: la foto del proveedor ya estaba limpia |
| Valier | Verde | detrás | limpia | 4 mancha(s) candidata(s) del barrido revisada(s) a ojo y por OCR: costuras, huecos de fondo o piezas del producto, ninguna marca |
| Valier | Fucsia flúor | delante | limpia | 1 mancha(s) candidata(s) del barrido revisada(s) a ojo y por OCR: costuras, huecos de fondo o piezas del producto, ninguna marca |
| Valier | Fucsia flúor | detrás | limpia | 3 mancha(s) candidata(s) del barrido revisada(s) a ojo y por OCR: costuras, huecos de fondo o piezas del producto, ninguna marca |
| Valier | Gris | delante | limpia | 4 mancha(s) candidata(s) del barrido revisada(s) a ojo y por OCR: costuras, huecos de fondo o piezas del producto, ninguna marca |
| Valier | Gris | detrás | limpia | 2 mancha(s) candidata(s) del barrido revisada(s) a ojo y por OCR: costuras, huecos de fondo o piezas del producto, ninguna marca |
| Valier | Marino | delante | limpia | 2 mancha(s) candidata(s) del barrido revisada(s) a ojo y por OCR: costuras, huecos de fondo o piezas del producto, ninguna marca |
| Valier | Marino | detrás | limpia | 3 mancha(s) candidata(s) del barrido revisada(s) a ojo y por OCR: costuras, huecos de fondo o piezas del producto, ninguna marca |
| Valier | Rojo | delante | limpia | 3 mancha(s) candidata(s) del barrido revisada(s) a ojo y por OCR: costuras, huecos de fondo o piezas del producto, ninguna marca |
| Valier | Rojo | detrás | limpia | 4 mancha(s) candidata(s) del barrido revisada(s) a ojo y por OCR: costuras, huecos de fondo o piezas del producto, ninguna marca |
| Valier | Morado | delante | limpia | 1 mancha(s) candidata(s) del barrido revisada(s) a ojo y por OCR: costuras, huecos de fondo o piezas del producto, ninguna marca |
| Valier | Morado | detrás | limpia | 3 mancha(s) candidata(s) del barrido revisada(s) a ojo y por OCR: costuras, huecos de fondo o piezas del producto, ninguna marca |
| Freya | Blanco | delante | limpia | nada: la foto del proveedor ya estaba limpia |
| Freya | Blanco y negro | delante | limpia | nada: la foto del proveedor ya estaba limpia |
| Freya | Blanco y royal | delante | limpia | nada: la foto del proveedor ya estaba limpia |
| Freya | Blanco y marino | delante | limpia | nada: la foto del proveedor ya estaba limpia |
| Freya | Blanco y rojo | delante | limpia | nada: la foto del proveedor ya estaba limpia |
| Freya | Negro | delante | limpia | nada: la foto del proveedor ya estaba limpia |
| Freya | Amarillo | delante | limpia | nada: la foto del proveedor ya estaba limpia |
| Freya | Royal | delante | limpia | nada: la foto del proveedor ya estaba limpia |
| Freya | Verde | delante | limpia | nada: la foto del proveedor ya estaba limpia |
| Freya | Azul | delante | limpia | nada: la foto del proveedor ya estaba limpia |
| Freya | Naranja | delante | limpia | 1 mancha(s) candidata(s) del barrido revisada(s) a ojo y por OCR: costuras, huecos de fondo o piezas del producto, ninguna marca |
| Freya | Rosa claro | delante | limpia | nada: la foto del proveedor ya estaba limpia |
| Freya | Marino | delante | limpia | 2 mancha(s) candidata(s) del barrido revisada(s) a ojo y por OCR: costuras, huecos de fondo o piezas del producto, ninguna marca |
| Freya | Rojo | delante | limpia | nada: la foto del proveedor ya estaba limpia |
| Freya | Púrpura | delante | limpia | nada: la foto del proveedor ya estaba limpia |
| Fred | Blanco | delante | limpia | reencuadre a la corona de Freya ×1.282 (-138, -75); 1 mancha(s) candidata(s) del barrido revisada(s) a ojo y por OCR: costuras, huecos de fondo o piezas del producto, ninguna marca |
| Fred | Negro | delante | limpia | reencuadre a la corona de Freya ×1.215 (-78, -40) |
| Fred | Royal | delante | limpia | reencuadre a la corona de Freya ×1.219 (-82, -48) |
| Fred | Verde | delante | limpia | reencuadre a la corona de Freya ×1.213 (-76, -39) |
| Fred | Azul acero | delante | limpia | reencuadre a la corona de Freya ×1.215 (-78, -40) |
| Fred | Rojo | delante | limpia | reencuadre a la corona de Freya ×1.213 (-77, -45) |
| Mercury | Blanco | delante | limpia | reencuadre a la corona de Freya ×0.795 (+129, +226) |
| Mercury | Blanco | detrás | limpia | encuadre normalizado ×0.799 (+124, +218) |
| Mercury | Negro | delante | limpia | reencuadre a la corona de Freya ×0.795 (+129, +199) |
| Mercury | Negro | detrás | limpia | encuadre normalizado ×0.798 (+125, +218) |
| Mercury | Royal | delante | limpia | reencuadre a la corona de Freya ×0.795 (+129, +198) |
| Mercury | Royal | detrás | limpia | encuadre normalizado ×0.798 (+125, +218) |
| Mercury | Amarillo flúor | delante | limpia | reencuadre a la corona de Freya ×0.794 (+65, +99); foto de 600 px (el proveedor no la tiene mayor); la foto hd del proveedor es otra (la trasera negra): se usa la de 600 px, reencuadrada como el resto de colores |
| Mercury | Amarillo flúor | detrás | limpia | encuadre normalizado ×0.799 (+124, +217) |
| Mercury | Coral flúor | delante | limpia | reencuadre a la corona de Freya ×0.795 (+129, +198) |
| Mercury | Coral flúor | detrás | limpia | encuadre normalizado ×0.798 (+125, +218) |
| Crest | Blanco | delante | limpia | nada: la foto del proveedor ya estaba limpia |
| Crest | Blanco | detrás | limpia | encuadre normalizado ×1.000 (-20, +0) |
| Crest | Negro | delante | limpia | nada: la foto del proveedor ya estaba limpia |
| Crest | Negro | detrás | limpia | encuadre normalizado ×1.000 (-21, +0) |
| Crest | Amarillo | delante | limpia | nada: la foto del proveedor ya estaba limpia |
| Crest | Amarillo | detrás | limpia | nada: la foto del proveedor ya estaba limpia |
| Crest | Verde | delante | limpia | nada: la foto del proveedor ya estaba limpia |
| Crest | Verde | detrás | limpia | nada: la foto del proveedor ya estaba limpia |
| Crest | Turquesa | delante | limpia | nada: la foto del proveedor ya estaba limpia |
| Crest | Turquesa | detrás | limpia | encuadre normalizado ×1.000 (-21, +0) |
| Crest | Azul | delante | limpia | nada: la foto del proveedor ya estaba limpia |
| Crest | Azul | detrás | limpia | nada: la foto del proveedor ya estaba limpia |
| Crest | Naranja | delante | limpia | nada: la foto del proveedor ya estaba limpia |
| Crest | Naranja | detrás | limpia | encuadre normalizado ×1.000 (-21, +0) |
| Crest | Marino | delante | limpia | nada: la foto del proveedor ya estaba limpia |
| Crest | Marino | detrás | limpia | encuadre normalizado ×1.000 (-21, +0) |
| Crest | Verde botella | delante | limpia | encuadre normalizado ×1.000 (-20, +0) |
| Crest | Verde botella | detrás | limpia | nada: la foto del proveedor ya estaba limpia |
| Crest | Rojo | delante | limpia | nada: la foto del proveedor ya estaba limpia |
| Crest | Rojo | detrás | limpia | encuadre normalizado ×1.000 (-21, +0) |
| Crest | Fucsia | delante | limpia | nada: la foto del proveedor ya estaba limpia |
| Crest | Fucsia | detrás | limpia | encuadre normalizado ×1.000 (-21, +0) |
| Crest | Azul eléctrico | delante | limpia | nada: la foto del proveedor ya estaba limpia |
| Crest | Azul eléctrico | detrás | limpia | encuadre normalizado ×1.000 (-21, +0) |
| Zenith | Natural | delante | limpia | nada: la foto del proveedor ya estaba limpia |
| Zenith | Natural | detrás | limpia | nada: la foto del proveedor ya estaba limpia |
| Tarek | Blanco | delante | limpia | foto de 460 px (el proveedor no la tiene mayor); 2 mancha(s) candidata(s) del barrido revisada(s) a ojo y por OCR: costuras, huecos de fondo o piezas del producto, ninguna marca |
| Tarek | Negro | delante | limpia | foto de 460 px (el proveedor no la tiene mayor) |
| Tarek | Amarillo | delante | limpia | 1 mancha(s) candidata(s) del barrido revisada(s) a ojo y por OCR: costuras, huecos de fondo o piezas del producto, ninguna marca |
| Tarek | Royal | delante | limpia | foto de 460 px (el proveedor no la tiene mayor); 2 mancha(s) candidata(s) del barrido revisada(s) a ojo y por OCR: costuras, huecos de fondo o piezas del producto, ninguna marca |
| Tarek | Verde | delante | limpia | foto de 460 px (el proveedor no la tiene mayor); 2 mancha(s) candidata(s) del barrido revisada(s) a ojo y por OCR: costuras, huecos de fondo o piezas del producto, ninguna marca |
| Tarek | Naranja | delante | limpia | foto de 460 px (el proveedor no la tiene mayor); 1 mancha(s) candidata(s) del barrido revisada(s) a ojo y por OCR: costuras, huecos de fondo o piezas del producto, ninguna marca |
| Tarek | Fucsia | delante | limpia | foto de 460 px (el proveedor no la tiene mayor); 1 mancha(s) candidata(s) del barrido revisada(s) a ojo y por OCR: costuras, huecos de fondo o piezas del producto, ninguna marca |
| Tarek | Plateado | delante | limpia | sin foto real en el proveedor: la foto base recoloreada, revisada a ojo; 2 mancha(s) candidata(s) del barrido revisada(s) a ojo y por OCR: costuras, huecos de fondo o piezas del producto, ninguna marca |
| Tarek | Marino | delante | limpia | sin foto real en el proveedor: la foto base recoloreada, revisada a ojo |
| Tarek | Rojo | delante | limpia | foto de 460 px (el proveedor no la tiene mayor); 2 mancha(s) candidata(s) del barrido revisada(s) a ojo y por OCR: costuras, huecos de fondo o piezas del producto, ninguna marca |
| Kranston | Blanco | delante | limpia | 1 mancha(s) candidata(s) del barrido revisada(s) a ojo y por OCR: costuras, huecos de fondo o piezas del producto, ninguna marca |
| Kranston | Negro | delante | limpia | nada: la foto del proveedor ya estaba limpia |
| Kranston | Verde | delante | limpia | 1 mancha(s) candidata(s) del barrido revisada(s) a ojo y por OCR: costuras, huecos de fondo o piezas del producto, ninguna marca |
| Kranston | Marino | delante | limpia | 1 mancha(s) candidata(s) del barrido revisada(s) a ojo y por OCR: costuras, huecos de fondo o piezas del producto, ninguna marca |
| Kranston | Rojo | delante | limpia | 1 mancha(s) candidata(s) del barrido revisada(s) a ojo y por OCR: costuras, huecos de fondo o piezas del producto, ninguna marca |
| Ranic | Verde oliva | delante | limpia | 15 mancha(s) candidata(s) del barrido revisada(s) a ojo y por OCR: costuras, huecos de fondo o piezas del producto, ninguna marca |
| Ranic | Azul | delante | limpia | 5 mancha(s) candidata(s) del barrido revisada(s) a ojo y por OCR: costuras, huecos de fondo o piezas del producto, ninguna marca |
| Ranic | Natural | delante | limpia | nada: la foto del proveedor ya estaba limpia |
| Ranic | Gris | delante | limpia | 2 mancha(s) candidata(s) del barrido revisada(s) a ojo y por OCR: costuras, huecos de fondo o piezas del producto, ninguna marca |
| Uldon | Bambú natural | delante | limpia | 2 mancha(s) candidata(s) del barrido revisada(s) a ojo y por OCR: costuras, huecos de fondo o piezas del producto, ninguna marca |
| Karby | Bambú · rectangular | delante | limpia | nada: la foto del proveedor ya estaba limpia |
| Karby | Bambú · redondo | delante | limpia | otro objeto (el formato redondo): sin normalizar respecto al rectangular |
| Roldi | Bambú natural | delante | limpia | nada: la foto del proveedor ya estaba limpia |
| Zora | Plateado | delante | limpia | 1 mancha(s) candidata(s) del barrido revisada(s) a ojo y por OCR: costuras, huecos de fondo o piezas del producto, ninguna marca |
| Luxor | Piel reciclada · rectangular | delante | limpia | nada: la foto del proveedor ya estaba limpia |
| Luxor | Piel reciclada · redondo | delante | limpia | sin foto propia: se enseña la foto del color predeterminado |
| Davos | Bambú natural | delante | limpia | nada: la foto del proveedor ya estaba limpia |

## Dudosas (no se publican)

Ninguna: todas las fotos publicadas han pasado la revisión a ojo, el OCR y la búsqueda de marcas.

## Alertas del OCR

Ninguna alerta: en ninguna imagen publicada ni en ningún recorte ampliado el OCR lee el nombre del proveedor ni los de su grupo.
