'use server';

// Server Actions de favoritos, carrito y pedido. Todas: zod + sesión + cuenta validada (la RLS lo vuelve a exigir en la base).
import { redirect } from 'next/navigation';
import { revalidatePath } from 'next/cache';
import { z } from 'zod';
import { getProducto } from '@/data/catalogo';
import { notificarPedidoRecibido } from '@/lib/correo/cuenta';
import { proveedorDePagos } from '@/lib/pagos';
import { crearClienteServidor } from '@/lib/supabase/servidor';
import { obtenerSesion, puedeVerPrecios } from './sesion';

export interface ResultadoAccion {
  ok: boolean;
  error?: 'sesion' | 'no-validada' | 'datos' | 'servidor' | 'carrito-vacio' | 'precio';
  mensaje?: string;
  activo?: boolean;
}

const slug = z.string().min(1).max(100).refine((s) => Boolean(getProducto(s)), 'Produit inconnu.');
const variante = z.string().max(120).default('');
const talla = z.string().max(20).default('');
const cantidad = z.number().int().min(1).max(100000);
const personalizacion = z
  .object({
    tecnica: z.string().max(60).optional(),
    posiciones: z.array(z.string().max(60)).max(6).optional(),
    logo_ref: z.string().max(120).optional(),
  })
  .strict()
  .nullable()
  .optional();

/** Comprueba que la variante y la talla existen en el producto. */
function variantePermitida(s: string, v: string, t: string): boolean {
  const p = getProducto(s);
  if (!p) return false;
  const tallas = [...(p.tallas ?? []), ...(p.tallasInfantiles ?? [])];
  return (v === '' || p.colores.some((c) => c.nombre === v)) && (t === '' || tallas.includes(t));
}

async function contextoValidado() {
  const s = await obtenerSesion();
  if (!s) return { error: 'sesion' as const };
  if (!puedeVerPrecios(s)) return { error: 'no-validada' as const };
  return { s, supabase: await crearClienteServidor() };
}

// ------------------------------------------------------------------ favoritos
const esquemaFavorito = z.object({ slug, variante });

export async function alternarFavorito(entrada: unknown): Promise<ResultadoAccion> {
  const r = esquemaFavorito.safeParse(entrada);
  if (!r.success || !variantePermitida(r.data.slug, r.data.variante, '')) return { ok: false, error: 'datos' };
  const c = await contextoValidado();
  if ('error' in c) return { ok: false, error: c.error };
  const { data: existente } = await c.supabase.from('favoritos').select('id').eq('producto_slug', r.data.slug).eq('variante', r.data.variante).maybeSingle();
  if (existente) {
    const { error } = await c.supabase.from('favoritos').delete().eq('id', existente.id);
    revalidatePath('/compte/favoris');
    return error ? { ok: false, error: 'servidor' } : { ok: true, activo: false };
  }
  const { error } = await c.supabase.from('favoritos').insert({ usuario_id: c.s.userId, producto_slug: r.data.slug, variante: r.data.variante });
  revalidatePath('/compte/favoris');
  return error ? { ok: false, error: 'servidor' } : { ok: true, activo: true };
}

/** Al iniciar sesión con una cuenta validada, los favoritos guardados en el navegador pasan a la cuenta. */
export async function fusionarFavoritos(entrada: unknown): Promise<ResultadoAccion> {
  const r = z.array(esquemaFavorito).max(200).safeParse(entrada);
  if (!r.success) return { ok: false, error: 'datos' };
  const c = await contextoValidado();
  if ('error' in c) return { ok: false, error: c.error };
  const validos = r.data.filter((f) => variantePermitida(f.slug, f.variante, '')).map((f) => ({ usuario_id: c.s.userId, producto_slug: f.slug, variante: f.variante }));
  if (validos.length) await c.supabase.from('favoritos').upsert(validos, { onConflict: 'usuario_id,producto_slug,variante', ignoreDuplicates: true });
  revalidatePath('/compte/favoris');
  return { ok: true };
}

// ------------------------------------------------------------------ carrito
const esquemaLinea = z.object({ slug, variante, talla, cantidad, personalizacion });

async function carritoDe(c: Exclude<Awaited<ReturnType<typeof contextoValidado>>, { error: string }>): Promise<string | null> {
  const { data } = await c.supabase.from('carritos').select('id').maybeSingle();
  if (data) return data.id as string;
  const { data: nuevo } = await c.supabase.from('carritos').insert({ usuario_id: c.s.userId }).select('id').single();
  return (nuevo?.id as string) ?? null;
}

