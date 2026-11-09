'use client';

// Ventana redondeada del hero, como el ojo de buey de una nave: dentro va el vídeo de portada (video/, Remotion) sobre
// su póster, que es el fotograma final del vídeo (logotipo y eslogan) y hace de imagen principal de la página (LCP).
// El vídeo se carga después de la página y en tiempo libre, en bucle, sin sonido ni controles, y aparece con un fundido
// cuando ya está reproduciéndose; con prefers-reduced-motion no se carga ni se ve: queda solo el póster. Con el
// ratón, la ventana y la estrella ganan un poco de profundidad (sección 7); con movimiento reducido, nada se mueve.

import { useEffect, useRef, useState } from 'react';
import Image from 'next/image';
import { preload } from 'react-dom';
import { IMAGEN_PORTADA, VIDEO_PORTADA } from '@/lib/portada';

const SIZES = '(min-width: 1024px) 520px, 92vw';

export default function OjoDeBuey() {
  const ref = useRef<HTMLDivElement>(null);
  const videoRef = useRef<HTMLVideoElement>(null);
  const [reproduciendo, setReproduciendo] = useState(false);
  // la imagen principal va con prioridad alta y el mismo srcset, como la foto de la ficha
  preload(IMAGEN_PORTADA.src, { as: 'image', imageSrcSet: IMAGEN_PORTADA.srcSet, imageSizes: SIZES, fetchPriority: 'high' });

  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    const mql = window.matchMedia('(hover: hover) and (prefers-reduced-motion: no-preference)');
    if (!mql.matches) return;
    const escena = el.closest('section') ?? el;
    let raf = 0;
    const alMover = (e: PointerEvent) => {
      const r = escena.getBoundingClientRect();
      const x = ((e.clientX - r.left) / r.width - 0.5) * 2;
      const y = ((e.clientY - r.top) / r.height - 0.5) * 2;
      cancelAnimationFrame(raf);
      raf = requestAnimationFrame(() => {
        el.style.setProperty('--px', x.toFixed(3));
        el.style.setProperty('--py', y.toFixed(3));
      });
    };
    const alSalir = () => {
      cancelAnimationFrame(raf);
      el.style.setProperty('--px', '0');
      el.style.setProperty('--py', '0');
    };
    escena.addEventListener('pointermove', alMover);
    escena.addEventListener('pointerleave', alSalir);
    return () => {
      cancelAnimationFrame(raf);
      escena.removeEventListener('pointermove', alMover);
      escena.removeEventListener('pointerleave', alSalir);
    };
  }, []);

  // El vídeo: sus fuentes se añaden después de la carga de la página y en tiempo libre, así nunca compite con la imagen
  // principal ni con el resto de la carga inicial. Con movimiento reducido no se carga.
  useEffect(() => {
    const video = videoRef.current;
    const fuentes = VIDEO_PORTADA;
    if (!video || !fuentes) return;
    if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) return;
    let cancelado = false;
    let pendiente = 0;
    const cargar = () => {
      if (cancelado) return;
      if (!video.querySelector('source')) {
        for (const [tipo, src] of [
          ['video/webm', fuentes.webm],
          ['video/mp4', fuentes.mp4],
        ] as const) {
          const fuente = document.createElement('source');
          fuente.type = tipo;
          fuente.src = src;
          video.appendChild(fuente);
        }
        video.load();
      }
      video.muted = true;
      video.addEventListener('playing', () => setReproduciendo(true), { once: true });
      video.play().catch(() => {});
    };
    const conTiempoLibre = typeof window.requestIdleCallback === 'function';
    const enTiempoLibre = () => {
      pendiente = conTiempoLibre ? window.requestIdleCallback(cargar, { timeout: 2500 }) : window.setTimeout(cargar, 400);
    };
    if (document.readyState === 'complete') enTiempoLibre();
    else window.addEventListener('load', enTiempoLibre, { once: true });
    return () => {
      cancelado = true;
      window.removeEventListener('load', enTiempoLibre);
      if (conTiempoLibre) window.cancelIdleCallback(pendiente);
      else window.clearTimeout(pendiente);
    };
  }, []);

  return (
    <div ref={ref} className="ojo-de-buey relative mx-auto w-full max-w-[520px]" style={{ '--px': 0, '--py': 0 } as React.CSSProperties}>
      {/* Órbita elíptica y nebulosa detrás de la ventana */}
      <div aria-hidden="true" className="pointer-events-none absolute -inset-[18%]">
        <div className="absolute inset-[10%] rounded-full bg-nova-600/30 blur-3xl" />
        <svg viewBox="0 0 400 400" className="absolute inset-0 h-full w-full ojo-orbita">
          <ellipse cx="200" cy="200" rx="188" ry="132" fill="none" stroke="url(#orbita)" strokeWidth="1.2" transform="rotate(-18 200 200)" />
          <defs>
            <linearGradient id="orbita" x1="0" x2="1" y1="0" y2="1">
              <stop offset="0" stopColor="#bdbdbd" stopOpacity="0.1" />
              <stop offset="0.5" stopColor="#bdbdbd" stopOpacity="0.8" />
              <stop offset="1" stopColor="#8a8a8a" stopOpacity="0.1" />
            </linearGradient>
          </defs>
        </svg>
      </div>

      {/* La estrella [MARCA] en la órbita: dos capas translúcidas que respiran y giran a ritmos distintos */}
      <span aria-hidden="true" className="ojo-estrella pointer-events-none absolute -top-6 -right-4 z-10 block w-16 sm:-top-8 sm:-right-8 sm:w-20">
        <Image src="/marca/estrella-marca.png" alt="" width={206} height={205} className="ojo-estrella-fondo absolute inset-0 h-auto w-full opacity-50 blur-[1px]" />
        <Image src="/marca/estrella-marca.png" alt="" width={206} height={205} className="ojo-estrella-frente relative h-auto w-full drop-shadow-[0_0_24px_rgba(63,230,242,0.55)]" />
      </span>

      <div className="ojo-ventana relative aspect-square overflow-hidden rounded-[2.75rem] bg-space-950 ring-1 ring-moon-50/30 shadow-[0_0_0_10px_rgba(11,36,112,0.45),0_30px_90px_-30px_rgba(84,153,239,0.7)] sm:rounded-[3.5rem]">
        {/* eslint-disable-next-line @next/next/no-img-element -- póster ya optimizado (WebP a dos tamaños), servido tal cual */}
        <img
          src={IMAGEN_PORTADA.src}
          srcSet={IMAGEN_PORTADA.srcSet}
          sizes={SIZES}
          width={IMAGEN_PORTADA.ancho}
          height={IMAGEN_PORTADA.alto}
          alt={IMAGEN_PORTADA.alt}
          loading="eager"
          fetchPriority="high"
          decoding="sync"
          className="ojo-imagen h-full w-full object-cover"
        />
        {VIDEO_PORTADA && (
          <video
            ref={videoRef}
            muted
            loop
            playsInline
            autoPlay
            preload="none"
            disablePictureInPicture
            disableRemotePlayback
            aria-label="Vídeo de portada: el OVNI [MARCA] estampa nuestro logo en una camiseta"
            className={`absolute inset-0 h-full w-full object-cover transition-opacity duration-700 motion-reduce:hidden ${reproduciendo ? 'opacity-100' : 'opacity-0'}`}
          />
        )}
        {/* reflejo del cristal */}
        <div aria-hidden="true" className="pointer-events-none absolute inset-0 rounded-[inherit] bg-gradient-to-br from-white/35 via-transparent to-nova-600/10" />
      </div>
    </div>
  );
}
