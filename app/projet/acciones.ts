'use server';

// Action serveur unique des demandes : le panier « Mon projet » (/projet) et le formulaire de devis (/devis) l'appellent
// toutes les deux. Elle vérifie l'antispam, valide tout avec zod (lib/solicitud/esquema.ts), récupère les pièces jointes
// et envoie les deux emails par la couche d'envoi (lib/correo) : l'email interne complet (reply-to vers le client) et
// la confirmation sobre au client, sans prix. Pas de base de données : la demande et ses fichiers arrivent dans la
// boîte de l'atelier. Les fonctions Netlify ont 10 s par requête : le journal note la durée de l'envoi.
//
// Comment l'appeler depuis un autre formulaire (par exemple /devis), côté navigateur :
//
//   import { enviarSolicitud } from '@/app/projet/acciones';
//   import { CAMPO_INICIO, CAMPO_TRAMPA, CLAVE_ARCHIVOS, CLAVE_AVISOS, CLAVE_CESTA } from '@/lib/solicitud/comun';
//   import { prepararEnvio } from '@/lib/solicitud/preparar';
//
//   const fd = new FormData(formulaire);              // champs nommés comme dans datosDeFormulario() (esquema.ts)
//   fd.set('formulario', 'devis');                    // 'projet' par défaut : change le sujet de l'email interne
//   fd.set(CAMPO_INICIO, String(heureDeChargement)); // Date.now() au montage du formulaire (5 s minimum avant envoi)
//   // CAMPO_TRAMPA : <input name={CAMPO_TRAMPA}> caché et vide (champ piège anti-robots)
//   const fichiers = fd.getAll(CLAVE_ARCHIVOS).filter((f): f is File => f instanceof File && f.size > 0);
//   fd.delete(CLAVE_ARCHIVOS);
//   const prepare = await prepararEnvio(articlesDuPanier /* [] sans panier */, fichiers); // 4 Mo max par envoi
//   if ('error' in prepare) { /* afficher prepare.error */ }
//   fd.set(CLAVE_CESTA, JSON.stringify(prepare.lineas));   // facultatif : sans panier, envoyer '[]' ou rien
//   fd.set(CLAVE_AVISOS, JSON.stringify(prepare.avisos));
//   for (const a of prepare.archivos) fd.append(a.clave, a.archivo, a.archivo.name);
//   const resultat = await enviarSolicitud(fd);
//   if (resultat.ok) router.push('/merci');
//   else { /* afficher resultat.mensaje et resultat.campos ; garder la saisie ; proposer WhatsApp */ }
//
// Champs obligatoires : tipo_cliente (particulier | entreprise | club | camping | boutique | association), nombre,
// email, privacidad (case cochée) et negocio pour tout client qui n'est pas un particulier. Tous les autres sont
// facultatifs, y compris les champs B2B : tipo_producto, otro_producto (produit précisé), cantidad (nombre entier),
// tramo, tecnica (dtf | uv | broderie | conseil), emplazamientos, uso (plusieurs), ocasion, fecha_limite (AAAA-MM-JJ),
// sin_logo (case « pas encore de logo »), mensaje, telefono, ciudad, sector, contacto_preferido (email | llamada |
// whatsapp), logo_permiso.

import { headers } from 'next/headers';
import { CID_LOGO, adjuntoLogoMarca } from '@/lib/correo/marca';
import { SITE } from '@/lib/site';
import { correoCliente, correoEquipo, type AdjuntoResumen } from '@/lib/correo/plantillas';
import { destinoEquipo, enviarCorreo, type AdjuntoCorreo } from '@/lib/correo/transporte';
import { recogerAdjuntos, type Adjunto } from '@/lib/solicitud/adjuntos';
import { anotarEnvio, esRobot, ipDe, tiempoSuficiente } from '@/lib/solicitud/antispam';
import { CLAVE_AVISOS, CLAVE_CESTA, formatoBytes, type LineaCesta } from '@/lib/solicitud/comun';
import { datosDeFormulario, erroresDe, esquemaCesta, esquemaSolicitud, type ErrorCampo } from '@/lib/solicitud/esquema';

export type ResultadoEnvio = { ok: true } | { ok: false; mensaje: string; campos?: ErrorCampo[] };

const FALLO = 'Oups, votre demande n’est pas partie. Rien n’est perdu : vos informations sont conservées. Réessayez dans un instant ou envoyez-la-nous sur WhatsApp.';
const CESTA_ILEGIBLE = 'Nous n’avons pas pu lire votre panier. Rechargez la page et réessayez.';

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
    return { ok: false, mensaje: 'Le formulaire est parti un peu trop vite. Relisez votre saisie et cliquez à nouveau sur le bouton d’envoi.' };
  }
  const limite = anotarEnvio(ip);
  if (!limite.permitido) {
    return { ok: false, mensaje: `Vous avez fait plusieurs envois de suite. Patientez ${limite.esperaMinutos ?? 10} minutes ou écrivez-nous sur WhatsApp.` };
  }

  const datos = esquemaSolicitud.safeParse(datosDeFormulario(fd));
  if (!datos.success) return { ok: false, mensaje: 'Vérifiez ces champs avant d’envoyer :', campos: erroresDe(datos.error) };

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
    deNombre: SITE.nombre,
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
        deNombre: SITE.nombre,
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
