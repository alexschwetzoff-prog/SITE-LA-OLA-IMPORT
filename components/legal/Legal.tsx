import type { ReactNode } from 'react';

// Pages légales : colonne de lecture sur fond clair. Les textes sources (provisoires, à faire valider) sont dans
// docs/LEGAL.md. Tout ce qui est entre crochets reste visible tant que La Ola Import ne l'a pas fourni :
// scripts/revisar-web.mjs bloque la mise en ligne tant qu'il en reste.

/** Encadré discret en tête de chaque page légale, à retirer une fois les textes validés. */
export function AvisProvisoire() {
  return (
    <p role="note" className="mt-6 rounded-2xl border border-bleu-600/30 bg-perle px-4 py-3 text-sm text-marine">
      <strong className="font-semibold">[Texte provisoire, à faire valider par le conseil juridique de La Ola Import.]</strong>{' '}
      Les éléments entre crochets restent à compléter avant la mise en ligne.
    </p>
  );
}

export function PaginaLegal({
  titulo,
  intro,
  miseAJour = '[date à confirmer]',
  provisoire = true,
  children,
}: {
  titulo: string;
  intro?: ReactNode;
  /** Date de dernière mise à jour affichée sous le titre. */
  miseAJour?: string;
  /** Affiche l'encadré « Texte provisoire » (pages légales). */
  provisoire?: boolean;
  children: ReactNode;
}) {
  return (
    <article className="mx-auto w-full max-w-3xl px-4 pt-32 pb-16 sm:px-6 lg:px-8 lg:pt-40">
      <h1 className="font-display text-4xl font-bold tracking-tight text-marine sm:text-5xl">{titulo}</h1>
      <p className="mt-3 text-sm text-ardoise">Dernière mise à jour : {miseAJour}</p>
      {provisoire && <AvisProvisoire />}
      {intro && <div className="mt-8 text-lg leading-relaxed text-ardoise">{intro}</div>}
      <div className="mt-8 space-y-8 text-base leading-relaxed text-ardoise [&_a]:text-bleu-600 [&_a]:underline [&_a]:underline-offset-4 hover:[&_a]:text-indigo-700 [&_strong]:text-marine">
        {children}
      </div>
    </article>
  );
}

/** Une section de page légale : un titre de niveau 2 et son contenu (paragraphes, listes, tableaux). */
export function Apartado({ titulo, children }: { titulo: string; children: ReactNode }) {
  return (
    <section className="space-y-3">
      <h2 className="font-display text-xl font-bold text-marine sm:text-2xl">{titulo}</h2>
      {children}
    </section>
  );
}

export function Subtitulo({ children }: { children: ReactNode }) {
  return <h3 className="pt-2 font-display text-lg font-bold text-marine">{children}</h3>;
}

export function Lista({ children }: { children: ReactNode }) {
  return <ul className="list-disc space-y-2 pl-6 marker:text-violet-600">{children}</ul>;
}

/** Donnée manquante : marqueur visible entre crochets jusqu'à ce que La Ola Import la fournisse. */
export function Falta({ que = 'à confirmer' }: { que?: string }) {
  return (
    <mark className="rounded bg-transparent px-1 font-mono text-sm font-medium text-bleu-600 ring-1 ring-bleu-600/60">
      [{que}]
    </mark>
  );
}

/** Valeur issue de SITE : si c'est encore un placeholder entre crochets (« [SIRET] »), elle est affichée comme un manque. */
export function Dato({ valor }: { valor: string }) {
  const m = /^\[(.*)\]$/.exec(valor.trim());
  return m ? <Falta que={m[1]} /> : <>{valor}</>;
}

export function Correo({ email }: { email: string }) {
  return <a href={`mailto:${email}`}>{email}</a>;
}
