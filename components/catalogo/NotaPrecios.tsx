import { TEXTOS } from '@/lib/site';

/** Rappel près des listes de produits : les prix sont réservés aux comptes professionnels validés. */
export function NotaPrecios({ className = '' }: { className?: string }) {
  return (
    <div className={`text-xs leading-relaxed text-ardoise ${className}`}>
      <p>{TEXTOS.precioProfesional}</p>
    </div>
  );
}
