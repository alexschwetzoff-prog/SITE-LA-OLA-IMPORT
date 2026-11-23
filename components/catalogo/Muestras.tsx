'use client';

import { useState } from 'react';

interface Muestra {
  nombre: string;
  hex: string;
  hexSecundario?: string;
  /** Foto de la variante: si la lleva y el producto es de motifs, se muestra una miniatura en vez de un círculo de color. */
  miniatura?: string;
}

/** Fond d'une pastille de couleur : uni, ou coupé en diagonale pour les articles bicolores. */
export function fondoMuestra(c: Pick<Muestra, 'hex' | 'hexSecundario'>): string {
  return c.hexSecundario ? `linear-gradient(135deg, ${c.hex} 50%, ${c.hexSecundario} 50%)` : c.hex;
}

interface Props<T extends Muestra> {
  colores: T[];
  elegido: T;
  onElegir: (c: T) => void;
  maximo?: number; // cartes : 8 et « +N », qui déplie les autres dans la carte (5 pour les miniatures de motifs)
  tipo?: 'color' | 'diseno'; // 'diseno' : miniatures de la photo de chaque motif au lieu de pastilles de couleur
}

/**
 * Pastilles de couleur : un clic montre l'article dans cette couleur. Au plus `maximo` visibles ; « +N » déplie les
 * autres dans la carte. Sur fond clair : la pastille choisie porte un anneau marine (l'état ne repose pas que sur la
 * couleur : aria-pressed et nom de la couleur affiché sous les pastilles).
 */
export function Muestras<T extends Muestra>({ colores, elegido, onElegir, maximo, tipo = 'color' }: Props<T>) {
  const conMiniaturas = tipo === 'diseno' && colores.every((c) => c.miniatura);
  const palabra = tipo === 'diseno' ? 'Motif' : 'Couleur';
  const palabras = tipo === 'diseno' ? 'motifs' : 'couleurs';
  maximo ??= conMiniaturas ? 5 : 8;
  const [todas, setTodas] = useState(false);
  const visibles = todas ? colores : colores.slice(0, maximo);
  const resto = colores.length - visibles.length;
  return (
    <div className="flex flex-wrap items-center gap-1.5" role="group" aria-label={`${palabra} : ${elegido.nombre}`}>
      {visibles.map((c) => {
        const activo = c.nombre === elegido.nombre;
        return (
          <button
            key={c.nombre}
            type="button"
            aria-pressed={activo}
            title={c.nombre}
            onClick={() => onElegir(c)}
            className={conMiniaturas ? `relative z-10 h-9 w-9 overflow-hidden rounded-md border border-marine/15 bg-white transition-transform hover:scale-110 motion-reduce:transition-none ${activo ? 'ring-2 ring-marine ring-offset-2 ring-offset-white' : ''}` : `relative z-10 h-5 w-5 rounded-full border border-encre/15 shadow-[inset_0_0_0_1px_rgba(255,255,255,0.35)] transition-transform hover:scale-110 motion-reduce:transition-none ${activo ? 'ring-2 ring-marine ring-offset-2 ring-offset-white' : ''}`}
            style={conMiniaturas ? undefined : { background: fondoMuestra(c) }}
          >
            {conMiniaturas && (
              // eslint-disable-next-line @next/next/no-img-element
              <img src={c.miniatura} alt="" loading="lazy" decoding="async" className="h-full w-full object-contain p-0.5" />
            )}
            <span className="sr-only">{c.nombre}</span>
          </button>
        );
      })}
      {resto > 0 && (
        <button
          type="button"
          onClick={() => setTodas(true)}
          className="relative z-10 rounded-full pl-0.5 text-xs font-semibold text-ardoise hover:text-marine"
          aria-label={`Voir ${resto} ${palabras} de plus`}
        >
          +{resto} {palabras}
        </button>
      )}
    </div>
  );
}
