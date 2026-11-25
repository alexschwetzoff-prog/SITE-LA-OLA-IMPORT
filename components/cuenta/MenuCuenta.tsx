'use client';

// «Espace client / Mon compte» de la cabecera. Sin sesión: enlace a /connexion. Con sesión: menú (Mes données, Favoris,
// Panier, Commandes, Administration si es admin, Se déconnecter). Accesible: aria-expanded, Escape cierra, foco visible.
import { useEffect, useRef, useState } from 'react';
import Link from 'next/link';
import { cerrarSesion } from '@/lib/cuenta/acciones';
import { useCuenta } from './almacen';

const ENLACES = [
  { href: '/compte', etiqueta: 'Mes données' },
  { href: '/compte/favoris', etiqueta: 'Favoris' },
  { href: '/compte/panier', etiqueta: 'Panier' },
  { href: '/compte/commandes', etiqueta: 'Commandes' },
];

export default function MenuCuenta({ enTiroir = false }: { enTiroir?: boolean }) {
  const estado = useCuenta((s) => s.estado);
  const rol = useCuenta((s) => s.rol);
  const nombre = useCuenta((s) => s.nombre);
  const [abierto, setAbierto] = useState(false);
  const caja = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!abierto) return;
    const fuera = (e: MouseEvent) => !caja.current?.contains(e.target as Node) && setAbierto(false);
    const tecla = (e: KeyboardEvent) => e.key === 'Escape' && setAbierto(false);
    document.addEventListener('mousedown', fuera);
    document.addEventListener('keydown', tecla);
    return () => {
      document.removeEventListener('mousedown', fuera);
      document.removeEventListener('keydown', tecla);
    };
  }, [abierto]);

  const sesion = estado !== 'anonimo' && estado !== 'cargando';
  const claseEnlace = enTiroir
    ? 'block rounded-xl px-3 py-3 text-lg font-bold text-marine hover:bg-perle'
    : 'rounded-full px-3 py-2 text-sm font-medium whitespace-nowrap text-marine/80 hover:bg-cyan-300/15 hover:text-marine';

  if (!sesion) {
    return (
      <Link href="/connexion" className={claseEnlace}>
        Espace client
      </Link>
    );
  }
  const enlaces = rol === 'admin' ? [...ENLACES, { href: '/admin', etiqueta: 'Administration' }] : ENLACES;

  if (enTiroir) {
    return (
      <div>
        <p className="px-3 pt-2 text-xs font-extrabold tracking-wide text-violet-600 uppercase">Mon compte{nombre ? ` · ${nombre}` : ''}</p>
        {estado === 'pendiente' && <p className="px-3 text-xs text-ardoise">Compte en cours de validation</p>}
        <ul>
          {enlaces.map((l) => (
            <li key={l.href}>
              <Link href={l.href} className="block rounded-lg px-3 py-2.5 text-base text-marine hover:bg-perle">
                {l.etiqueta}
              </Link>
            </li>
          ))}
        </ul>
        <form action={cerrarSesion}>
          <button type="submit" className="block w-full rounded-lg px-3 py-2.5 text-left text-base text-marine hover:bg-perle">
            Se déconnecter
          </button>
        </form>
      </div>
    );
  }
  return (
    <div ref={caja} className="relative">
      <button
        type="button"
        aria-expanded={abierto}
        aria-haspopup="true"
        onClick={() => setAbierto((v) => !v)}
        className={`${claseEnlace} inline-flex items-center gap-1.5`}
      >
        Mon compte
        {estado === 'pendiente' && <span aria-hidden="true" className="h-2 w-2 rounded-full bg-soleil-400" />}
        <svg viewBox="0 0 20 20" aria-hidden="true" className={`h-4 w-4 transition-transform ${abierto ? 'rotate-180' : ''}`} fill="currentColor">
          <path d="M5.3 7.3a1 1 0 0 1 1.4 0L10 10.6l3.3-3.3a1 1 0 1 1 1.4 1.4l-4 4a1 1 0 0 1-1.4 0l-4-4a1 1 0 0 1 0-1.4Z" />
        </svg>
      </button>
      {abierto && (
        <div className="absolute right-0 z-50 mt-2 w-56 rounded-2xl border border-marine/10 bg-fond p-2 shadow-carte-survol">
          {estado === 'pendiente' && <p className="px-3 py-2 text-xs text-ardoise">Votre compte est en cours de validation.</p>}
          <ul>
            {enlaces.map((l) => (
              <li key={l.href}>
                <Link href={l.href} onClick={() => setAbierto(false)} className="block rounded-lg px-3 py-2 text-sm text-marine hover:bg-cyan-300/15">
                  {l.etiqueta}
                </Link>
              </li>
            ))}
          </ul>
          <form action={cerrarSesion} className="mt-1 border-t border-marine/10 pt-1">
            <button type="submit" className="block w-full rounded-lg px-3 py-2 text-left text-sm text-marine hover:bg-cyan-300/15">
              Se déconnecter
            </button>
          </form>
        </div>
      )}
    </div>
  );
}
