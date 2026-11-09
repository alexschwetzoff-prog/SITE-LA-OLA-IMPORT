'use client';

import { useId, useState } from 'react';
import Link from 'next/link';
import type { Color, Producto } from '@/data/catalogo';
import { Boton } from '@/components/ui/Botones';
import { TRAMOS, TRAMO_POR_DEFECTO, anadirAlPresupuesto, usePresupuesto, type PosicionCesta, type Tramo } from '@/lib/presupuesto';

interface Props {
  producto: Pick<Producto, 'slug' | 'nombre' | 'tipo'>;
  color: Color;
  /** Photo du produit dans cette couleur (le panier la garde). */
  foto?: string;
  /** Emplacements choisis sur la fiche : obligatoires pour les textiles, casquettes et sacs. */
  posiciones?: PosicionCesta[];
  /** Si true, rien n'est ajouté sans au moins un emplacement ; le message renvoie au sélecteur (`idPosiciones`). */
  requierePosicion?: boolean;
  idPosiciones?: string;
  /** 'principal' : bouton fuchsia « Ajouter au panier » (le seul bouton fuchsia de la fiche) ; 'secundario' : contour. */
  variante?: 'principal' | 'secundario';
  idBoton?: string;
}

/** Quantité approximative par tranche et bouton « Ajouter au panier » ; confirme en ligne et renvoie vers /projet. */
export default function AnadirAlPresupuesto({ producto, color, foto, posiciones = [], requierePosicion = false, idPosiciones, variante = 'principal', idBoton }: Props) {
  const [tramo, setTramo] = useState<Tramo>(TRAMO_POR_DEFECTO);
  const [anadido, setAnadido] = useState<string | null>(null);
  const [falta, setFalta] = useState(false);
  const items = usePresupuesto();
  const id = useId();

  const anadir = () => {
    if (requierePosicion && !posiciones.length) {
      setFalta(true);
      setAnadido(null);
      if (idPosiciones) document.getElementById(idPosiciones)?.focus();
      return;
    }
    anadirAlPresupuesto({
      slug: producto.slug,
      nombre: producto.nombre,
      tipo: producto.tipo,
      color: { nombre: color.nombre, hex: color.hex, hexSecundario: color.hexSecundario },
      tramo,
      posiciones: posiciones.length ? posiciones : undefined,
      foto,
    });
    setFalta(false);
    const donde = posiciones.length ? `, marquage ${posiciones.map((p) => p.nombre.toLowerCase()).join(' et ')},` : '';
    setAnadido(`${producto.nombre} coloris ${color.nombre.toLowerCase()}${donde} ajouté au panier.`);
  };

  return (
    <div>
      <fieldset>
        <legend className="text-sm font-medium text-encre">Quantité approximative</legend>
        <div className="mt-2 flex flex-wrap gap-1.5">
          {TRAMOS.map((t) => (
            <label
              key={t.id}
              className="flex min-h-10 cursor-pointer items-center rounded-full border border-marine/20 bg-white px-3.5 py-1.5 text-sm text-marine transition-colors hover:border-marine/40 has-[:checked]:border-marine has-[:checked]:bg-marine has-[:checked]:font-semibold has-[:checked]:text-white has-[:focus-visible]:ring-2 has-[:focus-visible]:ring-bleu-600 has-[:focus-visible]:ring-offset-2"
            >
              <input type="radio" name={`${id}-tramo`} value={t.id} checked={tramo === t.id} onChange={() => setTramo(t.id)} className="sr-only" />
              {t.nombre}
            </label>
          ))}
        </div>
      </fieldset>
      <div className="mt-4 flex flex-wrap items-center gap-3">
        <Boton id={idBoton} variante={variante === 'principal' ? 'principal' : 'claro'} tamano={variante === 'principal' ? 'grande' : 'normal'} onClick={anadir} aria-describedby={`${id}-estado`} className="min-h-12">
          Ajouter au panier
        </Boton>
        {items.length > 0 && (
          <Link href="/projet" className="text-sm font-semibold text-bleu-600 underline underline-offset-4 hover:text-indigo-700">
            Voir mon panier ({items.length})
          </Link>
        )}
      </div>
      <p id={`${id}-estado`} role="status" aria-live="polite" className={`mt-2 min-h-5 text-sm ${falta ? 'font-medium text-[#9a2f2f]' : 'text-marine'}`}>
        {falta ? 'Choisissez d’abord l’emplacement du marquage.' : anadido}
      </p>
    </div>
  );
}
