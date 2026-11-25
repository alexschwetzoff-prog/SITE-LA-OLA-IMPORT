import Link from 'next/link';
import { FAMILLES_PERSONNALISABLES } from '@/data/personnalisables';
import { PRODUCTOS_ACTIVOS, fotosDe, sePersonaliza } from '@/lib/catalogo';
import { srcDeAncho } from '@/lib/fotos';

/**
 * Premier écran : les produits PERSONNALISABLES regroupés par famille (vêtements, casquettes, gourdes, couteaux, tote bags,
 * accessoires). Une famille à un seul produit mène à sa fiche ; sinon à l'onglet correspondant de /boutique. Famille
 * sans produit : carte « Bientôt » qui renvoie vers le contact (rien n'est inventé).
 */
export default function Personnalisables() {
  return (
    <ul className="mt-8 grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-6" aria-label="Produits personnalisables">
      {FAMILLES_PERSONNALISABLES.map((f, i) => {
        const productos = PRODUCTOS_ACTIVOS.filter((p) => sePersonaliza(p) && f.garde(p));
        const phare = productos.find((p) => p.destacado) ?? productos[0];
        const fotos = phare ? fotosDe(phare) : undefined;
        const href = productos.length === 0 ? '/contact' : productos.length === 1 ? `/catalogue/${productos[0].slug}` : `/boutique?cat=${f.onglet}`;
        return (
          <li key={f.id}>
            <Link href={href} className="carte-produit group flex h-full flex-col overflow-hidden rounded-2xl bg-white shadow-carte ring-1 ring-marine/5">
              <span className="block aspect-square overflow-hidden bg-white">
                {fotos ? (
                  // Photos produit hors next/image (BASE-TECNICA : pas de seconde compression).
                  // eslint-disable-next-line @next/next/no-img-element
                  <img
                    src={srcDeAncho(fotos.delante, 800, fotos.anchos)}
                    alt=""
                    width={800}
                    height={800}
                    loading={i < 2 ? 'eager' : 'lazy'}
                    fetchPriority={i < 2 ? 'high' : undefined}
                    decoding="async"
                    sizes="(min-width: 1024px) 16vw, (min-width: 640px) 30vw, 46vw"
                    className="h-full w-full object-contain p-2 transition-transform duration-300 group-hover:scale-[1.03] motion-reduce:transition-none"
                  />
                ) : (
                  <span className="flex h-full items-center justify-center bg-perle p-3 text-center text-sm font-semibold text-ardoise">Bientôt</span>
                )}
              </span>
              <span className="flex flex-1 flex-col gap-0.5 px-3 py-3">
                <span className="font-display text-base font-extrabold text-marine">{f.nom}</span>
                <span className="text-xs text-ardoise">{productos.length === 0 ? 'Bientôt disponible : consultez-nous.' : f.texte}</span>
              </span>
            </Link>
          </li>
        );
      })}
    </ul>
  );
}
