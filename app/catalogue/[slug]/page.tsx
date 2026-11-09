import type { Metadata } from 'next';
import Link from 'next/link';
import { notFound } from 'next/navigation';
import { CombinaCon } from '@/components/ficha/CombinaCon';
import Ficha from '@/components/ficha/Ficha';
import { PRODUCTOS, colorPorDefecto, getProducto, textoPrecio } from '@/data/catalogo';
import { NOMBRE_CATEGORIA, colorDeLaFoto, descripcionSeo, fotosDe, fotosPorColor, textoMaterial, tituloSeo } from '@/lib/catalogo';
import { SITE } from '@/lib/site';

// Ruta completamente estática: los 30 slugs se generan en el build y cualquier otro devuelve 404.
export const ensureStatic = 'navigation';

export function generateStaticParams() {
  return PRODUCTOS.map((p) => ({ slug: p.slug }));
}

export async function generateMetadata({ params }: PageProps<'/catalogue/[slug]'>): Promise<Metadata> {
  const { slug } = await params;
  const producto = getProducto(slug);
  if (!producto) return { title: 'Producto no encontrado' };
  return {
    title: tituloSeo(producto),
    description: descripcionSeo(producto),
    alternates: { canonical: `/catalogue/${producto.slug}` },
    // Fase 9: imagen Open Graph propia por producto (1200 × 630, scripts/marca/generar-og.py), con la foto del
    // color predeterminado sobre tarjeta clara y el precio «desde».
    openGraph: {
      title: `${tituloSeo(producto)} · [MARCA]`,
      description: descripcionSeo(producto),
      images: [{ url: `/og/productos/${producto.slug}.png`, width: 1200, height: 630, alt: `${producto.tipo} ${producto.nombre}` }],
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

  // Datos estructurados: producto (sin oferta: los precios son «desde», sin IVA) y migas de pan (sección 10).
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
      url: `${SITE.url}/catalogo/${producto.slug}`,
    },
    {
      '@context': 'https://schema.org',
      '@type': 'BreadcrumbList',
      itemListElement: [
        { '@type': 'ListItem', position: 1, name: 'Catálogo', item: `${SITE.url}/catalogo` },
        { '@type': 'ListItem', position: 2, name: categoria, item: `${SITE.url}/catalogo?categoria=${producto.categoria}` },
        { '@type': 'ListItem', position: 3, name: producto.nombre, item: `${SITE.url}/catalogo/${producto.slug}` },
      ],
    },
  ];

  return (
    <article className="mx-auto w-full max-w-6xl px-4 pt-24 pb-28 sm:px-6 lg:px-8 lg:pt-32 lg:pb-16">
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd).replace(/</g, '\\u003c') }} />
      <nav aria-label="Migas de pan" className="mb-6 text-sm text-ardoise">
        <ol className="flex flex-wrap items-center gap-1.5">
          <li>
            <Link href="/catalogue" className="hover:text-marine">
              Catálogo
            </Link>
          </li>
          <li aria-hidden="true">›</li>
          <li>
            <Link href={`/catalogue?categoria=${producto.categoria}`} className="hover:text-marine">
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
