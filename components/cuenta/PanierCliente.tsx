'use client';

import { useState, useTransition } from 'react';
import Link from 'next/link';
import { Boton } from '@/components/ui/Botones';
import { formatoEuros, type EstadoLinea } from '@/lib/carrito/calculo';
import { cambiarCantidad, finalizarPedido, moverAFavoritos, quitarLinea } from '@/lib/cuenta/acciones-tienda';

export interface LineaVista {
  id: string;
  slug: string;
  nombre: string;
  tipo: string;
  variante: string;
  talla: string;
  cantidad: number;
  foto: string | null;
  personalizacion: string | null;
  estado: EstadoLinea;
  minimo?: number;
  precioUnitarioHt?: number;
  totalHt?: number;
}

export interface TotalesVista {
  subtotalHt: number;
  tasaIva: number;
  importeIva: number;
  totalTtc: number;
  completo: boolean;
}

export default function PanierCliente({ lineas, totales }: { lineas: LineaVista[]; totales: TotalesVista }) {
  const [pendiente, empezar] = useTransition();
  const [error, setError] = useState<string | null>(null);

  const ejecutar = (f: () => Promise<{ ok: boolean; error?: string; mensaje?: string } | void>) =>
    empezar(async () => {
      setError(null);
      const r = await f();
      if (r && !r.ok) setError(r.mensaje ?? (r.error === 'carrito-vacio' ? 'Votre panier est vide.' : 'Action impossible pour le moment.'));
    });

  if (!lineas.length) {
    return (
      <p className="text-ardoise">
        Votre panier est vide.{' '}
        <Link href="/boutique" className="font-semibold text-bleu-600 underline underline-offset-4">
          Voir la boutique
        </Link>
      </p>
    );
  }
  return (
    <div className="grid gap-8 lg:grid-cols-[1fr_20rem]">
      <ul className="space-y-4">
        {lineas.map((l) => (
          <li key={l.id} className="flex gap-4 rounded-2xl bg-white p-4 shadow-carte ring-1 ring-marine/5">
            <Link href={`/catalogue/${l.slug}`} className="h-24 w-24 shrink-0 overflow-hidden rounded-xl bg-white">
              {l.foto && (
                // eslint-disable-next-line @next/next/no-img-element
                <img src={l.foto} alt={`${l.nombre}${l.variante ? `, ${l.variante.toLowerCase()}` : ''}`} loading="lazy" className="h-full w-full object-contain" />
              )}
            </Link>
            <div className="min-w-0 flex-1">
              <h3 className="font-display text-lg font-extrabold text-marine">{l.nombre}</h3>
              <p className="text-sm text-ardoise">
                {l.tipo}
                {l.variante ? ` · ${l.variante}` : ''}
                {l.talla ? ` · taille ${l.talla}` : ''}
              </p>
              {l.personalizacion && <p className="text-xs text-ardoise">Personnalisation : {l.personalizacion}</p>}
              <div className="mt-2 flex flex-wrap items-center gap-3">
                <label className="flex items-center gap-2 text-sm text-marine">
                  <span>Quantité</span>
                  <input
                    type="number"
                    min={1}
                    max={100000}
                    defaultValue={l.cantidad}
                    aria-label={`Quantité : ${l.nombre}`}
                    onBlur={(e) => {
                      const n = Number(e.target.value);
                      if (Number.isInteger(n) && n >= 1 && n !== l.cantidad) ejecutar(() => cambiarCantidad({ id: l.id, cantidad: n }));
                    }}
                    className="min-h-10 w-24 rounded-xl border border-marine/20 bg-white px-3 text-sm"
                  />
                </label>
                <button type="button" onClick={() => ejecutar(() => moverAFavoritos({ id: l.id }))} className="text-sm font-semibold text-bleu-600 underline underline-offset-4">
                  Mettre en favori
                </button>
                <button type="button" onClick={() => ejecutar(() => quitarLinea({ id: l.id }))} className="text-sm font-semibold text-[#9a2f2f] underline underline-offset-4">
                  Retirer
                </button>
              </div>
              <p className="mt-2 text-sm text-marine" aria-live="polite">
                {l.estado === 'ok' && (
                  <>
                    {formatoEuros(l.precioUnitarioHt ?? 0)} HT × {l.cantidad} = <strong>{formatoEuros(l.totalHt ?? 0)} HT</strong>
                  </>
                )}
                {l.estado === 'sin-precio' && <span className="font-medium text-[#9a2f2f]">Prix sur demande : cette ligne ne peut pas être commandée en ligne.</span>}
                {l.estado === 'lote-minimo' && <span className="font-medium text-[#9a2f2f]">Lot minimum : {l.minimo}. Augmentez la quantité.</span>}
              </p>
            </div>
          </li>
        ))}
      </ul>
      <aside className="h-fit rounded-2xl bg-perle p-5 shadow-carte ring-1 ring-marine/5" aria-label="Récapitulatif">
        <h3 className="font-display text-xl font-extrabold text-marine">Récapitulatif</h3>
        <dl className="mt-4 space-y-2 text-sm text-marine">
          <div className="flex justify-between">
            <dt>Sous-total HT</dt>
            <dd>{formatoEuros(totales.subtotalHt)}</dd>
          </div>
          <div className="flex justify-between">
            <dt>TVA ({totales.tasaIva.toLocaleString('fr-FR')} %)</dt>
            <dd>{formatoEuros(totales.importeIva)}</dd>
          </div>
          <div className="flex justify-between border-t border-marine/10 pt-2 text-base font-extrabold">
            <dt>Total TTC</dt>
            <dd>{formatoEuros(totales.totalTtc)}</dd>
          </div>
        </dl>
        {error && (
          <p role="alert" className="mt-3 text-sm font-medium text-[#9a2f2f]">
            {error}
          </p>
        )}
        <Boton variante="principal" tamano="grande" className="mt-5 w-full" disabled={pendiente || !totales.completo} onClick={() => ejecutar(() => finalizarPedido())}>
          Valider la commande
        </Boton>
        {!totales.completo && <p className="mt-2 text-xs text-ardoise">Toutes les lignes doivent avoir un prix et respecter leur lot minimum.</p>}
      </aside>
    </div>
  );
}
