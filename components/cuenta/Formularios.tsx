'use client';

// Formularios de la cuenta (registro, conexión, contraseña olvidada, nueva contraseña, datos de la empresa). Usan Server
// Actions con useActionState: la validación real (zod) ocurre en el servidor; los errores vuelven junto a cada campo.
import { useActionState, useEffect, useRef } from 'react';
import Link from 'next/link';
import { Boton } from '@/components/ui/Botones';
import { actualizarPerfil, iniciarSesion, nuevaContrasena, olvidoContrasena, registrar, type EstadoFormulario } from '@/lib/cuenta/acciones';
import { CAMPO_INICIO, CAMPO_TRAMPA } from '@/lib/solicitud/comun';
import { CasillaLegal, Campo } from './Campo';

const VACIO: EstadoFormulario = { ok: false };

function Mensaje({ estado }: { estado: EstadoFormulario }) {
  if (!estado.mensaje || estado.ok) return null;
  return (
    <p role="alert" className="rounded-xl bg-[#fbeaea] px-4 py-3 text-sm font-medium text-[#7a2020] sm:col-span-2">
      {estado.mensaje}
    </p>
  );
}

/** Campo trampa oculto: un robot lo rellena; una persona nunca lo ve. */
function Trampa() {
  return (
    <div aria-hidden="true" className="absolute -left-[9999px] h-0 w-0 overflow-hidden">
      <label>
        Ne pas remplir
        <input type="text" name={CAMPO_TRAMPA} tabIndex={-1} autoComplete="off" />
      </label>
    </div>
  );
}

/**
 * Hora de carga del formulario para el antispam (el servidor exige un tiempo mínimo de relleno). Va en una ref y se añade al
 * FormData al enviar: así sobrevive al reinicio del formulario que React hace tras cada acción con errores.
 */
function useHoraDeCarga() {
  const inicio = useRef(0);
  useEffect(() => {
    inicio.current = Date.now();
  }, []);
  return (accion: (fd: FormData) => void) => (fd: FormData) => {
    fd.set(CAMPO_INICIO, String(inicio.current));
    accion(fd);
  };
}

export function FormularioLogin({ siguiente }: { siguiente?: string }) {
  const [estado, accion, pendiente] = useActionState(iniciarSesion, VACIO);
  const e = estado.errores ?? {};
  return (
    <form action={accion} noValidate className="grid gap-4">
      <input type="hidden" name="siguiente" value={siguiente ?? ''} />
      <Mensaje estado={estado} />
      <Campo nombre="email" etiqueta="Email" type="email" autoComplete="email" required valor={estado.valores?.email} error={e.email} />
      <Campo nombre="password" etiqueta="Mot de passe" type="password" autoComplete="current-password" required error={e.password} />
      <Boton type="submit" variante="principal" tamano="grande" disabled={pendiente}>
        {pendiente ? 'Connexion…' : 'Se connecter'}
      </Boton>
      <p className="text-sm text-ardoise">
        <Link href="/mot-de-passe-oublie" className="font-semibold text-bleu-600 underline underline-offset-4">
          Mot de passe oublié ?
        </Link>{' '}
        ·{' '}
        <Link href={`/inscription${siguiente ? `?siguiente=${encodeURIComponent(siguiente)}` : ''}`} className="font-semibold text-bleu-600 underline underline-offset-4">
          Créer un compte professionnel
        </Link>
      </p>
    </form>
  );
}

