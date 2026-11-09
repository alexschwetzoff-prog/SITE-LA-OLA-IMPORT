import PhotoAFournir from '@/components/ui/PhotoAFournir';
import type { Membre } from '@/data/equipe';

/** Fiche d'une personne de l'équipe : photo réelle (4:5), prénom, rôle, spécialité et phrase. */
export default function CarteMembre({ membre, detail = false }: { membre: Membre; detail?: boolean }) {
  return (
    <article className="flex h-full flex-col overflow-hidden rounded-2xl bg-white shadow-carte ring-1 ring-marine/5">
      {membre.photo ? (
        // Photo réelle de l'équipe, 800 × 1000.
        // eslint-disable-next-line @next/next/no-img-element
        <img src={membre.photo} alt={`${membre.prenom}, ${membre.role.toLowerCase()} chez La Ola Import`} width={800} height={1000} loading="lazy" className="aspect-[4/5] w-full object-cover" />
      ) : (
        <PhotoAFournir sujet={`${membre.prenom} à l’atelier`} dimensions="800 × 1000 (4:5)" ratio="4 / 5" className="rounded-none border-0 border-b-2" />
      )}
      <div className="p-5">
        <h3 className="font-display text-xl font-extrabold text-marine">{membre.prenom}</h3>
        <p className="text-sm font-semibold text-violet-600">{membre.role}</p>
        {detail && <p className="mt-2 text-sm text-ardoise">{membre.specialite}</p>}
        {detail && <p className="mt-3 text-marine italic">« {membre.phrase} »</p>}
      </div>
    </article>
  );
}
