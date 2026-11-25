import { NextResponse } from 'next/server';
import { obtenerSesion, puedeVerPrecios } from '@/lib/cuenta/sesion';
import { crearClienteServidor } from '@/lib/supabase/servidor';

// Estado de la sesión para la interfaz (cabecera, botones de favorito y de carrito). Sin caché: cada respuesta depende
// de la cookie de sesión. Para un visitante devuelve solo { estado: 'anonimo' }.
const SIN_CACHE = { 'Cache-Control': 'private, no-store, max-age=0', Vary: 'Cookie' };

export async function GET() {
  const s = await obtenerSesion();
  if (!s) return NextResponse.json({ estado: 'anonimo' }, { headers: SIN_CACHE });
  let favoritos: { producto_slug: string; variante: string }[] = [];
  let carrito = 0;
  if (puedeVerPrecios(s)) {
    const supabase = await crearClienteServidor();
    const [f, c] = await Promise.all([
      supabase.from('favoritos').select('producto_slug, variante'),
      supabase.from('lineas_carrito').select('cantidad'),
    ]);
    favoritos = f.data ?? [];
    carrito = (c.data ?? []).length;
  }
  return NextResponse.json(
    { estado: s.perfil.estado, rol: s.perfil.rol, nombre: s.perfil.nombre_contacto, razonSocial: s.perfil.razon_social, favoritos, carrito },
    { headers: SIN_CACHE },
  );
}
