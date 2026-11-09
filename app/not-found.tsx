import type { Metadata } from 'next';
import Link from 'next/link';
import { Pagina } from '@/components/ui/Pagina';

export const metadata: Metadata = { title: 'Página no encontrada', robots: { index: false, follow: true } };

export default function NoEncontrada() {
  return (
    <Pagina titulo="Esta página no existe.">
      <p className="mt-6 text-lg text-mist-300">Puede que el enlace esté mal o que la página haya cambiado de sitio.</p>
      <p className="mt-8">
        <Link
          href="/"
          className="inline-flex rounded-full bg-nova-600 px-5 py-2.5 font-semibold text-white shadow-lg shadow-nova-600/30 hover:bg-nova-400"
        >
          Volver al inicio
        </Link>
      </p>
    </Pagina>
  );
}
