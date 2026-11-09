# Especificación técnica de la base (heredada)

> Extracto de la spec de la empresa de la que sale esta base. Solo se conservan las secciones que explican cómo
> funcionan la web, el catálogo, el estudio, las reseñas y la arquitectura (3, 4, 5, 6, 8 y 9). Se han quitado
> objetivos, auditoría, sistema visual, SEO, plan de fases, decisiones pendientes y fuentes, y todos los precios.
> Los textos, la marca y las reglas de negocio que aparezcan aquí son de la base y **no** son de [MARCA]:
> lo que mande es `CLAUDE.md` y la carpeta `brand/`.

## 3. Mapa del sitio y navegación

La v1 tiene cinco páginas principales y un camino de conversión: ficha de producto → estudio de diseño → formulario con el diseño adjunto. La home cuenta la historia completa; el resto son destinos.

&#91;embedded content: mapa del sitio v1 · 5 páginas principales y el camino de conversión\]

La ficha carga rápido (fotos y colores); el 3D solo se carga en el estudio, cuando el cliente lo pide. `/gracias` confirma el envío y sirve para medir conversiones. `/tu-opinion` es privada (noindex): es el enlace que se manda al cliente tras la entrega.

**Menú (escritorio):** Catálogo · Diseña tu prenda · Cómo trabajamos (ancla en la home) · Opiniones · botón destacado *Cuéntanos tu proyecto* · icono de WhatsApp.

**Móvil:** menú desplegable, botón flotante de WhatsApp y, en ficha y estudio, barra inferior fija con la acción principal (*Pruébalo con tu logo* / *Enviar mi diseño*).

**Slugs de producto (30):** atomic-150, austral, bull, cobain, jamaica, pointer, bahrain, imola, andre, shura, clasica, urban, montblanc, otto, estambul-woman, valier, freya, mercury, fred, crest, zenith, tarek, kranston, ranic, davos, uldon, karby, roldi, zora, luxor.

## 4. Página a página

Cada página tiene una acción principal y nunca más de dos secundarias. Los titulares dicen literalmente lo que hacemos; la metáfora espacial decora, no sustituye.

### Inicio `/` — el viaje en 9 escalas

1. **Despegue (hero).** A la izquierda, titular y botones; a la derecha, el vídeo de portada (ver abajo) dentro de una ventana redondeada, como el ojo de buey de una nave, sobre la nebulosa azul. En móvil, el vídeo va debajo del titular. H1: *Tu logo en camisetas, sudaderas y merchandising para tu negocio.* Subtítulo: *Personalizamos textil con impresión digital y merchandising para negocios que quieren que sus clientes lleven su marca puesta. Con sede en Valencia.* Botones: **Pruébalo con tu logo** (principal) · Ver catálogo. Debajo, los tres datos del catálogo: Con sede en Valencia · Presupuesto en 24 h · Entregas en toda España.
2. **Qué hacemos.** Tres tarjetas: *Textil personalizado* (camisetas, polos, sudaderas y gorras con impresión digital DTF a todo color, en corazón, A4 delante, A4 o A3 detrás) · *Merchandising* (bolsas, botellas, tazas, libretas, llaveros y más) · *Te acompañamos* (te ayudamos a elegir prenda, posición y tamaño, y ves las calidades antes de pedir).
3. **Para quién.** *Para negocios con clientes que vuelven.* Etiquetas de sector: academias, gimnasios y boxes, pádel, escape rooms, escuelas de danza, hostelería. Dos usos ilustrados: *Véndelo en tu local* · *Inclúyelo en tus packs de matrícula, alta o bienvenida*; y una línea para vestir al equipo.
4. **Catálogo.** Los tres destacados (Atomic 150, Austral, Clásica) y acceso a las cinco categorías con su número de productos. Nota de precios "desde" visible. Botón: Ver catálogo completo.
5. **Pruébalo con tu logo.** Zona para soltar el logo: aparece al instante en el corazón de una Atomic 150 en 2D. Botón: *Verlo en 3D y cambiar colores* → estudio, con el logo ya cargado (se pasa en el navegador, no se sube hasta enviar).
6. **Cómo trabajamos.** Cinco pasos unidos como una constelación: (1) nos cuentas tu idea o nos mandas tu diseño, por la web, WhatsApp o en persona · (2) te asesoramos y te enviamos presupuesto en 24 h laborables · (3) te llevamos el muestrario a tu local, en la ciudad de Valencia: tocas las calidades, te pruebas las tallas y ves los colores · (4) personalizamos tu pedido: lo tienes en unas 2 semanas desde que lo confirmas · (5) entregamos en toda España y te pedimos tu opinión. Ancla `#como-trabajamos`.
7. **Toca las calidades en persona.** *Las fotos ayudan; tocar la tela decide.* Vamos a tu local en la ciudad de Valencia con el muestrario: tocas las calidades, te pruebas las tallas y ves los colores. Solo en la ciudad de Valencia: no se ofrece videollamada ni otra alternativa (decisión del equipo, 12/10/2026). Botón: Pide que te visitemos.
8. **Opiniones.** De 3 a 6 reseñas reales y enlace a `/opiniones`. Con menos de 3 publicadas, la sección no se muestra.
9. **Cuéntanos tu proyecto (aterrizaje).** Formulario corto: nombre, negocio, email o teléfono, qué necesitas y cantidad aproximada. Al lado: *¿Prefieres hablar? Escríbenos por WhatsApp.*

