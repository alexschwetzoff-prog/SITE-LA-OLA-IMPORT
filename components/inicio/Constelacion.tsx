'use client';

import { useEffect, useRef } from 'react';
import { IconoDestello } from '@/components/layout/Iconos';

export interface Paso {
  titulo: string;
  texto: string;
}

/**
 * Constelación de pasos: cinco nodos unidos por una línea que se dibuja al entrar en pantalla (sección 7).
 * En escritorio los nodos alternan altura; en móvil van en columna. Sin movimiento con prefers-reduced-motion.
 */
export default function Constelacion({ pasos }: { pasos: Paso[] }) {
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    const observador = new IntersectionObserver(
      (entradas) => {
        if (entradas.some((e) => e.isIntersecting)) {
          el.dataset.visible = 'true';
          observador.disconnect();
        }
      },
      { threshold: 0.35 },
    );
    observador.observe(el);
    return () => observador.disconnect();
  }, []);

  // Centros de los nodos en escritorio: columnas iguales sin hueco (10 %, 30 %, …) y alturas alternas (24 y 84 px).
  const puntos = pasos.map((_, i) => [100 + i * 200, i % 2 ? 84 : 24] as const);
  const ruta = puntos.map(([x, y], i) => `${i ? 'L' : 'M'}${x} ${y}`).join(' ');

  return (
    <div ref={ref} className="constelacion relative mt-10">
      <svg aria-hidden="true" viewBox="0 0 1000 120" preserveAspectRatio="none" className="pointer-events-none absolute inset-x-0 top-0 hidden h-[120px] w-full lg:block">
        <path d={ruta} pathLength={1} fill="none" stroke="#bdbdbd" strokeWidth="1.5" strokeLinecap="round" className="constelacion-linea" vectorEffect="non-scaling-stroke" />
      </svg>
      <ol className="relative grid gap-8 before:absolute before:top-2 before:bottom-2 before:left-6 before:w-px before:bg-gradient-to-b before:from-star-300/60 before:via-moon-50/20 before:to-transparent lg:grid-cols-5 lg:gap-0 lg:before:hidden">
        {pasos.map((paso, i) => (
          <li key={paso.titulo} className={`constelacion-paso relative flex gap-4 lg:flex-col lg:items-center lg:px-3 lg:text-center ${i % 2 ? 'lg:pt-[60px]' : ''}`} style={{ '--i': i } as React.CSSProperties}>
            <span className="constelacion-nodo relative z-10 flex h-12 w-12 shrink-0 items-center justify-center rounded-full border border-star-300/60 bg-space-950 font-display text-base font-semibold text-moon-50 shadow-[0_0_24px_-4px_rgba(63,230,242,0.8)]">
              {i + 1}
              <IconoDestello className="absolute -top-1.5 -right-1.5 h-3.5 w-3.5 text-star-300" />
            </span>
            <div className="lg:mt-4">
              <h3 className="font-display text-lg font-semibold text-moon-50">{paso.titulo}</h3>
              <p className="mt-1 text-sm text-mist-300">{paso.texto}</p>
            </div>
          </li>
        ))}
      </ol>
    </div>
  );
}
