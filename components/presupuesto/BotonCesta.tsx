'use client';

import Link from 'next/link';
import { usePresupuesto } from '@/lib/presupuesto';

/** Accès au panier dans l'en-tête : icône avec le nombre d'articles, mène à /projet. */
export default function BotonCesta({ className = '' }: { className?: string }) {
  const items = usePresupuesto();
  const n = items.length;
  return (
    <Link
      href="/projet"
      aria-label={n ? `Mon panier : ${n} ${n === 1 ? 'article' : 'articles'}` : 'Mon panier'}
      className={`relative inline-flex items-center gap-1.5 rounded-full p-2 text-ardoise transition-colors hover:bg-marine/8 hover:text-marine ${className}`}
    >
      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true" className="h-5 w-5">
        <path d="M8 4h8l1 3H7z" />
        <path d="M5 7h14v12a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2z" />
        <path d="M9 12h6M9 16h4" />
      </svg>
      <span className="hidden text-sm font-medium xl:inline">Panier</span>
      {n > 0 && (
        <span className="absolute -top-0.5 -right-0.5 flex h-5 min-w-5 items-center justify-center rounded-full bg-bleu-600 px-1 text-[11px] font-bold text-white xl:static xl:ml-0.5">
          {n}
        </span>
      )}
    </Link>
  );
}
