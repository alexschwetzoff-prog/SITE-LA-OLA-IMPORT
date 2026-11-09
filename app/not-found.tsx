import type { Metadata } from 'next';
import Link from 'next/link';
import { Pagina } from '@/components/ui/Pagina';

export const metadata: Metadata = { title: 'Page introuvable', robots: { index: false, follow: true } };

export default function Introuvable() {
  return (
    <Pagina titulo="Cette vague n’existe pas…" intro="…mais notre catalogue, si ! Le lien est peut-être erroné, ou la page a changé de place.">
      <div className="mt-8 flex flex-col gap-8 sm:flex-row sm:items-center">
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img src="/marca/surfi/surfi-dessus.webp" alt="" width={300} height={600} className="w-28 shrink-0 sm:w-36" />
        <div className="flex flex-wrap gap-3">
          <Link href="/catalogue" className="inline-flex min-h-11 items-center rounded-full bg-fuchsia-700 px-5 font-semibold text-white hover:bg-fuchsia-800">
            Voir le catalogue
          </Link>
          <Link href="/devis" className="inline-flex min-h-11 items-center rounded-full border-2 border-violet-600 px-5 font-semibold text-violet-600 hover:bg-violet-600/8">
            Demander un devis
          </Link>
          <Link href="/" className="inline-flex min-h-11 items-center rounded-full px-5 font-semibold text-bleu-600 underline underline-offset-4">
            Retour à l’accueil
          </Link>
        </div>
      </div>
    </Pagina>
  );
}
