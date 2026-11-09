// Fase 6: los dos emails de una solicitud, en HTML (con estilos en línea, legibles en móvil y en modo oscuro) y en
// texto plano. Funciones puras: reciben los datos ya validados y devuelven asunto, html y texto.
//   - correoEquipo: a email-pendiente@example.com, con todos los datos, la cesta en tabla y los adjuntos.
//   - correoCliente: la confirmación, con el resumen de lo pedido, el plazo y el botón de WhatsApp. Sin precios.

import { SITE, TEXTOS, enlaceWhatsApp } from '@/lib/site';
import { MENSAJE_WHATSAPP_PROYECTO_ENVIADO } from '@/lib/whatsapp';
import { CITAS, CONTACTOS, USOS, formatoBytes, nombreDe, nombreLado, nombreLogo, nombreTramo, textoPosicionesLinea, type Lado, type LineaCesta, type LogoLinea } from '@/lib/solicitud/comun';
import type { Solicitud } from '@/lib/solicitud/esquema';

export interface AdjuntoResumen {
  nombre: string;
  tamano: number;
  categoria: 'logo' | 'captura' | 'archivo';
  linea?: number;
  lado?: Lado;
  cid?: string;
}

export interface DatosCorreo {
  solicitud: Solicitud;
  lineas: LineaCesta[];
  adjuntos: AdjuntoResumen[];
  /** Avisos del navegador al preparar el envío (capturas comprimidas, logo reducido, logo que ya no estaba…). */
  avisos: string[];
  fecha: Date;
  tecnico?: { ip?: string; navegador?: string };
  /** cid del logo de [MARCA] si va incrustado; si no, la cabecera lleva el nombre en texto. */
  logoCid?: string | null;
}

export interface CorreoListo {
  asunto: string;
  html: string;
  texto: string;
}

// [COLOR] grises placeholder. Colores de los tokens de la web (sección 7 de la spec) en su versión para email.
const C = {
  fondo: '#f2f2f2',
  tarjeta: '#ffffff',
  texto: '#111111',
  suave: '#555555',
  linea: '#e2e2e2',
  caja: '#f5f5f5',
  marca: '#555555',
  titulo: '#444444',
  oscuro: { fondo: '#111111', tarjeta: '#1f1f1f', texto: '#f5f5f5', suave: '#b0b0b0', linea: '#3a3a3a', caja: '#262626', titulo: '#d0d0d0' },
};
const FUENTE = "-apple-system, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif";

export function escapar(s: string): string {
  return s.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;').replace(/'/g, '&#39;');
}
const conSaltos = (s: string) => escapar(s).replace(/\r?\n/g, '<br>');

const fechaLarga = new Intl.DateTimeFormat('es-ES', { dateStyle: 'full', timeStyle: 'short', timeZone: 'Europe/Madrid' });
const soloFecha = new Intl.DateTimeFormat('es-ES', { dateStyle: 'long', timeZone: 'Europe/Madrid' });

function fechaLimite(iso?: string): string {
  if (!iso) return '';
  const [a, m, d] = iso.split('-').map(Number);
  return soloFecha.format(new Date(Date.UTC(a, m - 1, d, 12)));
}

/** Enlace a WhatsApp a partir de un teléfono español escrito de cualquier forma, o nada si no lo parece. */
function whatsappDe(telefono?: string): string | null {
  if (!telefono) return null;
  const digitos = telefono.replace(/\D/g, '');
  if (digitos.length === 9 && /^[679]/.test(digitos)) return `https://wa.me/34${digitos}`;
  if (digitos.length === 11 && digitos.startsWith('34')) return `https://wa.me/${digitos}`;
  return null;
}

function textoProductos(n: number): string {
  return n === 1 ? '1 producto' : `${n} productos`;
}

/** «por WhatsApp», «por teléfono», «por email»: la vía de contacto en una frase. */
function viaContacto(id: Solicitud['contacto_preferido']): string {
  return id === 'llamada' ? 'por teléfono' : id === 'email' ? 'por email' : 'por WhatsApp';
}

/** Une las líneas del texto plano: `null` es una línea que no toca; '' es una línea en blanco que se conserva. */
function lineas(partes: (string | null)[]): string {
  return partes
    .filter((l): l is string => l !== null)
    .join('\n')
    .replace(/\n{3,}/g, '\n\n')
    .trim();
}

