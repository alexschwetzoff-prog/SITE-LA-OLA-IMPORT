# Base técnica heredada

Cómo funciona la base sobre la que se construye la web. Resume las decisiones técnicas que la otra empresa fue tomando
fase a fase y que siguen siendo válidas para el código copiado. Lo visual y lo comercial (colores, mascota, textos,
precios, plazos, zona de servicio) **no** se hereda: lo define La Ola Import (`CLAUDE.md`, `brand/`).

## Pila

- Next.js 16 (App Router) + React + TypeScript + Tailwind 4 (`@theme` en `app/globals.css`, paleta por defecto
  vaciada: solo existen los tokens propios). Zustand para el estado del estudio, zod para validar.
- **Ojo con Next 16**: `AGENTS.md` avisa de que la API cambia respecto a versiones anteriores; consulta
  `node_modules/next/dist/docs/` antes de escribir código de Next.
- Sin base de datos en la v1 heredada: el formulario envía por email. Esquema previsto en `supabase/migrations/`.
- Todo lo que envía o escribe pasa por acciones de servidor (`app/proyecto/acciones.ts`), nunca desde el navegador.
- Sin WebGL en toda la web: el estudio es canvas 2D. (La base probó 3D y lo descartó: las prendas no parecían reales.)
- Objetivos que tenía la base: LCP < 2,5 s en móvil, JS inicial de la home < 200 KB comprimido, Lighthouse móvil ≥ 90,
  accesibilidad AA.

## Catálogo (`data/catalogo.ts`)

- Tipos: `Producto` (slug, nombre, categoría, tipo, material, gramaje/medidas, `tallas` y `tallasInfantiles` según la
  ficha técnica de cada producto, `precioDesde: number | null`, `estado`, `destacado`, `etiquetas`, `posiciones` con
  `maxCm`, `visor: '2d' | 'ninguno'`, `silueta`, `colores`, `orden`, `activo`) y `Color` (nombre, hex,
  `hexSecundario` para bicolores, `jaspeado`, `porDefecto`, `provisional`).
- `precioDesde: null` → «Consultar precio»; `estado: 'consultar-disponibilidad'` sustituye al precio. El texto lo
  genera `textoPrecio` en `lib/producto.ts`. **Hoy todos los precios están a `null`** hasta tener las tarifas propias.
- Prohibido en datos públicos: proveedor, código de referencia, coste, margen.
- Categorías ligeras en `data/categorias.ts` y ayudas puras en `lib/producto.ts` para que el navegador no cargue los
  30 productos para pintar una tarjeta. Filtros en `lib/filtros.ts`; «Combina con», fotos de ejemplo y títulos SEO en
  `lib/catalogo.ts`.

## Fotos de producto

- Origen: fotos del proveedor por modelo, color y vista (delante/detrás; en gorras y goodies, tipo de toma). Lista
  interna en `docs/fotos-proveedor/lista-descargas.csv` (dirección del proveedor en placeholder) y patrones en
  `patron-url.txt`. Originales en `assets/productos/originales-proveedor-hd/` (2000 px) y
  `originales-proveedor/` (600 px), carpetas ignoradas por git: **nunca se suben ni se publican**.
- Publicación: procesadas una sola vez, WebP calidad 95, a 1200 y 800 px (`foto.webp` y `foto-800.webp`), nunca
  ampliadas por encima del original. Índice en `data/fotos-catalogo.json` (con `anchos`) y en `data/siluetas/*.json`.
- **No pasan por `next/image`**: van como `<img srcset>` (`lib/fotos.ts`, `components/producto/FotoProducto.tsx`).
  La segunda compresión y AVIF aplanaban la textura de las prendas oscuras. Siempre sobre fondo claro.
