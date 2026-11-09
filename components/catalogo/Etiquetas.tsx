import type { Etiqueta } from '@/data/catalogo';
import { IconoDestello } from '@/components/layout/Iconos';
import { NOMBRE_ETIQUETA } from '@/lib/producto';

interface Props {
  destacado: boolean;
  /** Étiquettes du catalogue du produit (éco, femme, technique…). */
  etiquetas: Etiqueta[];
  conEstudio: boolean;
  /** Conservé pour compatibilité (studio) : le thème est clair partout, les deux tons donnent le même rendu. */
  tono?: 'claro' | 'oscuro';
  conDisena?: boolean; // étiquette « Personnalisable » sur les produits qui ont un studio
}

/** Feuille du badge ÉCO : le même symbole sur la carte, la fiche et le studio. */
export function IconoHoja({ className = '' }: { className?: string }) {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true" className={className}>
      <path d="M5 20c0-8 4-14 14-15-1 10-7 14-14 15Z" fill="currentColor" fillOpacity="0.25" />
      <path d="M5 20c3-5 6-8 10-11" />
    </svg>
  );
}

/**
 * Étiquettes d'un produit : Incontournable (badge soleil), Personnalisable (produits avec studio), le badge ÉCO (vert,
 * avec feuille : seulement les produits éco selon leur fiche technique) et les autres étiquettes du catalogue.
 * Thème clair : texte marine (ou vert foncé pour ÉCO) sur fond pastel opaque, AA partout, y compris posé sur la photo.
 */
export function Etiquetas({ destacado, etiquetas, conEstudio, conDisena = true }: Props) {
  const chip = 'bg-perle text-marine ring-1 ring-marine/10';
  const eco = 'bg-eco-100 text-eco-700 ring-1 ring-eco-600/30';
  const items: { id: string; nombre: string; estilo: string; icono?: 'destello' | 'hoja' }[] = [];
  if (destacado) items.push({ id: 'destacado', nombre: 'Incontournable', estilo: 'bg-soleil-400 text-marine', icono: 'destello' });
  if (conDisena && conEstudio) items.push({ id: 'disena', nombre: 'Personnalisable', estilo: 'bg-fuchsia-50 text-marine ring-1 ring-fuchsia-700/20' });
  if (etiquetas.includes('eco')) items.push({ id: 'eco', nombre: 'ÉCO', estilo: eco, icono: 'hoja' });
  for (const e of etiquetas) if (e !== 'eco') items.push({ id: e, nombre: NOMBRE_ETIQUETA[e], estilo: chip });
  if (!items.length) return null;
  return (
    <ul className="flex flex-wrap gap-1.5" aria-label="Étiquettes">
      {items.map((i) => (
        <li key={i.id} className={`inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-[11px] font-semibold ${i.estilo}`}>
          {i.icono === 'destello' && <IconoDestello className="h-2.5 w-2.5" />}
          {i.icono === 'hoja' && <IconoHoja className="h-3.5 w-3.5" />}
          {i.id === 'eco' ? (
            <>
              <span aria-hidden="true">{i.nombre}</span>
              <span className="sr-only">Produit éco</span>
            </>
          ) : (
            i.nombre
          )}
        </li>
      ))}
    </ul>
  );
}
