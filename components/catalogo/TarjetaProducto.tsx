'use client';

import { useCallback, useRef, useState } from 'react';
import Link from 'next/link';
import type { ColorTarjeta, DatosTarjeta, Ejemplo } from '@/lib/catalogo';
import { precargarFotos } from '@/lib/fotos';
import FotoProducto, { precalentarReveal } from '@/components/producto/FotoProducto';
import { Etiquetas } from './Etiquetas';
import { Muestras } from './Muestras';

// La foto de la tarjeta mide 325 px CSS como mucho (3 columnas a 1440): la de 800 px le sobra incluso a 2×, y la
// de 1200 solo pesaría el doble (Lighthouse móvil: Chrome carga las perezosas hasta 2500 px bajo el pliegue).
const ANCHO_MAXIMO = 800;

interface Props {
  /** Datos calculados en el servidor con `datosTarjeta()`: la tarjeta no carga el catálogo ni el índice de fotos. */
  datos: DatosTarjeta;
  /** Las primeras tarjetas de la página cargan la foto sin esperar; 'alta' en la primera (LCP). */
  prioridad?: boolean | 'alta';
  sizes?: string;
}

function textoAlt(datos: DatosTarjeta, color: ColorTarjeta, ejemplo: Ejemplo | null): string {
  const base = `${datos.tipo} ${datos.nombre} en ${color.nombre.toLowerCase()}`;
  if (ejemplo === 'marca') return `${base}, con un logo de ejemplo en el corazón`;
  if (ejemplo === 'tu-logo-aqui') return `${base}, con el diseño «Tu logo aquí» en el sitio del logo`;
  return base;
}

/**
 * Tarjeta de producto (sección 4): foto con la personalización de ejemplo dibujada encima (al pasar el ratón por la
 * foto, o el foco por el título, la espalda si existe), nombre, tipo, precio «desde», material y muestras de color:
 * al elegir una, el OVNI revela la foto de ese color (fase 4.2); todos los colores se eligen desde la propia tarjeta
 * (fase 4.4). Las prendas con estudio llevan la etiqueta «Diséñala» y un botón directo al estudio con el color
 * elegido. Es clara para que los colores de la prenda sean fieles.
 */
