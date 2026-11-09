// Moteur générique des demandes (panier /projet et devis /devis) : ce que partagent le formulaire (navigateur), l'action
// serveur (app/projet/acciones.ts) et les emails : listes d'options, types du panier tel qu'il voyage vers le serveur,
// clés du FormData et limites de taille. Sans 'use client'. Les identifiants restent en espagnol ; les libellés
// visibles sont en français.

export const TRAMO_IDS = ['<25', '25-50', '50-150', '150+'] as const;
export type Tramo = (typeof TRAMO_IDS)[number];
/** Tranches de quantité indicatives (panier, formulaire de l'accueil). Aucun minimum n'est promis ici. */
export const TRAMOS: readonly { id: Tramo; nombre: string }[] = [
  { id: '<25', nombre: 'Moins de 25' },
  { id: '25-50', nombre: '25 à 50' },
  { id: '50-150', nombre: '50 à 150' },
  { id: '150+', nombre: 'Plus de 150' },
];
export const TRAMO_POR_DEFECTO: Tramo = '25-50';

/** Type de client : change les champs du formulaire et voyage avec la demande. */
export const TIPOS_CLIENTE = ['particulier', 'entreprise', 'club', 'camping', 'boutique', 'association'] as const;
export type TipoCliente = (typeof TIPOS_CLIENTE)[number];
export const TIPOS: readonly { id: TipoCliente; nombre: string }[] = [
  { id: 'particulier', nombre: 'Particulier' },
  { id: 'entreprise', nombre: 'Entreprise' },
  { id: 'club', nombre: 'Club sportif' },
  { id: 'camping', nombre: 'Camping' },
  { id: 'boutique', nombre: 'Boutique touristique' },
  { id: 'association', nombre: 'Association' },
];
export const TIPO_POR_DEFECTO: TipoCliente = 'particulier';
/** Tout sauf le particulier : on demande le nom de la structure et l'usage. */
export function esProfesional(tipo: TipoCliente | undefined): boolean {
  return Boolean(tipo) && tipo !== 'particulier';
}

export const CONTACTO_IDS = ['whatsapp', 'llamada', 'email'] as const;
export type Contacto = (typeof CONTACTO_IDS)[number];
export const CONTACTOS: readonly { id: Contacto; nombre: string }[] = [
  { id: 'email', nombre: 'Email' },
  { id: 'llamada', nombre: 'Téléphone' },
  { id: 'whatsapp', nombre: 'WhatsApp' },
];
export const CONTACTO_POR_DEFECTO: Contacto = 'email';

export const USO_IDS = ['venta-local', 'packs', 'equipo', 'evento'] as const;
export type Uso = (typeof USO_IDS)[number];
export const USOS: readonly { id: Uso; nombre: string }[] = [
  { id: 'venta-local', nombre: 'Revente en boutique' },
  { id: 'packs', nombre: 'Cadeaux clients' },
  { id: 'equipo', nombre: 'Tenues d’équipe' },
  { id: 'evento', nombre: 'Événement' },
];

/** Champs B2B facultatifs (formulaire /devis) : technique souhaitée. */
export const TECNICA_IDS = ['dtf', 'uv', 'broderie', 'conseil'] as const;
export type Tecnica = (typeof TECNICA_IDS)[number];
export const TECNICAS: readonly { id: Tecnica; nombre: string }[] = [
  { id: 'dtf', nombre: 'DTF (transfert sur textile)' },
  { id: 'uv', nombre: 'Impression UV (objets)' },
  { id: 'broderie', nombre: 'Broderie [à confirmer]' },
  { id: 'conseil', nombre: 'Je ne sais pas, conseillez-moi' },
];

/** D'où vient la demande : le panier (/projet) ou le formulaire de devis (/devis). Sert au sujet de l'email interne. */
export const FORMULARIO_IDS = ['projet', 'devis'] as const;
export type Formulario = (typeof FORMULARIO_IDS)[number];

export function nombreDe(lista: readonly { id: string; nombre: string }[], id: string | undefined): string {
  return lista.find((x) => x.id === id)?.nombre ?? id ?? '';
}
export function nombreTramo(tramo: string): string {
  return nombreDe(TRAMOS, tramo);
}

