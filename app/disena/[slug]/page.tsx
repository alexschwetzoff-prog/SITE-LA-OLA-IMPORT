import type { Metadata } from 'next';
import { Suspense } from 'react';
import { notFound } from 'next/navigation';
import Estudio from '@/components/estudio/Estudio';
import { CON_ESTUDIO, getProducto } from '@/data/catalogo';

// Ruta completamente estática: solo los slugs con estudio (Atomic 150 y Austral) se generan en el build;
// cualquier otro devuelve 404. Dentro del estudio se puede cambiar de prenda sin salir de la página.
export const ensureStatic = 'navigation';

export function generateStaticParams() {
  return CON_ESTUDIO.map((p) => ({ slug: p.slug }));
}

export async function generateMetadata({ params }: PageProps<'/disena/[slug]'>): Promise<Metadata> {
  const { slug } = await params;
  const producto = getProducto(slug);
  if (!producto) return { title: 'Producto no encontrado' };
  return {
    title: `Diseña tu ${producto.nombre} con tu logo`,
    description: `Pon tu logo a la ${producto.tipo.toLowerCase()} ${producto.nombre}: elige el color, sube tu logo y colócalo delante o detrás. Presupuesto en 24 h laborables.`,
    alternates: { canonical: `/disena/${producto.slug}` },
    openGraph: { images: [{ url: `/og/productos/${producto.slug}.png`, width: 1200, height: 630, alt: `${producto.tipo} ${producto.nombre}` }] },
  };
}

// El acceso a params va dentro de Suspense para que la navegación sea instantánea (cacheComponents).
async function Contenido({ params }: { params: PageProps<'/disena/[slug]'>['params'] }) {
  const { slug } = await params;
  const producto = getProducto(slug);
  if (!producto || producto.visor === 'ninguno') notFound();
  return <Estudio productos={CON_ESTUDIO} slugInicial={producto.slug} />;
}

export default function PaginaEstudio({ params }: PageProps<'/disena/[slug]'>) {
  return (
    <Suspense fallback={<section className="mx-auto w-full max-w-7xl px-4 pt-20 lg:px-8 lg:pt-28" aria-busy="true" />}>
      <Contenido params={params} />
    </Suspense>
  );
}