export function FormularioRegistro() {
  const [estado, accion, pendiente] = useActionState(registrar, VACIO);
  const conHora = useHoraDeCarga();
  const e = estado.errores ?? {};
  const v = estado.valores ?? {};
  if (estado.ok) {
    return (
      <div role="status" className="rounded-2xl bg-white p-6 shadow-carte ring-1 ring-marine/5">
        <h2 className="font-display text-2xl font-extrabold text-marine">Vérifiez votre boîte mail</h2>
        <p className="mt-2 text-ardoise">
          Nous venons de vous envoyer un lien pour confirmer votre adresse email. Une fois confirmée, votre compte sera examiné par notre équipe : vous verrez les prix
          dès sa validation.
        </p>
        <p className="mt-4">
          <Link href="/connexion" className="font-semibold text-bleu-600 underline underline-offset-4">
            Aller à la connexion
          </Link>
        </p>
      </div>
    );
  }
  return (
    <form action={conHora(accion)} noValidate className="grid gap-4 sm:grid-cols-2">
      <Trampa />
      <Mensaje estado={estado} />
      <h2 className="font-display text-xl font-extrabold text-marine sm:col-span-2">Votre entreprise</h2>
      <Campo nombre="razon_social" etiqueta="Raison sociale" required autoComplete="organization" valor={v.razon_social} error={e.razon_social} />
      <Campo nombre="siret" etiqueta="SIRET" required inputMode="numeric" valor={v.siret} error={e.siret} ayuda="14 chiffres, avec ou sans espaces." />
      <Campo nombre="numero_tva" etiqueta="N° de TVA intracommunautaire" valor={v.numero_tva} error={e.numero_tva} ayuda="Facultatif. Exemple : FR12345678901." />
      <Campo nombre="sector" etiqueta="Activité" valor={v.sector} error={e.sector} ayuda="Camping, club, boutique, entreprise…" />
      <h2 className="mt-2 font-display text-xl font-extrabold text-marine sm:col-span-2">Contact</h2>
      <Campo nombre="nombre_contacto" etiqueta="Prénom" required autoComplete="given-name" valor={v.nombre_contacto} error={e.nombre_contacto} />
      <Campo nombre="apellidos_contacto" etiqueta="Nom" required autoComplete="family-name" valor={v.apellidos_contacto} error={e.apellidos_contacto} />
      <Campo nombre="email" etiqueta="Email" type="email" required autoComplete="email" valor={v.email} error={e.email} />
      <Campo nombre="telefono" etiqueta="Téléphone" type="tel" required autoComplete="tel" valor={v.telefono} error={e.telefono} />
      <h2 className="mt-2 font-display text-xl font-extrabold text-marine sm:col-span-2">Adresse de facturation</h2>
      <Campo nombre="direccion_facturacion" etiqueta="Adresse" required autoComplete="street-address" ancho valor={v.direccion_facturacion} error={e.direccion_facturacion} />
      <Campo nombre="codigo_postal" etiqueta="Code postal" required autoComplete="postal-code" valor={v.codigo_postal} error={e.codigo_postal} />
      <Campo nombre="ciudad" etiqueta="Ville" required autoComplete="address-level2" valor={v.ciudad} error={e.ciudad} />
      <input type="hidden" name="pais" value="FR" />
      <h2 className="mt-2 font-display text-xl font-extrabold text-marine sm:col-span-2">Mot de passe</h2>
      <Campo nombre="password" etiqueta="Mot de passe" type="password" required autoComplete="new-password" error={e.password} ayuda="10 caractères minimum, avec des lettres et des chiffres." />
      <Campo nombre="password_confirmacion" etiqueta="Confirmez le mot de passe" type="password" required autoComplete="new-password" error={e.password_confirmacion} />
      <CasillaLegal nombre="condiciones" error={e.condiciones} marcada={v.condiciones === 'on'}>
        J’accepte les{' '}
        <Link href="/cgv" target="_blank" className="font-semibold text-bleu-600 underline underline-offset-4">
          conditions générales de vente
        </Link>{' '}
        (version provisoire).
      </CasillaLegal>
      <CasillaLegal nombre="privacidad" error={e.privacidad} marcada={v.privacidad === 'on'}>
        J’ai lu la{' '}
        <Link href="/confidentialite" target="_blank" className="font-semibold text-bleu-600 underline underline-offset-4">
          politique de confidentialité
        </Link>{' '}
        et j’accepte que mes données soient traitées pour gérer mon compte professionnel.
      </CasillaLegal>
      <div className="sm:col-span-2">
        <Boton type="submit" variante="principal" tamano="grande" disabled={pendiente}>
          {pendiente ? 'Création du compte…' : 'Créer mon compte professionnel'}
        </Boton>
      </div>
    </form>
  );
}

