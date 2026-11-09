import Link from 'next/link';
import { CTA, ENLACES_LEGALES, SEGMENTS, SITE, enlaceTelefono, enlaceWhatsApp } from '@/lib/site';
import { IconoInstagram, IconoWhatsApp } from './Iconos';
import Logo from './Logo';
import Vague from '@/components/ui/Vague';

// Pied de page sur fond marine : coordonnées de l'atelier de Monteux, liens catalogue / professionnels / infos,
// mentions légales, réseaux. Les données entre crochets viennent de lib/site.ts et sont [à confirmer].
export default function Footer() {
  const { direccion: d } = SITE;
  const lien = 'rounded text-white/80 underline-offset-4 hover:text-white hover:underline';
  const titreCol = 'font-display text-sm font-extrabold tracking-wide text-cyan-300 uppercase';

  return (
    <footer className="relative mt-16 bg-marine text-white">
      <Vague couleur="var(--color-marine)" className="absolute inset-x-0 -top-[39px] h-10 w-full" />
      <div className="mx-auto grid w-full max-w-7xl gap-10 px-4 pt-14 pb-10 sm:px-6 md:grid-cols-2 lg:grid-cols-5 lg:px-8">
        <div className="lg:col-span-2">
          {/* Zone de protection : cartouche blanc arrondi autour du logo sur fond marine. */}
          <Link href="/" aria-label={`${SITE.nombre}, accueil`} className="inline-block rounded-2xl bg-white p-3">
            <Logo className="h-20 w-auto" />
          </Link>
          <p className="mt-4 font-display text-xl font-extrabold">{SITE.lema}</p>
          <address className="mt-4 space-y-1 text-sm not-italic text-white/80">
            <p>
              <a href={d.mapaUrl} target="_blank" rel="noopener noreferrer" className={lien}>
                {d.calle} · {d.cp} {d.ciudad} (Vaucluse)
              </a>
            </p>
            {SITE.telefonos.map((tel) => (
              <p key={tel}>
                <a href={enlaceTelefono(tel)} className={lien}>
                  {tel}
                </a>
              </p>
            ))}
            <p>
              <a href={`mailto:${SITE.email}`} className={lien}>
                {SITE.email}
              </a>
            </p>
            <p>Horaires : {SITE.horario}</p>
          </address>
          <div className="mt-5 flex flex-wrap gap-2">
            <Link href={CTA.href} className="rounded-full bg-fuchsia-700 px-5 py-2.5 text-sm font-semibold text-white hover:bg-fuchsia-800">
              {CTA.etiqueta}
            </Link>
            <a
              href={enlaceWhatsApp()}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center gap-2 rounded-full border border-white/30 px-4 py-2.5 text-sm font-semibold hover:bg-white/10"
            >
              <IconoWhatsApp className="h-4 w-4" />
              WhatsApp
            </a>
          </div>
        </div>

        <nav aria-label="Catalogue">
          <p className={titreCol}>Catalogue</p>
          <ul className="mt-3 space-y-2 text-sm">
            <li><Link href="/catalogue?categoria=camisetas-polos" className={lien}>T-shirts et polos</Link></li>
            <li><Link href="/catalogue?categoria=sudaderas" className={lien}>Sweats et vestes</Link></li>
            <li><Link href="/catalogue?categoria=bolsas" className={lien}>Sacs et tote bags</Link></li>
            <li><Link href="/catalogue?categoria=goodies" className={lien}>Objets publicitaires</Link></li>
            <li><Link href="/personnaliser/atomic-150" className={lien}>Personnaliser un t-shirt</Link></li>
          </ul>
        </nav>

        <nav aria-label="Professionnels">
          <p className={titreCol}>Professionnels</p>
          <ul className="mt-3 space-y-2 text-sm">
            {SEGMENTS.map((s) => (
              <li key={s.slug}>
                <Link href={`/professionnels/${s.slug}`} className={lien}>{s.nom}</Link>
              </li>
            ))}
            <li><Link href="/devis" className={lien}>Demander un devis</Link></li>
          </ul>
        </nav>

        <nav aria-label="Informations">
          <p className={titreCol}>Infos</p>
          <ul className="mt-3 space-y-2 text-sm">
            <li><Link href="/comment-nous-travaillons" className={lien}>Comment nous travaillons</Link></li>
            <li><Link href="/qui-sommes-nous" className={lien}>Qui sommes-nous</Link></li>
            <li><Link href="/livraison-et-paiement" className={lien}>Livraison et paiement</Link></li>
            <li><Link href="/avis" className={lien}>Avis clients</Link></li>
            <li><Link href="/espace-client" className={lien}>Espace client</Link></li>
          </ul>
          <div className="mt-5 flex gap-3">
            <a href={SITE.instagram.url} target="_blank" rel="noopener noreferrer" aria-label="Instagram de La Ola Import" className="rounded-full p-2 text-white/80 hover:bg-white/10 hover:text-white">
              <IconoInstagram className="h-5 w-5" />
            </a>
            <a href={SITE.facebook.url} target="_blank" rel="noopener noreferrer" aria-label="Facebook de La Ola Import" className="rounded-full p-2 text-white/80 hover:bg-white/10 hover:text-white">
              <svg viewBox="0 0 24 24" fill="currentColor" aria-hidden="true" className="h-5 w-5">
                <path d="M13.5 21v-7.5h2.5l.4-3h-2.9V8.6c0-.9.3-1.5 1.5-1.5h1.5V4.4c-.3 0-1.2-.1-2.2-.1-2.2 0-3.7 1.3-3.7 3.8v2.4H8v3h2.6V21h2.9Z" />
              </svg>
            </a>
          </div>
        </nav>
      </div>

      <div className="border-t border-white/15">
        <div className="mx-auto flex w-full max-w-7xl flex-col gap-3 px-4 py-6 text-xs text-white/70 sm:px-6 lg:flex-row lg:items-center lg:justify-between lg:px-8">
          <p>
            © {SITE.nombre} · {SITE.titular.nombre} · SIRET {SITE.titular.nif}
          </p>
          <ul className="flex flex-wrap gap-x-4 gap-y-2">
            {ENLACES_LEGALES.map((l) => (
              <li key={l.href}>
                <Link href={l.href} className={lien}>{l.etiqueta}</Link>
              </li>
            ))}
          </ul>
        </div>
      </div>
    </footer>
  );
}
