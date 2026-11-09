import type { Opinion } from '@/lib/opiniones/opiniones';

// Una opinión de cliente (fase 10): texto plano tal cual lo escribió (React lo escapa; nunca HTML ni enlaces), el
// nombre que ha autorizado y, si la fila la trae, la fecha. Sin estrellas ni marcado schema.org.

const fechaLarga = new Intl.DateTimeFormat('es-ES', { day: 'numeric', month: 'long', year: 'numeric', timeZone: 'UTC' });

export function textoFecha(fecha: string): string {
  const [a, m, d] = fecha.split('-').map(Number);
  return fechaLarga.format(new Date(Date.UTC(a, m - 1, d)));
}

export function TarjetaOpinion({ opinion }: { opinion: Opinion }) {
  return (
    <li className="flex flex-col rounded-3xl border border-moon-50/10 bg-space-900/50 p-6">
      <blockquote className="whitespace-pre-line text-moon-50">{opinion.texto}</blockquote>
      <p className="mt-4 text-sm text-mist-300">
        <span className="font-semibold text-moon-50">{opinion.nombre}</span>
        {opinion.fecha && (
          <>
            {' · '}
            <time dateTime={opinion.fecha}>{textoFecha(opinion.fecha)}</time>
          </>
        )}
      </p>
    </li>
  );
}
