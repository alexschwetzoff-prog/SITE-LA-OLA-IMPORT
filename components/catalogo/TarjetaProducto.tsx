'use client';

import { useCallback, useRef, useState } from 'react';
import Link from 'next/link';
import type { ColorTarjeta, DatosTarjeta, Ejemplo } from '@/lib/catalogo';
import { precargarFotos } from '@/lib/fotos';
import FotoProducto, { precalentarReveal } from '@/components/producto/FotoProducto';
import { Etiquetas } from './Etiquetas';
import { Muestras } from './Muestras';

// La photo de la carte mesure 325 px CSS au plus (3 colonnes à 1440) : celle de 800 px suffit même en 2×.
const ANCHO_MAXIMO = 800;

interface Props {
  /** Données calculées sur le serveur avec `datosTarjeta()` : la carte ne charge ni le catalogue ni l'index des photos. */
  datos: DatosTarjeta;
  /** Les premières cartes de la page chargent leur photo tout de suite ; 'alta' pour la première (LCP). */
  prioridad?: boolean | 'alta';
  sizes?: string;
}

function textoAlt(datos: DatosTarjeta, color: ColorTarjeta, ejemplo: Ejemplo | null): string {
  const base = `${datos.tipo} ${datos.nombre}, coloris ${color.nombre.toLowerCase()}`;
  if (ejemplo === 'tu-logo-aqui') return `${base}, avec le motif « Votre logo ici » à l’emplacement du marquage`;
  return base;
}

/**
 * Carte produit : photo avec le motif d'exemple dessiné dessus (le dos au survol de la carte ou au focus du titre,
 * s'il existe), nom, type, « Consulter le prix », matière et pastilles de couleur : en choisir une révèle la photo de
 * cette couleur (animation de la mascotte, components/producto/FotoProducto.tsx). Les produits avec studio portent
 * l'étiquette « Personnalisable » et un lien direct vers le studio dans la couleur choisie. Fond blanc pour des
 * couleurs fidèles.
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
  const hrefFicha = `/catalogue/${datos.slug}`;
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
      className="carte-produit group relative flex h-full flex-col overflow-hidden rounded-2xl bg-white text-encre shadow-carte ring-1 ring-marine/5"
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
          <div className="flex h-full items-center justify-center bg-perle p-6 text-center text-sm text-ardoise">
            <span className="rounded-full px-3 py-1 font-mono text-xs ring-1 ring-marine/30">[photo à fournir]</span>
          </div>
        )}
        <div className="pointer-events-none absolute top-3 left-3 z-10">
          <Etiquetas destacado={datos.destacado} etiquetas={datos.etiquetas} conEstudio={datos.conEstudio} />
        </div>
      </div>

      <div className="flex flex-1 flex-col gap-2 p-4 pt-3">
        <div className="flex items-start justify-between gap-3">
          <div className="min-w-0">
            <h3 className="font-display text-xl font-extrabold leading-tight text-marine">
              <Link
                href={hrefFicha}
                className="after:absolute after:inset-0 after:rounded-2xl after:content-['']"
                onFocus={(e) => setTituloEnfocado(e.currentTarget.matches(':focus-visible'))}
                onBlur={() => setTituloEnfocado(false)}
              >
                {datos.nombre}
              </Link>
            </h3>
            <p className="mt-0.5 text-sm text-ardoise">{datos.tipo}</p>
          </div>
          {/* « Consulter le prix » tant qu'il n'y a pas de tarif : badge pastel, texte marine. */}
          <p className={`shrink-0 rounded-full px-2.5 py-1 text-right text-xs font-semibold ${datos.desde ? 'text-marine' : 'bg-fuchsia-50 text-marine'}`}>{datos.precio}</p>
        </div>
        <p className="text-xs text-ardoise">{datos.material}</p>
        <div className="mt-auto flex items-end justify-between gap-3 pt-1">
          <div className="min-w-0" onPointerEnter={() => setSobreMuestras(true)} onPointerLeave={() => setSobreMuestras(false)}>
            <Muestras colores={datos.colores} elegido={color} onElegir={setColor} />
            <p className="mt-1 truncate text-xs text-ardoise">{color.nombre}</p>
          </div>
          {datos.conEstudio && (
            <Link
              href={`/personnaliser/${datos.slug}?color=${encodeURIComponent(color.nombre)}`}
              className="relative z-10 inline-flex min-h-8 shrink-0 items-center gap-1 rounded-full border-2 border-violet-600 bg-white px-3 py-1 text-xs font-semibold text-violet-600 transition-colors hover:bg-[#F2EDFB]"
              aria-label={`Personnaliser ${datos.nombre} avec mon logo, coloris ${color.nombre.toLowerCase()}`}
            >
              Personnaliser
            </Link>
          )}
        </div>
      </div>
    </article>
  );
}
