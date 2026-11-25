import 'server-only';

// Cliente de Supabase para el servidor (Server Components, Server Actions y route handlers): la sesión vive en cookies
// httpOnly gestionadas por @supabase/ssr. Se crea uno por petición; la RLS se aplica con el JWT del usuario.
import { createServerClient } from '@supabase/ssr';
import { cookies } from 'next/headers';
import { supabaseClaveAnonima, supabaseUrl } from './entorno';

export async function crearClienteServidor() {
  const almacen = await cookies();
  return createServerClient(supabaseUrl(), supabaseClaveAnonima(), {
    cookies: {
      getAll: () => almacen.getAll(),
      setAll: (lista) => {
        try {
          for (const { name, value, options } of lista) almacen.set(name, value, options);
        } catch {
          // Desde un Server Component no se pueden escribir cookies: el proxy (proxy.ts) refresca la sesión.
        }
      },
    },
  });
}
