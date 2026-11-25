'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { useCuenta } from './almacen';

const PESTANAS = [
  { href: '/compte', etiqueta: 'Mes données' },
  { href: '/compte/favoris', etiqueta: 'Favoris' },
  { href: '/compte/panier', etiqueta: 'Panier' },
  { href: '/compte/commandes', etiqueta: 'Commandes' },
];

/** Pestañas del espacio cliente (enlaces; la página actual lleva aria-current). */
export default function NavegacionCuenta() {
  const ruta = usePathname();
  const favoritos = useCuenta((s) => s.favoritos.length);
  const carrito = useCuenta((s) => s.lineasCarrito);
  return (
    <nav aria-label="Espace client" className="mt-6 border-b border-marine/10">
      <ul className="flex gap-1 overflow-x-auto [scrollbar-width:none]">
        {PESTANAS.map((p) => {
          const actual = ruta === p.href;
          const n = p.href === '/compte/favoris' ? favoritos : p.href === '/compte/panier' ? carrito : 0;
          return (
            <li key={p.href}>
              <Link
                href={p.href}
                aria-current={actual ? 'page' : undefined}
                className="inline-flex min-h-11 items-center gap-1.5 border-b-2 border-transparent px-4 text-sm font-semibold whitespace-nowrap text-ardoise hover:text-marine aria-[current=page]:border-fuchsia-700 aria-[current=page]:text-marine"
              >
                {p.etiqueta}
                {n > 0 && <span className="rounded-full bg-perle px-1.5 text-xs text-marine">{n}</span>}
              </Link>
            </li>
          );
        })}
      </ul>
    </nav>
  );
}