export function TarjetaProducto({ datos, prioridad = false, sizes = '(min-width: 1024px) 30vw, (min-width: 640px) 45vw, 92vw' }: Props) {
  const [color, setColor] = useState<ColorTarjeta>(() => datos.colores.find((c) => c.nombre === datos.colorInicial) ?? datos.colores[0]);
  // La espalda (al pasar el ratón o el foco) se monta al acercarse a la tarjeta: en el catálogo hay 30 y no hace
  // falta cargar 30 fotos traseras ni montar 30 capas más al entrar.
  const [cerca, setCerca] = useState(false);
  // Fase 4.4: la espalda se enseña al pasar el ratón por la tarjeta salvo sobre las muestras de color (al elegir un
  // color se ve su delantera) y al enfocar el título con el teclado. Va en estado porque el enlace del título cubre
  // toda la tarjeta (su ::after) y el CSS :hover de un recuadro interior no se entera.
  const [sobreTarjeta, setSobreTarjeta] = useState(false);
  const [sobreMuestras, setSobreMuestras] = useState(false);
  const [tituloEnfocado, setTituloEnfocado] = useState(false);
  const precargado = useRef(false);
  const fotos = color.fotos;
  const hrefFicha = `/catalogo/${datos.slug}`;
  const disenoDelante = fotos?.diseno ?? datos.diseno?.delante;
  const disenoDetras = fotos?.disenoDetras ?? datos.diseno?.detras;

  // Al acercarse a la tarjeta se precargan las fotos de sus muestras visibles, para que el revelado no enseñe un hueco.
  const precargar = useCallback(() => {
    if (precargado.current) return;
    precargado.current = true;
    setCerca(true);
    void precalentarReveal();
    const delanteras = datos.colores
      .slice(0, 8)
      .map((c) => c.fotos)
      .filter((f): f is NonNullable<typeof f> => Boolean(f) && f?.delante !== fotos?.delante)
      .map((f) => ({ src: f.delante, anchos: f.anchos }));
    precargarFotos(delanteras, sizes, ANCHO_MAXIMO);
  }, [datos.colores, fotos?.delante, sizes]);

  const espalda = Boolean(fotos?.detras) && ((sobreTarjeta && !sobreMuestras) || tituloEnfocado);

  return (
    <article
      className="tarjeta-nave group relative flex h-full flex-col overflow-hidden rounded-3xl bg-white text-ink-900 shadow-[0_10px_40px_-20px_rgba(5,11,42,0.6)]"
      onPointerEnter={(e) => {
        precargar();
        if (e.pointerType === 'mouse') setSobreTarjeta(true);
      }}
      onPointerLeave={() => setSobreTarjeta(false)}
      onFocus={precargar}
      onTouchStart={precargar}
    >
      <div className="relative aspect-square overflow-hidden bg-white">
        {fotos ? (
          <>
            <div className={`absolute inset-0 transition-opacity duration-300 ${espalda ? 'opacity-0' : ''}`}>
              <FotoProducto
                foto={{ src: fotos.delante, anchos: fotos.anchos, diseno: disenoDelante }}
                alt={textoAlt(datos, color, fotos.ejemplo)}
                sizes={sizes}
                prioridad={prioridad}
                anchoMaximo={ANCHO_MAXIMO}
                className="h-full w-full object-contain p-3"
              />
            </div>
            {fotos.detras && cerca && (
              <div aria-hidden="true" className={`absolute inset-0 transition-opacity duration-300 ${espalda ? 'opacity-100' : 'opacity-0'}`}>
                <FotoProducto foto={{ src: fotos.detras, anchos: fotos.anchosDetras, diseno: disenoDetras }} alt="" sizes={sizes} anchoMaximo={ANCHO_MAXIMO} className="h-full w-full object-contain p-3" />
              </div>
            )}
          </>
        ) : (
          <div className="flex h-full items-center justify-center p-6 text-center text-sm text-ink-900/60">
            <span className="rounded-full px-3 py-1 font-mono text-xs ring-1 ring-ink-900/30">[FALTA foto]</span>
          </div>
        )}
        <div className="pointer-events-none absolute top-3 left-3 z-10">
          <Etiquetas destacado={datos.destacado} etiquetas={datos.etiquetas} conEstudio={datos.conEstudio} />
        </div>
      </div>

      <div className="flex flex-1 flex-col gap-2 p-4 pt-3">
        <div className="flex items-start justify-between gap-3">
          <div className="min-w-0">
            <h3 className="font-display text-xl font-semibold leading-tight">
              <Link
                href={hrefFicha}
                className="after:absolute after:inset-0 after:rounded-3xl after:content-['']"
                onFocus={(e) => setTituloEnfocado(e.currentTarget.matches(':focus-visible'))}
                onBlur={() => setTituloEnfocado(false)}
              >
                {datos.nombre}
              </Link>
            </h3>
            <p className="mt-0.5 text-sm text-ink-900/70">{datos.tipo}</p>
          </div>
          {/* Precio limpio (fase 4.2): el aviso «sin IVA» va en el pie, en la nota de la ficha y en /proyecto. */}
          <p className={`shrink-0 text-right font-display text-base font-semibold ${datos.desde ? 'text-nova-600' : 'text-ink-900/80'}`}>{datos.precio}</p>
        </div>
        <p className="text-xs text-ink-900/70">{datos.material}</p>
        <div className="mt-auto flex items-end justify-between gap-3 pt-1">
          <div className="min-w-0" onPointerEnter={() => setSobreMuestras(true)} onPointerLeave={() => setSobreMuestras(false)}>
            <Muestras colores={datos.colores} elegido={color} onElegir={setColor} />
            <p className="mt-1 truncate text-[11px] text-ink-900/60">{color.nombre}</p>
          </div>
          {datos.conEstudio && (
            <Link
              href={`/disena/${datos.slug}?color=${encodeURIComponent(color.nombre)}`}
              className="relative z-10 inline-flex shrink-0 items-center gap-1 rounded-full bg-nova-600 px-3 py-1.5 text-xs font-semibold text-white shadow-md shadow-nova-600/30 transition-colors hover:bg-nova-400"
            >
              Diséñala
            </Link>
          )}
        </div>
      </div>
    </article>
  );
}