- La etiqueta del fabricante (cuello, mangas, cualquier logo) se detecta y se rellena foto a foto
  (`scripts/fotos/etiquetas.py`, clonado de Poisson; cajas a mano en `ETIQUETAS_MANUALES` donde falla; fuente
  «costura» para Jamaica). Barrido de marcas (`revisar-marcas.py`), OCR (`ocr-fotos.mjs`, el patrón del nombre del
  fabricante está en placeholder) y limpieza de metadatos (`limpiar-metadatos.py`). Informe en
  `docs/FOTOS-REVISION.md` (`informe-revision.py`). Una foto dudosa no se publica.
- Encuadre: cada foto se normaliza a la base de su producto (`geometria.normalizacion`; escala por altura de la prenda o
  anchura de gorras y bolsas). La geometría medida a mano en fotos de 600 px se lleva a cada foto caja → caja
  (`scripts/fotos/geometria.py`); las medidas en px de los scripts escalan con `ESCALA = ancho / 600`.
- Recoloreado (`scripts/fotos/recolor.py`) solo para colores sin foto real, y solo si pasa la revisión a ojo.
- Auditorías tras cada tanda: `auditar-colores.py` (color medio de la tela frente al hex de la muestra; delante ↔
  detrás) y `auditar-diseno-oscuro.py` (si el diseño de ejemplo debe ir en blanco: umbral de luminosidad 135).
- **Orden al cambiar fotos**: descargar (`descargar-fotos-proveedor.py --hd`) → `preparar-fotos-estudio.py` →
  `preparar-fotos-catalogo.py` → `preparar-fotos-productos.py` → `tabla-revision.py` → `auditar-colores.py` →
  `auditar-diseno-oscuro.py`. Necesitan Python con Pillow y numpy.

## Diseño de ejemplo sobre las fotos

- No va incrustado en la foto: el navegador lo dibuja como capa aparte a la resolución real de pantalla
  (`components/producto/FotoProducto.tsx`, `lib/diseno-ejemplo.ts`), con el sombreado de la tela. Colocación por foto
  en `data/fotos-catalogo.json` (`diseno`): corazón en prendas y el mismo diseño más grande en la espalda; frontal en
  gorras; centro de la cara en bolsas; zona de marcaje en goodies. Nunca torcido, cortado ni fuera del producto.
- Atomic 150 y Austral llevaban el logo y la estrella de la marca de la base (`marca-logo`, `marca-estrella`; archivos
  `public/marca/logo-marca-catalogo.webp` y `estrella-marca-catalogo.webp`, **no copiados**). El resto usa
  «Tu logo aquí» (`public/marca/tu-logo-aqui.png`, copiado; versión blanca para tela oscura).
- Algunos goodies (Davos, Uldon, Roldi, Zora, Luxor) usan una foto que ya lleva «tu logo AQUÍ» impreso.

## Estudio (`/disena/[slug]`)

- Canvas 2D sobre las fotos reales, delante y detrás (botones Delante / Detrás). Fotos recortadas sin fondo en
  `public/productos/estudio/` (WebP con alfa) sobre un escenario claro único; las capturas, sobre blanco.
- El logo se dibuja siguiendo el sombreado de la tela; escala cm → px por foto calibrada con el largo de la ficha
  técnica (bloque `fotos` de `data/siluetas/*.json`).
- Se cambia de prenda (Atomic 150 ↔ Austral) sin salir, conservando logo, posiciones compatibles y tamaño.
- Logo delantero y trasero opcional (sin trasero, detrás va el delantero), cada uno colocado y dimensionado aparte.
  Originales en IndexedDB (`lib/logos-db.ts`: `logoId`, `logoIdDetras`), también en la cesta.
- Capturas de 1200 × 1500 generadas al enviar; un solo botón de descarga («Descargar mi diseño», delante y detrás en un
  PNG con la marca: `lib/estudio/descarga.ts`, hoy con placeholders).

## Cesta, formulario y envío

- Cesta en localStorage (`lib/presupuesto.ts`, clave `…:diseno` para lo que deja el estudio); logo de la home al estudio
  por sessionStorage (`lib/logo-pendiente.ts`).
