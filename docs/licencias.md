# Licencias de los activos del estudio

Registro del origen y la licencia de lo que se publica en la web para el estudio de diseño, y de lo que quedó
archivado tras la prueba 3D (fase 2, 11/10/2026).

## Lo que se publica (estudio 2D)

| Activo | Origen | Licencia |
| --- | --- | --- |
| `public/productos/atomic-150-delante.jpg`, `-detras.jpg`, `austral-delante.jpg`, `-detras.jpg` (naranja y negro) y `atomic-150-blanco-*.jpg`, `austral-blanco-*.jpg` | Fotos de producto aportadas por el equipo (`assets/productos/`), retocadas con `scripts/fotos/preparar-fotos-estudio.py` solo para quitar la etiqueta del proveedor del cuello | Las de las fotos originales del equipo |
| `public/productos/estudio/*.jpg` (un archivo por color sin foto real, delante y detrás) | Derivadas de las fotos blancas del equipo: recoloreado por script (máscara de la tela, sombras conservadas, tinte al color de catálogo) | Las de las fotos originales del equipo |
| `data/siluetas/*.json` | Anclas y zonas en cm definidas por [MARCA] y calibración px/cm medida con el largo de la ficha técnica | Propiedad de [TITULAR] ([MARCA]) |
| Dibujo del logo sobre la foto (`components/estudio/Visor2D.tsx`) | Código propio: canvas 2D, sin librerías gráficas | Propiedad de [TITULAR] ([MARCA]) |

Ninguna foto de la web se ha capturado de la web del proveedor ni muestra su marca.

## Lo que quedó archivado (prueba 3D descartada)

El equipo descartó el 3D en la v1 porque las prendas no parecían reales. Todo lo probado está en
`archivo/estudio-3d/` (fuera del build y sin servir en la web), por si algún día se retoma:

| Archivo | Origen | Licencia |
| --- | --- | --- |
| `archivo/estudio-3d/modelos/camiseta-unisex.glb` y `polo.glb` | Obra propia: generadas desde cero con `archivo/estudio-3d/scripts/generar.py` (Blender 5.2.2 por script), ajustadas a las medidas de talla M de las fichas y a las siluetas de las fotos | Propiedad de [TITULAR] ([MARCA]) |
| Texturas de relieve (punto, piqué, canalé), incrustadas en los GLB | Procedurales, `archivo/estudio-3d/scripts/texturas.py` | Propiedad de [TITULAR] ([MARCA]) |
| `archivo/estudio-3d/comparativa-3d/` y `medicion/` | Renders de comparación y medidas de la prueba | Propiedad de [TITULAR] ([MARCA]) |

### Por qué no se usó ninguna malla de terceros

Se buscaron modelos genéricos de camiseta de manga corta con cuello redondo y de polo de manga corta con licencia
que permitiera el uso comercial (CC0 preferiblemente, CC-BY como alternativa). Resultado de la búsqueda del 11/10/2026:

- **Sketchfab.** Hay camisetas y polos marcados como CC Attribution (por ejemplo, «T Shirt» de funlab117 o «POLO SHIRT» de arvintriyoga) y un «Clothing And Character Kit 1.0 (CC0)» que la propia plataforma archiva como CC-BY porque no permite quitar la atribución. Todas exigen cuenta para descargar y su forma está lejos de las prendas reales.
- **Meshy.** Declara CC0 sus modelos «premade», pero son generados por IA, exigen cuenta y su geometría no sirve para separar tela, cuello, puños y botones.
- **CGTrader, Free3D, TurboSquid, BlenderKit.** Licencias propias de marketplace («royalty free», «personal use»), no CC0.
- **Poly Pizza, OpenGameArt, MakeHuman.** Sin camiseta ni polo de calidad suficiente.

Por eso las dos mallas se construyeron por script, con licencia propia. Las fotos de `assets/productos/` se usaron
solo como referencia de forma, nunca como textura.

## Vídeo de portada (Remotion)

El vídeo del ojo de buey del hero se produce en `video/` con [Remotion](https://www.remotion.dev), un proyecto
aparte que no entra en el build de la web. Su licencia (comprobada el 18/10/2026 en
`github.com/remotion-dev/remotion/blob/main/LICENSE.md`) es gratuita para particulares, empresas con ánimo de lucro
de hasta 3 empleados y, literalmente, «a non-profit or not-for-profit organization»; solo exige licencia de empresa
fuera de esos casos. El titular es una asociación juvenil sin ánimo de lucro (Asociación Juvenil Junior Empresa
[TITULAR]), así que queda cubierto por la licencia gratuita.

| Activo | Origen | Licencia |
| --- | --- | --- |
| `public/portada/*.mp4`, `*.webm`, póster | Render propio con Remotion a partir de recursos del repositorio: fotos reales de la Atomic 150 (recortes del estudio), logo y estrella del PDF del catálogo, la mascota OVNI renderizada desde `assets/marca/ovni/ovni-marca.blend` y la tipografía Sora (OFL) | Propiedad de [TITULAR] ([MARCA]) |
| `video/` (código del vídeo) | Código propio sobre Remotion | Propiedad de [TITULAR] ([MARCA]); Remotion con su licencia gratuita para entidades sin ánimo de lucro |

## Dependencias de código

El estudio 2D no añade librerías gráficas. `zustand` (estado del estudio) va con licencia MIT; su texto completo está
en `node_modules/`. `three`, `@react-three/fiber` y `gltfpack`, usados en la prueba 3D, se han quitado del proyecto.
