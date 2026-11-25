import PanierCliente, { type LineaVista } from '@/components/cuenta/PanierCliente';
import { calcularCarrito, type FilaPrecio } from '@/lib/carrito/calculo';
import { productoLigero } from '@/lib/cuenta/catalogo-cuenta';
import { exigirSesion, puedeVerPrecios } from '@/lib/cuenta/sesion';
import { crearClienteServidor } from '@/lib/supabase/servidor';

export default async function PaginaPanier() {
  const s = await exigirSesion('/compte/panier');
  if (!puedeVerPrecios(s)) {
    return (
      <div className="max-w-2xl">
        <h2 className="font-display text-2xl font-extrabold text-marine">Panier</h2>
        <p className="mt-2 text-ardoise">Le panier est ouvert dès que votre compte professionnel est validé.</p>
      </div>
    );
  }
  const supabase = await crearClienteServidor();
  const [l, p, t] = await Promise.all([
    supabase.from('lineas_carrito').select('id, producto_slug, variante, talla, cantidad, personalizacion, creado_en').order('creado_en'),
    supabase.from('precios').select('producto_slug, variante, cantidad_minima, precio_ht').eq('activo', true),
    supabase.rpc('tasa_iva'),
  ]);
  const filas = (p.data ?? []).map((f) => ({ ...f, precio_ht: Number(f.precio_ht) })) as FilaPrecio[];
  const tasa = typeof t.data === 'number' ? t.data : Number(t.data ?? 20);
  const lineas = (l.data ?? []).filter((x) => productoLigero(x.producto_slug));
  const calc = calcularCarrito(lineas.map((x) => ({ id: x.id, producto_slug: x.producto_slug, variante: x.variante, talla: x.talla, cantidad: x.cantidad })), filas, tasa);
  const vistas: LineaVista[] = calc.lineas.map((c, i) => {
    const prod = productoLigero(c.producto_slug)!;
    const pers = lineas[i].personalizacion as { posiciones?: string[] } | null;
    return {
      id: c.id, slug: c.producto_slug, nombre: prod.nombre, tipo: prod.tipo, variante: c.variante, talla: c.talla, cantidad: c.cantidad,
      foto: (c.variante && prod.fotoPorVariante[c.variante]) || prod.foto, personalizacion: pers?.posiciones?.length ? pers.posiciones.join(' + ') : null,
      estado: c.estado, minimo: c.minimo, precioUnitarioHt: c.precioUnitarioHt, totalHt: c.totalHt,
    };
  });
  return (
    <div>
      <h2 className="font-display text-2xl font-extrabold text-marine">Panier</h2>
      <p className="mt-1 mb-6 text-ardoise">Prix HT ; la TVA est ajoutée au total.</p>
      <PanierCliente lineas={vistas} totales={{ subtotalHt: calc.subtotalHt, tasaIva: calc.tasaIva, importeIva: calc.importeIva, totalTtc: calc.totalTtc, completo: calc.completo }} />
    </div>
  );
}
