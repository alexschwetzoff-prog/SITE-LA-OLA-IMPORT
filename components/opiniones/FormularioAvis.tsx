'use client';

import { useActionState, useEffect, useId, useRef, useState } from 'react';
import Link from 'next/link';
import { envoyerAvis } from '@/app/donner-mon-avis/acciones';
import { IconoWhatsApp } from '@/components/layout/Iconos';
import { ESTILO_BOTON } from '@/components/ui/Botones';
import { MAX_CARACTERES, NOMBRE_ANONIMO } from '@/lib/opiniones/opiniones';
import { CAMPO_INICIO, CAMPO_TRAMPA } from '@/lib/solicitud/comun';
import { SITE, enlaceWhatsApp } from '@/lib/site';

// Formulaire d'avis client. Trois consentements distincts et jamais pré-cochés : publication de l'avis, affichage du
// prénom, affichage de la structure. Sans accord d'affichage, l'avis est signé « Client de La Ola Import ».
// Tous les champs sont contrôlés : React réinitialise les champs non contrôlés après une action de formulaire, et la
// saisie doit survivre à une erreur.

const campo =
  'mt-1 w-full rounded-xl border border-marine/20 bg-white px-3.5 py-2.5 text-marine placeholder:text-ardoise/70 focus:border-bleu-600 focus:outline-none focus:ring-2 focus:ring-bleu-600/40 aria-[invalid=true]:border-fuchsia-800';
const etiqueta = 'block text-sm font-semibold text-marine';
const caseACocher = 'mt-0.5 h-5 w-5 shrink-0 rounded border-marine/30 accent-violet-600';

