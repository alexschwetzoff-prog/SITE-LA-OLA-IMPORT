import type { Metadata } from 'next';
import Accroche from '@/components/accueil/Accroche';
import AtelierApercu from '@/components/accueil/AtelierApercu';
import AvisApercu from '@/components/accueil/AvisApercu';
import BandeauFinal from '@/components/accueil/BandeauFinal';
import EquipeApercu from '@/components/accueil/EquipeApercu';
import EssayezVotreLogo from '@/components/accueil/EssayezVotreLogo';
import ProduitsPhares from '@/components/accueil/ProduitsPhares';
import Segments from '@/components/accueil/Segments';
import { SITE } from '@/lib/site';

export const metadata: Metadata = {
  title: { absolute: SITE.tituloPorDefecto },
  description: SITE.descripcion,
  alternates: { canonical: '/' },
};

// Accueil statique. Ordre : l'offre dès le premier écran (accroche + catégories), les produits phares, l'aiguillage
// par segment, puis la confiance (atelier, équipe, avis réels) et un dernier appel à l'action.
export const ensureStatic = 'navigation';

export default function Accueil() {
  return (
    <>
      <Accroche />
      <ProduitsPhares />
      <Segments />
      <AtelierApercu />
      <EquipeApercu />
      <EssayezVotreLogo />
      <AvisApercu />
      <BandeauFinal />
    </>
  );
}
