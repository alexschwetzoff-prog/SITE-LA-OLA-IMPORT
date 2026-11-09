'use client';

// /projet : le panier (produits avec couleur, emplacement et quantité, et visuels envoyés depuis le studio) et le
// formulaire en deux étapes, pensé surtout pour les particuliers. Le type de client (particulier, entreprise, club,
// camping, boutique, association) change les champs : le particulier n'a ni structure ni usage professionnel. L'envoi
// est réel : le navigateur prépare les logos et les captures de chaque visuel (lib/solicitud/preparar.ts), l'action
// serveur (app/projet/acciones.ts, partagée avec /devis) valide et envoie les deux emails, et le panier n'est vidé
// qu'après un envoi réussi. En cas d'échec, le client voit un message clair avec le bouton WhatsApp et garde sa saisie.

import { useEffect, useId, useRef, useState } from 'react';
import Image from 'next/image';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { enviarSolicitud } from '@/app/projet/acciones';
import { IconoWhatsApp } from '@/components/layout/Iconos';
import { fondoMuestra } from '@/components/catalogo/Muestras';
import { BotonEnlace, ESTILO_BOTON } from '@/components/ui/Botones';
import { CLAVE_ATERRIZAJE, leerAterrizaje } from '@/lib/aterrizaje';
import { leerLogo } from '@/lib/logos-db';
import { CLAVE_DISENO, TRAMOS, TRAMO_POR_DEFECTO, cambiarTramo, importarDisenoDelEstudio, quitarDelPresupuesto, textoPosiciones, usePresupuesto, vaciarPresupuesto, type ItemPresupuesto, type Tramo } from '@/lib/presupuesto';
import {
  CAMPO_INICIO,
  CAMPO_TRAMPA,
  CLAVE_ARCHIVOS,
  CLAVE_AVISOS,
  CLAVE_CESTA,
  CONTACTOS,
  CONTACTO_POR_DEFECTO,
  MAX_ENVIO_BYTES,
  TIPOS,
  TIPO_POR_DEFECTO,
  USOS,
  esProfesional,
  formatoBytes,
  type TipoCliente,
} from '@/lib/solicitud/comun';
import type { ErrorCampo } from '@/lib/solicitud/esquema';
import { prepararEnvio } from '@/lib/solicitud/preparar';
import { SITE, TEXTOS, enlaceWhatsApp } from '@/lib/site';

export interface DatosProducto {
  tipo: string;
  foto?: string;
  /** Texte de prix du produit (« Consulter le prix » tant qu'il n'y a pas de tarif). */
  precio?: string;
}

export type { TipoCliente };

type Estado = { fase: 'listo' } | { fase: 'enviando' } | { fase: 'error'; mensaje: string; campos?: ErrorCampo[] };

const TITULO_FALLO = 'Oups, votre demande n’est pas partie.';
const FALLO_RED = 'Rien n’est perdu : vos informations sont conservées. La connexion semble avoir coupé : réessayez dans un instant ou envoyez-nous votre demande sur WhatsApp.';
const PLAZO = `${TEXTOS.plazoPresupuesto}.`;

const NOMBRES_CAMPOS: Record<string, string> = {
  tipo_cliente: 'Vous êtes',
  nombre: 'Nom',
  negocio: 'Structure',
  sector: 'Activité',
  ocasion: 'Occasion',
  ciudad: 'Ville',
  email: 'Email',
  telefono: 'Téléphone',
  tipo_producto: 'Type de produit',
  otro_producto: 'Autre produit',
  cantidad: 'Quantité',
  emplazamientos: 'Emplacements',
  fecha_limite: 'Date souhaitée',
  mensaje: 'Commentaires',
  privacidad: 'Confidentialité',
};

/** Libellé du champ « structure » selon le type de client. */
const NOMBRE_ESTRUCTURA: Record<TipoCliente, string> = {
  particulier: 'Structure',
  entreprise: 'Nom de l’entreprise',
  club: 'Nom du club',
  camping: 'Nom du camping',
  boutique: 'Nom de la boutique',
  association: 'Nom de l’association',
};

