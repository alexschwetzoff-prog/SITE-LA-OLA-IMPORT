// Fase 6: lo que comparten el formulario (navegador), la acción de servidor y los emails de la solicitud: listas de
// opciones, tipos de la cesta tal como viaja al servidor, claves del FormData y límites de tamaño. Sin 'use client'.

export const TRAMO_IDS = ['<25', '25-50', '50-150', '150+'] as const;
export type Tramo = (typeof TRAMO_IDS)[number];
/** Tramos de cantidad de la tarifa interna (sección 4 de la spec, paso 2 de /proyecto). */
export const TRAMOS: readonly { id: Tramo; nombre: string }[] = [
  { id: '<25', nombre: 'Menos de 25' },
  { id: '25-50', nombre: '25 a 50' },
  { id: '50-150', nombre: '50 a 150' },
  { id: '150+', nombre: 'Más de 150' },
];
export const TRAMO_POR_DEFECTO: Tramo = '25-50';

export const TIPOS_CLIENTE = ['negocio', 'particular'] as const;
/** Tipo de cliente (fase 4.1): cambia los campos del formulario y viaja con la solicitud. */
export type TipoCliente = (typeof TIPOS_CLIENTE)[number];

export const CONTACTO_IDS = ['whatsapp', 'llamada', 'email'] as const;
export type Contacto = (typeof CONTACTO_IDS)[number];
export const CONTACTOS: readonly { id: Contacto; nombre: string }[] = [
  { id: 'whatsapp', nombre: 'WhatsApp' },
  { id: 'llamada', nombre: 'Llamada' },
  { id: 'email', nombre: 'Email' },
];

export const USO_IDS = ['venta-local', 'packs', 'equipo', 'evento'] as const;
export type Uso = (typeof USO_IDS)[number];
export const USOS: readonly { id: Uso; nombre: string }[] = [
  { id: 'venta-local', nombre: 'Venta en el local' },
  { id: 'packs', nombre: 'Packs para clientes' },
  { id: 'equipo', nombre: 'Equipo' },
  { id: 'evento', nombre: 'Evento' },
];

// Solo ofrecemos ir al local del cliente, en la ciudad de Valencia (decisión del equipo, 12/10/2026): sin videollamada.
export const CITA_IDS = ['no', 'local'] as const;
export type Cita = (typeof CITA_IDS)[number];
export const CITAS: readonly { id: Cita; nombre: string }[] = [
  { id: 'no', nombre: 'No por ahora' },
  { id: 'local', nombre: 'Que vengáis a mi local (ciudad de Valencia)' },
];

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
  if (n < 1024) return `${n} B`;
  if (n < 1024 * 1024) return `${Math.round(n / 1024)} KB`;
  return `${(n / 1024 / 1024).toLocaleString('es-ES', { maximumFractionDigits: 1 })} MB`;
}

export type Lado = 'delante' | 'detras';
export const LADOS: readonly Lado[] = ['delante', 'detras'];
export function nombreLado(lado: Lado): string {
  return lado === 'delante' ? 'Delante' : 'Detrás';
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

/** «delantero» / «trasero», para los nombres de archivo y los textos. */
export function nombreLogo(lado: Lado): string {
  return lado === 'delante' ? 'delantero' : 'trasero';
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

/** «Corazón + Espalda A4»: las posiciones de una línea (las del estudio o las elegidas en la ficha). */
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
