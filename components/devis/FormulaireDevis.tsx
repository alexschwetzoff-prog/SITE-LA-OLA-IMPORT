'use client';

// Formulaire de devis B2B en 4 étapes (projet, logo, délai, coordonnées), distinct du panier : l'acheteur
// professionnel a une quantité, une échéance et un logo, pas un panier. Même moteur que /projet (action serveur
// enviarSolicitud, validation zod côté serveur, antispam sans service tiers, 4 Mo de fichiers au maximum). La saisie
// reste dans le formulaire entre les étapes ; en cas d'échec, rien n'est perdu et WhatsApp est proposé.

import { useEffect, useId, useRef, useState, useTransition, type FormEvent } from 'react';
import Link from 'next/link';
import { useRouter, useSearchParams } from 'next/navigation';
import { enviarSolicitud } from '@/app/projet/acciones';
import { IconoWhatsApp } from '@/components/layout/Iconos';
import { CATEGORIAS } from '@/data/categorias';
import { CAMPO_INICIO, CAMPO_TRAMPA, CLAVE_ARCHIVOS, CLAVE_AVISOS, CLAVE_CESTA, CONTACTOS, TECNICAS, TIPOS, esProfesional, type TipoCliente } from '@/lib/solicitud/comun';
import { prepararEnvio } from '@/lib/solicitud/preparar';
import { SEGMENTS, enlaceWhatsApp } from '@/lib/site';

const ETAPES = ['Votre projet', 'Votre logo', 'Votre délai', 'Vos coordonnées'] as const;

const SEGMENT_VERS_TYPE: Record<string, TipoCliente> = {
  'clubs-sportifs': 'club',
  campings: 'camping',
  'boutiques-souvenirs': 'boutique',
  entreprises: 'entreprise',
};

const champ =
  'mt-1 block min-h-12 w-full rounded-xl border border-marine/20 bg-white px-3.5 py-2.5 text-base text-marine placeholder:text-ardoise/80 focus:border-bleu-600 focus:outline-none focus-visible:ring-2 focus-visible:ring-bleu-600/40';
const libelle = 'block text-sm font-semibold text-marine';
const puce =
  'cursor-pointer rounded-full border border-marine/20 px-4 py-2 text-sm text-marine transition-colors has-[:checked]:border-marine has-[:checked]:bg-marine has-[:checked]:text-white has-[:focus-visible]:ring-2 has-[:focus-visible]:ring-bleu-600';

