'use client';

// Estudio de diseño (sección 5 de la spec, experiencia Nike By You + Custom Ink) en 2D sobre las fotos reales:
// la prenda ocupa dos tercios a la izquierda (en móvil, la mitad superior) y a la derecha va el panel de pasos.
// Decisiones del equipo (11 y 12/10/2026): sin 3D; vistas delante y detrás; el color cambia la foto (real si la
// hay, recoloreada desde la foto blanca si no) y se puede cambiar de prenda sin salir del estudio.

import { useEffect, useMemo, useRef } from 'react';
import Link from 'next/link';
import { useSearchParams } from 'next/navigation';
import { useStore } from 'zustand';
import { colorPorDefecto, type Producto } from '@/data/catalogo';
import { procesarLogo, recortarTransparente } from '@/lib/estudio/logo';
import { crearStoreEstudio } from '@/lib/estudio/store';
import { fotosDeColor } from '@/lib/estudio/siluetas';
import { tomarLogoPendiente } from '@/lib/logo-pendiente';
import { textoPrecio } from '@/lib/producto';
import { SITE, TEXTOS } from '@/lib/site';
import { Etiquetas } from '@/components/catalogo/Etiquetas';
import { Ovni, type RefsOvni } from '@/components/producto/Ovni';
import Visor2D, { type FuncionCapturar } from './Visor2D';
import Panel from './Panel';

interface Props {
  productos: Producto[]; // prendas con estudio, para el selector
  slugInicial: string;
  /** Por producto y nombre de color, la clave del archivo de foto (app/personnaliser/[slug]/page.tsx). */
  clavesFoto?: Record<string, Record<string, string>>;
}

