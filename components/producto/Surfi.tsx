'use client';

import { forwardRef, useImperativeHandle, useRef, type ForwardedRef } from 'react';
import type { ElementosSurfi } from '@/lib/surfi';

// Surfi, la mascotte de La Ola Import, sur sa vague. Monté seulement pendant une révélation de couleur ; c'est
// lib/surfi.ts qui l'anime autour du cadre de la photo. Décoratif : aria-hidden, aucun clic capté.
//
// Structure : la scène (couvre la photo) → le voyageur (suit le trajet via offset-path et pivote dans les virages)
// → la vague (SVG ondulant, sous ses pieds, plus longue derrière lui) + le cadre qui montre une des 4 vues du sprite.

export interface RefsSurfi {
  readonly voyageur: HTMLDivElement | null;
  readonly bande: HTMLDivElement | null;
}

/** Les éléments, ou null si l'un d'eux n'est pas encore monté. */
export function elementosDe(refs: RefsSurfi | null | undefined): ElementosSurfi | null {
  if (!refs?.voyageur || !refs.bande) return null;
  return { voyageur: refs.voyageur, bande: refs.bande };
}

function SurfiBase({ className = '' }: { className?: string }, ref: ForwardedRef<RefsSurfi>) {
  const voyageurRef = useRef<HTMLDivElement>(null);
  const bandeRef = useRef<HTMLDivElement>(null);
  useImperativeHandle(
    ref,
    () => ({
      get voyageur() {
        return voyageurRef.current;
      },
      get bande() {
        return bandeRef.current;
      },
    }),
    [],
  );
  return (
    <div aria-hidden="true" className={`surfi-scene ${className}`}>
      <div ref={voyageurRef} className="surfi-voyageur">
        {/* La vague : une bande ondulante aux couleurs du logo, crête blanche ; elle défile sous la planche. */}
        <div className="surfi-vague">
          <svg viewBox="0 0 480 60" preserveAspectRatio="none" className="surfi-vague-defile">
            {/* deux longueurs d'onde identiques : le défilement de 240 px boucle sans raccord visible */}
            <path
              d="M0 30 C 30 14 60 14 90 30 S 150 46 180 30 S 210 14 240 30 C 270 14 300 14 330 30 S 390 46 420 30 S 450 14 480 30 L 480 60 L 0 60 Z"
              fill="#05bcf8" fillOpacity="0.8"
            />
            <path
              d="M0 30 C 30 14 60 14 90 30 S 150 46 180 30 S 210 14 240 30 C 270 14 300 14 330 30 S 390 46 420 30 S 450 14 480 30"
              fill="none"
              stroke="#ffffff"
              strokeOpacity="0.9"
              strokeWidth="5"
              strokeLinecap="round"
            />
          </svg>
        </div>
        <div className="surfi-cadre">
          <div ref={bandeRef} className="surfi-bande" />
        </div>
      </div>
    </div>
  );
}

export const Surfi = forwardRef<RefsSurfi, { className?: string }>(SurfiBase);
