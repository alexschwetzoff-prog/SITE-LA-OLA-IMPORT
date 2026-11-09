// Datos fijos del sitio. Fuente: docs/SPEC.md (secciones 4, 10 y 12) y el catálogo PDF 2026-2027.
// Reglas: ni proveedor ni costes; plazos solo los de CLAUDE.md.

import { MENSAJE_WHATSAPP } from './whatsapp';

export const SITE = {
  nombre: '[MARCA]',
  url: 'https://dominio-pendiente.example',
  lema: '[LEMA]',
  tituloPorDefecto: '[MARCA] · Tu logo en textil y merchandising, en Valencia',
  descripcion:
    'Personalizamos camisetas, sudaderas, gorras, bolsas y merchandising con tu logo, con impresión digital y sede en Valencia. Presupuesto en 24 h laborables.',
  email: 'email-pendiente@example.com',
  telefonos: ['[TELÉFONO]'],
  // Número de WhatsApp en formato internacional sin "+". Por defecto, el primer teléfono del catálogo.
  whatsapp: process.env.NEXT_PUBLIC_WHATSAPP_NUMBER ?? '34000000000' /* [WHATSAPP] */,
  instagram: { usuario: '@instagram-pendiente', url: 'https://www.instagram.com/instagram-pendiente/' },
  direccion: {
    calle: '[DIRECCIÓN]',
    barrio: '[BARRIO]',
    cp: '[CP]',
    ciudad: '[CIUDAD]',
    // Enlace a la búsqueda de la dirección en Google Maps, en pestaña nueva (fase 4.1): nada de terceros se carga en la web.
    mapaUrl: 'https://www.google.com/maps/search/?api=1&query=' + encodeURIComponent('[DIRECCIÓN COMPLETA]'),
  },
  horario: '[HORARIO]',
  catalogoPdf: { href: '/catalogo-marca.pdf', etiqueta: 'Catálogo 2026-2027 (PDF)' },
  titular: {
    nombre: '[TITULAR LEGAL]',
    nombreCorto: '[TITULAR]',
    nif: '[NIF]',
    email: 'titular-pendiente@example.com',
    // Decisión del equipo (11/10/2026): la misma dirección del catálogo en toda la web, legales incluidos.
    direccion: '[DIRECCIÓN DEL TITULAR]',
    // Número de inscripción en el Registro de Asociaciones de la Comunitat Valenciana. ÚNICO SITIO donde se rellena:
    // el aviso legal lo lee de aquí (y docs/LEGAL.md lleva el mismo número). Si se vaciara, la web enseñaría el
    // marcador [FALTA número de registro]. Facilitado por el equipo el 22/10/2026.
    registro: '',
  },
} as const;

/** Textos fijos que se repiten en toda la web. No cambiar sin tocar CLAUDE.md. */
export const TEXTOS = {
  /** Fase 4.2: el precio se enseña limpio; este aviso va en letra pequeña en la nota de la ficha, el pie y /proyecto. */
  sinIva: 'Precios por unidad, sin IVA.',
  notaPrecios:
    'Precios por unidad «desde», sin IVA, con un diseño incluido, para pedidos a partir de 150 unidades. El precio se ajusta según cantidad y diseño.',
  pedidoMinimo: 'Pedidos desde 25 unidades. ¿Necesitas menos? Consúltanos.',
  plazoPresupuesto: 'Presupuesto en 24 h laborables',
  plazoEntrega: 'Lo tienes en unas 2 semanas desde que confirmas el pedido.',
  datosCatalogo: ['Con sede en Valencia', 'Presupuesto en 24 h', 'Entregas en toda España'],
} as const;

export const NAV = [
  { href: '/catalogo', etiqueta: 'Catálogo' },
  { href: '/disena/atomic-150', etiqueta: 'Diseña tu prenda' },
  { href: '/#como-trabajamos', etiqueta: 'Cómo trabajamos' },
  { href: '/opiniones', etiqueta: 'Opiniones' },
] as const;

export const CTA = { href: '/proyecto', etiqueta: 'Cuéntanos tu proyecto' } as const;

export const ENLACES_LEGALES = [
  { href: '/aviso-legal', etiqueta: 'Aviso legal' },
  { href: '/privacidad', etiqueta: 'Privacidad' },
  { href: '/cookies', etiqueta: 'Cookies' },
] as const;

/** Enlace al chat de WhatsApp. Sin argumento abre con el mensaje general (fase 10, lib/whatsapp.ts). */
export function enlaceWhatsApp(texto: string = MENSAJE_WHATSAPP): string {
  return `https://wa.me/${SITE.whatsapp}?text=${encodeURIComponent(texto)}`;
}

export function enlaceTelefono(telefono: string): string {
  return `tel:+34${telefono.replace(/\s+/g, '')}`;
}
