'use client';

// Foto de producto con el diseño de ejemplo dibujado encima (fase 4.2) y la revelación del color con el OVNI:
//  - la foto se sirve limpia (sin diseño) y el motivo « Votre logo ici » se dibuja en un lienzo sobre ella a la
//    resolución real de la pantalla (lib/diseno-ejemplo.ts);
//  - fase 4.4: la foto es un <img> con `srcset` de los tamaños publicados (1200 y 800 px, lib/fotos.ts), servidos
//    tal cual, sin pasar por next/image (ni doble compresión ni AVIF que aplane las prendas oscuras);
//  - al cambiar `src` (otro color), si la foto nueva ya está cargada, Novi, el OVNI, da un remolino alrededor del
//    producto y la foto nueva se funde durante el remolino (lib/ovni.ts, fase 10); si no, cambio directo sin
//    animación cuando cargue, sin enseñar nunca un hueco. La capa nueva nace invisible (opacity 0), y como el
//    navegador no carga las imágenes perezosas que no intersecan con la ventana, esa capa se carga siempre con
//    `loading="eager"` (fase 4.4: antes se quedaba congelada);
//  - si llega otro cambio durante la animación, se cancela y empieza la nueva al instante.
// La foto que se ve en primer lugar es un <img> normal (LCP, lazy, sizes), sin JavaScript extra hasta que carga.

import { useEffect, useLayoutEffect, useRef, useState, type RefObject } from 'react';
import { preload } from 'react-dom';
import type { ColocacionDiseno } from '@/lib/diseno-ejemplo';
import { anchoDe, srcPara, srcsetDe, type FuenteFoto } from '@/lib/fotos';
import type { Reveal } from '@/lib/ovni';
import { Ovni, elementosDe, type RefsOvni } from './Ovni';

// La mascota solo se monta cuando hay una revelación en marcha (en el catálogo hay 30 tarjetas). Fase 4.5: son unos
// pocos div sin SVG (la nave es una hoja de sprites), así que va importada de forma estática: con `lazy` + Suspense
// no llegaba a montarse a tiempo y el cambio se hacía directo. El módulo de la animación sigue cargándose aparte.
const SPRITE_REVEAL = '/marca/ovni/ovni-reveal.webp';

/** Carga por adelantado el código del revelado y la hoja de sprites de la mascota (al acercarse a una tarjeta, o en
 * tiempo libre en la ficha), para que el primer cambio de color no espere. */
export function precalentarReveal(): Promise<unknown> {
  if (typeof window !== 'undefined') {
    const sprite = new window.Image();
    sprite.src = SPRITE_REVEAL;
  }
  return import('@/lib/ovni').catch(() => undefined);
}

export interface FotoConDiseno extends FuenteFoto {
  diseno?: ColocacionDiseno;
}

interface Props {
  foto: FotoConDiseno;
  alt: string;
  sizes: string;
  /**
   * 'alta': carga sin esperar y con fetchpriority high (el LCP); true: sin esperar; false (por defecto): la foto se
   * pide cuando el recuadro se acerca a la ventana (320 px), no con el margen de 1250-2500 px del `loading="lazy"`
   * nativo, que en el catálogo descargaba una docena de fotos a la vez y retrasaba la primera.
   */
  prioridad?: boolean | 'alta';
  /** Con `precargaLcp`, añade un preload en el <head> con el mismo srcset. */
  precargaLcp?: boolean;
  /** Tamaño publicado más grande que se ofrece (las tarjetas se quedan en 800 px: les sobra). */
  anchoMaximo?: number;
  /** Clases del <img> (el recuadro padre es `relative`; la foto va con object-contain). */
  className?: string;
  /** Capa superpuesta oculta mientras se revela otra (por ejemplo, la espalda al pasar el ratón en las tarjetas). */
  ocultaMientrasRevela?: boolean;
}

interface Capa extends FotoConDiseno {
  clave: number;
}

/** Espera a que la imagen esté cargada; resuelve false si tarda más de `plazo` ms. */
function cargada(img: HTMLImageElement | null, plazo: number): Promise<boolean> {
  if (!img) return Promise.resolve(false);
  if (img.complete && img.naturalWidth > 0) return Promise.resolve(true);
  return new Promise((resolve) => {
    let listo = false;
    const t = window.setTimeout(() => {
      if (!listo) resolve(false);
    }, plazo);
    const ok = () => {
      listo = true;
      window.clearTimeout(t);
      resolve(img.complete && img.naturalWidth > 0);
    };
    img.addEventListener('load', ok, { once: true });
    img.addEventListener('error', ok, { once: true });
  });
}

