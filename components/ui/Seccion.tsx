import type { ReactNode } from 'react';

interface Props {
  id: string;
  etiqueta?: string; // petite ligne au-dessus du titre
  titulo: string;
  intro?: ReactNode;
  children: ReactNode;
  ancho?: 'normal' | 'ancho';
  fond?: 'blanc' | 'perle';
  className?: string;
}

/** Section de page : sur-titre violet, titre Nunito, intro et contenu. */
export function Seccion({ id, etiqueta, titulo, intro, children, ancho = 'normal', fond = 'blanc', className = '' }: Props) {
  return (
    <section id={id} className={`${fond === 'perle' ? 'bg-perle' : ''} scroll-mt-24`}>
      <div className={`mx-auto w-full ${ancho === 'ancho' ? 'max-w-7xl' : 'max-w-6xl'} px-4 py-14 sm:px-6 lg:px-8 lg:py-20 ${className}`}>
        <div className="max-w-3xl">
          {etiqueta && <p className="mb-2 text-sm font-bold tracking-wide text-violet-600 uppercase">{etiqueta}</p>}
          <h2 className="font-display text-3xl font-extrabold tracking-tight text-marine sm:text-4xl">{titulo}</h2>
          {intro && <div className="mt-3 text-lg text-ardoise">{intro}</div>}
        </div>
        {children}
      </div>
    </section>
  );
}
