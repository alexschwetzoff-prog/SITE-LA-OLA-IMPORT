'use server';

// Fase 6: la acción de servidor que recibe el formulario «Cuéntanos tu proyecto». Comprueba el antispam, valida todo
// con zod (los dos modos), recoge los adjuntos y manda los dos emails por la capa de correo (lib/correo). No usa
// base de datos: la solicitud y sus archivos quedan en el buzón de Gmail del equipo.
// Fase 9: la confirmación al cliente es sobria (sin capturas ni archivos, solo el logo pequeño) y el log anota cuánto
// ha tardado el envío: las funciones de Netlify tienen 10 s por petición.

import { headers } from 'next/headers';
import { CID_LOGO, adjuntoLogoMarca } from '@/lib/correo/marca';
import { correoCliente, correoEquipo, type AdjuntoResumen } from '@/lib/correo/plantillas';
import { destinoEquipo, enviarCorreo, type AdjuntoCorreo } from '@/lib/correo/transporte';
import { recogerAdjuntos, type Adjunto } from '@/lib/solicitud/adjuntos';
import { anotarEnvio, esRobot, ipDe, tiempoSuficiente } from '@/lib/solicitud/antispam';
import { CLAVE_AVISOS, CLAVE_CESTA, formatoBytes, type LineaCesta } from '@/lib/solicitud/comun';
import { datosDeFormulario, erroresDe, esquemaCesta, esquemaSolicitud, type ErrorCampo } from '@/lib/solicitud/esquema';

export type ResultadoEnvio = { ok: true } | { ok: false; mensaje: string; campos?: ErrorCampo[] };

const FALLO = 'No hemos podido enviar tu solicitud. Prueba otra vez en un momento o escríbenos por WhatsApp: lo que has rellenado sigue aquí.';
const CESTA_ILEGIBLE = 'No hemos podido leer tu cesta. Recarga la página y vuelve a intentarlo.';

function resumen(a: Adjunto): AdjuntoResumen {
  return { nombre: a.nombre, tamano: a.tamano, categoria: a.categoria, linea: a.linea, lado: a.lado, cid: a.cid };
}

function aAdjuntoCorreo(a: Adjunto): AdjuntoCorreo {
  return { nombre: a.nombre, tipo: a.tipo, contenido: a.contenido, cid: a.cid };
}

function leerAvisos(fd: FormData): string[] {
  const crudo = fd.get(CLAVE_AVISOS);
  if (typeof crudo !== 'string' || !crudo) return [];
  try {
    const lista: unknown = JSON.parse(crudo);
    return Array.isArray(lista) ? lista.filter((x): x is string => typeof x === 'string').slice(0, 10).map((x) => x.slice(0, 300)) : [];
  } catch {
    return [];
  }
}

export async function enviarSolicitud(fd: FormData): Promise<ResultadoEnvio> {
  try {
    return await procesar(fd);
  } catch (error) {
    console.error('[solicitud] no se ha podido enviar:', error instanceof Error ? error.message : error);
    return { ok: false, mensaje: FALLO };
  }
}

async function procesar(fd: FormData): Promise<ResultadoEnvio> {
  const inicio = Date.now();
  const cabeceras = await headers();
  const ip = ipDe(cabeceras);

  // Antispam: al robot se le dice que sí y no se envía nada; a la persona se le explica qué pasa.
  if (esRobot(fd)) return { ok: true };
  if (!tiempoSuficiente(fd)) {
    return { ok: false, mensaje: 'El formulario se ha enviado demasiado deprisa. Revisa lo que has escrito y vuelve a pulsar «Enviar mi proyecto».' };
  }
  const limite = anotarEnvio(ip);
  if (!limite.permitido) {
    return { ok: false, mensaje: `Has hecho varios envíos seguidos. Espera ${limite.esperaMinutos ?? 10} minutos o escríbenos por WhatsApp.` };
  }

  const datos = esquemaSolicitud.safeParse(datosDeFormulario(fd));
  if (!datos.success) return { ok: false, mensaje: 'Revisa estos campos antes de enviar:', campos: erroresDe(datos.error) };

  let lineas: LineaCesta[] = [];
  const cestaCruda = fd.get(CLAVE_CESTA);
  if (typeof cestaCruda === 'string' && cestaCruda) {
    let json: unknown;
    try {
      json = JSON.parse(cestaCruda);
    } catch {
      return { ok: false, mensaje: CESTA_ILEGIBLE };
    }
    const cesta = esquemaCesta.safeParse(json);
    if (!cesta.success) return { ok: false, mensaje: CESTA_ILEGIBLE };
    lineas = cesta.data;
  }

  const recogidos = await recogerAdjuntos(fd, lineas);
  if ('error' in recogidos) return { ok: false, mensaje: recogidos.error };

  const logoMarca = adjuntoLogoMarca();
  const comunes = {
    solicitud: datos.data,
    lineas,
    adjuntos: recogidos.adjuntos.map(resumen),
    avisos: leerAvisos(fd),
    fecha: new Date(),
    logoCid: logoMarca ? CID_LOGO : null,
  };

  // 1. Al equipo, con todo. Si esto falla, la solicitud no se ha recibido y el cliente lo tiene que saber.
  const equipo = correoEquipo({ ...comunes, tecnico: { ip, navegador: cabeceras.get('user-agent') ?? undefined } });
  const envio = await enviarCorreo({
    para: destinoEquipo(),
    deNombre: '[MARCA]',
    asunto: equipo.asunto,
    html: equipo.html,
    texto: equipo.texto,
    responderA: { nombre: datos.data.nombre, email: datos.data.email },
    adjuntos: [...(logoMarca ? [logoMarca] : []), ...recogidos.adjuntos.map(aAdjuntoCorreo)],
  });
  const trasEquipo = Date.now();

  // 2. La confirmación al cliente: sobria, con su resumen en texto y sin adjuntos (solo el logo pequeño incrustado).
  const cliente = correoCliente(comunes);
  let confirmacion = 'no enviada';
  try {
    confirmacion = (
      await enviarCorreo({
        para: { nombre: datos.data.nombre, email: datos.data.email },
        deNombre: '[MARCA]',
        asunto: cliente.asunto,
        html: cliente.html,
        texto: cliente.texto,
        responderA: destinoEquipo(),
        adjuntos: logoMarca ? [logoMarca] : [],
      })
    ).transporte;
  } catch (error) {
    // El equipo ya tiene la solicitud: se anota y se sigue.
    console.error('[solicitud] la confirmación al cliente no ha salido:', error instanceof Error ? error.message : error);
  }

  const fin = Date.now();
  console.log(
    `[solicitud] enviada por ${envio.transporte} (confirmación: ${confirmacion}): ${lineas.length} líneas, ${recogidos.adjuntos.length} adjuntos (${formatoBytes(recogidos.total)}) · equipo ${trasEquipo - inicio} ms · cliente ${fin - trasEquipo} ms · total ${fin - inicio} ms`,
  );
  return { ok: true };
}
