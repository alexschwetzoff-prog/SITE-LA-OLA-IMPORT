'use client';

// Escala 5: «Pruébalo con tu logo». Se suelta el logo y aparece al instante en el corazón de la foto real de la
// Atomic 150 (en 2D, con la misma calibración y el mismo sombreado que el estudio). El botón abre el estudio con el
// logo ya cargado: se pasa dentro del navegador y no se sube nada hasta enviar (sección 4 de la spec).

import { useEffect, useId, useRef, useState, type DragEvent } from 'react';
import { useRouter } from 'next/navigation';
import { Boton, Flecha } from '@/components/ui/Botones';
import { Seccion } from '@/components/ui/Seccion';
import { dibujarLogoSombreado } from '@/lib/estudio/calco';
import { procesarLogo, recortarTransparente, type LogoProcesado } from '@/lib/estudio/logo';
import { cmAFoto, fotosDeColor, fuenteFoto, getSilueta } from '@/lib/estudio/siluetas';
import { srcsetDe } from '@/lib/fotos';
import { guardarLogoPendiente } from '@/lib/logo-pendiente';
import { IconoSubir } from './Iconos';

const SILUETA = getSilueta('camiseta-unisex');
const FOTO = fotosDeColor(SILUETA, 'Naranja').fotos.delante; // la foto real de la Atomic 150, calibrada
const SRC_LIENZO = fuenteFoto(FOTO, 1200); // el recorte grande para el lienzo (hasta ~700 px CSS a 2×)
const SIZES = '(min-width: 1024px) 45vw, 92vw';
const CORAZON = SILUETA.posiciones.corazon!;

interface LogoCargado {
  procesado: LogoProcesado;
  archivo: File;
}

