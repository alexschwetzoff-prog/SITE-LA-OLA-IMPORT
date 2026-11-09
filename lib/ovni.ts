// Revelación del color con Novi, el OVNI (fase 10, antes fase 4.2/4.5): al elegir un color, el OVNI aparece de golpe,
// da un remolino alrededor del producto (una espiral que se cierra y sube, como un pequeño tornado, con tres estelas
// de viento), el color cambia durante el remolino y el OVNI se va disparado. Entre 0,8 y 1 s en total.
//
// Reglas (decisión del equipo, fase 10):
//   - solo se animan `transform` y `opacity` (todo va en la capa de composición: sin filtros, sin layout, CLS 0);
//   - si llega otro color durante la animación, `cancelar()` la corta y la nueva empieza al instante, sin encolar y
//     sin bloquear clics (la escena del OVNI no recibe punteros);
//   - con prefers-reduced-motion: sin OVNI, el color cambia con un fundido corto.
//
// Las duraciones viven aquí (DURACION_OVNI, CAMBIO_OVNI); el dibujo, en components/producto/Ovni.tsx y globals.css.
// La capa de la foto nueva (catálogo y ficha) nace con opacidad 0 (`.ovni-capa-nueva`) y se funde durante el
// remolino; el estudio dibuja el mismo fundido en su lienzo con `progresoCambio`.

export const DURACION_OVNI = {
  entrada: 120, // el OVNI aparece (escala y opacidad)
  remolino: 600, // el remolino alrededor del producto
  salida: 150, // el OVNI se va disparado
  fundido: 150, // con movimiento reducido: fundido simple, sin OVNI
} as const;

export const TOTAL_OVNI = DURACION_OVNI.entrada + DURACION_OVNI.remolino + DURACION_OVNI.salida; // 870 ms

/** Ventana del cambio de color, en ms desde el inicio: dentro del remolino, cuando el OVNI ya está a la vista. */
export const CAMBIO_OVNI = { inicio: 220, fin: 620 } as const;

const VUELTAS = 1.5; // vueltas del remolino (grados: 540)
const GIRO_SALIDA = 60; // grados que sigue girando mientras se va
const ELIPSE = 0.5; // la órbita vista en perspectiva: alto / ancho
const RADIO_INICIAL = 0.42; // radio de la órbita al empezar, fracción del ancho del recuadro
const RADIO_FINAL = 0.3; // al acabar el remolino (la espiral se cierra)
const SUBIDA = [0.08, -0.14] as const; // centro de la órbita: de un poco por debajo del centro a por encima (sube)
const SALIDA = [0.45, -0.95] as const; // adónde se va, fracción del ancho y del alto del recuadro

function suave(t: number): number {
  return t <= 0 ? 0 : t >= 1 ? 1 : t * t * (3 - 2 * t);
}

/** Opacidad de la capa nueva (0 a 1) a los `ms` del inicio: 0 antes del cambio, 1 al acabarlo, con curva suave. */
export function progresoCambio(ms: number): number {
  return suave((ms - CAMBIO_OVNI.inicio) / (CAMBIO_OVNI.fin - CAMBIO_OVNI.inicio));
}

export function movimientoReducido(): boolean {
  return typeof window !== 'undefined' && window.matchMedia('(prefers-reduced-motion: reduce)').matches;
}

export interface Reveal {
  /** Corta la animación en seco (la capa nueva queda entera a la vista) sin llamar a `alFinal`. */
  cancelar: () => void;
}

/** Los elementos de la mascota (components/producto/Ovni.tsx). */
export interface ElementosOvni {
  /** Centro de la órbita: gira, sube y se va. */
  orbita: HTMLElement;
  /** Radio de la órbita: se acorta (la espiral se cierra). */
  radio: HTMLElement;
  /** La nave: se mantiene derecha mientras la órbita gira, se ladea y crece al pasar por delante. */
  nave: HTMLElement;
  /** Las estelas de viento del remolino. */
  estelas: HTMLElement;
}

