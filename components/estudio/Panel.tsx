'use client';

// Panel del estudio: selector de prenda y pasos plegables Couleur · Vos logos · Emplacement · Taille · Panier
// (sección 5 de la spec: color sobre foto, capturas automáticas al añadir al panier y un único botón de descarga,
// «Télécharger mon visuel»). Fase 10: dos logos, el delantero y, opcional, otro para la
// espalda; en el paso de tamaño, un selector Delante / Detrás para colocar y dimensionar cada uno por separado.

import { useId, useState, type ReactNode, type RefObject } from 'react';
import Image from 'next/image';
import { useRouter } from 'next/navigation';
import { useStore } from 'zustand';
import { fotoPrincipal, type Posicion, type Producto } from '@/data/catalogo';
import { componerDescarga, descargarBlob, nombreArchivoDescarga } from '@/lib/estudio/descarga';
import { PPP_MINIMO, procesarLogo, quitarFondoBlanco, recortarTransparente, resolucionPpp, type LogoProcesado } from '@/lib/estudio/logo';
import type { Lado } from '@/lib/estudio/siluetas';
import { guardarCapturaDataUrl, guardarLogo, idLogoDetras } from '@/lib/logos-db';
import { anchoMaximo, logoDeLado, posicionPorDefecto, posicionSilueta, posicionesDe, proporcionEn, type Paso, type StoreEstudio } from '@/lib/estudio/store';
import { IconoHoja } from '@/components/catalogo/Etiquetas';
import { TEXTOS } from '@/lib/site';
import type { FuncionCapturar } from './Visor2D';

export const CLAVE_DISENO = 'marca:diseno'; // sessionStorage: el diseño que recoge el formulario de /projet

const LADOS: readonly { id: Lado; nombre: string }[] = [
  { id: 'delante', nombre: 'Devant' },
  { id: 'detras', nombre: 'Derrière' },
];

function Seccion({ id, titulo, abierto, onAbrir, resumen, children }: { id: string; titulo: string; abierto: boolean; onAbrir: () => void; resumen?: ReactNode; children: ReactNode }) {
  const panelId = `${id}-panel`;
  return (
    <section className="border-b border-marine/10 last:border-b-0">
      <h2>
        <button
          type="button"
          aria-expanded={abierto}
          aria-controls={panelId}
          onClick={onAbrir}
          className="flex w-full items-center justify-between gap-3 px-4 py-3.5 text-left transition-colors hover:bg-marine/5"
        >
          <span className="font-display text-base font-semibold text-marine">{titulo}</span>
          <span className="flex items-center gap-3">
            {resumen && <span className="text-xs text-ardoise">{resumen}</span>}
            <svg viewBox="0 0 20 20" aria-hidden="true" className={`h-4 w-4 text-ardoise transition-transform ${abierto ? 'rotate-180' : ''}`}>
              <path d="M5 8l5 5 5-5" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" />
            </svg>
          </span>
        </button>
      </h2>
      <div id={panelId} hidden={!abierto} className="px-4 pb-5">
        {children}
      </div>
    </section>
  );
}

/** Miniatura de una posición: silueta de camiseta con el rectángulo de la zona. */
function MiniPosicion({ posicion }: { posicion: Posicion }) {
  const rect: Record<string, [number, number, number, number]> = {
    corazon: [21, 15, 8, 8],
    centro_pecho: [16, 15, 8, 8],
    frontal_a4: [12, 16, 16, 20],
    espalda_a4: [12, 12, 16, 20],
    espalda_a3: [9, 10, 22, 26],
  };
  const [x, y, w, h] = rect[posicion] ?? [12, 16, 16, 20];
  return (
    <svg viewBox="0 0 40 44" aria-hidden="true" className="h-11 w-10">
      <path d="M13 3l7 3 7-3 9 6-4 8-3-1v26H11V16l-3 1-4-8z" fill="currentColor" className="text-marine/15" stroke="currentColor" strokeWidth="1.2" />
      <rect x={x} y={y} width={w} height={h} rx="1" fill="none" stroke="currentColor" strokeWidth="1.4" strokeDasharray="2 1.5" className="text-bleu-600" />
    </svg>
  );
}

