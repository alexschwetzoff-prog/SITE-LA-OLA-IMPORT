// Les deux emails d'une demande (panier /projet ou devis /devis), en HTML (styles en ligne, palette claire, lisibles
// sur mobile) et en texte brut. Fonctions pures : elles reçoivent les données déjà validées et renvoient sujet, html
// et texte.
//   - correoEquipo : à l'atelier, avec toutes les données, le panier en tableau et les pièces jointes.
//   - correoCliente : la confirmation, sobre, avec le récapitulatif, les prochaines étapes et le bouton WhatsApp.
//     Jamais de prix.

import { SITE, TEXTOS, enlaceWhatsApp } from '@/lib/site';
import { MENSAJE_WHATSAPP_PROYECTO_ENVIADO } from '@/lib/whatsapp';
import {
  CONTACTOS,
  TECNICAS,
  TIPOS,
  USOS,
  formatoBytes,
  nombreDe,
  nombreLado,
  nombreLogo,
  nombreTramo,
  textoPosicionesLinea,
  type Lado,
  type LineaCesta,
  type LogoLinea,
} from '@/lib/solicitud/comun';
import type { Solicitud } from '@/lib/solicitud/esquema';
import { ALTO_LOGO_EMAIL, ANCHO_LOGO_EMAIL } from './marca';

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
  /** Avertissements du navigateur à la préparation de l'envoi (captures compressées, logo réduit, logo absent…). */
  avisos: string[];
  fecha: Date;
  tecnico?: { ip?: string; navegador?: string };
  /** cid du logo de La Ola Import s'il est incrusté ; sinon l'en-tête porte le nom en texte. */
  logoCid?: string | null;
}

export interface CorreoListo {
  asunto: string;
  html: string;
  texto: string;
}

// Palette claire du site (app/globals.css) : fond blanc, texte marine, bouton d'action fuchsia-700, liens bleu-600.
const C = {
  fondo: '#ffffff',
  tarjeta: '#ffffff',
  texto: '#00063D',
  suave: '#5A6785',
  linea: '#E3E6EE',
  caja: '#F8F9FA',
  boton: '#B809C6',
  enlace: '#0363E9',
};
const FUENTE = "-apple-system, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif";
const DOMINIO = SITE.url.replace('https://', '');

export function escapar(s: string): string {
  return s.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;').replace(/'/g, '&#39;');
}
const conSaltos = (s: string) => escapar(s).replace(/\r?\n/g, '<br>');

const fechaLarga = new Intl.DateTimeFormat('fr-FR', { dateStyle: 'full', timeStyle: 'short', timeZone: 'Europe/Paris' });
const soloFecha = new Intl.DateTimeFormat('fr-FR', { dateStyle: 'long', timeZone: 'Europe/Paris' });

function fechaLimite(iso?: string): string {
  if (!iso) return '';
  const [a, m, d] = iso.split('-').map(Number);
  return soloFecha.format(new Date(Date.UTC(a, m - 1, d, 12)));
}

/** Lien WhatsApp à partir d'un numéro français écrit de n'importe quelle façon (06…, +33 6…, 0033 6…), ou rien. */
function whatsappDe(telefono?: string): string | null {
  if (!telefono) return null;
  let digitos = telefono.replace(/\D/g, '');
  if (digitos.startsWith('00')) digitos = digitos.slice(2);
  if (/^0[67]\d{8}$/.test(digitos)) return `https://wa.me/33${digitos.slice(1)}`;
  if (/^33[67]\d{8}$/.test(digitos)) return `https://wa.me/${digitos}`;
  return null;
}

function textoProductos(n: number): string {
  return n === 1 ? '1 produit' : `${n} produits`;
}

/** « par WhatsApp », « par téléphone », « par email » : le moyen de contact dans une phrase. */
function viaContacto(id: Solicitud['contacto_preferido']): string {
  return id === 'llamada' ? 'par téléphone' : id === 'whatsapp' ? 'sur WhatsApp' : 'par email';
}

