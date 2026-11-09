'use client';

// « Essayez avec votre logo » : on dépose son logo, il apparaît tout de suite côté cœur sur la photo réelle d'un
// t-shirt (même calibrage et même ombrage que le studio). Le bouton ouvre le studio avec le logo déjà chargé : tout
// reste dans le navigateur, rien n'est envoyé avant la demande (micro-engagement, projection).

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
const FOTO = fotosDeColor(SILUETA, 'Orange', 'atomic-150-naranja').fotos.delante; // la photo réelle (orange) de l'Atomic 150, calibrée
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
      setError(e instanceof Error ? e.message : 'Impossible de lire ce fichier.');
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
      router.push('/personnaliser/atomic-150');
    }
  }

  return (
    <Seccion
      id="essayez"
      etiqueta="Essayez avec votre logo"
      titulo="Voyez votre logo sur un t-shirt en quelques secondes."
      intro="Déposez votre logo : il apparaît tout de suite côté cœur. Ensuite, changez de couleur, d’emplacement et de taille dans le studio."
      ancho="ancho"
    >
      <div
        onDragOver={(e) => {
          e.preventDefault();
          if (!arrastrando) setArrastrando(true);
        }}
        onDragLeave={() => setArrastrando(false)}
        onDrop={alSoltar}
        className={`mt-10 grid gap-6 rounded-3xl border-2 border-dashed p-4 transition-colors sm:p-6 lg:grid-cols-[1fr_1.1fr] lg:items-center ${arrastrando ? 'border-bleu-600 bg-bleu-600/5' : 'border-marine/15'}`}
      >
        <div className="order-2 lg:order-1">
          <label
            htmlFor={`${id}-archivo`}
            className="flex cursor-pointer flex-col items-center justify-center gap-3 rounded-3xl bg-perle/60 px-6 py-10 text-center transition-colors hover:bg-perle/90"
          >
            <span className="inline-flex h-14 w-14 items-center justify-center rounded-full bg-fuchsia-700 text-white shadow-lg shadow-fuchsia-700/40">
              <IconoSubir className="h-7 w-7" />
            </span>
            <span className="font-display text-lg font-semibold text-marine">{procesando ? 'Préparation…' : logo ? 'Changer de logo' : 'Déposez votre logo ici ou choisissez un fichier'}</span>
            <span className="text-sm text-ardoise">PNG, JPG ou SVG. Tout se passe dans votre navigateur : rien n’est envoyé avant votre demande.</span>
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
            <p role="alert" className="mt-3 text-sm text-fuchsia-800">
              {error}
            </p>
          )}
          <div className="mt-5 flex flex-wrap items-center gap-3">
            <Boton tamano="grande" onClick={() => void abrirEstudio()} disabled={!logo || abriendo}>
              {abriendo ? 'Ouverture du studio…' : 'Ouvrir le studio et changer de couleur'}
              <Flecha />
            </Boton>
            {!logo && <span className="text-sm text-ardoise">Déposez d’abord votre logo.</span>}
          </div>
          <p className="mt-4 text-xs text-ardoise">
            Dans le studio, vous choisissez la couleur, l’emplacement (cœur, devant, dos) et la taille en centimètres, puis vous nous envoyez votre visuel avec la quantité souhaitée.
          </p>
        </div>

        {/* La photo réelle du t-shirt, sur blanc pour que la couleur soit fidèle */}
        <div className="order-1 lg:order-2">
          <div className="relative aspect-square overflow-hidden rounded-3xl bg-white shadow-carte ring-1 ring-marine/5">
            {logo ? (
              <canvas ref={lienzoRef} role="img" aria-label="T-shirt Atomic 150 avec votre logo côté cœur" className="h-full w-full" />
            ) : (
              // eslint-disable-next-line @next/next/no-img-element -- photo publiée déjà optimisée (WebP en deux tailles), servie telle quelle
              <img src={FOTO.src} srcSet={srcsetDe(FOTO)} sizes={SIZES} alt="T-shirt Atomic 150, vu de face" width={FOTO.ancho} height={FOTO.alto} loading="lazy" decoding="async" className="h-full w-full object-contain p-2" />
            )}
            <p className="pointer-events-none absolute bottom-3 left-1/2 -translate-x-1/2 rounded-full bg-white/85 px-3 py-1 text-xs font-medium whitespace-nowrap text-marine backdrop-blur">
              {logo ? `${logo.procesado.nombre} · cœur, ${Math.min(CORAZON.porDefectoCm, CORAZON.maxCm[1] / (logo.procesado.alto / logo.procesado.ancho)).toFixed(0)} cm` : 'Atomic 150 · photo réelle'}
            </p>
          </div>
        </div>
      </div>
    </Seccion>
  );
}
