# Pendiente de sustituir

Todo lo que en esta copia sigue siendo de la empresa de la que sale la base, o está en placeholder. Se tacha
(`- [x]`) al sustituirlo. Para encontrar los marcadores: `grep -rn "\[MARCA\]\|\[COLOR\]\|\[PRECIO\]\|pendiente" --exclude-dir=assets --exclude-dir=node_modules .`

## 1. Identidad (vendrá de `brand/`)

- [x] **Nombre de marca**: `[MARCA]` en 32 archivos de `app/`, `components/`, `lib/` y `data/` (cabecera, pie, títulos y
      metadatos, legales, emails, opiniones «Cliente de [MARCA]», descarga del estudio, `alt` de imágenes).
      Fuente principal: `SITE.nombre` y `SITE.tituloPorDefecto` en `lib/site.ts`. → **Hecho (09/11/2026)**: «La Ola Import» (`SITE.nombre`).
- [x] **Lema**: `[LEMA]` (`SITE.lema`, `lib/portada.ts`). → **Hecho**: «Donnez des couleurs à vos idées !».
- [x] **Colores**: los tokens de `app/globals.css` son grises neutros (`[COLOR]`) con los nombres heredados
      (`space-*`, `nova-*`, `star-*`, `moon-*`, `ink-*`, `mist-*`); también grises en `lib/correo/plantillas.ts` (paleta
      del email), `lib/estudio/descarga.ts`, `app/layout.tsx` (`themeColor`), `components/inicio/Constelacion.tsx`,
      `components/inicio/OjoDeBuey.tsx` y `lib/cielo.ts`. Decidir si se renombran los tokens. Los verdes `eco-*` del
      distintivo ECO son neutros de marca y se pueden quedar. → **Hecho**: paleta relevada con cuentagotas en el logo, tokens renombrados (`fond`, `perle`, `marine`, `ardoise`, `cyan-*`, `bleu-600`, `violet-600`, `fuchsia-*`, `soleil-400`), contrastes AA comprobados (`docs/PROPOSITION.md` §4.1).
- [x] **Tipografías**: Sora (titulares) e Inter (texto) en `app/layout.tsx` y `app/globals.css` eran las de la base. → **Hecho**: Nunito (títulos) + Inter (texto). Inter ya estaba en la base: a validar (alternativa Poppins).
- [x] **Estilo visual heredado**: fondo espacial animado (`components/space/StarField.tsx`, `lib/cielo.ts`,
      `lib/cielo-config.ts`), transiciones «tipo nave» y «travesía» del catálogo (`app/globals.css`), ojo de buey y
      constelaciones de la home (`components/inicio/OjoDeBuey.tsx`, `Constelacion.tsx`), nombres de componentes con
      metáfora espacial. Rehacer o quitar según `brand/`. → **Hecho**: fondo espacial, ojo de buey, constelaciones y transiciones «nave» eliminados; tema claro con separadores en ola (`components/ui/Vague.tsx`).
- [x] **Mascota**: el OVNI que revela cada cambio de color (`lib/ovni.ts`, `components/producto/Ovni.tsx`,
      `data/ovni-sprites.json`) y los sobrevuelos del cielo. Sus sprites no se han copiado: hoy la animación no tiene
      imagen. Sustituir por la animación de La Ola Import o quitarla (dejando el fundido de 150 ms). → **Hecho**: Surfi (`lib/surfi.ts`, `components/producto/Surfi.tsx`, `public/marca/surfi/`), en las fichas textiles y el estudio.
- [x] **Logo para emails**: `lib/correo/logo-email.ts` lleva un PNG transparente de 1 px (`[LOGO]`). → **Hecho (provisional)**: PNG transparente 320 × 180 del logo provisional; regenerar con el vectorial definitivo.

### Archivos de marca que el código pide y no existen (no se copiaron)

