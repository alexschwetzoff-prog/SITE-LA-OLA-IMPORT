// Validation côté serveur de la demande (zod) et du panier qui l'accompagne. Moteur générique : le panier (/projet)
// et le devis (/devis) envoient le même FormData ; les champs B2B (type de produit, quantité, technique,
// emplacements, « pas encore de logo ») sont tous facultatifs. Les messages s'affichent tels quels dans le formulaire.

import { z } from 'zod';
import { CONTACTO_IDS, CONTACTO_POR_DEFECTO, FORMULARIO_IDS, TECNICA_IDS, TIPOS_CLIENTE, TRAMO_IDS, USO_IDS, esProfesional } from './comun';

const texto = (max: number, nombre: string, falta = `${nombre} : indiquez un texte.`) =>
  z.string({ error: falta }).trim().max(max, `${nombre} : ${max} caractères maximum.`);
const opcional = (max: number, nombre: string) => texto(max, nombre).optional().transform((v) => v || undefined);

/** Quantité facultative : un nombre entier positif, ou rien. */
const cantidad = z.preprocess(
  (v) => (typeof v === 'string' ? (v.trim() === '' ? undefined : Number(v.trim().replace(/\s+/g, ''))) : v),
  z
    .number({ error: 'Quantité : indiquez un nombre.' })
    .int('Quantité : indiquez un nombre entier.')
    .min(1, 'Quantité : au moins 1.')
    .max(1_000_000, 'Quantité : vérifiez le nombre indiqué.')
    .optional(),
);

export const esquemaSolicitud = z
  .object({
    formulario: z.enum(FORMULARIO_IDS).catch('projet'),
    tipo_cliente: z.enum(TIPOS_CLIENTE, { error: 'Dites-nous qui vous êtes : particulier, entreprise, club…' }),
    nombre: texto(120, 'Nom', 'Indiquez votre nom.').min(2, 'Indiquez votre nom.'),
    negocio: opcional(120, 'Structure'),
    sector: opcional(120, 'Activité'),
    ocasion: opcional(200, 'Occasion'),
    ciudad: opcional(120, 'Ville'),
    email: z
      .string({ error: 'Indiquez votre email.' })
      .trim().toLowerCase().max(200, 'Email : 200 caractères maximum.').pipe(z.email({ error: 'Vérifiez votre email : il ne semble pas valide.' })),
    telefono: opcional(40, 'Téléphone'),
    contacto_preferido: z.enum(CONTACTO_IDS).catch(CONTACTO_POR_DEFECTO),
    tipo_producto: opcional(120, 'Type de produit'),
    otro_producto: opcional(300, 'Produit'),
    tramo: z.enum(TRAMO_IDS).optional().catch(undefined),
    cantidad,
    tecnica: z.enum(TECNICA_IDS).optional().catch(undefined),
    emplazamientos: opcional(200, 'Emplacements'),
    uso: z.array(z.enum(USO_IDS)).max(4).catch([]),
    fecha_limite: z
      .string()
      .trim()
      .transform((v) => v || undefined)
      .pipe(z.string().regex(/^\d{4}-\d{2}-\d{2}$/, 'Vérifiez la date souhaitée.').optional()),
    mensaje: opcional(4000, 'Commentaires'),
    sin_logo: z.boolean(),
    privacidad: z.literal(true, { error: 'Cochez la case de confidentialité pour envoyer votre demande.' }),
    logo_permiso: z.boolean(),
  })
  .superRefine((d, ctx) => {
    if (esProfesional(d.tipo_cliente) && !d.negocio) {
      ctx.addIssue({ code: 'custom', path: ['negocio'], message: 'Indiquez le nom de votre structure.' });
    }
  })
  .transform((d) =>
    // Le particulier n'a ni structure, ni activité, ni usage professionnel.
    esProfesional(d.tipo_cliente) ? d : { ...d, negocio: undefined, sector: undefined, uso: [] as typeof d.uso },
  );