function formatoCm(n: number): string {
  return n.toFixed(1).replace('.0', '').replace('.', ',');
}

/** Vista previa de un logo sobre un tablero de transparencia. */
function VistaLogo({ logo }: { logo: LogoProcesado }) {
  return (
    <div className="flex h-16 w-16 shrink-0 items-center justify-center overflow-hidden rounded-xl bg-white [background-image:linear-gradient(45deg,#e6e6e6_25%,transparent_25%),linear-gradient(-45deg,#e6e6e6_25%,transparent_25%),linear-gradient(45deg,transparent_75%,#e6e6e6_75%),linear-gradient(-45deg,transparent_75%,#e6e6e6_75%)] [background-position:0_0,0_6px,6px_-6px,-6px_0] [background-size:12px_12px]">
      <canvas
        aria-label="Aperçu du logo"
        className="max-h-full max-w-full"
        ref={(el) => {
          if (!el) return;
          const escala = Math.min(56 / logo.canvas.width, 56 / logo.canvas.height, 1);
          el.width = Math.max(1, Math.round(logo.canvas.width * escala));
          el.height = Math.max(1, Math.round(logo.canvas.height * escala));
          el.getContext('2d')?.drawImage(logo.canvas, 0, 0, el.width, el.height);
        }}
      />
    </div>
  );
}

