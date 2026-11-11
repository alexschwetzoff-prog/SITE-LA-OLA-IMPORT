// Surfi révèle la nouvelle couleur sur la photo du vêtement. Au clic sur une pastille, il fait le TOUR du cadre de la
// photo sur sa vague : il longe le bas, remonte le côté droit, longe le haut et redescend le côté gauche, en pivotant
// à chaque bord (posé sur sa vague, orienté dans le sens du déplacement). Derrière lui, la nouvelle couleur se dévoile
// en éventail depuis le centre de la photo : quand il a bouclé le tour, la photo est entièrement dans la nouvelle
// couleur.
//
// Technique :
//   - le trajet est un `offset-path` (rectangle arrondi calculé en px d'après le cadre) et `offset-rotate: auto` fait
//     pivoter Surfi tout seul dans chaque virage ; on n'anime que `offset-distance` (pipeline de transform) et
//     `opacity`, dans une seule boucle requestAnimationFrame qui pilote aussi le dévoilement (clip-path) : tout reste
//     synchronisé ;
//   - la vague sous ses pieds ondule en CSS (transform seulement) ;
//   - onglet caché pendant l'animation → on termine aussitôt (changement direct) ;
//   - prefers-reduced-motion, interrupteur « Animation » coupé, ou image pas prête à temps → simple fondu de 150 ms ;
//   - le sprite (4 vues, 80 Ko) n'est chargé qu'au premier survol, focus ou appui sur une pastille ;
//   - un nouveau clic annule l'animation en cours (`cancelar`) et la nouvelle démarre aussitôt.
//
// La couche de la nouvelle photo naît masquée (`.surfi-capa-nueva`). Le studio (canvas) dessine le même éventail
// avec `poligonoBarrido` et `progresoCambio`.

export const SPRITE_SURFI = '/marca/surfi/surfi-rotation.webp';

export const DURACION_SURFI = {
  total: 2400, // un tour complet du cadre : fluide sans traîner (réglable ici)
  entrada: 180, // apparition (fondu)
  salida: 220, // disparition (fondu)
  fundido: 150, // mouvement réduit : fondu simple
  securite: 3000, // coupe-circuit absolu
} as const;

/** Fenêtre du dévoilement (ms depuis le début) : c'est la durée du tour. */
export const CAMBIO_SURFI = { inicio: 0, fin: DURACION_SURFI.total } as const;

/** Vues du sprite : 0 face, 1 trois-quarts, 2 profil (de côté, dans le sens de la marche), 3 dos. */
const VUE_SELON_TEMPS = (ms: number, total: number): number => (ms < 140 ? 0 : ms < 300 ? 1 : ms < total - 300 ? 2 : ms < total - 140 ? 1 : 0);

const CLE_INTERRUPTEUR = 'laola:surfi';

/** Courbe douce : démarre et finit en douceur, vitesse régulière au milieu. */
function douce(t: number): number {
  if (t <= 0) return 0;
  if (t >= 1) return 1;
  return t < 0.5 ? 4 * t * t * t : 1 - Math.pow(-2 * t + 2, 3) / 2;
}

/** Avancement du tour (0 à 1) à `ms` du début : sert au studio pour dessiner l'éventail. */
export function progresoCambio(ms: number): number {
  return douce((ms - CAMBIO_SURFI.inicio) / (CAMBIO_SURFI.fin - CAMBIO_SURFI.inicio));
}

/** Marge entre le bord du cadre et le trajet de Surfi (px). */
export function margeTrajet(largeur: number, hauteur: number): number {
  return Math.round(Math.min(largeur, hauteur) * 0.035);
}

/** Rayon des virages du trajet (px). */
function rayon(largeur: number, hauteur: number): number {
  return Math.round(Math.min(largeur, hauteur) * 0.08);
}

/**
 * Trajet en rectangle arrondi, dans le sens bas → droite → haut → gauche (sens inverse des aiguilles d'une montre à
 * l'écran). Départ en bas à gauche ; avec `offset-rotate: auto`, Surfi a les pieds vers le bord extérieur partout.
 */
export function trajet(largeur: number, hauteur: number): string {
  const m = margeTrajet(largeur, hauteur);
  const r = rayon(largeur, hauteur);
  const g = m, d = largeur - m, h = m, b = hauteur - m;
  return [
    `M ${g + r} ${b}`,
    `L ${d - r} ${b}`,
    `A ${r} ${r} 0 0 0 ${d} ${b - r}`,
    `L ${d} ${h + r}`,
    `A ${r} ${r} 0 0 0 ${d - r} ${h}`,
    `L ${g + r} ${h}`,
    `A ${r} ${r} 0 0 0 ${g} ${h + r}`,
    `L ${g} ${b - r}`,
    `A ${r} ${r} 0 0 0 ${g + r} ${b}`,
    'Z',
  ].join(' ');
}

/**
 * Éventail déjà dévoilé quand Surfi a parcouru la fraction `p` du tour : polygone (en px) qui part du centre, passe
 * par le point de départ, les coins déjà passés et la position actuelle. À p = 1, c'est tout le cadre.
 */