/** Una capa: la foto y, encima, el lienzo con el diseño de ejemplo. */
function CapaFoto({
  capa,
  alt,
  sizes,
  prioridad,
  className,
  anchoMaximo,
  imgRef,
  divRef,
  oculta,
  recienLlegada,
  anterior,
}: {
  capa: Capa;
  alt: string;
  sizes: string;
  prioridad: boolean | 'alta';
  className: string;
  anchoMaximo?: number;
  imgRef: RefObject<HTMLImageElement | null>;
  divRef?: RefObject<HTMLDivElement | null>;
  oculta?: boolean;
  /** Capa recién llegada sobre otra: nace invisible hasta que el remolino la funde (o se cambia directo). */
  recienLlegada?: boolean;
  /** La capa que se estaba viendo (ya cargada): se pinta desde el primer fotograma. */
  anterior?: boolean;
}) {
  const lienzoRef = useRef<HTMLCanvasElement>(null);
  const cajaRef = useRef<HTMLDivElement>(null);
  const [fotoCargada, setFotoCargada] = useState(false);
  // La foto se pide cuando toca: ya (prioridad, capa nueva o anterior) o al acercarse el recuadro a la ventana.
  const [pedida, setPedida] = useState(Boolean(prioridad) || Boolean(recienLlegada) || Boolean(anterior));
  const lado = anchoDe(capa, 600, anchoMaximo);
  const src = srcPara(capa, anchoMaximo);
  const srcset = srcsetDe(capa, anchoMaximo);

  useEffect(() => {
    if (pedida) return;
    const caja = cajaRef.current;
    if (!caja || !('IntersectionObserver' in window)) {
      setPedida(true);
      return;
    }
    const observador = new IntersectionObserver(
      (entradas) => {
        if (entradas.some((e) => e.isIntersecting)) {
          setPedida(true);
          observador.disconnect();
        }
      },
      { rootMargin: '320px 0px' },
    );
    observador.observe(caja);
    return () => observador.disconnect();
  }, [pedida]);

  useEffect(() => {
    const img = imgRef.current;
    if (img?.complete && img.naturalWidth > 0) setFotoCargada(true);
  }, [imgRef, capa.src, pedida]);

  // Dibuja el diseño cuando la foto está cargada y a la vista, en tiempo libre del navegador (no bloquea la carga:
  // el módulo de dibujo y el archivo de marca se cargan bajo demanda), y lo vuelve a dibujar al cambiar el tamaño.
  useEffect(() => {
    const lienzo = lienzoRef.current;
    const caja = cajaRef.current;
    const img = imgRef.current;
    const colocacion = capa.diseno;
    if (!lienzo || !caja || !img || !colocacion || !fotoCargada) return;
    let vivo = true;
    let modulo: typeof import('@/lib/diseno-ejemplo') | null = null;
    let marcaImg: HTMLImageElement | null = null;
    let observadorTamano: ResizeObserver | null = null;
    const pintar = () => {
      if (!vivo || !modulo || !marcaImg) return;
      const rect = modulo.rectDeImagen(img, caja);
      if (!rect) return;
      const dpr = Math.min(4, modulo.dprActual() * rect.zoom); // zoom del navegador (dpr) o de CSS (zoom): píxeles reales
      const cw = Math.round(caja.clientWidth * dpr);
      const ch = Math.round(caja.clientHeight * dpr);
      if (lienzo.width !== cw || lienzo.height !== ch) {
        lienzo.width = cw;
        lienzo.height = ch;
      }
      // una foto de otro origen (sin CORS) no se puede muestrear: la foto queda limpia
      modulo.dibujarDiseno(lienzo, img, marcaImg, colocacion, rect, dpr).catch(() => {});
    };
    const enTiempoLibre = (f: () => void) => {
      if (typeof window.requestIdleCallback === 'function') window.requestIdleCallback(f, { timeout: 1500 });
      else window.setTimeout(f, 60);
    };
    const arrancar = () => {
      enTiempoLibre(() => {
        if (!vivo) return;
        void import('@/lib/diseno-ejemplo')
          .then(async (m) => {
            modulo = m;
            marcaImg = await m.cargarMarca(colocacion.marca);
            if (!vivo) return;
            pintar();
            observadorTamano = new ResizeObserver(() => enTiempoLibre(pintar));
            observadorTamano.observe(caja);
          })
          .catch(() => {});
      });
    };
    // solo cuando la foto está (casi) a la vista: en el catálogo hay 30 tarjetas y no hace falta dibujarlas todas al cargar
    let observadorVista: IntersectionObserver | null = null;
    if ('IntersectionObserver' in window) {
      observadorVista = new IntersectionObserver(
        (entradas) => {
          if (entradas.some((e) => e.isIntersecting)) {
            observadorVista?.disconnect();
            observadorVista = null;
            arrancar();
          }
        },
        { rootMargin: '240px 0px' },
      );
      observadorVista.observe(caja);
    } else arrancar();
    const alZoom = () => enTiempoLibre(pintar);
    window.addEventListener('resize', alZoom);
    return () => {
      vivo = false;
      observadorVista?.disconnect();
      observadorTamano?.disconnect();
      window.removeEventListener('resize', alZoom);
    };
  }, [capa.diseno, capa.src, fotoCargada, imgRef]);

  return (
    <div ref={divRef} className={`absolute inset-0 ${oculta ? 'invisible' : ''} ${recienLlegada ? 'ovni-capa-nueva' : ''}`}>
      <div ref={cajaRef} className="relative h-full w-full">
        {/* eslint-disable-next-line @next/next/no-img-element -- foto publicada ya optimizada (WebP a dos tamaños), servida tal cual */}
        <img
          ref={imgRef}
          src={pedida ? src : undefined}
          srcSet={pedida ? srcset : undefined}
          sizes={sizes}
          alt={alt}
          width={lado}
          height={lado}
          decoding="async"
          loading={prioridad || recienLlegada ? 'eager' : 'lazy'}
          fetchPriority={prioridad === 'alta' ? 'high' : undefined}
          onLoad={() => setFotoCargada(true)}
          className={className}
        />
        {!pedida && (
          <noscript>
            {/* eslint-disable-next-line @next/next/no-img-element -- la misma foto sin JavaScript */}
            <img src={src} srcSet={srcset} sizes={sizes} alt={alt} width={lado} height={lado} loading="lazy" className={className} />
          </noscript>
        )}
        {capa.diseno && <canvas ref={lienzoRef} aria-hidden="true" className="pointer-events-none absolute inset-0 h-full w-full" />}
      </div>
    </div>
  );
}

