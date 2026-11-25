'use client';

// Precio de un producto. Sin sesión (o con la cuenta en revisión) no hay precio: sale un bloque discreto con los botones de
// conexión. Con la cuenta validada se leen de /api/precios (privado, sin caché), nunca del HTML.
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { elegirPrecio, formatoEuros, type FilaPrecio } from '@/lib/carrito/calculo';
import { useCuenta } from './almacen';

/** Texto de precio de un producto para una cuenta validada: «À partir de X € HT» + lote mínimo, o «Prix sur demande». */
export function resumenPrecio(filas: FilaPrecio[], slug: string, variante?: string): { texto: string; lote?: number } {
  const delProducto = filas.filter((f) => f.producto_slug === slug);
  const deVariante = variante ? delProducto.filter((f) => f.variante === variante) : [];
  const usar = deVariante.length ? deVariante : delProducto.filter((f) => f.variante === null || !variante);
  if (!usar.length) return { texto: 'Prix sur demande' };
  const mejor = usar.reduce((a, b) => (b.precio_ht < a.precio_ht ? b : a));
  const hayVariasVariantes = !variante && new Set(delProducto.map((f) => f.variante)).size > 1;
  const prefijo = usar.length > 1 || hayVariasVariantes ? 'À partir de ' : '';
  const menorLote = Math.min(...usar.map((f) => f.cantidad_minima));
  return { texto: `${prefijo}${formatoEuros(mejor.precio_ht)} HT`, lote: menorLote > 1 ? menorLote : undefined };
}

export default function BloquePrecio({ slug, variante, compacto = false }: { slug: string; variante?: string; compacto?: boolean }) {
  const estado = useCuenta((s) => s.estado);
  const precios = useCuenta((s) => s.precios);
  const ruta = usePathname();
  const siguiente = encodeURIComponent(ruta || '/');

  if (estado === 'cargando') {
    return <span aria-hidden="true" className={`inline-block animate-pulse rounded-full bg-marine/10 ${compacto ? 'h-6 w-24' : 'h-9 w-40'}`} />;
  }
  if (estado === 'validada') {
    const r = resumenPrecio(precios, slug, variante);
    return (
      <span className={compacto ? 'text-right' : 'inline-flex flex-col gap-0.5'}>
        <span className={`inline-flex rounded-full bg-white px-3 py-1 font-semibold text-marine ring-1 ring-marine/10 ${compacto ? 'text-xs' : 'text-sm'}`}>{r.texto}</span>
        {r.lote && <span className="text-xs text-ardoise">Lot minimum : {r.lote}</span>}
      </span>
    );
  }
  if (estado === 'pendiente') {
    return <span className={`inline-flex rounded-full bg-fuchsia-50 px-3 py-1 font-semibold text-marine ${compacto ? 'text-xs' : 'text-sm'}`}>Compte en cours de validation</span>;
  }
  if (compacto) {
    return (
      <Link href={`/connexion?siguiente=${siguiente}`} className="relative z-10 inline-flex rounded-full bg-fuchsia-50 px-2.5 py-1 text-right text-xs font-semibold text-marine hover:bg-fuchsia-100">
        Prix : connexion
      </Link>
    );
  }
  return (
    <div className="rounded-2xl border border-marine/10 bg-white p-4">
      <p className="font-display text-base font-extrabold text-marine">Connectez-vous pour voir les prix</p>
      <p className="mt-1 text-sm text-ardoise">Les prix sont réservés aux professionnels. Votre compte est validé par notre équipe après l’inscription.</p>
      <div className="mt-3 flex flex-wrap gap-2">
        <Link href={`/connexion?siguiente=${siguiente}`} className="inline-flex min-h-10 items-center rounded-full bg-fuchsia-700 px-4 text-sm font-semibold text-white hover:bg-fuchsia-800">
          Se connecter
        </Link>
        <Link href={`/inscription?siguiente=${siguiente}`} className="inline-flex min-h-10 items-center rounded-full border-2 border-violet-600 px-4 text-sm font-semibold text-violet-600 hover:bg-violet-600/8">
          Créer un compte professionnel
        </Link>
      </div>
    </div>
  );
}

export { elegirPrecio };
