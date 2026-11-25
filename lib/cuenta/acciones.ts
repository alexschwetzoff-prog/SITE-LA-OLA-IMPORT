'use server';

// Server Actions de la cuenta: registro, inicio y cierre de sesión, contraseña olvidada, datos de la empresa.
// Cada acción valida con zod, aplica el antispam donde procede y comprueba la sesión antes de mutar.
import { headers } from 'next/headers';
import { redirect } from 'next/navigation';
import { revalidatePath } from 'next/cache';
import { esRobot, tiempoSuficiente, anotarEnvio, ipDe } from '@/lib/solicitud/antispam';
import { notificarCuentaRegistrada } from '@/lib/correo/cuenta';
import { crearClienteServidor } from '@/lib/supabase/servidor';
import { urlDelSitio } from '@/lib/supabase/entorno';
import { esquemaLogin, esquemaNuevaContrasena, esquemaOlvido, esquemaPerfil, esquemaRegistro, rutaInternaSegura } from './esquema';
import { obtenerSesion } from './sesion';

export interface EstadoFormulario {
  ok: boolean;
  mensaje?: string;
  errores?: Record<string, string>;
  /** Valores enviados (menos las contraseñas) para no vaciar el formulario cuando hay errores. */
  valores?: Record<string, string>;
}

function erroresDe(error: import('zod').ZodError): Record<string, string> {
  const e: Record<string, string> = {};
  for (const issue of error.issues) {
    const k = String(issue.path[0] ?? 'general');
    if (!e[k]) e[k] = issue.message;
  }
  return e;
}

function valoresDe(fd: FormData): Record<string, string> {
  const v: Record<string, string> = {};
  for (const [k, val] of fd.entries()) if (typeof val === 'string' && !k.startsWith('password') && !k.startsWith('$ACTION')) v[k] = val;
  return v;
}

const marcada = (fd: FormData, k: string) => fd.get(k) === 'on' || fd.get(k) === 'true';

export async function registrar(_previo: EstadoFormulario, fd: FormData): Promise<EstadoFormulario> {
  if (esRobot(fd)) return { ok: true, mensaje: 'confirmation' }; // el robot cree que ha funcionado
  if (!tiempoSuficiente(fd)) return { ok: false, mensaje: 'Formulaire envoyé trop vite : réessayez dans quelques secondes.', valores: valoresDe(fd) };
  const ip = ipDe(await headers());
  const limite = anotarEnvio(`registro:${ip}`);
  if (!limite.permitido) return { ok: false, mensaje: `Trop de tentatives. Réessayez dans ${limite.esperaMinutos ?? 10} minutes.`, valores: valoresDe(fd) };

  const crudo = Object.fromEntries(fd.entries());
  const r = esquemaRegistro.safeParse({ ...crudo, condiciones: marcada(fd, 'condiciones'), privacidad: marcada(fd, 'privacidad') });
  if (!r.success) return { ok: false, errores: erroresDe(r.error), valores: valoresDe(fd) };
  const d = r.data;

  const supabase = await crearClienteServidor();
  const { error } = await supabase.auth.signUp({
    email: d.email,
    password: d.password,
    options: {
      emailRedirectTo: `${urlDelSitio()}/auth/confirmation?siguiente=/compte`,
      data: {
        razon_social: d.razon_social, siret: d.siret, numero_tva: d.numero_tva ?? '', nombre_contacto: d.nombre_contacto, apellidos_contacto: d.apellidos_contacto,
        telefono: d.telefono, direccion_facturacion: d.direccion_facturacion, codigo_postal: d.codigo_postal, ciudad: d.ciudad, pais: d.pais, sector: d.sector ?? '',
      },
    },
  });
  if (error && !/already|registered/i.test(error.message)) {
    return { ok: false, mensaje: 'Impossible de créer le compte pour le moment. Réessayez dans un instant.', valores: valoresDe(fd) };
  }
  await notificarCuentaRegistrada(d.email);
  // Mismo mensaje exista o no la cuenta (no revela qué emails están registrados).
  return { ok: true, mensaje: 'confirmation' };
}

