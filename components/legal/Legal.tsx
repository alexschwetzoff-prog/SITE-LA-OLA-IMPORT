import type { ReactNode } from 'react';

/** Página legal: columna de lectura sobre el fondo oscuro. Texto literal de docs/LEGAL.md. */
export function PaginaLegal({ titulo, children }: { titulo: string; children: ReactNode }) {
  return (
    <article className="mx-auto w-full max-w-3xl px-4 pt-32 pb-16 sm:px-6 lg:px-8 lg:pt-40">
      <h1 className="font-display text-4xl font-semibold tracking-tight text-moon-50 sm:text-5xl">{titulo}</h1>
      <div className="mt-10 space-y-5 text-base leading-relaxed text-mist-300 [&_a]:text-nova-400 [&_a]:underline [&_a]:decoration-nova-400/50 [&_a]:underline-offset-4 hover:[&_a]:text-star-300 [&_strong]:text-moon-50">
        {children}
      </div>
    </article>
  );
}

export function Apartado({ titulo, children }: { titulo: string; children: ReactNode }) {
  return (
    <p>
      <strong className="font-semibold">{titulo}.</strong> {children}
    </p>
  );
}

export function Subtitulo({ children }: { children: ReactNode }) {
  return <h2 className="pt-4 font-display text-xl font-semibold text-moon-50">{children}</h2>;
}

export function Lista({ children }: { children: ReactNode }) {
  return <ul className="list-disc space-y-2 pl-6 marker:text-nova-400">{children}</ul>;
}

/** Dato que falta en docs/LEGAL.md: marcador visible hasta que el equipo lo aporte. */
export function Falta({ que = 'FALTA' }: { que?: string }) {
  return (
    <mark className="rounded bg-transparent px-1 font-mono text-sm font-medium text-star-300 ring-1 ring-star-300/60">
      [{que}]
    </mark>
  );
}

export function Correo({ email }: { email: string }) {
  return <a href={`mailto:${email}`}>{email}</a>;
}
