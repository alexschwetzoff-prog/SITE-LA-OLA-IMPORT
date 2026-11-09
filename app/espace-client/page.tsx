import type { Metadata } from 'next';
import EspaceClient from '@/components/espace-client/EspaceClient';
import { Pagina } from '@/components/ui/Pagina';

export const metadata: Metadata = {
  title: 'Espace client',
  description: 'Retrouvez votre panier et votre demande en cours, et contactez l’atelier La Ola Import.',
  alternates: { canonical: '/espace-client' },
  robots: { index: false, follow: true },
};

// V1 sans base de données ni comptes : « Mon projet » lit le panier gardé sur cet appareil (localStorage). Les vrais
// comptes clients (suivi de commande, historique) arriveront en V2 avec Supabase.
export default function PageEspaceClient() {
  return (
    <Pagina titulo="Espace client" intro="Votre projet en cours, gardé sur cet appareil. Pas besoin de compte pour l’instant.">
      <EspaceClient />
    </Pagina>
  );
}