- [x] `public/marca/logo-marca.png`, `public/marca/estrella-marca.png` (cabecera, pie, descarga del estudio, emails). → **Hecho**: sustituidos por `public/marca/logo-la-ola-import-{480,960}.webp` y `.png` (logo provisional); la estrella desaparece.
- [x] `public/marca/logo-marca-catalogo.webp`, `public/marca/estrella-marca-catalogo.webp` (diseño de ejemplo de
      Atomic 150 y Austral en catálogo, ficha y estudio; ids `marca-logo` y `marca-estrella` en
      `data/fotos-catalogo.json` y `lib/diseno-ejemplo.ts`). Decidir qué diseño de ejemplo llevan. → **Hecho**: Atomic 150 y Austral usan ahora el motivo «Votre logo ici».
- [x] `public/marca/ovni/ovni-reveal.webp`, `ovni-cruce.webp` (mascota). → **Hecho**: sustituido por el sprite de Surfi.
- [x] `public/portada/portada.webp`, `portada-520.webp`, `portada-780.webp`, `portada.mp4`, `portada.webm` (hero de la
      home; `lib/portada.ts`, `components/inicio/Portada.tsx`). → **Hecho**: la portada desaparece (home sin hero de imagen).
- [ ] ~~`public/og/marca.png`~~ (hecho) y `public/og/productos/<slug>.png` (Open Graph general y de las 30 fichas). El generador de
      la base (`scripts/marca/generar-og.py`) no se copió porque dibujaba su marca: rehacerlo o usar `next/og`.
- [x] `app/favicon.ico`, `app/icon.png`, `app/apple-icon.png`. → **Hecho**: a partir de la ola del logo (sin texto).
- [x] `/catalogo-marca.pdf` (`SITE.catalogoPdf` en `lib/site.ts`): el catálogo PDF propio, o quitar el enlace. → **Hecho**: enlace retirado.
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
- [x] Mensajes de WhatsApp (`lib/whatsapp.ts`): textos de la base. → **Hecho**: mensajes en francés.

## 3. Textos y reglas de negocio de la base que siguen en la web

- [x] `TEXTOS` en `lib/site.ts`: nota de precios («desde… a partir de 150 unidades»), pedido mínimo («desde 25
      unidades»), plazos («Presupuesto en 24 h laborables», «unas 2 semanas»), «Precios por unidad, sin IVA.» y los tres
      datos del catálogo («Con sede en Valencia», «Presupuesto en 24 h», «Entregas en toda España»). Son promesas de la
      base: confirmar o cambiar con La Ola Import. → **Hecho**: sin promesas; los textos llevan [à confirmer] hasta que La Ola Import fije sus reglas.
- [x] **Valencia**: la base atendía en la ciudad de Valencia y llevaba el muestrario al local del cliente. Aparece en
      `app/aviso-legal/page.tsx`, `app/catalogo/page.tsx`, `components/ficha/Ficha.tsx`,
      `components/inicio/ComoTrabajamos.tsx`, `Portada.tsx`, `Visita.tsx`, `components/layout/Footer.tsx`,
      `components/proyecto/Proyecto.tsx`, `lib/solicitud/comun.ts` y `lib/site.ts`. → **Hecho**: ninguna mención a Valencia.
- [x] Todos los textos de la home (`components/inicio/*`: portada, qué hacemos, para quién, catálogo, pruébalo con tu
      logo, cómo trabajamos, visita, opiniones, aterrizaje), del catálogo, la ficha, el estudio, /proyecto, /gracias,
      /opiniones, /tu-opinion y los emails (`lib/correo/plantillas.ts`) están escritos con el tono y las promesas de la
      base. → **Hecho**: textos nuevos en francés (home, catálogo, ficha, estudio, /projet, /merci, avis, emails).
- [ ] Legales (`app/aviso-legal`, `app/privacidad`, `app/cookies`, `components/legal/`, `docs/LEGAL.md`): textos de la
      base con el titular en placeholder. Encargados del tratamiento (Netlify, Google, Resend), plazos de conservación y
      revisión legal: todo por rehacer para La Ola Import.
- [ ] Destacados de la home, filtro «Calidad superior», distintivo ECO, Luxor y Davos en «Consultar disponibilidad»:
      decisiones de catálogo de la base.
