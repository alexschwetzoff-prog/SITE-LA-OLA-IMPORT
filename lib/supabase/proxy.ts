import { createServerClient } from '@supabase/ssr';
import { NextResponse, type NextRequest } from 'next/server';
import { supabaseClaveAnonima, supabaseUrl, supabaseConfigurado } from './entorno';

// Refresca la sesión de Supabase en cada petición a las rutas del espacio cliente y devuelve el usuario (o null).
// Es una comprobación OPTIMISTA para redirigir pronto: la autorización real se repite en cada página, acción y
// route handler (lib/cuenta/sesion.ts) y, debajo de todo, en la RLS de la base.
export async function actualizarSesion(request: NextRequest) {
  let respuesta = NextResponse.next({ request });
  if (!supabaseConfigurado()) return { respuesta, usuario: null };
  const supabase = createServerClient(supabaseUrl(), supabaseClaveAnonima(), {
    cookies: {
      getAll: () => request.cookies.getAll(),
      setAll: (lista) => {
        for (const { name, value } of lista) request.cookies.set(name, value);
        respuesta = NextResponse.next({ request });
        for (const { name, value, options } of lista) respuesta.cookies.set(name, value, options);
      },
    },
  });
  const { data } = await supabase.auth.getUser();
  return { respuesta, usuario: data.user };
}