/** Zona de subida de un logo (delantero o trasero), con su vista previa y el botón de quitar el fondo blanco. */
function ZonaLogo({
  id,
  lado,
  logo,
  fondoQuitado,
  procesando,
  onArchivo,
  onAlternarFondo,
  onQuitar,
}: {
  id: string;
  lado: Lado;
  logo: LogoProcesado | null;
  fondoQuitado: boolean;
  procesando: boolean;
  onArchivo: (archivo: File | undefined) => void;
  onAlternarFondo: () => void;
  onQuitar?: () => void;
}) {
  const trasero = lado === 'detras';
  return (
    <div>
      <p className="mb-2 text-sm font-semibold text-marine">
        {trasero ? 'Logo arrière' : 'Logo avant'}
        {trasero && <span className="ml-1 font-normal text-ardoise">(facultatif : sans autre logo, le même est repris derrière)</span>}
      </p>
      <input
        id={id}
        type="file"
        accept="image/png,image/jpeg,image/svg+xml,.svg"
        className="peer sr-only"
        onChange={(e) => {
          onArchivo(e.target.files?.[0]);
          e.target.value = '';
        }}
      />
      <label
        htmlFor={id}
        onDragOver={(e) => e.preventDefault()}
        onDrop={(e) => {
          e.preventDefault();
          onArchivo(e.dataTransfer.files?.[0]);
        }}
        className="flex cursor-pointer flex-col items-center justify-center gap-1.5 rounded-2xl border-2 border-dashed border-violet-600/40 bg-fond px-4 py-5 text-center transition-colors hover:border-violet-600 hover:bg-fuchsia-50 peer-focus-visible:ring-2 peer-focus-visible:ring-bleu-600 peer-focus-visible:ring-offset-2"
      >
        <span className="text-sm font-semibold text-marine">
          {procesando ? 'Traitement en cours…' : logo ? 'Changer de logo' : trasero ? 'Déposer un autre logo pour le dos' : 'Déposer mon logo'}
        </span>
        <span className="text-xs text-ardoise">Glissez-le ici ou cliquez pour choisir un fichier PNG, JPG ou SVG. Il est traité dans votre navigateur : rien n’est envoyé avant votre demande.</span>
      </label>
      {logo && (
        <div className="mt-3 flex items-center gap-3">
          <VistaLogo logo={logo} />
          <div className="min-w-0 text-xs text-ardoise">
            <p className="truncate text-sm text-marine">{logo.nombre}</p>
            <p>{logo.vectorial ? 'Vectoriel (SVG) : net à toutes les tailles' : `${logo.anchoOriginal} × ${logo.altoOriginal} px`}</p>
            <div className="mt-2 flex flex-wrap gap-2">
              <button
                type="button"
                onClick={onAlternarFondo}
                aria-pressed={fondoQuitado}
                className="rounded-full border border-marine/25 px-3 py-1 text-xs font-medium text-marine transition-colors hover:bg-marine/10 aria-pressed:bg-bleu-600 aria-pressed:text-white"
              >
                {fondoQuitado ? 'Fond blanc retiré' : 'Retirer le fond blanc'}
              </button>
              {onQuitar && (
                <button type="button" onClick={onQuitar} className="rounded-full border border-marine/25 px-3 py-1 text-xs font-medium text-ardoise transition-colors hover:bg-marine/10 hover:text-marine">
                  Retirer le logo arrière
                </button>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

interface Props {
  store: StoreEstudio;
  capturarRef: RefObject<FuncionCapturar | null>;
  productos: Producto[];
  onCambiarProducto: (p: Producto) => void;
}

export default function Panel({ store, capturarRef, productos, onCambiarProducto }: Props) {
  const producto = useStore(store, (s) => s.producto);
  const silueta = useStore(store, (s) => s.silueta);
  const color = useStore(store, (s) => s.color);
  const logos = useStore(store, (s) => s.logos);
  const fondoQuitado = useStore(store, (s) => s.fondoQuitado);
  const colocaciones = useStore(store, (s) => s.colocaciones);
  const activa = useStore(store, (s) => s.activa);
  const paso = useStore(store, (s) => s.paso);
  const capturando = useStore(store, (s) => s.capturando);
  const fotoLista = useStore(store, (s) => s.fotoLista);
  const [error, setError] = useState<string | null>(null);
  const [procesando, setProcesando] = useState<Lado | null>(null);
  const [ocupado, setOcupado] = useState<'enviando' | 'descargando' | null>(null);
  const baseId = useId();
  const router = useRouter();

  const abrir = (p: Paso) => store.getState().setPaso(p);
  const posicionesProducto = producto.posiciones.filter((p) => posicionesDe(producto, silueta).includes(p.posicion));
  const colocacionActiva = colocaciones.find((c) => c.posicion === activa) ?? null;
  const ladoActivo: Lado = colocacionActiva ? posicionSilueta(silueta, colocacionActiva.posicion).lado : 'delante';
  const ladosDelProducto = LADOS.filter((l) => posicionesDe(producto, silueta).some((p) => posicionSilueta(silueta, p).lado === l.id));
  const logoDelante = logos.delante;

  async function alElegirArchivo(lado: Lado, archivo: File | undefined) {
    if (!archivo) return;
    setError(null);
    setProcesando(lado);
    try {
      const procesado = await procesarLogo(archivo);
      procesado.canvas = recortarTransparente(procesado.canvas);
      procesado.ancho = procesado.canvas.width;
      procesado.alto = procesado.canvas.height;
      store.getState().setLogo(procesado, lado);
      const s = store.getState();
      if (!s.colocaciones.length) s.alternarPosicion(posicionPorDefecto(producto, silueta, 'delante') ?? 'corazon');
      if (!s.activa) s.setActiva(store.getState().colocaciones[0]?.posicion ?? null);
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Impossible de lire ce fichier.');
    } finally {
      setProcesando(null);
    }
  }

  function alternarFondo(lado: Lado) {
    const s = store.getState();
    const original = s.logosOriginales[lado];
    if (!s.logos[lado] || !original) return;
    if (s.fondoQuitado[lado]) {
      s.setFondoQuitado(null, lado);
      return;
    }
    s.setFondoQuitado(recortarTransparente(quitarFondoBlanco(original)), lado);
  }

  /** Elegir el lado en el paso de tamaño: su posición (o la posición por defecto de ese lado, si aún no tiene). */
  function elegirLado(lado: Lado) {
    const s = store.getState();
    const col = s.colocaciones.find((c) => posicionSilueta(s.silueta, c.posicion).lado === lado);
    if (col) {
      s.setActiva(col.posicion);
      return;
    }
    const p = posicionPorDefecto(s.producto, s.silueta, lado);
    if (p) s.alternarPosicion(p);
  }

  /** Capturas delantera y trasera (1200 × 1500); se generan al enviar o descargar, nunca a mano. */
  async function capturas() {
    const s = store.getState();
    if (s.capturas.length) return s.capturas;
    if (!capturarRef.current) return [];
    s.setCapturando(true);
    try {
      const resultado = await capturarRef.current();
      s.setCapturas(resultado);
      return resultado;
    } finally {
      s.setCapturando(false);
    }
  }

  function resumenColocaciones() {
    const s = store.getState();
    return s.colocaciones.map((c) => {
      const lado = posicionSilueta(s.silueta, c.posicion).lado;
      return {
        posicion: c.posicion,
        nombre: posicionSilueta(s.silueta, c.posicion).nombre,
        lado,
        anchoCm: Math.round(c.anchoCm * 10) / 10,
        altoCm: Math.round(c.anchoCm * proporcionEn(s.silueta, s.logos, c.posicion) * 10) / 10,
        dx: c.dx,
        dz: c.dz,
      };
    });
  }

  function metaLogo(logo: LogoProcesado) {
    return { nombre: logo.nombre, ancho: logo.anchoOriginal, alto: logo.altoOriginal, vectorial: logo.vectorial, fondoQuitado: false };
  }

  /**
   * Guarda el diseño (configuración y capturas) para el formulario de /projet (« Ajouter au panier ») y lo abre. Los archivos originales
   * de los logos se guardan intactos en el navegador (IndexedDB, decisión del equipo del 12/10/2026) con la fecha
   * del diseño como identificador (el trasero, con el sufijo de lib/logos-db.ts), para adjuntarlos al enviar.
   */
  async function enviarDiseno() {
    const s = store.getState();
    const delante = s.logos.delante;
    if (!delante || ocupado) return;
    setOcupado('enviando');
    try {
      const capturasListas = await capturas();
      const fecha = new Date().toISOString();
      const logoGuardado = delante.archivo ? await guardarLogo(fecha, delante.archivo) : false;
      const detras = s.logos.detras;
      const logoDetrasGuardado = detras?.archivo ? await guardarLogo(idLogoDetras(fecha), detras.archivo) : false;
      // Las capturas grandes también se guardan en el navegador (fase 6): el formulario las adjunta al enviar.
      await Promise.all(capturasListas.map((c) => guardarCapturaDataUrl(fecha, c.lado, c.url)));
      const diseno = {
        fecha,
        producto: { slug: producto.slug, nombre: producto.nombre },
        color: { nombre: s.color.nombre, hex: s.color.hex },
        logo: { ...metaLogo(delante), fondoQuitado: s.fondoQuitado.delante },
        logoId: logoGuardado ? fecha : null,
        ...(detras ? { logoDetras: { ...metaLogo(detras), fondoQuitado: s.fondoQuitado.detras }, logoIdDetras: logoDetrasGuardado ? idLogoDetras(fecha) : null } : {}),
        colocaciones: resumenColocaciones(),
        capturas: capturasListas,
      };
      try {
        sessionStorage.setItem(CLAVE_DISENO, JSON.stringify(diseno));
      } catch {
        // Sin sitio para las capturas (límite del navegador): se guarda el diseño sin ellas y se regeneran al enviar.
        sessionStorage.setItem(CLAVE_DISENO, JSON.stringify({ ...diseno, capturas: [] }));
      }
      router.push('/projet');
    } finally {
      setOcupado(null);
    }
  }

  /** Un solo PNG con delante y detrás y la marca La Ola Import. */
  async function descargarDiseno() {
    const s = store.getState();
    if (!s.logos.delante || ocupado) return;
    setOcupado('descargando');
    try {
      const capturasListas = await capturas();
      const blob = await componerDescarga(capturasListas, {
        producto: producto.nombre,
        color: s.color.nombre,
        posiciones: resumenColocaciones().map((c) => `${c.nombre} · ${formatoCm(c.anchoCm)} cm`),
      });
      descargarBlob(blob, nombreArchivoDescarga(producto.slug, s.color.nombre));
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Impossible de préparer le téléchargement.');
    } finally {
      setOcupado(null);
    }
  }

  const logoActivo = logoDeLado(logos, ladoActivo);
  const ppp = logoActivo && colocacionActiva ? resolucionPpp(logoActivo, colocacionActiva.anchoCm) : null;
  const avisoCalidad = ppp !== null && ppp < PPP_MINIMO;
  const resumenLogos = logoDelante ? (logos.detras ? `${logoDelante.nombre} + ${logos.detras.nombre}` : logoDelante.nombre) : 'Aucun logo';

  return (
    <aside className="overflow-hidden rounded-2xl bg-fond shadow-carte ring-1 ring-marine/5" aria-label="Étapes de personnalisation">
      {/* Selector de prenda: cambia la foto y conserva logos, posiciones compatibles y tamaño */}
      <div className="border-b border-marine/10 px-4 py-3">
        <p className="mb-2 text-xs font-semibold text-ardoise">Vêtement</p>
        <div className="grid grid-cols-2 gap-2" role="group" aria-label="Vêtement">
          {productos.map((p) => {
            const foto = fotoPrincipal(p);
            const activo = p.slug === producto.slug;
            return (
              <button
                key={p.slug}
                type="button"
                onClick={() => onCambiarProducto(p)}
                aria-pressed={activo}
                className={`flex items-center gap-2 rounded-2xl border px-2 py-1.5 text-left transition-colors hover:bg-marine/8 ${activo ? 'border-bleu-600/70 bg-marine/10 ring-2 ring-bleu-600' : 'border-marine/15'}`}
              >
                {foto && (
                  <span className="h-12 w-12 shrink-0 overflow-hidden rounded-xl bg-white">
                    <Image src={foto.delante} alt="" width={48} height={48} className="h-12 w-12 object-cover" />
                  </span>
                )}
                <span className="min-w-0">
                  <span className="flex items-center gap-1 truncate text-sm font-medium text-marine">
                    {p.nombre}
                    {p.etiquetas.includes('eco') && (
                      <span className="inline-flex items-center gap-0.5 rounded-full bg-eco-100 px-1.5 text-[10px] font-semibold text-eco-700 ring-1 ring-eco-600/30">
                        <IconoHoja className="h-3 w-3" />
                        ECO
                      </span>
                    )}
                  </span>
                  <span className="block truncate text-[11px] text-ardoise">{p.tipo}</span>
                </span>
              </button>
            );
          })}
        </div>
      </div>

      <Seccion id={`${baseId}-color`} titulo="Couleur" abierto={paso === 'color'} onAbrir={() => abrir('color')} resumen={color.nombre}>
        <ul className="grid grid-cols-4 gap-2 sm:grid-cols-5 lg:grid-cols-4" role="list">
          {producto.colores.map((c) => {
            const seleccionado = c.nombre === color.nombre;
            return (
              <li key={c.nombre}>
                <button
                  type="button"
                  onClick={() => store.getState().setColor(c)}
                  aria-pressed={seleccionado}
                  title={c.nombre}
                  className={`flex w-full flex-col items-center gap-1.5 rounded-2xl p-1.5 text-center transition-colors hover:bg-marine/8 ${seleccionado ? 'bg-marine/10 ring-2 ring-bleu-600' : ''}`}
                >
                  <span
                    className="block h-11 w-11 rounded-full border border-marine/20 shadow-inner"
                    style={{ background: c.hexSecundario ? `linear-gradient(135deg, ${c.hex} 50%, ${c.hexSecundario} 50%)` : c.hex }}
                  />
                  <span className="text-[11px] leading-tight text-ardoise">{c.nombre}</span>
                </button>
              </li>
            );
          })}
        </ul>
        <p className="mt-3 text-xs text-ardoise">Les couleurs à l’écran peuvent légèrement différer du tissu réel.</p>
      </Seccion>

      <Seccion id={`${baseId}-logo`} titulo="Vos logos" abierto={paso === 'logo'} onAbrir={() => abrir('logo')} resumen={resumenLogos}>
        <div className="space-y-5">
          <ZonaLogo
            id={`${baseId}-archivo-delante`}
            lado="delante"
            logo={logos.delante}
            fondoQuitado={fondoQuitado.delante}
            procesando={procesando === 'delante'}
            onArchivo={(f) => void alElegirArchivo('delante', f)}
            onAlternarFondo={() => alternarFondo('delante')}
          />
          {ladosDelProducto.some((l) => l.id === 'detras') && (
            <ZonaLogo
              id={`${baseId}-archivo-detras`}
              lado="detras"
              logo={logos.detras}
              fondoQuitado={fondoQuitado.detras}
              procesando={procesando === 'detras'}
              onArchivo={(f) => void alElegirArchivo('detras', f)}
              onAlternarFondo={() => alternarFondo('detras')}
              onQuitar={logos.detras ? () => store.getState().setLogo(null, 'detras') : undefined}
            />
          )}
        </div>
        {error && (
          <p role="alert" className="mt-3 text-sm font-medium text-[#B3261E]">
            {error}
          </p>
        )}
      </Seccion>

      <Seccion
        id={`${baseId}-posicion`}
        titulo="Emplacement"
        abierto={paso === 'posicion'}
        onAbrir={() => abrir('posicion')}
        resumen={colocaciones.map((c) => posicionSilueta(silueta, c.posicion).nombre).join(' + ') || 'Aucun'}
      >
        <p className="mb-3 text-xs text-ardoise">Un emplacement devant et un derrière au maximum. Faites glisser le logo dans la zone en pointillés pour l’ajuster.</p>
        <ul className="grid grid-cols-2 gap-2" role="list">
          {posicionesProducto.map((p) => {
            const pos = posicionSilueta(silueta, p.posicion);
            const puesta = colocaciones.some((c) => c.posicion === p.posicion);
            const esActiva = activa === p.posicion;
            return (
              <li key={p.posicion}>
                <button
                  type="button"
                  aria-pressed={puesta}
                  onClick={() => {
                    if (puesta && !esActiva) store.getState().setActiva(p.posicion);
                    else store.getState().alternarPosicion(p.posicion);
                  }}
                  className={`flex w-full items-center gap-3 rounded-2xl border px-3 py-2 text-left transition-colors hover:bg-marine/8 ${puesta ? 'border-bleu-600/70 bg-marine/10' : 'border-marine/15'} ${esActiva ? 'ring-2 ring-bleu-600' : ''}`}
                >
                  <MiniPosicion posicion={p.posicion} />
                  <span>
                    <span className="block text-sm font-medium text-marine">{pos.nombre}</span>
                    <span className="block text-[11px] text-ardoise">
                      {pos.lado === 'delante' ? 'Devant' : 'Derrière'} · jusqu’à {p.maxCm[0]} × {p.maxCm[1]} cm
                    </span>
                  </span>
                </button>
              </li>
            );
          })}
        </ul>
        {producto.slug === 'austral' && <p className="mt-3 text-xs text-ardoise">Le polo n’accepte pas le grand format devant : la patte de boutonnage l’en empêche.</p>}
        {!logoDelante && <p className="mt-3 text-xs text-ardoise">Déposez votre logo pour le voir à l’emplacement choisi.</p>}
      </Seccion>

      <Seccion id={`${baseId}-tamano`} titulo="Taille" abierto={paso === 'tamano'} onAbrir={() => abrir('tamano')} resumen={colocacionActiva ? `${formatoCm(colocacionActiva.anchoCm)} cm de large` : undefined}>
        {ladosDelProducto.length > 1 && (
          <div className="mb-4">
            <p className="mb-2 text-xs text-ardoise">Chaque logo se place et se dimensionne séparément.</p>
            <div className="inline-flex rounded-full bg-perle p-1 ring-1 ring-marine/10" role="group" aria-label="Côté du logo">
              {ladosDelProducto.map((l) => {
                const col = colocaciones.find((c) => posicionSilueta(silueta, c.posicion).lado === l.id);
                return (
                  <button
                    key={l.id}
                    type="button"
                    onClick={() => elegirLado(l.id)}
                    aria-pressed={ladoActivo === l.id && Boolean(colocacionActiva)}
                    className="rounded-full px-3.5 py-1.5 text-xs font-semibold text-ardoise transition-colors aria-pressed:bg-marine aria-pressed:text-white hover:text-marine aria-pressed:hover:text-white"
                  >
                    {l.nombre}
                    {col ? '' : ' · ajouter'}
                  </button>
                );
              })}
            </div>
          </div>
        )}
        {colocacionActiva ? (
          (() => {
            const pos = posicionSilueta(silueta, colocacionActiva.posicion);
            const proporcion = proporcionEn(silueta, logos, colocacionActiva.posicion);
            const max = anchoMaximo(pos, proporcion);
            const alto = colocacionActiva.anchoCm * proporcion;
            return (
              <div>
                <label htmlFor={`${baseId}-ancho`} className="flex items-baseline justify-between gap-2 text-sm text-marine">
                  <span>{pos.nombre}</span>
                  <span className="text-right font-semibold">
                    {formatoCm(colocacionActiva.anchoCm)} cm de large · {formatoCm(alto)} cm de haut
                  </span>
                </label>
                <input
                  id={`${baseId}-ancho`}
                  type="range"
                  min={2}
                  max={Math.max(2, Math.round(max * 10) / 10)}
                  step={0.5}
                  value={colocacionActiva.anchoCm}
                  onChange={(e) => store.getState().setAncho(colocacionActiva.posicion, Number(e.target.value))}
                  className="mt-3 w-full accent-bleu-600"
                  aria-valuetext={`${formatoCm(colocacionActiva.anchoCm)} centimètres de large`}
                />
                <p className="mt-1 flex justify-between text-[11px] text-ardoise">
                  <span>2 cm</span>
                  <span>maximum {formatoCm(max)} cm</span>
                </p>
                {logoActivo && (
                  <p className="mt-2 text-xs text-ardoise">
                    Logo: {logoActivo.nombre}
                    {ladoActivo === 'detras' && !logos.detras ? ' (le même que devant)' : ''}
                  </p>
                )}
                {avisoCalidad && (
                  <p role="status" className="mt-3 rounded-xl bg-soleil-400/30 px-3 py-2 text-xs font-medium text-marine ring-1 ring-soleil-400">
                    À cette taille, votre logo risque d’être pixelisé : envoyez-nous la version vectorielle ou un PNG plus grand.
                  </p>
                )}
                {logoActivo && !logoActivo.vectorial && !avisoCalidad && ppp !== null && (
                  <p className="mt-3 text-xs text-ardoise">À cette taille, votre logo s’imprime à environ {Math.round(ppp)} ppp : c’est suffisant.</p>
                )}
              </div>
            );
          })()
        ) : (
          <p className="text-sm text-ardoise">Choisissez d’abord un emplacement.</p>
        )}
      </Seccion>

      <Seccion id={`${baseId}-envio`} titulo="Panier" abierto={paso === 'envio'} onAbrir={() => abrir('envio')}>
        <p className="mb-3 text-xs text-ardoise">
          En ajoutant votre visuel au panier, les aperçus devant et derrière se créent tout seuls et accompagnent votre demande de devis. {TEXTOS.plazoPresupuesto}.
        </p>
        <div className="flex flex-wrap gap-2">
          <button
            type="button"
            onClick={() => void enviarDiseno()}
            disabled={!fotoLista || !logoDelante || ocupado !== null || capturando}
            className="rounded-full bg-fuchsia-700 px-5 py-2.5 text-sm font-semibold text-white shadow-lg shadow-fuchsia-700/30 transition-colors hover:bg-fuchsia-800 disabled:cursor-not-allowed disabled:opacity-50"
          >
            {ocupado === 'enviando' ? 'Préparation…' : 'Ajouter au panier'}
          </button>
          <button
            type="button"
            onClick={() => void descargarDiseno()}
            disabled={!fotoLista || !logoDelante || ocupado !== null || capturando}
            className="rounded-full border-2 border-violet-600 px-5 py-2 text-sm font-semibold text-violet-600 transition-colors hover:bg-[#F2EDFB] disabled:cursor-not-allowed disabled:opacity-50"
          >
            {ocupado === 'descargando' ? 'Préparation…' : 'Télécharger mon visuel'}
          </button>
        </div>
        {!logoDelante && <p className="mt-3 text-xs text-ardoise">Déposez votre logo pour ajouter votre visuel au panier ou le télécharger.</p>}
        <p className="mt-4 text-xs text-ardoise">
          Le téléchargement est une image PNG avec les vues devant et derrière, à partager avec votre équipe. Les fichiers d’origine de vos logos restent dans votre navigateur et ne sont envoyés qu’avec votre demande.
        </p>
      </Seccion>
    </aside>
  );
}
