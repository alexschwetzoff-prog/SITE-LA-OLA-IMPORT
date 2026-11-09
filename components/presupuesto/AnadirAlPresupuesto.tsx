'use client';

import { useId, useState } from 'react';
import Link from 'next/link';
import type { Color, Producto } from '@/data/catalogo';
import { Boton } from '@/components/ui/Botones';
import { TRAMOS, TRAMO_POR_DEFECTO, anadirAlPresupuesto, usePresupuesto, type PosicionCesta, type Tramo } from '@/lib/presupuesto';

interface Props {
  producto: Pick<Producto, 'slug' | 'nombre' | 'tipo'>;
  color: Color;
  /** Foto con la que se enseña el producto en ese color (la cesta la guarda). */
  foto?: string;
  /** Posiciones elegidas en la ficha (fase 4.1): obligatorias en prendas, gorras y bolsas. */
  posiciones?: PosicionCesta[];
  /** Si es true, no se añade sin al menos una posición; el aviso enlaza con el selector (`idPosiciones`). */
  requierePosicion?: boolean;
  idPosiciones?: string;
  /** 'principal' en los productos sin estudio; 'secundario' junto a «Diséñala con tu logo». */
  variante?: 'principal' | 'secundario';
  idBoton?: string;
}

/** Cantidad aproximada por tramos y el botón «Añadir al presupuesto»; confirma en línea y enlaza a /proyecto. */
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
    const donde = posiciones.length ? `, personalización en ${posiciones.map((p) => p.nombre.toLowerCase()).join(' y ')},` : '';
    setAnadido(`${producto.nombre} en ${color.nombre.toLowerCase()}${donde} añadido a tu presupuesto.`);
  };

  return (
    <div>
      <fieldset>
        <legend className="text-sm font-medium text-ink-900">Cantidad aproximada</legend>
        <div className="mt-2 flex flex-wrap gap-1.5">
          {TRAMOS.map((t) => (
            <label
              key={t.id}
              className="cursor-pointer rounded-full border border-ink-900/15 px-3 py-1.5 text-sm text-ink-900/80 transition-colors has-[:checked]:border-nova-600 has-[:checked]:bg-nova-600 has-[:checked]:text-white has-[:focus-visible]:ring-2 has-[:focus-visible]:ring-star-300"
            >
              <input type="radio" name={`${id}-tramo`} value={t.id} checked={tramo === t.id} onChange={() => setTramo(t.id)} className="sr-only" />
              {t.nombre}
            </label>
          ))}
        </div>
      </fieldset>
      <div className="mt-4 flex flex-wrap items-center gap-3">
        <Boton id={idBoton} variante={variante === 'principal' ? 'principal' : 'claro'} tamano={variante === 'principal' ? 'grande' : 'normal'} onClick={anadir} aria-describedby={`${id}-estado`}>
          Añadir al presupuesto
        </Boton>
        {items.length > 0 && (
          <Link href="/proyecto" className="text-sm font-semibold text-nova-600 underline-offset-4 hover:underline">
            Ver tu presupuesto ({items.length})
          </Link>
        )}
      </div>
      <p id={`${id}-estado`} role="status" aria-live="polite" className={`mt-2 min-h-5 text-sm ${falta ? 'font-medium text-[#9a2f2f]' : 'text-ink-900/80'}`}>
        {falta ? 'Elige antes dónde va la personalización.' : anadido}
      </p>
    </div>
  );
}
