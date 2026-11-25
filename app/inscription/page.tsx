import type { Metadata } from 'next';
import { FormularioRegistro } from '@/components/cuenta/Formularios';
import { Pagina } from '@/components/ui/Pagina';

export const metadata: Metadata = {
  title: 'Créer un compte professionnel',
  description: 'Créez votre compte professionnel La Ola Import : après validation par notre équipe, vous voyez les prix, vos favoris et votre panier.',
  robots: { index: false, follow: true },
  alternates: { canonical: '/inscription' },
};

export const ensureStatic = 'navigation';

export default function PaginaInscripcion() {
  return (
    <Pagina titulo="Créer un compte professionnel" intro="Réservé aux entreprises, clubs, campings et boutiques. Notre équipe valide chaque compte avant d’ouvrir les prix et le panier.">
      <div className="mt-8 max-w-3xl">
        <FormularioRegistro />
      </div>
    </Pagina>
  );
}
