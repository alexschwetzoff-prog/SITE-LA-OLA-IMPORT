import type { Metadata } from 'next';
import { Suspense } from 'react';
import AccionesAdmin from '@/components/cuenta/AccionesAdmin';
import { Pagina } from '@/components/ui/Pagina';
import { formatearSiret } from '@/lib/cuenta/siret';
import { exigirAdmin, type Perfil } from '@/lib/cuenta/sesion';
import { crearClienteServidor } from '@/lib/supabase/servidor';

export const metadata: Metadata = { title: 'Administration', robots: { index: false, follow: false } };

function Ficha({ p }: { p: Perfil }) {
  return (
    <li className="rounded-2xl bg-white p-5 shadow-carte ring-1 ring-marine/5">
      <div className="flex flex-wrap items-baseline justify-between gap-2">
        <h3 className="font-display text-lg font-extrabold text-marine">{p.razon_social || '(sans nom)'}</h3>
        <span className="rounded-full bg-perle px-3 py-1 text-xs font-semibold text-marine">{p.estado}</span>
      </div>
      <dl className="mt-2 grid gap-x-6 gap-y-1 text-sm text-marine sm:grid-cols-2">
        <div><dt className="inline text-ardoise">SIRET : </dt><dd className="inline">{formatearSiret(p.siret) || '—'}</dd></div>
        <div><dt className="inline text-ardoise">TVA : </dt><dd className="inline">{p.numero_tva ?? '—'}</dd></div>
        <div><dt className="inline text-ardoise">Contact : </dt><dd className="inline">{p.nombre_contacto} {p.apellidos_contacto}</dd></div>
        <div><dt className="inline text-ardoise">Email : </dt><dd className="inline">{p.email}</dd></div>
        <div><dt className="inline text-ardoise">Téléphone : </dt><dd className="inline">{p.telefono ?? '—'}</dd></div>
        <div><dt className="inline text-ardoise">Activité : </dt><dd className="inline">{p.sector ?? '—'}</dd></div>
        <div className="sm:col-span-2"><dt className="inline text-ardoise">Adresse : </dt><dd className="inline">{p.direccion_facturacion}, {p.codigo_postal} {p.ciudad}</dd></div>
      </dl>
      <AccionesAdmin id={p.id} estado={p.estado} />
    </li>
  );
}

async function Cuentas() {
  await exigirAdmin();
  const supabase = await crearClienteServidor();
  const { data } = await supabase.from('perfiles').select('*').eq('rol', 'cliente').order('creado_en', { ascending: false });
  const cuentas = (data ?? []) as Perfil[];
  const pendientes = cuentas.filter((c) => c.estado === 'pendiente');
  const otras = cuentas.filter((c) => c.estado !== 'pendiente');
  return (
    <>
      <h2 className="mt-8 font-display text-2xl font-extrabold text-marine">Comptes en attente ({pendientes.length})</h2>
      {pendientes.length ? <ul className="mt-4 space-y-4">{pendientes.map((p) => <Ficha key={p.id} p={p} />)}</ul> : <p className="mt-3 text-ardoise">Aucun compte en attente.</p>}
      <h2 className="mt-10 font-display text-2xl font-extrabold text-marine">Autres comptes ({otras.length})</h2>
      {otras.length ? <ul className="mt-4 space-y-4">{otras.map((p) => <Ficha key={p.id} p={p} />)}</ul> : <p className="mt-3 text-ardoise">Aucun autre compte.</p>}
    </>
  );
}

export default function PaginaAdmin() {
  return (
    <Pagina titulo="Administration" intro="Comptes professionnels : validez ou rejetez les inscriptions.">
      <Suspense fallback={<p className="mt-8 text-ardoise">Chargement…</p>}>
        <Cuentas />
      </Suspense>
    </Pagina>
  );
}
