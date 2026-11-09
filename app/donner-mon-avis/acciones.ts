'use server';

// Réception d'un avis client (/donner-mon-avis) : antispam, validation zod, puis un email à l'équipe avec l'avis et les
// choix de publication du client. Rien n'est publié automatiquement : l'équipe recopie l'avis dans la feuille Google
// Sheets (onglet « Web », colonnes empresa, opinion, mostrar_nombre, publicar, fecha ; voir lib/opiniones/opiniones.ts)
// en respectant exactement les cases cochées par le client.

import { headers } from 'next/headers';
import { z } from 'zod';
import { escapar } from '@/lib/correo/plantillas';
import { destinoEquipo, enviarCorreo } from '@/lib/correo/transporte';
import { MAX_CARACTERES } from '@/lib/opiniones/opiniones';
import { anotarEnvio, esRobot, ipDe, tiempoSuficiente } from '@/lib/solicitud/antispam';
import { SITE } from '@/lib/site';

export type EtatAvis = { estado: 'inicial' } | { estado: 'ok' } | { estado: 'error'; mensaje: string; campos?: Record<string, string> };

const texto = (max: number, nombre: string) => z.string().trim().max(max, `${nombre} : ${max} caractères maximum.`);

const esquemaAvis = z.object({
  prenom: texto(60, 'Prénom').min(1, 'Indiquez votre prénom.'),
  structure: texto(120, 'Structure'),
  email: z.string().trim().toLowerCase().max(200, 'Email : 200 caractères maximum.').pipe(z.email({ error: 'Vérifiez votre email : il ne semble pas valide.' })),
  produit: texto(200, 'Produit'),
  avis: texto(MAX_CARACTERES, 'Votre avis').min(10, 'Écrivez quelques mots sur votre commande (10 caractères au moins).'),
  publier: z.boolean(),
  afficherPrenom: z.boolean(),
  afficherStructure: z.boolean(),
  privacidad: z.literal(true, { error: 'Cochez la case de confidentialité pour envoyer votre avis.' }),
});

type Avis = z.infer<typeof esquemaAvis>;

const ECHEC = 'Oups, votre avis n’est pas parti. Rien n’est perdu : votre texte est conservé. Réessayez dans un instant ou envoyez-le-nous sur WhatsApp.';

function lire(fd: FormData) {
  const v = (cle: string) => {
    const x = fd.get(cle);
    return typeof x === 'string' ? x : '';
  };
  const coche = (cle: string) => fd.get(cle) === 'on';
  return {
    prenom: v('prenom'),
    structure: v('structure'),
    email: v('email'),
    produit: v('produit'),
    avis: v('avis'),
    publier: coche('publier'),
    afficherPrenom: coche('afficher_prenom'),
    afficherStructure: coche('afficher_structure'),
    privacidad: coche('privacidad'),
  };
}

/** Le nom à reporter dans la colonne « empresa » de la feuille : seulement ce que le client a accepté d'afficher. */
function nomAutorise(a: Avis): string {
  const morceaux = [a.afficherPrenom ? a.prenom : '', a.afficherStructure ? a.structure : ''].filter(Boolean);
  return morceaux.join(', ');
}

function correoEquipo(a: Avis, fecha: string) {
  const nom = nomAutorise(a);
  const oui = (b: boolean) => (b ? 'OUI' : 'NON');
  const lignes: [string, string][] = [
    ['Prénom', a.prenom],
    ['Structure', a.structure || '—'],
    ['Email (jamais publié)', a.email],
    ['Produit ou commande', a.produit || '—'],
    ['Accepte la publication', oui(a.publier)],
    ['Accepte l’affichage du prénom', oui(a.afficherPrenom)],
    ['Accepte l’affichage de la structure', a.structure ? oui(a.afficherStructure) : '—'],
  ];
  const feuille: [string, string][] = [
    ['empresa', nom],
    ['opinion', a.avis],
    ['mostrar_nombre', nom ? 'SI' : 'NO'],
    ['publicar', a.publier ? 'SI' : 'NO'],
    ['fecha', fecha],
  ];
  const asunto = `Nouvel avis client : ${a.prenom}${a.structure ? ` (${a.structure})` : ''}${a.publier ? '' : ' · ne pas publier'}`;
  const tableau = (l: [string, string][]) =>
    `<table cellpadding="6" style="border-collapse:collapse">${l
      .map(([k, v]) => `<tr><th align="left" style="vertical-align:top">${escapar(k)}</th><td>${escapar(v).replace(/\n/g, '<br>')}</td></tr>`)
      .join('')}</table>`;
  const html = `<p>Un client vient de laisser un avis sur le site.</p>
<blockquote style="border-left:4px solid #6106e2;margin:0;padding:8px 12px">${escapar(a.avis).replace(/\n/g, '<br>')}</blockquote>
${tableau(lignes)}
<p><strong>À recopier dans la feuille des avis (onglet « Web »)${a.publier ? '' : ' : le client n’a pas accepté la publication, publicar = NO'}</strong></p>
${tableau(feuille)}`;
  const texte = [
    'Un client vient de laisser un avis sur le site.',
    '',
    a.avis,
    '',
    ...lignes.map(([k, v]) => `${k} : ${v}`),
    '',
    'À recopier dans la feuille des avis (onglet « Web ») :',
    ...feuille.map(([k, v]) => `${k} : ${v}`),
  ].join('\n');
  return { asunto, html, texte };
}

export async function envoyerAvis(_precedent: EtatAvis, fd: FormData): Promise<EtatAvis> {
  try {
    const cabeceras = await headers();
    // Antispam : au robot on répond « merci » sans rien envoyer ; à la personne on explique.
    if (esRobot(fd)) return { estado: 'ok' };
    if (!tiempoSuficiente(fd)) {
      return { estado: 'error', mensaje: 'Le formulaire a été envoyé un peu trop vite. Relisez votre avis et cliquez de nouveau sur « Envoyer mon avis ».' };
    }
    const limite = anotarEnvio(ipDe(cabeceras));
    if (!limite.permitido) {
      return { estado: 'error', mensaje: `Vous avez fait plusieurs envois d’affilée. Patientez ${limite.esperaMinutos ?? 10} minutes ou écrivez-nous sur WhatsApp.` };
    }

    const datos = esquemaAvis.safeParse(lire(fd));
    if (!datos.success) {
      const campos: Record<string, string> = {};
      for (const issue of datos.error.issues) {
        const campo = String(issue.path[0] ?? '');
        if (campo && !campos[campo]) campos[campo] = issue.message;
      }
      return { estado: 'error', mensaje: 'Vérifiez ces champs avant d’envoyer :', campos };
    }

    const fecha = new Date().toISOString().slice(0, 10);
    const correo = correoEquipo(datos.data, fecha);
    await enviarCorreo({
      para: destinoEquipo(),
      deNombre: SITE.nombre,
      asunto: correo.asunto,
      html: correo.html,
      texto: correo.texte,
      responderA: { nombre: datos.data.prenom, email: datos.data.email },
    });
    return { estado: 'ok' };
  } catch (error) {
    console.error('[avis] envoi impossible :', error instanceof Error ? error.message : error);
    return { estado: 'error', mensaje: ECHEC };
  }
}
