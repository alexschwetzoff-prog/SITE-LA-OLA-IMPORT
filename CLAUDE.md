# La Ola Import · web

Web de **La Ola Import**, empresa de impresión textil y merchandising. Está construida sobre una **base reutilizada de
otra empresa** (otra marca del mismo sector, sin relación con La Ola Import): se ha copiado su código, su catálogo y su
configurador de prendas, y se ha quitado su identidad. Lee esto entero al empezar cada sesión.

## Lo primero que hay que saber

- **Toda la identidad es nueva**: nombre, colores, logo, mascota, tipografías, textos, tono, diseño y fotos de marca.
  Vendrá de la carpeta **`brand/`** (hoy vacía). No se reutiliza nada de la marca de la base ni se inventa nada:
  si falta un archivo de marca, se usa un marcador visible y se apunta en `PENDIENTE-DE-SUSTITUIR.md`.
- **Lo heredado que sigue en el código** (estructura visual, textos de la home, mascota animada, fondo espacial…) es
  provisional. La lista completa está en **`PENDIENTE-DE-SUSTITUIR.md`**: consúltala antes de tocar cualquier pantalla
  y tacha lo que se sustituya.
- **Placeholders**: todo lo que había que cambiar está marcado con corchetes y mayúsculas para encontrarlo con un
  grep: `[MARCA]`, `[LEMA]`, `[TITULAR]`, `[TITULAR LEGAL]`, `[NIF]`, `[DIRECCIÓN]`, `[BARRIO]`, `[CP]`, `[CIUDAD]`,
  `[TELÉFONO]`, `[WHATSAPP]`, `[HORARIO]`, `[PRECIO]`, `[COLOR]`, `[LOGO]`, `[PROVEEDOR]`, `[CUENTA-GITHUB]`,
  `[AUTOR]`, `[NÚMERO DE REGISTRO]`. En URLs y emails van como `dominio-pendiente.example`,
  `sitio-pendiente.netlify.app`, `email-pendiente@example.com`, `titular-pendiente@example.com`,
  `instagram-pendiente` y `proveedor-pendiente.example`. Nunca se publica con un placeholder a la vista.
- **Cuentas nuevas y propias de La Ola Import**: GitHub, Supabase, Vercel/Netlify, dominio, email, Google (Search
  Console, perfil de empresa), analítica y píxeles. No se reutiliza ninguna cuenta, proyecto, clave ni ID de la base.
- **Nunca se suben `.env`** (ni `.env.local`, ni ninguna variante): solo `.env.example`, sin valores reales. Las claves
  viven en `.env.local` y en el panel del alojamiento. Tampoco IDs de píxel ni tokens en el código o en la documentación.
- Esta carpeta **todavía no es un repositorio git**. Al crearlo (`git init`), en la cuenta de GitHub de La Ola Import.

## Qué hay (heredado y reutilizable)

- **Web**: Next.js (App Router) + TypeScript + Tailwind 4. Páginas: home, `/catalogo`, `/catalogo/[slug]` (ficha),
  `/disena/[slug]` (estudio), `/proyecto` (cesta + formulario), `/gracias`, `/opiniones`, `/tu-opinion` y legales.
  Detalle de carpetas en `README.md`.
- **Catálogo**: 30 productos en `data/catalogo.ts` (categorías, tipo, material, gramaje, tallas de adulto e infantiles,
  colores con hex, posiciones de impresión con tamaño máximo en cm, etiquetas, visor). Categorías en
  `data/categorias.ts`. **Todos los precios están a `null`** (se enseña «Consultar precio») hasta tener las tarifas
  de La Ola Import.
- **Fotos de producto**: `public/productos/` (procesadas: catálogo por color, delante y detrás, a 1200 y 800 px en WebP;
  estudio recortado sin fondo) con su índice en `data/fotos-catalogo.json`. Originales del proveedor en
  `assets/productos/` (las hd en `originales-proveedor-hd/`, ignoradas por git: nunca se suben).
- **Configurador (estudio 2D)**: `components/estudio/`, `lib/estudio/`, `data/siluetas/*.json` (anclas, zonas en cm y
  calibración cm → px por foto). Solo Atomic 150 y Austral tienen estudio; el resto, visor `'ninguno'`.
- **Cesta y pedido**: `lib/presupuesto.ts` (localStorage), `lib/logos-db.ts` (logo original en IndexedDB),
  `components/proyecto/`, `lib/solicitud/` (zod, antispam, adjuntos ≤ 4 MB) y `lib/correo/` (envío por email:
  Gmail SMTP, Resend o archivo local de pruebas; todo el transporte en `lib/correo/transporte.ts`).
- **Base de datos**: la base no tenía ninguna en producción. El esquema que planeaba (tablas `leads` y `reviews`, con
  RLS) está en `supabase/migrations/00000000000000_esquema_inicial.sql`, solo estructura y sin aplicar.
- **Scripts**: `scripts/fotos/` (descarga, retoque de etiquetas del fabricante, encuadre, recoloreado, auditorías, OCR),
  `scripts/capturas*.mjs`, `scripts/comprobar-movil.mjs`, `scripts/comprobar-cielo.mjs`, `scripts/revisar-web.mjs`,
  `scripts/probar-*.mjs`.

## Documentación para leer al empezar

- `docs/BASE-TECNICA.md`: cómo funcionan la web, el catálogo, las fotos, el estudio, la cesta y el envío, y las
  decisiones técnicas heredadas que conviene mantener. **Léelo antes de tocar fotos, catálogo o estudio.**
- `docs/SPEC.md`: extracto técnico de la spec de la base (mapa del sitio, páginas, estudio, datos del catálogo,
  reseñas, arquitectura). Sus textos y reglas de negocio son de la base, no de La Ola Import.
- `docs/FOTOS-REVISION.md`, `docs/fotos-proveedor/INFORME.md`: el proceso de fotos y su revisión.
- `docs/LANZAMIENTO.md`: guía de despliegue en Netlify heredada (cuentas y dominio, a rehacer con las de La Ola Import).
- `docs/LEGAL.md`: textos legales de la base con los datos del titular en placeholder. **No valen tal cual**: La Ola
  Import necesita los suyos (titular, NIF, encargados, plazos) revisados por quien lleve lo legal.
- `PENDIENTE-DE-SUSTITUIR.md`: todo lo que sigue siendo de la base.

## Reglas

- No mencionar nunca la marca de la base ni enlazar a su web. Si aparece algo suyo, se quita y se apunta.
- No publicar nombres del proveedor, códigos de referencia, costes ni márgenes en nada público (web, metadatos, nombres
  de archivo). La lista de descargas del proveedor (`docs/fotos-proveedor/`) es interna y lleva su dirección en
  placeholder.
- Las reglas de negocio de La Ola Import (precios, pedido mínimo, plazos, zona de servicio, visitas, IVA) **están por
  definir**: no se inventan ni se copian de la base. Pregunta antes de escribir cualquier promesa comercial.
- Ninguna reseña inventada. Las opiniones solo se publican si son reales y con permiso.
- Español de España salvo que La Ola Import decida otra cosa. Accesibilidad AA y `prefers-reduced-motion`.
- Si algo es ambiguo o choca con estas reglas, pregunta antes de construir.

## Arrancar

```bash
npm install
cp .env.example .env.local   # y rellenar con las claves propias de La Ola Import
npm run dev
```

Hasta que lleguen los archivos de `brand/` faltan imágenes de marca (logo, estrella, mascota, portada, Open Graph,
favicon): la web arranca pero esas piezas salen rotas o vacías. Está listado en `PENDIENTE-DE-SUSTITUIR.md`.