### Vídeo de portada (motion graphics, 20-40 s)

Un vídeo de unos 30 s, en bucle y sin sonido, que enseña de un vistazo qué hacemos, con el textil como protagonista. Se hace con Remotion (vídeo programado en React) en un proyecto aparte y se exporta a archivo; la web solo lo reproduce (decisión del equipo, 11/10/2026).

1. **0-3 s:** la estrella [MARCA] se enciende en el espacio y se abre la órbita.
2. **3-9 s:** una Atomic 150 blanca flota y gira; cambia de color cuatro veces.
3. **9-15 s:** un logo de ejemplo ("TU LOGO") llega como un cometa y se estampa en el corazón; la prenda gira y aparece otro en A4 en la espalda.
4. **15-21 s:** el proceso en motion graphics: film DTF, prensa térmica que baja, prenda terminada.
5. **21-26 s:** constelación del catálogo: sudadera, polo, tote y bidón se encienden uno a uno.
6. **26-30 s:** cierre: «Diseña tu prenda hoy. Lo tienes en unas 2 semanas.», logo y dominio-pendiente.example.

Reglas: solo logos de ejemplo, nunca de clientes sin permiso; solo promesas que ya están en la web; sin música en la web. Formatos 16:9 (escritorio) y 9:16 (móvil e Instagram), en MP4 y WebM, por debajo de 4 MB cada uno, con imagen fija mientras carga; con `prefers-reduced-motion` se muestra solo la imagen fija. Licencia: Remotion es gratis para organizaciones con ánimo de lucro de hasta 3 personas y pide licencia de empresa a partir de 4 ([Remotion](https://www.remotion.dev/docs/license/faq)); comprobar cómo aplica a una asociación y cuántas personas trabajan en el vídeo.

**Pie (la base):** logo, *[LEMA]*, contacto, horario (lunes a viernes, 9:00-18:00), Instagram, descarga del catálogo PDF, enlaces legales y titular: [TITULAR] (NIF [NIF]).

### Catálogo `/catalogo`

- Cabecera *Catálogo 2026-2027* y una línea: *Todo lo que personalizamos, con tu logo.*
- Filtros: categoría (Camisetas y polos · Sudaderas · Gorras · Bolsas · Goodies) y etiquetas (Destacado, Eco, Mujer, Técnica, Oversize, Manga larga).
- Tarjeta de producto: foto con la personalización de ejemplo del catálogo (logo [MARCA] en el corazón; al pasar el dedo o el ratón, la espalda con la estrella en A4), nombre, tipo, precio *Desde X € / ud* o *Consultar precio*, material y gramaje, muestras de color (máximo 8 y "+N").
- Nota fija, la misma del catálogo PDF: *Precios por unidad «desde», sin IVA, con un diseño incluido, para pedidos a partir de 150 unidades. El precio se ajusta según cantidad y diseño.* Debajo, otra línea: «Pedidos desde 25 unidades. ¿Necesitas menos? Consúltanos.»
- Bloque final: *¿No lo ves aquí? Trabajamos con muchos más productos; cuéntanos qué tienes en mente.* → formulario y WhatsApp.
- Descarga del catálogo PDF.

### Ficha de producto `/catalogo/[slug]`

- Galería delantera y trasera con la personalización de ejemplo; el selector de color cambia la imagen.
- Datos: nombre, tipo, precio desde, composición y gramaje, tallas XS a 2XL, colores con nombre, etiquetas.
- Posiciones de impresión disponibles con su medida: corazón, frontal A4, espalda A4, espalda A3 (gorras: frontal; bolsas: cara A y B). Goodies: sin estudio; su ficha es como la del catálogo (fotos, datos, colores y «Consultar precio») y su acción principal es Añadir al presupuesto.
- Acción principal: **Pruébalo con tu logo** → estudio. Secundarias: Añadir al presupuesto (una cesta donde se juntan varios productos con su color, diseño y cantidad, y se envían a la vez desde /proyecto) · Verla en persona. \[Por confirmar: qué os gustó exactamente del presupuesto de swag.com.\]
- *Combina con*: tres productos relacionados.
- SEO: título tipo *Camiseta Atomic 150 personalizada con tu logo · [MARCA]*.

### Estudio `/disena/[slug]`

Visor a pantalla completa y panel en cinco pasos: producto, color, tu logo, posición y tamaño, enviar. Detalle técnico en la sección 5.

### Opiniones `/opiniones`

Todas las reseñas publicadas: valoración de 1 a 5, texto, negocio, sector, ciudad, producto y fecha; foto del pedido y logo del negocio si dan permiso. Filtro por sector. Línea de transparencia: *Opiniones de clientes que han hecho un pedido con nosotros. No editamos su contenido.* La nota media se muestra a partir de 5 reseñas.

### Tu proyecto `/proyecto`

Se mantiene el espíritu de *Cuéntanos tu proyecto* y se amplía en tres pasos cortos.

1. **Tu negocio:** nombre\*, negocio\*, sector (lista del ICP + otro), ciudad, email\*, teléfono o WhatsApp, cómo prefieres que te contactemos.
2. **Qué necesitas:** productos (selección del catálogo + otro), cantidad aproximada por tramos (menos de 25 · 25-50 · 50-150 · más de 150, los tramos de la tarifa interna), para qué es (venta en el local, packs para clientes, equipo, evento), fecha límite, archivos (PNG, SVG, PDF, AI; hasta 20 MB) y, si viene del estudio o de la cesta de presupuesto, los diseños adjuntos con sus capturas. Comentarios\*.
3. **¿Quieres verlas en persona?** No por ahora · que vengáis a mi local (ciudad de Valencia); franja preferida. (Sin videollamada: decisión del equipo, 12/10/2026.)

Casilla de privacidad con la información básica y enlace a la política. Al enviar: `/gracias`, email al equipo con todo adjunto y email de confirmación al cliente. Texto bajo el botón: *Te respondemos con presupuesto en 24 h laborables.*

### Gracias `/gracias`

Confirmación, qué pasa ahora (los cinco pasos en corto), WhatsApp, Instagram y descarga del catálogo PDF.

### Tu opinión `/tu-opinion` y legales

Formulario de feedback en la sección 8; aviso legal, privacidad y cookies en la sección 10.

## 5. Catálogo interactivo y estudio de diseño 3D

Recomendación: estudio propio con React Three Fiber, en 3D para 5 prendas en la v1 (Atomic 150, Austral, Cobain, Clásica y Urban, con 4 mallas) y en 2D para el resto, con la misma interfaz. Antes de escalar, un spike con la Atomic 150 decide si el 3D es lo bastante creíble en un móvil normal. El código no es el cuello de botella: lo son las mallas 3D, las fotos y los colores.

### Qué hace el cliente

1. Elige producto (o llega desde la ficha).
2. Elige color de la paleta real, con su nombre.
3. Sube su logo: PNG, JPG o SVG para la vista previa; PDF, AI o EPS se aceptan para producción pero piden un PNG para previsualizar. Botón *Quitar fondo blanco*.
4. Elige posiciones: delante (corazón o frontal A4) y detrás (espalda A4 o A3). Máximo una delante y una detrás.
5. Ajusta tamaño y lo arrastra dentro de la zona permitida, que se ve punteada.
6. Gira la prenda 360°, alterna delante y detrás, y cambia de color con el logo puesto.
7. **Enviar mi diseño:** se generan capturas delantera y trasera y la configuración, y se abre `/proyecto` relleno. El logo original solo se sube al enviar.

Extras de la v1: *Probar en otra prenda* conserva logo y posiciones; *Descargar mi mockup* da un PNG con marca de agua [MARCA] para enseñarlo a socios o equipo. Antes de subir nada, el producto ya lleva la personalización de ejemplo del catálogo (logo [MARCA] en el corazón y estrella en A4 detrás), para que nunca se vea vacío.

### Experiencia: Nike By You + Custom Ink

El estudio une dos referencias: de Nike By You, la experiencia (producto enorme, color al instante, todo en una pantalla); de Custom Ink, la función (subir el logo, colocarlo delante o detrás y ajustar el tamaño). Con la estética espacial y más limpio que ambos (decisión del equipo, 11/10/2026).

- **Pantalla:** la prenda ocupa dos tercios a la izquierda (en móvil, la mitad superior) y gira 360° al arrastrar; a la derecha, un panel con los pasos plegables: Color · Tu logo · Posición · Tamaño · Enviar.
- **Color:** muestras grandes con su nombre; el cambio es instantáneo y la prenda gira un poco para lucirlo.
- **Logo:** arrastrar y soltar o elegir archivo; aparece primero en el corazón y la prenda se pone de frente sola.
- **Posición:** botones con miniatura (Corazón, Frontal A4, Espalda A4, Espalda A3); al elegir una de la espalda, la prenda gira sola para enseñarla. Ajuste fino arrastrando dentro de la zona punteada.
- **Tamaño:** deslizador con la medida real a la vista ("9 cm de ancho").
- **Resumen:** antes de enviar, capturas delante y detrás, color, posiciones y medidas, y el botón *Añadir al presupuesto*.
- **v1.1:** añadir texto (nombre del negocio, eslogan) con tipografías básicas, como en Custom Ink.

### Posiciones de impresión

| Posición | Lado | Tamaño máximo | Dónde no aplica |
| --- | --- | --- | --- |
| Corazón | Delante | 8 cm aprox. (el del catálogo); "corazón grande" interno \[FALTA medida\] | — |
| Frontal A4 | Delante | 21 × 29,7 cm | Polos (tapeta), prendas con cremallera completa (Montblanc, Valier); reducido sobre el bolsillo canguro y en la media cremallera |
| Espalda A4 | Detrás | 21 × 29,7 cm | — |
| Espalda A3 | Detrás | 29,7 × 42 cm | Según silueta: tirantes de mujer (Shura) y tallas pequeñas pueden no admitirlo |
| Cara A / B | Bolsas | \[FALTA\] área de marcaje | — |
| Zona de marcaje | Goodies | No aplica: los goodies no pasan por el estudio | — |

Gorras: una sola posición, el frontal, con tamaño máximo \[FALTA medida del plato de gorras\]; en la v1 van en modo 2D. Cada silueta guarda su tamaño máximo real por posición. El estudio traduce el tamaño elegido a la categoría de la tarifa interna (corazón pequeño, corazón grande, A4, A3), así el presupuesto sale directo. Con dos diseños el precio sube (suplemento por tramo, decisión del 05/10/2026): el estudio lo avisa sin dar la cifra.

Aviso de calidad: si el logo es una imagen pequeña para el tamaño elegido (a 150 ppp un A4 pide unos 1.240 × 1.754 px), sale *Tu logo se verá pixelado a este tamaño: mándanos el vector o un PNG más grande*. Ahorra idas y vueltas antes de producir.

### Cómo funciona por dentro

- **Carga:** el estudio es la única página con 3D; se carga bajo demanda y muestra una imagen 2D mientras llega el modelo.
- **Modelos:** un GLB por silueta, talla M, en centímetros, comprimido (Draco o meshopt); cuerpo, puños y cuello, cremallera y cordones como piezas separadas para que solo se tiña la tela.
- **Color:** se tiñe el material base (gris claro neutro con sombras horneadas) con el hex del color; los jaspeados usan su propia textura. Mapa de relieve por tejido: punto, piqué, felpa, técnico.
- **Logo:** se proyecta como calcomanía (decal) sobre la malla en el ancla de cada posición, con su tamaño en cm.
- **Capturas:** cámaras fijas delante y detrás, PNG de 1200 × 1500.
- **Modo 2D (resto de productos y móviles sin WebGL o de gama baja):** foto delantera y trasera de la prenda en gris neutro, teñida en canvas, con el logo dentro del rectángulo de la posición. Mismo estado y misma salida, así que el formulario no distingue cómo se hizo.
- **Seguridad del logo:** se procesa solo en el navegador hasta enviar; el SVG se pinta como imagen, nunca insertado en la página.

### Activos que hay que conseguir

| Activo | Cantidad | De dónde sale | Estado |
| --- | --- | --- | --- |
| Mallas 3D (GLB) | 4 en v1 (camiseta unisex, polo, sudadera, sudadera con capucha); 15 al completar | Generadas con IA a partir de fotos delantera y trasera del equipo; Claude Code las limpia y prepara (ver abajo) | Vía decidida el 09/10/2026; coste en créditos \[FALTA\] |
| Fotos de producto sin logo, delante y detrás | 30 productos | Fotos propias del equipo; si faltan, media pack con permiso comercial. Nunca capturadas de la web del proveedor | \[FALTA\] |
| Prendas en gris neutro para el modo 2D | 21 (16 prendas, 3 gorras y 2 bolsas) | Derivadas de las fotos o renderizadas desde las mallas | Pendiente |
| Colores con nombre y hex | Uno por color de cada producto | Proyecto del catálogo en Claude Design (las muestras ya están definidas) + nombres de las fichas técnicas oficiales | \[FALTA\] exportar |
| Anclas y tamaños por posición | 1 JSON por silueta | Los definimos nosotros a partir de las fichas | Pendiente |
| Logo [MARCA] y estrella en SVG | 2 | Identidad de marca | \[FALTA\] |
| Texturas de tejido | 5 (punto, piqué, felpa, técnico, jaspeado) | Librerías CC0 | Pendiente |

### Mallas 3D con IA (decidido el 09/10/2026)

Todas las mallas se generan con IA a partir de fotos delantera y trasera que aporta el equipo. Claude Code no dibuja la prenda a mano: lanza un generador de imagen a 3D, rellena lo que no se ve con lo que el generador infiere y deja la malla lista para el visor.

1. **Fotos (equipo):** la prenda real sin personalizar, en blanco o gris claro (se tiñe después), plana o en maniquí invisible, fondo liso, luz uniforme, 2.000 px o más, delantera y trasera con el mismo encuadre y escala. Si se puede, también los dos laterales: el generador admite de 2 a 4 vistas y con más vistas la forma sale más fiel.
2. **Generación:** Higgsfield, modelo `multi_image_to_3d`, con las vistas como entrada. Ya está conectado en este proyecto de Claude; en Claude Code hace falta añadir su conector. El coste en créditos se consulta antes de lanzar cada prenda.
3. **Limpieza (Claude Code, con Blender por script):** escala real en cm (talla M), centrado, reducción de polígonos, tela separada de puños, cuello, cremallera y cordones, textura neutra para teñir y GLB comprimido.
4. **Posiciones:** Claude Code mide sobre la malla y fija en el JSON de la silueta las anclas de corazón, frontal A4, espalda A4 y espalda A3.
5. **Revisión:** capturas delante, detrás y de perfil al lado de las fotos originales; el equipo da el visto bueno antes de publicar.

Límite: el generador solo reproduce lo que ve. Sin fotos de perfil, los laterales, las sisas y el grosor se los inventa; ahí es donde más se nota la diferencia con la prenda real.

### Qué se descarta y por qué

- **Configurador de terceros (SaaS):** cuota mensual, pensado para tiendas online y poco control sobre la estética espacial. Con Claude Code construirlo es asumible.
- **3D para los 30 productos en la v1:** retrasa el lanzamiento por las mallas. En goodies pequeños (bolígrafo, USB, llavero) el 3D no aporta frente a una buena foto.
- **Precio en tiempo real:** queda para la fase 2, leyendo la tarifa de la app interna. En la v1 se muestra el precio desde.

### Criterio del spike (gate antes de construir el estudio completo)

La Atomic 150 en 3D pasa si: se ve creíble en un móvil de gama media, el primer modelo carga en menos de 3 s en 4G, el logo se ve nítido en corazón y en A4, y el cambio de color es instantáneo. Si no pasa, la v1 sale con todo en 2D y el 3D llega en la v1.1 sin tocar la interfaz.

## 6. Datos del catálogo 2026-2027

La web publica los 30 productos del catálogo PDF (versión del 11/10/2026, con gorras), con sus mismos nombres, textos y precios "desde"; las prendas en tallas XS a 2XL y las gorras en talla única ajustable. En la v1 los datos viven en un archivo tipado del repositorio; en la fase 2 se leen de la app interna, que ya es la fuente de verdad de costes, márgenes y precios. Ningún dato público lleva nombre de proveedor, código de referencia ni coste.

| Producto | Categoría | Tipo | Material · gramaje o medida | Desde (€/ud, sin IVA) · [PRECIO] | Etiquetas | Visor v1 |
| --- | --- | --- | --- | --- | --- | --- |
| Atomic 150 | Camisetas y polos | Camiseta básica de manga corta | 100 % algodón · 150 g/m² | [PRECIO] | Destacado | 3D |
| Austral | Camisetas y polos | Polo de manga corta | 100 % algodón piqué · 180 g/m² | [PRECIO] | Destacado | 3D |
| Bull | Camisetas y polos | Camiseta oversize | 100 % algodón pesado · 210 g/m² | [PRECIO] | Calidad superior, oversize | 2D |
| Cobain | Camisetas y polos | Polo de manga corta | 100 % algodón piqué · 200 g/m² | [PRECIO] | Calidad superior | 3D |
| Jamaica | Camisetas y polos | Camiseta de mujer | 100 % algodón · 155 g/m² | [PRECIO] | Mujer | 2D |
| Pointer | Camisetas y polos | Camiseta de manga larga | 100 % algodón · 165 g/m² | [PRECIO] | Manga larga | 2D |
| Bahrain | Camisetas y polos | Camiseta técnica | 100 % poliéster · 135 g/m² | [PRECIO] | Técnica | 2D |
| Imola | Camisetas y polos | Camiseta técnica eco | 50 % poliéster reciclado / 50 % poliéster · 135 g/m² | [PRECIO] | Técnica, eco | 2D |
| Andre | Camisetas y polos | Camiseta de tirantes técnica | 100 % poliéster piqué · 140 g/m² | [PRECIO] | Técnica | 2D |
| Shura | Camisetas y polos | Camiseta de tirantes técnica de mujer | 100 % poliéster piqué · 140 g/m² | [PRECIO] | Técnica, mujer | 2D |
| Clásica | Sudaderas | Sudadera sin capucha | 50 % algodón / 50 % poliéster · 280 g/m² | [PRECIO] | Destacado | 3D |
| Urban | Sudaderas | Sudadera con capucha | 50 % algodón / 50 % poliéster · 280 g/m² | [PRECIO] | — | 3D |
| Montblanc | Sudaderas | Sudadera con cremallera y capucha | 50 % algodón / 50 % poliéster · 280 g/m² | [PRECIO] | — | 2D |
| Otto | Sudaderas | Sudadera oversize | 50 % algodón / 50 % poliéster · 320 g/m² | [PRECIO] | Oversize | 2D |
| Estambul Woman | Sudaderas | Sudadera técnica de mujer con media cremallera | 88 % poliéster reciclado / 12 % elastano · 200 g/m² | [PRECIO] | Técnica, mujer, eco | 2D |
| Valier | Sudaderas | Sudadera técnica con cremallera | 100 % poliéster · 210 g/m² | [PRECIO] | Técnica | 2D |
| Freya | Gorras | Gorra de 5 paneles | 100 % algodón · 170 g/m² · talla única ajustable (adulto e infantil) | [PRECIO] | — | 2D |
| Mercury | Gorras | Gorra técnica transpirable | 90 % poliéster / 10 % elastano · 140 g/m² · talla única ajustable | [PRECIO] | Técnica | 2D |
| Fred | Gorras | Gorra premium de 5 paneles | 100 % algodón · 290 g/m² · talla única ajustable, cierre de hebilla metálica | [PRECIO] | — | 2D |
| Crest | Bolsas | Bolsa tote | Polipropileno no tejido · 80 g/m² · 36 × 40 cm | Consultar precio | — | 2D |
| Zenith | Bolsas | Bolsa tote | 100 % algodón natural · 180 g/m² · 37 × 41 cm | Consultar precio | — | 2D |
| Tarek | Goodies | Bidón | Acero inoxidable, acabado mate · 790 ml | Consultar precio | — | Solo ficha |
| Kranston | Goodies | Taza térmica | Acero inoxidable reciclado · 870 ml | Consultar precio | Eco | Solo ficha |
| Ranic | Goodies | Libreta A5 | Cartón reciclado de briks · 70 hojas lisas | Consultar precio | Eco | Solo ficha |
| Davos | Goodies | Bolígrafo | Bambú · 13,8 cm · tinta azul | Consultar precio | Eco | Solo ficha |
| Uldon | Goodies | Memoria USB | Bambú natural · 16 GB | Consultar precio | Eco | Solo ficha |
| Karby | Goodies | Llavero | Bambú y metal · 3,2 × 5,3 cm | Consultar precio | Eco | Solo ficha |
| Roldi | Goodies | Multiherramienta | Acero inoxidable y bambú · 10 cm | Consultar precio | Eco | Solo ficha |
| Zora | Goodies | Navaja multiusos | Aluminio y acero inoxidable · 7,6 cm · 6 funciones | Consultar precio | — | Solo ficha |
| Luxor | Goodies | Llavero | Piel reciclada · 8,5 × 2,5 cm | Consultar precio | Eco | Solo ficha |

Goodies (decisión del equipo, 11/10/2026): no pasan por el estudio ni admiten subir el logo del cliente. Se enseñan como en el catálogo, con sus fotos (ya llevan la personalización de ejemplo) y toda su información, y la acción principal es *Añadir al presupuesto*.

Luxor y Davos tienen pendiente la prueba de adhesión del DTF UV (decisión de tarifas, 03/10/2026). Publicarlos antes de esa prueba choca con el aprendizaje *no prometer nada que no esté operativamente soportado* (sección 12).

### Modelo de datos

```ts
type Categoria = 'camisetas-polos' | 'sudaderas' | 'gorras' | 'bolsas' | 'goodies';
type Posicion = 'corazon' | 'frontal_a4' | 'espalda_a4' | 'espalda_a3' | 'frontal_gorra' | 'cara_a' | 'cara_b' | 'zona_marcaje';
type Etiqueta = 'eco' | 'mujer' | 'tecnica' | 'oversize' | 'manga-larga' | 'calidad-superior';

interface Color {
  nombre: string;          // nombre comercial del color
  hex: string;             // del proyecto del catálogo
  jaspeado?: boolean;      // usa textura propia en el visor
  fotoDelante?: string;
  fotoDetras?: string;
  porDefecto?: boolean;
}

interface Producto {
  slug: string;            // 'atomic-150'
  nombre: string;          // 'Atomic 150'
  categoria: Categoria;
  tipo: string;            // 'Camiseta básica de manga corta'
  material: string;
  gramaje?: number;        // g/m²
  medidas?: string;        // '36 × 40 cm', '790 ml'
  tallas?: string[];       // ['XS','S','M','L','XL','2XL']
  precioDesde: number | null; // € sin IVA; null = 'Consultar precio'
  destacado: boolean;
  etiquetas: Etiqueta[];
  posiciones: { posicion: Posicion; maxCm: [ancho: number, alto: number] }[];
  visor: '3d' | '2d' | 'ninguno'; // goodies: 'ninguno', solo ficha
  silueta?: string;        // id del GLB: 'camiseta-unisex', 'polo', 'sudadera', 'sudadera-capucha'
  colores: Color[];
  orden: number;
  activo: boolean;
}
// Prohibido en datos públicos: proveedor, código de referencia, coste, margen.
```

## 8. Valoraciones y reseñas

La sección sale con reseñas reales; las de clientes ficticios no se publican como si fueran de verdad. Desde el Real Decreto-ley 24/2021 la Ley de Competencia Desleal recoge disposiciones específicas sobre reseñas falsas ([Cuatrecasas](https://www.cuatrecasas.com/es/spain/propiedad-intelectual/art/resenas-falsas-online-regulacion-actual-vias-actuacion)), y si un cliente lo descubre, la sección destruye justo la confianza que tenía que crear. El contenido de ejemplo existe solo para maquetar: en desarrollo, marcado como ejemplo y fuera de producción.

### Cómo tener reseñas el día del lanzamiento

- Pedirlas ya a los 7 clientes de 25/26: Alter Motion, Camping Le Dauphin, el equipo de rugby, KS Auto, Benjamín A E1 Paiporta, Tech Assist y el cliente de los petos. Las que lleguen en francés se publican traducidas e indicándolo.
- Revisar las respuestas que ya haya en el formulario de feedback actual \[FALTA qué herramienta es\] y publicar solo las que tengan permiso.
- Con menos de 3 publicadas la sección no aparece. Mientras tanto, prueba social verificable: fotos de pedidos reales con permiso del cliente y una cifra real, 382 unidades entregadas en la temporada 25/26.

### Flujo

1. Pedido entregado → a los 3-5 días el equipo manda por WhatsApp o email el enlace a `/tu-opinion` (plantilla fija).
2. El cliente rellena: valoración general de 1 a 5 (calidad, plazo y trato, opcionales), texto, nombre y cargo, negocio, sector, ciudad, producto, foto del pedido y logo (opcionales), permiso para publicar con el nombre del negocio y aceptación de privacidad.
3. Entra como `pendiente` y llega un aviso por email al equipo.
4. Moderación: se publica tal cual o se oculta solo por spam, insultos o datos personales de terceros. No se edita el texto ni se filtra por nota; el criterio se explica en `/opiniones`.
5. Al publicarla, la web se actualiza sola.
6. Si la nota es 4 o 5, el email de agradecimiento invita a dejarla también en Google \[FALTA si existe perfil de empresa\].

En la v1 la moderación se hace desde el panel de Supabase (cambiar el estado); un mini panel `/admin` con acceso por email queda para la v1.1.

### Tabla

```sql
create table reviews (
  id uuid primary key default gen_random_uuid(),
  created_at timestamptz default now(),
  estado text not null default 'pendiente'
    check (estado in ('pendiente','publicada','oculta')),
  nota smallint not null check (nota between 1 and 5),
  nota_calidad smallint, nota_plazo smallint, nota_trato smallint,
  texto text not null,
  autor_nombre text not null,
  autor_cargo text,
  negocio text not null,
  sector text,
  ciudad text,
  producto text,
  foto_path text,               -- bucket review-media
  logo_path text,
  idioma text default 'es',
  traducida boolean default false,
  permiso_publicacion boolean not null,
  es_ejemplo boolean not null default false,  -- solo desarrollo
  pedido_ref text               -- interno, nunca se muestra
);
alter table reviews enable row level security;
-- anon puede insertar solo con estado = 'pendiente' y es_ejemplo = false
-- anon puede leer solo estado = 'publicada' and permiso_publicacion and not es_ejemplo
-- cambiar estado: solo el equipo (service role)
```

## 9. Stack técnico y arquitectura

Se usa el stack de la casa: Next.js (App Router, TypeScript) en Vercel, Supabase y GitHub. Se añaden Resend para los emails y React Three Fiber para el estudio. El catálogo se sirve como páginas estáticas; solo formularios, reseñas y archivos tocan el servidor.

&#91;embedded content: arquitectura v1 · navegador, Vercel, Supabase y Resend; app interna en fase 2\]

El navegador nunca habla directo con Supabase para escribir: los envíos pasan por acciones de servidor de Next.js, que validan, limitan el ritmo y guardan. La app interna entra en la fase 2 (línea discontinua).

### Piezas

- **Librerías:** Tailwind CSS, Framer Motion, React Three Fiber + drei, Zustand (estado del estudio), react-hook-form + zod, `next/og` para imágenes de Open Graph por producto. Últimas versiones estables.
- **Supabase:** proyecto propio de la web, separado de la app interna, en región UE. La app interna guarda costes y márgenes; un fallo de permisos en un proyecto compartido los dejaría a la vista. El plan gratuito pausa los proyectos con poca actividad durante 7 días ([Supabase](https://supabase.com/docs/guides/platform/free-project-pausing)): una web con pocos envíos puede quedarse sin formulario. Se evita con un cron diario de Vercel que hace una consulta ligera, o con el plan Pro.
- **Vercel:** el plan Hobby es solo para uso personal y no comercial ([Vercel](https://vercel.com/docs/plans/hobby)); una web que capta clientes es uso comercial. Recomendación: desarrollar en Hobby y pasar a Pro al publicar; el precio de Pro se cita en torno a 20 $/mes ([fuente](https://www.supadrop.host/blog/vercel-pricing-free-tier-limits/)). Decisión en la sección 12.
- **Archivos:** bucket privado `lead-files` (logos y capturas del estudio; el email al equipo lleva enlaces firmados) y bucket público `review-media` (solo fotos de reseñas publicadas). Borrado de archivos de leads sin pedido a los 12 meses \[plazo a confirmar\].
- **Emails:** desde `avisos@dominio-pendiente.example` (SPF y DKIM en el DNS) a email-pendiente@example.com con todo el lead y los archivos; confirmación al cliente con resumen y WhatsApp.
- **Antispam:** campo trampa oculto y límite de envíos por IP; Cloudflare Turnstile solo si aparece spam.
- **Analítica:** Vercel Web Analytics, sin cookies. Eventos: `estudio_abierto`, `logo_subido`, `color_cambiado`, `diseno_enviado`, `formulario_enviado`, `whatsapp_clic`, `pdf_descargado`, `cita_pedida`.
- **Variables de entorno:** `NEXT_PUBLIC_SUPABASE_URL`, `NEXT_PUBLIC_SUPABASE_ANON_KEY`, `SUPABASE_SERVICE_ROLE_KEY` (solo servidor), `RESEND_API_KEY`, `LEAD_NOTIFY_EMAIL`, `NEXT_PUBLIC_WHATSAPP_NUMBER`.

### Tabla de leads

```sql
create table leads (
  id uuid primary key default gen_random_uuid(),
  created_at timestamptz default now(),
  origen text not null,            -- 'formulario' | 'estudio' | 'home'
  nombre text not null,
  negocio text not null,
  sector text,
  ciudad text,
  email text not null,
  telefono text,
  contacto_preferido text,         -- 'whatsapp' | 'llamada' | 'email'
  productos text[],
  tramo text,                      -- '<25' | '25-50' | '50-150' | '150+'
  uso text,                        -- 'venta-local' | 'packs' | 'equipo' | 'evento'
  fecha_limite date,
  mensaje text not null,
  diseno jsonb,                    -- salida del estudio: producto, color, posiciones, tamaños, categoría de tarifa
  archivos text[],                 -- rutas en lead-files
  cita text,                       -- 'no' | 'su-local' (sin videollamada: decisión del 12/10/2026)
  franja_cita text,
  privacidad_aceptada boolean not null check (privacidad_aceptada),
  estado text not null default 'nuevo'  -- 'nuevo' | 'contactado' | 'presupuestado' | 'ganado' | 'perdido'
);
alter table leads enable row level security;
-- sin políticas para anon: solo escribe el servidor con service role
```

### Estructura del repositorio

```
app/
  page.tsx                     # inicio
  catalogo/page.tsx
  catalogo/[slug]/page.tsx
  disena/[slug]/page.tsx
  opiniones/page.tsx
  proyecto/page.tsx
  gracias/page.tsx
  tu-opinion/page.tsx
  aviso-legal/ privacidad/ cookies/
  api/cron/route.ts            # mantener Supabase activo, limpiar archivos
components/space/              # fondo estelar, estrella, destellos
components/catalogo/
components/estudio/
components/formularios/
data/catalogo.ts
data/siluetas/*.json           # anclas y tamaños por posición
public/modelos/*.glb
public/productos/
supabase/migrations/
docs/SPEC.md                   # este documento exportado
CLAUDE.md
```

