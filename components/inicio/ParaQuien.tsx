import { Seccion } from '@/components/ui/Seccion';
import { IconoLocal, IconoMerch, IconoPack } from './Iconos';

// Sin etiquetas de sectores (decisión del equipo, 12/10/2026). Fase 10 (19/10/2026): título abierto a todo tipo de
// negocios, tres usos (local, packs y merchandising corporativo) y sin la línea suelta del equipo.
const USOS = [
  { icono: IconoLocal, titulo: 'Véndelo en tu local', texto: 'Camisetas, sudaderas y gorras con tu marca, listas para el mostrador.' },
  { icono: IconoPack, titulo: 'Inclúyelo en tus packs de matrícula, alta o bienvenida', texto: 'Tus clientes se llevan tu marca puesta desde el primer día.' },
  { icono: IconoMerch, titulo: 'Merchandising corporativo', texto: 'Prendas y detalles con tu marca para tu equipo, tus eventos y tus clientes.' },
];

/** Escala 3: para quién trabajamos (ICP), con los tres usos del merch. */
export default function ParaQuien() {
  return (
    <Seccion
      id="para-quien"
      escala={3}
      nombre="Para quién"
      etiqueta="Para quién"
      titulo="Para todo tipo de negocios. Y sobre todo para los que quieren que su marca se vea."
      intro="Negocios pequeños e independientes, marcas que empiezan y empresas con equipo. Tú decides cómo quieres que se vea tu marca; nosotros nos encargamos de que quede bien puesta."
    >
      <ul className="mt-10 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {USOS.map(({ icono: Icono, titulo, texto }) => (
          <li key={titulo} className="flex gap-4 rounded-3xl border border-moon-50/10 bg-space-900/50 p-6">
            <span className="inline-flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl bg-nova-600/25 text-star-300">
              <Icono className="h-7 w-7" />
            </span>
            <div>
              <h3 className="font-display text-lg font-semibold text-moon-50">{titulo}</h3>
              <p className="mt-1 text-mist-300">{texto}</p>
            </div>
          </li>
        ))}
      </ul>
    </Seccion>
  );
}
