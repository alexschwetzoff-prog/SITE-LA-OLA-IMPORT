// Validación (zod) de los formularios de cuenta. Los mensajes se enseñan tal cual en el formulario.
import { z } from 'zod';
import { esSiretValido, normalizarSiret } from './siret';

const texto = (nombre: string, max = 120) =>
  z.string({ error: `${nombre} : champ obligatoire.` }).trim().min(1, `${nombre} : champ obligatoire.`).max(max, `${nombre} : ${max} caractères maximum.`);
const textoOpcional = (max = 120) => z.string().trim().max(max, `${max} caractères maximum.`).optional().transform((v) => v || undefined);

export const email = z
  .string({ error: 'Indiquez votre email.' })
  .trim()
  .toLowerCase()
  .max(200, 'Email : 200 caractères maximum.')
  .pipe(z.email({ error: 'Vérifiez votre email : il ne semble pas valide.' }));

/** Contraseña: 10 caracteres o más, con letras y cifras. */
export const contrasena = z
  .string({ error: 'Choisissez un mot de passe.' })
  .min(10, 'Mot de passe : 10 caractères minimum.')
  .max(72, 'Mot de passe : 72 caractères maximum.')
  .regex(/[A-Za-z]/, 'Mot de passe : ajoutez au moins une lettre.')
  .regex(/\d/, 'Mot de passe : ajoutez au moins un chiffre.');

/** N° de TVA intracommunautaire (facultatif): code pays UE de 2 lettres + 2 à 12 caractères. */
const tva = z
  .string()
  .trim()
  .toUpperCase()
  .transform((v) => v.replace(/[\s.\-]/g, ''))
  .refine((v) => v === '' || /^[A-Z]{2}[A-Z0-9]{2,12}$/.test(v), 'N° de TVA : format non valide (exemple : FR12345678901).')
  .optional()
  .transform((v) => v || undefined);

export const esquemaRegistro = z
  .object({
    razon_social: texto('Raison sociale'),
    siret: z
      .string({ error: 'Indiquez votre SIRET.' })
      .transform(normalizarSiret)
      .refine((v) => /^\d{14}$/.test(v), 'SIRET : 14 chiffres.')
      .refine(esSiretValido, 'SIRET : ce numéro n’est pas valide, vérifiez-le.'),
    numero_tva: tva,
    nombre_contacto: texto('Prénom', 80),
    apellidos_contacto: texto('Nom', 80),
    telefono: texto('Téléphone', 40).regex(/^[0-9+().\s-]{6,}$/, 'Téléphone : numéro non valide.'),
    direccion_facturacion: texto('Adresse de facturation', 200),
    codigo_postal: texto('Code postal', 12),
    ciudad: texto('Ville', 100),
    pais: z.string().trim().length(2, 'Pays : code à 2 lettres.').toUpperCase().catch('FR'),
    sector: textoOpcional(120),
    email,
    password: contrasena,
    password_confirmacion: z.string(),
    condiciones: z.literal(true, { error: 'Acceptez les conditions générales pour créer votre compte.' }),
    privacidad: z.literal(true, { error: 'Cochez la case de confidentialité pour créer votre compte.' }),
  })
  .refine((d) => d.password === d.password_confirmacion, { path: ['password_confirmacion'], message: 'Les deux mots de passe ne sont pas identiques.' });

export type DatosRegistro = z.infer<typeof esquemaRegistro>;

export const esquemaLogin = z.object({
  email,
  password: z.string({ error: 'Indiquez votre mot de passe.' }).min(1, 'Indiquez votre mot de passe.'),
});

export const esquemaOlvido = z.object({ email });

export const esquemaNuevaContrasena = z
  .object({ password: contrasena, password_confirmacion: z.string() })
  .refine((d) => d.password === d.password_confirmacion, { path: ['password_confirmacion'], message: 'Les deux mots de passe ne sont pas identiques.' });

export const esquemaPerfil = z.object({
  razon_social: texto('Raison sociale'),
  numero_tva: tva,
  nombre_contacto: texto('Prénom', 80),
  apellidos_contacto: texto('Nom', 80),
  telefono: texto('Téléphone', 40).regex(/^[0-9+().\s-]{6,}$/, 'Téléphone : numéro non valide.'),
  direccion_facturacion: texto('Adresse de facturation', 200),
  codigo_postal: texto('Code postal', 12),
  ciudad: texto('Ville', 100),
  sector: textoOpcional(120),
});

/** Destino tras el login: solo rutas internas (evita redirecciones abiertas). */
export function rutaInternaSegura(valor: unknown, porDefecto = '/compte'): string {
  return typeof valor === 'string' && valor.startsWith('/') && !valor.startsWith('//') && !valor.includes('\\') ? valor : porDefecto;
}
