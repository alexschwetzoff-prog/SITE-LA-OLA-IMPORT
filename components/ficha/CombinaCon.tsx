import type { Producto } from '@/data/catalogo';
import { TarjetaProducto } from '@/components/catalogo/TarjetaProducto';
import { combinaCon, datosTarjeta } from '@/lib/catalogo';

/** «Combina con»: tres productos relacionados (sección 4). */
export function CombinaCon({ producto }: { producto: Producto }) {
  const relacionados = combinaCon(producto);
  if (!relacionados.length) return null;
  return (
    <section aria-labelledby="combina" className="mt-16 lg:mt-24">
      <h2 id="combina" className="font-display text-2xl font-semibold text-moon-50 sm:text-3xl">
        Combina con
      </h2>
      <p className="mt-2 text-mist-300">Otros productos que suelen ir con {producto.nombre} en el mismo pedido.</p>
      <ul className="mt-6 grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
        {relacionados.map((p) => (
          <li key={p.slug}>
            <TarjetaProducto datos={datosTarjeta(p)} />
          </li>
        ))}
      </ul>
    </section>
  );
}
