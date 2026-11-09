import 'server-only';

// El logo de [MARCA] va incrustado en los emails (cid), no enlazado: así se ve aunque el cliente bloquee las
// imágenes remotas y sin depender de que la web esté publicada. Desde la fase 9 el PNG (320 px sobre blanco, unos
// 12 KB) viaja en base64 dentro de lib/correo/logo-email.ts, generado por scripts/marca/generar-og.py: la función
// que envía los emails no lee el disco, así que funciona igual en Netlify, en Vercel o en local.

import type { AdjuntoCorreo } from './transporte';
import { LOGO_EMAIL_PNG_BASE64 } from './logo-email';

export const CID_LOGO = 'logo-marca';
/** Ancho al que se enseña en el email (el PNG es de 320 px: nítido en pantallas de 2×). */
export const ANCHO_LOGO_EMAIL = 160;

let cache: AdjuntoCorreo | null | undefined;

export function adjuntoLogoMarca(): AdjuntoCorreo | null {
  if (cache === undefined) {
    try {
      cache = { nombre: 'logo-marca.png', tipo: 'image/png', contenido: Buffer.from(LOGO_EMAIL_PNG_BASE64, 'base64'), cid: CID_LOGO };
    } catch {
      cache = null;
    }
  }
  return cache;
}