/**
 * Foto del producto en su color con el diseño nítido y el revelado del OVNI al cambiar de color. El recuadro
 * padre debe ser `relative` con la proporción de la foto (por ejemplo `aspect-square`).
 */
export default function FotoProducto({ foto, alt, sizes, prioridad = false, precargaLcp = false, anchoMaximo, className = '', ocultaMientrasRevela = false }: Props) {
  const [capas, setCapas] = useState<{ actual: Capa; anterior: Capa | null }>(() => ({ actual: { ...foto, clave: 0 }, anterior: null }));
  const claveRef = useRef(0);
  const ovniRef = useRef<RefsOvni | null>(null);
  const imgActualRef = useRef<HTMLImageElement | null>(null);
  const imgAnteriorRef = useRef<HTMLImageElement | null>(null);
  const divActualRef = useRef<HTMLDivElement | null>(null);
  const revealRef = useRef<Reveal | null>(null);

  // La foto principal de la ficha se anuncia en el <head> con el mismo srcset (LCP), como hacía next/image.
  if (precargaLcp && capas.actual.clave === 0) {
    preload(srcPara(capas.actual, anchoMaximo), { as: 'image', imageSrcSet: srcsetDe(capas.actual, anchoMaximo), imageSizes: sizes, fetchPriority: 'high' });
  }

  // Cambio de foto (otro color): la actual pasa a «anterior» y la nueva entra encima.
  useLayoutEffect(() => {
    setCapas((c) => {
      if (c.actual.src === foto.src && c.actual.diseno === foto.diseno) return c;
      claveRef.current += 1;
      // la anterior es la que se estaba viendo: si había una revelación a medias, su capa nueva ya cuenta como vista
      return { actual: { ...foto, clave: claveRef.current }, anterior: c.actual };
    });
  }, [foto, foto.src, foto.diseno]);

  // Revelación: cuando la nueva está cargada, el remolino del OVNI la funde; si no llega a tiempo, cambio directo al cargar.
  useEffect(() => {
    const anterior = capas.anterior;
    if (!anterior) return;
    let vivo = true;
    revealRef.current?.cancelar();
    revealRef.current = null;
    const terminar = () => {
      if (!vivo) return;
      setCapas((c) => (c.anterior === anterior ? { ...c, anterior: null } : c));
    };
    void (async () => {
      const lista = await cargada(imgActualRef.current, 160);
      if (!vivo) return;
      if (!lista) {
        // sin animación: la anterior se queda hasta que la nueva cargue del todo
        await cargada(imgActualRef.current, 20000);
        if (!vivo) return;
        terminar();
        return;
      }
      // la mascota se monta con la capa nueva; por si el commit llega un fotograma después, se espera un poco
      let elementos = elementosDe(ovniRef.current);
      for (let i = 0; i < 10 && !elementos && vivo; i++) {
        await new Promise((r) => window.setTimeout(r, 16));
        elementos = elementosDe(ovniRef.current);
      }
      const capa = divActualRef.current;
      // con la pestaña oculta las animaciones no avanzan: cambio directo
      if (!vivo || !elementos || !capa || document.hidden) {
        terminar();
        return;
      }
      const { revelar } = await import('@/lib/ovni');
      if (!vivo) return;
      revealRef.current = revelar({ ovni: elementos, capa, alFinal: terminar });
    })();
    return () => {
      vivo = false;
      revealRef.current?.cancelar();
      revealRef.current = null;
    };
  }, [capas.anterior, capas.actual.clave]);

  const comun = { alt, sizes, className, anchoMaximo };
  return (
    <>
      {capas.anterior && <CapaFoto key={`a-${capas.anterior.clave}`} capa={capas.anterior} {...comun} prioridad={false} anterior imgRef={imgAnteriorRef} />}
      <CapaFoto
        key={`n-${capas.actual.clave}`}
        capa={capas.actual}
        {...comun}
        prioridad={prioridad}
        imgRef={imgActualRef}
        divRef={divActualRef}
        oculta={ocultaMientrasRevela && Boolean(capas.anterior)}
        recienLlegada={Boolean(capas.anterior)}
      />
      {capas.anterior && <Ovni ref={ovniRef} />}
    </>
  );
}
