import type { Metadata } from 'next';
import { IconoWhatsApp } from '@/components/layout/Iconos';
import { BotonEnlace, ESTILO_BOTON } from '@/components/ui/Botones';
import { SITE, TEXTOS, enlaceWhatsApp } from '@/lib/site';
import { MENSAJE_WHATSAPP_PROYECTO_ENVIADO } from '@/lib/whatsapp';

// Page de confirmation après l'envoi d'une demande (/projet ou /devis) : elle sert à mesurer les conversions et n'est
// pas indexée. Aucune promesse de délai : le délai de réponse vient de TEXTOS (à confirmer).
export const metadata: Metadata = {
  title: 'Demande bien reçue',
  description: 'Votre demande est bien arrivée à l’atelier La Ola Import.',
  robots: { index: false, follow: false },
};

const PASOS = [
  { titulo: 'Nous étudions votre demande', texto: 'S’il nous manque une information, nous vous écrivons par le moyen que vous avez choisi.' },
  { titulo: 'Nous vous envoyons un devis', texto: `Un devis sur mesure, par email. ${TEXTOS.plazoPresupuesto}.` },
  { titulo: TEXTOS.datosCatalogo[1], texto: 'Nous vous montrons un aperçu de votre personnalisation avant de lancer l’impression.' },
];

export default function Merci() {
  return (
    <section className="mx-auto w-full max-w-4xl px-4 pt-28 pb-16 sm:px-6 lg:px-8 lg:pt-36">
      <p className="mb-3 text-xs font-semibold tracking-[0.2em] text-violet-600 uppercase">C’est envoyé</p>
      <h1 className="font-display text-4xl font-extrabold tracking-tight text-marine sm:text-5xl">Merci ! Votre demande est bien arrivée à l’atelier.</h1>
      <p className="mt-4 max-w-2xl text-lg text-ardoise">
        Un email de confirmation vient de partir. Vous ne le voyez pas d’ici quelques minutes ? Regardez dans vos courriers indésirables ou écrivez-nous sur WhatsApp.
      </p>

      <h2 className="mt-12 font-display text-2xl font-bold text-marine">Et maintenant ?</h2>
      <ol className="mt-5 grid gap-4 sm:grid-cols-3">
        {PASOS.map((p, i) => (
          <li key={p.titulo} className="rounded-2xl bg-fond p-6 shadow-carte ring-1 ring-marine/5">
            <span className="flex h-8 w-8 items-center justify-center rounded-full bg-fuchsia-50 text-sm font-bold text-marine">{i + 1}</span>
            <p className="mt-4 font-display text-lg font-bold text-marine">{p.titulo}</p>
            <p className="mt-2 text-sm text-ardoise">{p.texto}</p>
          </li>
        ))}
      </ol>

      <div className="mt-10 flex flex-wrap gap-3">
        <a href={enlaceWhatsApp(MENSAJE_WHATSAPP_PROYECTO_ENVIADO)} target="_blank" rel="noopener noreferrer" className={`${ESTILO_BOTON.principal} px-6 py-3 text-base`}>
          <IconoWhatsApp className="h-4 w-4" />
          Écrire sur WhatsApp
        </a>
        <BotonEnlace href="/catalogue" variante="secundario" tamano="grande">
          Retour au catalogue
        </BotonEnlace>
      </div>
      <p className="mt-6 max-w-2xl text-sm text-ardoise">
        Vous pouvez aussi nous écrire à{' '}
        <a href={`mailto:${SITE.email}`} className="text-bleu-600 underline underline-offset-4 hover:text-indigo-700">
          {SITE.email}
        </a>
        .
      </p>
    </section>
  );
}
