import { Seccion } from '@/components/ui/Seccion';
import { SITE, adresseComplete, enlaceTelefono } from '@/lib/site';

/** Coordonnées de l'atelier : téléphone, e-mail, adresse (Google Maps) et raison sociale, toutes cliquables. */
export default function Contact({ titre = 'Parlons de votre projet', fond = 'blanc' }: { titre?: string; fond?: 'blanc' | 'perle' | 'bleu' }) {
  const tel = SITE.telefonos[0];
  const cartes = [
    { libelle: 'Téléphone', valeur: tel, href: enlaceTelefono(tel), externe: false },
    { libelle: 'E-mail', valeur: SITE.email, href: `mailto:${SITE.email}`, externe: false },
    { libelle: 'Atelier', valeur: adresseComplete(), href: SITE.direccion.mapaUrl, externe: true },
  ];
  return (
    <Seccion id="contact" etiqueta="Contact" titulo={titre} fond={fond}>
      <ul className="mt-8 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        {cartes.map((c) => (
          <li key={c.libelle} className="rounded-2xl bg-white p-5 shadow-carte ring-1 ring-marine/5">
            <p className="text-sm font-bold tracking-wide text-violet-600 uppercase">{c.libelle}</p>
            <a
              href={c.href}
              {...(c.externe ? { target: '_blank', rel: 'noopener noreferrer' } : {})}
              className="mt-1.5 block text-lg font-semibold break-words text-bleu-600 underline underline-offset-4 hover:text-indigo-700"
            >
              {c.valeur}
            </a>
            {c.externe && <span className="mt-1 block text-xs text-ardoise">Ouvrir dans Google Maps</span>}
          </li>
        ))}
        <li className="rounded-2xl bg-white p-5 shadow-carte ring-1 ring-marine/5">
          <p className="text-sm font-bold tracking-wide text-violet-600 uppercase">Société</p>
          <p className="mt-1.5 text-lg font-semibold text-marine">{SITE.titular.nombre}</p>
          <p className="text-sm text-ardoise">Nom commercial : {SITE.nombre}</p>
        </li>
      </ul>
      <p className="mt-6 text-ardoise">Horaires : {SITE.horario}</p>
    </Seccion>
  );
}
