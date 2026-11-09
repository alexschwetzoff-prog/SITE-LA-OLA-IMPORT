// Ajustes del cielo en movimiento (fase 4.6): todas las velocidades, frecuencias y densidades en un solo sitio.
// Lo lee lib/cielo.ts. Unidades: ms, px CSS, y «z» para la profundidad (1 = fondo, 0 = pegado al cristal).

export const CIELO = {
  /** Capas de estrellas, de lejos a cerca. `densidad`: estrellas visibles por megapíxel CSS (en móvil se multiplica
   * por `movil.factorEstrellas`). `velocidad`: multiplicador del avance de esa capa (más cerca, más rápido). */
  capas: [
    { zMin: 0.66, zMax: 1.0, densidad: 130, tam: [0.45, 0.9], alfa: 0.38, velocidad: 0.55 },
    { zMin: 0.33, zMax: 0.66, densidad: 80, tam: [0.7, 1.3], alfa: 0.6, velocidad: 1.0 },
    { zMin: 0.1, zMax: 0.33, densidad: 55, tam: [1.0, 2.0], alfa: 0.9, velocidad: 1.9 },
  ],
  /** Avance base hacia quien mira, en unidades de z por segundo (la capa media; las otras lo multiplican). */
  velocidadBase: 0.022,
  /** Cuánto acelera el scroll: z por segundo extra por cada px/ms de scroll, y tope del extra. */
  impulsoScroll: 0.09,
  impulsoMaximo: 0.07,
  /** Suavizado de la velocidad de scroll (0-1: más alto, respuesta más rápida) y del impulso de cambio de página. */
  suavizadoScroll: 0.12,
  /** Estela corta en las estrellas rápidas: a partir de esta capa (índice) y hasta esta longitud en px. */
  estela: { desdeCapa: 2, longitudMaxima: 14, umbralPxPorFotograma: 1.2 },
  /** Constelaciones: cada cuánto se intenta una nueva, cuántas a la vez, cuánto duran y alfa de sus líneas. */
  constelaciones: { cadaMin: 6000, cadaMax: 12000, maximo: 2, duracionMin: 7000, duracionMax: 11000, alfa: 0.22 },
  /** Estrellas fugaces: cada 3-8 s una estela brillante que cruza en diagonal en menos de 1 s; como mucho dos. */
  fugaces: { cadaMin: 3000, cadaMax: 8000, maximo: 2, duracionMin: 550, duracionMax: 900, longitud: [140, 260], grosor: 1.6, alfa: 0.75 },
  /** Cruces rápidos del OVNI mascota (vista lateral): cada 20-40 s, 2-3 s, con estela; nunca más de uno. */
  cruces: { cadaMin: 20000, cadaMax: 40000, duracionMin: 2000, duracionMax: 3000, escala: 0.46, escalaMovil: 0.34 },
  /** Sobrevuelos con calma (vista 3/4, luces latiendo y balanceo): cada 10-20 s, 4-6 s; entra, flota y sale. Evita el
   * texto principal y los botones de la primera pantalla (zonas que le pasa StarField); si no hay hueco, va por los
   * márgenes. `margen`: separación mínima a esas zonas, en px. */
  sobrevuelos: { cadaMin: 10000, cadaMax: 20000, duracionMin: 4000, duracionMax: 6000, escala: 0.6, escalaMovil: 0.42, margen: 28, margenMovil: 12, balanceoPx: 6, fotogramasPorSegundo: 11 },
  /** Móvil (ancho < 768): menos estrellas. */
  movil: { factorEstrellas: 0.5 },
  /** Primer cruce y primer sobrevuelo tras arrancar (ms). */
  arranque: { primerCruceMin: 9000, primerCruceMax: 20000, primerSobrevueloMin: 4000, primerSobrevueloMax: 9000 },
} as const;
