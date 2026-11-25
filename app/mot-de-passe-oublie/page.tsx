import type { Metadata } from 'next';
import { FormularioOlvido } from '@/components/cuenta/Formularios';
import { Pagina } from '@/components/ui/Pagina';

export const metadata: Metadata = { title: 'Mot de passe oublié', robots: { index: false, follow: true }, alternates: { canonical: '/mot-de-passe-oublie' } };
export const ensureStatic = 'navigation';

export default function PaginaOlvido() {
  return (
    <Pagina titulo="Mot de passe oublié" intro="Indiquez votre email : nous vous envoyons un lien pour choisir un nouveau mot de passe.">
      <div className="mt-8 max-w-md">
        <FormularioOlvido />
      </div>
    </Pagina>
  );
}