- `/proyecto`: cesta precargada y formulario en pasos. Validación con zod en servidor (`lib/solicitud/esquema.ts`);
  antispam sin terceros (campo trampa, 5 s mínimos, límite por IP en memoria); casilla de privacidad obligatoria; si el
  envío falla, mensaje con botón de WhatsApp y se conserva lo escrito; la cesta se vacía solo tras un envío correcto.
  `/gracias` con `noindex`.
- Adjuntos: máximo **4 MB** por envío (`MAX_ENVIO_BYTES`): las funciones de Netlify cortan el cuerpo en 6 MB en base64
  y Vercel en 4,5 MB. Las capturas se comprimen en el navegador; el logo original solo se reduce si no cabe solo.
- Emails (`lib/correo/`): transporte en `transporte.ts` (Gmail SMTP 465, Resend o `archivo` para pruebas en
  `.correo-local/`), plantillas en `plantillas.ts`, logo incrustado en `logo-email.ts` (hoy un PNG de 1 px). Variables
  en `.env.example`. Email interno con todo y reply-to al cliente; confirmación al cliente sobria, sin precios.
- WhatsApp: los mensajes están solo en `lib/whatsapp.ts`; los enlaces con `enlaceWhatsApp()` de `lib/site.ts`.

## Opiniones

- Se leen del CSV publicado de una hoja de Google Sheets (`OPINIONES_CSV_URL`, variable solo de servidor). Parser propio
  en `lib/opiniones/` (con pruebas: `npm test`), solo filas con `publicar = SI`, nombre solo con `mostrar_nombre = SI`,
  revalidación cada hora, 5 s de espera y lista vacía ante cualquier fallo. Nada de testimonios de relleno.

## Despliegue, SEO e indexación

- La base se alojaba en Netlify Free (`netlify.toml`: adaptador oficial de Next, caché de 30 días para `public/`,
  redirección www → apex, cabeceras de seguridad). Con Vercel también funciona; decide La Ola Import.
- Indexable solo en producción en el dominio canónico (`lib/entorno.ts`, decidido en el build con `CONTEXT`/`URL` de
  Netlify o `VERCEL_ENV`/`VERCEL_PROJECT_PRODUCTION_URL`); vistas previas con `noindex` y `robots.txt` cerrado. Tras
  conectar el dominio hay que volver a desplegar.
- `outputFileTracingExcludes` en `next.config.ts` deja fuera de la función `assets/`, `docs/`, `scripts/`…: sin eso la
  función llegaba a 1 GB.

## Movimiento heredado (a sustituir o quitar con la identidad nueva)

- Mascota animada en el cambio de color (`lib/ovni.ts`, `components/producto/Ovni.tsx`, sprites en
  `public/marca/ovni/` **no copiados**, metadatos en `data/ovni-sprites.json`): solo `transform` y `opacity`, se
  cancela con otro cambio, fundido de 150 ms con `prefers-reduced-motion`.
- Fondo espacial en canvas (`lib/cielo.ts`, `lib/cielo-config.ts`, `components/space/StarField.tsx`) y transiciones
  «tipo nave» en `app/globals.css`. Es estilo de la base: decidir con `brand/` si se rehace o se quita.

## Comprobaciones antes de cerrar un cambio

- `npm run build`, `npm run lint`, `npx tsc --noEmit`, `npm test`.
- A 390 px nada puede ensanchar el documento (`main` con `overflow-x-clip` y `body { overflow-x: clip }`); si no,
  Chrome agranda el viewport de maquetación y el menú desaparece: `node scripts/comprobar-movil.mjs <url>`.
- `node scripts/revisar-web.mjs <url>` (enlaces, textos prohibidos, metadatos, consola, 390 px). Su lista de palabras
  prohibidas es de la base: adaptarla a La Ola Import.