function nombreFormulario(s: Solicitud): string {
  return s.formulario === 'devis' ? 'Demande de devis' : 'Mon projet';
}

function direccionTexto(): string {
  const d = SITE.direccion;
  return [d.calle, d.barrio, `${d.cp} ${d.ciudad}`.trim()].filter(Boolean).join(', ');
}

/** Joint les lignes du texte brut : `null` est une ligne absente ; '' une ligne vide qui se conserve. */
function lineas(partes: (string | null)[]): string {
  return partes
    .filter((l): l is string => l !== null)
    .join('\n')
    .replace(/\n{3,}/g, '\n\n')
    .trim();
}

// ---------- morceaux de HTML ----------

const estiloTexto = `font-family:${FUENTE};font-size:16px;line-height:1.55;color:${C.texto};`;

function h1(texto: string): string {
  return `<h1 style="margin:0 0 12px;font-family:${FUENTE};font-size:24px;line-height:1.25;font-weight:700;color:${C.texto};">${texto}</h1>`;
}
function p(html: string, extra = ''): string {
  return `<p style="margin:0 0 14px;${estiloTexto}${extra}">${html}</p>`;
}
function suave(html: string, tamano = 14): string {
  return `<p style="margin:0 0 10px;font-family:${FUENTE};font-size:${tamano}px;line-height:1.5;color:${C.suave};">${html}</p>`;
}
function titulo(texto: string): string {
  return `<h2 style="margin:28px 0 10px;font-family:${FUENTE};font-size:13px;line-height:1.3;font-weight:700;letter-spacing:.08em;text-transform:uppercase;color:${C.texto};">${texto}</h2>`;
}
function enlace(href: string, texto: string): string {
  return `<a href="${escapar(href)}" style="color:${C.enlace};text-decoration:underline;text-underline-offset:3px;">${texto}</a>`;
}
function boton(href: string, texto: string): string {
  return (
    `<table role="presentation" cellpadding="0" cellspacing="0" style="margin:6px 0 12px;"><tr><td style="background:${C.boton};border-radius:999px;">` +
    `<a href="${escapar(href)}" style="display:inline-block;padding:13px 24px;font-family:${FUENTE};font-size:16px;font-weight:700;color:#ffffff;text-decoration:none;border-radius:999px;">${texto}</a></td></tr></table>`
  );
}
function caja(html: string): string {
  return `<table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="margin:0 0 14px;"><tr><td style="background:${C.caja};border:1px solid ${C.linea};border-radius:16px;padding:16px 18px;${estiloTexto}">${html}</td></tr></table>`;
}
function chips(items: string[]): string {
  return `<p style="margin:0 0 6px;">${items
    .map((t) => `<span style="display:inline-block;margin:0 6px 6px 0;padding:5px 12px;border-radius:999px;background:${C.caja};border:1px solid ${C.linea};font-family:${FUENTE};font-size:13px;font-weight:600;color:${C.texto};">${t}</span>`)
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
          `<tr><td width="34%" style="padding:7px 12px 7px 0;border-bottom:1px solid ${C.linea};font-family:${FUENTE};font-size:14px;line-height:1.45;color:${C.suave};vertical-align:top;">${k}</td>` +
          `<td style="padding:7px 0;border-bottom:1px solid ${C.linea};${estiloTexto}font-size:15px;vertical-align:top;">${v}</td></tr>`,
      )
      .join('') +
    `</table>`
  );
}
function muestra(color: LineaCesta['color']): string {
  const fondo = color.hexSecundario ? `linear-gradient(135deg, ${color.hex} 50%, ${color.hexSecundario} 50%)` : color.hex;
  return `<span style="display:inline-block;width:12px;height:12px;margin-right:6px;border-radius:50%;background:${escapar(fondo)};border:1px solid rgba(0,6,61,.25);vertical-align:-1px;"></span>${escapar(color.nombre)}`;
}
function tablaProductos(lineas: LineaCesta[]): string {
  const th = (t: string) => `<th align="left" style="padding:9px 10px;background:${C.caja};font-family:${FUENTE};font-size:12px;letter-spacing:.06em;text-transform:uppercase;color:${C.suave};">${t}</th>`;
  const td = (h: string) => `<td style="padding:10px;border-bottom:1px solid ${C.linea};${estiloTexto}font-size:15px;vertical-align:top;">${h}</td>`;
  return (
    `<table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="margin:0 0 12px;border-collapse:collapse;">` +
    `<tr>${th('Produit')}${th('Couleur')}${th('Emplacement')}${th('Quantité')}</tr>` +
    lineas
      .map((l) => {
        const posicion = textoPosicionesLinea(l);
        const detalle = l.diseno
          ? `<br><span style="font-size:13px;color:${C.suave};">Visuel du studio · logo ${escapar(l.diseno.logo.nombre)}${l.diseno.logoDetras ? ` · arrière ${escapar(l.diseno.logoDetras.nombre)}` : ''}</span>`
          : '';
        return `<tr>${td(`<strong>${escapar(l.nombre)}</strong><br><span style="font-size:13px;color:${C.suave};">${escapar(l.tipo)}</span>${detalle}`)}${td(muestra(l.color))}${td(posicion ? escapar(posicion) : `<span style="color:${C.suave};">Non précisé</span>`)}${td(escapar(nombreTramo(l.tramo)))}</tr>`;
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
          `<img src="cid:${c.cid}" alt="Visuel ${c.lado === 'delante' ? 'devant' : 'derrière'}" width="260" style="display:block;width:100%;max-width:260px;height:auto;border-radius:12px;border:1px solid ${C.linea};background:#ffffff;">` +
          `<span style="display:block;margin-top:4px;font-family:${FUENTE};font-size:12px;color:${C.suave};">${c.lado ? nombreLado(c.lado) : ''}</span></td>`,
      )
      .join('') +
    `</tr></table>`
  );
}

type ColocacionDe<D> = D extends { colocaciones: (infer K)[] } ? K : never;

/** « Devant · Cœur · 8 × 5,2 cm (logo avant) » : emplacement et taille de chaque logo. */
function textoColocacion(c: ColocacionDe<LineaCesta['diseno']>, conLogo: boolean): string {
  const lado = c.lado ? `${nombreLado(c.lado)} · ` : '';
  const logo = conLogo && c.lado ? ` (logo ${nombreLogo(c.lado)})` : '';
  return `${lado}${c.nombre} · ${c.anchoCm.toLocaleString('fr-FR')} × ${c.altoCm.toLocaleString('fr-FR')} cm${logo}`;
}

function textoLogo(logo: LogoLinea): string {
  return `${logo.nombre} · ${logo.vectorial ? 'vectoriel' : `${logo.ancho} × ${logo.alto} px`}${logo.fondoQuitado ? ' · fond blanc retiré' : ''}`;
}

function bloqueDiseno(l: LineaCesta, indice: number, adjuntos: AdjuntoResumen[]): string {
  const d = l.diseno!;
  const conDos = Boolean(d.logoDetras);
  const colocaciones = d.colocaciones.map((c) => escapar(textoColocacion(c, conDos))).join(' + ') || 'aucun emplacement';
  const logo = filas([
    [conDos ? 'Logo avant' : 'Logo', escapar(textoLogo(d.logo))],
    ['Logo arrière', d.logoDetras ? escapar(textoLogo(d.logoDetras)) : ''],
    ['Emplacements', colocaciones],
  ]);
  return caja(`<strong>${escapar(l.nombre)}</strong> · ${muestra(l.color)}${logo}${capturasInline(adjuntos, indice)}`);
}
function listaAdjuntos(adjuntos: AdjuntoResumen[]): string {
  if (!adjuntos.length) return suave('Aucune pièce jointe.');
  return (
    `<ul style="margin:0 0 10px;padding-left:20px;${estiloTexto}font-size:15px;">` +
    adjuntos.map((a) => `<li style="margin:0 0 4px;">${escapar(a.nombre)} <span style="color:${C.suave};">· ${formatoBytes(a.tamano)}</span></li>`).join('') +
    `</ul>` +
    suave(`Total : ${formatoBytes(adjuntos.reduce((s, a) => s + a.tamano, 0))}.`)
  );
}
function avisosHtml(avisos: string[]): string {
  return avisos.map((a) => caja(`<strong>À noter.</strong> ${escapar(a)}`)).join('');
}

function cabeceraLogo(logoCid?: string | null): string {
  const dentro = logoCid
    ? `<img src="cid:${logoCid}" width="${ANCHO_LOGO_EMAIL}" height="${ALTO_LOGO_EMAIL}" alt="${escapar(SITE.nombre)}" style="display:block;width:${ANCHO_LOGO_EMAIL}px;height:${ALTO_LOGO_EMAIL}px;border:0;">`
    : `<span style="font-family:${FUENTE};font-size:22px;font-weight:700;color:${C.texto};">${escapar(SITE.nombre)}</span>`;
  return `<table role="presentation" cellpadding="0" cellspacing="0"><tr><td style="padding:0 4px;">${dentro}</td></tr></table>`;
}

/** Pied commun : La Ola Import · slogan · adresse à Monteux · email. */
function pieMarca(): string {
  return suave(
    `<strong style="color:${C.texto};">${escapar(SITE.nombre)}</strong> · ${escapar(SITE.lema)}<br>${escapar(direccionTexto())} · ${enlace(`mailto:${SITE.email}`, escapar(SITE.email))}`,
    13,
  );
}
function pieMarcaTexto(): string[] {
  return [`${SITE.nombre} · ${SITE.lema}`, `${direccionTexto()} · ${SITE.email}`];
}

function documento({ titulo: t, preencabezado, logoCid, cuerpo, pie }: { titulo: string; preencabezado: string; logoCid?: string | null; cuerpo: string; pie: string }): string {
  return `<!doctype html>
<html lang="fr">
<head>
<meta charset="utf-8">
<meta name="viewport" content="width=device-width, initial-scale=1">
<meta name="color-scheme" content="light">
<meta name="supported-color-schemes" content="light">
<title>${escapar(t)}</title>
<style>
  :root { color-scheme: light; supported-color-schemes: light; }
  body { margin:0; padding:0; background:${C.fondo}; -webkit-text-size-adjust:100%; }
  @media (max-width: 620px) {
    .contenedor { width:100% !important; }
    .relleno { padding:22px 18px !important; }
    .col { display:block !important; width:100% !important; padding-right:0 !important; }
  }
</style>
</head>
<body style="margin:0;padding:0;background:${C.fondo};">
<div style="display:none;max-height:0;overflow:hidden;opacity:0;color:transparent;">${escapar(preencabezado)}</div>
<table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="background:${C.fondo};">
<tr><td align="center" style="padding:24px 12px;">
<table role="presentation" class="contenedor" width="600" cellpadding="0" cellspacing="0" style="width:600px;max-width:100%;">
<tr><td style="padding:0 0 16px;">${cabeceraLogo(logoCid)}</td></tr>
<tr><td class="relleno" style="background:${C.tarjeta};border:1px solid ${C.linea};border-radius:16px;padding:32px;">${cuerpo}</td></tr>
<tr><td style="padding:20px 8px 0;">${pie}</td></tr>
</table>
</td></tr>
</table>
</body>
</html>`;
}

/** Détails du projet hors panier (champs B2B facultatifs compris), en paires libellé / valeur brute. */
function detallesProyecto(s: Solicitud, conLineas: boolean): [string, string][] {
  return [
    ['Type de produit', s.tipo_producto ?? ''],
    ['Produit précisé', s.otro_producto ?? ''],
    ['Quantité', s.cantidad ? s.cantidad.toLocaleString('fr-FR') : ''],
    ['Quantité approximative', !conLineas && s.tramo ? nombreTramo(s.tramo) : ''],
    ['Technique', s.tecnica ? nombreDe(TECNICAS, s.tecnica) : ''],
    ['Emplacements', s.emplazamientos ?? ''],
    ['Usage', s.uso.length ? s.uso.map((u) => nombreDe(USOS, u)).join(', ') : ''],
    ['Occasion', s.ocasion ?? ''],
    ['Date souhaitée', s.fecha_limite ? fechaLimite(s.fecha_limite) : ''],
    ['Logo', s.sin_logo ? 'Pas encore de logo' : ''],
  ];
}

// ---------- email à l'atelier ----------

export function correoEquipo(d: DatosCorreo): CorreoListo {
  const s = d.solicitud;
  const n = d.lineas.length;
  const quien = s.negocio || s.nombre;
  const asunto = `${s.formulario === 'devis' ? 'Nouvelle demande de devis' : 'Nouvelle demande'} · ${quien} · ${n ? textoProductos(n) : 'sans produit du catalogue'}`;
  const contacto = nombreDe(CONTACTOS, s.contacto_preferido);
  const tipo = nombreDe(TIPOS, s.tipo_cliente);
  const whatsapp = whatsappDe(s.telefono);
  const disenos = d.lineas.map((l, i) => ({ l, i })).filter((x) => x.l.diseno);
  const fecha = fechaLarga.format(d.fecha);
  const detalles = detallesProyecto(s, n > 0);

  const cuerpo =
    h1(escapar(s.formulario === 'devis' ? 'Nouvelle demande de devis' : 'Nouvelle demande')) +
    suave(`${escapar(fecha)} (heure de Paris)`) +
    chips([escapar(tipo), `Préfère : ${escapar(contacto)}`, `Formulaire : ${escapar(nombreFormulario(s))}`]) +
    titulo('Client') +
    filas([
      ['Nom', escapar(s.nombre)],
      ['Structure', s.negocio ? escapar(s.negocio) : ''],
      ['Activité', s.sector ? escapar(s.sector) : ''],
      ['Ville', s.ciudad ? escapar(s.ciudad) : ''],
      ['Email', enlace(`mailto:${s.email}`, escapar(s.email))],
      ['Téléphone', s.telefono ? `${enlace(`tel:${s.telefono.replace(/\s+/g, '')}`, escapar(s.telefono))}${whatsapp ? ` · ${enlace(whatsapp, 'WhatsApp')}` : ''}` : ''],
      ['Contact préféré', escapar(contacto)],
    ]) +
    titulo('Projet') +
    (n ? tablaProductos(d.lineas) : suave('Aucun produit du catalogue dans le panier.')) +
    filas(detalles.map(([k, v]) => [k, v ? escapar(v) : ''])) +
    titulo('Commentaires') +
    caja(conSaltos(s.mensaje || '(aucun commentaire)')) +
    (disenos.length ? titulo('Visuels du studio') + disenos.map(({ l, i }) => bloqueDiseno(l, i, d.adjuntos)).join('') : '') +
    titulo('Pièces jointes') +
    listaAdjuntos(d.adjuntos) +
    avisosHtml(d.avisos) +
    titulo('Autorisations') +
    filas([
      ['Confidentialité', `Politique acceptée le ${escapar(fecha)}`],
      ['Utilisation du logo', s.logo_permiso ? 'Confirme pouvoir utiliser le logo ou le visuel joint' : 'Case du logo non cochée'],
    ]);

  const pie =
    suave(
      `Envoyé depuis le formulaire « ${escapar(nombreFormulario(s))} » de ${escapar(DOMINIO)}. Répondez à cet email pour écrire à ${escapar(s.nombre)} (${escapar(s.email)}).` +
        (d.tecnico?.ip ? `<br>IP ${escapar(d.tecnico.ip)}` : '') +
        (d.tecnico?.navegador ? ` · ${escapar(d.tecnico.navegador.slice(0, 120))}` : ''),
      12,
    ) + pieMarca();

  const lineasTexto = d.lineas.map(
    (l) =>
      `- ${l.nombre} (${l.tipo}) · ${l.color.nombre} · ${textoPosicionesLinea(l) || 'emplacement non précisé'} · ${nombreTramo(l.tramo)}${l.diseno ? ` · visuel du studio (logo ${l.diseno.logo.nombre}${l.diseno.logoDetras ? `, arrière ${l.diseno.logoDetras.nombre}` : ''})` : ''}`,
  );
  const texto = lineas([
    `${asunto.toUpperCase()}`,
    `${fecha} (heure de Paris)`,
    `${tipo} · Préfère : ${contacto} · Formulaire : ${nombreFormulario(s)}`,
    '',
    'CLIENT',
    `Nom : ${s.nombre}`,
    s.negocio ? `Structure : ${s.negocio}` : null,
    s.sector ? `Activité : ${s.sector}` : null,
    s.ciudad ? `Ville : ${s.ciudad}` : null,
    `Email : ${s.email}`,
    s.telefono ? `Téléphone : ${s.telefono}${whatsapp ? ` · ${whatsapp}` : ''}` : null,
    '',
    'PROJET',
    ...(n ? lineasTexto : ['Aucun produit du catalogue dans le panier.']),
    ...detalles.filter(([, v]) => v).map(([k, v]) => `${k} : ${v}`),
    '',
    'COMMENTAIRES',
    s.mensaje || '(aucun commentaire)',
    '',
    ...(disenos.length
      ? [
          'VISUELS DU STUDIO',
          ...disenos.map(({ l }) => {
            const dis = l.diseno!;
            const conDos = Boolean(dis.logoDetras);
            return `- ${l.nombre} · ${l.color.nombre} · logo ${conDos ? 'avant ' : ''}${textoLogo(dis.logo)}${dis.logoDetras ? ` · logo arrière ${textoLogo(dis.logoDetras)}` : ''} · ${dis.colocaciones.map((c) => textoColocacion(c, conDos)).join(' + ') || 'aucun emplacement'}`;
          }),
          '',
        ]
      : []),
    'PIÈCES JOINTES',
    ...(d.adjuntos.length ? d.adjuntos.map((a) => `- ${a.nombre} (${formatoBytes(a.tamano)})`) : ['Aucune pièce jointe.']),
    ...d.avisos.map((a) => `À NOTER : ${a}`),
    '',
    `Confidentialité acceptée le ${fecha}. Utilisation du logo : ${s.logo_permiso ? 'confirmée' : 'case non cochée'}.`,
    d.tecnico?.ip ? `IP ${d.tecnico.ip}` : null,
  ]);

  return {
    asunto,
    html: documento({ titulo: asunto, preencabezado: `${tipo} · ${s.email} · préfère ${contacto}`, logoCid: d.logoCid, cuerpo, pie }),
    texto,
  };
}

// ---------- confirmation au client ----------
// Sobre et légère : le récapitulatif en texte (ni tableau, ni captures, ni pièces jointes), trois étapes et deux liens
// au plus (WhatsApp et la politique de confidentialité). Jamais de prix. Seul le petit logo est incrusté ; les réponses
// vont à la boîte de l'atelier (reply-to).

export function correoCliente(d: DatosCorreo): CorreoListo {
  const s = d.solicitud;
  const n = d.lineas.length;
  const asunto = `Nous avons bien reçu votre demande, ${s.nombre}`;
  const archivos = d.adjuntos.filter((a) => a.categoria === 'archivo').length;
  const disenos = d.lineas.filter((l) => l.diseno).length;
  const whatsapp = enlaceWhatsApp(MENSAJE_WHATSAPP_PROYECTO_ENVIADO);
  const via = viaContacto(s.contacto_preferido);
  const plazo = `${TEXTOS.plazoPresupuesto}.`;
  const pasos = [
    `Nous étudions votre demande. S’il manque une information, nous vous écrivons ${via}.`,
    `Nous vous envoyons un devis sur mesure. ${plazo}`,
    `${TEXTOS.datosCatalogo[1]}.`,
  ];

  const lineasResumen: string[] = [
    ...d.lineas.map((l) => `${l.nombre} · ${l.color.nombre}${textoPosicionesLinea(l) ? ` · ${textoPosicionesLinea(l)}` : ''} · ${nombreTramo(l.tramo)}${l.diseno ? ' · avec votre visuel du studio' : ''}`),
    ...detallesProyecto(s, n > 0)
      .filter(([, v]) => v)
      .map(([k, v]) => `${k} : ${v}`),
    ...(archivos ? [`Fichiers joints : ${archivos}`] : []),
    ...(disenos ? [`Visuels du studio : ${disenos} (logo et aperçus devant et derrière)`] : []),
  ];

  const cuerpo =
    h1(`Bonjour ${escapar(s.nombre)},`) +
    p(`Nous avons bien reçu votre demande. Merci de votre confiance ! Notre équipe l’étudie et revient vers vous avec un devis.`) +
    titulo('La suite') +
    `<ol style="margin:0 0 14px;padding-left:22px;${estiloTexto}">${pasos.map((t) => `<li style="margin:0 0 6px;">${escapar(t)}</li>`).join('')}</ol>` +
    titulo('Votre récapitulatif') +
    (lineasResumen.length
      ? `<ul style="margin:0 0 14px;padding-left:22px;${estiloTexto}">${lineasResumen.map((t) => `<li style="margin:0 0 6px;">${escapar(t)}</li>`).join('')}</ul>`
      : suave('Pas de produit du catalogue : nous partons de vos commentaires.')) +
    (s.mensaje ? titulo('Vos commentaires') + caja(conSaltos(s.mensaje)) : '') +
    titulo('Une précision à ajouter ?') +
    p('Répondez simplement à cet email ou écrivez-nous sur WhatsApp.') +
    boton(whatsapp, 'Écrire sur WhatsApp') +
    suave(`Vous pouvez aussi nous appeler au ${escapar(SITE.telefonos[0])} (${escapar(SITE.horario)}).`) +
    p(`À très vite,<br>l’équipe de ${escapar(SITE.nombre)}`, 'margin-top:24px;');

  const pie =
    pieMarca() +
    suave(
      `Vous recevez cet email parce que vous avez envoyé une demande sur ${escapar(DOMINIO)}. Nous utilisons vos données uniquement pour répondre à votre demande (${enlace(`${SITE.url}/confidentialite`, 'politique de confidentialité')}).`,
      12,
    );

  const texto = lineas([
    `Bonjour ${s.nombre},`,
    '',
    'Nous avons bien reçu votre demande. Merci de votre confiance ! Notre équipe l’étudie et revient vers vous avec un devis.',
    '',
    'LA SUITE',
    ...pasos.map((t, i) => `${i + 1}. ${t}`),
    '',
    'VOTRE RÉCAPITULATIF',
    ...(lineasResumen.length ? lineasResumen.map((t) => `- ${t}`) : ['Pas de produit du catalogue : nous partons de vos commentaires.']),
    '',
    ...(s.mensaje ? ['VOS COMMENTAIRES', s.mensaje, ''] : []),
    'UNE PRÉCISION À AJOUTER ?',
    `Répondez simplement à cet email ou écrivez-nous sur WhatsApp : ${whatsapp}`,
    `Vous pouvez aussi nous appeler au ${SITE.telefonos[0]} (${SITE.horario}).`,
    '',
    'À très vite,',
    `l’équipe de ${SITE.nombre}`,
    '',
    ...pieMarcaTexto(),
    `Vous recevez cet email parce que vous avez envoyé une demande sur ${DOMINIO}. Nous utilisons vos données uniquement pour répondre à votre demande. Politique de confidentialité : ${SITE.url}/confidentialite`,
  ]);

  return {
    asunto,
    html: documento({ titulo: asunto, preencabezado: `Votre demande est bien arrivée à l’atelier. ${plazo}`, logoCid: d.logoCid, cuerpo, pie }),
    texto,
  };
}
