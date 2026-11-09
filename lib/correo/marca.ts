import 'server-only';

// Le logo de La Ola Import est incrusté dans les emails (cid), pas lié : il s'affiche même si la messagerie bloque les
// images distantes et sans dépendre de la mise en ligne du site. Le PNG (320 × 180 px, transparent) voyage en base64
// dans lib/correo/logo-email.ts : la fonction qui envoie les emails ne lit pas le disque, elle marche donc pareil sur
// Netlify, sur Vercel ou en local.

import type { AdjuntoCorreo } from './transporte';
import { LOGO_EMAIL_PNG_BASE64 } from './logo-email';

export const CID_LOGO = 'logo-la-ola-import';
/** Taille d'affichage dans l'email : la moitié du PNG (320 × 180), net sur les écrans 2×, en 16:9 comme le fichier. */
export const ANCHO_LOGO_EMAIL = 160;
export const ALTO_LOGO_EMAIL = 90;

let cache: AdjuntoCorreo | null | undefined;

export function adjuntoLogoMarca(): AdjuntoCorreo | null {
  if (cache === undefined) {
    try {
      cache = { nombre: 'logo-la-ola-import.png', tipo: 'image/png', contenido: Buffer.from(LOGO_EMAIL_PNG_BASE64, 'base64'), cid: CID_LOGO };
    } catch {
      cache = null;
    }
  }
  return cache;
}
