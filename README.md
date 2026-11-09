# [MARCA] · web v1

Web de [MARCA] (dominio-pendiente.example): personalización textil y merchandising con impresión digital, en Valencia.
Se aloja en Netlify (plan Free, `netlify.toml`); la guía de lanzamiento para el equipo está en [docs/LANZAMIENTO.md](docs/LANZAMIENTO.md).

- Spec completa: [docs/SPEC.md](docs/SPEC.md) · textos legales: [docs/LEGAL.md](docs/LEGAL.md) · referencias visuales: [docs/referencias.md](docs/referencias.md).
- Reglas de trabajo y de negocio: [CLAUDE.md](CLAUDE.md).
- Pendientes y datos provisionales: [docs/pendientes.md](docs/pendientes.md).

## Arrancar

```bash
npm install
cp .env.example .env.local
npm run dev
```

`npm run build` genera la versión de producción y `npm run lint` pasa ESLint. Antes de desplegar: `npx tsc --noEmit`,
`node scripts/comprobar-movil.mjs http://localhost:3000` y `node scripts/revisar-web.mjs http://localhost:3000` sobre
`npm run start`.

## Estructura

```
app/                  rutas (App Router) y páginas legales
components/layout/    cabecera, pie, botón de WhatsApp, iconos
components/space/     fondo estelar (canvas 2D)
components/legal/     piezas de las páginas legales
components/inicio/    las nueve escalas de la home (portada, qué hacemos, para quién, catálogo, pruébalo con tu logo, cómo trabajamos, visita, opiniones, aterrizaje)
components/catalogo/  catálogo interactivo (filtros, travesía), tarjeta de producto, muestras, etiquetas e iconos de categoría
components/ficha/     ficha de producto (galería, color, posiciones, acciones) y «Combina con»
components/presupuesto/ cesta de presupuesto: acceso en la cabecera y «Añadir al presupuesto»
components/proyecto/  /proyecto: cesta precargada y formulario en tres pasos (visual hasta la fase 6)
components/ui/        sección con destello y botones
components/estudio/   estudio de diseño 2D: visor sobre las fotos reales (canvas) y panel de pasos
lib/estudio/          estado del estudio (Zustand), procesado del logo, siluetas y calibración
data/catalogo.ts      los 30 productos del catálogo 2026-2027
data/siluetas/        anclas, zonas de impresión (cm) y calibración px/cm de las fotos de cada prenda con estudio
lib/site.ts           datos de contacto, menú, textos fijos y el titular legal (número de registro: `SITE.titular.registro`)
lib/entorno.ts        si el build es el de producción en dominio-pendiente.example (indexable) o una vista previa (noindex)
lib/correo/           envío de emails: transporte (Resend, Gmail o archivo de pruebas), plantillas y logo incrustado
lib/solicitud/        validación (zod), antispam, adjuntos y preparación del envío del formulario
lib/catalogo.ts       ayudas del catálogo: fotos de ejemplo, filtros, «Combina con», títulos SEO
lib/presupuesto.ts    cesta de presupuesto en localStorage (y el diseño que deja el estudio)
lib/logo-pendiente.ts traspaso del logo de la home al estudio (sessionStorage)
lib/logos-db.ts       archivo original del logo guardado en el navegador (IndexedDB) al enviar el diseño
lib/portada.ts        vídeo de portada (cuando exista) e imagen fija provisional
data/fotos-catalogo.json fotos con la personalización de ejemplo por producto y color, real o recoloreada (generado)
data/opiniones.ts     reseñas publicadas (vacío hasta la fase 7)
public/productos/     fotos optimizadas (los originales están en assets/); las del estudio llevan la etiqueta retocada
public/productos/estudio/ fotos blancas recoloreadas a cada color de la paleta y las blancas recortadas sin fondo (WebP) para el escenario oscuro (generadas por script)
public/productos/catalogo/ los 30 productos en cada color de su paleta (real o recoloreado), delante y detrás en las prendas, con la personalización de ejemplo: logo y estrella de [MARCA] en Atomic 150 y Austral, diseño «Tu logo aquí» en el resto, colocado con la calibración cm → px de cada foto (generadas por script)
public/portada/       imagen fija provisional del hero
public/marca/         logo, estrella, diseño «Tu logo aquí», mascota OVNI y el logo pequeño para emails
public/og/            imágenes Open Graph (general y una por producto), generadas por scripts/marca/generar-og.py
netlify.toml          build, redirecciones (www → apex), caché larga de public/ y cabeceras de seguridad
scripts/fotos/        retoque de la etiqueta del fabricante, calibración y recoloreado (estudio: preparar-fotos-estudio.py; catálogo de Atomic 150 y Austral y portada: preparar-fotos-catalogo.py; los otros 28 productos: preparar-fotos-productos.py, que se ejecuta el último)
scripts/              capturas (capturas.mjs, capturas-estudio.mjs), comprobaciones a 390 px (comprobar-movil.mjs), revisión final (revisar-web.mjs), prueba del formulario (probar-solicitud.mjs) y de Resend (probar-resend.mjs)
scripts/marca/        imágenes Open Graph, logo de email y favicon (generar-og.py, exportar-og.mjs)
archivo/estudio-3d/   la prueba 3D descartada (mallas, scripts de Blender, comparativas y medición), fuera del build
assets/               originales de marca y producto (no se sirven)
docs/                 spec, textos legales, catálogo PDF, fichas técnicas (solo consulta) y licencias
```

## Estudio 2D

El estudio de `/disena/[slug]` dibuja el logo sobre las fotos de la prenda siguiendo el sombreado de la tela y
permite cambiar de prenda y de color sin salir de la página: cada color usa su foto real si existe o la foto blanca
recoloreada. Las fotos se preparan con `scripts/fotos/preparar-fotos-estudio.py` (quita la etiqueta del cuello,
calibra cm → px con las fichas, recolorea la foto blanca a toda la paleta y escribe `data/siluetas/*.json`).
El 3D se probó y se descartó (11/10/2026); lo probado está en `archivo/estudio-3d/` y el origen de cada activo en
[docs/licencias.md](docs/licencias.md).

## Fases

Una fase por sesión y por PR (sección 11 de la spec). Cerradas: fase 3 (esqueleto), fase 2 (estudio de Atomic 150 y
Austral, probado en 3D y cerrado en 2D sobre las fotos reales), fase 4 (home, catálogo, fichas y cesta de presupuesto,
con el formulario solo visual) y fase 4.1 (correcciones tras revisar la web: espaldas de todas las prendas, diseño de
ejemplo calibrado en cm, selector de posición obligatorio, precios con IVA a la vista, formulario para particulares y
el PDF oficial tal cual), fases 4.2 a 4.6 (color, fotos reales, nitidez, cielo y mascota), fase 6 (el formulario envía
por email) y fase 9 (lanzamiento en Netlify: SEO, Open Graph, Resend listo y revisión final). Siguen: fase 5 (estudio
para el resto de prendas cuando tengan fotos delantera y trasera) y fase 7 (reseñas).
