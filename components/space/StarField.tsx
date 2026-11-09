'use client';

import { useEffect, useRef } from 'react';
import { usePathname } from 'next/navigation';
import type { Cielo } from '@/lib/cielo';

/**
 * Fondo espacial en movimiento (fases 4.5 y 4.6): canvas 2D con tres capas de estrellas que avanzan hacia quien mira
 * (las cercanas, más rápido y con una estela corta), estrellas fugaces, constelaciones sutiles y el OVNI [MARCA]
 * (cruces fugaces y sobrevuelos con calma que esquivan el texto principal y los botones de la primera pantalla).
 * Los ajustes viven en lib/cielo-config.ts; el motor, en lib/cielo.ts, se carga después del LCP, en tiempo libre,
 * así que no entra en el JS inicial; hasta entonces el fondo es el degradado del body.
 *  - Se pausa con la pestaña oculta; en móvil hay menos estrellas.
 *  - Con prefers-reduced-motion: cielo estático, sin OVNIs, fugaces ni constelaciones.
 *  - En el estudio (/disena) el cielo es estático: allí manda el lienzo de la prenda.
 *  - Al cambiar de página, un breve impulso de velocidad (navegación tipo nave).
 */
export default function StarField() {
  const ref = useRef<HTMLCanvasElement>(null);
  const cielo = useRef<Cielo | null>(null);
  const primera = useRef(true);
  const pathname = usePathname();
  const estudio = pathname.startsWith('/disena');

  useEffect(() => {
    if (primera.current) {
      primera.current = false;
      return;
    }
    cielo.current?.impulso();
  }, [pathname]);

  useEffect(() => {
    const canvas = ref.current;
    if (!canvas) return;
    let vivo = true;
    const mql = window.matchMedia('(prefers-reduced-motion: reduce)');
    // Lo que el OVNI no sobrevuela: la cabecera, el texto principal y los botones de la primera pantalla (marcados
    // con data-cielo-evitar) y cualquier h1, mientras estén a la vista.
    const zonasProhibidas = () =>
      Array.from(document.querySelectorAll<HTMLElement>('header, [data-cielo-evitar], main h1'))
        .map((e) => e.getBoundingClientRect())
        .filter((r) => r.width > 0 && r.height > 0 && r.bottom > 0 && r.top < window.innerHeight);
    const crear = () => {
      if (!vivo) return;
      void import('@/lib/cielo').then((m) => {
        if (!vivo) return;
        cielo.current?.destruir();
        cielo.current = m.crearCielo(canvas, { reducido: mql.matches || estudio, movil: window.innerWidth < 768, zonasProhibidas });
        // gancho para los scripts de comprobación (solo con ?capturas=1, como en el estudio)
        if (new URLSearchParams(window.location.search).get('capturas') === '1') {
          (window as Window & { __marcaCielo?: Cielo }).__marcaCielo = cielo.current;
        }
      });
    };
    // después de la carga (LCP) y en tiempo libre
    const enTiempoLibre = () => {
      if (typeof window.requestIdleCallback === 'function') window.requestIdleCallback(crear, { timeout: 2500 });
      else window.setTimeout(crear, 400);
    };
    if (document.readyState === 'complete') enTiempoLibre();
    else window.addEventListener('load', enTiempoLibre, { once: true });
    const alCambiarMovimiento = () => crear();
    mql.addEventListener('change', alCambiarMovimiento);
    return () => {
      vivo = false;
      window.removeEventListener('load', enTiempoLibre);
      mql.removeEventListener('change', alCambiarMovimiento);
      cielo.current?.destruir();
      cielo.current = null;
    };
  }, [estudio]);

  return <canvas ref={ref} aria-hidden="true" className="pointer-events-none fixed inset-0 -z-10 h-dvh w-screen" />;
}
