# Espacio cliente profesional

Cuentas de profesionales con **precios privados**, favoritos, carrito y pedidos. Todo el texto visible está en francés;
el código y esta guía, en español. El pago y los emails oficiales **no están conectados** (ver «Para el siguiente prompt»).

## Qué ve cada persona

| Quién | Catálogo | Precios | Favoritos | Carrito / pedido |
|---|---|---|---|---|
| Visitante | todo | no («Prix : connexion») | en el navegador (`localStorage`) | no: aviso de conexión que conserva la selección |
| Profesional **pendiente** | todo | no | no | no (aviso «compte en cours de validation») |
| Profesional **validado** | todo | sí, HT | en base de datos | sí |
| **Rechazado** | todo | no | no | no (se muestra el motivo si el admin lo escribió) |
| **Admin** | todo | sí | sí | sí + `/admin` |

Estados de cuenta: `pendiente → validada | rechazada` (el admin puede cambiarlos). Validación = SIRET obligatorio
(14 cifras, algoritmo de Luhn, con la excepción de La Poste) **más** aprobación manual.

## Rutas nuevas

- Públicas: `/connexion`, `/inscription`, `/mot-de-passe-oublie`, `/nouveau-mot-de-passe`, `/auth/confirmation` (destino de los enlaces de email).
- Protegidas (sesión exigida en `proxy.ts` **y** dentro de cada página/acción): `/compte` (Mes données), `/compte/favoris`,
  `/compte/panier`, `/compte/commandes`, `/commande/paiement-bientot`, `/admin` (solo rol admin).
- API privadas (`Cache-Control: private, no-store`, `Vary: Cookie`): `/api/yo` (estado de sesión, favoritos, nº de líneas) y
  `/api/precios` (precios solo para validados).
- `/espace-client` redirige (307) a `/compte`.

## Arquitectura (por qué las páginas públicas siguen siendo estáticas)

- Las páginas del catálogo se generan estáticas y **no contienen ningún precio**. Los precios ya no están en `data/*.ts`.
- El navegador, al arrancar, pide `/api/yo` y, si la cuenta está validada, `/api/precios` (store `zustand` en
  `components/cuenta/almacen.ts`). Un visitante recibe `{estado:'anonimo'}` y listas vacías.
- La sesión vive en cookies httpOnly de `@supabase/ssr`. `lib/cuenta/sesion.ts` es la única capa que lee al usuario
  (`getUser()` valida el JWT contra Auth; `await connection()` la aplaza a la petición real).
- Server Actions (`lib/cuenta/acciones*.ts`): zod + comprobación de sesión/estado en **cada** acción; nunca se confía en lo que
  envía el navegador (cantidades, precios, estado).
- Los pedidos se crean solo con la función SQL `crear_pedido_desde_carrito()`, que recalcula los importes en el servidor.
- El antispam del registro (campo trampa, tiempo mínimo, límite por IP) reutiliza `lib/solicitud/antispam.ts`; el límite es
  en memoria y se reinicia con el servidor.

## Base de datos (`supabase/migrations/20261125000000_espacio_cliente.sql`)

RLS activada en **todas** las tablas; `anon` no tiene ningún permiso sobre ellas.

| Tabla | Contenido | Política (resumen) |
|---|---|---|
| `configuracion` | `tasa_iva` (20 % provisional) | lectura para validados; escribe el admin |
| `perfiles` | datos de empresa, `estado`, `rol` | cada uno lee/edita el suyo; un trigger impide que un no-admin cambie `estado`, `rol`, `email`, motivo; el admin lee/edita todos |
| `precios` | por producto y variante, `cantidad_minima` (lote), `precio_ht` | solo validados/admin leen; escribe el admin |
| `favoritos` | producto/variante por usuario | cada uno lee, crea y borra los suyos (solo validados) |
| `carritos`, `lineas_carrito` | carrito vivo con talla, personalización y diseño del estudio | solo el dueño validado |
| `pedidos`, `lineas_pedido` | pedidos con estado `pendiente_pago`, importes congelados | el dueño lee los suyos; el admin lee/cambia estado; **nadie inserta directamente**: solo la función |

Regla de precio: se toma la fila de la variante o, si no hay, la del producto; entre las filas con `cantidad_minima ≤ cantidad`,
la de mayor mínimo. Por debajo del lote mínimo: error «lot minimum». Sin fila: «Prix sur demande» (no se puede pedir en línea).
Los precios son **HT**; la TVA se añade en el total (`lib/carrito/calculo.ts`, tasa leída de `configuracion.tasa_iva`).

Pruebas de aislamiento: `node scripts/probar-rls.mjs` (22 comprobaciones sobre `supabase/tests/rls.sql`: un cliente no lee datos de otro,
un pendiente no lee precios, nadie se auto-valida ni se hace admin, etc.).

## Desarrollo en local (sin cuentas de Supabase)

Requiere Docker. No se usa ningún proyecto, clave ni cuenta de la base reutilizada.

