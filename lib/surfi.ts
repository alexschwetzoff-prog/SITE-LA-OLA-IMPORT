// Surfi révèle la nouvelle couleur (remplace lib/ovni.ts de la base). Au clic sur une pastille de couleur, Surfi
// traverse la photo de gauche à droite sur sa vague en tournant sur lui-même (4 vues : face, trois-quarts, profil,
// dos) et un volet (clip-path) révèle la nouvelle couleur juste derrière sa planche.
//
// Règles (brief La Ola Import) :
//   - 1,6 s au total, jamais plus de 2 s (coupe-circuit à 2 000 ms) ;
//   - n'anime que transform, opacity et clip-path (aucun reflow, CLS 0) ; la scène ne capte aucun clic ;
//   - un nouveau clic annule l'animation en cours (`cancelar`) et la nouvelle démarre aussitôt, sans file d'attente ;
//   - prefers-reduced-motion, interrupteur « Animations » désactivé ou images pas prêtes à temps → simple fondu de 150 ms ;
//   - les images (un sprite WebP de 4 vues, 80 Ko) ne sont chargées qu'au premier survol, focus ou appui sur une
//     pastille (`prechargerSurfi`), jamais au chargement de la page ;
//   - sans JavaScript, les pastilles restent des liens : la couleur change simplement.
//
// La couche de la nouvelle photo naît masquée (`.surfi-capa-nueva` : clip-path à 100 %). Le studio (canvas) utilise
// `progresoCambio` pour dessiner le même volet dans son lienzo.

export const SPRITE_SURFI = '/marca/surfi/surfi-rotation.webp';

export const DURACION_SURFI = {
  total: 1600,
  entrada: 150, // Surfi apparaît à gauche
  salida: 250, // il sort à droite en fondu
  fundido: 150, // mouvement réduit : fondu simple
  securite: 2000, // coupe-circuit absolu
} as const;

/** Fenêtre du volet (ms depuis le début) : il suit la planche de Surfi. */
export const CAMBIO_SURFI = { inicio: 150, fin: 1350 } as const;

/** Instants (ms) où Surfi passe à la vue suivante du sprite : face → trois-quarts → profil → dos. */
export const VUES_SURFI = [0, 450, 750, 1050] as const;

/** Courbe commune au trajet et au volet, pour que le bord du volet reste collé à la planche. */
const COURBE = 'cubic-bezier(.45,.05,.55,.95)';

const CLE_INTERRUPTEUR = 'laola:surfi';

function suave(t: number): number {
  return t <= 0 ? 0 : t >= 1 ? 1 : t * t * (3 - 2 * t);
}

/** Avancement du volet (0 à 1) à `ms` du début : pour le studio, qui dessine le volet dans son lienzo. */
export function progresoCambio(ms: number): number {
  return suave((ms - CAMBIO_SURFI.inicio) / (CAMBIO_SURFI.fin - CAMBIO_SURFI.inicio));
}

export function movimientoReducido(): boolean {
  return typeof window !== 'undefined' && window.matchMedia('(prefers-reduced-motion: reduce)').matches;
}

/** L'utilisateur a-t-il coupé les animations avec l'interrupteur de la fiche ? */
export function surfiDesactive(): boolean {
  try {
    return typeof window !== 'undefined' && window.localStorage.getItem(CLE_INTERRUPTEUR) === 'off';
  } catch {
    return false;
  }
}

export function definirSurfi(actif: boolean) {
  try {
    if (actif) window.localStorage.removeItem(CLE_INTERRUPTEUR);
    else window.localStorage.setItem(CLE_INTERRUPTEUR, 'off');
  } catch {
    /* stockage indisponible : l'interrupteur vaut pour la session */
  }
}

let prechargement: Promise<boolean> | null = null;

/** Charge et décode le sprite une seule fois (au premier survol / focus / appui sur une pastille). */
export function prechargerSurfi(): Promise<boolean> {
  if (typeof window === 'undefined') return Promise.resolve(false);
  if (!prechargement) {
    const img = new window.Image();
    img.src = SPRITE_SURFI;
    prechargement = img.decode().then(
      () => true,
      () => false,
    );
  }
  return prechargement;
}

/** Surfi prêt maintenant ? (décodé avant l'appel, ou dans les 150 ms qui suivent) */
async function pret(): Promise<boolean> {
  const delai = new Promise<boolean>((r) => window.setTimeout(() => r(false), 150));
  return Promise.race([prechargerSurfi(), delai]);
}