export function FormularioAvis() {
  const id = useId();
  const [etat, envoyer, enCours] = useActionState(envoyerAvis, { estado: 'inicial' });
  const [prenom, setPrenom] = useState('');
  const [email, setEmail] = useState('');
  const [produit, setProduit] = useState('');
  const [privacidad, setPrivacidad] = useState(false);
  const [publier, setPublier] = useState(false);
  const [afficherPrenom, setAfficherPrenom] = useState(false);
  const [afficherStructure, setAfficherStructure] = useState(false);
  const [structure, setStructure] = useState('');
  const [avis, setAvis] = useState('');
  const inicioRef = useRef(0);
  const messageRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    // Heure de chargement du formulaire, pour l'antispam (envoi trop rapide = robot).
    inicioRef.current = Date.now();
  }, []);

  useEffect(() => {
    if (etat.estado !== 'inicial') messageRef.current?.focus();
  }, [etat]);

  if (etat.estado === 'ok') {
    return (
      <div ref={messageRef} tabIndex={-1} role="status" className="mt-8 max-w-2xl rounded-2xl bg-perle p-6 shadow-carte focus:outline-none sm:p-8">
        <p className="font-display text-2xl font-bold text-marine">Merci ! Votre avis est bien arrivé à l’atelier.</p>
        <p className="mt-3 text-ardoise">
          {publier
            ? 'Nous le publierons tel quel, selon les choix que vous avez faits. Vous pouvez nous demander de le retirer à tout moment.'
            : 'Vous n’avez pas souhaité qu’il soit publié : il restera entre nous, et il nous aide déjà beaucoup.'}
        </p>
        <Link href="/avis" className={`${ESTILO_BOTON.enlace} mt-4`}>
          Voir les avis
        </Link>
      </div>
    );
  }

  const erreurs = etat.estado === 'error' ? (etat.campos ?? {}) : {};
  const erreur = (nom: string) =>
    erreurs[nom] ? (
      <p id={`${id}-${nom}-erreur`} className="mt-1 text-sm font-medium text-fuchsia-800">
        {erreurs[nom]}
      </p>
    ) : null;
  const aria = (nom: string) => (erreurs[nom] ? { 'aria-invalid': true, 'aria-describedby': `${id}-${nom}-erreur` } : {});

  const signature = [afficherPrenom ? prenom.trim() || 'votre prénom' : '', afficherStructure ? structure.trim() : ''].filter(Boolean).join(', ');
  const texteWhatsApp = `Bonjour, voici mon avis sur ma commande chez ${SITE.nombre} :\n\n${avis.trim()}`;

  return (
    <form
      action={(fd) => {
        fd.set(CAMPO_INICIO, String(inicioRef.current));
        envoyer(fd);
      }}
      className="mt-8 max-w-2xl space-y-6" noValidate>
      {/* Champ piège : invisible pour les personnes ; un robot qui le remplit n'envoie rien. */}
      <div aria-hidden="true" className="sr-only">
        <label>
          Ne remplissez pas ce champ
          <input type="text" name={CAMPO_TRAMPA} tabIndex={-1} autoComplete="off" defaultValue="" />
        </label>
      </div>

      <div className="grid gap-5 sm:grid-cols-2">
        <div>
          <label htmlFor={`${id}-prenom`} className={etiqueta}>
            Prénom <span aria-hidden="true">*</span>
          </label>
          <input id={`${id}-prenom`} name="prenom" required autoComplete="given-name" maxLength={60} className={campo} value={prenom} onChange={(e) => setPrenom(e.target.value)} {...aria('prenom')} />
          {erreur('prenom')}
        </div>
        <div>
          <label htmlFor={`${id}-structure`} className={etiqueta}>
            Votre structure <span className="font-normal text-ardoise">(facultatif)</span>
          </label>
          <input
            id={`${id}-structure`}
            name="structure"
            autoComplete="organization"
            maxLength={120}
            placeholder="Club, camping, boutique, entreprise…"
            className={campo}
            value={structure}
            onChange={(e) => setStructure(e.target.value)}
            {...aria('structure')}
          />
          {erreur('structure')}
        </div>
        <div>
          <label htmlFor={`${id}-email`} className={etiqueta}>
            Email <span aria-hidden="true">*</span>
          </label>
          <input id={`${id}-email`} name="email" type="email" required autoComplete="email" maxLength={200} className={campo} value={email} onChange={(e) => setEmail(e.target.value)} aria-invalid={erreurs.email ? true : undefined} aria-describedby={`${id}-email-aide${erreurs.email ? ` ${id}-email-erreur` : ''}`} />
          <p id={`${id}-email-aide`} className="mt-1 text-sm text-ardoise">
            Jamais publié : il nous sert seulement à vous répondre.
          </p>
          {erreur('email')}
        </div>
        <div>
          <label htmlFor={`${id}-produit`} className={etiqueta}>
            Produit commandé <span className="font-normal text-ardoise">(facultatif)</span>
          </label>
          <input id={`${id}-produit`} name="produit" maxLength={200} placeholder="T-shirts du club, mugs…" className={campo} value={produit} onChange={(e) => setProduit(e.target.value)} {...aria('produit')} />
          {erreur('produit')}
        </div>
      </div>

      <div>
        <label htmlFor={`${id}-avis`} className={etiqueta}>
          Votre avis <span aria-hidden="true">*</span>
        </label>
        <textarea
          id={`${id}-avis`}
          name="avis"
          required
          rows={6}
          maxLength={MAX_CARACTERES}
          className={campo}
          value={avis}
          onChange={(e) => setAvis(e.target.value)}
          placeholder="La qualité, le conseil, l’accueil à l’atelier…"
          aria-invalid={erreurs.avis ? true : undefined}
          aria-describedby={`${id}-avis-compteur${erreurs.avis ? ` ${id}-avis-erreur` : ''}`}
        />
        <p id={`${id}-avis-compteur`} className="mt-1 text-sm text-ardoise">
          {avis.length} / {MAX_CARACTERES} caractères
        </p>
        {erreur('avis')}
      </div>

      <fieldset className="space-y-4 rounded-2xl bg-perle p-5 sm:p-6">
        <legend className="sr-only">Publication de votre avis</legend>
        <p className="font-display text-lg font-bold text-marine">Publication : c’est vous qui décidez</p>
        <label className="flex gap-3 text-marine">
          <input
            type="checkbox"
            name="publier"
            className={caseACocher}
            checked={publier}
            onChange={(e) => {
              setPublier(e.target.checked);
              if (!e.target.checked) {
                setAfficherPrenom(false);
                setAfficherStructure(false);
              }
            }}
          />
          <span>J’accepte que {SITE.nombre} publie mon avis sur son site, sans le modifier.</span>
        </label>
        <label className={`flex gap-3 ${publier ? 'text-marine' : 'text-ardoise'}`}>
          <input type="checkbox" name="afficher_prenom" className={caseACocher} checked={afficherPrenom} disabled={!publier} onChange={(e) => setAfficherPrenom(e.target.checked)} />
          <span>J’accepte que mon prénom soit affiché avec mon avis.</span>
        </label>
        <label className={`flex gap-3 ${publier && structure.trim() ? 'text-marine' : 'text-ardoise'}`}>
          <input
            type="checkbox"
            name="afficher_structure"
            className={caseACocher}
            checked={afficherStructure}
            disabled={!publier || !structure.trim()}
            onChange={(e) => setAfficherStructure(e.target.checked)}
          />
          <span>J’accepte que le nom de ma structure soit affiché avec mon avis.</span>
        </label>
        <p className="text-sm text-ardoise" aria-live="polite">
          {publier
            ? `Votre avis sera signé : « ${signature || NOMBRE_ANONIMO} ».`
            : 'Sans cette première case, votre avis ne sera pas publié : il restera entre nous.'}
        </p>
      </fieldset>

      <div>
        <label className="flex gap-3 text-marine">
          <input type="checkbox" name="privacidad" required className={caseACocher} checked={privacidad} onChange={(e) => setPrivacidad(e.target.checked)} {...aria('privacidad')} />
          <span>
            J’accepte que {SITE.nombre} utilise ces informations pour traiter mon avis.{' '}
            <Link href="/confidentialite" className="font-semibold text-bleu-600 underline underline-offset-4 hover:text-indigo-700">
              Politique de confidentialité
            </Link>{' '}
            <span aria-hidden="true">*</span>
          </span>
        </label>
        {erreur('privacidad')}
      </div>

      <div ref={messageRef} tabIndex={-1} aria-live="assertive" className="focus:outline-none">
        {etat.estado === 'error' && (
          <div role="alert" className="rounded-2xl border border-fuchsia-800/40 bg-fuchsia-50 p-4 text-marine">
            <p className="font-semibold">{etat.mensaje}</p>
            {etat.campos && (
              <ul className="mt-2 list-disc pl-5 text-sm">
                {Object.values(etat.campos).map((m) => (
                  <li key={m}>{m}</li>
                ))}
              </ul>
            )}
          </div>
        )}
      </div>

      <div className="flex flex-wrap items-center gap-3">
        <button type="submit" disabled={enCours} className={`${ESTILO_BOTON.principal} px-6 py-3 text-base`}>
          {enCours ? 'Envoi en cours…' : 'Envoyer mon avis'}
        </button>
        {etat.estado === 'error' && !etat.campos && (
          <a href={enlaceWhatsApp(texteWhatsApp)} target="_blank" rel="noopener noreferrer" className={ESTILO_BOTON.secundario}>
            <IconoWhatsApp className="h-4 w-4" />
            Envoyer sur WhatsApp <span className="sr-only">(nouvel onglet)</span>
          </a>
        )}
      </div>
      <p className="text-sm text-ardoise">
        <span aria-hidden="true">*</span> Champs obligatoires.
      </p>
    </form>
  );
}