export async function anadirAlCarrito(entrada: unknown): Promise<ResultadoAccion> {
  const r = esquemaLinea.safeParse(entrada);
  if (!r.success || !variantePermitida(r.data.slug, r.data.variante, r.data.talla)) return { ok: false, error: 'datos' };
  const c = await contextoValidado();
  if ('error' in c) return { ok: false, error: c.error };
  const idCarrito = await carritoDe(c);
  if (!idCarrito) return { ok: false, error: 'servidor' };
  const clave = r.data.personalizacion ? JSON.stringify(r.data.personalizacion) : null;
  const { data: lineas } = await c.supabase.from('lineas_carrito').select('id, cantidad, personalizacion').eq('carrito_id', idCarrito).eq('producto_slug', r.data.slug).eq('variante', r.data.variante).eq('talla', r.data.talla);
  const igual = (lineas ?? []).find((l) => (l.personalizacion ? JSON.stringify(l.personalizacion) : null) === clave);
  const { error } = igual
    ? await c.supabase.from('lineas_carrito').update({ cantidad: Math.min(100000, (igual.cantidad as number) + r.data.cantidad) }).eq('id', igual.id)
    : await c.supabase.from('lineas_carrito').insert({ carrito_id: idCarrito, producto_slug: r.data.slug, variante: r.data.variante, talla: r.data.talla, cantidad: r.data.cantidad, personalizacion: r.data.personalizacion ?? null });
  revalidatePath('/compte/panier');
  return error ? { ok: false, error: 'servidor' } : { ok: true };
}

export async function cambiarCantidad(entrada: unknown): Promise<ResultadoAccion> {
  const r = z.object({ id: z.uuid(), cantidad }).safeParse(entrada);
  if (!r.success) return { ok: false, error: 'datos' };
  const c = await contextoValidado();
  if ('error' in c) return { ok: false, error: c.error };
  const { error } = await c.supabase.from('lineas_carrito').update({ cantidad: r.data.cantidad }).eq('id', r.data.id);
  revalidatePath('/compte/panier');
  return error ? { ok: false, error: 'servidor' } : { ok: true };
}

export async function quitarLinea(entrada: unknown): Promise<ResultadoAccion> {
  const r = z.object({ id: z.uuid() }).safeParse(entrada);
  if (!r.success) return { ok: false, error: 'datos' };
  const c = await contextoValidado();
  if ('error' in c) return { ok: false, error: c.error };
  const { error } = await c.supabase.from('lineas_carrito').delete().eq('id', r.data.id);
  revalidatePath('/compte/panier');
  return error ? { ok: false, error: 'servidor' } : { ok: true };
}

export async function moverAFavoritos(entrada: unknown): Promise<ResultadoAccion> {
  const r = z.object({ id: z.uuid() }).safeParse(entrada);
  if (!r.success) return { ok: false, error: 'datos' };
  const c = await contextoValidado();
  if ('error' in c) return { ok: false, error: c.error };
  const { data: l } = await c.supabase.from('lineas_carrito').select('producto_slug, variante').eq('id', r.data.id).maybeSingle();
  if (!l) return { ok: false, error: 'datos' };
  await c.supabase.from('favoritos').upsert({ usuario_id: c.s.userId, producto_slug: l.producto_slug, variante: l.variante }, { onConflict: 'usuario_id,producto_slug,variante', ignoreDuplicates: true });
  await c.supabase.from('lineas_carrito').delete().eq('id', r.data.id);
  revalidatePath('/compte/panier');
  revalidatePath('/compte/favoris');
  return { ok: true };
}

// ------------------------------------------------------------------ pedido
/** «Valider la commande»: crea el pedido en estado 'pendiente_pago' a partir del carrito (función SQL) y lleva a «Paiement bientôt». */
export async function finalizarPedido(): Promise<ResultadoAccion> {
  const c = await contextoValidado();
  if ('error' in c) return { ok: false, error: c.error };
  const { data: id, error } = await c.supabase.rpc('crear_pedido_desde_carrito');
  if (error || !id) {
    const vacio = /Panier vide/.test(error?.message ?? '');
    const precio = /Prix ou lot/.test(error?.message ?? '');
    return { ok: false, error: vacio ? 'carrito-vacio' : precio ? 'precio' : 'servidor', mensaje: precio ? 'Une ligne n’a pas de prix ou n’atteint pas son lot minimum.' : undefined };
  }
  const { data: pedido } = await c.supabase.from('pedidos').select('id, numero, total_ttc').eq('id', id).single();
  if (pedido) {
    await proveedorDePagos().crearSesionPago({ id: pedido.id, numero: pedido.numero, totalTtc: Number(pedido.total_ttc), moneda: 'EUR' });
    await notificarPedidoRecibido(c.s.email, pedido.numero);
  }
  revalidatePath('/compte/panier');
  revalidatePath('/compte/commandes');
  redirect(`/commande/paiement-bientot?numero=${encodeURIComponent(pedido?.numero ?? '')}`);
}
