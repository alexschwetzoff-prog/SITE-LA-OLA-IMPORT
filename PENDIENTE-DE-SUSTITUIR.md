# Pendiente de sustituir

Todo lo que en esta copia sigue siendo de la empresa de la que sale la base, o está en placeholder. Se tacha
(`- [x]`) al sustituirlo. Para encontrar los marcadores: `grep -rn "\[MARCA\]\|\[COLOR\]\|\[PRECIO\]\|pendiente" --exclude-dir=assets --exclude-dir=node_modules .`

## 1. Identidad (vendrá de `brand/`)

- [ ] **Nombre de marca**: `[MARCA]` en 32 archivos de `app/`, `components/`, `lib/` y `data/` (cabecera, pie, títulos y
      metadatos, legales, emails, opiniones «Cliente de [MARCA]», descarga del estudio, `alt` de imágenes).
      Fuente principal: `SITE.nombre` y `SITE.tituloPorDefecto` en `lib/site.ts`.
- [ ] **Lema**: `[LEMA]` (`SITE.lema`, `lib/portada.ts`).
- [ ] **Colores**: los tokens de `app/globals.css` son grises neutros (`[COLOR]`) con los nombres heredados
      (`space-*`, `nova-*`, `star-*`, `moon-*`, `ink-*`, `mist-*`); también grises en `lib/correo/plantillas.ts` (paleta
      del email), `lib/estudio/descarga.ts`, `app/layout.tsx` (`themeColor`), `components/inicio/Constelacion.tsx`,
      `components/inicio/OjoDeBuey.tsx` y `lib/cielo.ts`. Decidir si se renombran los tokens. Los verdes `eco-*` del
      distintivo ECO son neutros de marca y se pueden quedar.
- [ ] **Tipografías**: Sora (titulares) e Inter (texto) en `app/layout.tsx` y `app/globals.css` eran las de la base.
- [ ] **Estilo visual heredado**: fondo espacial animado (`components/space/StarField.tsx`, `lib/cielo.ts`,
      `lib/cielo-config.ts`), transiciones «tipo nave» y «travesía» del catálogo (`app/globals.css`), ojo de buey y
      constelaciones de la home (`components/inicio/OjoDeBuey.tsx`, `Constelacion.tsx`), nombres de componentes con
      metáfora espacial. Rehacer o quitar según `brand/`.
- [ ] **Mascota**: el OVNI que revela cada cambio de color (`lib/ovni.ts`, `components/producto/Ovni.tsx`,
      `data/ovni-sprites.json`) y los sobrevuelos del cielo. Sus sprites no se han copiado: hoy la animación no tiene
      imagen. Sustituir por la animación de La Ola Import o quitarla (dejando el fundido de 150 ms).
- [ ] **Logo para emails**: `lib/correo/logo-email.ts` lleva un PNG transparente de 1 px (`[LOGO]`).

### Archivos de marca que el código pide y no existen (no se copiaron)

- [ ] `public/marca/logo-marca.png`, `public/marca/estrella-marca.png` (cabecera, pie, descarga del estudio, emails).
- [ ] `public/marca/logo-marca-catalogo.webp`, `public/marca/estrella-marca-catalogo.webp` (diseño de ejemplo de
      Atomic 150 y Austral en catálogo, ficha y estudio; ids `marca-logo` y `marca-estrella` en
      `data/fotos-catalogo.json` y `lib/diseno-ejemplo.ts`). Decidir qué diseño de ejemplo llevan.
- [ ] `public/marca/ovni/ovni-reveal.webp`, `ovni-cruce.webp` (mascota).
- [ ] `public/portada/portada.webp`, `portada-520.webp`, `portada-780.webp`, `portada.mp4`, `portada.webm` (hero de la
      home; `lib/portada.ts`, `components/inicio/Portada.tsx`).
- [ ] `public/og/marca.png` y `public/og/productos/<slug>.png` (Open Graph general y de las 30 fichas). El generador de
      la base (`scripts/marca/generar-og.py`) no se copió porque dibujaba su marca: rehacerlo o usar `next/og`.
