// Cielo en movimiento (fases 4.5 y 4.6): el motor del fondo espacial, en canvas 2D y sin librerías. Se carga después
// del LCP (components/space/StarField.tsx lo importa en tiempo libre), así que no entra en el JS inicial. Todos los
// números ajustables (velocidades, frecuencias, densidades, tamaños) están en lib/cielo-config.ts.
//
//  - Estrellas en 3 capas de profundidad que avanzan hacia quien mira (perspectiva desde un punto de fuga cerca del
//    centro): cada estrella tiene una profundidad z que decrece; al salir por los bordes (o llegar al cristal) vuelve
//    al fondo. Las capas cercanas van más rápido y dejan una estela corta. El scroll acelera, con respuesta suave.
//  - Estrellas fugaces: cada pocos segundos, una estela brillante cruza en diagonal en menos de un segundo.
//  - Constelaciones sutiles: de vez en cuando se unen estrellas vecinas de la capa media con líneas finas.
//  - El OVNI [MARCA], desde las hojas de sprites pre-renderizadas (public/marca/ovni/): cruces rápidos (vista
//    lateral, con estela) y sobrevuelos con calma (vista 3/4, luces latiendo y balanceo) que esquivan el texto
//    principal y los botones de la primera pantalla; nunca más de un OVNI a la vez.
//  - Eventos para forzar cosas (los usa el script de vídeo): 'marca:ovni' (cruce), 'marca:sobrevuelo',
//    'marca:fugaz'.
//  - Se pausa con la pestaña oculta; en móvil hay menos estrellas; con prefers-reduced-motion el cielo es estático.
//  Los colores salen de los tokens (--color-moon-50, --color-mist-300, --color-star-300).

import sprites from '@/data/ovni-sprites.json';
import { CIELO } from './cielo-config';

interface Estrella {
  x: number; // coordenadas en el plano del fondo (relativas al lado mayor), medidas desde el punto de fuga
  y: number;
  z: number; // profundidad: 1 = fondo, 0 = pegado al cristal
  r: number; // radio base en px CSS
  tw: number; // velocidad del parpadeo
  ph: number; // fase del parpadeo
  tinte: number; // 0 blanco, 1 azulado, 2 cian
  capa: number;
  px: number; // última posición proyectada (para la estela); NaN si no la hay
  py: number;
}

interface Constelacion {
  indices: number[];
  inicio: number;
  duracion: number;
}

interface Fugaz {
  inicio: number;
  duracion: number;
  x0: number;
  y0: number;
  dx: number; // dirección unitaria
  dy: number;
  recorrido: number; // px que avanza la cabeza
  longitud: number; // px de estela
}

interface Cruce {
  inicio: number;
  duracion: number;
  desdeIzquierda: boolean;
  y0: number;
  y1: number;
  escala: number;
}

interface Punto {
  x: number;
  y: number;
}

interface Sobrevuelo {
  inicio: number;
  duracion: number;
  entrada: Punto; // fuera de la ventana
  flote: Punto;
  salida: Punto; // fuera de la ventana
  haciaDerecha: boolean;
  escala: number;
}

export interface Zona {
  left: number;
  top: number;
  right: number;
  bottom: number;
}

export interface OpcionesCielo {
  reducido: boolean;
  movil: boolean;
  /** Rectángulos (px de la ventana) que el OVNI no debe sobrevolar: texto y botones de la primera pantalla. */
  zonasProhibidas?: () => Zona[];
}

const FUGA_Y = 0.42; // el punto de fuga, un poco por encima del centro (como mirando al frente de la nave)
const RADIOS = [0.5, 0.7, 0.9, 1.15, 1.4, 1.7, 2.0, 2.4, 2.9, 3.4];

function azar(a: number, b: number) {
  return a + Math.random() * (b - a);
}

function suaveSalida(u: number) {
  return 1 - Math.pow(1 - u, 3);
}

function suaveEntrada(u: number) {
  return u * u * u;
}

function mezcla(a: Punto, b: Punto, u: number): Punto {
  return { x: a.x + (b.x - a.x) * u, y: a.y + (b.y - a.y) * u };
}