- [x] `scripts/revisar-web.mjs`: lista `PROHIBIDAS` con las reglas de la base (demo, muestra gratuita, videollamada…). → **Hecho**: lista adaptada a La Ola Import (corchetes visibles, restos de la base, promesas).

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

- [x] Repositorio en GitHub propio (esta carpeta aún no tiene git). `[CUENTA-GITHUB]` en `docs/LANZAMIENTO.md`. → **Hecho**: `alexschwetzoff-prog/SITE-LA-OLA-IMPORT`, rama `import-base`.
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

## 7. Nuevo (La Ola Import, 09/11/2026): pendiente de La Ola Import

- [ ] **Logo definitivo**: el logo original dice «La Ola Impression»; el provisional «La Ola Import» es un retoque
  raster (`brand/logo/`, `scripts/marque/corriger-nom-logo.py`). Pedir el vectorial (AI/SVG/PDF) al grafista y
  regenerar logo de cabecera, emails, favicon, icon, apple-icon y Open Graph.
- [ ] **Surfi**: pedir capas separadas (Surfi sin ola + ola sola, PNG transparentes o los archivos 3D) y, si se quiere,
  una vista tres cuartos izquierda. Hoy cada vista lleva su propia ola y la estela es un SVG.
- [ ] **`public/marca/tu-logo-aqui.png`** y las fotos de 5 goodies llevan «tu logo AQUÍ» en español: rehacer en francés
  («Votre logo ici»).
- [ ] **Fotos y vídeos reales** (marcadores `[photo à fournir]` / `[vidéo à fournir]`): equipo (800 × 1000), taller
  (1600 × 1000), showroom, galería (6 × 1200 × 1200), B-roll DTF y UV (1920 × 1080 y 1080 × 1350, 8–12 s, < 2 Mo).
- [ ] **Textos [à fournir]**: historia del taller, frase de cada persona del equipo (con permiso de imagen).
- [ ] **Reglas comerciales [à confirmer]**: plazos, pedido mínimo, HT/TTC, zona y modo de entrega, recogida, pago,
  técnicas (¿bordado?), validez de presupuestos (TEXTOS en `lib/site.ts`, CGV, livraison-et-paiement).
- [ ] **Nombres de color** traducidos al francés (319, `data/catalogo.ts`): validar con La Ola Import.
- [ ] **Open Graph por producto** (`public/og/productos/<slug>.png`): hoy las fichas usan `/og/marca.png`.
- [ ] **Sin JavaScript**, las pastillas de color no cambian la foto (la ficha es estática; enlaces `?couleur=` harían la
  página dinámica). Decidir si se acepta.
- [ ] **Scripts heredados**: `scripts/probar-solicitud.mjs`, `scripts/capturas*.mjs` y `scripts/fotos/*` usan aún
  textos, colores y claves en español (`marca-logo`, `marca-estrella`).
- [ ] **Datos de `SITE.titular`** (razón social, SIRET, dirección, director de la publicación), teléfono, email,
  horario, redes sociales, alojamiento (Netlify o Vercel), dominio: ver `docs/PROPOSITION.md` §8 y `docs/LEGAL.md`.
- [ ] **Revisión jurídica** de mentions légales, confidentialité, cookies y CGV (textos provisionales con aviso).

## 8. Datos de la empresa recibidos (11/11/2026)

- [x] Razón social **La Ola Impression** (nombre comercial La Ola Import), teléfono **06 69 64 28 05**, email
  **laolaimport@outlook.fr**, dirección **350 Chemin du Perussier, 84170 Monteux** (el cliente escribió 84270, que es
  Vedène; se confirmó 84170). En `lib/site.ts`, pie, sección y página `/contact`, cabecera (escritorio ≥ 1280 px),
  mentions légales y JSON-LD LocalBusiness (`app/layout.tsx`). Los formularios envían a esta dirección por defecto
  (`CORREO_DESTINO` vacío).
- [ ] Siguen pendientes: SIRET, forma jurídica, RCS, director de la publicación, horario, WhatsApp (¿mismo número?),
  redes sociales y dominio (el JSON-LD usa aún `dominio-pendiente.example` en `url`).