interface Opciones {
  ovni: ElementosOvni;
  /** Capa de la foto nueva: se funde durante el remolino. Opcional (el estudio funde en su lienzo). */
  capa?: HTMLElement | null;
  reducido?: boolean;
  alFinal?: () => void;
}

/** Lanza la revelación. Devuelve el control para cancelarla. */
export function revelar({ ovni, capa, reducido = movimientoReducido(), alFinal }: Opciones): Reveal {
  const { orbita, radio, nave, estelas } = ovni;
  const animaciones: Animation[] = [];
  let viva = true;
  const limpiar = () => {
    for (const a of animaciones) a.cancel();
    animaciones.length = 0;
    for (const el of [orbita, radio, nave, estelas, ...Array.from(estelas.children)] as HTMLElement[]) {
      el.style.transform = '';
      el.style.opacity = '';
    }
    orbita.hidden = true;
    estelas.hidden = true;
    if (capa) capa.style.opacity = '';
  };

  if (reducido || !('animate' in orbita)) {
    if (capa) {
      const a = capa.animate([{ opacity: 0 }, { opacity: 1 }], { duration: DURACION_OVNI.fundido, easing: 'ease-out', fill: 'forwards' });
      animaciones.push(a);
      a.finished
        .then(() => {
          if (!viva) return;
          viva = false;
          alFinal?.();
          // la limpieza va después de que React retire la capa anterior: si no, la capa nueva volvería a nacer oculta un instante
          requestAnimationFrame(() => requestAnimationFrame(limpiar));
        })
        .catch(() => {});
    } else {
      window.setTimeout(() => {
        if (!viva) return;
        alFinal?.();
      }, DURACION_OVNI.fundido);
    }
    return {
      cancelar: () => {
        viva = false;
        limpiar();
      },
    };
  }

  // Medidas del recuadro de la foto (la escena lo cubre entero): todo en px, para que la órbita sea la misma en una
  // tarjeta pequeña y en la galería grande.
  const caja = orbita.parentElement?.getBoundingClientRect();
  const W = caja?.width || 300;
  const H = caja?.height || W;
  const T = TOTAL_OVNI;
  const finRemolino = (DURACION_OVNI.entrada + DURACION_OVNI.remolino) / T;
  const grados = VUELTAS * 360;

  orbita.hidden = false;
  estelas.hidden = false;
  estelas.style.transform = `scaleY(${ELIPSE})`;
  // el tamaño de la nave depende del recuadro (el CSS no puede medirlo: cuelga de elementos sin tamaño)
  orbita.parentElement?.style.setProperty('--ovni-ancho', `${W}px`);

  // 1. La órbita: aparece, gira a velocidad constante (lineal, para que la nave pueda girar justo al revés y seguir
  //    derecha) mientras sube, y al final se va disparada arriba y a la derecha.
  animaciones.push(
    orbita.animate(
      [
        { opacity: 0, offset: 0, easing: 'ease-out' },
        { opacity: 1, offset: DURACION_OVNI.entrada / T },
        { opacity: 1, offset: finRemolino, easing: 'ease-in' },
        { opacity: 0, offset: 1 },
      ],
      { duration: T, fill: 'forwards' },
    ),
  );
  animaciones.push(
    orbita.animate(
      [
        { transform: `translate(0px, ${SUBIDA[0] * H}px) scaleY(${ELIPSE}) rotate(0deg)`, offset: 0, easing: 'linear' },
        { transform: `translate(0px, ${SUBIDA[1] * H}px) scaleY(${ELIPSE}) rotate(${grados}deg)`, offset: finRemolino, easing: 'cubic-bezier(0.55, 0, 1, 0.45)' },
        { transform: `translate(${SALIDA[0] * W}px, ${SALIDA[1] * H}px) scaleY(${ELIPSE}) rotate(${grados + GIRO_SALIDA}deg)`, offset: 1 },
      ],
      { duration: T, fill: 'forwards' },
    ),
  );
  // 2. El radio se acorta: la espiral se cierra.
  animaciones.push(
    radio.animate(
      [
        { transform: `translateX(${RADIO_INICIAL * W}px)`, offset: 0, easing: 'ease-out' },
        { transform: `translateX(${RADIO_FINAL * W}px)`, offset: finRemolino },
        { transform: `translateX(${RADIO_FINAL * W}px)`, offset: 1 },
      ],
      { duration: T, fill: 'forwards' },
    ),
  );
  // 3. La nave: gira al revés que la órbita (se mantiene derecha), deshace la perspectiva de la órbita, se ladea
  //    hacia la curva y crece al pasar por delante (abajo) y encoge por detrás (arriba); entra creciendo desde
  //    pequeña y se va encogiendo.
  const pasos = Math.round(VUELTAS * 8); // un fotograma clave cada 45°
  const fotogramasNave: Keyframe[] = [];
  for (let i = 0; i <= pasos; i++) {
    const theta = (i / pasos) * grados;
    const t = (i / pasos) * finRemolino;
    const rad = (theta * Math.PI) / 180;
    const entrada = suave((t * T) / DURACION_OVNI.entrada);
    const escala = (0.4 + 0.6 * entrada) * (1 + 0.14 * Math.sin(rad));
    const ladeo = -8 * Math.cos(rad);
    fotogramasNave.push({ transform: `translate(-50%, -50%) rotate(${-theta}deg) scaleY(${1 / ELIPSE}) rotate(${ladeo}deg) scale(${escala.toFixed(3)})`, offset: t, easing: 'linear' });
  }
  fotogramasNave.push({ transform: `translate(-50%, -50%) rotate(${-(grados + GIRO_SALIDA)}deg) scaleY(${1 / ELIPSE}) rotate(-14deg) scale(0.55)`, offset: 1 });
  animaciones.push(nave.animate(fotogramasNave, { duration: T, fill: 'forwards' }));
  // 4. Las estelas de viento: tres arcos a distinta distancia que giran con el remolino y se desvanecen.
  const arcos = Array.from(estelas.children) as HTMLElement[];
  arcos.forEach((arco, i) => {
    const diametro = (2 * (RADIO_INICIAL - 0.06 * i) - 0.04) * W;
    arco.style.width = `${diametro}px`;
    arco.style.height = `${diametro}px`;
    const desfase = i * 110;
    animaciones.push(
      arco.animate(
        [
          { transform: `translate(-50%, -50%) rotate(${desfase}deg)`, opacity: 0, offset: 0, easing: 'linear' },
          { opacity: 0.85, offset: 0.2 },
          { transform: `translate(-50%, -50%) rotate(${desfase + grados}deg)`, opacity: 0, offset: finRemolino },
          { transform: `translate(-50%, -50%) rotate(${desfase + grados}deg)`, opacity: 0, offset: 1 },
        ],
        { duration: T, fill: 'forwards' },
      ),
    );
  });
  // 5. El cambio de color: la capa nueva se funde dentro del remolino.
  if (capa) {
    animaciones.push(capa.animate([{ opacity: 0 }, { opacity: 1 }], { duration: CAMBIO_OVNI.fin - CAMBIO_OVNI.inicio, delay: CAMBIO_OVNI.inicio, easing: 'ease-in-out', fill: 'forwards' }));
  }
  // Todas arrancan en el mismo instante de la línea de tiempo del documento: la nave y la órbita giran a la par.
  const ahora = document.timeline?.currentTime;
  if (typeof ahora === 'number') for (const a of animaciones) a.startTime = ahora;

  animaciones[0].finished
    .then(() => {
      if (!viva) return;
      viva = false;
      alFinal?.();
      requestAnimationFrame(() => requestAnimationFrame(limpiar));
    })
    .catch(() => {});

  return {
    cancelar: () => {
      viva = false;
      limpiar();
    },
  };
}
