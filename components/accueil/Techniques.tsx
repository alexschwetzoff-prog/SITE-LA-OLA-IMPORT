import { BotonEnlace, Flecha } from '@/components/ui/Botones';
import { Seccion } from '@/components/ui/Seccion';
import { CTA } from '@/lib/site';

// Techniques de l'atelier (textes validés par le client : UV, DTF et sublimation, flocage avec machine DTF, gravure sur
// bois, aluminium et métal ; plastique déconseillé). Aucun délai, prix ni minimum.
const TECHNIQUES = [
  {
    titre: 'Impression UV',
    texte: 'Notre machine UV imprime directement sur l’objet, sans transfert, pour des couleurs nettes et des détails précis.',
    icone: <path d="M12 3v3M12 18v3M3 12h3M18 12h3M5.6 5.6l2.1 2.1M16.3 16.3l2.1 2.1M18.4 5.6l-2.1 2.1M7.7 16.3l-2.1 2.1M12 8a4 4 0 100 8 4 4 0 000-8z" />,
  },
  {
    titre: 'DTF et sublimation',
    texte: 'Le DTF imprime votre visuel sur un film puis le transfère sur le textile. La sublimation fixe l’encre par la chaleur sur les supports adaptés.',
    icone: <path d="M4 7h16v10H4zM4 11h16M9 7v10" />,
  },
  {
    titre: 'Flocage',
    texte: 'Un rendu velouté et en relief sur vos textiles, réalisé avec notre machine DTF.',
    icone: <path d="M12 3c3 3 6 5 6 9a6 6 0 01-12 0c0-4 3-6 6-9zM12 21v-6" />,
  },
  {
    titre: 'Gravure',
    texte: 'Gravure sur tout type d’objet en bois, en aluminium ou en métal. Le plastique est déconseillé.',
    icone: <path d="M4 20l4-1 11-11-3-3L5 16l-1 4zM14 7l3 3" />,
  },
];

export default function Techniques() {
  return (
    <Seccion
      id="techniques"
      etiqueta="Ce que nous faisons"
      titulo="Nos techniques de personnalisation"
      intro="Impression UV, DTF et sublimation, flocage, gravure : nous choisissons avec vous la technique qui convient à votre objet et à votre visuel."
      fond="perle"
    >
      <ul className="mt-8 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        {TECHNIQUES.map((t) => (
          <li key={t.titre} className="flex flex-col rounded-2xl bg-white p-5 shadow-carte ring-1 ring-marine/5">
            <span aria-hidden="true" className="flex h-11 w-11 items-center justify-center rounded-full bg-fuchsia-50 text-violet-600">
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" className="h-6 w-6">
                {t.icone}
              </svg>
            </span>
            <h3 className="mt-4 font-display text-xl font-extrabold text-marine">{t.titre}</h3>
            <p className="mt-2 text-sm leading-relaxed text-ardoise">{t.texte}</p>
          </li>
        ))}
      </ul>
      <div className="mt-8 flex flex-wrap items-center gap-4">
        <BotonEnlace href={CTA.href}>
          {CTA.etiqueta}
          <Flecha />
        </BotonEnlace>
        <p className="text-sm text-ardoise">Un doute sur la technique ? Décrivez-nous votre projet, nous vous conseillons.</p>
      </div>
    </Seccion>
  );
}
