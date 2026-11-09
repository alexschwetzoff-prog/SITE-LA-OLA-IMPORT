'use client';

// Fiche produit : galerie devant / dos avec le motif d'exemple dessiné à la résolution de l'écran, sélecteur de couleur
// qui révèle la nouvelle photo (animation de la mascotte, components/producto/FotoProducto.tsx), données de la fiche
// technique, choix de l'emplacement du marquage (obligatoire pour ajouter les textiles, casquettes et sacs) et les
// actions (proposition §2.3) : « Ajouter au panier » (bouton fuchsia, le seul de l'écran : il alimente /projet),
// « Personnaliser avec mon logo » (contour violet, seulement si le produit a un studio) et « Demander un devis »
// (contour marine, vers /devis?produit=<slug>). En mobile, barre collante en bas avec le panier et le devis.

import { useEffect, useId, useState } from 'react';
import Link from 'next/link';
import type { Color, Posicion, Producto } from '@/data/catalogo';
import { Etiquetas } from '@/components/catalogo/Etiquetas';
import { fondoMuestra } from '@/components/catalogo/Muestras';
import AnadirAlPresupuesto from '@/components/presupuesto/AnadirAlPresupuesto';
import FotoProducto, { precalentarReveal } from '@/components/producto/FotoProducto';
import { ESTILO_BOTON } from '@/components/ui/Botones';
import type { FotosProducto } from '@/lib/catalogo';
import { precargarFotos } from '@/lib/fotos';
import { POSICIONES, colorPorDefecto, conPrecio, esGoodie, textoMaterial, textoPrecio, tieneEstudio } from '@/lib/producto';
import { TEXTOS } from '@/lib/site';

// La galerie mesure 556 px CSS au plus en desktop : en écran 2× elle demande la photo de 1200 px, en mobile celle de 800.
const SIZES = '(min-width: 1024px) 556px, 92vw';

// Boutons secondaires de la fiche (proposition §4.4) : pilules à contour, 48 px de haut.
const BASE_CONTOUR =
  'inline-flex min-h-12 items-center justify-center gap-2 rounded-full border-2 bg-white px-6 py-2.5 text-base font-semibold transition-colors duration-200 motion-safe:active:scale-[0.98]';
const ESTILO_PERSONALIZAR = `${BASE_CONTOUR} border-violet-600 text-violet-600 hover:bg-[#F2EDFB]`;
const ESTILO_DEVIS = `${BASE_CONTOUR} border-marine text-marine hover:bg-perle`;

function enlaceEstudio(producto: Producto, color: Color) {
  return `/personnaliser/${producto.slug}?color=${encodeURIComponent(color.nombre)}`;
}

function enlaceDevis(producto: Producto) {
  return `/devis?produit=${encodeURIComponent(producto.slug)}`;
}

/** Icône document du bouton devis. */
function IconoDevis({ className = 'h-5 w-5' }: { className?: string }) {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true" className={className}>
      <path d="M14 3H7a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h10a2 2 0 0 0 2-2V8z" />
      <path d="M14 3v5h5M9 13h6M9 17h4" />
    </svg>
  );
}

interface Props {
  producto: Producto;
  /** Photos de chaque couleur (`fotosPorColor()` côté serveur) : la fiche ne charge pas l'index des photos. */
  fotosPorColor: Record<string, FotosProducto | undefined>;
  /** Couleur de la photo de base (réelle) ; sans elle, la note ne précise pas « Photo en … ». */
  colorBase?: string;
}