// ---------- piezas de HTML ----------

const estiloTexto = `font-family:${FUENTE};font-size:16px;line-height:1.55;color:${C.texto};`;

function h1(texto: string): string {
  return `<h1 class="texto" style="margin:0 0 10px;font-family:${FUENTE};font-size:26px;line-height:1.25;font-weight:700;color:${C.texto};">${texto}</h1>`;
}
function p(html: string, extra = ''): string {
  return `<p class="texto" style="margin:0 0 14px;${estiloTexto}${extra}">${html}</p>`;
}
function suave(html: string, tamano = 14): string {
  return `<p class="suave" style="margin:0 0 10px;font-family:${FUENTE};font-size:${tamano}px;line-height:1.5;color:${C.suave};">${html}</p>`;
}
function titulo(texto: string): string {
  return `<h2 class="titulo" style="margin:28px 0 10px;font-family:${FUENTE};font-size:13px;line-height:1.3;font-weight:700;letter-spacing:.08em;text-transform:uppercase;color:${C.titulo};">${texto}</h2>`;
}
function enlace(href: string, texto: string): string {
  return `<a class="enlace" href="${escapar(href)}" style="color:${C.marca};text-decoration:underline;text-underline-offset:3px;">${texto}</a>`;
}
function boton(href: string, texto: string): string {
  return `<table role="presentation" cellpadding="0" cellspacing="0" style="margin:6px 0 10px;"><tr><td style="background:${C.marca};border-radius:999px;">` + `<a href="${escapar(href)}" style="display:inline-block;padding:13px 24px;font-family:${FUENTE};font-size:16px;font-weight:700;color:#ffffff;text-decoration:none;border-radius:999px;">${texto}</a></td></tr></table>`;
}
function caja(html: string): string {
  return `<table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="margin:0 0 14px;"><tr><td class="caja texto" style="background:${C.caja};border-radius:16px;padding:16px 18px;${estiloTexto}">${html}</td></tr></table>`;
}
function chips(items: string[]): string {
  return `<p style="margin:0 0 6px;">${items
    .map((t) => `<span class="caja texto" style="display:inline-block;margin:0 6px 6px 0;padding:5px 12px;border-radius:999px;background:${C.caja};font-family:${FUENTE};font-size:13px;font-weight:600;color:${C.texto};">${t}</span>`)
    .join('')}</p>`;
}
function filas(datos: [string, string][]): string {
  const presentes = datos.filter(([, v]) => v);
  if (!presentes.length) return '';
  return (
    `<table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="margin:0 0 8px;border-collapse:collapse;">` +
    presentes
      .map(
        ([k, v]) =>
          `<tr><td class="suave linea" width="34%" style="padding:7px 12px 7px 0;border-bottom:1px solid ${C.linea};font-family:${FUENTE};font-size:14px;line-height:1.45;color:${C.suave};vertical-align:top;">${k}</td>` +
          `<td class="texto linea" style="padding:7px 0;border-bottom:1px solid ${C.linea};${estiloTexto}font-size:15px;vertical-align:top;">${v}</td></tr>`,
      )
      .join('') +
    `</table>`
  );
}
function muestra(color: LineaCesta['color']): string {
  const fondo = color.hexSecundario ? `linear-gradient(135deg, ${color.hex} 50%, ${color.hexSecundario} 50%)` : color.hex;
  return `<span style="display:inline-block;width:12px;height:12px;margin-right:6px;border-radius:50%;background:${escapar(fondo)};border:1px solid rgba(0,0,0,.18);vertical-align:-1px;"></span>${escapar(color.nombre)}`;
}
function tablaProductos(lineas: LineaCesta[]): string {
  const th = (t: string) => `<th class="cab" align="left" style="padding:9px 10px;background:${C.caja};font-family:${FUENTE};font-size:12px;letter-spacing:.06em;text-transform:uppercase;color:${C.suave};">${t}</th>`;
  const td = (h: string) => `<td class="texto linea" style="padding:10px;border-bottom:1px solid ${C.linea};${estiloTexto}font-size:15px;vertical-align:top;">${h}</td>`;
  return (
    `<table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="margin:0 0 12px;border-collapse:collapse;border-radius:12px;overflow:hidden;">` +
    `<tr>${th('Producto')}${th('Color')}${th('Posición')}${th('Cantidad')}</tr>` +
    lineas
      .map((l) => {
        const posicion = textoPosicionesLinea(l);
        const detalle = l.diseno ? `<br><span class="suave" style="font-size:13px;color:${C.suave};">Diseño del estudio · logo ${escapar(l.diseno.logo.nombre)}${l.diseno.logoDetras ? ` · trasero ${escapar(l.diseno.logoDetras.nombre)}` : ''}</span>` : '';
        return `<tr>${td(`<strong>${escapar(l.nombre)}</strong><br><span class="suave" style="font-size:13px;color:${C.suave};">${escapar(l.tipo)}</span>${detalle}`)}${td(muestra(l.color))}${td(posicion ? escapar(posicion) : '<span class="suave" style="color:' + C.suave + ';">Sin indicar</span>')}${td(escapar(nombreTramo(l.tramo)))}</tr>`;
      })
      .join('') +
    `</table>`
  );
}
function capturasInline(adjuntos: AdjuntoResumen[], linea: number): string {
  const capturas = adjuntos.filter((a) => a.categoria === 'captura' && a.linea === linea && a.cid);
  if (!capturas.length) return '';
  return (
    `<table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="margin:6px 0 10px;"><tr>` +
    capturas
      .map(
        (c) =>
          `<td class="col" width="${Math.floor(100 / capturas.length)}%" style="padding:0 6px 6px 0;vertical-align:top;">` +
          `<img src="cid:${c.cid}" alt="Diseño por ${c.lado === 'delante' ? 'delante' : 'detrás'}" width="260" style="display:block;width:100%;max-width:260px;height:auto;border-radius:12px;border:1px solid ${C.linea};background:#ffffff;">` +
          `<span class="suave" style="display:block;margin-top:4px;font-family:${FUENTE};font-size:12px;color:${C.suave};">${c.lado ? nombreLado(c.lado) : ''}</span></td>`,
      )
      .join('') +
    `</tr></table>`
  );
}
/** «Delante · Corazón · 8 × 5,2 cm (logo delantero)»: posición y tamaño de cada logo (fase 10). */
function textoColocacion(c: LineaCesta['diseno'] extends infer D ? (D extends { colocaciones: (infer K)[] } ? K : never) : never, conLogo: boolean): string {
  const lado = c.lado ? `${nombreLado(c.lado)} · ` : '';
  const logo = conLogo && c.lado ? ` (logo ${nombreLogo(c.lado)})` : '';
  return `${lado}${c.nombre} · ${c.anchoCm.toLocaleString('es-ES')} × ${c.altoCm.toLocaleString('es-ES')} cm${logo}`;
}

