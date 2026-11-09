import type { Metadata } from 'next';
import { Suspense } from 'react';
import FormulaireDevis from '@/components/devis/FormulaireDevis';
import { Pagina } from '@/components/ui/Pagina';
import { PRODUCTOS_ACTIVOS } from '@/lib/catalogo';

export const metadata: Metadata = {
  title: 'Demander un devis',
  description:
    'Textiles, objets publicitaires ou souvenirs personnalisés : décrivez votre projet en 4 étapes, l’atelier La Ola Import vous répond avec une proposition claire.',
  alternates: { canonical: '/devis' },
};

// Coquille statique ; le formulaire lit ?produit= et ?segment= dans le navigateur (d'où le Suspense).
export default function PageDevis() {
  const produits = PRODUCTOS_ACTIVOS.map((p) => ({ slug: p.slug, nom: `${p.nombre} · ${p.tipo}` }));
  return (
    <Pagina titulo="Demandez votre devis" intro="4 étapes, 2 minutes. On revient vers vous avec une proposition claire, sans engagement.">
      <Suspense fallback={<div className="mt-8 h-96 rounded-2xl bg-perle" />}>
        <FormulaireDevis produits={produits} />
      </Suspense>
    </Pagina>
  );
}
