import { TEXTOS } from '@/lib/site';

/** Nota fija de precios del catálogo PDF y la línea del pedido mínimo (CLAUDE.md). Siempre a la vista junto a los precios. */
export function NotaPrecios({ className = '' }: { className?: string }) {
  return (
    <div className={`text-xs leading-relaxed text-mist-300 ${className}`}>
      <p>{TEXTOS.notaPrecios}</p>
      <p className="mt-1 font-medium text-moon-50/90">{TEXTOS.pedidoMinimo}</p>
    </div>
  );
}