export interface Reveal {
  /** Coupe l'animation net (la nouvelle couche reste visible en entier) sans appeler `alFinal`. */
  cancelar: () => void;
}

/** Les éléments de components/producto/Surfi.tsx. */
export interface ElementosSurfi {
  /** Le conteneur qui traverse la photo (Surfi + sa vague). */
  voyageur: HTMLElement;
  /** La bande du sprite (4 vues côte à côte) que l'on décale pour changer de vue. */
  bande: HTMLElement;
}

interface Opciones {
  surfi: ElementosSurfi | null;
  /** Couche de la nouvelle photo : révélée par le volet. Optionnelle (le studio dessine dans son lienzo). */
  capa?: HTMLElement | null;
  reducido?: boolean;
  alFinal?: () => void;
}

/** Lance la révélation. Renvoie le contrôle pour l'annuler. */
export function revelar({ surfi, capa, reducido = movimientoReducido() || surfiDesactive(), alFinal }: Opciones): Reveal {
  const animaciones: Animation[] = [];
  const minuteurs: number[] = [];
  let viva = true;

  const limpiar = () => {
    for (const a of animaciones) a.cancel();
    animaciones.length = 0;
    for (const m of minuteurs) window.clearTimeout(m);
    if (surfi) {
      surfi.voyageur.style.opacity = '';
      surfi.voyageur.style.transform = '';
      surfi.bande.style.transform = '';
    }
    if (capa) {
      capa.style.clipPath = '';
      capa.style.opacity = '';
    }
  };
  const terminar = () => {
    if (!viva) return;
    viva = false;
    alFinal?.();
    // nettoyage après que React a retiré l'ancienne couche, sinon la nouvelle « renaîtrait » masquée une image
    requestAnimationFrame(() => requestAnimationFrame(limpiar));
  };
  const controle: Reveal = {
    cancelar: () => {
      viva = false;
      limpiar();
    },
  };

  const fondu = () => {
    if (capa && 'animate' in capa) {
      capa.style.clipPath = 'none';
      const a = capa.animate([{ opacity: 0 }, { opacity: 1 }], { duration: DURACION_SURFI.fundido, easing: 'ease-out', fill: 'forwards' });
      animaciones.push(a);
      a.finished.then(terminar).catch(() => {});
    } else {
      minuteurs.push(window.setTimeout(terminar, DURACION_SURFI.fundido));
    }
  };

  if (reducido || !surfi || !('animate' in surfi.voyageur)) {
    fondu();
    return controle;
  }

  void pret().then((ok) => {
    if (!viva) return;
    if (!ok) return fondu();
    const { voyageur, bande } = surfi;
    const T = DURACION_SURFI.total;
    const largeur = voyageur.parentElement?.getBoundingClientRect().width || 300;
    const lui = voyageur.getBoundingClientRect().width || largeur * 0.37;

    // 1. Le trajet : de la gauche (hors cadre) à la droite (hors cadre), même courbe que le volet.
    const depart = -lui * 0.9;
    const arrivee = largeur + lui * 0.1;
    animaciones.push(
      voyageur.animate(
        [
          { transform: `translateX(${depart}px) translateY(6%)`, opacity: 0, offset: 0 },
          { opacity: 1, offset: DURACION_SURFI.entrada / T },
          { transform: `translateX(${arrivee - lui * 0.35}px) translateY(-2%)`, opacity: 1, offset: CAMBIO_SURFI.fin / T },
          { transform: `translateX(${arrivee}px) translateY(-4%)`, opacity: 0, offset: 1 },
        ],
        { duration: T, easing: COURBE, fill: 'forwards' },
      ),
    );

    // 2. Le volet : la nouvelle couleur apparaît de gauche à droite, juste derrière la planche.
    if (capa) {
      animaciones.push(
        capa.animate([{ clipPath: 'inset(0 100% 0 0)' }, { clipPath: 'inset(0 0% 0 0)' }], {
          delay: CAMBIO_SURFI.inicio,
          duration: CAMBIO_SURFI.fin - CAMBIO_SURFI.inicio,
          easing: COURBE,
          fill: 'both',
        }),
      );
    }

    // 3. La rotation : on décale la bande du sprite (pas de changement de src, donc aucun clignotement).
    VUES_SURFI.forEach((t, i) => {
      minuteurs.push(
        window.setTimeout(() => {
          bande.style.transform = `translateX(${-i * 25}%)`;
        }, t),
      );
    });

    animaciones[0].finished.then(terminar).catch(() => {});
    minuteurs.push(window.setTimeout(terminar, DURACION_SURFI.securite)); // coupe-circuit
  });

  return controle;
}