export default function FormulaireDevis({ produits }: { produits: { slug: string; nom: string }[] }) {
  const id = useId();
  const router = useRouter();
  const params = useSearchParams();
  const formRef = useRef<HTMLFormElement>(null);
  const titreRef = useRef<HTMLHeadingElement>(null);
  const [etape, setEtape] = useState(0);
  const [debut] = useState(() => Date.now());
  const [tipo, setTipo] = useState<TipoCliente>(() => SEGMENT_VERS_TYPE[params.get('segment') ?? ''] ?? 'entreprise');
  const [sansLogo, setSansLogo] = useState(false);
  const [erreur, setErreur] = useState<string | null>(null);
  const [erreursChamps, setErreursChamps] = useState<{ campo: string; mensaje: string }[]>([]);
  const [envoi, demarrer] = useTransition();

  const produitInitial = produits.find((p) => p.slug === params.get('produit'));
  const segment = SEGMENTS.find((s) => s.slug === params.get('segment'));

  // Le titre de l'étape reçoit le focus à chaque changement (lecteurs d'écran, clavier).
  useEffect(() => {
    if (etape > 0) titreRef.current?.focus();
  }, [etape]);

  /** Valide les champs requis de l'étape visible avec la validation native du navigateur. */
  const etapeValide = () => {
    const zone = formRef.current?.querySelector<HTMLElement>(`[data-etape="${etape}"]`);
    const champs = Array.from(zone?.querySelectorAll<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>('input, select, textarea') ?? []);
    for (const c of champs) {
      if (!c.checkValidity()) {
        c.reportValidity();
        return false;
      }
    }
    return true;
  };

  const suivant = () => {
    if (etapeValide()) setEtape((e) => Math.min(e + 1, ETAPES.length - 1));
  };

  const envoyer = (e: FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    if (!etapeValide()) return;
    setErreur(null);
    setErreursChamps([]);
    const fd = new FormData(e.currentTarget);
    demarrer(async () => {
      fd.set('formulario', 'devis');
      fd.set(CAMPO_INICIO, String(debut));
      const fichiers = fd.getAll(CLAVE_ARCHIVOS).filter((f): f is File => f instanceof File && f.size > 0);
      fd.delete(CLAVE_ARCHIVOS);
      const prepare = await prepararEnvio([], fichiers);
      if ('error' in prepare) {
        setErreur(prepare.error);
        setEtape(1);
        return;
      }
      fd.set(CLAVE_CESTA, JSON.stringify(prepare.lineas));
      fd.set(CLAVE_AVISOS, JSON.stringify(prepare.avisos));
      for (const a of prepare.archivos) fd.append(a.clave, a.archivo, a.archivo.name);
      try {
        const resultat = await enviarSolicitud(fd);
        if (resultat.ok) {
          router.push('/merci');
          return;
        }
        setErreur(resultat.mensaje);
        setErreursChamps(resultat.campos ?? []);
      } catch {
        setErreur('Oups, votre demande n’est pas partie. Rien n’est perdu : vos informations sont conservées. Réessayez dans un instant ou envoyez-la-nous sur WhatsApp.');
      }
    });
  };

  const pro = esProfesional(tipo);

  return (
    <form ref={formRef} onSubmit={envoyer} className="mt-8 grid gap-8 lg:grid-cols-[1fr_280px]" aria-describedby={`${id}-aide`}>
      <div className="rounded-2xl bg-white p-5 shadow-carte ring-1 ring-marine/5 sm:p-8">
        {/* Progression */}
        <p id={`${id}-aide`} className="text-sm font-semibold text-violet-600">
          Étape {etape + 1} sur {ETAPES.length}
        </p>
        <ol className="mt-2 grid grid-cols-4 gap-1.5" aria-hidden="true">
          {ETAPES.map((nom, i) => (
            <li key={nom} className={`h-1.5 rounded-full ${i <= etape ? 'degrade-ola' : 'bg-marine/10'}`} />
          ))}
        </ol>
        <h2 ref={titreRef} tabIndex={-1} className="mt-4 font-display text-2xl font-extrabold text-marine outline-none">
          {ETAPES[etape]}
        </h2>

        {/* Champ piège anti-robots, invisible pour les humains */}
        <div aria-hidden="true" className="absolute -left-[9999px] h-px w-px overflow-hidden">
          <label>
            Ne pas remplir
            <input type="text" name={CAMPO_TRAMPA} tabIndex={-1} autoComplete="off" defaultValue="" />
          </label>
        </div>

        {/* Étape 1 : le projet */}
        <fieldset data-etape={0} hidden={etape !== 0} className="mt-6 space-y-5">
          <legend className="sr-only">Votre projet</legend>
          <label className={libelle}>
            Type de produit
            <select name="tipo_producto" className={champ}>
              <option value="">Je ne sais pas encore</option>
              {CATEGORIAS.map((c) => (
                <option key={c.id} value={c.nombre}>{c.nombre}</option>
              ))}
              <option value="Souvenirs">Souvenirs</option>
              <option value="Autre">Autre</option>
            </select>
          </label>
          <label className={libelle}>
            Produit précis <span className="font-normal text-ardoise">(facultatif)</span>
            <input name="otro_producto" type="text" className={champ} defaultValue={produitInitial?.nom ?? ''} placeholder="Ex. : t-shirt Atomic 150, gourde, casquette…" list={`${id}-produits`} />
            <datalist id={`${id}-produits`}>
              {produits.map((p) => (
                <option key={p.slug} value={p.nom} />
              ))}
            </datalist>
          </label>
          <label className={libelle}>
            Quantité souhaitée
            <input name="cantidad" type="number" inputMode="numeric" min={1} step={1} required className={`${champ} max-w-48`} placeholder="Ex. : 50" />
          </label>
          <fieldset>
            <legend className={libelle}>Technique</legend>
            <div className="mt-2 flex flex-wrap gap-2">
              {TECNICAS.map((t) => (
                <label key={t.id} className={puce}>
                  <input type="radio" name="tecnica" value={t.id} defaultChecked={t.id === 'conseil'} className="sr-only" />
                  {t.nombre}
                </label>
              ))}
            </div>
          </fieldset>
          <label className={libelle}>
            Emplacements <span className="font-normal text-ardoise">(facultatif)</span>
            <input name="emplazamientos" type="text" className={champ} placeholder="Ex. : cœur devant, grand logo au dos" />
          </label>
        </fieldset>

        {/* Étape 2 : le logo */}
        <fieldset data-etape={1} hidden={etape !== 1} className="mt-6 space-y-5">
          <legend className="sr-only">Votre logo</legend>
          <label className={libelle}>
            Votre logo ou visuel
            <input
              name={CLAVE_ARCHIVOS}
              type="file"
              multiple
              disabled={sansLogo}
              accept=".png,.jpg,.jpeg,.svg,.pdf,.ai,image/png,image/jpeg,image/svg+xml,application/pdf"
              className="mt-2 block w-full text-sm text-marine file:mr-3 file:min-h-11 file:rounded-full file:border-0 file:bg-marine file:px-4 file:font-semibold file:text-white disabled:opacity-50"
            />
            <span className="mt-1 block text-xs font-normal text-ardoise">PNG, JPG, SVG, PDF ou AI · 4 Mo au total. Un vectoriel donne le meilleur rendu, mais tout fichier nous aide.</span>
          </label>
          <label className="flex items-center gap-3 text-sm text-marine">
            <input type="checkbox" name="sin_logo" checked={sansLogo} onChange={(e) => setSansLogo(e.target.checked)} className="h-5 w-5 accent-marine" />
            Je n’ai pas encore de logo (on en parle ensemble)
          </label>
          <label className={libelle}>
            Votre idée, en quelques mots <span className="font-normal text-ardoise">(facultatif)</span>
            <textarea name="mensaje" rows={4} className={champ} placeholder="Couleurs, style, usage, public…" />
          </label>
        </fieldset>

        {/* Étape 3 : le délai */}
        <fieldset data-etape={2} hidden={etape !== 2} className="mt-6 space-y-5">
          <legend className="sr-only">Votre délai</legend>
          <label className={libelle}>
            Date souhaitée <span className="font-normal text-ardoise">(laissez vide si pas de date précise)</span>
            <input name="fecha_limite" type="date" className={`${champ} max-w-56`} />
          </label>
          <label className={libelle}>
            Pour quelle occasion ? <span className="font-normal text-ardoise">(facultatif)</span>
            <input name="ocasion" type="text" className={champ} placeholder="Ex. : début de saison, salon, tournoi, ouverture…" />
          </label>
          <p className="text-sm text-ardoise">Délais de fabrication : [à confirmer]. Nous vous disons tout de suite si la date est tenable.</p>
        </fieldset>

        {/* Étape 4 : les coordonnées */}
        <fieldset data-etape={3} hidden={etape !== 3} className="mt-6 space-y-5">
          <legend className="sr-only">Vos coordonnées</legend>
          <fieldset>
            <legend className={libelle}>Vous êtes</legend>
            <div className="mt-2 flex flex-wrap gap-2">
              {TIPOS.map((t) => (
                <label key={t.id} className={puce}>
                  <input type="radio" name="tipo_cliente" value={t.id} checked={tipo === t.id} onChange={() => setTipo(t.id)} className="sr-only" required />
                  {t.nombre}
                </label>
              ))}
            </div>
          </fieldset>
          <div className="grid gap-5 sm:grid-cols-2">
            <label className={libelle}>
              Nom et prénom
              <input name="nombre" type="text" required minLength={2} autoComplete="name" className={champ} />
            </label>
            {pro && (
              <label className={libelle}>
                Structure
                <input name="negocio" type="text" required autoComplete="organization" className={champ} placeholder="Entreprise, club, camping…" />
              </label>
            )}
            <label className={libelle}>
              Email
              <input name="email" type="email" required autoComplete="email" className={champ} />
            </label>
            <label className={libelle}>
              Téléphone <span className="font-normal text-ardoise">(facultatif)</span>
              <input name="telefono" type="tel" autoComplete="tel" className={champ} />
            </label>
            <label className={libelle}>
              Ville ou code postal <span className="font-normal text-ardoise">(facultatif)</span>
              <input name="ciudad" type="text" autoComplete="address-level2" className={champ} />
            </label>
          </div>
          <fieldset>
            <legend className={libelle}>On vous recontacte par</legend>
            <div className="mt-2 flex flex-wrap gap-2">
              {CONTACTOS.map((c) => (
                <label key={c.id} className={puce}>
                  <input type="radio" name="contacto_preferido" value={c.id} defaultChecked={c.id === 'email'} className="sr-only" />
                  {c.nombre}
                </label>
              ))}
            </div>
          </fieldset>
          <label className="flex items-start gap-3 text-sm text-marine">
            <input type="checkbox" name="privacidad" required className="mt-0.5 h-5 w-5 shrink-0 accent-marine" />
            <span>
              J’accepte que La Ola Import utilise ces informations pour répondre à ma demande.{' '}
              <Link href="/confidentialite" className="font-semibold text-bleu-600 underline underline-offset-4">
                Politique de confidentialité
              </Link>
            </span>
          </label>
        </fieldset>

        {erreur && (
          <div role="alert" className="mt-6 rounded-xl bg-fuchsia-50 p-4 text-sm text-marine ring-1 ring-fuchsia-700/30">
            <p className="font-semibold">{erreur}</p>
            {erreursChamps.length > 0 && (
              <ul className="mt-2 list-disc pl-5">
                {erreursChamps.map((c) => (
                  <li key={c.campo}>{c.mensaje}</li>
                ))}
              </ul>
            )}
            <a href={enlaceWhatsApp('Bonjour, je voulais vous envoyer une demande de devis depuis le site, mais l’envoi n’a pas fonctionné.')} target="_blank" rel="noopener noreferrer" className="mt-3 inline-flex min-h-11 items-center gap-2 rounded-full bg-marine px-4 font-semibold text-white">
              <IconoWhatsApp className="h-5 w-5" />
              Envoyer par WhatsApp
            </a>
          </div>
        )}

        <div className="mt-8 flex flex-wrap items-center justify-between gap-3">
          {etape > 0 ? (
            <button type="button" onClick={() => setEtape((e) => e - 1)} className="inline-flex min-h-11 items-center rounded-full px-4 font-semibold text-bleu-600 underline underline-offset-4">
              ← Retour
            </button>
          ) : (
            <span />
          )}
          {etape < ETAPES.length - 1 ? (
            <button type="button" onClick={suivant} className="inline-flex min-h-12 items-center rounded-full bg-marine px-6 font-semibold text-white hover:bg-indigo-700">
              Continuer
            </button>
          ) : (
            <button type="submit" disabled={envoi} className="inline-flex min-h-12 items-center rounded-full bg-fuchsia-700 px-6 font-semibold text-white shadow-md shadow-fuchsia-700/25 hover:bg-fuchsia-800 disabled:opacity-60">
              {envoi ? 'Envoi en cours…' : 'Envoyer ma demande de devis'}
            </button>
          )}
        </div>
      </div>

      <aside className="space-y-4 text-sm text-ardoise">
        {segment && (
          <p className="rounded-2xl bg-cyan-300/15 p-4 text-marine">
            Demande pour : <strong>{segment.nom}</strong>
          </p>
        )}
        <div className="rounded-2xl bg-perle p-5 ring-1 ring-marine/5">
          <p className="font-display text-lg font-extrabold text-marine">Ce qui se passe ensuite</p>
          <ol className="mt-2 list-decimal space-y-1 pl-5">
            <li>L’atelier étudie votre demande.</li>
            <li>On vous recontacte pour préciser si besoin.</li>
            <li>Vous recevez un devis clair, puis un BAT avant toute impression.</li>
          </ol>
        </div>
        <p>
          Plutôt pressé ?{' '}
          <a href={enlaceWhatsApp()} target="_blank" rel="noopener noreferrer" className="font-semibold text-bleu-600 underline underline-offset-4">
            Écrivez-nous sur WhatsApp
          </a>
          .
        </p>
      </aside>
    </form>
  );
}