- [ ] `app/favicon.ico`, `app/icon.png`, `app/apple-icon.png`.
- [ ] `/catalogo-marca.pdf` (`SITE.catalogoPdf` en `lib/site.ts`): el catálogo PDF propio, o quitar el enlace.
- [ ] `public/marca/tu-logo-aqui.png` **sí está**, pero es el diseño «Tu logo aquí» que hizo la base (tipografía suya).
      También lo llevan impreso las fotos de 5 goodies (`public/productos/catalogo/davos-*`, `uldon-*`, `roldi-*`,
      `zora-*`, `luxor-*`). Conviene rehacerlo con la identidad nueva.

## 2. Datos de la empresa y contacto (`lib/site.ts` y `.env.example`)

- [ ] Dominio: `dominio-pendiente.example` (`SITE.url`, `lib/entorno.ts`, `app/robots.ts`, `netlify.toml`,
      remitente de Resend en `lib/correo/transporte.ts`, docs). Sitio de Netlify: `sitio-pendiente.netlify.app`.
- [ ] Email de contacto: `email-pendiente@example.com` (`SITE.email`, emails, legales, docs).
- [ ] Teléfono `[TELÉFONO]` y WhatsApp (`SITE.whatsapp` cae en `34000000000` si no hay `NEXT_PUBLIC_WHATSAPP_NUMBER`).
- [ ] Instagram: `instagram-pendiente`.
- [ ] Dirección: `SITE.direccion` (`[DIRECCIÓN]`, `[BARRIO]`, `[CP]`, `[CIUDAD]`, enlace al mapa) y `[HORARIO]`.
- [ ] Titular legal: `SITE.titular` (`[TITULAR LEGAL]`, `[TITULAR]`, `[NIF]`, `titular-pendiente@example.com`,
      `[DIRECCIÓN DEL TITULAR]`, `registro: ''`). Con el registro vacío, /aviso-legal enseña `[FALTA número de registro]`;
      si La Ola Import no es una asociación, quitar ese campo del aviso legal.
- [ ] Mensajes de WhatsApp (`lib/whatsapp.ts`): textos de la base.

## 3. Textos y reglas de negocio de la base que siguen en la web

- [ ] `TEXTOS` en `lib/site.ts`: nota de precios («desde… a partir de 150 unidades»), pedido mínimo («desde 25
      unidades»), plazos («Presupuesto en 24 h laborables», «unas 2 semanas»), «Precios por unidad, sin IVA.» y los tres
      datos del catálogo («Con sede en Valencia», «Presupuesto en 24 h», «Entregas en toda España»). Son promesas de la
      base: confirmar o cambiar con La Ola Import.
- [ ] **Valencia**: la base atendía en la ciudad de Valencia y llevaba el muestrario al local del cliente. Aparece en
      `app/aviso-legal/page.tsx`, `app/catalogo/page.tsx`, `components/ficha/Ficha.tsx`,
      `components/inicio/ComoTrabajamos.tsx`, `Portada.tsx`, `Visita.tsx`, `components/layout/Footer.tsx`,
      `components/proyecto/Proyecto.tsx`, `lib/solicitud/comun.ts` y `lib/site.ts`.
- [ ] Todos los textos de la home (`components/inicio/*`: portada, qué hacemos, para quién, catálogo, pruébalo con tu
      logo, cómo trabajamos, visita, opiniones, aterrizaje), del catálogo, la ficha, el estudio, /proyecto, /gracias,
      /opiniones, /tu-opinion y los emails (`lib/correo/plantillas.ts`) están escritos con el tono y las promesas de la
      base.
- [ ] Legales (`app/aviso-legal`, `app/privacidad`, `app/cookies`, `components/legal/`, `docs/LEGAL.md`): textos de la
      base con el titular en placeholder. Encargados del tratamiento (Netlify, Google, Resend), plazos de conservación y
      revisión legal: todo por rehacer para La Ola Import.
