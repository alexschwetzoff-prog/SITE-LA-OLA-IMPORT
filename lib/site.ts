// Données fixes du site La Ola Import. Tout ce qui est entre crochets est [à confirmer] avec La Ola Import et doit
// être remplacé avant la mise en ligne (scripts/revisar-web.mjs bloque les crochets visibles).
// Règles : ni fournisseur ni coûts ; aucune promesse commerciale (délai, minimum, zone) non validée.

import { MENSAJE_WHATSAPP } from './whatsapp';

export const SITE = {
  nombre: 'La Ola Import',
  url: 'https://dominio-pendiente.example',
  lema: 'Donnez des couleurs à vos idées !',
  tituloPorDefecto: 'La Ola Import · Textiles et objets personnalisés à Monteux (Vaucluse)',
  descripcion:
    'Atelier de personnalisation à Monteux : t-shirts, sweats, casquettes, objets publicitaires et souvenirs à vos couleurs, pour les entreprises, les clubs, les campings, les boutiques et les particuliers.',
  email: 'laolaimport@outlook.fr',
  telefonos: ['06 69 64 28 05'],
  // Numéro WhatsApp au format international sans « + ».
  whatsapp: process.env.NEXT_PUBLIC_WHATSAPP_NUMBER ?? '33000000000' /* [WHATSAPP] */,
  instagram: { usuario: '@instagram-pendiente', url: 'https://www.instagram.com/instagram-pendiente/' },
  facebook: { url: 'https://www.facebook.com/facebook-pendiente' },
  direccion: {
    calle: '350 Chemin du Perussier',
    barrio: '',
    cp: '84170', // Monteux (validé le 11/11/2026 : 84170 et non 84270, qui est Vedène)
    ciudad: 'Monteux',
    region: 'Vaucluse',
    // Lien vers la recherche Google Maps, dans un nouvel onglet : aucun service tiers n'est chargé sur le site.
    mapaUrl: 'https://www.google.com/maps/search/?api=1&query=' + encodeURIComponent('350 Chemin du Perussier, 84170 Monteux'),
  },
  horario: '[HORAIRES]',
  titular: {
    nombre: 'La Ola Impression', // raison sociale ; « La Ola Import » est le nom commercial
    nombreCorto: 'La Ola Import',
    nif: '[SIRET]',
    email: 'laolaimport@outlook.fr',
    direccion: '350 Chemin du Perussier, 84170 Monteux',
    directeurPublication: '[DIRECTEUR DE LA PUBLICATION]',
    registro: '',
  },
} as const;

/** Textes répétés sur tout le site. Aucune promesse commerciale tant que La Ola Import ne l'a pas validée. */
export const TEXTOS = {
  precio: 'Consulter le prix',
  sinIva: 'Prix [HT ou TTC à confirmer].',
  notaPrecios: 'Le prix dépend de la quantité, de la technique et du nombre de couleurs : nous vous faisons un devis sur mesure.',
  pedidoMinimo: 'Quantité minimale : [à confirmer].',
  plazoPresupuesto: 'Réponse de l’atelier sous [délai à confirmer]',
  plazoEntrega: 'Délai de fabrication : [à confirmer].',
  datosCatalogo: ['Atelier à Monteux (Vaucluse)', 'Vous validez le visuel avant impression', 'Retrait ou livraison [à confirmer]'],
} as const;

export const NAV = [
  { href: '/catalogue', etiqueta: 'Catalogue' },
  { href: '/comment-nous-travaillons', etiqueta: 'Comment nous travaillons' },
  { href: '/qui-sommes-nous', etiqueta: 'Qui sommes-nous' },
  { href: '/espace-client', etiqueta: 'Espace client' },
] as const;

export const CTA = { href: '/devis', etiqueta: 'Demander un devis' } as const;

export const SEGMENTS = [
  { slug: 'clubs-sportifs', nom: 'Clubs sportifs', court: 'Club sportif', accroche: 'Maillots, sweats et sacs aux couleurs du club.' },
  { slug: 'campings', nom: 'Campings', court: 'Camping', accroche: 'Tenues d’équipe et boutique souvenirs.' },
  { slug: 'boutiques-souvenirs', nom: 'Boutiques touristiques', court: 'Boutique touristique', accroche: 'Des souvenirs qui donnent envie de revenir.' },
  { slug: 'entreprises', nom: 'Entreprises', court: 'Entreprise', accroche: 'Tenues, goodies et cadeaux qui portent votre marque.' },
] as const;

export const ENLACES_LEGALES = [
  { href: '/mentions-legales', etiqueta: 'Mentions légales' },
  { href: '/confidentialite', etiqueta: 'Confidentialité (RGPD)' },
  { href: '/cookies', etiqueta: 'Cookies' },
  { href: '/cgv', etiqueta: 'CGV' },
] as const;

/** Lien vers WhatsApp. Sans argument, il s'ouvre avec le message général (lib/whatsapp.ts). */
export function enlaceWhatsApp(texto: string = MENSAJE_WHATSAPP): string {
  return `https://wa.me/${SITE.whatsapp}?text=${encodeURIComponent(texto)}`;
}

export function enlaceTelefono(telefono: string): string {
  return `tel:+33${telefono.replace(/\s+/g, '').replace(/^0/, '')}`;
}

/** Adresse complète sur une ligne : « 350 Chemin du Perussier, 84170 Monteux ». */
export function adresseComplete(): string {
  const d = SITE.direccion;
  return `${d.calle}, ${d.cp} ${d.ciudad}`;
}
