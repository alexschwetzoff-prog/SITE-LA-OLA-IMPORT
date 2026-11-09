import 'server-only';

// Fase 6 y fase 9: la única capa de envío de email de la web. Todo lo que manda un correo pasa por enviarCorreo(),
// así que cambiar de proveedor es tocar solo este archivo. Tres transportes:
//   - resend (fase 9): la API de Resend, desde el dominio propio («La Ola Import <bonjour@dominio-pendiente.example>», solo envío).
//     Se activa sin tocar código con CORREO_TRANSPORTE=resend y RESEND_API_KEY. Si Resend falla y hay contraseña de
//     Gmail, el email sale por Gmail (respaldo automático) y queda anotado en el log.
//   - gmail: SMTP de Gmail (smtp.gmail.com, puerto 465, TLS) con la cuenta y una contraseña de aplicación de Google.
//   - archivo: pruebas en local; guarda cada email como carpeta (HTML, texto, cabeceras y adjuntos) en .correo-local/,
//     que git ignora. En producción sin ningún transporte configurado no se envía nada y se avisa.
// Las claves viven solo en .env.local y en el panel de Netlify: nunca en el código ni en la documentación.

import { mkdir, writeFile } from 'node:fs/promises';
import path from 'node:path';
import nodemailer, { type Transporter } from 'nodemailer';
import { Resend } from 'resend';
import { SITE } from '@/lib/site';

export interface AdjuntoCorreo {
  nombre: string;
  tipo: string;
  contenido: Buffer;
  /** Si va incrustado en el HTML (<img src="cid:...">). */
  cid?: string;
}

export interface Direccion {
  nombre?: string;
  email: string;
}

export interface Correo {
  para: Direccion;
  asunto: string;
  html: string;
  texto: string;
  /** Nombre que acompaña al remitente (la dirección la pone el transporte). */
  deNombre?: string;
  responderA?: Direccion;
  adjuntos?: AdjuntoCorreo[];
}

export type Transporte = 'resend' | 'gmail' | 'archivo';

export const CUENTA_POR_DEFECTO = 'email-pendiente@example.com';
/** Remitente de Resend por defecto: solo envío; las respuestas van al buzón del equipo por el reply-to. */
export const REMITENTE_RESEND_POR_DEFECTO = `${SITE.nombre} <bonjour@dominio-pendiente.example>`;

function leerRemitente(texto: string): Direccion {
  const m = texto.trim().match(/^(?:"?([^"<]*?)"?\s*)?<([^>]+)>$/);
  if (m) return { nombre: m[1]?.trim() || undefined, email: m[2].trim() };
  return { email: texto.trim() };
}

export function configuracionCorreo() {
  const usuario = process.env.GMAIL_USUARIO?.trim() || CUENTA_POR_DEFECTO;
  // Google enseña la contraseña de aplicación en grupos de cuatro letras con espacios: se admiten los dos formatos.
  const contrasena = process.env.GMAIL_CONTRASENA_APP?.replace(/\s+/g, '') || '';
  const claveResend = process.env.RESEND_API_KEY?.trim() || '';
  const remitenteResend = leerRemitente(process.env.RESEND_REMITENTE?.trim() || REMITENTE_RESEND_POR_DEFECTO);
  const destino = process.env.CORREO_DESTINO?.trim() || usuario;
  const pedido = process.env.CORREO_TRANSPORTE?.trim();
  const explicito = pedido === 'archivo' || pedido === 'gmail' || pedido === 'resend';
  const transporte: Transporte = explicito ? (pedido as Transporte) : claveResend ? 'resend' : contrasena ? 'gmail' : 'archivo';
  const carpeta = process.env.CORREO_CARPETA_LOCAL?.trim() || '.correo-local';
  return { usuario, contrasena, claveResend, remitenteResend, destino, transporte, carpeta, explicito };
}

/** El remitente de todos los emails: «La Ola Import <bonjour@dominio-pendiente.example>» con Resend; la cuenta de Gmail si no. */
export function remitente(nombre: string = SITE.nombre, transporte?: Transporte): Direccion {
  const c = configuracionCorreo();
  const t = transporte ?? c.transporte;
  if (t === 'resend') return { nombre: nombre || c.remitenteResend.nombre, email: c.remitenteResend.email };
  return { nombre, email: c.usuario };
}

/** Buzón del equipo al que llegan las solicitudes. */
export function destinoEquipo(): Direccion {
  return { nombre: SITE.nombre, email: configuracionCorreo().destino };
}

function textoDireccion(d: Direccion): string {
  return d.nombre ? `${d.nombre.replace(/[<>"]/g, '')} <${d.email}>` : d.email;
}

// ---------- Resend ----------

let clienteResend: Resend | null = null;

function resend(): Resend {
  if (clienteResend) return clienteResend;
  const { claveResend } = configuracionCorreo();
  if (!claveResend) throw new Error('Falta RESEND_API_KEY: sin ella no se puede enviar por Resend.');
  clienteResend = new Resend(claveResend);
  return clienteResend;
}

async function enviarPorResend(correo: Correo): Promise<string> {
  const { data, error } = await resend().emails.send({
    from: textoDireccion(remitente(correo.deNombre, 'resend')),
    to: textoDireccion(correo.para),
    replyTo: correo.responderA ? textoDireccion(correo.responderA) : undefined,
    subject: correo.asunto,
    html: correo.html,
    text: correo.texto,
    attachments: correo.adjuntos?.map((a) => ({ filename: a.nombre, content: a.contenido, contentType: a.tipo, contentId: a.cid })),
  });
  if (error) throw new Error(`Resend: ${error.name} · ${error.message}`);
  return data?.id ?? 'resend';
}

