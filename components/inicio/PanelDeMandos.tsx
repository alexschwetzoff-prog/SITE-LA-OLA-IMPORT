'use client';

// Panel de mandos mínimo de la home (sección 7): una línea fina arriba con el progreso del recorrido y, en
// escritorio, la escala actual. Nada de interfaces de videojuego; solo decora y no se anuncia a lectores de pantalla.

import { useEffect, useState } from 'react';

interface Estado {
  nombre: string;
  indice: number;
  total: number;
}

export default function PanelDeMandos() {
  const [estado, setEstado] = useState<Estado | null>(null);
  const [progreso, setProgreso] = useState(0);
  const [enLaBase, setEnLaBase] = useState(false); // el pie a la vista: la etiqueta se retira

  useEffect(() => {
    const secciones = Array.from(document.querySelectorAll<HTMLElement>('main [data-escala]'));
    if (!secciones.length) return;
    const total = secciones.length;
    const pie = document.querySelector<HTMLElement>('footer');
    const observador = new IntersectionObserver(
      (entradas) => {
        for (const e of entradas) {
          if (!e.isIntersecting) continue;
          const el = e.target as HTMLElement;
          const indice = secciones.indexOf(el) + 1;
          setEstado(indice <= 1 ? null : { nombre: el.dataset.nombre ?? '', indice, total });
        }
      },
      { rootMargin: '-45% 0px -50% 0px' },
    );
    secciones.forEach((s) => observador.observe(s));

    let raf = 0;
    const alScroll = () => {
      cancelAnimationFrame(raf);
      raf = requestAnimationFrame(() => {
        const alto = document.documentElement.scrollHeight - window.innerHeight;
        setProgreso(alto > 0 ? Math.min(1, window.scrollY / alto) : 0);
        setEnLaBase(Boolean(pie) && window.scrollY + window.innerHeight >= (pie?.offsetTop ?? Infinity) + 60);
      });
    };
    alScroll();
    window.addEventListener('scroll', alScroll, { passive: true });
    return () => {
      observador.disconnect();
      cancelAnimationFrame(raf);
      window.removeEventListener('scroll', alScroll);
    };
  }, []);

  return (
    <div aria-hidden="true" className="pointer-events-none">
      <div className="fixed inset-x-0 top-0 z-[60] h-0.5 bg-transparent">
        <div className="h-full origin-left bg-gradient-to-r from-nova-400 to-star-300 motion-safe:transition-transform motion-safe:duration-150" style={{ transform: `scaleX(${progreso})` }} />
      </div>
      <p
        className={`fixed right-5 bottom-5 z-40 hidden items-center gap-2 rounded-full border border-moon-50/10 bg-space-950/70 px-3 py-1.5 font-mono text-[11px] tracking-wide text-mist-300 backdrop-blur transition-opacity duration-300 lg:flex ${estado && !enLaBase ? 'opacity-100' : 'opacity-0'}`}
      >
        <span className="h-1.5 w-1.5 rounded-full bg-star-300 shadow-[0_0_8px_rgba(63,230,242,0.9)]" />
        {estado ? `Escala ${String(estado.indice).padStart(2, '0')} / ${String(estado.total).padStart(2, '0')} · ${estado.nombre}` : ''}
      </p>
    </div>
  );
}