export default function Ficha({ producto, fotosPorColor, colorBase }: Props) {
  const [color, setColor] = useState<Color>(() => colorPorDefecto(producto));
  const [lado, setLado] = useState<'delante' | 'detras'>('delante');
  // Emplacements choisis pour le marquage : un seul par côté (devant / dos, ou face A / B).
  const [posiciones, setPosiciones] = useState<Posicion[]>([]);
  const id = useId();
  const fotos = fotosPorColor[color.nombre];
  const conEstudio = tieneEstudio(producto);
  const goodie = esGoodie(producto);
  const precio = textoPrecio(producto);
  const desde = conPrecio(producto);
  const colorFoto = colorBase ? producto.colores.find((c) => c.nombre === colorBase) : undefined;
  // Une couleur sans photo propre, montrée avec la photo de base non recolorée (goodies d'une seule matière).
  const fotoDelBase = Boolean(fotos && !fotos.real && colorBase && colorBase !== color.nombre && fotos.delante === fotosPorColor[colorBase]?.delante);
  const detras = lado === 'detras' && Boolean(fotos?.detras);
  const fotoActual = detras ? fotos?.detras : fotos?.delante;
  const disenoActual = detras ? fotos?.disenoDetras : fotos?.diseno;
  // Note sous la galerie. Le dos des casquettes est une photo réelle sans motif (seul le devant se personnalise) :
  // la note du motif n'y a pas lieu d'être.
  const ladoSinDiseno = detras && Boolean(fotos?.diseno) && !fotos?.disenoDetras;
  const notaEjemplo = !ladoSinDiseno && fotos?.ejemplo === 'tu-logo-aqui' ? '« Votre logo ici » montre où se place votre logo. ' : '';
  const notaColor = fotoDelBase && colorFoto ? `Photo en ${colorFoto.nombre.toLowerCase()}. ` : '';

  const elegirColor = (c: Color) => {
    setColor(c);
    if (!fotosPorColor[c.nombre]?.detras) setLado('delante');
  };

  // Préchargement des photos de toutes les couleurs de la vue courante, après le chargement initial (sans toucher au
  // LCP), pour que la révélation n'affiche jamais de trou.
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

  // Barre collante mobile : elle s'efface tant que le bouton « Ajouter au panier » de la fiche est à l'écran (un seul
  // bouton fuchsia visible à la fois), et revient dès qu'il en sort.
  const [ctaVisible, setCtaVisible] = useState(false);
  useEffect(() => {
    const boton = document.getElementById(`${id}-principal`);
    if (!boton || !('IntersectionObserver' in window)) return;
    const observador = new IntersectionObserver((entradas) => setCtaVisible(entradas.some((e) => e.isIntersecting)));
    observador.observe(boton);
    return () => observador.disconnect();
  }, [id]);

  const requierePosicion = producto.posiciones.length > 0;
  const alternarPosicion = (p: Posicion) =>
    setPosiciones((actual) => (actual.includes(p) ? actual.filter((x) => x !== p) : [...actual.filter((x) => POSICIONES[x].lado !== POSICIONES[p].lado), p]));
  const posicionesCesta = producto.posiciones.filter((p) => posiciones.includes(p.posicion)).map((p) => ({ posicion: p.posicion, nombre: POSICIONES[p.posicion].nombre }));
  const idPosiciones = `${id}-posiciones`;
  const lados = Array.from(new Set(producto.posiciones.map((p) => POSICIONES[p.posicion].lado).filter(Boolean)));
  const ayudaPosiciones = lados.length > 1 ? 'Choisissez au moins un emplacement, un seul par côté.' : 'Choisissez l’emplacement de votre logo.';
  const cm = (n: number) => n.toLocaleString('fr-FR');

  return (
    <div className="grid gap-8 lg:grid-cols-[minmax(0,1.15fr)_minmax(360px,1fr)] lg:gap-12">
      {/* Galerie sur fond blanc, carte à ombre douce */}
      <div className="lg:sticky lg:top-28 lg:self-start">
        <div className="relative aspect-square overflow-hidden rounded-2xl bg-white shadow-carte ring-1 ring-marine/5">
          {fotoActual ? (
            <FotoProducto
              foto={{ src: fotoActual, anchos: detras ? fotos?.anchosDetras : fotos?.anchos, diseno: disenoActual }}
              alt={`${producto.tipo} ${producto.nombre}, coloris ${color.nombre.toLowerCase()}, vue ${detras ? 'de dos' : 'de face'}${disenoActual?.marca === 'tu-logo-aqui' ? ', avec le motif « Votre logo ici »' : ''}`}
              sizes={SIZES}
              prioridad="alta"
              precargaLcp
              className="aspect-square h-auto w-full object-contain p-4 sm:p-6"
            />
          ) : (
            <div className="flex aspect-square items-center justify-center bg-perle">
              <span className="rounded-full px-3 py-1 font-mono text-xs text-ardoise ring-1 ring-marine/30">[photo à fournir]</span>
            </div>
          )}
          {fotos?.detras && (
            <div className="absolute top-3 left-3 z-10 inline-flex rounded-full bg-white/90 p-1 shadow-carte ring-1 ring-marine/10 backdrop-blur" role="group" aria-label="Vue">
              {(['delante', 'detras'] as const).map((l) => (
                <button
                  key={l}
                  type="button"
                  onClick={() => setLado(l)}
                  aria-pressed={lado === l}
                  className="min-h-9 rounded-full px-4 py-1.5 text-xs font-semibold text-ardoise transition-colors hover:text-marine aria-pressed:bg-marine aria-pressed:text-white aria-pressed:hover:text-white"
                >
                  {l === 'delante' ? 'Devant' : 'Dos'}
                </button>
              ))}
            </div>
          )}
        </div>
        <p className="mt-3 text-xs text-ardoise">
          {notaEjemplo}
          {notaColor}
          Les couleurs à l’écran sont indicatives.
        </p>
      </div>

      {/* Données et actions, sur carte perle */}
      <div className="rounded-2xl bg-perle p-5 text-encre shadow-carte ring-1 ring-marine/5 sm:p-7">
        <Etiquetas destacado={producto.destacado} etiquetas={producto.etiquetas} conEstudio={conEstudio} />
        <h1 className="mt-3 font-display text-3xl font-extrabold tracking-tight text-marine sm:text-4xl">{producto.nombre}</h1>
        <p className="mt-1 text-lg text-ardoise">{producto.tipo}</p>

        <p className="mt-4">
          <span className={`inline-flex rounded-full px-3.5 py-1.5 text-sm font-semibold text-marine ${desde ? 'bg-white ring-1 ring-marine/10' : 'bg-fuchsia-50'}`}>{precio}</span>
        </p>
        {producto.estado === 'consultar-disponibilidad' && <p className="mt-2 text-sm text-ardoise">Disponibilité à confirmer : posez-nous la question.</p>}
        <p className="mt-2 text-xs leading-relaxed text-ardoise">
          {desde ? `${TEXTOS.sinIva} ` : ''}
          {TEXTOS.notaPrecios} {TEXTOS.pedidoMinimo}
        </p>

        <dl className="mt-6 grid gap-x-6 gap-y-3 text-sm sm:grid-cols-[auto_1fr]">
          <dt className="font-medium text-ardoise">{producto.gramaje ? 'Composition et grammage' : 'Matière'}</dt>
          <dd>{textoMaterial(producto)}</dd>
          {producto.tallas && (
            <>
              <dt className="font-medium text-ardoise">Tailles</dt>
              <dd>
                {producto.tallas.join(' · ')}
                {producto.tallasInfantiles && <span className="block text-ardoise">Enfant : {producto.tallasInfantiles.join(' · ')}</span>}
              </dd>
            </>
          )}
        </dl>

        {/* Couleurs avec leur nom ; le choix change la photo quand la couleur en a une */}
        <fieldset className="mt-6">
          <legend className="text-sm font-medium text-ardoise">
            Couleur · <span className="font-semibold text-marine">{color.nombre}</span>
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
                  className={`h-9 w-9 rounded-full border border-marine/15 shadow-[inset_0_0_0_2px_rgba(255,255,255,0.6)] transition-transform hover:scale-105 motion-reduce:transition-none ${seleccionado ? 'ring-2 ring-marine ring-offset-2 ring-offset-perle' : ''}`}
                  style={{ background: fondoMuestra(c) }}
                >
                  <span className="sr-only">{c.nombre}</span>
                </button>
              );
            })}
          </div>
          <p className="mt-2 text-xs text-ardoise">
            {producto.colores.length} {producto.colores.length === 1 ? 'couleur' : 'couleurs'}
            {producto.colores.some((c) => c.provisional) ? ' · noms de couleur indicatifs' : ''}
          </p>
        </fieldset>

        {/* Emplacement du marquage : seulement ceux que le produit accepte ; obligatoire pour ajouter au panier */}
        <div className="mt-6">
          {requierePosicion ? (
            <fieldset>
              <legend id={idPosiciones} tabIndex={-1} className="text-sm font-medium text-ardoise outline-none focus-visible:ring-2 focus-visible:ring-bleu-600">
                Où placer votre logo <span aria-hidden="true">*</span>
                <span className="sr-only">(obligatoire)</span>
              </legend>
              <p className="mt-1 text-xs text-ardoise">{ayudaPosiciones}</p>
              <ul className="mt-2 grid gap-1.5 sm:grid-cols-2" aria-describedby={`${idPosiciones}-ayuda`}>
                {producto.posiciones.map((p) => {
                  const puesta = posiciones.includes(p.posicion);
                  return (
                    <li key={p.posicion}>
                      <button
                        type="button"
                        aria-pressed={puesta}
                        onClick={() => alternarPosicion(p.posicion)}
                        className={`flex min-h-12 w-full items-center gap-3 rounded-xl border bg-white px-3 py-2 text-left text-sm transition-colors ${puesta ? 'border-marine ring-2 ring-marine' : 'border-marine/15 hover:border-marine/40'}`}
                      >
                        <span
                          aria-hidden="true"
                          className={`flex h-5 w-5 shrink-0 items-center justify-center rounded-full border ${puesta ? 'border-marine bg-marine text-white' : 'border-marine/30'}`}
                        >
                          {puesta && (
                            <svg viewBox="0 0 20 20" className="h-3.5 w-3.5" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                              <path d="M5 10.5l3.2 3L15 7" />
                            </svg>
                          )}
                        </span>
                        <span>
                          <span className="block font-semibold text-marine">{POSICIONES[p.posicion].nombre}</span>
                          <span className="block text-xs text-ardoise">
                            {POSICIONES[p.posicion].lado ? `${POSICIONES[p.posicion].lado} · ` : ''}jusqu’à {cm(p.maxCm[0])} × {cm(p.maxCm[1])} cm
                          </span>
                        </span>
                      </button>
                    </li>
                  );
                })}
              </ul>
              <p id={`${idPosiciones}-ayuda`} className="mt-2 text-xs text-ardoise">
                {posicionesCesta.length ? `Choisi : ${posicionesCesta.map((p) => p.nombre).join(' + ')}.` : 'Aucun emplacement choisi pour l’instant.'}
                {!goodie && lados.length > 1 ? ' Avec deux marquages, nous en tenons compte dans le devis.' : ''}
              </p>
            </fieldset>
          ) : (
            <>
              <h2 className="text-sm font-medium text-ardoise">Personnalisation</h2>
              <p className="mt-2 text-sm text-marine">Marquage de votre logo sur la zone prévue du produit : nous précisons la taille dans le devis.</p>
            </>
          )}
        </div>

        {/* Actions : un seul bouton fuchsia (panier), puis studio (violet) et devis (marine) */}
        <div className="mt-8 border-t border-marine/10 pt-6">
          <AnadirAlPresupuesto
            producto={producto}
            color={color}
            foto={fotos?.delante}
            posiciones={posicionesCesta}
            requierePosicion={requierePosicion}
            idPosiciones={idPosiciones}
            idBoton={`${id}-principal`}
          />
          <div className="mt-4 flex flex-wrap items-center gap-3">
            {conEstudio && (
              <Link href={enlaceEstudio(producto, color)} className={ESTILO_PERSONALIZAR}>
                Personnaliser avec mon logo
              </Link>
            )}
            <Link href={enlaceDevis(producto)} className={ESTILO_DEVIS}>
              <IconoDevis />
              Demander un devis
            </Link>
          </div>
          <p className="mt-3 text-xs text-ardoise">
            {conEstudio ? 'Le studio vous permet de poser votre logo sur le vêtement avant de nous l’envoyer. ' : ''}
            Une commande pour votre entreprise, votre club ou votre camping ? Le devis est le plus direct.
          </p>
          <ul className="mt-5 space-y-1.5 text-sm text-marine">
            {[TEXTOS.datosCatalogo[0], TEXTOS.datosCatalogo[1], TEXTOS.plazoPresupuesto].map((t) => (
              <li key={t} className="flex items-start gap-2">
                <svg viewBox="0 0 20 20" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true" className="mt-0.5 h-4 w-4 shrink-0 text-cyan-700">
                  <path d="M5 10.5l3.2 3L15 7" />
                </svg>
                {t}
              </li>
            ))}
          </ul>
        </div>
      </div>

      {/* Mobile : barre collante avec le panier et le devis (laisse la place au bouton WhatsApp) */}
      <div
        inert={ctaVisible}
        className={`barra-inferior fixed inset-x-0 bottom-0 z-30 flex items-center gap-2 border-t border-marine/10 bg-white/90 p-3 pr-24 backdrop-blur-md transition-[transform,opacity] duration-200 motion-reduce:transition-none lg:hidden ${ctaVisible ? 'pointer-events-none translate-y-full opacity-0' : ''}`}
      >
        <a href={`#${id}-principal`} className={`${ESTILO_BOTON.principal} min-h-12 flex-1`}>
          Ajouter au panier
        </a>
        <Link href={enlaceDevis(producto)} aria-label="Demander un devis" title="Demander un devis" className="inline-flex h-12 w-12 shrink-0 items-center justify-center rounded-full border-2 border-marine bg-white text-marine">
          <IconoDevis />
        </Link>
      </div>
    </div>
  );
}
