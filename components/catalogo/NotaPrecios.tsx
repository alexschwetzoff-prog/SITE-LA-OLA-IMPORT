import { TEXTOS } from '@/lib/site';

/** Note sur les prix (devis sur mesure) et la ligne de quantité minimale [à confirmer], près des mentions de prix. */
export function NotaPrecios({ className = '' }: { className?: string }) {
  return (
    <div className={`text-xs leading-relaxed text-ardoise ${className}`}>
      <p>{TEXTOS.notaPrecios}</p>
      <p className="mt-1 font-medium text-marine">{TEXTOS.pedidoMinimo}</p>
    </div>
  );
}
