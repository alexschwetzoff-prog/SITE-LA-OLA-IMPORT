# Lanzamiento en Netlify · dominio-pendiente.example

Guía para el equipo (sin conocimientos técnicos) escrita el 18/10/2026 para el lanzamiento del 19/10/2026. La web se
aloja en **Netlify, plan Free** (300 créditos al mes, sin tarjeta); los emails del formulario salen por Gmail y, cuando
se quiera, por Resend desde hola@dominio-pendiente.example. Todo lo que hay que hacer en las interfaces de Netlify, del
registrador del dominio y de Resend está aquí paso a paso.

Hacen falta: una cuenta de Netlify (gratis, en netlify.com, entrando con la cuenta de GitHub `[CUENTA-GITHUB]`),
acceso al panel del registrador donde se compró dominio-pendiente.example (la factura está en Drive) y la contraseña de
aplicación de Gmail de email-pendiente@example.com (la misma que está en `.env.local`).

## 1. Conectar el repositorio y publicar el despliegue de prueba

1. Entra en https://app.netlify.com con la cuenta de GitHub `[CUENTA-GITHUB]` (botón **Log in with GitHub**).
2. Arriba a la derecha, **Add new project → Import an existing project**.
3. Elige **GitHub**. La primera vez, GitHub pide autorizar a Netlify: en **Install Netlify**, elige la cuenta
   `[CUENTA-GITHUB]` y, en *Repository access*, **Only select repositories → web-laolaimport**. Pulsa **Install**.