export default function Estudio({ productos, slugInicial, clavesFoto }: Props) {
  const inicial = productos.find((p) => p.slug === slugInicial) ?? productos[0];
  const params = useSearchParams();
  // Desde la ficha se llega con el color elegido (?color=Nom) ; solo se lee al crear el estado.
  const colorInicial = params.get('color');
  const store = useMemo(
    () => crearStoreEstudio(inicial, inicial.colores.find((c) => c.nombre === colorInicial) ?? colorPorDefecto(inicial)),
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [inicial],
  );
  const capturarRef = useRef<FuncionCapturar | null>(null);
  const ovniRef = useRef<RefsOvni | null>(null);
  const producto = useStore(store, (s) => s.producto);
  const silueta = useStore(store, (s) => s.silueta);
  const lado = useStore(store, (s) => s.lado);
  const setLado = useStore(store, (s) => s.setLado);
  const color = useStore(store, (s) => s.color);
  const fotoLista = useStore(store, (s) => s.fotoLista);
  const aviso = useStore(store, (s) => s.aviso);
  const conGanchos = params.get('capturas') === '1';
  const precio = textoPrecio(producto);

  // Logo que viene de la home («Essayez avec votre logo»): se recoge del navegador y entra como si se hubiera subido aquí.
  useEffect(() => {
    let vivo = true;
    tomarLogoPendiente()
      .then(async (archivo) => {
        if (!archivo || !vivo) return;
        const procesado = await procesarLogo(archivo);
        if (!vivo) return;
        procesado.canvas = recortarTransparente(procesado.canvas);
        procesado.ancho = procesado.canvas.width;
        procesado.alto = procesado.canvas.height;
        const s = store.getState();
        s.setLogo(procesado, 'delante');
        if (!store.getState().colocaciones.length) s.alternarPosicion('corazon');
        s.setActiva(store.getState().colocaciones[0]?.posicion ?? null);
        s.setPaso('posicion');
      })
      .catch(() => {});
    return () => {
      vivo = false;
    };
  }, [store]);

  // Foto real del color si existe; si no, la blanca recoloreada. La clave de archivo evita depender del nombre del color.
  const claveFoto = clavesFoto?.[producto.slug]?.[color.nombre];
  const { fotos, origen } = useMemo(() => fotosDeColor(silueta, color.nombre, claveFoto), [silueta, color.nombre, claveFoto]);

  // Cambiar de prenda sin salir del estudio: el estado se conserva y la URL se actualiza sin navegar
  // (se mantiene la query, por ejemplo ?capturas=1 del script de capturas).
  const cambiarProducto = (p: Producto) => {
    store.getState().setProducto(p);
    window.history.replaceState(null, '', `/personnaliser/${p.slug}${window.location.search}`);
    document.title = `Personnalisez votre ${p.nombre} avec votre logo · ${SITE.nombre}`;
  };

  // El aviso (por ejemplo, una posición que el polo no admite) se quita solo.
  useEffect(() => {
    if (!aviso) return;
    const t = window.setTimeout(() => store.getState().setAviso(null), 7000);
    return () => window.clearTimeout(t);
  }, [aviso, store]);

  // Ganchos para el script de capturas (scripts/capturas-estudio.mjs): solo con ?capturas=1.
  useEffect(() => {
    if (!conGanchos) return;
    const w = window as Window & {
      __marcaEstudio?: { capturar: () => Promise<unknown>; listo: () => boolean; lado: (l: 'delante' | 'detras') => void; color: (nombre: string) => boolean; producto: (slug: string) => boolean };
    };
    w.__marcaEstudio = {
      capturar: async () => capturarRef.current?.() ?? [],
      listo: () => store.getState().fotoLista,
      lado: (l) => store.getState().setLado(l),
      color: (nombre) => {
        const c = store.getState().producto.colores.find((x) => x.nombre === nombre);
        if (c) store.getState().setColor(c);
        return Boolean(c);
      },
      producto: (slug) => {
        const p = productos.find((x) => x.slug === slug);
        if (p) cambiarProducto(p);
        return Boolean(p);
      },
    };
    return () => {
      delete w.__marcaEstudio;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [conGanchos, store, productos]);

  return (
    <section className="mx-auto w-full max-w-7xl px-4 pt-20 pb-16 sm:px-6 lg:px-8 lg:pt-28">
      <div className="mb-4 flex flex-wrap items-end justify-between gap-3 lg:mb-6">
        <div>
          <p className="text-sm font-semibold text-violet-600">Studio de personnalisation</p>
          <h1 className="font-display text-3xl font-extrabold tracking-tight text-marine sm:text-4xl">Personnalisez votre {producto.nombre}</h1>
          <p className="mt-1 text-sm text-ardoise">
            {producto.tipo} · {producto.material}
            {producto.gramaje ? ` · ${producto.gramaje} g/m²` : ''}
          </p>
          {/* Las mismas etiquetas que en la tarjeta y la ficha (distintivo ECO incluido, fase 4.4) */}
          <div className="mt-2">
            <Etiquetas destacado={producto.destacado} etiquetas={producto.etiquetas} conEstudio={false} tono="claro" conDisena={false} />
          </div>
          <p className="mt-2 text-sm text-marine">
            <span className="font-display font-bold text-marine">{precio}</span>
          </p>
          <p className="mt-1 max-w-2xl text-xs text-ardoise">{TEXTOS.pedidoMinimo}</p>
        </div>
        <Link href={`/catalogue/${producto.slug}`} className="text-sm font-semibold text-bleu-600 underline underline-offset-4 hover:text-indigo-700">
          Voir la fiche produit
        </Link>
      </div>

      <div className="grid gap-4 lg:grid-cols-[minmax(0,2fr)_minmax(320px,1fr)] lg:gap-6">
        {/* Lienzo del estudio */}
        <div className="sticky top-16 z-10 lg:top-24 lg:self-start">
          {/* Un único escenario para todos los colores (fase 4.2): tono claro de la paleta, algo más frío que el blanco de la
              prenda, con una sombra de contacto que dibuja el visor. Las fotos van recortadas, sin su fondo. */}
          <div className="escenario-estudio relative h-[37svh] min-h-[240px] overflow-hidden rounded-2xl shadow-carte ring-1 ring-marine/5 lg:h-[calc(100svh-8rem)] lg:min-h-[520px]">
            <div className="absolute inset-0">
              <Visor2D store={store} fotos={fotos} capturarRef={capturarRef} ovniRef={ovniRef} />
            </div>
            <Ovni ref={ovniRef} />
            {!fotoLista && (
              <p className="absolute bottom-4 left-1/2 z-10 -translate-x-1/2 rounded-full bg-fond/90 px-3 py-1 text-xs font-medium text-marine backdrop-blur">
                Chargement de la photo…
              </p>
            )}

            {/* Vues devant / derrière et couleur choisie */}
            <div className="pointer-events-none absolute inset-x-0 top-0 z-10 flex items-start justify-between gap-2 p-3">
              <div className="pointer-events-auto inline-flex rounded-full bg-fond/90 p-1 shadow-carte backdrop-blur" role="group" aria-label="Vue du vêtement">
                {(['delante', 'detras'] as const).map((l) => (
                  <button
                    key={l}
                    type="button"
                    onClick={() => setLado(l)}
                    aria-pressed={lado === l}
                    className="rounded-full px-3.5 py-1.5 text-xs font-semibold text-ardoise transition-colors aria-pressed:bg-marine aria-pressed:text-white hover:text-marine aria-pressed:hover:text-white"
                  >
                    {l === 'delante' ? 'Devant' : 'Derrière'}
                  </button>
                ))}
              </div>
              <div
                className="pointer-events-auto flex max-w-[60%] items-center gap-2 rounded-full bg-fond/90 py-1 pr-3 pl-1 text-xs font-medium text-marine shadow-carte backdrop-blur"
                title={origen === 'real' ? 'Photo réelle de cette couleur' : 'Aperçu du vêtement dans cette couleur'}
              >
                <span className="h-6 w-6 shrink-0 rounded-full border border-marine/30" style={{ backgroundColor: color.hex }} aria-hidden="true" />
                <span className="truncate">{color.nombre}</span>
              </div>
            </div>
            {aviso && (
              <p role="status" className="absolute bottom-12 left-1/2 z-10 w-[calc(100%-2rem)] max-w-md -translate-x-1/2 rounded-2xl bg-fond/95 px-4 py-2 text-center text-xs font-medium text-marine backdrop-blur sm:bottom-14">
                {aviso}
              </p>
            )}
            <p className="pointer-events-none absolute bottom-3 left-1/2 z-10 hidden -translate-x-1/2 rounded-full bg-fond/90 px-3 py-1 text-xs text-marine backdrop-blur sm:block">
              Faites glisser le logo pour le déplacer dans la zone en pointillés
            </p>
          </div>
        </div>

        <Panel store={store} capturarRef={capturarRef} productos={productos} onCambiarProducto={cambiarProducto} />
      </div>
    </section>
  );
}
