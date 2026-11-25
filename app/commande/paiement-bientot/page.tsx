import type { Metadata } from 'next';
import { Suspense } from 'react';
import Link from 'next/link';
import { Pagina } from '@/components/ui/Pagina';
import { formatoEuros } from '@/lib/carrito/calculo';
import { exigirSesion } from '@/lib/cuenta/sesion';
import { crearClienteServidor } from '@/lib/supabase/servidor';

export const metadata: Metadata = { title: 'Paiement bientôt disponible', robots: { index: false, follow: false } };

async function Contenido({ searchParams }: { searchParams: Promise<Record<string, string | string[] | undefined>> }) {
  const sp = await searchParams;
  const numero = typeof sp.numero === 'string' ? sp.numero : '';
  await exigirSesion('/commande/paiement-bientot');
  const supabase = await crearClienteServidor();
  const { data: pedido } = numero ? await supabase.from('pedidos').select('numero, estado, total_ttc').eq('numero', numero).maybeSingle() : { data: null };
  return (
    <div className="mt-8 max-w-2xl rounded-2xl bg-white p-6 shadow-carte ring-1 ring-marine/5">
      <h2 className="font-display text-2xl font-extrabold text-marine">Votre commande est enregistrée</h2>
      {pedido ? (
        <p className="mt-2 text-marine">
          Commande <strong>{pedido.numero}</strong> · total {formatoEuros(Number(pedido.total_ttc))} TTC · statut : en attente de paiement.
        </p>
      ) : (
        <p className="mt-2 text-ardoise">Nous n’avons pas retrouvé cette commande.</p>
      )}
      <p className="mt-3 text-ardoise">Le paiement en ligne sera disponible très bientôt. Vous retrouvez votre commande dans votre compte.</p>
      <p className="mt-5">
        <Link href="/compte/commandes" className="font-semibold text-bleu-600 underline underline-offset-4">
          Voir mes commandes
        </Link>
      </p>
    </div>
  );
}

export default function PaginaPagoProximamente({ searchParams }: { searchParams: Promise<Record<string, string | string[] | undefined>> }) {
  return (
    <Pagina titulo="Paiement bientôt disponible">
      <Suspense fallback={<p className="mt-8 text-ardoise">Chargement…</p>}>
        <Contenido searchParams={searchParams} />
      </Suspense>
    </Pagina>
  );
}