export async function iniciarSesion(_previo: EstadoFormulario, fd: FormData): Promise<EstadoFormulario> {
  const ip = ipDe(await headers());
  const limite = anotarEnvio(`login:${ip}`);
  if (!limite.permitido) return { ok: false, mensaje: `Trop de tentatives. Réessayez dans ${limite.esperaMinutos ?? 10} minutes.` };
  const r = esquemaLogin.safeParse(Object.fromEntries(fd.entries()));
  if (!r.success) return { ok: false, errores: erroresDe(r.error), valores: valoresDe(fd) };
  const supabase = await crearClienteServidor();
  const { error } = await supabase.auth.signInWithPassword(r.data);
  if (error) {
    const sinConfirmar = /not confirmed/i.test(error.message) || error.code === 'email_not_confirmed';
    return { ok: false, mensaje: sinConfirmar ? 'Confirmez d’abord votre email : cliquez sur le lien que nous vous avons envoyé.' : 'Email ou mot de passe incorrect.', valores: valoresDe(fd) };
  }
  redirect(rutaInternaSegura(fd.get('siguiente'), '/compte'));
}

export async function cerrarSesion(): Promise<void> {
  const supabase = await crearClienteServidor();
  await supabase.auth.signOut();
  redirect('/');
}

export async function olvidoContrasena(_previo: EstadoFormulario, fd: FormData): Promise<EstadoFormulario> {
  const limite = anotarEnvio(`olvido:${ipDe(await headers())}`);
  if (!limite.permitido) return { ok: false, mensaje: `Trop de tentatives. Réessayez dans ${limite.esperaMinutos ?? 10} minutes.` };
  const r = esquemaOlvido.safeParse(Object.fromEntries(fd.entries()));
  if (!r.success) return { ok: false, errores: erroresDe(r.error), valores: valoresDe(fd) };
  const supabase = await crearClienteServidor();
  await supabase.auth.resetPasswordForEmail(r.data.email, { redirectTo: `${urlDelSitio()}/auth/confirmation?siguiente=/nouveau-mot-de-passe` });
  return { ok: true, mensaje: 'Si un compte existe avec cet email, vous allez recevoir un lien pour choisir un nouveau mot de passe.' };
}

export async function nuevaContrasena(_previo: EstadoFormulario, fd: FormData): Promise<EstadoFormulario> {
  const s = await obtenerSesion();
  if (!s) return { ok: false, mensaje: 'Le lien a expiré : demandez-en un nouveau.' };
  const r = esquemaNuevaContrasena.safeParse(Object.fromEntries(fd.entries()));
  if (!r.success) return { ok: false, errores: erroresDe(r.error) };
  const supabase = await crearClienteServidor();
  const { error } = await supabase.auth.updateUser({ password: r.data.password });
  if (error) return { ok: false, mensaje: 'Impossible de changer le mot de passe : choisissez-en un autre.' };
  redirect('/compte?mot-de-passe=ok');
}

export async function actualizarPerfil(_previo: EstadoFormulario, fd: FormData): Promise<EstadoFormulario> {
  const s = await obtenerSesion();
  if (!s) return { ok: false, mensaje: 'Session expirée : reconnectez-vous.' };
  const r = esquemaPerfil.safeParse(Object.fromEntries(fd.entries()));
  if (!r.success) return { ok: false, errores: erroresDe(r.error), valores: valoresDe(fd) };
  const supabase = await crearClienteServidor();
  // El SIRET, el estado y el rol no se cambian desde aquí (el SIRET se corrige escribiendo a La Ola Import).
  const { error } = await supabase.from('perfiles').update({ ...r.data, numero_tva: r.data.numero_tva ?? null, sector: r.data.sector ?? null }).eq('id', s.userId);
  if (error) return { ok: false, mensaje: 'Impossible d’enregistrer vos données pour le moment.', valores: valoresDe(fd) };
  revalidatePath('/compte');
  return { ok: true, mensaje: 'Vos données ont bien été enregistrées.' };
}