const campo =
  'mt-1 w-full rounded-xl border border-marine/20 bg-fond px-3.5 py-3 font-normal text-marine placeholder:text-ardoise focus:border-bleu-600 focus:outline-none focus:ring-2 focus:ring-bleu-600/40';
const etiqueta = 'block text-sm font-semibold text-marine';
const ayuda = 'mt-1 block text-xs font-normal text-ardoise';
const chip =
  'cursor-pointer rounded-full border border-marine/20 bg-fond px-4 py-2 text-sm font-medium text-marine transition-colors hover:border-violet-600/60 has-[:checked]:border-violet-600 has-[:checked]:bg-fuchsia-50 has-[:focus-visible]:ring-2 has-[:focus-visible]:ring-bleu-600';
const tarjeta = 'rounded-2xl bg-fond p-6 shadow-carte ring-1 ring-marine/5 sm:p-8';

function Paso({ numero, total, titulo, children }: { numero: number; total: number; titulo: string; children: React.ReactNode }) {
  return (
    <fieldset className={tarjeta}>
      <legend className="sr-only">
        Étape {numero} sur {total} : {titulo}
      </legend>
      <p className="flex items-center gap-3 font-display text-xl font-bold text-marine" aria-hidden="true">
        <span className="flex h-8 w-8 items-center justify-center rounded-full bg-fuchsia-50 text-sm">{numero}</span>
        {titulo}
        <span className="ml-auto text-xs font-semibold tracking-wide text-ardoise">
          Étape {numero} sur {total}
        </span>
      </p>
      <div className="mt-5 grid gap-4 sm:grid-cols-2">{children}</div>
    </fieldset>
  );
}

/** Vérifie que le fichier d'origine d'un logo est toujours enregistré dans le navigateur (IndexedDB) et le dit. */
function EstadoLogo({ id, lado }: { id: string; lado?: 'avant' | 'arrière' }) {
  const [archivo, setArchivo] = useState<File | null | undefined>(undefined);
  useEffect(() => {
    let vivo = true;
    leerLogo(id).then((f) => {
      if (vivo) setArchivo(f);
    });
    return () => {
      vivo = false;
    };
  }, [id]);
  if (archivo === undefined) return null;
  return (
    <span className="block">
      {archivo
        ? `Fichier d’origine du logo ${lado ? `${lado} ` : ''}enregistré dans votre navigateur (${archivo.name}, ${formatoBytes(archivo.size)}) : il sera joint à l’envoi.`
        : `Le fichier du logo ${lado ? `${lado} ` : ''}n’est plus dans ce navigateur : nous vous le demanderons en vous répondant.`}
    </span>
  );
}

