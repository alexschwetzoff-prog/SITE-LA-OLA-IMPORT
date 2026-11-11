'use client';

import { useEffect, useId, useRef, useState } from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import BotonCesta from '@/components/presupuesto/BotonCesta';
import { CTA, NAV, SITE, enlaceTelefono, enlaceWhatsApp } from '@/lib/site';
import { MENU_CATALOGUE } from '@/lib/menu';
import { IconoCerrar, IconoMenu, IconoWhatsApp } from './Iconos';
import Logo from './Logo';

// En-tête fixe (toujours blanc) : logo, Catalogue (méga-menu), Comment nous travaillons, Qui sommes-nous, Espace
// client, panier et bouton « Demander un devis ». En mobile, un burger ouvre un tiroir plein écran avec les mêmes
// entrées (Catalogue en accordéon). Le reste de la page devient inerte tant que le tiroir est ouvert.
export default function Header() {
  const [tiroir, setTiroir] = useState(false);
  const [megaMenu, setMegaMenu] = useState(false);
  const [accordeon, setAccordeon] = useState<string | null>(null);
  const pathname = usePathname();
  const idTiroir = useId();
  const idMega = useId();
  const zoneMega = useRef<HTMLDivElement>(null);

  // Tout se ferme quand on change de page.
  const [rutaAnterior, setRutaAnterior] = useState(pathname);
  if (rutaAnterior !== pathname) {
    setRutaAnterior(pathname);
    setTiroir(false);
    setMegaMenu(false);
  }

  // Échap ferme le menu ouvert ; un clic en dehors ferme le méga-menu.
  useEffect(() => {
    if (!tiroir && !megaMenu) return;
    const touche = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        setTiroir(false);
        setMegaMenu(false);
      }
    };
    const clic = (e: MouseEvent) => {
      if (megaMenu && zoneMega.current && !zoneMega.current.contains(e.target as Node)) setMegaMenu(false);
    };
    window.addEventListener('keydown', touche);
    document.addEventListener('mousedown', clic);
    return () => {
      window.removeEventListener('keydown', touche);
      document.removeEventListener('mousedown', clic);
    };
  }, [tiroir, megaMenu]);

  // Tiroir mobile ouvert : la page derrière est inerte (le focus reste dans le menu) et ne défile plus.
  useEffect(() => {
    const zones = [document.getElementById('contenu'), document.querySelector('footer')].filter(Boolean) as HTMLElement[];
    zones.forEach((z) => (z.inert = tiroir));
    document.body.style.overflow = tiroir ? 'hidden' : '';
    return () => {
      zones.forEach((z) => (z.inert = false));
      document.body.style.overflow = '';
    };
  }, [tiroir]);

  const actif = (href: string) => {
    const ruta = href.split(/[?#]/)[0];
    return ruta !== '/' && (pathname === ruta || pathname.startsWith(`${ruta}/`));
  };

  const lienNav =
    'rounded-full px-3 py-2 text-sm font-semibold text-marine/80 transition-colors hover:bg-cyan-300/15 hover:text-marine aria-[current=page]:text-cyan-700';

  return (
    <header className="fixed inset-x-0 top-0 z-50 border-b border-marine/10 bg-[var(--bg-entete)] backdrop-blur-sm">
      <div className="mx-auto flex h-20 w-full max-w-7xl items-center justify-between gap-3 px-4 sm:px-6 lg:px-8">
        <Link href="/" className="shrink-0 rounded-lg p-1" aria-label={`${SITE.nombre}, accueil`}>
          <Logo className="h-[68px] w-auto" priority />
        </Link>

        {/* Bureau */}
        <nav aria-label="Principal" className="hidden items-center gap-0.5 lg:flex">
          <div ref={zoneMega} className="relative">
            <button
              type="button"
              aria-expanded={megaMenu}
              aria-controls={idMega}
              onClick={() => setMegaMenu((v) => !v)}
              className={`${lienNav} inline-flex items-center gap-1`}
              aria-current={actif('/catalogue') ? 'page' : undefined}
            >
              Catalogue
              <svg viewBox="0 0 20 20" aria-hidden="true" className={`h-4 w-4 transition-transform ${megaMenu ? 'rotate-180' : ''}`} fill="currentColor">
                <path d="M5.3 7.3a1 1 0 0 1 1.4 0L10 10.6l3.3-3.3a1 1 0 1 1 1.4 1.4l-4 4a1 1 0 0 1-1.4 0l-4-4a1 1 0 0 1 0-1.4Z" />
              </svg>
            </button>
            <div
              id={idMega}
              hidden={!megaMenu}
              className="absolute top-full left-1/2 mt-3 w-[min(56rem,calc(100vw-2rem))] -translate-x-1/2 rounded-2xl border border-marine/10 bg-fond p-6 shadow-carte-survol"
            >
              <div className="grid grid-cols-4 gap-6">
                {MENU_CATALOGUE.map((col) => (
                  <div key={col.titre}>
                    <p className="font-display text-sm font-extrabold tracking-wide text-violet-600 uppercase">{col.titre}</p>
                    <ul className="mt-3 space-y-1">
                      {col.liens.map((l) => (
                        <li key={l.href + l.etiqueta}>
                          <Link href={l.href} className="block rounded-lg px-2 py-1.5 text-sm text-marine hover:bg-cyan-300/15">
                            {l.etiqueta}
                          </Link>
                        </li>
                      ))}
                      {col.tout && (
                        <li>
                          <Link href={col.tout.href} className="block rounded-lg px-2 py-1.5 text-sm font-semibold text-bleu-600 hover:underline">
                            {col.tout.etiqueta} →
                          </Link>
                        </li>
                      )}
                    </ul>
                  </div>
                ))}
              </div>
            </div>
          </div>
          {NAV.filter((n) => n.href !== '/catalogue').map((item) => (
            <Link key={item.href} href={item.href} aria-current={actif(item.href) ? 'page' : undefined} className={lienNav}>
              {item.etiqueta}
            </Link>
          ))}
          <a
            href={enlaceTelefono(SITE.telefonos[0])}
            className="ml-1 hidden rounded-full px-3 py-2 text-sm font-semibold whitespace-nowrap text-marine/80 hover:bg-cyan-300/15 hover:text-marine xl:inline-flex"
          >
            {SITE.telefonos[0]}
          </a>
          <BotonCesta className="ml-1" />
          <Link
            href={CTA.href}
            className="ml-2 rounded-full bg-fuchsia-700 px-5 py-2.5 text-sm font-semibold text-white shadow-md shadow-fuchsia-700/25 transition-colors hover:bg-fuchsia-800"
          >
            {CTA.etiqueta}
          </Link>
        </nav>

        {/* Mobile */}
        <div className="flex items-center gap-1 lg:hidden">
          <BotonCesta />
          <button
            type="button"
            className="inline-flex h-11 w-11 items-center justify-center rounded-full text-marine hover:bg-marine/5"
            aria-expanded={tiroir}
            aria-controls={idTiroir}
            aria-label={tiroir ? 'Fermer le menu' : 'Ouvrir le menu'}
            onClick={() => setTiroir((v) => !v)}
          >
            {tiroir ? <IconoCerrar className="h-6 w-6" /> : <IconoMenu className="h-6 w-6" />}
          </button>
        </div>
      </div>

      <nav
        id={idTiroir}
        aria-label="Menu"
        hidden={!tiroir}
        className="h-[calc(100dvh-5rem)] overflow-y-auto border-t border-marine/10 bg-fond lg:hidden"
      >
        <ul className="mx-auto flex w-full max-w-xl flex-col px-4 py-4">
          <li>
            <button
              type="button"
              aria-expanded={accordeon === 'catalogue'}
              onClick={() => setAccordeon((a) => (a === 'catalogue' ? null : 'catalogue'))}
              className="flex w-full items-center justify-between rounded-xl px-3 py-3 text-left text-lg font-bold text-marine hover:bg-perle"
            >
              Catalogue
              <svg viewBox="0 0 20 20" aria-hidden="true" className={`h-5 w-5 transition-transform ${accordeon === 'catalogue' ? 'rotate-180' : ''}`} fill="currentColor">
                <path d="M5.3 7.3a1 1 0 0 1 1.4 0L10 10.6l3.3-3.3a1 1 0 1 1 1.4 1.4l-4 4a1 1 0 0 1-1.4 0l-4-4a1 1 0 0 1 0-1.4Z" />
              </svg>
            </button>
            {accordeon === 'catalogue' && (
              <div className="space-y-4 px-3 pt-1 pb-3">
                {MENU_CATALOGUE.map((col) => (
                  <div key={col.titre}>
                    <p className="text-xs font-extrabold tracking-wide text-violet-600 uppercase">{col.titre}</p>
                    <ul className="mt-1">
                      {[...col.liens, ...(col.tout ? [col.tout] : [])].map((l) => (
                        <li key={l.href + l.etiqueta}>
                          <Link href={l.href} className="block rounded-lg px-2 py-2.5 text-base text-marine hover:bg-perle">
                            {l.etiqueta}
                          </Link>
                        </li>
                      ))}
                    </ul>
                  </div>
                ))}
              </div>
            )}
          </li>
          {NAV.filter((n) => n.href !== '/catalogue').map((item) => (
            <li key={item.href}>
              <Link
                href={item.href}
                aria-current={actif(item.href) ? 'page' : undefined}
                className="block rounded-xl px-3 py-3 text-lg font-bold text-marine hover:bg-perle aria-[current=page]:text-cyan-700"
              >
                {item.etiqueta}
              </Link>
            </li>
          ))}
          <li className="pt-4">
            <Link href={CTA.href} className="block rounded-full bg-fuchsia-700 px-4 py-3.5 text-center text-base font-semibold text-white hover:bg-fuchsia-800">
              {CTA.etiqueta}
            </Link>
          </li>
          <li className="grid grid-cols-2 gap-2 pt-2">
            <a
              href={enlaceWhatsApp()}
              target="_blank"
              rel="noopener noreferrer"
              className="flex items-center justify-center gap-2 rounded-full border border-marine/15 px-4 py-3 text-sm font-semibold text-marine hover:bg-perle"
            >
              <IconoWhatsApp className="h-5 w-5" />
              WhatsApp
            </a>
            <a
              href={enlaceTelefono(SITE.telefonos[0])}
              className="flex items-center justify-center gap-2 rounded-full border border-marine/15 px-4 py-3 text-sm font-semibold text-marine hover:bg-perle"
            >
              Appeler l’atelier
            </a>
          </li>
        </ul>
      </nav>
    </header>
  );
}
