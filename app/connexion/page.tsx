import type { Metadata } from 'next';
import { Suspense } from 'react';
import { FormularioLogin } from '@/components/cuenta/Formularios';
import { Pagina } from '@/components/ui/Pagina';
import { rutaInternaSegura } from '@/lib/cuenta/esquema';

export const metadata: Metadata = { title: 'Connexion', description: 'Connexion à votre espace client professionnel La Ola Import.', robots: { index: false, follow: true }, alternates: { canonical: '/connexion' } };

async function Contenido({ searchParams }: { searchParams: Promise<Record<string, string | string[] | undefined>> }) {
  const sp = await searchParams;
  const siguiente = rutaInternaSegura(typeof sp.siguiente === 'string' ? sp.siguiente : undefined, '');
  return (
    <>
      {sp.error === 'enlace' && (
        <p role="alert" className="mb-4 max-w-md rounded-xl bg-[#fbeaea] px-4 py-3 text-sm font-medium text-[#7a2020]">
          Ce lien n’est plus valable. Connectez-vous ou demandez un nouveau lien.
        </p>
      )}
      <FormularioLogin siguiente={siguiente || undefined} />
    </>
  );
}

export default function PaginaConexion({ searchParams }: { searchParams: Promise<Record<string, string | string[] | undefined>> }) {
  return (
    <Pagina titulo="Connexion" intro="Espace réservé aux professionnels : prix, favoris et panier.">
      <div className="mt-8 max-w-md">
        <Suspense fallback={<p className="text-ardoise">Chargement…</p>}>
          <Contenido searchParams={searchParams} />
        </Suspense>
      </div>
    </Pagina>
  );
}
