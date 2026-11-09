import type { Metadata } from 'next';
import Link from 'next/link';
import { TarjetaOpinion } from '@/components/opiniones/TarjetaOpinion';
import { Pagina } from '@/components/ui/Pagina';
import { obtenerOpiniones } from '@/lib/opiniones/obtener';

export const metadata: Metadata = {
  title: 'Opiniones',
  description: 'Opiniones de negocios que han pedido textil y merchandising personalizado con [MARCA]. No editamos su contenido.',
  alternates: { canonical: '/opiniones' },
};

// Fase 10: las opiniones salen de la hoja de respuestas del formulario de opinión (pestaña «Web», CSV publicado;
// lib/opiniones/obtener.ts), solo las que el cliente ha autorizado publicar. Sin ninguna, un estado sobrio: nada de
// testimonios de relleno.
export default async function Opiniones() {
  const opiniones = await obtenerOpiniones();
  return (
    <Pagina titulo="Opiniones">
      <p className="mt-6 max-w-2xl text-lg text-mist-300">
        Aquí publicamos las opiniones de los negocios que han hecho un pedido con nosotros, tal como las escriben: no editamos su contenido y solo salen con su permiso.
      </p>
      {opiniones.length ? (
        <ul className="mt-10 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {opiniones.map((o, i) => (
            <TarjetaOpinion key={`${o.fecha ?? ''}-${i}`} opinion={o} />
          ))}
        </ul>
      ) : (
        <div className="mt-10 max-w-2xl rounded-3xl border border-moon-50/10 bg-space-900/50 p-6 sm:p-8">
          <p className="font-display text-xl font-semibold text-moon-50">Aún no publicamos opiniones de clientes.</p>
          <p className="mt-3 text-mist-300">
            Pedimos su opinión a cada cliente unos días después de la entrega y la publicamos solo con su permiso. Si ya has hecho un pedido con nosotros, puedes{' '}
            <Link href="/tu-opinion" className="font-semibold text-nova-400 underline-offset-4 hover:text-star-300 hover:underline">
              contarnos tu opinión
            </Link>
            .
          </p>
        </div>
      )}
    </Pagina>
  );
}