function textoLogo(logo: LogoLinea): string {
  return `${logo.nombre} · ${logo.vectorial ? 'vectorial' : `${logo.ancho} × ${logo.alto} px`}${logo.fondoQuitado ? ' · fondo blanco quitado' : ''}`;
}

function bloqueDiseno(l: LineaCesta, indice: number, adjuntos: AdjuntoResumen[], paraCliente: boolean): string {
  const d = l.diseno!;
  const conDos = Boolean(d.logoDetras);
  const colocaciones = d.colocaciones.map((c) => escapar(textoColocacion(c, conDos))).join(' + ') || 'sin posiciones';
  const logo = paraCliente
    ? ''
    : filas([
        [conDos ? 'Logo delantero' : 'Logo', escapar(textoLogo(d.logo))],
        ['Logo trasero', d.logoDetras ? escapar(textoLogo(d.logoDetras)) : ''],
        ['Posiciones', colocaciones],
      ]);
  return caja(`<strong>${escapar(l.nombre)}</strong> · ${muestra(l.color)}${paraCliente ? `<br><span class="suave" style="font-size:14px;color:${C.suave};">${colocaciones}</span>` : ''}${logo}${capturasInline(adjuntos, indice)}`);
}
function listaAdjuntos(adjuntos: AdjuntoResumen[]): string {
  if (!adjuntos.length) return suave('Sin archivos adjuntos.');
  return (
    `<ul class="texto" style="margin:0 0 10px;padding-left:20px;${estiloTexto}font-size:15px;">` +
    adjuntos.map((a) => `<li style="margin:0 0 4px;">${escapar(a.nombre)} <span class="suave" style="color:${C.suave};">· ${formatoBytes(a.tamano)}</span></li>`).join('') +
    `</ul>` +
    suave(`Total: ${formatoBytes(adjuntos.reduce((s, a) => s + a.tamano, 0))}.`)
  );
}
function avisosHtml(avisos: string[]): string {
  return avisos.map((a) => caja(`<strong>Aviso.</strong> ${escapar(a)}`)).join('');
}

