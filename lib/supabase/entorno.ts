// Variables de Supabase. NEXT_PUBLIC_*: URL y clave anónima (públicas por diseño: la seguridad la da la RLS).
// Nunca se usa aquí la service role: solo scripts de administración, fuera de la aplicación.
export function supabaseConfigurado(): boolean {
  return Boolean(process.env.NEXT_PUBLIC_SUPABASE_URL && process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY);
}

export function supabaseUrl(): string {
  const v = process.env.NEXT_PUBLIC_SUPABASE_URL;
  if (!v) throw new Error('Falta NEXT_PUBLIC_SUPABASE_URL (ver .env.example y docs/ESPACIO-CLIENTE.md)');
  return v;
}

export function supabaseClaveAnonima(): string {
  const v = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
  if (!v) throw new Error('Falta NEXT_PUBLIC_SUPABASE_ANON_KEY (ver .env.example y docs/ESPACIO-CLIENTE.md)');
  return v;
}

/** URL pública del sitio (para los enlaces de los emails de Supabase). */
export function urlDelSitio(): string {
  return (process.env.NEXT_PUBLIC_SITE_URL ?? 'http://localhost:3000').replace(/\/$/, '');
}
