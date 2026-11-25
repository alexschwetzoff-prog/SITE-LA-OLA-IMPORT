'use client';

// Cliente de Supabase para el navegador. Solo lo usan formularios que necesitan la API de Auth en el cliente; las
// lecturas de precios y de datos pasan por el servidor (route handlers y acciones), no por aquí.
import { createBrowserClient } from '@supabase/ssr';

export function crearClienteNavegador() {
  return createBrowserClient(process.env.NEXT_PUBLIC_SUPABASE_URL!, process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!);
}