function cabeceraLogo(logoCid?: string | null): string {
  const dentro = logoCid
    ? `<img src="cid:${logoCid}" width="160" alt="[MARCA]" style="display:block;width:160px;height:auto;">`
    : `<span style="font-family:${FUENTE};font-size:22px;font-weight:700;color:${C.marca};">marca</span>`;
  return `<table role="presentation" cellpadding="0" cellspacing="0"><tr><td style="background:#ffffff;border-radius:16px;padding:12px 18px;">${dentro}</td></tr></table>`;
}

function documento({ titulo: t, preencabezado, logoCid, cuerpo, pie }: { titulo: string; preencabezado: string; logoCid?: string | null; cuerpo: string; pie: string }): string {
  return `<!doctype html>
<html lang="es">
<head>
<meta charset="utf-8">
<meta name="viewport" content="width=device-width, initial-scale=1">
<meta name="color-scheme" content="light dark">
<meta name="supported-color-schemes" content="light dark">
<title>${escapar(t)}</title>
<style>
  body { margin:0; padding:0; background:${C.fondo}; -webkit-text-size-adjust:100%; }
  @media (prefers-color-scheme: dark) {
    body, .fondo { background:${C.oscuro.fondo} !important; }
    .tarjeta { background:${C.oscuro.tarjeta} !important; }
    .texto { color:${C.oscuro.texto} !important; }
    .suave { color:${C.oscuro.suave} !important; }
    .titulo { color:${C.oscuro.titulo} !important; }
    .linea { border-color:${C.oscuro.linea} !important; }
    .caja, .cab { background:${C.oscuro.caja} !important; }
    .cab { color:${C.oscuro.suave} !important; }
    .enlace { color:${C.oscuro.titulo} !important; }
  }
  @media (max-width: 620px) {
    .contenedor { width:100% !important; }
    .relleno { padding:22px 18px !important; }
    .col { display:block !important; width:100% !important; padding-right:0 !important; }
  }
</style>
</head>
<body class="fondo" style="margin:0;padding:0;background:${C.fondo};">
<div style="display:none;max-height:0;overflow:hidden;opacity:0;color:transparent;">${escapar(preencabezado)}</div>
<table role="presentation" width="100%" cellpadding="0" cellspacing="0" class="fondo" style="background:${C.fondo};">
<tr><td align="center" style="padding:24px 12px;">
<table role="presentation" class="contenedor" width="600" cellpadding="0" cellspacing="0" style="width:600px;max-width:100%;">
<tr><td style="padding:0 0 16px;">${cabeceraLogo(logoCid)}</td></tr>
<tr><td class="tarjeta relleno" style="background:${C.tarjeta};border-radius:24px;padding:32px;">${cuerpo}</td></tr>
<tr><td style="padding:20px 8px 0;">${pie}</td></tr>
</table>
</td></tr>
</table>
</body>
</html>`;
}

// ---------- email al equipo ----------