export function FormularioOlvido() {
  const [estado, accion, pendiente] = useActionState(olvidoContrasena, VACIO);
  const e = estado.errores ?? {};
  if (estado.ok) {
    return (
      <p role="status" className="rounded-2xl bg-white p-6 text-marine shadow-carte ring-1 ring-marine/5">
        {estado.mensaje}
      </p>
    );
  }
  return (
    <form action={accion} noValidate className="grid gap-4">
      <Mensaje estado={estado} />
      <Campo nombre="email" etiqueta="Email" type="email" autoComplete="email" required valor={estado.valores?.email} error={e.email} />
      <Boton type="submit" variante="principal" tamano="grande" disabled={pendiente}>
        {pendiente ? 'Envoi…' : 'Recevoir le lien'}
      </Boton>
    </form>
  );
}

export function FormularioNuevaContrasena() {
  const [estado, accion, pendiente] = useActionState(nuevaContrasena, VACIO);
  const e = estado.errores ?? {};
  return (
    <form action={accion} noValidate className="grid gap-4">
      <Mensaje estado={estado} />
      <Campo nombre="password" etiqueta="Nouveau mot de passe" type="password" required autoComplete="new-password" error={e.password} ayuda="10 caractères minimum, avec des lettres et des chiffres." />
      <Campo nombre="password_confirmacion" etiqueta="Confirmez le mot de passe" type="password" required autoComplete="new-password" error={e.password_confirmacion} />
      <Boton type="submit" variante="principal" tamano="grande" disabled={pendiente}>
        {pendiente ? 'Enregistrement…' : 'Changer le mot de passe'}
      </Boton>
    </form>
  );
}

export interface DatosPerfil {
  razon_social: string;
  siret: string;
  numero_tva: string;
  nombre_contacto: string;
  apellidos_contacto: string;
  telefono: string;
  direccion_facturacion: string;
  codigo_postal: string;
  ciudad: string;
  sector: string;
  email: string;
}

export function FormularioPerfil({ perfil }: { perfil: DatosPerfil }) {
  const [estado, accion, pendiente] = useActionState(actualizarPerfil, VACIO);
  const e = estado.errores ?? {};
  const v = { ...perfil, ...(estado.valores ?? {}) };
  return (
    <form action={accion} noValidate className="grid gap-4 sm:grid-cols-2">
      {estado.ok && estado.mensaje && (
        <p role="status" className="rounded-xl bg-[#e8f6ee] px-4 py-3 text-sm font-medium text-[#1c5a37] sm:col-span-2">
          {estado.mensaje}
        </p>
      )}
      <Mensaje estado={estado} />
      <Campo nombre="razon_social" etiqueta="Raison sociale" required valor={v.razon_social} error={e.razon_social} />
      <div>
        <p className="text-sm font-medium text-encre">SIRET</p>
        <p className="mt-1 flex min-h-11 items-center rounded-xl border border-marine/10 bg-perle px-3 text-base text-marine">{perfil.siret || '—'}</p>
        <p className="mt-1 text-xs text-ardoise">Pour corriger votre SIRET, écrivez-nous.</p>
      </div>
      <Campo nombre="numero_tva" etiqueta="N° de TVA intracommunautaire" valor={v.numero_tva} error={e.numero_tva} />
      <Campo nombre="sector" etiqueta="Activité" valor={v.sector} error={e.sector} />
      <Campo nombre="nombre_contacto" etiqueta="Prénom" required valor={v.nombre_contacto} error={e.nombre_contacto} />
      <Campo nombre="apellidos_contacto" etiqueta="Nom" required valor={v.apellidos_contacto} error={e.apellidos_contacto} />
      <div>
        <p className="text-sm font-medium text-encre">Email</p>
        <p className="mt-1 flex min-h-11 items-center rounded-xl border border-marine/10 bg-perle px-3 text-base text-marine">{perfil.email}</p>
      </div>
      <Campo nombre="telefono" etiqueta="Téléphone" type="tel" required valor={v.telefono} error={e.telefono} />
      <Campo nombre="direccion_facturacion" etiqueta="Adresse de facturation" required ancho valor={v.direccion_facturacion} error={e.direccion_facturacion} />
      <Campo nombre="codigo_postal" etiqueta="Code postal" required valor={v.codigo_postal} error={e.codigo_postal} />
      <Campo nombre="ciudad" etiqueta="Ville" required valor={v.ciudad} error={e.ciudad} />
      <div className="sm:col-span-2">
        <Boton type="submit" variante="principal" disabled={pendiente}>
          {pendiente ? 'Enregistrement…' : 'Enregistrer'}
        </Boton>
      </div>
    </form>
  );
}
