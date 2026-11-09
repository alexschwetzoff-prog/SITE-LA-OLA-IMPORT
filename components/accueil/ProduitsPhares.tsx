import { TarjetaProducto } from '@/components/catalogo/TarjetaProducto';
import { BotonEnlace, Flecha } from '@/components/ui/Botones';
import { Seccion } from '@/components/ui/Seccion';
import { DESTACADOS } from '@/data/catalogo';
import { datosTarjeta } from '@/lib/catalogo';

/** Les produits phares, juste sous la grille des catégories : raccourci direct vers les fiches. */
export default function ProduitsPhares() {
  return (
    <Seccion id="incontournables" etiqueta="Produits phares" titulo="Nos incontournables" intro="Les pièces qu’on nous demande le plus. Tous les prix sont sur devis : chaque projet est différent.">
      <ul className="mt-8 grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
        {DESTACADOS.slice(0, 6).map((p) => (
          <li key={p.slug}>
            <TarjetaProducto datos={datosTarjeta(p)} sizes="(min-width: 1024px) 30vw, (min-width: 640px) 45vw, 92vw" />
          </li>
        ))}
      </ul>
      <div className="mt-8">
        <BotonEnlace href="/catalogue" variante="secundario">
          Tout le catalogue
          <Flecha />
        </BotonEnlace>
      </div>
    </Seccion>
  );
}