export type Solicitud = z.infer<typeof esquemaSolicitud>;

const hex = z.string().regex(/^#[0-9a-f]{6}$/i, 'Couleur non valide.');

const esquemaLogo = z.object({
  nombre: texto(200, 'Logo'),
  ancho: z.number().int().nonnegative(),
  alto: z.number().int().nonnegative(),
  vectorial: z.boolean(),
  fondoQuitado: z.boolean(),
});

export const esquemaLinea = z.object({
  id: texto(64, 'Ligne'),
  slug: z.string().trim().regex(/^[a-z0-9-]{1,64}$/, 'Produit non valide.'),
  nombre: texto(120, 'Produit').min(1),
  tipo: texto(120, 'Type'),
  color: z.object({ nombre: texto(80, 'Couleur'), hex, hexSecundario: hex.optional() }),
  tramo: z.enum(TRAMO_IDS),
  posiciones: z.array(z.object({ posicion: texto(40, 'Emplacement'), nombre: texto(80, 'Emplacement') })).max(6).optional(),
  diseno: z
    .object({
      fecha: texto(40, 'Création'),
      logo: esquemaLogo,
      logoId: texto(60, 'Logo').nullable().optional(),
      // fase 10: el logo trasero, si el cliente subió otro
      logoDetras: esquemaLogo.optional(),
      logoIdDetras: texto(60, 'Logo arrière').nullable().optional(),
      colocaciones: z
        .array(
          z.object({
            posicion: texto(40, 'Emplacement'),
            nombre: texto(80, 'Emplacement'),
            lado: z.enum(['delante', 'detras']).optional(),
            anchoCm: z.number().positive().max(200),
            altoCm: z.number().positive().max(200),
          }),
        )
        .max(6),
    })
    .optional(),
});

export const esquemaCesta = z.array(esquemaLinea).max(40, 'Le panier contient trop de lignes.');

/** Champs du formulaire tels qu'ils arrivent dans le FormData, prêts pour le schéma. Un champ absent reste vide. */
export function datosDeFormulario(fd: FormData): Record<string, unknown> {
  const v = (clave: string) => {
    const x = fd.get(clave);
    return typeof x === 'string' ? x : undefined;
  };
  const marcado = (clave: string) => {
    const x = fd.get(clave);
    return x === 'on' || x === 'true' || x === '1';
  };
  return {
    formulario: v('formulario'),
    tipo_cliente: v('tipo_cliente'),
    nombre: v('nombre'),
    negocio: v('negocio'),
    sector: v('sector'),
    ocasion: v('ocasion'),
    ciudad: v('ciudad'),
    email: v('email'),
    telefono: v('telefono'),
    contacto_preferido: v('contacto_preferido'),
    tipo_producto: v('tipo_producto'),
    otro_producto: v('otro_producto'),
    tramo: v('tramo'),
    cantidad: v('cantidad'),
    tecnica: v('tecnica'),
    emplazamientos: v('emplazamientos'),
    uso: fd.getAll('uso').filter((x): x is string => typeof x === 'string'),
    fecha_limite: v('fecha_limite') ?? '',
    mensaje: v('mensaje'),
    sin_logo: marcado('sin_logo'),
    privacidad: marcado('privacidad'),
    logo_permiso: marcado('logo_permiso'),
  };
}

export interface ErrorCampo {
  campo: string;
  mensaje: string;
}

/** Lista plana de errores para enseñarla en el formulario. */
export function erroresDe(error: z.ZodError): ErrorCampo[] {
  const vistos = new Set<string>();
  const salida: ErrorCampo[] = [];
  for (const issue of error.issues) {
    const campo = issue.path.map(String).join('.') || 'formulario';
    if (vistos.has(campo)) continue;
    vistos.add(campo);
    salida.push({ campo, mensaje: issue.message });
  }
  return salida;
}
