'use client';

import { forwardRef, useImperativeHandle, useRef, type ForwardedRef } from 'react';
import type { ElementosOvni } from '@/lib/ovni';

// Novi, la mascota que revela el color (fase 4.5; remolino desde la fase 10): el OVNI [MARCA] pre-renderizado en
// Blender (hoja de sprites de 16 fotogramas a 2×, public/marca/ovni/ovni-reveal.webp, con las luces del anillo
// latiendo) orbitando alrededor del producto en un pequeño tornado con tres estelas de viento. Empieza oculto: lo
// mueve lib/ovni.ts solo con transform y opacity (las duraciones siguen en DURACION_OVNI). La web no carga three.js
// ni el GLB.
//
// Estructura: la órbita (centro del remolino: gira, sube y se va) → el radio (se acorta) → la nave (gira al revés
// para seguir derecha, se ladea y crece al pasar por delante). Las estelas giran aparte, en el mismo centro.

export interface RefsOvni {
  readonly orbita: HTMLDivElement | null;
  readonly radio: HTMLDivElement | null;
  readonly nave: HTMLDivElement | null;
  readonly estelas: HTMLDivElement | null;
}

interface Props {
  className?: string;
}

/** Los cuatro elementos, o null si alguno aún no está montado. */
export function elementosDe(refs: RefsOvni | null | undefined): ElementosOvni | null {
  if (!refs?.orbita || !refs.radio || !refs.nave || !refs.estelas) return null;
  return { orbita: refs.orbita, radio: refs.radio, nave: refs.nave, estelas: refs.estelas };
}

function OvniBase({ className = '' }: Props, ref: ForwardedRef<RefsOvni>) {
  const orbitaRef = useRef<HTMLDivElement>(null);
  const radioRef = useRef<HTMLDivElement>(null);
  const naveRef = useRef<HTMLDivElement>(null);
  const estelasRef = useRef<HTMLDivElement>(null);
  useImperativeHandle(
    ref,
    () => ({
      get orbita() {
        return orbitaRef.current;
      },
      get radio() {
        return radioRef.current;
      },
      get nave() {
        return naveRef.current;
      },
      get estelas() {
        return estelasRef.current;
      },
    }),
    [],
  );
  return (
    <div aria-hidden="true" className={`ovni-escena pointer-events-none absolute inset-0 overflow-hidden ${className}`}>
      <div ref={estelasRef} hidden className="ovni-estelas">
        <span />
        <span />
        <span />
      </div>
      <div ref={orbitaRef} hidden className="ovni-orbita">
        <div ref={radioRef} className="ovni-radio">
          <div ref={naveRef} className="ovni-nave">
            <div className="ovni-brillo" />
            <div className="ovni-sprite" />
          </div>
        </div>
      </div>
    </div>
  );
}

export const Ovni = forwardRef<RefsOvni, Props>(OvniBase);
