import { formatoEuros } from '@/lib/carrito/calculo';
import { productoLigero } from '@/lib/cuenta/catalogo-cuenta';
import { exigirSesion, puedeVerPrecios } from '@/lib/cuenta/sesion';
import { crearClienteServidor } from '@/lib/supabase/servidor';

const ESTADOS: Record<string, string> = { borrador: 'Brouillon', pendiente_pago: 'En attente de paiement', pagado: 'Payée', cancelado: 'Annulée' };

export default async function PaginaPedidos() {
  const s = await exigirSesion('/compte/commandes');
  const supabase = await crearClienteServidor();
  const { data: pedidos } = puedeVerPrecios(s)
    ? await supabase.from('pedidos').select('id, numero, estado, subtotal_ht, importe_iva, total_ttc, creado_en, lineas_pedido(producto_slug, variante, talla, cantidad, precio_unitario_ht, total_linea_ht)').order('creado_en', { ascending: false })
    : { data: [] };
  return (
    <div className="max-w-3xl">
      <h2 className="font-display text-2xl font-extrabold text-marine">Commandes</h2>
      {!pedidos?.length ? (
        <p className="mt-3 text-ardoise">Aucune commande pour l’instant.</p>
      ) : (
        <ul className="mt-5 space-y-4">
          {pedidos.map((p) => (
            <li key={p.id} className="rounded-2xl bg-white p-5 shadow-carte ring-1 ring-marine/5">
              <div className="flex flex-wrap items-baseline justify-between gap-2">
                <h3 className="font-display text-lg font-extrabold text-marine">Commande {p.numero}</h3>
                <span className="rounded-full bg-perle px-3 py-1 text-xs font-semibold text-marine">{ESTADOS[p.estado] ?? p.estado}</span>
              </div>
              <p className="text-sm text-ardoise">{new Date(p.creado_en).toLocaleDateString('fr-FR')}</p>
              <ul className="mt-3 space-y-1 text-sm text-marine">
                {(p.lineas_pedido ?? []).map((l, i) => (
                  <li key={i}>
                    {l.cantidad} × {productoLigero(l.producto_slug)?.nombre ?? l.producto_slug}
                    {l.variante ? ` (${l.variante})` : ''} : {formatoEuros(Number(l.total_linea_ht))} HT
                  </li>
                ))}
              </ul>
              <p className="mt-3 text-sm font-semibold text-marine">
                Total : {formatoEuros(Number(p.subtotal_ht))} HT · {formatoEuros(Number(p.total_ttc))} TTC
              </p>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