export function correoEquipo(d: DatosCorreo): CorreoListo {
  const s = d.solicitud;
  const n = d.lineas.length;
  const quien = s.negocio || s.nombre;
  const asunto = `Nueva solicitud · ${quien} · ${n ? textoProductos(n) : 'sin productos del catálogo'}`;
  const contacto = nombreDe(CONTACTOS, s.contacto_preferido);
  const tipo = s.tipo_cliente === 'negocio' ? 'Negocio' : 'Particular';
  const whatsapp = whatsappDe(s.telefono);
  const disenos = d.lineas.map((l, i) => ({ l, i })).filter((x) => x.l.diseno);
  const fecha = fechaLarga.format(d.fecha);

  const cuerpo =
    h1('Nueva solicitud') +
    suave(`${escapar(fecha)} (hora de Madrid)`) +
    chips([tipo, `Prefiere ${escapar(contacto)}`, ...(s.tipo_cliente === 'negocio' ? [s.cita === 'local' ? 'Pide visita al local' : 'Sin visita por ahora'] : [])]) +
    titulo('Cliente') +
    filas([
      ['Nombre', escapar(s.nombre)],
      ['Negocio', s.negocio ? escapar(s.negocio) : ''],
      ['Sector', s.sector ? escapar(s.sector) : ''],
      ['Ocasión', s.ocasion ? escapar(s.ocasion) : ''],
      ['Ciudad', s.ciudad ? escapar(s.ciudad) : ''],
      ['Email', enlace(`mailto:${s.email}`, escapar(s.email))],
      ['Teléfono', s.telefono ? `${enlace(`tel:${s.telefono.replace(/\s+/g, '')}`, escapar(s.telefono))}${whatsapp ? ` · ${enlace(whatsapp, 'WhatsApp')}` : ''}` : ''],
      ['Contacto preferido', escapar(contacto)],
    ]) +
    titulo('Qué necesita') +
    (n ? tablaProductos(d.lineas) : suave('No ha añadido productos del catálogo.')) +
    filas([
      ['Otro producto', s.otro_producto ? escapar(s.otro_producto) : ''],
      ['Cantidad aproximada', !n && s.tramo ? escapar(nombreTramo(s.tramo)) : ''],
      ['Para qué es', s.uso.length ? escapar(s.uso.map((u) => nombreDe(USOS, u)).join(', ')) : ''],
      ['Fecha límite', s.fecha_limite ? escapar(fechaLimite(s.fecha_limite)) : ''],
      ['Visita', s.tipo_cliente === 'negocio' ? escapar(nombreDe(CITAS, s.cita)) + (s.cita === 'local' && s.franja ? ` · ${escapar(s.franja)}` : '') : ''],
    ]) +
    titulo('Comentarios') +
    caja(conSaltos(s.mensaje || '(sin comentarios)')) +
    (disenos.length ? titulo('Diseños del estudio') + disenos.map(({ l, i }) => bloqueDiseno(l, i, d.adjuntos, false)).join('') : '') +
    titulo('Adjuntos') +
    listaAdjuntos(d.adjuntos) +
    avisosHtml(d.avisos) +
    titulo('Permisos') +
    filas([
      ['Privacidad', `Política aceptada el ${escapar(fecha)}`],
      ['Uso del logo', s.logo_permiso ? 'Confirma que puede usar el logo o diseño adjunto' : 'No ha marcado la casilla del logo'],
    ]);

  const pie = suave(
    `Enviado desde el formulario «Cuéntanos tu proyecto» de ${escapar(SITE.url.replace('https://', ''))}. Responde a este email para contestar a ${escapar(s.nombre)} (${escapar(s.email)}).` +
      (d.tecnico?.ip ? `<br>IP ${escapar(d.tecnico.ip)}` : '') +
      (d.tecnico?.navegador ? ` · ${escapar(d.tecnico.navegador.slice(0, 120))}` : ''),
    12,
  );

  const lineasTexto = d.lineas.map((l) => `- ${l.nombre} (${l.tipo}) · ${l.color.nombre} · ${textoPosicionesLinea(l) || 'posición sin indicar'} · ${nombreTramo(l.tramo)}${l.diseno ? ` · diseño del estudio (logo ${l.diseno.logo.nombre}${l.diseno.logoDetras ? `, trasero ${l.diseno.logoDetras.nombre}` : ''})` : ''}`);
  const texto = lineas([
    `NUEVA SOLICITUD · ${fecha} (hora de Madrid)`,
    `Tipo: ${tipo} · Prefiere ${contacto}`,
    '',
    'CLIENTE',
    `Nombre: ${s.nombre}`,
    s.negocio ? `Negocio: ${s.negocio}` : null,
    s.sector ? `Sector: ${s.sector}` : null,
    s.ocasion ? `Ocasión: ${s.ocasion}` : null,
    s.ciudad ? `Ciudad: ${s.ciudad}` : null,
    `Email: ${s.email}`,
    s.telefono ? `Teléfono: ${s.telefono}${whatsapp ? ` · ${whatsapp}` : ''}` : null,
    '',
    'QUÉ NECESITA',
    ...(n ? lineasTexto : ['Sin productos del catálogo.']),
    s.otro_producto ? `Otro producto: ${s.otro_producto}` : null,
    !n && s.tramo ? `Cantidad aproximada: ${nombreTramo(s.tramo)}` : null,
    s.uso.length ? `Para qué es: ${s.uso.map((u) => nombreDe(USOS, u)).join(', ')}` : null,
    s.fecha_limite ? `Fecha límite: ${fechaLimite(s.fecha_limite)}` : null,
    s.tipo_cliente === 'negocio' ? `Visita: ${nombreDe(CITAS, s.cita)}${s.cita === 'local' && s.franja ? ` · ${s.franja}` : ''}` : null,
    '',
    'COMENTARIOS',
    s.mensaje || '(sin comentarios)',
    '',
    ...(disenos.length
      ? [
          'DISEÑOS DEL ESTUDIO',
          ...disenos.map(
            ({ l }) =>
              `- ${l.nombre} · ${l.color.nombre} · logo ${l.diseno!.logoDetras ? 'delantero ' : ''}${textoLogo(l.diseno!.logo)}${l.diseno!.logoDetras ? ` · logo trasero ${textoLogo(l.diseno!.logoDetras)}` : ''} · ${l.diseno!.colocaciones.map((c) => textoColocacion(c, Boolean(l.diseno!.logoDetras))).join(' + ') || 'sin posiciones'}`,
          ),
          '',
        ]
      : []),
    'ADJUNTOS',
    ...(d.adjuntos.length ? d.adjuntos.map((a) => `- ${a.nombre} (${formatoBytes(a.tamano)})`) : ['Sin archivos adjuntos.']),
    ...d.avisos.map((a) => `AVISO: ${a}`),
    '',
    `Privacidad aceptada el ${fecha}. Uso del logo: ${s.logo_permiso ? 'confirmado' : 'sin marcar'}.`,
    d.tecnico?.ip ? `IP ${d.tecnico.ip}` : null,
  ]);

  return {
    asunto,
    html: documento({ titulo: asunto, preencabezado: `${tipo} · ${s.email} · prefiere ${contacto.toLowerCase()}`, logoCid: d.logoCid, cuerpo, pie }),
    texto,
  };
}