- [ ] Destacados de la home, filtro «Calidad superior», distintivo ECO, Luxor y Davos en «Consultar disponibilidad»:
      decisiones de catálogo de la base.
- [ ] `scripts/revisar-web.mjs`: lista `PROHIBIDAS` con las reglas de la base (demo, muestra gratuita, videollamada…).

## 4. Catálogo, precios y proveedor

- [ ] **Precios**: los 19 `precioDesde` de `data/catalogo.ts` están a `null` (`[PRECIO]`), así que todo sale como
      «Consultar precio». La tabla de `docs/SPEC.md` (sección 6) también lleva `[PRECIO]`. No se han copiado costes ni
      márgenes.
- [ ] **Nombres de producto** (Atomic 150, Austral, Bull, Jamaica…): son los nombres de modelo del catálogo del
      proveedor, que la base usaba tal cual. Decidir si La Ola Import los mantiene.
- [ ] **Selección de los 30 productos**, colores, tallas y posiciones: son los de la base. Revisar con el catálogo de La
      Ola Import (nombres de color provisionales incluidos: campo `provisional: true`).
- [ ] **Proveedor**: la dirección de descarga de fotos está como `https://proveedor-pendiente.example` en
      `docs/fotos-proveedor/lista-descargas.csv`, `patron-url.txt` e `informe-descarga*.csv`; el patrón del nombre del
      fabricante para el OCR en `scripts/fotos/ocr-fotos.mjs` y `revisar-web.mjs` es `PROVEEDOR_PENDIENTE` /
      `proveedor-pendiente`. Los CSV conservan los códigos de modelo y de color (necesarios para descargar): uso interno,
      nunca se publican.
- [ ] Las fichas técnicas del proveedor (`docs/fichas-tecnicas/`) no se copiaron: pedirlas al proveedor si hacen falta.

## 5. Cuentas, servicios y variables (todas nuevas y propias de La Ola Import)

- [ ] Repositorio en GitHub propio (esta carpeta aún no tiene git). `[CUENTA-GITHUB]` en `docs/LANZAMIENTO.md`.
- [ ] Alojamiento (Netlify o Vercel): `netlify.toml` y `docs/LANZAMIENTO.md` son los de la base, con el dominio en
      placeholder. Rehacer la guía con las cuentas nuevas.
- [ ] Email: `GMAIL_USUARIO`, `GMAIL_CONTRASENA_APP`, `CORREO_DESTINO`, `CORREO_TRANSPORTE`, `RESEND_API_KEY`,
      `RESEND_REMITENTE` (en `.env.local` y en el panel del alojamiento, nunca en git).
- [ ] Opiniones: hoja de Google Sheets propia y `OPINIONES_CSV_URL`.
- [ ] Supabase (si entra): proyecto propio en la UE; revisar `supabase/migrations/00000000000000_esquema_inicial.sql`
      (tablas `leads` y `reviews` de la spec de la base, nunca aplicadas) antes de usarlo.
- [ ] Analítica, píxeles, Google Search Console y perfil de empresa: todo nuevo. No hay ningún ID copiado.

## 6. Documentación heredada

- [ ] `README.md`: estructura de carpetas y fases de la base, con placeholders; enlaza a documentos que no se copiaron
      (`docs/referencias.md`, `docs/pendientes.md`, `archivo/`). Reescribir.
- [ ] `docs/SPEC.md`: extracto técnico de la spec de la base (secciones 3, 4, 5, 6, 8 y 9), con sus textos y decisiones.
- [ ] `docs/licencias.md`: origen y licencias de los activos de la base (con `[TITULAR]`); cita archivos que no se
      copiaron (portada, vídeo, prueba 3D).
- [ ] `docs/FOTOS-REVISION.md` y `docs/fotos-proveedor/INFORME.md`: válidos como explicación del proceso de fotos.
- [ ] Comentarios del código: citan fases y decisiones de la base con fecha («fase 4.4», «decisión del equipo del
      12/10/2026»). Son contexto técnico, no reglas de La Ola Import.
