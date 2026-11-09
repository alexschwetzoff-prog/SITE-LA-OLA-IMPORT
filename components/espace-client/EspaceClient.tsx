'use client';

import Link from 'next/link';
import { IconoWhatsApp } from '@/components/layout/Iconos';
import { usePresupuesto } from '@/lib/presupuesto';
import { SITE, enlaceTelefono, enlaceWhatsApp } from '@/lib/site';

/** « Mon projet » : résumé du panier local et accès direct à l'atelier. Aucune donnée ne quitte l'appareil ici. */
export default function EspaceClient() {
  const items = usePresupuesto();
  const n = items.length;
  return (
    <div className="mt-8 grid gap-6 lg:grid-cols-2">
      <section className="rounded-2xl bg-white p-6 shadow-carte ring-1 ring-marine/5" aria-labelledby="mon-projet">
        <h2 id="mon-projet" className="font-display text-2xl font-extrabold text-marine">Mon projet</h2>
        {n > 0 ? (
          <>
            <p className="mt-2 text-ardoise">
              Votre panier contient {n} {n === 1 ? 'produit' : 'produits'}. Vous pouvez le compléter, puis nous l’envoyer pour recevoir votre devis.
            </p>
            <ul className="mt-4 space-y-1 text-marine">
              {items.slice(0, 5).map((it, i) => (
                <li key={it.id ?? i}>· {it.nombre} · {it.color.nombre}</li>
              ))}
              {n > 5 && <li className="text-ardoise">… et {n - 5} autres</li>}
            </ul>
            <Link href="/projet" className="mt-6 inline-flex min-h-11 items-center rounded-full bg-fuchsia-700 px-5 font-semibold text-white hover:bg-fuchsia-800">
              Voir mon panier et envoyer ma demande
            </Link>
          </>
        ) : (
          <>
            <p className="mt-2 text-ardoise">Votre panier est vide pour l’instant.</p>
            <div className="mt-6 flex flex-wrap gap-3">
              <Link href="/catalogue" className="inline-flex min-h-11 items-center rounded-full border-2 border-violet-600 px-5 font-semibold text-violet-600 hover:bg-violet-600/8">
                Parcourir le catalogue
              </Link>
              <Link href="/devis" className="inline-flex min-h-11 items-center rounded-full bg-fuchsia-700 px-5 font-semibold text-white hover:bg-fuchsia-800">
                Demander un devis
              </Link>
            </div>
          </>
        )}
        <p className="mt-6 text-xs text-ardoise">Le panier est gardé dans ce navigateur, sur cet appareil. Il n’est envoyé à l’atelier que lorsque vous validez votre demande.</p>
      </section>

      <section className="rounded-2xl bg-perle p-6 ring-1 ring-marine/5" aria-labelledby="commande">
        <h2 id="commande" className="font-display text-2xl font-extrabold text-marine">Une question sur votre commande ?</h2>
        <p className="mt-2 text-ardoise">Le suivi en ligne arrive bientôt. En attendant, l’atelier vous répond directement.</p>
        <div className="mt-6 flex flex-wrap gap-3">
          <a href={enlaceWhatsApp()} target="_blank" rel="noopener noreferrer" className="inline-flex min-h-11 items-center gap-2 rounded-full border-2 border-marine/80 px-5 font-semibold text-marine hover:bg-marine/5">
            <IconoWhatsApp className="h-5 w-5" />
            WhatsApp
          </a>
          <a href={enlaceTelefono(SITE.telefonos[0])} className="inline-flex min-h-11 items-center rounded-full border-2 border-marine/80 px-5 font-semibold text-marine hover:bg-marine/5">
            Appeler l’atelier
          </a>
          <a href={`mailto:${SITE.email}`} className="inline-flex min-h-11 items-center rounded-full px-2 font-semibold text-bleu-600 underline underline-offset-4">
            {SITE.email}
          </a>
        </div>
      </section>
    </div>
  );
}
