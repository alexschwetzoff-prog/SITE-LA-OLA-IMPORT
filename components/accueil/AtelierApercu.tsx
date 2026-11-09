import { BotonEnlace, Flecha } from '@/components/ui/Botones';
import PhotoAFournir from '@/components/ui/PhotoAFournir';
import { Seccion } from '@/components/ui/Seccion';
import { ETAPES } from '@/data/equipe';

/** « Comment nous travaillons » en bref : les étapes et une vidéo B-roll de l'atelier (réelle, à fournir). */
export default function AtelierApercu() {
  return (
    <Seccion id="comment-nous-travaillons" etiqueta="Comment nous travaillons" titulo="Votre idée, notre atelier, votre pièce.">
      <div className="mt-8 grid gap-8 lg:grid-cols-2 lg:items-center">
        <ol className="space-y-4">
          {ETAPES.slice(0, 4).map((e, i) => (
            <li key={e.titre} className="flex gap-4">
              <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-marine font-display text-lg font-extrabold text-white">
                {i + 1}
              </span>
              <span>
                <span className="block font-display text-lg font-extrabold text-marine">{e.titre}</span>
                <span className="block text-ardoise">{e.texte}</span>
              </span>
            </li>
          ))}
        </ol>
        <PhotoAFournir type="vidéo" sujet="B-roll muet en boucle : la machine DTF en action à l’atelier" dimensions="1920 × 1080 et 1080 × 1350, 8 à 12 s, < 2 Mo" ratio="16 / 10" />
      </div>
      <div className="mt-8">
        <BotonEnlace href="/comment-nous-travaillons" variante="secundario">
          Découvrir notre atelier
          <Flecha />
        </BotonEnlace>
      </div>
    </Seccion>
  );
}
