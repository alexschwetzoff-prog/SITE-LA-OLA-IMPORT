'use client';

import { useState } from 'react';

interface Muestra {
  nombre: string;
  hex: string;
  hexSecundario?: string;
}

/** Fondo de una muestra de color: liso, o partido en diagonal en las prendas bicolor. */
export function fondoMuestra(c: Pick<Muestra, 'hex' | 'hexSecundario'>): string {
  return c.hexSecundario ? `linear-gradient(135deg, ${c.hex} 50%, ${c.hexSecundario} 50%)` : c.hex;
}

interface Props<T extends Muestra> {
  colores: T[];
  elegido: T;
  onElegir: (c: T) => void;
  maximo?: number; // tarjetas: 8 y «+N», que despliega el resto en la propia tarjeta
}

/**
 * Muestras de color elegibles: al pulsar una, la tarjeta enseña la prenda en ese color (decisión del equipo,
 * 12/10/2026). Se ven como mucho `maximo`; «+N» despliega las demás ahí mismo, sin entrar en la ficha (fase 4.4:
 * todos los colores se eligen desde la tarjeta). Sobre superficie clara.
 */
export function Muestras<T extends Muestra>({ colores, elegido, onElegir, maximo = 8 }: Props<T>) {
  const [todas, setTodas] = useState(false);
  const visibles = todas ? colores : colores.slice(0, maximo);
  const resto = colores.length - visibles.length;
  return (
    <div className="flex flex-wrap items-center gap-1.5" role="group" aria-label={`Color: ${elegido.nombre}`}>
      {visibles.map((c) => {
        const activo = c.nombre === elegido.nombre;
        return (
          <button
            key={c.nombre}
            type="button"
            aria-pressed={activo}
            title={c.nombre}
            onClick={() => onElegir(c)}
            className={`relative z-10 h-5 w-5 rounded-full border border-ink-900/15 shadow-[inset_0_0_0_1px_rgba(255,255,255,0.35)] transition-transform hover:scale-110 motion-reduce:transition-none ${activo ? 'ring-2 ring-nova-600 ring-offset-1 ring-offset-white' : ''}`}
            style={{ background: fondoMuestra(c) }}
          >
            <span className="sr-only">{c.nombre}</span>
          </button>
        );
      })}
      {resto > 0 && (
        <button
          type="button"
          onClick={() => setTodas(true)}
          className="relative z-10 rounded-full pl-0.5 text-xs font-medium text-ink-900/70 hover:text-nova-600"
          aria-label={`Ver ${resto} colores más`}
        >
          +{resto}
        </button>
      )}
    </div>
  );
}
