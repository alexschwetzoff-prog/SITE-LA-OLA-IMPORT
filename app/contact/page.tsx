import type { Metadata } from 'next';
import Contact from '@/components/accueil/Contact';
import BandeauFinal from '@/components/accueil/BandeauFinal';
import { SITE, adresseComplete } from '@/lib/site';

export const metadata: Metadata = {
  title: 'Contact',
  description: `Contactez l’atelier ${SITE.nombre} : ${SITE.telefonos[0]}, ${SITE.email}, ${adresseComplete()}.`,
  alternates: { canonical: '/contact' },
};

export const ensureStatic = 'navigation';

export default function PageContact() {
  return (
    <>
      <section className="fond-alt-2 pt-28 pb-4 lg:pt-32">
        <div className="mx-auto max-w-6xl px-4 sm:px-6 lg:px-8">
          <h1 className="font-display text-4xl font-extrabold tracking-tight text-marine sm:text-5xl">Contactez l’atelier</h1>
          <p className="mt-3 max-w-2xl text-lg text-ardoise">Un appel, un e-mail ou une visite à Monteux : on vous répond directement, sans standard.</p>
        </div>
      </section>
      <Contact titre="Nos coordonnées" />
      <BandeauFinal />
    </>
  );
}
