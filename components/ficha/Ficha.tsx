'use client';

// Ficha de producto (sección 4 con las decisiones del equipo del 11/10/2026, la fase 4.1 y la fase 4.2): galería
// delantera y trasera con la personalización de ejemplo dibujada encima a la resolución de la pantalla, selector de
// color que revela la foto nueva con el OVNI, datos de la ficha técnica, el selector de posición de la
// personalización (obligatorio para añadir en prendas, gorras y bolsas) y las acciones. Atomic 150 y Austral abren el
// estudio con el color elegido; el resto (y los goodies) añaden al presupuesto. En móvil, barra inferior fija con la
// acción principal.

import { useEffect, useId, useState } from 'react';
import type { Color, Posicion, Producto } from '@/data/catalogo';
import { Etiquetas } from '@/components/catalogo/Etiquetas';
import { fondoMuestra } from '@/components/catalogo/Muestras';
import AnadirAlPresupuesto from '@/components/presupuesto/AnadirAlPresupuesto';
import FotoProducto, { precalentarReveal } from '@/components/producto/FotoProducto';
import { BotonEnlace, ESTILO_BOTON } from '@/components/ui/Botones';
import type { FotosProducto } from '@/lib/catalogo';
import { precargarFotos } from '@/lib/fotos';
import { POSICIONES, colorPorDefecto, esGoodie, sustantivo, textoMaterial, textoPrecio, tieneEstudio } from '@/lib/producto';
import { TEXTOS } from '@/lib/site';

// La galería mide como mucho 556 px CSS en escritorio: en pantallas 2× pide la foto de 1200 px y en móvil la de 800.
const SIZES = '(min-width: 1024px) 556px, 92vw';

function enlaceEstudio(producto: Producto, color: Color) {
  return `/disena/${producto.slug}?color=${encodeURIComponent(color.nombre)}`;
}

interface Props {
  producto: Producto;
  /** Fotos de cada color (`fotosPorColor()` en el servidor): la ficha no carga el índice de fotos en el navegador. */
  fotosPorColor: Record<string, FotosProducto | undefined>;
  /** Color de la foto base (real); sin él, la nota no distingue «Foto en …». */
  colorBase?: string;
}

