'use server';

// Server Actions del panel de administración: validar o rechazar cuentas. Solo rol 'admin' (comprobado aquí y en la RLS).
import { revalidatePath } from 'next/cache';
import { z } from 'zod';
import { notificarCuentaRechazada, notificarCuentaValidada } from '@/lib/correo/cuenta';
import { crearClienteServidor } from '@/lib/supabase/servidor';
import { obtenerSesion } from './sesion';

export interface ResultadoAdmin {
  ok: boolean;
  mensaje?: string;
}

async function comoAdmin() {
  const s = await obtenerSesion();
  return s && s.perfil.rol === 'admin' ? s : null;
}

export async function validarCuenta(entrada: unknown): Promise<ResultadoAdmin> {
  const r = z.object({ id: z.uuid() }).safeParse(entrada);
  if (!r.success) return { ok: false, mensaje: 'Compte inconnu.' };
  if (!(await comoAdmin())) return { ok: false, mensaje: 'Accès réservé aux administrateurs.' };
  const supabase = await crearClienteServidor();
  const { data, error } = await supabase.from('perfiles').update({ estado: 'validada', motivo_rechazo: null }).eq('id', r.data.id).select('id').maybeSingle();
  if (error || !data) return { ok: false, mensaje: 'Impossible de valider ce compte.' };
  await notificarCuentaValidada(r.data.id);
  revalidatePath('/admin');
  return { ok: true };
}

export async function rechazarCuenta(entrada: unknown): Promise<ResultadoAdmin> {
  const r = z.object({ id: z.uuid(), motivo: z.string().trim().max(300).optional() }).safeParse(entrada);
  if (!r.success) return { ok: false, mensaje: 'Compte inconnu.' };
  if (!(await comoAdmin())) return { ok: false, mensaje: 'Accès réservé aux administrateurs.' };
  const supabase = await crearClienteServidor();
  const { data, error } = await supabase.from('perfiles').update({ estado: 'rechazada', motivo_rechazo: r.data.motivo || null }).eq('id', r.data.id).select('id').maybeSingle();
  if (error || !data) return { ok: false, mensaje: 'Impossible de rejeter ce compte.' };
  await notificarCuentaRechazada(r.data.id, r.data.motivo);
  revalidatePath('/admin');
  return { ok: true };
}
