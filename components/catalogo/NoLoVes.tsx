import { IconoWhatsApp } from '@/components/layout/Iconos';
import { BotonEnlace, ESTILO_BOTON } from '@/components/ui/Botones';
import { CTA, enlaceWhatsApp } from '@/lib/site';

/** Bloc de fin de catalogue : l'article cherché n'y est pas ? On en parle (devis ou WhatsApp). Sans promesse. */
export function NoLoVes() {
  return (
    <div className="mt-16 rounded-2xl bg-perle p-6 shadow-carte ring-1 ring-marine/5 sm:p-8">
      <h2 className="font-display text-2xl font-extrabold text-marine sm:text-3xl">Vous ne trouvez pas votre article ?</h2>
      <p className="mt-3 max-w-2xl text-lg text-ardoise">
        Dites-nous ce que vous avez en tête : nous regardons avec vous ce qu’il est possible de personnaliser.
      </p>
      <div className="mt-6 flex flex-wrap gap-3">
        <BotonEnlace href={CTA.href}>{CTA.etiqueta}</BotonEnlace>
        <a href={enlaceWhatsApp()} target="_blank" rel="noopener noreferrer" className={ESTILO_BOTON.secundario}>
          <IconoWhatsApp className="h-4 w-4" />
          Écrire sur WhatsApp
          <span className="sr-only"> (nouvel onglet)</span>
        </a>
      </div>
    </div>
  );
}
