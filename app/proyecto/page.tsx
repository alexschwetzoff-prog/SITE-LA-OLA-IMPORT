import type { Metadata } from 'next';
import Proyecto, { type DatosProducto } from '@/components/proyecto/Proyecto';
import { PRODUCTOS } from '@/data/catalogo';
import { fotosDe, textoPrecio } from '@/lib/catalogo';

export const metadata: Metadata = {
  title: 'Cuéntanos tu proyecto',
  description: 'Pide presupuesto para personalizar textil y merchandising con tu logo. Te respondemos en 24 h laborables.',
  alternates: { canonical: '/proyecto' },
};

// La cesta y el diseño del estudio viven en el navegador: la página es estática, el formulario llega prerenderizado
// (sin saltos de maqueta) y la cesta se monta al hidratar. Desde la fase 6 el envío es real (acciones.ts).
export default function PaginaProyecto() {
  const productos = Object.fromEntries(PRODUCTOS.map((p) => [p.slug, { tipo: p.tipo, foto: fotosDe(p)?.delante, precio: textoPrecio(p) } satisfies DatosProducto]));
  return <Proyecto productos={productos} />;
}
