// Fase 6: validación en servidor de la solicitud (zod), en los dos modos del formulario, y de la cesta que la acompaña.
// Los mensajes se enseñan tal cual en el formulario si algo no pasa.

import { z } from 'zod';
import { CITA_IDS, CONTACTO_IDS, TIPOS_CLIENTE, TRAMO_IDS, USO_IDS } from './comun';

const texto = (max: number, nombre: string) => z.string().trim().max(max, `${nombre}: como mucho ${max} caracteres.`);
const opcional = (max: number, nombre: string) => texto(max, nombre).optional().transform((v) => v || undefined);

export const esquemaSolicitud = z
  .object({
    tipo_cliente: z.enum(TIPOS_CLIENTE, { error: 'Dinos si es para un negocio o para ti.' }),
    nombre: texto(120, 'Nombre').min(2, 'Dinos tu nombre.'),
    negocio: opcional(120, 'Negocio'),
    sector: opcional(120, 'Sector'),
    ocasion: opcional(200, 'Ocasión'),
    ciudad: opcional(120, 'Ciudad'),
    email: z.string().trim().toLowerCase().max(200, 'Email: como mucho 200 caracteres.').pipe(z.email({ error: 'Revisa el email: no parece válido.' })),
    telefono: opcional(40, 'Teléfono'),
    contacto_preferido: z.enum(CONTACTO_IDS).catch('whatsapp'),
    otro_producto: opcional(300, 'Otro producto'),
    tramo: z.enum(TRAMO_IDS).optional().catch(undefined),
    uso: z.array(z.enum(USO_IDS)).max(4).catch([]),
    fecha_limite: z
      .string()
      .trim()
      .transform((v) => v || undefined)
      .pipe(z.string().regex(/^\d{4}-\d{2}-\d{2}$/, 'Revisa la fecha límite.').optional()),
    mensaje: opcional(4000, 'Comentarios'), // fase 10: los comentarios son opcionales
    cita: z.enum(CITA_IDS).catch('no'),
    franja: opcional(200, 'Franja preferida'),
    privacidad: z.literal(true, { error: 'Tienes que aceptar la política de privacidad para enviar.' }),
    logo_permiso: z.boolean(),
  })
  .superRefine((d, ctx) => {
    if (d.tipo_cliente === 'negocio' && !d.negocio) {
      ctx.addIssue({ code: 'custom', path: ['negocio'], message: 'Dinos el nombre de tu negocio.' });
    }
  })
  .transform((d) =>
    // El particular no tiene negocio, sector ni visita (fase 4.1); el negocio no tiene ocasión.
    d.tipo_cliente === 'particular'
      ? { ...d, negocio: undefined, sector: undefined, uso: [] as typeof d.uso, cita: 'no' as const, franja: undefined }
      : { ...d, ocasion: undefined },
  );

export type Solicitud = z.infer<typeof esquemaSolicitud>;

const hex = z.string().regex(/^#[0-9a-f]{6}$/i, 'Color no válido.');

const esquemaLogo = z.object({
  nombre: texto(200, 'Logo'),
  ancho: z.number().int().nonnegative(),
  alto: z.number().int().nonnegative(),
  vectorial: z.boolean(),
  fondoQuitado: z.boolean(),
});

export const esquemaLinea = z.object({
  id: texto(64, 'Línea'),
  slug: z.string().trim().regex(/^[a-z0-9-]{1,64}$/, 'Producto no válido.'),
  nombre: texto(120, 'Producto').min(1),
  tipo: texto(120, 'Tipo'),
  color: z.object({ nombre: texto(80, 'Color'), hex, hexSecundario: hex.optional() }),
  tramo: z.enum(TRAMO_IDS),
  posiciones: z.array(z.object({ posicion: texto(40, 'Posición'), nombre: texto(80, 'Posición') })).max(6).optional(),
  diseno: z
    .object({
      fecha: texto(40, 'Diseño'),
      logo: esquemaLogo,
      logoId: texto(60, 'Logo').nullable().optional(),
      // fase 10: el logo trasero, si el cliente subió otro
      logoDetras: esquemaLogo.optional(),
      logoIdDetras: texto(60, 'Logo trasero').nullable().optional(),
      colocaciones: z
        .array(
          z.object({
            posicion: texto(40, 'Posición'),
            nombre: texto(80, 'Posición'),
            lado: z.enum(['delante', 'detras']).optional(),
            anchoCm: z.number().positive().max(200),
            altoCm: z.number().positive().max(200),
          }),
        )
        .max(6),
    })
    .optional(),
});

export const esquemaCesta = z.array(esquemaLinea).max(40, 'La cesta tiene demasiadas líneas.');

/** Campos del formulario tal como llegan en el FormData, listos para el esquema. */
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
    tipo_cliente: v('tipo_cliente'),
    nombre: v('nombre'),
    negocio: v('negocio'),
    sector: v('sector'),
    ocasion: v('ocasion'),
    ciudad: v('ciudad'),
    email: v('email'),
    telefono: v('telefono'),
    contacto_preferido: v('contacto_preferido'),
    otro_producto: v('otro_producto'),
    tramo: v('tramo'),
    uso: fd.getAll('uso').filter((x): x is string => typeof x === 'string'),
    fecha_limite: v('fecha_limite') ?? '',
    mensaje: v('mensaje'),
    cita: v('cita'),
    franja: v('franja'),
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
