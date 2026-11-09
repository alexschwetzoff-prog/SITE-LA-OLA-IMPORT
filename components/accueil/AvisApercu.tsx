import Link from 'next/link';
import { TarjetaOpinion } from '@/components/opiniones/TarjetaOpinion';
import { Seccion } from '@/components/ui/Seccion';
import { obtenerOpiniones } from '@/lib/opiniones/obtener';

/** Les 3 avis réels les plus récents (publiés avec accord). Sans avis, la section entière disparaît : aucun faux témoignage. */
export default async function AvisApercu() {
  const opiniones = (await obtenerOpiniones()).slice(0, 3);
  if (!opiniones.length) return null;
  return (
    <Seccion id="avis" etiqueta="Avis clients" titulo="Ils nous ont confié leurs couleurs.">
      <ul className="mt-8 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {opiniones.map((o, i) => (
          <TarjetaOpinion key={`${o.fecha ?? ''}-${i}`} opinion={o} />
        ))}
      </ul>
      <p className="mt-6">
        <Link href="/avis" className="font-semibold text-bleu-600 underline-offset-4 hover:text-indigo-700 hover:underline">
          Lire tous les avis
        </Link>
      </p>
    </Seccion>
  );
}
