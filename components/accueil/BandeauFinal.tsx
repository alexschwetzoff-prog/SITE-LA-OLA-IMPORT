import Link from 'next/link';
import { IconoWhatsApp } from '@/components/layout/Iconos';
import { CTA, SITE, enlaceTelefono, enlaceWhatsApp } from '@/lib/site';

/** Dernier appel à l'action avant le pied de page : devis, WhatsApp ou téléphone, selon la préférence de chacun. */
export default function BandeauFinal() {
  return (
    <section className="px-4 py-14 sm:px-6 lg:px-8">
      <div className="degrade-ola mx-auto max-w-6xl rounded-3xl p-[3px]">
        <div className="flex flex-col gap-6 rounded-[calc(1.5rem-3px)] bg-white px-6 py-10 sm:px-10 lg:flex-row lg:items-center lg:justify-between">
          <div>
            <h2 className="font-display text-3xl font-extrabold text-marine sm:text-4xl">Un projet ? On en parle.</h2>
            <p className="mt-2 text-lg text-ardoise">Dites-nous ce que vous imaginez : l’équipe de l’atelier vous répond avec une proposition claire.</p>
          </div>
          <div className="flex flex-wrap gap-3">
            <Link href={CTA.href} className="inline-flex min-h-12 items-center rounded-full bg-fuchsia-700 px-6 text-base font-semibold text-white shadow-md shadow-fuchsia-700/25 hover:bg-fuchsia-800">
              {CTA.etiqueta}
            </Link>
            <a
              href={enlaceWhatsApp()}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex min-h-12 items-center gap-2 rounded-full border-2 border-marine/80 px-5 text-base font-semibold text-marine hover:bg-marine/5"
            >
              <IconoWhatsApp className="h-5 w-5" />
              WhatsApp
            </a>
            <a href={enlaceTelefono(SITE.telefonos[0])} className="inline-flex min-h-12 items-center rounded-full border-2 border-marine/80 px-5 text-base font-semibold text-marine hover:bg-marine/5">
              Appeler l’atelier
            </a>
          </div>
        </div>
      </div>
    </section>
  );
}