export default function PruebaLogo() {
  const [logo, setLogo] = useState<LogoCargado | null>(null);
  const [procesando, setProcesando] = useState(false);
  const [abriendo, setAbriendo] = useState(false);
  const [arrastrando, setArrastrando] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const lienzoRef = useRef<HTMLCanvasElement>(null);
  const fotoRef = useRef<HTMLImageElement | null>(null);
  const router = useRouter();
  const id = useId();

  // Con logo: se pinta la foto en el lienzo y el logo en el corazón (8 cm), siguiendo la luz de la tela.
  useEffect(() => {
    const lienzo = lienzoRef.current;
    const caja = lienzo?.parentElement;
    if (!logo || !lienzo || !caja) return;
    let vivo = true;
    const pintar = (img: HTMLImageElement) => {
      const r = caja.getBoundingClientRect();
      const dpr = Math.min(2, window.devicePixelRatio || 1);
      lienzo.width = Math.max(1, Math.round(r.width * dpr));
      lienzo.height = Math.max(1, Math.round(r.height * dpr));
      const ctx = lienzo.getContext('2d', { willReadFrequently: true });
      if (!ctx) return;
      const margen = 0.03;
      const escala = Math.min((lienzo.width * (1 - 2 * margen)) / FOTO.ancho, (lienzo.height * (1 - 2 * margen)) / FOTO.alto);
      const x = (lienzo.width - FOTO.ancho * escala) / 2;
      const y = (lienzo.height - FOTO.alto * escala) / 2;
      ctx.fillStyle = '#ffffff';
      ctx.fillRect(0, 0, lienzo.width, lienzo.height);
      ctx.imageSmoothingQuality = 'high';
      ctx.drawImage(img, x, y, FOTO.ancho * escala, FOTO.alto * escala);
      const proporcion = logo.procesado.alto / logo.procesado.ancho;
      const anchoCm = Math.min(CORAZON.porDefectoCm, CORAZON.maxCm[1] / proporcion);
      const centro = cmAFoto(FOTO, 'delante', CORAZON.ancla.x, CORAZON.ancla.z);
      const w = anchoCm * FOTO.pxPorCm * escala;
      const h = w * proporcion;
      dibujarLogoSombreado(ctx, logo.procesado.canvas, { x: x + centro.x * escala - w / 2, y: y + centro.y * escala - h / 2, w, h });
    };
    if (fotoRef.current) pintar(fotoRef.current);
    else {
      const img = document.createElement('img');
      img.decoding = 'async';
      img.onload = () => {
        if (!vivo) return;
        fotoRef.current = img;
        pintar(img);
      };
      img.src = SRC_LIENZO;
    }
    const observador = new ResizeObserver(() => {
      if (fotoRef.current) pintar(fotoRef.current);
    });
    observador.observe(caja);
    return () => {
      vivo = false;
      observador.disconnect();
    };
  }, [logo]);

  async function alElegir(archivo: File | undefined) {
    if (!archivo) return;
    setError(null);
    setProcesando(true);
    try {
      const procesado = await procesarLogo(archivo);
      procesado.canvas = recortarTransparente(procesado.canvas);
      procesado.ancho = procesado.canvas.width;
      procesado.alto = procesado.canvas.height;
      setLogo({ procesado, archivo });
    } catch (e) {
      setError(e instanceof Error ? e.message : 'No se ha podido leer el archivo.');
    } finally {
      setProcesando(false);
    }
  }

  function alSoltar(e: DragEvent) {
    e.preventDefault();
    setArrastrando(false);
    void alElegir(e.dataTransfer.files?.[0]);
  }

  async function abrirEstudio() {
    if (!logo || abriendo) return;
    setAbriendo(true);
    try {
      await guardarLogoPendiente(logo.archivo, logo.procesado.canvas);
    } finally {
      router.push('/disena/atomic-150');
    }
  }

  return (
    <Seccion
      id="pruebalo"
      escala={5}
      nombre="Pruébalo con tu logo"
      etiqueta="Pruébalo con tu logo"
      titulo="Suelta tu logo y míralo puesto."
      intro="Aparece al instante en el corazón de una Atomic 150. Luego cámbialo de prenda, de color, de posición y de tamaño en el estudio."
      ancho="ancho"
    >
      <div
        onDragOver={(e) => {
          e.preventDefault();
          if (!arrastrando) setArrastrando(true);
        }}
        onDragLeave={() => setArrastrando(false)}
        onDrop={alSoltar}
        className={`mt-10 grid gap-6 rounded-[2rem] border-2 border-dashed p-4 transition-colors sm:p-6 lg:grid-cols-[1fr_1.1fr] lg:items-center ${arrastrando ? 'border-star-300 bg-star-300/5' : 'border-moon-50/15'}`}
      >
        <div className="order-2 lg:order-1">
          <label
            htmlFor={`${id}-archivo`}
            className="flex cursor-pointer flex-col items-center justify-center gap-3 rounded-3xl bg-space-900/60 px-6 py-10 text-center transition-colors hover:bg-space-900/90"
          >
            <span className="inline-flex h-14 w-14 items-center justify-center rounded-full bg-nova-600 text-white shadow-lg shadow-nova-600/40">
              <IconoSubir className="h-7 w-7" />
            </span>
            <span className="font-display text-lg font-semibold text-moon-50">{procesando ? 'Procesando…' : logo ? 'Cambiar de logo' : 'Suelta tu logo aquí o elige un archivo'}</span>
            <span className="text-sm text-mist-300">PNG, JPG o SVG. Se procesa en tu navegador: no se sube nada hasta que envíes tu diseño.</span>
          </label>
          <input
            id={`${id}-archivo`}
            type="file"
            accept="image/png,image/jpeg,image/svg+xml,.svg"
            className="sr-only"
            onChange={(e) => {
              void alElegir(e.target.files?.[0]);
              e.target.value = '';
            }}
          />
          {error && (
            <p role="alert" className="mt-3 text-sm text-[#ffb4b4]">
              {error}
            </p>
          )}
          <div className="mt-5 flex flex-wrap items-center gap-3">
            <Boton tamano="grande" onClick={() => void abrirEstudio()} disabled={!logo || abriendo}>
              {abriendo ? 'Abriendo el estudio…' : 'Verlo en el estudio y cambiar de color'}
              <Flecha />
            </Boton>
            {!logo && <span className="text-sm text-mist-300">Primero sube tu logo.</span>}
          </div>
          <p className="mt-4 text-xs text-mist-300">
            En el estudio eliges color, posición (corazón, A4 delante, A4 o A3 detrás) y tamaño en centímetros, y nos mandas el diseño con tu cantidad aproximada.
          </p>
        </div>

        {/* La foto real de la Atomic 150, sobre blanco para que el color sea fiel */}
        <div className="order-1 lg:order-2">
          <div className="relative aspect-square overflow-hidden rounded-3xl bg-white shadow-[0_0_80px_-20px_rgba(84,153,239,0.45)]">
            {logo ? (
              <canvas ref={lienzoRef} role="img" aria-label="Camiseta Atomic 150 naranja con tu logo en el corazón" className="h-full w-full" />
            ) : (
              // eslint-disable-next-line @next/next/no-img-element -- recorte publicado ya optimizado (WebP a dos tamaños), servido tal cual
              <img src={FOTO.src} srcSet={srcsetDe(FOTO)} sizes={SIZES} alt="Camiseta Atomic 150 naranja, por delante" width={FOTO.ancho} height={FOTO.alto} loading="lazy" decoding="async" className="h-full w-full object-contain p-2" />
            )}
            <p className="pointer-events-none absolute bottom-3 left-1/2 -translate-x-1/2 rounded-full bg-space-950/70 px-3 py-1 text-xs font-medium whitespace-nowrap text-moon-50 backdrop-blur">
              {logo ? `${logo.procesado.nombre} · corazón, ${Math.min(CORAZON.porDefectoCm, CORAZON.maxCm[1] / (logo.procesado.alto / logo.procesado.ancho)).toFixed(0)} cm` : 'Atomic 150 · naranja · foto real'}
            </p>
          </div>
        </div>
      </div>
    </Seccion>
  );
}
