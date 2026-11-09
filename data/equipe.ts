// L'équipe de La Ola Import. Photos RÉELLES uniquement (pas d'IA ni de banque d'images) : tant qu'elles manquent, le
// site affiche un emplacement « [photo à fournir] ». Prénoms et rôles confirmés : Stéphane (dirigeant) et Arthur
// (technicien). Phrases personnelles et autres membres : [à fournir] (avec l'accord de chacun pour le droit à l'image).

export interface Membre {
  prenom: string;
  role: string;
  phrase: string;
  specialite: string;
  /** Chemin de la photo réelle (4:5, 800 × 1000) une fois fournie. */
  photo?: string;
}

export const EQUIPE: Membre[] = [
  {
    prenom: 'Stéphane',
    role: 'Dirigeant',
    phrase: '[Phrase personnelle à fournir]',
    specialite: 'Conseil, devis et suivi de vos projets',
  },
  {
    prenom: 'Arthur',
    role: 'Technicien',
    phrase: '[Phrase personnelle à fournir]',
    specialite: 'Impression DTF et UV, finitions',
  },
];

/** Les étapes d'un projet, de l'idée à la pièce finie. Délais : [à confirmer]. */
export const ETAPES = [
  { titre: 'Vous nous envoyez votre idée', texte: 'Un logo, un croquis ou simplement une envie : on part de là.' },
  { titre: 'Nous vous conseillons', texte: 'Le bon support, la bonne technique, le bon emplacement, selon votre usage et votre budget.' },
  { titre: 'Vous validez le visuel', texte: 'Vous recevez un BAT (bon à tirer) : rien n’est imprimé sans votre accord.' },
  { titre: 'Nous fabriquons à Monteux', texte: 'Impression dans notre atelier, contrôle de chaque pièce.' },
  { titre: 'Retrait ou livraison', texte: 'À l’atelier ou chez vous : modalités [à confirmer].' },
] as const;