4. En la lista, pulsa el repositorio **web-laolaimport**.
5. Pantalla *Review configuration*. Netlify detecta Next.js solo y lee `netlify.toml` del repositorio, así que no hay
   que cambiar nada: *Branch to deploy* `main`, *Build command* `npm run build`, *Publish directory* `.next`.
   - En **Site name** escribe `dominio-pendiente` (la web de prueba quedará en https://sitio-pendiente.netlify.app).
     Si el nombre no está libre, pon otro y dínoslo: hay una regla de redirección en `netlify.toml` que usa ese nombre.
   - En **Environment variables** pulsa **Add environment variables** y añade las de la sección 3 (se pueden añadir
     después, pero entonces hace falta volver a desplegar).
6. Pulsa **Deploy dominio-pendiente**. El primer build tarda unos 3-5 minutos. Cuando ponga **Published**, la web de prueba
   está en https://sitio-pendiente.netlify.app.
7. Comprueba que la caché larga de las fotos está activa (es lo que ahorra créditos). En un terminal, o pidiéndoselo a
   quien lleve la web: `curl -I https://sitio-pendiente.netlify.app/productos/catalogo/atomic-150-blanco-delante-800.webp`
   tiene que devolver `cache-control: public, max-age=2592000, stale-while-revalidate=86400`. Si saliera `max-age=0`,
   avisa: las reglas `[[headers]]` de `netlify.toml` no se estarían aplicando.
8. Comprueba en esa dirección: la home con el vídeo, el catálogo, una ficha (por ejemplo
   https://sitio-pendiente.netlify.app/catalogo/atomic-150), el estudio (https://sitio-pendiente.netlify.app/disena/atomic-150)
   y un envío de prueba desde https://sitio-pendiente.netlify.app/proyecto con un logo adjunto: tiene que llegar a
   email-pendiente@example.com y la confirmación al email que pongas (mira en spam).

Mientras el dominio no esté conectado, esta web de prueba lleva `noindex` (Google no la indexa): es lo previsto.

**Cada despliegue de producción gasta 15 créditos** (de los 300 del mes). Cada vez que se fusiona algo en `main`, Netlify
publica una versión nueva: conviene agrupar cambios y no publicar varias veces al día. Las vistas previas de las PR y los
builds que fallan no gastan créditos.

## 2. Conectar dominio-pendiente.example y www (el día del lanzamiento)

Dominio principal: **dominio-pendiente.example** (sin www). El www redirige al dominio sin www de forma permanente.

### 2.1 En Netlify

1. En el proyecto, menú **Domain management** (o *Site configuration → Domain management*) → **Add a domain**.
2. Escribe `dominio-pendiente.example` y pulsa **Verify** → **Add domain**. Netlify añade dos entradas: `dominio-pendiente.example` y
   `www.dominio-pendiente.example`.
3. En **Production domains**, pulsa **Options** junto a `dominio-pendiente.example` y elige **Set as primary domain** si no lo es ya.
   (Así `www` redirige al dominio sin www. Si fuera al revés, la regla de `netlify.toml` crearía un bucle: hay que dejar
   el apex como principal.)
4. Netlify muestra **Awaiting External DNS** junto a cada dominio: hay que crear los registros del punto 2.2.

### 2.2 En el registrador del dominio (donde se compró dominio-pendiente.example)

Busca la zona DNS (*DNS*, *Gestión de DNS*, *Zona DNS*, *Registros*) y deja estos dos registros, borrando antes los que
apunten a la web antigua (Lovable):

| Tipo | Host / nombre | Valor | TTL |
| --- | --- | --- | --- |
| **A** | `@` (o vacío; es el dominio sin www) | `75.2.60.5` | el mínimo que permita (300-3600) |
| **CNAME** | `www` | `sitio-pendiente.netlify.app` (el nombre del sitio en Netlify, con `.netlify.app`) | el mínimo |

- Si el registrador ofrece registros **ALIAS** o **ANAME** para el dominio sin www, Netlify prefiere eso: ALIAS `@` →
  `apex-loadbalancer.netlify.com`. Si no, el registro A de arriba vale igual.
- Si hay un registro **AAAA** para `@` o `www` apuntando a la web antigua, hay que borrarlo.
- Los registros **MX** (si hubiera correo del dominio) no se tocan.

Alternativa, solo si el registrador no permite editar la zona: pasar el DNS entero a Netlify (**Domain management →
Add or register domain → Set up Netlify DNS**; da 4 servidores de nombres `dnsX.p0X.nsone.net` que se ponen en el
registrador). Es más trabajo y hay que volver a crear ahí los registros de Resend; no hace falta para lanzar.

### 2.3 Esperar y comprobar

1. El cambio de DNS tarda entre unos minutos y unas horas (como mucho un día). En Netlify, **Domain management** pasa
   de *Awaiting External DNS* a *Netlify DNS* / verde, y el certificado HTTPS se crea solo (**HTTPS → Let's Encrypt**;
   si tarda, botón **Verify DNS configuration** y luego **Provision certificate**).
2. Cuando https://dominio-pendiente.example abra la web nueva: **Deploys → Trigger deploy → Deploy site**. Este despliegue es
   necesario: la web se construye sabiendo cuál es su dominio y solo entonces quita el `noindex` y publica el sitemap.
3. Comprueba https://www.dominio-pendiente.example (redirige al dominio sin www), https://dominio-pendiente.example/sitemap.xml y
   https://dominio-pendiente.example/robots.txt (tiene que decir `Allow: /`, no `Disallow: /`).
4. Opcional, cuando el dominio ya funcione: en `netlify.toml` quitar las almohadillas del bloque «sitio-pendiente.netlify.app»
   para que el subdominio de Netlify redirija también al dominio propio (lo hace cualquiera del equipo con el editor de
   GitHub; se publica solo).
5. Una semana después, despublicar el proyecto de Lovable.

## 3. Variables de entorno en Netlify

**Site configuration → Environment variables → Add a variable → Add a single variable** (o *Import from a .env file* y
pegar las líneas). Marcar **All scopes** y **Same value for all deploy contexts**. Tras cualquier cambio: **Deploys →
Trigger deploy**.

| Variable | Valor | Para qué |
| --- | --- | --- |
| `CORREO_TRANSPORTE` | `gmail` (hoy) · `resend` (cuando Resend esté verificado) | Por dónde salen los emails del formulario |
| `GMAIL_USUARIO` | `email-pendiente@example.com` | Cuenta de Gmail que envía (y recibe) |
| `GMAIL_CONTRASENA_APP` | la contraseña de aplicación de Google (16 letras) | Imprescindible para enviar por Gmail y como respaldo de Resend |
| `CORREO_DESTINO` | `email-pendiente@example.com` | Buzón al que llegan las solicitudes |
| `RESEND_API_KEY` | la clave `re_…` de Resend | Solo cuando se active Resend |
| `RESEND_REMITENTE` | (opcional) `[MARCA] <hola@dominio-pendiente.example>` | Ya es el valor por defecto; solo si se quiere otro |
| `NEXT_PUBLIC_WHATSAPP_NUMBER` | (opcional) `34000000000` | Ya es el valor por defecto |
| `OPINIONES_CSV_URL` | la dirección del CSV publicado de la pestaña «Web» de la hoja de respuestas del formulario de opinión (ya está puesta) | Opiniones de la home y de /opiniones, leídas cada hora; sin ella no se enseña ninguna |

No hacen falta `NETLIFY`, `CONTEXT` ni `URL`: las pone Netlify sola y la web las usa para saber si está en producción.

## 4. Resend (emails desde hola@dominio-pendiente.example), cuando se quiera

Hoy los emails salen de la cuenta de Gmail y la confirmación al cliente puede caer en spam (le pasó en la prueba de la
fase 6). Con Resend salen desde el dominio propio con firma (DKIM/SPF) y llegan mejor. Plan Free de Resend: 3.000 emails
al mes y 100 al día, hasta 3 dominios: de sobra. Pasos:

1. Cuenta en https://resend.com (con el email del equipo). **Domains → Add domain** → `dominio-pendiente.example`, región
   **Europe (eu-west-1)**.
2. Resend enseña los registros DNS que hay que crear en el registrador (los mismos que en el punto 2.2, en la zona DNS
   del dominio). Son estos tres (copiar los valores exactos de la pantalla de Resend, no de aquí):
   - **TXT** con host `resend._domainkey` (la firma DKIM; el valor es una clave larga `p=…`).
   - **MX** con host `send` (valor tipo `feedback-smtp.eu-west-1.amazonses.com`, prioridad 10).
   - **TXT** con host `send` (valor `v=spf1 include:amazonses.com ~all`).
   - Recomendado además: **TXT** con host `_dmarc` y valor `v=DMARC1; p=none;`.
   Importante: en «host» va solo `send` o `resend._domainkey`, sin añadir `.dominio-pendiente.example` (muchos registradores lo
   añaden solos).
3. En Resend, **Verify**: suele tardar menos de 15 minutos; puede tardar hasta un día.
4. **API Keys → Create API key** (nombre `web-laolaimport`, permiso *Sending access*, dominio `dominio-pendiente.example`). Copiar la
   clave `re_…` (solo se ve una vez).
5. En Netlify (punto 3): `RESEND_API_KEY` = la clave y `CORREO_TRANSPORTE` = `resend`. **Trigger deploy**.
6. Hacer un envío de prueba desde el formulario: el email al equipo llega a email-pendiente@example.com desde
   «[MARCA] <hola@dominio-pendiente.example>» con reply-to al cliente, y la confirmación al cliente desde la misma dirección
   con reply-to a email-pendiente@example.com. Si Resend fallara, el email sale por Gmail automáticamente (queda anotado en
   **Logs → Functions** de Netlify). La política de privacidad añade a Resend como encargado en ese mismo despliegue.

hola@dominio-pendiente.example es solo de envío: nadie lee ese buzón; las respuestas van siempre a email-pendiente@example.com.

## 5. Qué gasta créditos y cuántas visitas caben

Netlify Free da **300 créditos al mes** (se reponen cada mes; no se acumulan y no se pueden comprar más: si se agotan,
la web se queda en pausa con un aviso «Site not available» hasta el mes siguiente). Precios de Netlify (octubre de 2026):

| Concepto | Créditos |
| --- | --- |
| Cada despliegue de producción (cada fusión en `main`) | 15 |
| Ancho de banda (todo lo que descarga el navegador: fotos, vídeo, JS, HTML, PDF) | 20 por GB |
| Peticiones web (cada archivo pedido, también los que la CDN sirve de caché) | 2 por cada 10.000 |
| Cómputo de funciones (la del formulario y las 404) | 10 por GB-hora |
| Vistas previas de PR, builds fallidos, formularios de Netlify | 0 |

Medido sobre la build final con Lighthouse móvil (primera visita, sin nada en caché):

| Página | Peticiones | Descarga |
| --- | --- | --- |
| Home (con el vídeo de portada, 0,8 MB en WebM; 1,5 MB en MP4 en Safari) | 27 | 1,25 MB |
| Catálogo | 31 | 0,6 MB |
| Ficha de producto | 47 | 0,9 MB |
| /proyecto | 29 | 0,45 MB |

Una visita típica (home, catálogo y una ficha; las fuentes y el JS se descargan una vez) son unos 2,2 MB y 80
peticiones: **0,06 créditos** (0,043 de ancho de banda y 0,016 de peticiones). Una visita que solo ve la home, 0,03.
Cada envío del formulario (la función tarda 3-4 s): 0,01 créditos. Con 4 despliegues al mes (60 créditos) quedan 240
para visitas: **unas 4.000 visitas de 3 páginas al mes** (unas 8.000 si solo ven la home). Con 10 despliegues al mes
quedan 150 créditos: unas 2.500 visitas. Cada despliegue de más cuesta lo mismo que 250 visitas.

Cómo no gastar de más:

- Agrupar cambios: cada fusión en `main` son 15 créditos (20 fusiones = todo el mes).
- Las fotos, el vídeo y la marca van con caché de 30 días en el navegador (`netlify.toml`): una visita repetida casi no
  descarga nada.
- Si un mes se acerca al límite, se puede desactivar el vídeo de portada (es lo que más pesa por visita) poniendo
  `VIDEO_PORTADA` a `null` en `lib/portada.ts`, o pasar a Netlify Personal (9 $/mes, 1.000 créditos).

## 6. Checklist del día del lanzamiento

1. DNS cambiado (punto 2.2) y https://dominio-pendiente.example abre la web nueva con candado.
2. **Trigger deploy** hecho después de conectar el dominio; https://dominio-pendiente.example/robots.txt dice `Allow: /`.
3. https://www.dominio-pendiente.example redirige a https://dominio-pendiente.example.
4. Envío real desde /proyecto con un logo: llega al buzón y el cliente recibe la confirmación (mirar spam).
5. Número de registro de la asociación puesto en `lib/site.ts` (`SITE.titular.registro`), si ya se tiene.
6. Google Search Console: añadir la propiedad `dominio-pendiente.example` (verificación por registro TXT en el DNS) y enviar
   https://dominio-pendiente.example/sitemap.xml.
7. Instagram y Google: comprobar que la dirección, el teléfono ([TELÉFONO]) y el enlace son los mismos que en la web.
