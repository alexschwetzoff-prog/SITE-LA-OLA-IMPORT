'use client';

import { useState } from 'react';
import Link from 'next/link';
import { Boton } from '@/components/ui/Botones';
import { loteMinimo } from '@/lib/carrito/calculo';
import type { ProductoLigero } from '@/lib/cuenta/catalogo-cuenta';
import { useCuenta } from './almacen';
import BloquePrecio from './BloquePrecio';

/** Favoritos de la cuenta (o de este navegador si aún no hay cuenta validada), con la variante guardada. */
export default function ListaFavoritos({ productos }: { productos: Record<string, ProductoLigero> }) {
  const estado = useCuenta((s) => s.estado);
  const favoritos = useCuenta((s) => s.favoritos);
  const precios = useCuenta((s) => s.precios);
  const alternar = useCuenta((s) => s.alternarFavorito);
  const anadir = useCuenta((s) => s.anadir);
  const [mensajes, setMensajes] = useState<Record<string, string>>({});

  if (estado === 'cargando') return <p className="text-ardoise">Chargement…</p>;
  const lista = favoritos.filter((f) => productos[f.producto_slug]);
  return (
    <div>
      {estado !== 'validada' && (
        <p className="mb-6 max-w-3xl rounded-2xl bg-fuchsia-50 px-5 py-4 text-sm text-marine">
          Vos favoris sont gardés sur cet appareil. Dès que votre compte professionnel est validé, ils sont enregistrés dans votre compte.
        </p>
      )}
      {lista.length === 0 ? (
        <p className="text-ardoise">
          Aucun favori pour l’instant. Touchez le cœur d’un produit dans la{' '}
          <Link href="/boutique" className="font-semibold text-bleu-600 underline underline-offset-4">
            boutique
          </Link>{' '}
          pour le retrouver ici.
        </p>
      ) : (
        <ul className="grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
          {lista.map((f) => {
            const p = productos[f.producto_slug];
            const clave = `${f.producto_slug}|${f.variante}`;
            const foto = (f.variante && p.fotoPorVariante[f.variante]) || p.foto;
            return (
              <li key={clave} className="flex flex-col overflow-hidden rounded-2xl bg-white shadow-carte ring-1 ring-marine/5">
                <Link href={`/catalogue/${p.slug}`} className="block aspect-square bg-white">
                  {foto && (
                    // eslint-disable-next-line @next/next/no-img-element
                    <img src={foto} alt={`${p.nombre}${f.variante ? `, ${f.variante.toLowerCase()}` : ''}`} loading="lazy" className="h-full w-full object-contain p-3" />
                  )}
                </Link>
                <div className="flex flex-1 flex-col gap-2 p-4">
                  <h3 className="font-display text-lg font-extrabold text-marine">{p.nombre}</h3>
                  <p className="text-sm text-ardoise">
                    {p.tipo}
                    {f.variante ? ` · ${f.variante}` : ''}
                  </p>
                  <BloquePrecio slug={p.slug} variante={f.variante || undefined} compacto />
                  <div className="mt-auto flex flex-wrap gap-2 pt-2">
                    {p.requiereTalla ? (
                      <Link href={`/catalogue/${p.slug}`} className="inline-flex min-h-10 items-center rounded-full bg-fuchsia-700 px-4 text-sm font-semibold text-white hover:bg-fuchsia-800">
                        Choisir la taille
                      </Link>
                    ) : (
                      <Boton
                        variante="principal"
                        disabled={estado !== 'validada'}
                        onClick={async () => {
                          const r = await anadir({ slug: p.slug, nombre: p.nombre, variante: f.variante, talla: '', cantidad: Math.max(1, loteMinimo(precios, p.slug, f.variante)) });
                          setMensajes((m) => ({ ...m, [clave]: r.ok ? 'Ajouté au panier.' : 'Impossible d’ajouter.' }));
                        }}
                      >
                        Ajouter au panier
                      </Boton>
                    )}
                    <Boton variante="claro" onClick={() => void alternar(p.slug, f.variante)}>
                      Retirer
                    </Boton>
                  </div>
                  <p role="status" aria-live="polite" className="min-h-5 text-sm text-marine">
                    {mensajes[clave]}
                  </p>
                </div>
              </li>
            );
          })}
        </ul>
      )}
    </div>
  );
}
