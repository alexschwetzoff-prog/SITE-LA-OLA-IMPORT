import type { Opinion } from '@/lib/opiniones/opiniones';

// Un avis client : le texte brut tel que le client l'a écrit (React l'échappe ; jamais de HTML ni de lien), le nom
// qu'il a autorisé (sinon « Client de La Ola Import ») et, si la ligne la contient, la date. Ni étoiles ni balisage
// schema.org.

const fechaLarga = new Intl.DateTimeFormat('fr-FR', { day: 'numeric', month: 'long', year: 'numeric', timeZone: 'UTC' });

export function textoFecha(fecha: string): string {
  const [a, m, d] = fecha.split('-').map(Number);
  return fechaLarga.format(new Date(Date.UTC(a, m - 1, d)));
}

export function TarjetaOpinion({ opinion }: { opinion: Opinion }) {
  return (
    <li>
      <figure className="flex h-full flex-col rounded-2xl bg-white p-6 shadow-carte ring-1 ring-marine/5">
        <blockquote className="whitespace-pre-line text-marine">
          <p>{opinion.texto}</p>
        </blockquote>
        <figcaption className="mt-auto pt-4 text-sm text-ardoise">
          <span className="font-semibold text-marine">{opinion.nombre}</span>
          {opinion.fecha && (
            <>
              {' · '}
              <time dateTime={opinion.fecha}>{textoFecha(opinion.fecha)}</time>
            </>
          )}
        </figcaption>
      </figure>
    </li>
  );
}
