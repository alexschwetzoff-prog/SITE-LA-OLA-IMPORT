import Link from 'next/link';
import { Seccion } from '@/components/ui/Seccion';
import { SEGMENTS } from '@/lib/site';

const TEINTES = ['bg-cyan-300/20', 'bg-bleu-600/10', 'bg-violet-600/10', 'bg-fuchsia-50'];

/** Aiguillage B2B dès le haut de page : une carte par segment, plus un lien pour les particuliers. */
export default function Segments() {
  return (
    <Seccion id="vous-etes" etiqueta="Vous êtes…" titulo="Un club, un camping, une boutique, une entreprise ? On a l’habitude." fond="perle">
      <ul className="mt-8 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        {SEGMENTS.map((s, i) => (
          <li key={s.slug}>
            <Link
              href={`/professionnels/${s.slug}`}
              className={`carte-produit flex h-full flex-col justify-between gap-6 rounded-2xl p-5 ring-1 ring-marine/5 ${TEINTES[i % TEINTES.length]}`}
            >
              <span>
                <span className="block font-display text-xl font-extrabold text-marine">{s.nom}</span>
                <span className="mt-2 block text-ardoise">{s.accroche}</span>
              </span>
              <span className="text-sm font-semibold text-bleu-600">Voir les idées pour vous →</span>
            </Link>
          </li>
        ))}
      </ul>
      <p className="mt-6 text-ardoise">
        Vous êtes un particulier ?{' '}
        <Link href="/catalogue" className="font-semibold text-bleu-600 underline underline-offset-4 hover:text-indigo-700">
          Par ici, le catalogue est aussi pour vous.
        </Link>
      </p>
    </Seccion>
  );
}
