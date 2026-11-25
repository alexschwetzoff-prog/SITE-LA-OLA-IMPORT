import { NextResponse, type NextRequest } from 'next/server';
import { actualizarSesion } from '@/lib/supabase/proxy';

// Proxy (antes «middleware»): solo en las rutas del espacio cliente. Refresca la sesión de Supabase y redirige pronto a
// quien no ha iniciado sesión. La autorización definitiva (cuenta validada, rol admin) se comprueba otra vez en cada
// página y acción: el proxy no es un sistema de autorización completo.
const PROTEGIDAS = ['/compte', '/commande', '/admin'];
const SOLO_VISITANTES = ['/connexion', '/inscription', '/mot-de-passe-oublie'];

export async function proxy(request: NextRequest) {
  const { respuesta, usuario } = await actualizarSesion(request);
  const ruta = request.nextUrl.pathname;
  if (!usuario && PROTEGIDAS.some((p) => ruta === p || ruta.startsWith(`${p}/`))) {
    const url = request.nextUrl.clone();
    url.pathname = '/connexion';
    url.search = `?siguiente=${encodeURIComponent(ruta + request.nextUrl.search)}`;
    return NextResponse.redirect(url);
  }
  if (usuario && SOLO_VISITANTES.includes(ruta)) {
    const url = request.nextUrl.clone();
    url.pathname = '/compte';
    url.search = '';
    return NextResponse.redirect(url);
  }
  return respuesta;
}

export const config = {
  matcher: ['/compte/:path*', '/commande/:path*', '/admin/:path*', '/connexion', '/inscription', '/mot-de-passe-oublie', '/nouveau-mot-de-passe', '/api/yo', '/api/precios', '/auth/:path*'],
};