// ---------- Gmail ----------

let transportador: Transporter | null = null;

function gmail(): Transporter {
  if (transportador) return transportador;
  const { usuario, contrasena } = configuracionCorreo();
  if (!contrasena) throw new Error('Falta GMAIL_CONTRASENA_APP: sin ella no se puede enviar por Gmail.');
  transportador = nodemailer.createTransport({
    host: 'smtp.gmail.com',
    port: 465,
    secure: true,
    auth: { user: usuario, pass: contrasena },
  });
  return transportador;
}

function aNodemailer(d: Direccion | undefined) {
  return d ? { name: d.nombre ?? '', address: d.email } : undefined;
}

async function enviarPorGmail(correo: Correo): Promise<string> {
  const info = await gmail().sendMail({
    from: aNodemailer(remitente(correo.deNombre, 'gmail')),
    to: aNodemailer(correo.para),
    replyTo: aNodemailer(correo.responderA),
    subject: correo.asunto,
    text: correo.texto,
    html: correo.html,
    attachments: correo.adjuntos?.map((a) => ({ filename: a.nombre, content: a.contenido, contentType: a.tipo, cid: a.cid })),
  });
  return info.messageId;
}

// ---------- archivo (pruebas) ----------

function nombreCarpeta(asunto: string, fecha: Date): string {
  const sello = fecha.toISOString().replace(/[:.]/g, '-').slice(0, 19);
  const resumen = asunto
    .normalize('NFKD')
    .replace(/[̀-ͯ]/g, '')
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '')
    .slice(0, 60);
  return `${sello}-${resumen || 'correo'}`;
}

/** Raíz de la carpeta de pruebas: el directorio de trabajo, salvo que se indique otro. Se lee así (variable primero) para
 * que el rastreador de archivos de Next no pueda evaluar la ruta y meter el repositorio entero en la función (fase 9). */
function raizCorreoLocal(): string {
  return process.env.CORREO_RAIZ_LOCAL?.trim() || process.cwd();
}

/** Transporte de pruebas: una carpeta por email, con el HTML apuntando a los adjuntos incrustados en local. */
async function guardarEnArchivo(correo: Correo): Promise<string> {
  const { carpeta } = configuracionCorreo();
  const fecha = new Date();
  const destino = path.join(raizCorreoLocal(), carpeta, nombreCarpeta(correo.asunto, fecha));
  await mkdir(path.join(destino, 'adjuntos'), { recursive: true });
  const adjuntos = correo.adjuntos ?? [];
  const porCid = new Map(adjuntos.filter((a) => a.cid).map((a) => [a.cid as string, a.nombre]));
  const html = correo.html.replace(/cid:([A-Za-z0-9._-]+)/g, (todo, cid: string) => (porCid.has(cid) ? `adjuntos/${porCid.get(cid)}` : todo));
  await Promise.all([
    writeFile(path.join(destino, 'correo.html'), html, 'utf8'),
    writeFile(path.join(destino, 'correo.txt'), correo.texto, 'utf8'),
    writeFile(
      path.join(destino, 'cabeceras.json'),
      JSON.stringify(
        {
          fecha: fecha.toISOString(),
          de: remitente(correo.deNombre, 'archivo'),
          para: correo.para,
          responderA: correo.responderA ?? null,
          asunto: correo.asunto,
          adjuntos: adjuntos.map((a) => ({ nombre: a.nombre, tipo: a.tipo, tamano: a.contenido.length, cid: a.cid ?? null })),
        },
        null,
        2,
      ),
      'utf8',
    ),
    ...adjuntos.map((a) => writeFile(path.join(destino, 'adjuntos', a.nombre), a.contenido)),
  ]);
  return destino;
}

// ---------- envío ----------

/**
 * Envía (o guarda) un email y dice por qué transporte ha salido. Lanza un error si no ha podido: quien llama decide
 * qué enseñar. Con Resend, si el envío falla y hay contraseña de Gmail, sale por Gmail (respaldo) y se anota en el log.
 */
export async function enviarCorreo(correo: Correo): Promise<{ id: string; transporte: Transporte }> {
  const { transporte, explicito, contrasena, claveResend } = configuracionCorreo();
  if (transporte === 'archivo') {
    if (process.env.NODE_ENV === 'production' && !explicito) {
      throw new Error('Correo sin configurar en producción: falta RESEND_API_KEY o GMAIL_CONTRASENA_APP (o CORREO_TRANSPORTE=archivo para pruebas).');
    }
    return { id: await guardarEnArchivo(correo), transporte };
  }
  if (transporte === 'resend') {
    if (!claveResend) throw new Error('Falta RESEND_API_KEY.');
    try {
      return { id: await enviarPorResend(correo), transporte };
    } catch (error) {
      if (!contrasena) throw error;
      console.warn('[correo] Resend ha fallado; el email sale por Gmail:', error instanceof Error ? error.message : error);
      return { id: await enviarPorGmail(correo), transporte: 'gmail' };
    }
  }
  if (!contrasena) throw new Error('Falta GMAIL_CONTRASENA_APP.');
  return { id: await enviarPorGmail(correo), transporte };
}