```bash
node scripts/supabase-local.mjs claves        # crea supabase/local/.env.local-stack (ignorado por git)
docker compose --env-file supabase/local/.env.local-stack -f supabase/local/docker-compose.yml up -d
node scripts/supabase-local.mjs migrar        # aplica migraciones y recarga el esquema de PostgREST
```

En `.env.local`: `NEXT_PUBLIC_SUPABASE_URL=http://localhost:54321`, `NEXT_PUBLIC_SUPABASE_ANON_KEY=<ANON_KEY del archivo anterior>`,
`NEXT_PUBLIC_SITE_URL=http://localhost:3000`. Los emails de confirmación llegan a Mailpit: <http://localhost:54324>.

La pila (`supabase/local/`) sustituye al CLI oficial porque `supabase start` necesita imágenes que no siempre se pueden descargar.
Con el CLI, `supabase/config.toml` hace lo mismo.

Precios de **prueba** (ficticios, solo local): `node scripts/supabase-local.mjs precios-demo`. **No hay precios reales cargados**:
sin ellos todo sale «Prix sur demande».

## Primer administrador

No hay credenciales en el código. Se registra una cuenta normal por `/inscription`, se confirma el email y después:

- Local: `node scripts/supabase-local.mjs crear-admin correo@ejemplo.fr`
- Proyecto real (panel de Supabase → SQL editor):

  ```sql
  update public.perfiles set rol = 'admin', estado = 'validada'
  where id = (select id from auth.users where email = 'correo@ejemplo.fr');
  ```

## Validar o rechazar cuentas

Con un admin: `/admin` lista las cuentas pendientes con razón social, SIRET, TVA y contacto. «Valider» da acceso a precios,
favoritos y carrito; «Rejeter» admite un motivo opcional. Cada cambio llama a `lib/correo/cuenta.ts` (hoy solo escribe en el registro del servidor).

## Pasar a un proyecto real de Supabase

1. Crear un proyecto **nuevo y propio** de La Ola Import; en Authentication → URL configuration poner la URL del sitio y
   `…/auth/confirmation` como redirección permitida; activar confirmación de email.
2. Aplicar `supabase/migrations/*.sql` y `supabase/seed.sql` (SQL editor o `supabase db push`).
3. Rellenar `NEXT_PUBLIC_SUPABASE_URL`, `NEXT_PUBLIC_SUPABASE_ANON_KEY` y `NEXT_PUBLIC_SITE_URL` en el alojamiento
   (ver `.env.example`). La clave `service_role` **no** va en el alojamiento.
4. Configurar SMTP propio en Supabase (el de pruebas tiene límite) y revisar las plantillas de email (en francés).
5. Crear el primer admin (SQL de arriba) y cargar los precios reales en `precios`.

## Qué es provisional o simulado

- **Pago**: `lib/pagos/index.ts` define la interfaz `ProveedorDePagos` con un proveedor simulado; «Valider la commande» crea el
  pedido en `pendiente_pago` y lleva a `/commande/paiement-bientot`. No se cobra nada.
- **Emails**: `lib/correo/cuenta.ts` y la notificación del pedido son stubs (registro en consola); solo los emails de
  Supabase Auth (confirmación, contraseña) son reales.
- **IVA 20 %** y **todos los precios**: por confirmar con La Ola Import.
- **Textos legales**: la sección de CGV de pedidos en línea lleva «[PENDIENTE DE REVISIÓN LEGAL]»; confidencialité y cookies
  mencionan cuentas y cookies de sesión pero necesitan revisión jurídica.
- **Flujo de presupuesto antiguo: retirado** (decisión de Alex, 25/11/2026, porque los clientes compran directamente).
  Eliminados `/projet`, `/devis`, `/merci`, `/espace-client`, `lib/presupuesto.ts` y su formulario. Redirecciones permanentes (308):
  `/espace-client` y `/projet` → `/compte` y `/compte/panier`; `/devis` → `/contact`; `/merci` → `/`. La cabecera enseña «Compte
  professionnel»; «Nous contacter» (`CONTACTO` en `lib/site.ts`) cubre las dudas y productos que no se encuentran.
  Quedan sin uso, a limpiar más adelante, las plantillas de email de presupuesto de `lib/correo/plantillas.ts` y exportaciones de
  `lib/solicitud/*` (el motor sigue sirviendo al formulario de opiniones).
- **Lotes mínimos**: se decidirán más tarde; mientras tanto el carrito aplica los que haya en la tabla `precios` (cargar con lote 1 si no se quiere mínimo).

## Para el siguiente prompt

- **Pasarela de pago** (implementar `ProveedorDePagos`: sesión de pago, webhook que pasa el pedido a `pagado`, página de retorno).
- **Emails oficiales** (confirmación de pedido, validación/rechazo de cuenta, aviso interno), con dominio y remitente propios.
- **Facturas** (numeración, datos legales del vendedor, PDF).
- **Envío y plazos** (zonas, gastos, recogida en Monteux) y condiciones comerciales definitivas (mínimos, plazos, pago).
- Generar los tipos TypeScript desde el esquema (`supabase gen types`) cuando haya proyecto real.
