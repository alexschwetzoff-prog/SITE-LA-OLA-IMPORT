import type { Metadata } from 'next';
import Link from 'next/link';
import { notFound } from 'next/navigation';
import { CombinaCon } from '@/components/ficha/CombinaCon';
import Ficha from '@/components/ficha/Ficha';
import { PRODUCTOS, colorPorDefecto, getProducto, textoPrecio } from '@/data/catalogo';
import { NOMBRE_CATEGORIA, colorDeLaFoto, descripcionSeo, fotosDe, fotosPorColor, textoMaterial, tituloSeo } from '@/lib/catalogo';
import { SITE } from '@/lib/site';

// Route entièrement statique : les 30 slugs sont générés au build, tout autre renvoie une 404.
export const ensureStatic = 'navigation';

export function generateStaticParams() {
  return PRODUCTOS.map((p) => ({ slug: p.slug }));
}

export async function generateMetadata({ params }: PageProps<'/catalogue/[slug]'>): Promise<Metadata> {
  const { slug } = await params;
  const producto = getProducto(slug);
  if (!producto) return { title: 'Produit introuvable' };
  return {
    title: tituloSeo(producto),
    description: descripcionSeo(producto),
    alternates: { canonical: `/catalogue/${producto.slug}` },
    // Image Open Graph : celle du site (la vague du logo) tant qu'il n'existe pas d'image par produit
    // (public/og/productos/ n'existe pas : à générer avec la nouvelle identité).
    openGraph: {
      title: `${tituloSeo(producto)} · ${SITE.nombre}`,
      description: descripcionSeo(producto),
      images: [{ url: '/og/marca.png', width: 1200, height: 630, alt: `La vague de ${SITE.nombre}` }],
    },
  };
}

export default async function PaginaFicha({ params }: PageProps<'/catalogue/[slug]'>) {
  const { slug } = await params;
  const producto = getProducto(slug);
  if (!producto) notFound();
  const categoria = NOMBRE_CATEGORIA[producto.categoria];
  const foto = fotosDe(producto, colorPorDefecto(producto));
  const precio = textoPrecio(producto);

  // Données structurées : produit (sans offre : prix sur devis) et fil d'Ariane.
  const jsonLd = [
    {
      '@context': 'https://schema.org',
      '@type': 'Product',
      name: `${producto.nombre} · ${producto.tipo}`,
      description: descripcionSeo(producto),
      image: foto ? `${SITE.url}${foto.delante}` : undefined,
      material: textoMaterial(producto),
      color: producto.colores.map((c) => c.nombre).join(', '),
      brand: { '@type': 'Brand', name: SITE.nombre },
      url: `${SITE.url}/catalogue/${producto.slug}`,
    },
    {
      '@context': 'https://schema.org',
      '@type': 'BreadcrumbList',
      itemListElement: [
        { '@type': 'ListItem', position: 1, name: 'Catalogue', item: `${SITE.url}/catalogue` },
        { '@type': 'ListItem', position: 2, name: categoria, item: `${SITE.url}/catalogue?categoria=${producto.categoria}` },
        { '@type': 'ListItem', position: 3, name: producto.nombre, item: `${SITE.url}/catalogue/${producto.slug}` },
      ],
    },
  ];

  return (
    <article className="mx-auto w-full max-w-6xl px-4 pt-24 pb-28 sm:px-6 lg:px-8 lg:pt-32 lg:pb-16">
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd).replace(/</g, '\\u003c') }} />
      <nav aria-label="Fil d’Ariane" className="mb-6 text-sm text-ardoise">
        <ol className="flex flex-wrap items-center gap-1.5">
          <li>
            <Link href="/catalogue" className="underline-offset-4 hover:text-marine hover:underline">
              Catalogue
            </Link>
          </li>
          <li aria-hidden="true">›</li>
          <li>
            <Link href={`/catalogue?categoria=${producto.categoria}`} className="underline-offset-4 hover:text-marine hover:underline">
              {categoria}
            </Link>
          </li>
          <li aria-hidden="true">›</li>
          <li aria-current="page" className="text-marine">
            {producto.nombre}
          </li>
        </ol>
      </nav>
      <p className="sr-only">
        {producto.nombre}: {precio}
      </p>
      <Ficha producto={producto} fotosPorColor={fotosPorColor(producto)} colorBase={colorDeLaFoto(producto)?.nombre} />
      <CombinaCon producto={producto} />
    </article>
  );
}
