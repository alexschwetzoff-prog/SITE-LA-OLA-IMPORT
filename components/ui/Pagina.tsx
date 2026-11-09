import type { ReactNode } from 'react';

/** Conteneur de page avec son titre (sous l'en-tête fixe de 80 px). */
export function Pagina({ titulo, intro, children }: { titulo: string; intro?: ReactNode; children?: ReactNode }) {
  return (
    <section className="mx-auto w-full max-w-6xl px-4 pt-28 pb-16 sm:px-6 lg:px-8 lg:pt-32">
      <h1 className="max-w-3xl font-display text-4xl font-extrabold tracking-tight text-marine sm:text-5xl">{titulo}</h1>
      {intro && <div className="mt-4 max-w-3xl text-lg text-ardoise">{intro}</div>}
      {children}
    </section>
  );
}