function Tarjeta({ item, datos }: { item: ItemPresupuesto; datos?: DatosProducto }) {
  const diseno = item.diseno;
  const posiciones = textoPosiciones(item);
  const precio = datos?.precio;
  return (
    <li className="flex gap-4 rounded-2xl bg-fond p-3 ring-1 ring-marine/10 sm:p-4">
      <div className="flex shrink-0 gap-1.5">
        {diseno?.capturas.length ? (
          diseno.capturas.map((c) => (
            // eslint-disable-next-line @next/next/no-img-element -- capture générée dans le navigateur (data URL)
            <img key={c.lado} src={c.url} alt={`Votre visuel ${c.lado === 'delante' ? 'devant' : 'derrière'}`} className="h-24 w-[4.8rem] rounded-xl bg-white object-cover ring-1 ring-marine/10" />
          ))
        ) : item.foto ? (
          <Image src={item.foto} alt="" width={96} height={96} className="h-24 w-24 rounded-xl bg-white object-contain p-1 ring-1 ring-marine/10" />
        ) : (
          <span className="flex h-24 w-24 items-center justify-center rounded-xl bg-perle text-xs text-ardoise">Sans photo</span>
        )}
      </div>
      <div className="min-w-0 flex-1">
        <div className="flex items-start justify-between gap-3">
          <div className="min-w-0">
            <p className="font-display text-lg font-bold text-marine">
              <Link href={`/catalogue/${item.slug}`} className="hover:text-indigo-700 hover:underline">
                {item.nombre}
              </Link>
            </p>
            <p className="text-sm text-ardoise">{item.tipo}</p>
          </div>
          <button
            type="button"
            onClick={() => quitarDelPresupuesto(item.id)}
            aria-label={`Retirer ${item.nombre} du panier`}
            className="shrink-0 rounded-full px-2 py-1 text-sm font-medium text-bleu-600 underline-offset-4 hover:text-indigo-700 hover:underline"
          >
            Retirer
          </button>
        </div>
        <p className="mt-2 flex items-center gap-2 text-sm text-marine">
          <span className="h-4 w-4 rounded-full border border-marine/30" style={{ background: fondoMuestra(item.color) }} aria-hidden="true" />
          {item.color.nombre}
        </p>
        {/* Emplacement choisi sur la fiche, ou ceux du visuel du studio */}
        {diseno ? (
          <p className="mt-1 text-xs text-ardoise">
            Visuel du studio : {diseno.colocaciones.map((c) => `${c.nombre} · ${c.anchoCm.toLocaleString('fr-FR')} cm`).join(' + ') || 'aucun emplacement'} · logo{diseno.logoDetras ? ' avant' : ''} {diseno.logo.nombre}
            {diseno.logoDetras ? ` · logo arrière ${diseno.logoDetras.nombre}` : ''}
            {diseno.logoId && <EstadoLogo id={diseno.logoId} lado={diseno.logoDetras ? 'avant' : undefined} />}
            {diseno.logoDetras && diseno.logoIdDetras && <EstadoLogo id={diseno.logoIdDetras} lado="arrière" />}
          </p>
        ) : (
          posiciones && <p className="mt-1 text-xs text-ardoise">Personnalisation : {posiciones}</p>
        )}
        {precio && <p className="mt-1 text-xs font-semibold text-marine">{precio}</p>}
        <label className="mt-3 block text-xs font-semibold text-marine">
          Quantité approximative
          <select value={item.tramo} onChange={(e) => cambiarTramo(item.id, e.target.value as Tramo)} className="mt-1 block rounded-xl border border-marine/20 bg-fond px-3 py-2 text-sm font-normal text-marine">
            {TRAMOS.map((t) => (
              <option key={t.id} value={t.id}>
                {t.nombre}
              </option>
            ))}
          </select>
        </label>
      </div>
    </li>
  );
}

/** Après un envoi réussi : panier vide (et ses fichiers hors du navigateur), plus rien en attente du studio ou de l'accueil. */
function limpiarTrasEnviar() {
  vaciarPresupuesto();
  try {
    sessionStorage.removeItem(CLAVE_DISENO);
    sessionStorage.removeItem(CLAVE_ATERRIZAJE);
  } catch {
    // pas de stockage : rien à nettoyer
  }
}