// ---------- confirmación al cliente ----------
// Fase 9: sobria y ligera. Asunto «Hemos recibido tu solicitud, [nombre]», el resumen en texto (sin tabla de muestras
// ni capturas), tres pasos y como mucho dos enlaces: WhatsApp y la política de privacidad. Sin precios. Solo el logo
// pequeño incrustado; las respuestas van al buzón del equipo (reply-to).

export function correoCliente(d: DatosCorreo): CorreoListo {
  const s = d.solicitud;
  const n = d.lineas.length;
  const asunto = `Hemos recibido tu solicitud, ${s.nombre}`;
  const archivos = d.adjuntos.filter((a) => a.categoria === 'archivo').length;
  const disenos = d.lineas.filter((l) => l.diseno).length;
  const whatsapp = enlaceWhatsApp(MENSAJE_WHATSAPP_PROYECTO_ENVIADO);
  const via = viaContacto(s.contacto_preferido);
  const pasos = [`Revisamos tu proyecto y, si nos falta algún dato, te escribimos ${via}.`, `${TEXTOS.plazoPresupuesto}.`, TEXTOS.plazoEntrega];

  const lineasResumen: string[] = [
    ...d.lineas.map((l) => `${l.nombre} · ${l.color.nombre}${textoPosicionesLinea(l) ? ` · ${textoPosicionesLinea(l)}` : ''} · ${nombreTramo(l.tramo)}${l.diseno ? ' · con tu diseño del estudio' : ''}`),
    ...(s.otro_producto ? [`Otro producto: ${s.otro_producto}`] : []),
    ...(!n && s.tramo ? [`Cantidad aproximada: ${nombreTramo(s.tramo)}`] : []),
    ...(s.uso.length ? [`Para qué es: ${s.uso.map((u) => nombreDe(USOS, u)).join(', ')}`] : []),
    ...(s.fecha_limite ? [`Fecha límite: ${fechaLimite(s.fecha_limite)}`] : []),
    ...(s.tipo_cliente === 'negocio' && s.cita === 'local' ? [`Visita: vamos a tu local con el muestrario${s.franja ? ` · ${s.franja}` : ''}`] : []),
    ...(archivos ? [`Archivos adjuntos: ${archivos}`] : []),
    ...(disenos ? [`Diseños del estudio: ${disenos} (con el logo y las capturas delante y detrás)`] : []),
  ];

  const cuerpo =
    h1(`Hemos recibido tu solicitud, ${escapar(s.nombre)}.`) +
    p(`Gracias por contar con [MARCA]. ${escapar(TEXTOS.plazoPresupuesto.replace('Presupuesto', 'Te respondemos con presupuesto'))}.`) +
    titulo('Qué pasa ahora') +
    `<ol class="texto" style="margin:0 0 14px;padding-left:22px;${estiloTexto}">${pasos.map((t) => `<li style="margin:0 0 6px;">${escapar(t)}</li>`).join('')}</ol>` +
    titulo('Tu resumen') +
    (lineasResumen.length
      ? `<ul class="texto" style="margin:0 0 14px;padding-left:22px;${estiloTexto}">${lineasResumen.map((t) => `<li style="margin:0 0 6px;">${escapar(t)}</li>`).join('')}</ul>`
      : suave('No has añadido productos del catálogo: nos guiamos por tus comentarios.')) +
    (s.mensaje ? titulo('Tus comentarios') + caja(conSaltos(s.mensaje)) : '') +
    titulo('¿Quieres añadir algo?') +
    p('Responde a este email o escríbenos por WhatsApp.') +
    boton(whatsapp, 'Escríbenos por WhatsApp') +
    suave(`También puedes llamarnos al ${escapar(SITE.telefonos[0])}. ${escapar(SITE.horario)}.`);

  const pie =
    suave(`<strong class="texto" style="color:${C.texto};">[MARCA]</strong> · ${escapar(SITE.lema)}<br>${escapar(SITE.direccion.calle)} · ${escapar(SITE.direccion.cp)} ${escapar(SITE.direccion.ciudad)} · ${escapar(SITE.email)}`, 13) +
    suave(
      `Has recibido este email porque has enviado el formulario «Cuéntanos tu proyecto» en ${escapar(SITE.url.replace('https://', ''))}. Usamos tus datos solo para responderte y preparar el presupuesto (${enlace(`${SITE.url}/privacidad`, 'política de privacidad')}).<br>${escapar(SITE.titular.nombre)} (NIF ${escapar(SITE.titular.nif)}).`,
      12,
    );

  const texto = lineas([
    `Hemos recibido tu solicitud, ${s.nombre}.`,
    '',
    `Gracias por contar con [MARCA]. ${TEXTOS.plazoPresupuesto.replace('Presupuesto', 'Te respondemos con presupuesto')}.`,
    '',
    'QUÉ PASA AHORA',
    ...pasos.map((t, i) => `${i + 1}. ${t}`),
    '',
    'TU RESUMEN',
    ...(lineasResumen.length ? lineasResumen.map((t) => `- ${t}`) : ['Sin productos del catálogo: nos guiamos por tus comentarios.']),
    '',
    ...(s.mensaje ? ['TUS COMENTARIOS', s.mensaje, ''] : []),
    '¿QUIERES AÑADIR ALGO?',
    `Responde a este email o escríbenos por WhatsApp: ${whatsapp}`,
    `También puedes llamarnos al ${SITE.telefonos[0]}. ${SITE.horario}.`,
    '',
    `[MARCA] · ${SITE.lema}`,
    `${SITE.direccion.calle} · ${SITE.direccion.cp} ${SITE.direccion.ciudad} · ${SITE.email}`,
    `Has recibido este email porque has enviado el formulario «Cuéntanos tu proyecto» en ${SITE.url.replace('https://', '')}. Usamos tus datos solo para responderte y preparar el presupuesto. Política de privacidad: ${SITE.url}/privacidad`,
    `${SITE.titular.nombre} (NIF ${SITE.titular.nif}).`,
  ]);

  return {
    asunto,
    html: documento({ titulo: asunto, preencabezado: `${TEXTOS.plazoPresupuesto}. Gracias por contar con [MARCA].`, logoCid: d.logoCid, cuerpo, pie }),
    texto,
  };
}
