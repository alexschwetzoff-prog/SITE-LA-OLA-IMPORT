import type { ReactNode } from 'react';

/** Contenedor de página con el título. Las páginas de la fase 3 solo llevan su título. */
export function Pagina({ titulo, children }: { titulo: string; children?: ReactNode }) {
  return (
    <section className="mx-auto w-full max-w-6xl px-4 pt-32 pb-16 sm:px-6 lg:px-8 lg:pt-40">
      <h1 className="max-w-3xl font-display text-4xl font-semibold tracking-tight text-moon-50 sm:text-5xl">{titulo}</h1>
      {children}
    </section>
  );
}
