import Link from 'next/link';
import { BotonEnlace, Flecha } from '@/components/ui/Botones';
import Vague from '@/components/ui/Vague';
import { CATEGORIAS } from '@/data/categorias';
import { PRODUCTOS_ACTIVOS, conteoPorCategoria, fotosDe } from '@/lib/catalogo';
import { srcDeAncho } from '@/lib/fotos';
import { CTA, SITE, TEXTOS } from '@/lib/site';

// Premier écran : accroche courte FUSIONNÉE avec la grille des catégories, pour que l'offre soit visible tout de suite
// (pas de grand visuel qui la repousse). L'élément LCP est le titre texte ; seules les deux premières vignettes sont
// chargées en priorité.

function vignette(categoria: string): { src: string; alt: string } | null {
  const p = PRODUCTOS_ACTIVOS.find((x) => x.categoria === categoria && x.destacado) ?? PRODUCTOS_ACTIVOS.find((x) => x.categoria === categoria);
  const f = p ? fotosDe(p) : undefined;
  if (!p || !f) return null;
  return { src: srcDeAncho(f.delante, 800, f.anchos), alt: `${p.nombre}, ${p.tipo.toLowerCase()}` };
}

export default function Accroche() {
  const conteo = conteoPorCategoria();
  return (
    <section className="relative bg-perle pt-24 lg:pt-28">
      <div className="mx-auto w-full max-w-7xl px-4 sm:px-6 lg:px-8">
        <div className="grid gap-6 lg:grid-cols-[1fr_auto] lg:items-end">
          <div className="max-w-2xl">
            <p className="text-sm font-bold tracking-wide text-violet-600 uppercase">Atelier de personnalisation à Monteux</p>
            <h1 className="mt-2 font-display text-4xl leading-[1.05] font-extrabold tracking-tight text-marine sm:text-5xl lg:text-6xl">
              {SITE.lema}
            </h1>
            <p className="mt-3 text-lg text-ardoise">
              Textiles, objets publicitaires et souvenirs à vos couleurs, imprimés dans notre atelier du Vaucluse. Pour votre
              entreprise, votre club, votre camping, votre boutique… ou pour vous.
            </p>
          </div>
          <div className="flex flex-wrap gap-3">
            <BotonEnlace href={CTA.href} tamano="grande">
              {CTA.etiqueta}
            </BotonEnlace>
            <BotonEnlace href="/catalogue" variante="secundario" tamano="grande">
              Voir le catalogue
              <Flecha />
            </BotonEnlace>
          </div>
        </div>

        <ul className="mt-8 grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-5" aria-label="Catégories du catalogue">
          {CATEGORIAS.map((c, i) => {
            const v = vignette(c.id);
            return (
              <li key={c.id}>
                <Link
                  href={`/catalogue?categoria=${c.id}`}
                  className="carte-produit group flex h-full flex-col overflow-hidden rounded-2xl bg-white shadow-carte ring-1 ring-marine/5"
                >
                  <span className="block aspect-square overflow-hidden bg-white">
                    {v && (
                      // Photos produit hors next/image (BASE-TECNICA : pas de seconde compression), en WebP 800 px.
                      // eslint-disable-next-line @next/next/no-img-element
                      <img
                        src={v.src}
                        alt=""
                        width={800}
                        height={800}
                        loading={i < 2 ? 'eager' : 'lazy'}
                        fetchPriority={i < 2 ? 'high' : undefined}
                        decoding="async"
                        sizes="(min-width: 1024px) 18vw, (min-width: 640px) 30vw, 46vw"
                        className="h-full w-full object-contain p-2 transition-transform duration-300 group-hover:scale-[1.03] motion-reduce:transition-none"
                      />
                    )}
                  </span>
                  <span className="flex items-baseline justify-between gap-2 px-3 py-3">
                    <span className="font-display text-base font-extrabold text-marine">{c.nombre}</span>
                    <span className="text-xs text-ardoise">{conteo[c.id]}</span>
                  </span>
                </Link>
              </li>
            );
          })}
        </ul>

        <ul className="mt-6 flex flex-wrap gap-x-6 gap-y-2 pb-10 text-sm text-marine" aria-label="Nos engagements">
          {TEXTOS.datosCatalogo.map((t) => (
            <li key={t} className="flex items-center gap-2">
              <span aria-hidden="true" className="h-2 w-2 rounded-full bg-cyan-400" />
              {t}
            </li>
          ))}
        </ul>
      </div>
      <Vague couleur="var(--color-fond)" degrade className="h-12 w-full" />
    </section>
  );
}