/** Antispam sin terceros: campo trampa oculto (tiene que llegar vacío) y hora de carga del formulario. */
export const CAMPO_TRAMPA = 'sitio_web';
export const CAMPO_INICIO = 'inicio';
/** Un envío en menos de este tiempo desde que se cargó el formulario no es de una persona. */
export const TIEMPO_MINIMO_MS = 5000;

/**
 * Límite de adjuntos por envío: 4 MB en total. Las funciones de Netlify cortan el cuerpo de cada petición en 6 MB ya
 * codificado en base64 (unos 4,5 MB reales; Vercel corta en 4,5 MB), así que el formulario deja 4 MB para el logo,
 * las capturas y los archivos (el resto es margen para los campos). Las capturas se comprimen en el navegador hasta
 * caber; el logo original no se toca salvo que él solo no quepa.
 */
export const MAX_ENVIO_BYTES = 4 * 1024 * 1024;
/** Tope de Gmail por email (adjuntos incluidos). Con el límite anterior nunca se alcanza, pero se comprueba igual. */
export const MAX_CORREO_BYTES = 25 * 1024 * 1024;

export function formatoBytes(n: number): string {
  if (n < 1024) return `${n} o`;
  if (n < 1024 * 1024) return `${Math.round(n / 1024)} Ko`;
  return `${(n / 1024 / 1024).toLocaleString('fr-FR', { maximumFractionDigits: 1 })} Mo`;
}

export type Lado = 'delante' | 'detras';
export const LADOS: readonly Lado[] = ['delante', 'detras'];
export function nombreLado(lado: Lado): string {
  return lado === 'delante' ? 'Devant' : 'Derrière';
}

export interface ColocacionLinea {
  posicion: string;
  nombre: string;
  lado?: Lado; // fase 10: qué logo lleva
  anchoCm: number;
  altoCm: number;
}
export interface LogoLinea {
  nombre: string;
  ancho: number;
  alto: number;
  vectorial: boolean;
  fondoQuitado: boolean;
}
export interface DisenoLinea {
  fecha: string;
  logo: LogoLinea; // el delantero
  logoId?: string | null;
  logoDetras?: LogoLinea; // fase 10: el trasero, si el cliente subió otro
  logoIdDetras?: string | null;
  colocaciones: ColocacionLinea[];
}

/** « avant » / « arrière », pour les textes (« le logo avant »). */
export function nombreLogo(lado: Lado): string {
  return lado === 'delante' ? 'avant' : 'arrière';
}
/** « devant » / « derriere » (sans accent), pour les noms de fichiers joints. */
export function sufijoArchivo(lado: Lado): string {
  return lado === 'delante' ? 'devant' : 'derriere';
}
/** Una línea de la cesta tal como viaja al servidor (sin las capturas: esas van como archivos). */
export interface LineaCesta {
  id: string;
  slug: string;
  nombre: string;
  tipo: string;
  color: { nombre: string; hex: string; hexSecundario?: string };
  tramo: Tramo;
  posiciones?: { posicion: string; nombre: string }[];
  diseno?: DisenoLinea;
}

/** « Cœur + Dos A4 » : las posiciones de una línea (las del estudio o las elegidas en la ficha). */
export function textoPosicionesLinea(linea: Pick<LineaCesta, 'posiciones' | 'diseno'>): string {
  const nombres = linea.diseno?.colocaciones.map((c) => c.nombre) ?? linea.posiciones?.map((p) => p.nombre) ?? [];
  return nombres.join(' + ');
}

/** Claves del FormData del envío. Los índices son los de la línea en la cesta. */
export const CLAVE_CESTA = 'cesta';
export const CLAVE_AVISOS = 'avisos';
export const CLAVE_ARCHIVOS = 'archivos';
/** El logo delantero conserva la clave de la fase 6 (`logo_N`); el trasero lleva su sufijo (fase 10). */
export const claveLogo = (indice: number, lado: Lado = 'delante') => (lado === 'delante' ? `logo_${indice}` : `logo_${indice}_detras`);
export const claveCaptura = (indice: number, lado: Lado) => `captura_${indice}_${lado}`;