export default function Proyecto({ productos }: { productos: Record<string, DatosProducto> }) {
  const items = usePresupuesto();
  const router = useRouter();
  const id = useId();
  const [tipo, setTipo] = useState<TipoCliente>(TIPO_POR_DEFECTO);
  const [estado, setEstado] = useState<Estado>({ fase: 'listo' });
  const inicioRef = useRef(0);
  const formRef = useRef<HTMLFormElement>(null);
  const avisoRef = useRef<HTMLDivElement>(null);
  const negocioPendiente = useRef<string | null>(null);
  const profesional = esProfesional(tipo);
  const enviando = estado.fase === 'enviando';

  // Le visuel laissé par le studio (« Ajouter au panier ») passe dans le panier une seule fois.
  useEffect(() => {
    void importarDisenoDelEstudio((slug) => productos[slug]);
  }, [productos]);

  // Au montage : heure de chargement (antispam : temps minimum de saisie) et données du formulaire court de l'accueil.
  // Elles sont posées sur le HTML déjà servi, sans état, pour que la page arrive prérendue sans saut de mise en page.
  useEffect(() => {
    inicioRef.current = Date.now();
    const form = formRef.current;
    if (!form) return;
    const previo = leerAterrizaje();
    const poner = (nombre: string, valor?: string) => {
      const el = form.elements.namedItem(nombre);
      if ((el instanceof HTMLInputElement || el instanceof HTMLTextAreaElement) && valor && !el.value) el.value = valor;
    };
    poner('nombre', previo.nombre);
    poner('mensaje', previo.mensaje);
    if (previo.contacto) poner(previo.contacto.includes('@') ? 'email' : 'telefono', previo.contacto);
    if (previo.tramo) {
      const el = form.querySelector(`input[name="tramo"][value="${CSS.escape(previo.tramo)}"]`);
      if (el instanceof HTMLInputElement) el.checked = true;
    }
    // Un nom de structure venu de l'accueil : on passe en « Entreprise » pour afficher le champ, puis on le remplit.
    if (previo.negocio) {
      negocioPendiente.current = previo.negocio;
      setTipo('entreprise');
    }
  }, []);

  useEffect(() => {
    const valor = negocioPendiente.current;
    const el = formRef.current?.elements.namedItem('negocio');
    if (valor && el instanceof HTMLInputElement) {
      if (!el.value) el.value = valor;
      negocioPendiente.current = null;
    }
  }, [tipo]);

  useEffect(() => {
    if (estado.fase === 'error' && avisoRef.current) {
      avisoRef.current.scrollIntoView({ block: 'center', behavior: 'smooth' });
      avisoRef.current.focus({ preventScroll: true });
    }
  }, [estado]);

  async function alEnviar(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    if (enviando) return;
    const form = e.currentTarget;
    setEstado({ fase: 'enviando' });
    try {
      const fd = new FormData(form);
      fd.set(CAMPO_INICIO, String(inicioRef.current));
      const sueltos = fd.getAll(CLAVE_ARCHIVOS).filter((f): f is File => f instanceof File && f.size > 0);
      fd.delete(CLAVE_ARCHIVOS);
      const preparado = await prepararEnvio(items, sueltos);
      if ('error' in preparado) {
        setEstado({ fase: 'error', mensaje: preparado.error });
        return;
      }
      fd.set(CLAVE_CESTA, JSON.stringify(preparado.lineas));
      fd.set(CLAVE_AVISOS, JSON.stringify(preparado.avisos));
      for (const a of preparado.archivos) fd.append(a.clave, a.archivo, a.archivo.name);
      const resultado = await enviarSolicitud(fd);
      if (!resultado.ok) {
        setEstado({ fase: 'error', mensaje: resultado.mensaje, campos: resultado.campos });
        return;
      }
      limpiarTrasEnviar();
      router.push('/merci');
    } catch {
      setEstado({ fase: 'error', mensaje: FALLO_RED });
    }
  }

  const conDisenos = items.some((i) => i.diseno);
  // Un prix chiffré (quand La Ola Import aura ses tarifs) appelle la note sur les prix ; « Consulter le prix », non.
  const conPrecios = items.some((i) => /\d/.test(productos[i.slug]?.precio ?? ''));

  return (
    <section className="mx-auto w-full max-w-5xl px-4 pt-28 pb-16 sm:px-6 lg:px-8 lg:pt-36">
      <p className="mb-3 text-xs font-semibold tracking-[0.2em] text-violet-600 uppercase">Mon projet</p>
      <h1 className="font-display text-4xl font-extrabold tracking-tight text-marine sm:text-5xl">Votre panier et votre demande</h1>
      <p className="mt-4 max-w-2xl text-lg text-ardoise">Vérifiez votre panier, puis dites-nous qui vous êtes en deux étapes courtes. {PLAZO}</p>

      {/* Panier */}
      <div className={`mt-10 ${tarjeta}`}>
        <div className="flex flex-wrap items-end justify-between gap-3">
          <h2 className="font-display text-2xl font-bold text-marine">Votre panier</h2>
          <p className="text-sm text-ardoise">{items.length ? `${items.length} ${items.length === 1 ? 'produit' : 'produits'}` : 'Votre panier est vide pour l’instant'}</p>
        </div>
        {items.length ? (
          <ul className="mt-5 space-y-3">
            {items.map((item) => (
              <Tarjeta key={item.id} item={item} datos={productos[item.slug]} />
            ))}
          </ul>
        ) : (
          <p className="mt-4 text-ardoise">Ajoutez des produits depuis le catalogue ou créez votre visuel dans le studio : ils apparaîtront ici avec leur couleur, leur emplacement et leur quantité. Vous pouvez aussi nous décrire votre projet ci-dessous.</p>
        )}
        {conPrecios && (
          <p className="mt-4 text-xs leading-relaxed text-ardoise">
            {TEXTOS.sinIva} {TEXTOS.notaPrecios} {TEXTOS.pedidoMinimo}
          </p>
        )}
        <div className="mt-5 flex flex-wrap gap-3">
          <BotonEnlace href="/catalogue" variante="secundario">
            {items.length ? 'Ajouter d’autres produits' : 'Voir le catalogue'}
          </BotonEnlace>
          <BotonEnlace href="/personnaliser/atomic-150" variante="secundario">
            Personnaliser avec mon logo
          </BotonEnlace>
        </div>
      </div>

      {/* Formulaire en étapes : l'action serveur valide et envoie */}
      <form ref={formRef} className="mt-8 space-y-6" onSubmit={(e) => void alEnviar(e)} aria-describedby={`${id}-estado`}>
        <input type="hidden" name="formulario" value="projet" />
        {/* Champ piège : invisible pour les personnes ; un robot qui le remplit n'envoie rien */}
        <div aria-hidden="true" className="sr-only">
          <label>
            Ne remplissez pas ce champ
            <input type="text" name={CAMPO_TRAMPA} tabIndex={-1} autoComplete="off" defaultValue="" />
          </label>
        </div>

        <Paso numero={1} total={2} titulo="Vous">
          <fieldset className="sm:col-span-2">
            <legend className={etiqueta}>Vous êtes… *</legend>
            <div className="mt-2 flex flex-wrap gap-2">
              {TIPOS.map((t) => (
                <label key={t.id} className={chip}>
                  <input type="radio" name="tipo_cliente" value={t.id} checked={tipo === t.id} onChange={() => setTipo(t.id)} className="sr-only" />
                  {t.nombre}
                </label>
              ))}
            </div>
          </fieldset>
          <label className={etiqueta}>
            Nom et prénom *<input name="nombre" required autoComplete="name" maxLength={120} className={campo} />
          </label>
          {profesional && (
            <label className={etiqueta}>
              {NOMBRE_ESTRUCTURA[tipo]} *<input name="negocio" required autoComplete="organization" maxLength={120} className={campo} />
            </label>
          )}
          {profesional && (
            <label className={etiqueta}>
              Activité <span className="font-normal text-ardoise">(facultatif)</span>
              <input name="sector" maxLength={120} className={campo} placeholder="Par exemple : restaurant, tennis, location de vacances" />
            </label>
          )}
          <label className={etiqueta}>
            Ville ou code postal <span className="font-normal text-ardoise">(facultatif)</span>
            <input name="ciudad" autoComplete="address-level2" maxLength={120} className={campo} />
          </label>
          <label className={etiqueta}>
            Email *<input name="email" type="email" required autoComplete="email" maxLength={200} className={campo} />
          </label>
          <label className={etiqueta}>
            Téléphone ou WhatsApp <span className="font-normal text-ardoise">(facultatif)</span>
            <input name="telefono" type="tel" autoComplete="tel" maxLength={40} className={campo} />
          </label>
          <fieldset className="sm:col-span-2">
            <legend className={etiqueta}>Comment préférez-vous être recontacté ?</legend>
            <div className="mt-2 flex flex-wrap gap-2">
              {CONTACTOS.map((c) => (
                <label key={c.id} className={chip}>
                  <input type="radio" name="contacto_preferido" value={c.id} defaultChecked={c.id === CONTACTO_POR_DEFECTO} className="sr-only" />
                  {c.nombre}
                </label>
              ))}
            </div>
          </fieldset>
        </Paso>

        <Paso numero={2} total={2} titulo="Votre projet">
          <div className="sm:col-span-2">
            <p className={etiqueta}>Produits</p>
            <p className="mt-1 text-sm text-marine">
              {items.length
                ? items
                    .map((i) => {
                      const donde = textoPosiciones(i);
                      return `${i.nombre} (${i.color.nombre}${donde ? `, ${donde.toLowerCase()}` : ''}, ${TRAMOS.find((t) => t.id === i.tramo)?.nombre.toLowerCase()})`;
                    })
                    .join(' · ')
                : 'Ceux de votre panier, ou décrivez-les plus bas.'}
            </p>
          </div>
          <label className={`${etiqueta} sm:col-span-2`}>
            Un autre produit, hors catalogue <span className="font-normal text-ardoise">(facultatif)</span>
            <input name="otro_producto" maxLength={300} className={campo} placeholder="Par exemple : serviettes, mugs, magnets" />
          </label>
          {!items.length && (
            <fieldset className="sm:col-span-2">
              <legend className={etiqueta}>Quantité approximative</legend>
              <div className="mt-2 flex flex-wrap gap-2">
                {TRAMOS.map((t) => (
                  <label key={t.id} className={chip}>
                    <input type="radio" name="tramo" value={t.id} defaultChecked={t.id === TRAMO_POR_DEFECTO} className="sr-only" />
                    {t.nombre}
                  </label>
                ))}
              </div>
            </fieldset>
          )}
          <p className="text-sm text-ardoise sm:col-span-2">{TEXTOS.pedidoMinimo}</p>
          {profesional && (
            <fieldset className="sm:col-span-2">
              <legend className={etiqueta}>
                C’est pour… <span className="font-normal text-ardoise">(facultatif)</span>
              </legend>
              <div className="mt-2 flex flex-wrap gap-2">
                {USOS.map((u) => (
                  <label key={u.id} className={chip}>
                    <input type="checkbox" name="uso" value={u.id} className="sr-only" />
                    {u.nombre}
                  </label>
                ))}
              </div>
            </fieldset>
          )}
          <label className={`${etiqueta} sm:col-span-2`}>
            Quelle est l’occasion ? <span className="font-normal text-ardoise">(facultatif)</span>
            <input
              name="ocasion"
              maxLength={200}
              className={campo}
              placeholder={profesional ? 'Saison, ouverture, tournoi, salon, cadeaux de fin d’année…' : 'Anniversaire, mariage, enterrement de vie de célibataire, sortie de groupe…'}
            />
          </label>
          {/* La date n'est jamais obligatoire : c'est une demande de devis */}
          <label className={etiqueta}>
            Date souhaitée <span className="font-normal text-ardoise">(facultatif)</span>
            <input name="fecha_limite" type="date" className={campo} aria-describedby={`${id}-fecha`} />
            <span id={`${id}-fecha`} className={ayuda}>
              Pas de date précise ? Laissez vide.
            </span>
          </label>
          <label className={etiqueta}>
            Fichiers (logo, visuel) <span className="font-normal text-ardoise">(facultatif)</span>
            <input
              name={CLAVE_ARCHIVOS}
              type="file"
              multiple
              accept=".png,.jpg,.jpeg,.svg,.pdf,.ai,image/png,image/jpeg,image/svg+xml,application/pdf"
              aria-describedby={`${id}-archivos`}
              className={`${campo} file:mr-3 file:rounded-full file:border-0 file:bg-fuchsia-50 file:px-3 file:py-1 file:text-sm file:font-semibold file:text-marine`}
            />
            <span id={`${id}-archivos`} className={ayuda}>
              PNG, JPG, SVG, PDF ou AI ; {formatoBytes(MAX_ENVIO_BYTES)} maximum par envoi. Plus lourd ? Envoyez-le-nous ensuite par WhatsApp ou par email.
            </span>
          </label>
          <label className="flex items-start gap-3 text-sm text-marine sm:col-span-2">
            <input type="checkbox" name="sin_logo" className="mt-0.5 h-5 w-5 shrink-0 accent-violet-600" />
            <span>Je n’ai pas encore de logo.</span>
          </label>
          {conDisenos && <p className="text-sm text-ardoise sm:col-span-2">Vos visuels du studio sont joints avec leurs aperçus devant et derrière et les fichiers de vos logos.</p>}
          <label className={`${etiqueta} sm:col-span-2`}>
            Commentaires <span className="font-normal text-ardoise">(facultatif)</span>
            <textarea name="mensaje" rows={4} maxLength={4000} className={campo} placeholder="Racontez-nous votre idée : produits, couleurs, quantités, texte à imprimer…" />
          </label>
        </Paso>

        <div className={tarjeta}>
          <label className="flex items-start gap-3 text-sm text-marine">
            <input type="checkbox" name="privacidad" required className="mt-0.5 h-5 w-5 shrink-0 accent-violet-600" />
            <span>
              J’accepte que {SITE.nombre} utilise ces informations pour répondre à ma demande.{' '}
              <Link href="/confidentialite" className="font-semibold text-bleu-600 underline underline-offset-4 hover:text-indigo-700">
                Politique de confidentialité
              </Link>{' '}
              *
            </span>
          </label>
          <label className="mt-3 flex items-start gap-3 text-sm text-marine">
            <input type="checkbox" name="logo_permiso" className="mt-0.5 h-5 w-5 shrink-0 accent-violet-600" />
            <span>Je confirme avoir le droit d’utiliser le logo ou le visuel que je joins.</span>
          </label>
          <p className="mt-3 text-xs text-ardoise">* Champs obligatoires.</p>

          {estado.fase === 'error' && (
            <div ref={avisoRef} tabIndex={-1} role="alert" className="mt-6 rounded-2xl border-2 border-fuchsia-700/40 bg-fuchsia-50 p-4 text-sm text-marine focus:outline-none sm:p-5">
              <p className="font-bold">{estado.campos ? estado.mensaje : TITULO_FALLO}</p>
              {estado.campos ? (
                <ul className="mt-2 list-disc space-y-1 pl-5">
                  {estado.campos.map((c) => (
                    <li key={c.campo}>
                      {NOMBRES_CAMPOS[c.campo] ? <span className="font-semibold">{NOMBRES_CAMPOS[c.campo]} : </span> : null}
                      {c.mensaje}
                    </li>
                  ))}
                </ul>
              ) : (
                <p className="mt-1">{estado.mensaje}</p>
              )}
              <a href={enlaceWhatsApp()} target="_blank" rel="noopener noreferrer" className={`${ESTILO_BOTON.secundario} mt-4 bg-fond`}>
                <IconoWhatsApp className="h-4 w-4" />
                Envoyer sur WhatsApp
              </a>
            </div>
          )}

          <div className="mt-6 flex flex-wrap items-center gap-4">
            <button type="submit" disabled={enviando} aria-busy={enviando} className={`${ESTILO_BOTON.principal} px-6 py-3 text-base`}>
              {enviando ? 'Envoi en cours…' : 'Envoyer ma demande'}
            </button>
            <p id={`${id}-estado`} aria-live="polite" className="text-sm text-ardoise">
              {enviando ? 'Nous préparons vos logos et vos visuels, puis nous envoyons votre demande…' : PLAZO}
            </p>
          </div>
          <p className="mt-3 text-xs text-ardoise">Vous ne voyez pas notre email de confirmation ? Regardez dans vos courriers indésirables ou l’onglet Promotions.</p>
          <p className="mt-5 text-sm text-marine">Une question avant d’envoyer ? Écrivez-nous sur WhatsApp.</p>
          <a href={enlaceWhatsApp()} target="_blank" rel="noopener noreferrer" className={`${ESTILO_BOTON.secundario} mt-3`}>
            <IconoWhatsApp className="h-4 w-4" />
            Écrire sur WhatsApp
          </a>
        </div>
      </form>
    </section>
  );
}
