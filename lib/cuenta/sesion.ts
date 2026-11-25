import 'server-only';

// Capa de acceso a datos de la sesión (Data Access Layer): TODA lectura del usuario en el servidor pasa por aquí.
// getUser() valida el JWT con el servidor de Auth (no se fía de la cookie sin comprobar). Debe llamarse en el momento
// de la petición (detrás de <Suspense>, en una acción o en un route handler), nunca en el HTML estático.
import { cache } from 'react';
import { redirect } from 'next/navigation';
import { connection } from 'next/server';
import { crearClienteServidor } from '@/lib/supabase/servidor';
import { supabaseConfigurado } from '@/lib/supabase/entorno';

export type EstadoCuenta = 'pendiente' | 'validada' | 'rechazada';
export type RolCuenta = 'cliente' | 'admin';

export interface Perfil {
  id: string;
  email: string;
  razon_social: string;
  siret: string;
  numero_tva: string | null;
  nombre_contacto: string;
  apellidos_contacto: string;
  telefono: string | null;
  direccion_facturacion: string;
  codigo_postal: string;
  ciudad: string;
  pais: string;
  sector: string | null;
  estado: EstadoCuenta;
  rol: RolCuenta;
  motivo_rechazo: string | null;
  creado_en: string;
}

export interface Sesion {
  userId: string;
  email: string;
  perfil: Perfil;
}

/** Sesión actual o null (visitante). Cacheada durante la petición. */
export const obtenerSesion = cache(async (): Promise<Sesion | null> => {
  if (!supabaseConfigurado()) return null;
  // La lectura de sesión (JWT, hora actual) solo ocurre en la petición real, nunca en el prerenderizado ni en el prefetch.
  await connection();
  const supabase = await crearClienteServidor();
  const { data } = await supabase.auth.getUser();
  if (!data.user) return null;
  const { data: perfil } = await supabase.from('perfiles').select('*').eq('id', data.user.id).maybeSingle();
  if (!perfil) return null;
  return { userId: data.user.id, email: data.user.email ?? '', perfil: perfil as Perfil };
});

export const puedeVerPrecios = (s: Sesion | null): boolean => Boolean(s && (s.perfil.estado === 'validada' || s.perfil.rol === 'admin'));

/** Exige sesión (redirige a /connexion). Para páginas. */
export async function exigirSesion(siguiente = '/compte'): Promise<Sesion> {
  const s = await obtenerSesion();
  if (!s) redirect(`/connexion?siguiente=${encodeURIComponent(siguiente)}`);
  return s;
}

/** Exige un admin (404 lógico: redirige a la cuenta). Para páginas y acciones de /admin. */
export async function exigirAdmin(): Promise<Sesion> {
  const s = await exigirSesion('/admin');
  if (s.perfil.rol !== 'admin') redirect('/compte');
  return s;
}

/** Para Server Actions y route handlers: devuelve la sesión o null, sin redirigir. */
export async function sesionOpcional(): Promise<Sesion | null> {
  return obtenerSesion();
}
