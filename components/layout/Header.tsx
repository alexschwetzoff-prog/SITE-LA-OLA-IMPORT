'use client';

import { useEffect, useId, useState } from 'react';
import Image from 'next/image';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import BotonCesta from '@/components/presupuesto/BotonCesta';
import { CTA, NAV, enlaceWhatsApp } from '@/lib/site';
import { IconoCerrar, IconoMenu, IconoWhatsApp } from './Iconos';

export default function Header() {
  const [conCristal, setConCristal] = useState(false);
  const [abierto, setAbierto] = useState(false);
  const pathname = usePathname();
  const idMenu = useId();

  // El menú móvil se cierra al navegar (estado derivado de la ruta) y con Escape.
  const [rutaAnterior, setRutaAnterior] = useState(pathname);
  if (rutaAnterior !== pathname) {
    setRutaAnterior(pathname);
    setAbierto(false);
  }

  useEffect(() => {
    const alScroll = () => setConCristal(window.scrollY > 12);
    alScroll();
    window.addEventListener('scroll', alScroll, { passive: true });
    return () => window.removeEventListener('scroll', alScroll);
  }, []);

  useEffect(() => {
    if (!abierto) return;
    const alTeclear = (e: KeyboardEvent) => {
      if (e.key === 'Escape') setAbierto(false);
    };
    window.addEventListener('keydown', alTeclear);
    return () => window.removeEventListener('keydown', alTeclear);
  }, [abierto]);

  const activo = (href: string) => {
    const ruta = href.split('#')[0];
    if (!ruta || ruta === '/') return false;
    return pathname === ruta || pathname.startsWith(`${ruta}/`) || (ruta.startsWith('/disena') && pathname.startsWith('/disena'));
  };

  const fondo = conCristal || abierto ? 'border-moon-50/10 bg-space-950/70 backdrop-blur-md' : 'border-transparent bg-transparent';

  return (
    <header
      style={{ viewTransitionName: 'cabecera' }}
      className={`fixed inset-x-0 top-0 z-50 border-b transition-[background-color,border-color,backdrop-filter] duration-300 ${fondo}`}
    >
      <div className="mx-auto flex h-16 w-full max-w-6xl items-center justify-between px-4 sm:px-6 lg:h-20 lg:px-8">
        <Link href="/" className="flex shrink-0 items-center rounded-md" aria-label="[MARCA], inicio">
          <Image src="/marca/logo-marca.png" alt="[MARCA]" width={537} height={207} priority className="h-9 w-auto lg:h-10" />
        </Link>

        <nav aria-label="Principal" className="hidden items-center gap-1 lg:flex">
          {NAV.map((item) => (
            <Link
              key={item.href}
              href={item.href}
              aria-current={activo(item.href) ? 'page' : undefined}
              className="rounded-full px-3.5 py-2 text-sm font-medium text-mist-300 transition-colors hover:bg-moon-50/8 hover:text-moon-50 aria-[current=page]:text-moon-50"
            >
              {item.etiqueta}
            </Link>
          ))}
          <BotonCesta className="ml-1" />
          <Link
            href={CTA.href}
            className="ml-2 rounded-full bg-nova-600 px-4 py-2 text-sm font-semibold text-white shadow-lg shadow-nova-600/30 transition-[background-color,box-shadow] hover:bg-nova-400 hover:shadow-nova-400/40"
          >
            {CTA.etiqueta}
          </Link>
          <a
            href={enlaceWhatsApp()}
            target="_blank"
            rel="noopener noreferrer"
            aria-label="Escríbenos por WhatsApp"
            className="ml-1 rounded-full p-2 text-mist-300 transition-colors hover:bg-moon-50/8 hover:text-star-300"
          >
            <IconoWhatsApp className="h-5 w-5" />
          </a>
        </nav>

        <div className="flex items-center gap-1 lg:hidden">
          <BotonCesta />
          <button
          type="button"
          className="rounded-full p-2 text-moon-50 hover:bg-moon-50/8"
          aria-expanded={abierto}
          aria-controls={idMenu}
          aria-label={abierto ? 'Cerrar el menú' : 'Abrir el menú'}
          onClick={() => setAbierto((v) => !v)}
        >
          {abierto ? <IconoCerrar className="h-6 w-6" /> : <IconoMenu className="h-6 w-6" />}
          </button>
        </div>
      </div>

      <nav
        id={idMenu}
        aria-label="Menú"
        hidden={!abierto}
        className="border-t border-moon-50/10 bg-space-950/90 backdrop-blur-md lg:hidden"
      >
        <ul className="mx-auto flex w-full max-w-6xl flex-col gap-1 px-4 py-4 sm:px-6">
          {NAV.map((item) => (
            <li key={item.href}>
              <Link
                href={item.href}
                aria-current={activo(item.href) ? 'page' : undefined}
                className="block rounded-lg px-3 py-2.5 text-base font-medium text-mist-300 hover:bg-moon-50/8 hover:text-moon-50 aria-[current=page]:text-moon-50"
              >
                {item.etiqueta}
              </Link>
            </li>
          ))}
          <li className="pt-2">
            <Link
              href={CTA.href}
              className="block rounded-full bg-nova-600 px-4 py-3 text-center text-base font-semibold text-white shadow-lg shadow-nova-600/30 hover:bg-nova-400"
            >
              {CTA.etiqueta}
            </Link>
          </li>
          <li>
            <a
              href={enlaceWhatsApp()}
              target="_blank"
              rel="noopener noreferrer"
              className="flex items-center justify-center gap-2 rounded-full px-4 py-3 text-base font-medium text-mist-300 hover:text-star-300"
            >
              <IconoWhatsApp className="h-5 w-5" />
              Escríbenos por WhatsApp
            </a>
          </li>
        </ul>
      </nav>
    </header>
  );
}
