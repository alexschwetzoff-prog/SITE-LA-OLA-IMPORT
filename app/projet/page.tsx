import type { Metadata } from 'next';
import Proyecto, { type DatosProducto } from '@/components/proyecto/Proyecto';
import { PRODUCTOS } from '@/data/catalogo';
import { fotosDe, textoPrecio } from '@/lib/catalogo';

export const metadata: Metadata = {
  title: 'Mon projet : panier et demande',
  description: 'Retrouvez votre panier et envoyez votre demande à l’atelier La Ola Import, à Monteux : textiles et objets personnalisés avec votre logo.',
  robots: { index: false, follow: true },
  alternates: { canonical: '/projet' },
};

// La cesta y el diseño del estudio viven en el navegador: la página es estática, el formulario llega prerenderizado
// (sin saltos de maqueta) y la cesta se monta al hidratar. El envío pasa por acciones.ts (compartida con /devis).
export default function PaginaProyecto() {
  const productos = Object.fromEntries(PRODUCTOS.map((p) => [p.slug, { tipo: p.tipo, foto: fotosDe(p)?.delante, precio: textoPrecio(p) } satisfies DatosProducto]));
  return <Proyecto productos={productos} />;
}