export function crearCielo(canvas: HTMLCanvasElement, opciones: OpcionesCielo) {
  const ctx = canvas.getContext('2d', { alpha: true });
  if (!ctx) return { destruir() {}, impulso() {}, cruce() {}, sobrevuelo() {}, fugaz() {} };
  const estilos = getComputedStyle(document.documentElement);
  const token = (nombre: string, reserva: string) => estilos.getPropertyValue(nombre).trim() || reserva;
  const colores = [token('--color-moon-50', '#f5f5f5'), token('--color-mist-300', '#b0b0b0'), token('--color-star-300', '#bdbdbd')];
  const C = CIELO;

  let w = 0;
  let h = 0;
  let dpr = 1;
  let estrellas: Estrella[] = [];
  let raf = 0;
  let activo = false;
  let ultimoT = 0;
  let ultimoScroll = window.scrollY;
  let velocidadScroll = 0; // px/ms, suavizada
  let empuje = 0; // impulso extra (cambio de página)
  let constelaciones: Constelacion[] = [];
  let proximaConstelacion = 0;
  let fugaces: Fugaz[] = [];
  let proximaFugaz = 0;
  let cruce: Cruce | null = null;
  let proximoCruce = 0;
  let sobrevuelo: Sobrevuelo | null = null;
  let proximoSobrevuelo = 0;
  let spriteCruce: HTMLImageElement | null = null;
  let spriteReveal: HTMLImageElement | null = null;
  let destruido = false;
  // Estrellas pre-dibujadas (por tinte y tamaño): estampar con drawImage cuesta una fracción de arc + fill.
  let estampas: HTMLCanvasElement[][] = [];

  const infoCruce = sprites.cruce;
  const infoReveal = sprites.reveal;

  // --- estrellas -------------------------------------------------------------------------------
  function prepararEstampas() {
    estampas = colores.map((color) =>
      RADIOS.map((radio) => {
        const lado = Math.ceil(radio * 2 + 2);
        const c = document.createElement('canvas');
        c.width = Math.ceil(lado * dpr);
        c.height = Math.ceil(lado * dpr);
        const cctx = c.getContext('2d');
        if (cctx) {
          cctx.scale(dpr, dpr);
          cctx.fillStyle = color;
          cctx.beginPath();
          cctx.arc(lado / 2, lado / 2, radio, 0, Math.PI * 2);
          cctx.fill();
        }
        return c;
      }),
    );
  }

  function estampa(tinte: number, radio: number) {
    let k = 0;
    while (k < RADIOS.length - 1 && RADIOS[k] < radio) k++;
    return estampas[tinte][k];
  }

  /** Coordenadas del plano de fondo que caen dentro de la ventana (con un margen) a la profundidad z. */
  function dentroDelCono(z: number, margen = 1.08) {
    const lado = Math.max(w, h);
    const k = z / (0.5 * lado);
    return { x: azar(-w * 0.5 * margen, w * 0.5 * margen) * k, y: azar(-h * FUGA_Y * margen, h * (1 - FUGA_Y) * margen) * k };
  }

  function sembrar() {
    const megapixeles = (w * h) / 1e6;
    const factor = opciones.movil ? C.movil.factorEstrellas : 1;
    estrellas = [];
    C.capas.forEach((capa, i) => {
      const n = Math.max(12, Math.round(capa.densidad * megapixeles * factor));
      for (let k = 0; k < n; k++) {
        const z = azar(capa.zMin, capa.zMax);
        estrellas.push({
          ...dentroDelCono(z),
          z,
          r: azar(capa.tam[0], capa.tam[1]),
          tw: azar(0.3, 1.1),
          ph: Math.random() * Math.PI * 2,
          tinte: Math.random() < 0.1 ? 2 : Math.random() < 0.35 ? 1 : 0,
          capa: i,
          px: NaN,
          py: NaN,
        });
      }
    });
  }

  function redimensionar() {
    dpr = Math.min(window.devicePixelRatio || 1, 2);
    // el viewport que se ve: si algo desborda a lo ancho, innerWidth crece y dejaría cielo (y OVNI) fuera de pantalla
    w = Math.min(window.innerWidth, document.documentElement.clientWidth || window.innerWidth);
    h = Math.min(window.innerHeight, window.visualViewport?.height ?? window.innerHeight);
    canvas.width = Math.round(w * dpr);
    canvas.height = Math.round(h * dpr);
    canvas.style.width = `${w}px`;
    canvas.style.height = `${h}px`;
    ctx!.setTransform(dpr, 0, 0, dpr, 0, 0);
    prepararEstampas();
    sembrar();
  }

  /** Proyección desde el punto de fuga. */
  function proyectar(s: Estrella) {
    const lado = Math.max(w, h);
    const f = 0.5 / Math.max(s.z, 0.05);
    return { px: w * 0.5 + s.x * lado * f, py: h * FUGA_Y + s.y * lado * f, f };
  }

  function dibujarEstrellas(t: number, estatico: boolean) {
    for (const s of estrellas) {
      const { px, py, f } = proyectar(s);
      if (px < -8 || px > w + 8 || py < -8 || py > h + 8) {
        s.px = NaN;
        continue;
      }
      const capa = C.capas[s.capa];
      const parpadeo = estatico ? 0.9 : 0.72 + 0.28 * Math.sin(t * 0.0012 * s.tw + s.ph);
      const cerca = 1 - s.z; // más cerca → algo más grande y más brillante
      const alfa = Math.min(1, capa.alfa * parpadeo * (0.75 + 0.5 * cerca));
      const radio = s.r * (0.8 + 0.6 * cerca) * Math.min(1.6, f * 1.6);
      // estela corta en las capas rápidas: del punto anterior al actual, hasta una longitud máxima
      if (!estatico && s.capa >= C.estela.desdeCapa && !Number.isNaN(s.px)) {
        const ddx = px - s.px;
        const ddy = py - s.py;
        const d = Math.hypot(ddx, ddy);
        if (d > C.estela.umbralPxPorFotograma) {
          const k = Math.min(1, C.estela.longitudMaxima / d);
          ctx!.globalAlpha = alfa * 0.55;
          ctx!.strokeStyle = colores[s.tinte];
          ctx!.lineWidth = Math.max(0.8, radio * 0.9);
          ctx!.lineCap = 'round';
          ctx!.beginPath();
          ctx!.moveTo(px - ddx * k, py - ddy * k);
          ctx!.lineTo(px, py);
          ctx!.stroke();
        }
      }
      ctx!.globalAlpha = alfa;
      const e = estampa(s.tinte, radio);
      const lado = e.width / dpr;
      ctx!.drawImage(e, px - lado / 2, py - lado / 2, lado, lado);
      s.px = px;
      s.py = py;
    }
    ctx!.globalAlpha = 1;
  }

  function avanzar(dt: number) {
    const scroll = window.scrollY;
    const v = (scroll - ultimoScroll) / Math.max(dt, 1);
    ultimoScroll = scroll;
    velocidadScroll += (Math.abs(v) - velocidadScroll) * C.suavizadoScroll;
    empuje *= 0.94;
    if (empuje < 0.01) empuje = 0;
    const velocidad = C.velocidadBase + Math.min(C.impulsoMaximo, velocidadScroll * C.impulsoScroll) + empuje * 0.03;
    const dz = velocidad * (dt / 1000);
    for (const s of estrellas) {
      const capa = C.capas[s.capa];
      s.z -= dz * capa.velocidad;
      const { px, py } = proyectar(s);
      // al acercarse se desliza hacia los bordes; cuando sale de la ventana (o llega al cristal) vuelve al fondo
      if (s.z < capa.zMin || px < -12 || px > w + 12 || py < -12 || py > h + 12) {
        s.z = capa.zMax;
        const p = dentroDelCono(s.z, 1.0);
        s.x = p.x;
        s.y = p.y;
        s.px = NaN;
      }
    }
  }

  // --- constelaciones --------------------------------------------------------------------------
  function nuevaConstelacion(t: number) {
    const medias = estrellas.filter((s) => s.capa === 1);
    if (medias.length < 8) return;
    const semilla = medias[Math.floor(Math.random() * medias.length)];
    const { px, py } = proyectar(semilla);
    if (px < w * 0.1 || px > w * 0.9 || py < h * 0.1 || py > h * 0.9) return;
    const vecinas = medias
      .map((s) => ({ s, d: Math.hypot(proyectar(s).px - px, proyectar(s).py - py) }))
      .filter((v) => v.d > 24 && v.d < Math.min(w, h) * 0.22)
      .sort((a, b) => a.d - b.d)
      .slice(0, 3 + Math.floor(Math.random() * 3));
    if (vecinas.length < 3) return;
    constelaciones.push({ indices: [estrellas.indexOf(semilla), ...vecinas.map((v) => estrellas.indexOf(v.s))], inicio: t, duracion: azar(C.constelaciones.duracionMin, C.constelaciones.duracionMax) });
  }

  function dibujarConstelaciones(t: number) {
    constelaciones = constelaciones.filter((c) => t - c.inicio < c.duracion);
    for (const c of constelaciones) {
      const u = (t - c.inicio) / c.duracion;
      const alfa = C.constelaciones.alfa * Math.min(1, u / 0.2, (1 - u) / 0.25);
      if (alfa <= 0) continue;
      ctx!.globalAlpha = alfa;
      ctx!.strokeStyle = colores[1];
      ctx!.lineWidth = 0.7;
      ctx!.beginPath();
      const puntos = c.indices.map((i) => proyectar(estrellas[i]));
      ctx!.moveTo(puntos[0].px, puntos[0].py);
      for (let k = 1; k < puntos.length; k++) ctx!.lineTo(puntos[k].px, puntos[k].py);
      ctx!.stroke();
      for (const p of puntos) {
        ctx!.beginPath();
        ctx!.arc(p.px, p.py, 1.2, 0, Math.PI * 2);
        ctx!.fillStyle = colores[2];
        ctx!.fill();
      }
    }
    ctx!.globalAlpha = 1;
  }

  // --- estrellas fugaces -----------------------------------------------------------------------
  function nuevaFugaz(t: number) {
    if (fugaces.length >= C.fugaces.maximo) return;
    const haciaDerecha = Math.random() < 0.5;
    const angulo = azar(0.45, 0.95); // radianes bajo la horizontal: diagonal clara
    const dx = Math.cos(angulo) * (haciaDerecha ? 1 : -1);
    const dy = Math.sin(angulo);
    fugaces.push({
      inicio: t,
      duracion: azar(C.fugaces.duracionMin, C.fugaces.duracionMax),
      x0: haciaDerecha ? azar(-w * 0.05, w * 0.55) : azar(w * 0.45, w * 1.05),
      y0: azar(-h * 0.05, h * 0.5),
      dx,
      dy,
      recorrido: azar(w * 0.3, w * 0.5),
      longitud: azar(C.fugaces.longitud[0], C.fugaces.longitud[1]),
    });
  }

  function dibujarFugaces(t: number) {
    fugaces = fugaces.filter((f) => t - f.inicio < f.duracion);
    for (const f of fugaces) {
      const u = (t - f.inicio) / f.duracion;
      const cabeza = { x: f.x0 + f.dx * f.recorrido * u, y: f.y0 + f.dy * f.recorrido * u };
      const largo = f.longitud * Math.min(1, u * 2.5) * (u > 0.7 ? (1 - u) / 0.3 : 1);
      const cola = { x: cabeza.x - f.dx * largo, y: cabeza.y - f.dy * largo };
      const g = ctx!.createLinearGradient(cola.x, cola.y, cabeza.x, cabeza.y);
      g.addColorStop(0, 'rgba(244, 247, 255, 0)');
      g.addColorStop(0.7, 'rgba(175, 192, 238, 0.55)');
      g.addColorStop(1, 'rgba(255, 255, 255, 1)');
      ctx!.globalAlpha = C.fugaces.alfa * Math.min(1, u / 0.1, (1 - u) / 0.2 + 0.2);
      ctx!.strokeStyle = g;
      ctx!.lineWidth = C.fugaces.grosor;
      ctx!.lineCap = 'round';
      ctx!.beginPath();
      ctx!.moveTo(cola.x, cola.y);
      ctx!.lineTo(cabeza.x, cabeza.y);
      ctx!.stroke();
      ctx!.fillStyle = '#ffffff';
      ctx!.beginPath();
      ctx!.arc(cabeza.x, cabeza.y, C.fugaces.grosor * 0.9, 0, Math.PI * 2);
      ctx!.fill();
    }
    ctx!.globalAlpha = 1;
  }

  // --- OVNI: cruces rápidos --------------------------------------------------------------------
  function cargarSprite(cual: 'cruce' | 'reveal') {
    if (cual === 'cruce' ? spriteCruce : spriteReveal) return;
    const img = new Image();
    img.decoding = 'async';
    img.onload = () => {
      if (cual === 'cruce') spriteCruce = img;
      else spriteReveal = img;
    };
    img.src = cual === 'cruce' ? infoCruce.archivo : infoReveal.archivo;
  }

  function nuevoCruce(t: number) {
    cruce = {
      inicio: t,
      duracion: azar(C.cruces.duracionMin, C.cruces.duracionMax),
      desdeIzquierda: Math.random() < 0.5,
      y0: azar(0.12, 0.45),
      y1: azar(0.1, 0.5),
      escala: (opciones.movil ? C.cruces.escalaMovil : C.cruces.escala) * azar(0.85, 1.15),
    };
    cargarSprite('cruce');
  }

  function dibujarCruce(t: number) {
    if (!cruce) return;
    const u = (t - cruce.inicio) / cruce.duracion;
    if (u >= 1) {
      cruce = null;
      return;
    }
    if (!spriteCruce) return;
    const ancho = (infoCruce.ancho / infoCruce.escala) * cruce.escala;
    const alto = (infoCruce.alto / infoCruce.escala) * cruce.escala;
    const x = cruce.desdeIzquierda ? -ancho + u * (w + 2 * ancho) : w + ancho - u * (w + 2 * ancho);
    const y = h * (cruce.y0 + (cruce.y1 - cruce.y0) * u) + Math.sin(u * Math.PI * 3) * 6;
    const frame = Math.floor((t / 1000) * 12) % infoCruce.fotogramas;
    const sx = (frame % infoCruce.columnas) * infoCruce.ancho;
    const sy = Math.floor(frame / infoCruce.columnas) * infoCruce.alto;
    const direccion = cruce.desdeIzquierda ? -1 : 1;
    ctx!.save();
    ctx!.globalAlpha = 0.9;
    const g = ctx!.createLinearGradient(x + ancho / 2, y, x + ancho / 2 + direccion * ancho * 1.6, y);
    g.addColorStop(0, 'rgba(63, 230, 242, 0.35)');
    g.addColorStop(1, 'rgba(63, 230, 242, 0)');
    ctx!.strokeStyle = g;
    ctx!.lineWidth = Math.max(1.5, alto * 0.12);
    ctx!.lineCap = 'round';
    ctx!.beginPath();
    ctx!.moveTo(x + ancho / 2, y + alto * 0.05);
    ctx!.lineTo(x + ancho / 2 + direccion * ancho * 1.6, y + alto * 0.05);
    ctx!.stroke();
    for (let k = 3; k >= 1; k--) {
      ctx!.globalAlpha = 0.08 * (4 - k);
      ctx!.drawImage(spriteCruce, sx, sy, infoCruce.ancho, infoCruce.alto, x + direccion * k * ancho * 0.18 - ancho / 2, y - alto / 2, ancho, alto);
    }
    ctx!.globalAlpha = 1;
    if (!cruce.desdeIzquierda) {
      ctx!.translate(x, y);
      ctx!.scale(-1, 1);
      ctx!.drawImage(spriteCruce, sx, sy, infoCruce.ancho, infoCruce.alto, -ancho / 2, -alto / 2, ancho, alto);
    } else {
      ctx!.drawImage(spriteCruce, sx, sy, infoCruce.ancho, infoCruce.alto, x - ancho / 2, y - alto / 2, ancho, alto);
    }
    ctx!.restore();
  }

  // --- OVNI: sobrevuelos con calma -------------------------------------------------------------
  function tamanoSobrevuelo() {
    const escala = opciones.movil ? C.sobrevuelos.escalaMovil : C.sobrevuelos.escala;
    return { ancho: (infoReveal.ancho / infoReveal.escala) * escala, alto: (infoReveal.alto / infoReveal.escala) * escala, escala };
  }

  function margenSobrevuelo() {
    return opciones.movil ? C.sobrevuelos.margenMovil : C.sobrevuelos.margen;
  }

  /** Área (px²) que el OVNI en `p` pisaría de las zonas prohibidas (0 = libre). */
  function pisado(p: Punto, ancho: number, alto: number, zonas: Zona[]) {
    const m = margenSobrevuelo();
    const l = p.x - ancho / 2 - m;
    const r = p.x + ancho / 2 + m;
    const t = p.y - alto / 2 - m;
    const b = p.y + alto / 2 + m;
    let area = 0;
    for (const z of zonas) {
      const ix = Math.min(r, z.right) - Math.max(l, z.left);
      const iy = Math.min(b, z.bottom) - Math.max(t, z.top);
      if (ix > 0 && iy > 0) area += ix * iy;
    }
    return area;
  }

  function libre(p: Punto, ancho: number, alto: number, zonas: Zona[]) {
    return pisado(p, ancho, alto, zonas) === 0;
  }

  function caminoLibre(a: Punto, b: Punto, ancho: number, alto: number, zonas: Zona[]) {
    for (let k = 0; k <= 8; k++) if (!libre(mezcla(a, b, k / 8), ancho, alto, zonas)) return false;
    return true;
  }

  function nuevoSobrevuelo(t: number) {
    const zonas = opciones.zonasProhibidas?.() ?? [];
    const { ancho, alto, escala } = tamanoSobrevuelo();
    // punto de flote: en una rejilla fina sobre los dos tercios altos de la ventana, barajada; si no hay ningún
    // punto libre, los márgenes (bandas de arriba y de los lados); y si tampoco, el que menos pise
    const candidatos: Punto[] = [];
    for (let i = 0; i < 7; i++) for (let j = 0; j < 17; j++) candidatos.push({ x: w * (0.12 + (0.76 * i) / 6), y: h * (0.06 + 0.04 * j) });
    for (let i = candidatos.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      [candidatos[i], candidatos[j]] = [candidatos[j], candidatos[i]];
    }
    const margenes: Punto[] = [];
    for (let j = 0; j < 17; j++) margenes.push({ x: ancho * 0.7, y: h * (0.06 + 0.04 * j) }, { x: w - ancho * 0.7, y: h * (0.06 + 0.04 * j) });
    for (let i = 0; i < 7; i++) margenes.push({ x: w * (0.1 + (0.8 * i) / 6), y: alto * 0.7 });
    const todos = [...candidatos, ...margenes];
    let flote = todos.find((p) => libre(p, ancho, alto, zonas));
    if (!flote) {
      let mejor = Infinity;
      for (const p of todos) {
        const a = pisado(p, ancho, alto, zonas);
        if (a < mejor) {
          mejor = a;
          flote = p;
        }
      }
      flote = flote ?? { x: w * 0.5, y: alto * 0.7 };
    }
    // entrada y salida: por el lado más cercano a la misma altura si el camino está libre; si no, por arriba
    const haciaDerecha = flote.x >= w / 2 ? false : true;
    const lateral: Punto = { x: haciaDerecha ? -ancho : w + ancho, y: flote.y + azar(-30, 30) };
    const arriba: Punto = { x: flote.x + azar(-60, 60), y: -alto };
    const entrada = caminoLibre(lateral, flote, ancho, alto, zonas) ? lateral : arriba;
    const lateralSalida: Punto = { x: haciaDerecha ? w + ancho : -ancho, y: flote.y + azar(-40, 20) };
    const salida = caminoLibre(flote, lateralSalida, ancho, alto, zonas) ? lateralSalida : { x: flote.x + azar(-80, 80), y: -alto };
    sobrevuelo = { inicio: t, duracion: azar(C.sobrevuelos.duracionMin, C.sobrevuelos.duracionMax), entrada, flote, salida, haciaDerecha, escala };
    cargarSprite('reveal');
  }

  function dibujarSobrevuelo(t: number) {
    if (!sobrevuelo) return;
    const u = (t - sobrevuelo.inicio) / sobrevuelo.duracion;
    if (u >= 1) {
      sobrevuelo = null;
      return;
    }
    if (!spriteReveal) return;
    const s = sobrevuelo;
    const { ancho, alto } = tamanoSobrevuelo();
    let p: Punto;
    let inclinacion = 0;
    if (u < 0.32) {
      const k = suaveSalida(u / 0.32);
      p = mezcla(s.entrada, s.flote, k);
      inclinacion = (1 - k) * (s.haciaDerecha ? 0.08 : -0.08);
    } else if (u < 0.7) {
      const k = (u - 0.32) / 0.38;
      const bal = Math.sin(k * Math.PI * 2.5);
      p = { x: s.flote.x + Math.sin(k * Math.PI * 1.5) * C.sobrevuelos.balanceoPx * 0.6, y: s.flote.y + bal * C.sobrevuelos.balanceoPx };
      inclinacion = bal * 0.05;
    } else {
      const k = suaveEntrada((u - 0.7) / 0.3);
      p = mezcla(s.flote, s.salida, k);
      inclinacion = k * (s.salida.x > s.flote.x ? 0.08 : s.salida.y < s.flote.y ? 0 : -0.08);
    }
    const frame = Math.floor((t / 1000) * C.sobrevuelos.fotogramasPorSegundo) % infoReveal.fotogramas;
    const sx = (frame % infoReveal.columnas) * infoReveal.ancho;
    const sy = Math.floor(frame / infoReveal.columnas) * infoReveal.alto;
    const aparicion = Math.min(1, u / 0.08, (1 - u) / 0.08);
    ctx!.save();
    ctx!.globalAlpha = 0.95 * aparicion;
    ctx!.translate(p.x, p.y);
    ctx!.rotate(inclinacion);
    if (!s.haciaDerecha) ctx!.scale(-1, 1);
    ctx!.drawImage(spriteReveal, sx, sy, infoReveal.ancho, infoReveal.alto, -ancho / 2, -alto / 2, ancho, alto);
    ctx!.restore();
  }

  // --- bucle -----------------------------------------------------------------------------------
  function cuadro(t: number) {
    if (!activo) return;
    const dt = Math.min(48, ultimoT ? t - ultimoT : 16);
    ultimoT = t;
    avanzar(dt);
    ctx!.clearRect(0, 0, w, h);
    dibujarEstrellas(t, false);
    if (t > proximaConstelacion) {
      if (constelaciones.length < C.constelaciones.maximo) nuevaConstelacion(t);
      proximaConstelacion = t + azar(C.constelaciones.cadaMin, C.constelaciones.cadaMax);
    }
    dibujarConstelaciones(t);
    if (t > proximaFugaz) {
      nuevaFugaz(t);
      proximaFugaz = t + azar(C.fugaces.cadaMin, C.fugaces.cadaMax);
    }
    dibujarFugaces(t);
    // nunca más de un OVNI a la vez: el sobrevuelo tiene preferencia; el cruce espera
    if (!cruce && !sobrevuelo && t > proximoSobrevuelo) {
      nuevoSobrevuelo(t);
      proximoSobrevuelo = t + azar(C.sobrevuelos.cadaMin, C.sobrevuelos.cadaMax);
    }
    if (!cruce && !sobrevuelo && t > proximoCruce) {
      nuevoCruce(t);
      proximoCruce = t + azar(C.cruces.cadaMin, C.cruces.cadaMax);
    }
    dibujarCruce(t);
    dibujarSobrevuelo(t);
    raf = requestAnimationFrame(cuadro);
  }

  function arrancar() {
    if (opciones.reducido) {
      activo = false;
      cancelAnimationFrame(raf);
      ctx!.clearRect(0, 0, w, h);
      dibujarEstrellas(0, true);
      return;
    }
    if (activo || document.hidden || destruido) return;
    activo = true;
    ultimoT = 0;
    const ahora = performance.now();
    proximaConstelacion = ahora + azar(2000, 5000);
    proximaFugaz = ahora + azar(C.fugaces.cadaMin, C.fugaces.cadaMax);
    if (!proximoCruce) proximoCruce = ahora + azar(C.arranque.primerCruceMin, C.arranque.primerCruceMax);
    if (!proximoSobrevuelo) proximoSobrevuelo = ahora + azar(C.arranque.primerSobrevueloMin, C.arranque.primerSobrevueloMax);
    cargarSprite('reveal');
    raf = requestAnimationFrame(cuadro);
  }

  function parar() {
    activo = false;
    cancelAnimationFrame(raf);
  }

  const alCambiarVisibilidad = () => (document.hidden ? parar() : arrancar());
  let temporizador = 0;
  const alRedimensionar = () => {
    window.clearTimeout(temporizador);
    temporizador = window.setTimeout(() => {
      redimensionar();
      if (opciones.reducido) arrancar();
    }, 120);
  };
  const alPedirCruce = () => {
    if (opciones.reducido) return;
    sobrevuelo = null;
    cruce = null;
    nuevoCruce(performance.now());
    proximoCruce = performance.now() + azar(C.cruces.cadaMin, C.cruces.cadaMax);
  };
  const alPedirSobrevuelo = () => {
    if (opciones.reducido) return;
    cruce = null;
    sobrevuelo = null;
    nuevoSobrevuelo(performance.now());
    proximoSobrevuelo = performance.now() + azar(C.sobrevuelos.cadaMin, C.sobrevuelos.cadaMax);
  };
  const alPedirFugaz = () => {
    if (opciones.reducido) return;
    nuevaFugaz(performance.now());
  };

  redimensionar();
  arrancar();
  window.addEventListener('resize', alRedimensionar);
  document.addEventListener('visibilitychange', alCambiarVisibilidad);
  window.addEventListener('marca:ovni', alPedirCruce);
  window.addEventListener('marca:sobrevuelo', alPedirSobrevuelo);
  window.addEventListener('marca:fugaz', alPedirFugaz);

  return {
    /** Breve aceleración (cambio de página). */
    impulso() {
      empuje = 1;
    },
    /** Dónde está ahora el OVNI del sobrevuelo (px de la ventana), para las comprobaciones automáticas. */
    estado(): { sobrevuelo: { x: number; y: number; ancho: number; alto: number } | null } {
      if (!sobrevuelo) return { sobrevuelo: null };
      const { ancho, alto } = tamanoSobrevuelo();
      const u = (performance.now() - sobrevuelo.inicio) / sobrevuelo.duracion;
      const s = sobrevuelo;
      let p: Punto;
      if (u < 0.32) p = mezcla(s.entrada, s.flote, suaveSalida(u / 0.32));
      else if (u < 0.7) p = { x: s.flote.x, y: s.flote.y };
      else p = mezcla(s.flote, s.salida, suaveEntrada((u - 0.7) / 0.3));
      return { sobrevuelo: { x: p.x, y: p.y, ancho, alto } };
    },
    /** Lanza un cruce rápido del OVNI ahora mismo. */
    cruce: alPedirCruce,
    /** Lanza un sobrevuelo con calma ahora mismo. */
    sobrevuelo: alPedirSobrevuelo,
    /** Lanza una estrella fugaz ahora mismo. */
    fugaz: alPedirFugaz,
    destruir() {
      destruido = true;
      parar();
      window.clearTimeout(temporizador);
      window.removeEventListener('resize', alRedimensionar);
      document.removeEventListener('visibilitychange', alCambiarVisibilidad);
      window.removeEventListener('marca:ovni', alPedirCruce);
      window.removeEventListener('marca:sobrevuelo', alPedirSobrevuelo);
      window.removeEventListener('marca:fugaz', alPedirFugaz);
    },
  };
}

export type Cielo = ReturnType<typeof crearCielo>;
