import { Seccion } from '@/components/ui/Seccion';
import { IconoAcompanar, IconoMerch, IconoPrensa } from './Iconos';

const TARJETAS = [
  {
    icono: IconoPrensa,
    titulo: 'Textil personalizado',
    texto: 'Camisetas, polos, sudaderas y gorras con impresión digital DTF a todo color, en corazón, A4 delante, A4 o A3 detrás.',
  },
  {
    icono: IconoMerch,
    titulo: 'Merchandising',
    texto: 'Bolsas, botellas, tazas, libretas, llaveros y más, con tu logo.',
  },
  {
    icono: IconoAcompanar,
    titulo: 'Te acompañamos',
    texto: 'Te ayudamos a elegir prenda, posición y tamaño, y ves las calidades antes de pedir.',
  },
];

/** Escala 2: qué hacemos, en tres tarjetas. */
export default function QueHacemos() {
  return (
    <Seccion id="que-hacemos" escala={2} nombre="Qué hacemos" etiqueta="Qué hacemos" titulo="Imprimimos tu logo en textil y merchandising.">
      <ul className="mt-10 grid gap-4 sm:grid-cols-3">
        {TARJETAS.map(({ icono: Icono, titulo, texto }) => (
          <li key={titulo} className="rounded-3xl border border-moon-50/10 bg-space-900/50 p-6">
            <span className="inline-flex h-11 w-11 items-center justify-center rounded-2xl bg-nova-600/25 text-star-300">
              <Icono className="h-6 w-6" />
            </span>
            <h3 className="mt-4 font-display text-xl font-semibold text-moon-50">{titulo}</h3>
            <p className="mt-2 text-mist-300">{texto}</p>
          </li>
        ))}
      </ul>
    </Seccion>
  );
}
