import type { Metadata } from 'next';
import { Suspense } from 'react';
import { notFound } from 'next/navigation';
import Estudio from '@/components/estudio/Estudio';
import { CON_ESTUDIO, getProducto } from '@/data/catalogo';
import { fotosDe } from '@/lib/catalogo';
import { claveDeArchivo } from '@/lib/estudio/siluetas';

// Ruta completamente estática: solo los slugs con estudio (Atomic 150 y Austral) se generan en el build;
// cualquier otro devuelve 404. Dentro del estudio se puede cambiar de prenda sin salir de la página.
export const ensureStatic = 'navigation';

export function generateStaticParams() {
  return CON_ESTUDIO.map((p) => ({ slug: p.slug }));
}

export async function generateMetadata({ params }: PageProps<'/personnaliser/[slug]'>): Promise<Metadata> {
  const { slug } = await params;
  const producto = getProducto(slug);
  if (!producto) return { title: 'Produit introuvable' };
  return {
    title: `Personnalisez votre ${producto.nombre} avec votre logo`,
    description: `Studio de personnalisation : choisissez la couleur de votre ${producto.nombre} (${producto.tipo.toLowerCase()}), déposez votre logo et placez-le devant ou derrière. Puis ajoutez-le au panier pour recevoir votre devis.`,
    alternates: { canonical: `/personnaliser/${producto.slug}` },
    openGraph: { images: [{ url: `/og/productos/${producto.slug}.png`, width: 1200, height: 630, alt: `${producto.tipo} ${producto.nombre} à personnaliser` }] },
  };
}

/**
 * Pour chaque produit du studio, la clé de fichier photo de chaque couleur (« atomic-150-blanco ») : le studio retrouve
 * ainsi la bonne photo détourée même si les noms de couleur affichés sont traduits. Calculé ici, côté serveur, pour ne
 * pas charger l'index des photos du catalogue dans le navigateur.
 */
function clavesFotoEstudio(): Record<string, Record<string, string>> {
  return Object.fromEntries(
    CON_ESTUDIO.map((p) => [p.slug, Object.fromEntries(p.colores.flatMap((c) => {
      const clave = claveDeArchivo(fotosDe(p, c)?.delante);
      return clave ? [[c.nombre, clave]] : [];
    }))]),
  );
}

// El acceso a params va dentro de Suspense para que la navegación sea instantánea (cacheComponents).
async function Contenido({ params }: { params: PageProps<'/personnaliser/[slug]'>['params'] }) {
  const { slug } = await params;
  const producto = getProducto(slug);
  if (!producto || producto.visor === 'ninguno') notFound();
  return <Estudio productos={CON_ESTUDIO} slugInicial={producto.slug} clavesFoto={clavesFotoEstudio()} />;
}

export default function PaginaEstudio({ params }: PageProps<'/personnaliser/[slug]'>) {
  return (
    <Suspense fallback={<section className="mx-auto w-full max-w-7xl px-4 pt-20 lg:px-8 lg:pt-28" aria-busy="true" />}>
      <Contenido params={params} />
    </Suspense>
  );
}
