import ListaFavoritos from '@/components/cuenta/ListaFavoritos';
import { productosLigeros } from '@/lib/cuenta/catalogo-cuenta';
import { exigirSesion } from '@/lib/cuenta/sesion';

export default async function PaginaFavoritos() {
  await exigirSesion('/compte/favoris');
  return (
    <div>
      <h2 className="font-display text-2xl font-extrabold text-marine">Favoris</h2>
      <p className="mt-1 mb-6 text-ardoise">Les produits que vous avez aimés, avec la variante choisie.</p>
      <ListaFavoritos productos={productosLigeros()} />
    </div>
  );
}