export default function Ficha({ producto, fotosPorColor, colorBase }: Props) {
  const [color, setColor] = useState<Color>(() => colorPorDefecto(producto));
  const [lado, setLado] = useState<'delante' | 'detras'>('delante');
  // Posiciones elegidas para la personalización (fase 4.1): como mucho una por lado (delante / detrás, o cara A / B).
  const [posiciones, setPosiciones] = useState<Posicion[]>([]);
  const id = useId();
  const fotos = fotosPorColor[color.nombre];
  const conEstudio = tieneEstudio(producto);
  const goodie = esGoodie(producto);
  const { femenino } = sustantivo(producto);
  const precio = textoPrecio(producto);
  const desde = precio.startsWith('Desde');
  const colorFoto = colorBase ? producto.colores.find((c) => c.nombre === colorBase) : undefined;
  // Un color sin foto propia que se enseña con la foto base sin recolorear (goodies de un solo material).
  const fotoDelBase = Boolean(fotos && !fotos.real && colorBase && colorBase !== color.nombre && fotos.delante === fotosPorColor[colorBase]?.delante);
  const detras = lado === 'detras' && Boolean(fotos?.detras);
  const fotoActual = detras ? fotos?.detras : fotos?.delante;
  const disenoActual = detras ? fotos?.disenoDetras : fotos?.diseno;
  // Nota bajo la galería (decisión del equipo, 12/10/2026; fase 4.2: sin «color orientativo»). Fase 4.3: la vista
  // trasera de las gorras es foto real sin diseño (solo se personaliza el frontal): ahí la nota del ejemplo sobra.
  const ladoSinDiseno = detras && Boolean(fotos?.diseno) && !fotos?.disenoDetras;
  const notaEjemplo = ladoSinDiseno ? '' : fotos?.ejemplo === 'marca' ? 'Logo de ejemplo. ' : fotos?.ejemplo === 'tu-logo-aqui' ? '«Tu logo aquí» marca dónde va tu logo. ' : '';
  const notaColor = fotoDelBase && colorFoto ? `Foto en ${colorFoto.nombre.toLowerCase()}. ` : '';

  const elegirColor = (c: Color) => {
    setColor(c);
    if (!fotosPorColor[c.nombre]?.detras) setLado('delante');
  };

  // Precarga de las fotos de todos los colores de la vista actual, después de la carga inicial (sin tocar el LCP),
  // para que el revelado del OVNI nunca enseñe un hueco.
  useEffect(() => {
    const precargar = () => {
      const vistas = new Set<string>();
      const fuentes = [];
      for (const c of producto.colores) {
        const f = fotosPorColor[c.nombre];
        const src = lado === 'detras' ? f?.detras : f?.delante;
        if (!f || !src || vistas.has(src)) continue;
        vistas.add(src);
        fuentes.push({ src, anchos: lado === 'detras' ? f.anchosDetras : f.anchos });
      }
      precargarFotos(fuentes, SIZES);
      void precalentarReveal();
    };
    let cancelar = () => {};
    if (document.readyState === 'complete') {
      const t = window.setTimeout(precargar, 400);
      cancelar = () => window.clearTimeout(t);
    } else {
      const alCargar = () => window.setTimeout(precargar, 400);
      window.addEventListener('load', alCargar, { once: true });
      cancelar = () => window.removeEventListener('load', alCargar);
    }
    return cancelar;
  }, [producto.colores, fotosPorColor, lado]);

  const requierePosicion = producto.posiciones.length > 0;
  const alternarPosicion = (p: Posicion) =>
    setPosiciones((actual) => (actual.includes(p) ? actual.filter((x) => x !== p) : [...actual.filter((x) => POSICIONES[x].lado !== POSICIONES[p].lado), p]));
  const posicionesCesta = producto.posiciones.filter((p) => posiciones.includes(p.posicion)).map((p) => ({ posicion: p.posicion, nombre: POSICIONES[p.posicion].nombre }));
  const idPosiciones = `${id}-posiciones`;
  const lados = Array.from(new Set(producto.posiciones.map((p) => POSICIONES[p.posicion].lado).filter(Boolean)));
  const ayudaPosiciones =
    lados.length > 1 ? `Elige al menos una: como mucho una ${lados.map((l) => l.toLowerCase()).join(' y una ')}.` : 'Elige dónde va tu logo.';

  return (
    <div className="grid gap-8 lg:grid-cols-[minmax(0,1.15fr)_minmax(360px,1fr)] lg:gap-12">
      {/* Galería sobre superficie clara con halo azul */}
      <div className="lg:sticky lg:top-28 lg:self-start">
        <div className="relative aspect-square overflow-hidden rounded-3xl bg-white shadow-[0_0_80px_-20px_rgba(84,153,239,0.45)]">
          {fotoActual ? (
            <FotoProducto
              foto={{ src: fotoActual, anchos: detras ? fotos?.anchosDetras : fotos?.anchos, diseno: disenoActual }}
              alt={`${producto.tipo} ${producto.nombre} en ${color.nombre.toLowerCase()}, vista ${detras ? 'trasera' : 'delantera'}${fotos?.ejemplo === 'marca' ? ', con un logo de ejemplo' : fotos?.ejemplo === 'tu-logo-aqui' ? ', con el diseño «Tu logo aquí»' : ''}`}
              sizes={SIZES}
              prioridad="alta"
              precargaLcp
              className="aspect-square h-auto w-full object-contain p-4 sm:p-6"
            />
          ) : (
            <div className="flex aspect-square items-center justify-center">
              <span className="rounded-full px-3 py-1 font-mono text-xs text-ink-900/70 ring-1 ring-ink-900/30">[FALTA foto]</span>
            </div>
          )}
          {fotos?.detras && (
            <div className="absolute top-3 left-3 z-10 inline-flex rounded-full bg-space-950/75 p-1 backdrop-blur" role="group" aria-label="Vista">
              {(['delante', 'detras'] as const).map((l) => (
                <button
                  key={l}
                  type="button"
                  onClick={() => setLado(l)}
                  aria-pressed={lado === l}
                  className="rounded-full px-3.5 py-1.5 text-xs font-semibold text-mist-300 transition-colors hover:text-moon-50 aria-pressed:bg-moon-50 aria-pressed:text-ink-900 aria-pressed:hover:text-ink-900"
                >
                  {l === 'delante' ? 'Delante' : 'Detrás'}
                </button>
              ))}
            </div>
          )}
        </div>
        <p className="mt-3 text-xs text-mist-300">
          {notaEjemplo}
          {notaColor}
          Te enseñamos el muestrario real en tu local.
        </p>
      </div>

      {/* Datos y acciones sobre tarjeta clara */}
      <div className="rounded-3xl bg-moon-50 p-5 text-ink-900 sm:p-7">
        <Etiquetas destacado={producto.destacado} etiquetas={producto.etiquetas} conEstudio={conEstudio} />
        <h1 className="mt-3 font-display text-3xl font-semibold tracking-tight sm:text-4xl">{producto.nombre}</h1>
        <p className="mt-1 text-lg text-ink-900/70">{producto.tipo}</p>

        {/* Precio limpio (fase 4.2); el aviso «sin IVA» va en la nota de condiciones, en letra pequeña */}
        <p className="mt-4">
          <span className={`font-display text-2xl font-semibold ${desde ? 'text-nova-600' : ''}`}>{precio}</span>
        </p>
        {producto.estado === 'consultar-disponibilidad' && (
          <p className="mt-1 text-sm text-ink-900/70">Disponibilidad pendiente de confirmar: pregúntanos y te decimos.</p>
        )}
        <p className="mt-2 text-xs leading-relaxed text-ink-900/60">
          {TEXTOS.sinIva} {desde ? `${TEXTOS.notaPrecios} ` : ''}
          {TEXTOS.pedidoMinimo}
        </p>

        <dl className="mt-6 grid gap-x-6 gap-y-3 text-sm sm:grid-cols-[auto_1fr]">
          <dt className="font-medium text-ink-900/60">{producto.gramaje ? 'Composición y gramaje' : 'Material'}</dt>
          <dd>{textoMaterial(producto)}</dd>
          {producto.tallas && (
            <>
              <dt className="font-medium text-ink-900/60">Tallas</dt>
              <dd>
                {producto.tallas.join(' · ')}
                {producto.tallasInfantiles && <span className="block text-ink-900/70">Infantil: {producto.tallasInfantiles.join(' · ')}</span>}
              </dd>
            </>
          )}
        </dl>

        {/* Colores con nombre; el selector cambia la imagen cuando hay foto del color */}
        <fieldset className="mt-6">
          <legend className="text-sm font-medium text-ink-900/60">
            Color · <span className="font-semibold text-ink-900">{color.nombre}</span>
          </legend>
          <div className="mt-2 flex flex-wrap gap-2">
            {producto.colores.map((c) => {
              const seleccionado = c.nombre === color.nombre;
              return (
                <button
                  key={c.nombre}
                  type="button"
                  onClick={() => elegirColor(c)}
                  aria-pressed={seleccionado}
                  title={c.nombre}
                  className={`h-9 w-9 rounded-full border border-ink-900/15 shadow-[inset_0_0_0_2px_rgba(255,255,255,0.6)] transition-transform hover:scale-105 ${seleccionado ? 'ring-2 ring-nova-600 ring-offset-2 ring-offset-moon-50' : ''}`}
                  style={{ background: fondoMuestra(c) }}
                >
                  <span className="sr-only">{c.nombre}</span>
                </button>
              );
            })}
          </div>
          <p className="mt-2 text-xs text-ink-900/60">
            {producto.colores.length} {producto.colores.length === 1 ? 'color' : 'colores'}
            {producto.colores.some((c) => c.provisional) ? ' · nombres de color orientativos' : ''}
          </p>
        </fieldset>

        {/* Posición de la personalización: solo las que admite el producto según su ficha; obligatoria para añadir */}
        <div className="mt-6">
          {requierePosicion ? (
            <fieldset>
              <legend id={idPosiciones} tabIndex={-1} className="text-sm font-medium text-ink-900/60 outline-none focus-visible:ring-2 focus-visible:ring-star-300">
                Dónde va tu logo <span aria-hidden="true">*</span>
                <span className="sr-only">(obligatorio)</span>
              </legend>
              <p className="mt-1 text-xs text-ink-900/60">{ayudaPosiciones}</p>
              <ul className="mt-2 grid gap-1.5 sm:grid-cols-2" aria-describedby={`${idPosiciones}-ayuda`}>
                {producto.posiciones.map((p) => {
                  const puesta = posiciones.includes(p.posicion);
                  return (
                    <li key={p.posicion}>
                      <button
                        type="button"
                        aria-pressed={puesta}
                        onClick={() => alternarPosicion(p.posicion)}
                        className={`flex w-full items-center gap-3 rounded-xl border bg-white px-3 py-2 text-left text-sm transition-colors ${puesta ? 'border-nova-600 ring-2 ring-nova-600/60' : 'border-ink-900/10 hover:border-ink-900/30'}`}
                      >
                        <span
                          aria-hidden="true"
                          className={`flex h-5 w-5 shrink-0 items-center justify-center rounded-full border ${puesta ? 'border-nova-600 bg-nova-600 text-white' : 'border-ink-900/25'}`}
                        >
                          {puesta && (
                            <svg viewBox="0 0 20 20" className="h-3.5 w-3.5" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                              <path d="M5 10.5l3.2 3L15 7" />
                            </svg>
                          )}
                        </span>
                        <span>
                          <span className="block font-semibold">{POSICIONES[p.posicion].nombre}</span>
                          <span className="block text-xs text-ink-900/70">
                            {POSICIONES[p.posicion].lado ? `${POSICIONES[p.posicion].lado} · ` : ''}hasta {p.maxCm[0].toLocaleString('es-ES')} × {p.maxCm[1].toLocaleString('es-ES')} cm
                          </span>
                        </span>
                      </button>
                    </li>
                  );
                })}
              </ul>
              <p id={`${idPosiciones}-ayuda`} className="mt-2 text-xs text-ink-900/60">
                {posicionesCesta.length ? `Elegido: ${posicionesCesta.map((p) => p.nombre).join(' + ')}.` : 'Aún no has elegido ninguna posición.'}
                {!goodie && lados.length > 1 ? ' Con dos diseños el precio varía: te lo decimos en el presupuesto.' : ''}
              </p>
            </fieldset>
          ) : (
            <>
              <h2 className="text-sm font-medium text-ink-900/60">Personalización</h2>
              <p className="mt-2 text-sm text-ink-900/80">Marcaje con tu logo en la zona del producto; te concretamos el tamaño en el presupuesto.</p>
            </>
          )}
        </div>

        {/* Acciones */}
        <div className="mt-8 space-y-6">
          {conEstudio ? (
            <>
              <div className="flex flex-wrap items-center gap-3">
                <BotonEnlace id={`${id}-principal`} href={enlaceEstudio(producto, color)} tamano="grande">
                  Diséñala con tu logo
                </BotonEnlace>
                <BotonEnlace href="/proyecto?cita=local" variante="claro">
                  {femenino ? 'Verla' : 'Verlo'} en persona
                </BotonEnlace>
              </div>
              <p className="text-xs text-ink-900/60">Sube tu logo, elige posición y tamaño y mándanos el diseño: te respondemos con presupuesto en 24 h laborables.</p>
              <div className="border-t border-ink-900/10 pt-6">
                <AnadirAlPresupuesto
                  producto={producto}
                  color={color}
                  foto={fotos?.delante}
                  posiciones={posicionesCesta}
                  requierePosicion={requierePosicion}
                  idPosiciones={idPosiciones}
                  variante="secundario"
                />
              </div>
            </>
          ) : (
            <>
              <AnadirAlPresupuesto
                producto={producto}
                color={color}
                foto={fotos?.delante}
                posiciones={posicionesCesta}
                requierePosicion={requierePosicion}
                idPosiciones={idPosiciones}
                idBoton={`${id}-principal`}
              />
              <div className="flex flex-wrap items-center gap-3 border-t border-ink-900/10 pt-6">
                <BotonEnlace href="/proyecto?cita=local" variante="claro">
                  {femenino ? 'Verla' : 'Verlo'} en persona
                </BotonEnlace>
                <span className="text-xs text-ink-900/60">Vamos a tu local, en la ciudad de Valencia, con el muestrario.</span>
              </div>
            </>
          )}
        </div>
      </div>

      {/* Móvil: barra inferior fija con la acción principal (deja hueco al botón de WhatsApp) */}
      <div className="barra-inferior fixed inset-x-0 bottom-0 z-30 border-t border-moon-50/10 bg-space-950/85 p-3 pr-24 backdrop-blur-md lg:hidden">
        {conEstudio ? (
          <BotonEnlace href={enlaceEstudio(producto, color)} className="w-full">
            Diséñala con tu logo
          </BotonEnlace>
        ) : (
          <a href={`#${id}-principal`} className={`${ESTILO_BOTON.principal} w-full`}>
            Añadir al presupuesto
          </a>
        )}
      </div>
    </div>
  );
}
