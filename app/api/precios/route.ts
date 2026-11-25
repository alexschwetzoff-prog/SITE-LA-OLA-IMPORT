import { NextResponse } from 'next/server';
import { obtenerSesion, puedeVerPrecios } from '@/lib/cuenta/sesion';
import { crearClienteServidor } from '@/lib/supabase/servidor';

// Precios HT para las cuentas VALIDADAS. Se leen en el servidor con la sesión del usuario (la RLS de la tabla `precios`
// ya lo exige) y la respuesta es privada y sin caché. Un visitante o una cuenta pendiente recibe una lista vacía.
const SIN_CACHE = { 'Cache-Control': 'private, no-store, max-age=0', Vary: 'Cookie' };

export async function GET() {
  const s = await obtenerSesion();
  if (!puedeVerPrecios(s)) return NextResponse.json({ precios: [], tasaIva: null }, { headers: SIN_CACHE });
  const supabase = await crearClienteServidor();
  const [p, t] = await Promise.all([
    supabase.from('precios').select('producto_slug, variante, cantidad_minima, precio_ht').eq('activo', true),
    supabase.rpc('tasa_iva'),
  ]);
  return NextResponse.json({ precios: p.data ?? [], tasaIva: typeof t.data === 'number' ? t.data : null }, { headers: SIN_CACHE });
}
