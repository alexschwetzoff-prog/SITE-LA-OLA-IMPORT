import { NextResponse, type NextRequest } from 'next/server';
import { rutaInternaSegura } from '@/lib/cuenta/esquema';
import { crearClienteServidor } from '@/lib/supabase/servidor';

// Destino de los enlaces de los emails de Supabase (confirmación de la cuenta, restablecer la contraseña). Soporta el
// flujo PKCE (?code=…) y el de token (?token_hash=…&type=…). Tras validarlo envía a `siguiente` (solo rutas internas).

export async function GET(request: NextRequest) {
  const url = request.nextUrl;
  const siguiente = rutaInternaSegura(url.searchParams.get('siguiente'), '/compte');
  const supabase = await crearClienteServidor();
  const code = url.searchParams.get('code');
  const tokenHash = url.searchParams.get('token_hash');
  const tipo = url.searchParams.get('type');
  let ok = false;
  if (code) {
    ok = !(await supabase.auth.exchangeCodeForSession(code)).error;
  } else if (tokenHash && tipo) {
    ok = !(await supabase.auth.verifyOtp({ token_hash: tokenHash, type: tipo as 'signup' | 'email' | 'recovery' | 'invite' | 'magiclink' | 'email_change' })).error;
  }
  const destino = new URL(ok ? siguiente : '/connexion?error=enlace', url.origin);
  return NextResponse.redirect(destino);
}
