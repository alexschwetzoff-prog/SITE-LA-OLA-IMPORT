import Link from 'next/link';
import { TarjetaOpinion } from '@/components/opiniones/TarjetaOpinion';
import { Seccion } from '@/components/ui/Seccion';
import { obtenerOpiniones } from '@/lib/opiniones/obtener';

/** Escala 8: las 3 opiniones más recientes de la hoja de respuestas (fase 10). Sin ninguna, la sección entera se oculta. */
export default async function Opiniones() {
  const opiniones = (await obtenerOpiniones()).slice(0, 3);
  if (!opiniones.length) return null;
  return (
    <Seccion id="opiniones" escala={8} nombre="Opiniones" etiqueta="Opiniones" titulo="Lo que dicen los negocios que ya lo han pedido.">
      <ul className="mt-10 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {opiniones.map((o, i) => (
          <TarjetaOpinion key={`${o.fecha ?? ''}-${i}`} opinion={o} />
        ))}
      </ul>
      <p className="mt-6">
        <Link href="/opiniones" className="font-semibold text-nova-400 underline-offset-4 hover:text-star-300 hover:underline">
          Ver todas las opiniones
        </Link>
      </p>
    </Seccion>
  );
}
