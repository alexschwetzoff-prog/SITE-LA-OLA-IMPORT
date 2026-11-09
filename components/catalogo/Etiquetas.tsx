import type { Etiqueta } from '@/data/catalogo';
import { IconoDestello } from '@/components/layout/Iconos';
import { NOMBRE_ETIQUETA } from '@/lib/producto';

interface Props {
  destacado: boolean;
  /** Etiquetas del catálogo del producto (eco, mujer, técnica…). */
  etiquetas: Etiqueta[];
  conEstudio: boolean;
  /** 'claro': sobre tarjeta clara; 'oscuro': sobre el fondo espacial. */
  tono?: 'claro' | 'oscuro';
  conDisena?: boolean; // etiqueta «Diséñala» en las prendas con estudio
}

/** Hoja del distintivo ECO (fase 4.4): el mismo símbolo en la tarjeta, la ficha y el estudio. */
export function IconoHoja({ className = '' }: { className?: string }) {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true" className={className}>
      <path d="M5 20c0-8 4-14 14-15-1 10-7 14-14 15Z" fill="currentColor" fillOpacity="0.25" />
      <path d="M5 20c3-5 6-8 10-11" />
    </svg>
  );
}

/**
 * Etiquetas de un producto: Destacado (con destello), Diséñala (prendas con estudio), el distintivo ECO (verde, con
 * hoja: solo en los productos eco según su ficha técnica, fase 4.4) y las demás etiquetas del catálogo.
 */
export function Etiquetas({ destacado, etiquetas, conEstudio, tono = 'claro', conDisena = true }: Props) {
  const chip = tono === 'claro' ? 'bg-ink-900/6 text-ink-900/80' : 'bg-moon-50/10 text-mist-300';
  const eco = tono === 'claro' ? 'bg-eco-100 text-eco-700 ring-1 ring-eco-600/30' : 'bg-eco-700/40 text-eco-300 ring-1 ring-eco-300/50';
  const items: { id: string; nombre: string; estilo: string; icono?: 'destello' | 'hoja' }[] = [];
  if (destacado) items.push({ id: 'destacado', nombre: 'Destacado', estilo: 'bg-nova-400/15 text-nova-600', icono: 'destello' });
  if (conDisena && conEstudio) items.push({ id: 'disena', nombre: 'Diséñala', estilo: 'bg-star-300/20 text-[#0a6d78]' });
  if (etiquetas.includes('eco')) items.push({ id: 'eco', nombre: 'ECO', estilo: eco, icono: 'hoja' });
  for (const e of etiquetas) if (e !== 'eco') items.push({ id: e, nombre: NOMBRE_ETIQUETA[e], estilo: chip });
  if (!items.length) return null;
  return (
    <ul className="flex flex-wrap gap-1.5" aria-label="Etiquetas">
      {items.map((i) => (
        <li key={i.id} className={`inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-[11px] font-semibold ${i.estilo}`}>
          {i.icono === 'destello' && <IconoDestello className="h-2.5 w-2.5" />}
          {i.icono === 'hoja' && <IconoHoja className="h-3.5 w-3.5" />}
          {i.id === 'eco' ? (
            <>
              <span aria-hidden="true">{i.nombre}</span>
              <span className="sr-only">Producto eco</span>
            </>
          ) : (
            i.nombre
          )}
        </li>
      ))}
    </ul>
  );
}
