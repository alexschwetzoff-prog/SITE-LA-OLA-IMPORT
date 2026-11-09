'use client';

import { forwardRef, useImperativeHandle, useRef, type ForwardedRef } from 'react';
import type { ElementosSurfi } from '@/lib/surfi';

// Surfi, la mascotte de La Ola Import, sur sa vague (remplace Ovni.tsx de la base). Montée seulement pendant une
// révélation de couleur ; c'est lib/surfi.ts qui l'anime. Décoratif : aria-hidden, aucun clic capté.
//
// Structure : la scène (couvre la photo) → le voyageur (traverse la photo) → la vague (sillage SVG, support de la
// planche) + le cadre qui montre une des 4 vues du sprite (face, trois-quarts, profil, dos).

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
        {/* Le sillage : une vague translucide sous la planche, aux couleurs du logo. */}
        <svg viewBox="0 0 200 60" preserveAspectRatio="none" className="absolute -right-[10%] bottom-0 -left-[60%] h-[22%] w-[170%]">
          <defs>
            <linearGradient id="surfi-sillage" x1="0" x2="1" y1="0" y2="0">
              <stop offset="0" stopColor="#10e9fb" stopOpacity="0" />
              <stop offset="0.55" stopColor="#05bcf8" stopOpacity="0.3" />
              <stop offset="1" stopColor="#0363e9" stopOpacity="0.45" />
            </linearGradient>
          </defs>
          <path d="M0 60 C 40 58 70 40 110 36 C 150 32 170 14 200 10 L 200 60 Z" fill="url(#surfi-sillage)" />
          <path d="M60 46 C 100 40 140 30 196 12" fill="none" stroke="#ffffff" strokeOpacity="0.85" strokeWidth="3" strokeLinecap="round" />
        </svg>
        <div className="surfi-cadre">
          <div ref={bandeRef} className="surfi-bande" />
        </div>
      </div>
    </div>
  );
}

export const Surfi = forwardRef<RefsSurfi, { className?: string }>(SurfiBase);
