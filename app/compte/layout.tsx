import type { Metadata } from 'next';
import { Suspense } from 'react';
import { exigirSesion } from '@/lib/cuenta/sesion';
import NavegacionCuenta from '@/components/cuenta/NavegacionCuenta';

export const metadata: Metadata = { title: 'Mon compte', robots: { index: false, follow: false } };

async function Cabecera() {
  const s = await exigirSesion('/compte');
  return (
    <>
      <p className="mt-3 text-lg text-ardoise">{s.perfil.razon_social || s.email}</p>
      {s.perfil.estado === 'pendiente' && (
        <p role="status" className="mt-4 max-w-3xl rounded-2xl bg-fuchsia-50 px-5 py-4 text-marine">
          <strong className="font-display font-extrabold">Votre compte est en cours de revue.</strong> Nous vérifions votre inscription. Tant qu’il n’est pas validé, les prix, le
          panier et les favoris enregistrés restent fermés.
        </p>
      )}
      {s.perfil.estado === 'rechazada' && (
        <p role="alert" className="mt-4 max-w-3xl rounded-2xl bg-[#fbeaea] px-5 py-4 text-[#7a2020]">
          <strong className="font-display font-extrabold">Votre inscription n’a pas été retenue.</strong>
          {s.perfil.motivo_rechazo ? ` ${s.perfil.motivo_rechazo}` : ''} Écrivez-nous si vous pensez qu’il s’agit d’une erreur.
        </p>
      )}
    </>
  );
}

// Todo el espacio cliente se lee con la sesión: no hay HTML estático ni caché compartida. La sesión se exige detrás de <Suspense>
// (requisito de Cache Components) y se vuelve a exigir en cada página y acción; el proxy solo adelanta la redirección.
export default function LayoutCuenta({ children }: { children: React.ReactNode }) {
  return (
    <section className="mx-auto w-full max-w-6xl px-4 pt-28 pb-16 sm:px-6 lg:px-8 lg:pt-32">
      <h1 className="font-display text-4xl font-extrabold tracking-tight text-marine sm:text-5xl">Mon compte</h1>
      <Suspense fallback={<p className="mt-3 text-ardoise">Chargement…</p>}>
        <Cabecera />
      </Suspense>
      <NavegacionCuenta />
      <div className="mt-8">
        <Suspense fallback={<p className="text-ardoise">Chargement…</p>}>{children}</Suspense>
      </div>
    </section>
  );
}
