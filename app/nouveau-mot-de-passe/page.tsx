import type { Metadata } from 'next';
import { FormularioNuevaContrasena } from '@/components/cuenta/Formularios';
import { Pagina } from '@/components/ui/Pagina';

export const metadata: Metadata = { title: 'Nouveau mot de passe', robots: { index: false, follow: false }, alternates: { canonical: '/nouveau-mot-de-passe' } };
export const ensureStatic = 'navigation';

// Se llega desde el enlace del email (/auth/confirmation crea la sesión de recuperación). Sin sesión, la acción lo rechaza.
export default function PaginaNuevaContrasena() {
  return (
    <Pagina titulo="Nouveau mot de passe" intro="Choisissez un nouveau mot de passe pour votre compte.">
      <div className="mt-8 max-w-md">
        <FormularioNuevaContrasena />
      </div>
    </Pagina>
  );
}
