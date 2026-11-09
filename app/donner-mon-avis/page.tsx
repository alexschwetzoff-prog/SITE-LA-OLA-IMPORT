import type { Metadata } from 'next';
import { IconoWhatsApp } from '@/components/layout/Iconos';
import { FormularioAvis } from '@/components/opiniones/FormularioAvis';
import { ESTILO_BOTON } from '@/components/ui/Botones';
import { Pagina } from '@/components/ui/Pagina';
import { SITE, enlaceWhatsApp } from '@/lib/site';

// Lien envoyé au client après sa commande : la page n'est pas indexée.
export const metadata: Metadata = {
  title: 'Donner mon avis',
  description: 'Vous avez commandé chez La Ola Import ? Racontez-nous comment s’est passée votre commande. Votre avis n’est publié qu’avec votre accord.',
  robots: { index: false, follow: false },
};

export default function DonnerMonAvis() {
  return (
    <Pagina titulo="Donner mon avis">
      <p className="mt-6 max-w-2xl text-lg text-ardoise">
        Merci d’avoir fait confiance à {SITE.nombre} ! Comment s’est passée votre commande ? La qualité, le conseil,
        l’accueil : dites-nous tout, en deux lignes ou plus.
      </p>
      <p className="mt-3 max-w-2xl text-ardoise">
        Nous ne modifions jamais votre texte, et nous ne le publions que si vous le souhaitez.
      </p>

      <FormularioAvis />

      <div className="mt-12 max-w-2xl border-t border-marine/10 pt-6">
        <p className="text-ardoise">Vous préférez nous écrire directement ?</p>
        <div className="mt-4 flex flex-wrap gap-3">
          <a
            href={enlaceWhatsApp(`Bonjour, je voudrais donner mon avis sur ma commande chez ${SITE.nombre}.`)}
            target="_blank"
            rel="noopener noreferrer"
            className={ESTILO_BOTON.secundario}
          >
            <IconoWhatsApp className="h-4 w-4" />
            Écrire sur WhatsApp <span className="sr-only">(nouvel onglet)</span>
          </a>
          <a href={`mailto:${SITE.email}?subject=${encodeURIComponent('Mon avis sur ma commande')}`} className={ESTILO_BOTON.secundario}>
            Écrire à {SITE.email}
          </a>
        </div>
        <p className="mt-3 text-sm text-ardoise">
          Par message, précisez si vous acceptez que votre avis soit publié et si votre prénom peut être affiché.
        </p>
      </div>
    </Pagina>
  );
}