export function poligonoBarrido(p: number, largeur: number, hauteur: number): [number, number][] {
  const W = largeur, H = hauteur;
  const centre: [number, number] = [W / 2, H / 2];
  // le même tour que le trajet, ramené sur les bords du cadre (le dévoilement couvre tout le cadre)
  const depart: [number, number] = [0, H];
  const sommets: [number, number][] = [[W, H], [W, 0], [0, 0], [0, H]];
  const longueurs = [W, H, W, H];
  const total = 2 * (W + H);
  let reste = Math.max(0, Math.min(1, p)) * total;
  const points: [number, number][] = [centre, depart];
  let courant = depart;
  for (let i = 0; i < 4 && reste > 0; i++) {
    const [x1, y1] = sommets[i];
    const l = longueurs[i];
    if (reste >= l) {
      points.push([x1, y1]);
      courant = [x1, y1];
      reste -= l;
    } else {
      const k = reste / l;
      points.push([courant[0] + (x1 - courant[0]) * k, courant[1] + (y1 - courant[1]) * k]);
      reste = 0;
    }
  }
  return points;
}

export function movimientoReducido(): boolean {
  return typeof window !== 'undefined' && window.matchMedia('(prefers-reduced-motion: reduce)').matches;
}

/** L'utilisateur a-t-il coupé l'animation avec l'interrupteur de la fiche ? */
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
    /* stockage indisponible : l'interrupteur ne sera pas mémorisé */
  }
  window.dispatchEvent(new Event(CLE_INTERRUPTEUR));
}

/** Abonnement pour useSyncExternalStore : l'interrupteur change (cet onglet ou un autre). */
export function abonnerSurfi(rappel: () => void): () => void {
  window.addEventListener(CLE_INTERRUPTEUR, rappel);
  window.addEventListener('storage', rappel);
  return () => {
    window.removeEventListener(CLE_INTERRUPTEUR, rappel);
    window.removeEventListener('storage', rappel);
  };
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
  /** Le conteneur qui suit le trajet (Surfi + sa vague). */
  voyageur: HTMLElement;
  /** La bande du sprite (4 vues côte à côte) que l'on décale pour changer de vue. */
  bande: HTMLElement;
}

interface Opciones {
  surfi: ElementosSurfi | null;
  /** Couche de la nouvelle photo : dévoilée en éventail. Optionnelle (le studio dessine dans son lienzo). */
  capa?: HTMLElement | null;
  reducido?: boolean;
  alFinal?: () => void;
}

/** Lance la révélation. Renvoie le contrôle pour l'annuler. */
export function revelar({ surfi, capa, reducido = movimientoReducido() || surfiDesactive(), alFinal }: Opciones): Reveal {
  const animaciones: Animation[] = [];
  const minuteurs: number[] = [];
  let image = 0;
  let viva = true;

  const limpiar = () => {
    for (const a of animaciones) a.cancel();
    animaciones.length = 0;
    for (const m of minuteurs) window.clearTimeout(m);
    if (image) cancelAnimationFrame(image);
    document.removeEventListener('visibilitychange', siCache);
    if (surfi) {
      surfi.voyageur.style.opacity = '';
      surfi.voyageur.style.offsetPath = '';
      surfi.voyageur.style.offsetDistance = '';
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
  // onglet caché : les images ne défilent plus, on termine tout de suite
  function siCache() {
    if (document.hidden) {
      if (capa) capa.style.clipPath = 'none';
      terminar();
    }
  }
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

  if (reducido || !surfi || typeof CSS === 'undefined' || !CSS.supports('offset-path', 'path("M 0 0")')) {
    fondu();
    return controle;
  }

  void pret().then((ok) => {
    if (!viva) return;
    if (!ok) return fondu();
    const { voyageur, bande } = surfi;
    const cadre = voyageur.parentElement?.getBoundingClientRect();
    const W = cadre?.width || 300;
    const H = cadre?.height || W;
    voyageur.style.offsetPath = `path("${trajet(W, H)}")`;
    voyageur.style.offsetDistance = '0%';
    document.addEventListener('visibilitychange', siCache);

    const T = DURACION_SURFI.total;
    const debut = performance.now();
    let vue = -1;
    const pas = (maintenant: number) => {
      if (!viva) return;
      const ms = maintenant - debut;
      const p = progresoCambio(ms);
      // 1. le trajet et l'apparition / disparition
      voyageur.style.offsetDistance = `${(p * 100).toFixed(3)}%`;
      const o = Math.min(1, ms / DURACION_SURFI.entrada, (T - ms) / DURACION_SURFI.salida);
      voyageur.style.opacity = String(Math.max(0, o));
      // 2. la vue du sprite (on ne touche au style que quand elle change)
      const v = VUE_SELON_TEMPS(ms, T);
      if (v !== vue) {
        vue = v;
        bande.style.transform = `translateX(${-v * 25}%)`;
      }
      // 3. le dévoilement en éventail, derrière Surfi
      if (capa) {
        const pts = poligonoBarrido(p, W, H).map(([x, y]) => `${((x / W) * 100).toFixed(2)}% ${((y / H) * 100).toFixed(2)}%`);
        capa.style.clipPath = p >= 1 ? 'none' : `polygon(${pts.join(',')})`;
      }
      if (ms < T) image = requestAnimationFrame(pas);
      else terminar();
    };
    image = requestAnimationFrame(pas);
    minuteurs.push(window.setTimeout(() => {
      if (capa) capa.style.clipPath = 'none';
      terminar();
    }, DURACION_SURFI.securite)); // coupe-circuit
  });

  return controle;
}
