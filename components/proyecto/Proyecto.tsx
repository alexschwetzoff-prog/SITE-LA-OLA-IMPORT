'use client';

// /proyecto (fases 4, 4.1 y 6): la cesta de presupuesto precargada (productos con color, posición y cantidad, y los
// diseños enviados desde el estudio) y el formulario en pasos de la sección 4. Desde la fase 4.1 distingue negocio y
// particular: el particular no tiene nombre de negocio ni sector, cuenta la ocasión y no se le ofrece visita. Desde la
// fase 6 el envío es real: se preparan en el navegador el logo y las capturas de cada diseño (lib/solicitud/preparar.ts),
// la acción de servidor valida y manda los dos emails, y la cesta se vacía solo si todo ha ido bien. Si falla, el
// cliente ve un mensaje claro con el botón de WhatsApp y no pierde lo que ha rellenado.

import { useEffect, useId, useRef, useState } from 'react';
import Image from 'next/image';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { enviarSolicitud } from '@/app/proyecto/acciones';
import { IconoWhatsApp } from '@/components/layout/Iconos';
import { fondoMuestra } from '@/components/catalogo/Muestras';
import { BotonEnlace, ESTILO_BOTON } from '@/components/ui/Botones';
import { CLAVE_ATERRIZAJE, leerAterrizaje } from '@/lib/aterrizaje';
import { leerLogo } from '@/lib/logos-db';
import { CLAVE_DISENO, TRAMOS, TRAMO_POR_DEFECTO, cambiarTramo, importarDisenoDelEstudio, quitarDelPresupuesto, textoPosiciones, usePresupuesto, vaciarPresupuesto, type ItemPresupuesto, type Tramo } from '@/lib/presupuesto';
import { CAMPO_INICIO, CAMPO_TRAMPA, CITAS, CLAVE_ARCHIVOS, CLAVE_AVISOS, CLAVE_CESTA, CONTACTOS, MAX_ENVIO_BYTES, USOS, formatoBytes, type TipoCliente } from '@/lib/solicitud/comun';
import type { ErrorCampo } from '@/lib/solicitud/esquema';
import { prepararEnvio } from '@/lib/solicitud/preparar';
import { TEXTOS, enlaceWhatsApp } from '@/lib/site';

export interface DatosProducto {
  tipo: string;
  foto?: string;
  /** «Desde X € / ud», «Consultar precio» o «Consultar disponibilidad»: la cesta lo enseña sin IVA. */
  precio?: string;
}

export type { TipoCliente };

type Estado = { fase: 'listo' } | { fase: 'enviando' } | { fase: 'error'; mensaje: string; campos?: ErrorCampo[] };

const FALLO_RED = 'No hemos podido enviar tu solicitud (parece un problema de conexión). Prueba otra vez en un momento o escríbenos por WhatsApp: lo que has rellenado sigue aquí.';

const NOMBRES_CAMPOS: Record<string, string> = {
  nombre: 'Nombre',
  negocio: 'Negocio',
  sector: 'Sector',
  ocasion: 'Ocasión',
  ciudad: 'Ciudad',
  email: 'Email',
  telefono: 'Teléfono',
  otro_producto: 'Otro producto',
  fecha_limite: 'Fecha límite',
  mensaje: 'Comentarios',
  franja: 'Franja preferida',
  privacidad: 'Privacidad',
};

const campo =
  'mt-1 w-full rounded-xl border border-moon-50/15 bg-space-950/60 px-3.5 py-2.5 text-moon-50 placeholder:text-mist-300/50 focus:border-star-300 focus:outline-none focus:ring-2 focus:ring-star-300/40';
const etiqueta = 'block text-sm font-medium text-mist-300';
const chip =
  'cursor-pointer rounded-full border border-moon-50/20 px-3.5 py-1.5 text-sm text-mist-300 transition-colors has-[:checked]:border-star-300 has-[:checked]:bg-star-300/15 has-[:checked]:text-moon-50 has-[:focus-visible]:ring-2 has-[:focus-visible]:ring-star-300';

function Paso({ numero, titulo, children }: { numero: number; titulo: string; children: React.ReactNode }) {
  return (
    <fieldset className="rounded-3xl border border-moon-50/10 bg-space-900/50 p-6 sm:p-8">
      <legend className="flex items-center gap-3 px-2 font-display text-xl font-semibold text-moon-50">
        <span className="flex h-8 w-8 items-center justify-center rounded-full border border-star-300/60 bg-space-950 text-sm">{numero}</span>
        {titulo}
      </legend>
      <div className="mt-4 grid gap-4 sm:grid-cols-2">{children}</div>
    </fieldset>
  );
}

/** Comprueba que el archivo original de un logo sigue guardado en el navegador (IndexedDB) y lo dice. */
function EstadoLogo({ id, lado }: { id: string; lado?: 'delantero' | 'trasero' }) {
  const [archivo, setArchivo] = useState<File | null | undefined>(undefined);
  useEffect(() => {
    let vivo = true;
    leerLogo(id).then((f) => {
      if (vivo) setArchivo(f);
    });
    return () => {
      vivo = false;
    };
  }, [id]);
  if (archivo === undefined) return null;
  return (
    <span className="block">
      {archivo
        ? `Logo ${lado ? `${lado} ` : ''}original guardado en tu navegador (${archivo.name}, ${Math.max(1, Math.round(archivo.size / 1024))} KB): irá adjunto al enviar.`
        : `El archivo del logo ${lado ? `${lado} ` : ''}ya no está en este navegador: te lo pediremos al responder.`}
    </span>
  );
}

function Tarjeta({ item, datos }: { item: ItemPresupuesto; datos?: DatosProducto }) {
  const diseno = item.diseno;
  const posiciones = textoPosiciones(item);
  const precio = datos?.precio;
  return (
    <li className="flex gap-4 rounded-2xl border border-moon-50/10 bg-space-950/50 p-3 sm:p-4">
      <div className="flex shrink-0 gap-1.5">
        {diseno?.capturas.length ? (
          diseno.capturas.map((c) => (
            // eslint-disable-next-line @next/next/no-img-element -- captura generada en el navegador (data URL)
            <img key={c.lado} src={c.url} alt={`Tu diseño por ${c.lado === 'delante' ? 'delante' : 'detrás'}`} className="h-24 w-[4.8rem] rounded-xl bg-white object-cover" />
          ))
        ) : item.foto ? (
          <Image src={item.foto} alt="" width={96} height={96} className="h-24 w-24 rounded-xl bg-white object-contain p-1" />
        ) : (
          <span className="flex h-24 w-24 items-center justify-center rounded-xl bg-moon-50/10 text-xs text-mist-300">Sin foto</span>
        )}
      </div>
      <div className="min-w-0 flex-1">
        <div className="flex items-start justify-between gap-3">
          <div className="min-w-0">
            <p className="font-display text-lg font-semibold text-moon-50">
              <Link href={`/catalogo/${item.slug}`} className="hover:underline">
                {item.nombre}
              </Link>
            </p>
            <p className="text-sm text-mist-300">{item.tipo}</p>
          </div>
          <button type="button" onClick={() => quitarDelPresupuesto(item.id)} className="shrink-0 text-sm text-mist-300 underline-offset-4 hover:text-moon-50 hover:underline">
            Quitar
          </button>
        </div>
        <p className="mt-2 flex items-center gap-2 text-sm text-moon-50">
          <span className="h-4 w-4 rounded-full border border-moon-50/30" style={{ background: fondoMuestra(item.color) }} aria-hidden="true" />
          {item.color.nombre}
        </p>
        {/* Posición de la personalización elegida en la ficha (fase 4.1) o las del diseño del estudio */}
        {diseno ? (
          <p className="mt-1 text-xs text-mist-300">
            Diseño del estudio: {diseno.colocaciones.map((c) => `${c.nombre} · ${c.anchoCm.toLocaleString('es-ES')} cm`).join(' + ') || 'sin posiciones'} · logo{diseno.logoDetras ? ' delantero' : ''} {diseno.logo.nombre}
            {diseno.logoDetras ? ` · logo trasero ${diseno.logoDetras.nombre}` : ''}
            {diseno.logoId && <EstadoLogo id={diseno.logoId} lado={diseno.logoDetras ? 'delantero' : undefined} />}
            {diseno.logoDetras && diseno.logoIdDetras && <EstadoLogo id={diseno.logoIdDetras} lado="trasero" />}
          </p>
        ) : (
          posiciones && <p className="mt-1 text-xs text-mist-300">Personalización: {posiciones}</p>
        )}
        {precio && <p className="mt-1 text-xs text-mist-300">{precio}</p>}
        <label className="mt-3 block text-xs font-medium text-mist-300">
          Cantidad aproximada
          <select value={item.tramo} onChange={(e) => cambiarTramo(item.id, e.target.value as Tramo)} className="mt-1 block rounded-lg border border-moon-50/15 bg-space-950/60 px-2.5 py-1.5 text-sm text-moon-50">
            {TRAMOS.map((t) => (
              <option key={t.id} value={t.id}>
                {t.nombre}
              </option>
            ))}
          </select>
        </label>
      </div>
    </li>
  );
}

/** Tras un envío correcto: cesta vacía (y sus archivos fuera del navegador), y nada pendiente del estudio o de la home. */
function limpiarTrasEnviar() {
  vaciarPresupuesto();
  try {
    sessionStorage.removeItem(CLAVE_DISENO);
    sessionStorage.removeItem(CLAVE_ATERRIZAJE);
  } catch {
    // sin almacenamiento: no hay nada que limpiar
  }
}

export default function Proyecto({ productos }: { productos: Record<string, DatosProducto> }) {
  const items = usePresupuesto();
  const router = useRouter();
  const id = useId();
  const [tipo, setTipo] = useState<TipoCliente>('negocio');
  const [estado, setEstado] = useState<Estado>({ fase: 'listo' });
  const inicioRef = useRef(0);
  const formRef = useRef<HTMLFormElement>(null);
  const avisoRef = useRef<HTMLDivElement>(null);
  const particular = tipo === 'particular';
  const enviando = estado.fase === 'enviando';

  // El diseño que deja el estudio («Enviar mi diseño») pasa a la cesta una sola vez.
  useEffect(() => {
    void importarDisenoDelEstudio((slug) => productos[slug]);
  }, [productos]);

  // Al montar: hora de carga (antispam: tiempo mínimo de rellenado), los datos del formulario corto de la home y la
  // visita pedida desde la ficha (?cita=local). Se rellenan sobre el HTML ya servido, sin estado, para que la página
  // llegue prerenderizada y no salte la maqueta.
  useEffect(() => {
    inicioRef.current = Date.now();
    const form = formRef.current;
    if (!form) return;
    const previo = leerAterrizaje();
    const poner = (nombre: string, valor?: string) => {
      const el = form.elements.namedItem(nombre);
      if ((el instanceof HTMLInputElement || el instanceof HTMLTextAreaElement) && valor && !el.value) el.value = valor;
    };
    const marcar = (nombre: string, valor: string) => {
      const el = form.querySelector(`input[name="${nombre}"][value="${valor}"]`);
      if (el instanceof HTMLInputElement) el.checked = true;
    };
    poner('nombre', previo.nombre);
    poner('negocio', previo.negocio);
    poner('mensaje', previo.mensaje);
    if (previo.contacto) poner(previo.contacto.includes('@') ? 'email' : 'telefono', previo.contacto);
    if (previo.tramo) marcar('tramo', previo.tramo);
    if (new URLSearchParams(window.location.search).get('cita') === 'local') marcar('cita', 'local');
  }, []);

  useEffect(() => {
    if (estado.fase === 'error' && avisoRef.current) {
      avisoRef.current.scrollIntoView({ block: 'center', behavior: 'smooth' });
      avisoRef.current.focus({ preventScroll: true });
    }
  }, [estado]);

  async function alEnviar(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    if (enviando) return;
    const form = e.currentTarget;
    setEstado({ fase: 'enviando' });
    try {
      const fd = new FormData(form);
      fd.set(CAMPO_INICIO, String(inicioRef.current));
      const sueltos = fd.getAll(CLAVE_ARCHIVOS).filter((f): f is File => f instanceof File && f.size > 0);
      fd.delete(CLAVE_ARCHIVOS);
      const preparado = await prepararEnvio(items, sueltos);
      if ('error' in preparado) {
        setEstado({ fase: 'error', mensaje: preparado.error });
        return;
      }
      fd.set(CLAVE_CESTA, JSON.stringify(preparado.lineas));
      fd.set(CLAVE_AVISOS, JSON.stringify(preparado.avisos));
      for (const a of preparado.archivos) fd.append(a.clave, a.archivo, a.archivo.name);
      const resultado = await enviarSolicitud(fd);
      if (!resultado.ok) {
        setEstado({ fase: 'error', mensaje: resultado.mensaje, campos: resultado.campos });
        return;
      }
      limpiarTrasEnviar();
      router.push('/gracias');
    } catch {
      setEstado({ fase: 'error', mensaje: FALLO_RED });
    }
  }

  const conDisenos = items.some((i) => i.diseno);
  const conPrecios = items.some((i) => productos[i.slug]?.precio?.startsWith('Desde'));

  return (
    <section className="mx-auto w-full max-w-5xl px-4 pt-28 pb-16 sm:px-6 lg:px-8 lg:pt-36">
      <div data-cielo-evitar>
        <p className="mb-3 text-xs font-semibold tracking-[0.2em] text-nova-400 uppercase">Tu proyecto</p>
        <h1 className="font-display text-4xl font-semibold tracking-tight text-moon-50 sm:text-5xl">Cuéntanos tu proyecto.</h1>
        <p className="mt-4 max-w-2xl text-lg text-mist-300">
          {particular ? 'Dos pasos cortos' : 'Tres pasos cortos'}. {TEXTOS.plazoPresupuesto.replace('Presupuesto', 'Te respondemos con presupuesto')}.
        </p>
      </div>

      {/* Cesta */}
      <div className="mt-10 rounded-3xl border border-moon-50/10 bg-space-900/50 p-6 sm:p-8">
        <div className="flex flex-wrap items-end justify-between gap-3">
          <h2 className="font-display text-2xl font-semibold text-moon-50">Tu presupuesto</h2>
          <p className="text-sm text-mist-300">
            {items.length ? `${items.length} ${items.length === 1 ? 'producto' : 'productos'}` : 'Aún no has añadido nada'}
          </p>
        </div>
        {items.length ? (
          <ul className="mt-5 space-y-3">
            {items.map((item) => (
              <Tarjeta key={item.id} item={item} datos={productos[item.slug]} />
            ))}
          </ul>
        ) : (
          <p className="mt-4 text-mist-300">Añade productos desde el catálogo o manda tu diseño desde el estudio, y aparecerán aquí con su color, posición y cantidad.</p>
        )}
        {conPrecios && (
          <p className="mt-4 text-xs leading-relaxed text-mist-300">
            {TEXTOS.sinIva} {TEXTOS.notaPrecios} {TEXTOS.pedidoMinimo}
          </p>
        )}
        <div className="mt-5 flex flex-wrap gap-3">
          <BotonEnlace href="/catalogo" variante="secundario">
            {items.length ? 'Añadir más productos' : 'Ver el catálogo'}
          </BotonEnlace>
          <BotonEnlace href="/disena/atomic-150" variante="secundario">
            Diseñar una prenda con mi logo
          </BotonEnlace>
        </div>
      </div>

      {/* Formulario por pasos: la acción de servidor valida y envía (fase 6) */}
      <form ref={formRef} className="mt-8 space-y-6" onSubmit={(e) => void alEnviar(e)} aria-describedby={`${id}-estado`}>
        {/* Campo trampa: oculto a las personas; un robot que lo rellene se queda sin envío */}
        <div aria-hidden="true" className="sr-only">
          <label>
            No rellenes este campo
            <input type="text" name={CAMPO_TRAMPA} tabIndex={-1} autoComplete="off" defaultValue="" />
          </label>
        </div>

        <Paso numero={1} titulo={particular ? 'Sobre ti' : 'Tu negocio'}>
          {/* Tipo de cliente (fase 4.1): cambia el bloque y viaja con la solicitud */}
          <fieldset className="sm:col-span-2">
            <legend className={etiqueta}>¿Es para un negocio o para ti?</legend>
            <div className="mt-2 flex flex-wrap gap-2">
              {(
                [
                  ['negocio', 'Negocio'],
                  ['particular', 'Particular'],
                ] as const
              ).map(([valor, nombre]) => (
                <label key={valor} className={chip}>
                  <input type="radio" name="tipo_cliente" value={valor} checked={tipo === valor} onChange={() => setTipo(valor)} className="sr-only" />
                  {nombre}
                </label>
              ))}
            </div>
          </fieldset>
          <label className={etiqueta}>
            Nombre *<input name="nombre" required autoComplete="name" maxLength={120} className={campo} />
          </label>
          {!particular && (
            <label className={etiqueta}>
              Negocio *<input name="negocio" required autoComplete="organization" maxLength={120} className={campo} />
            </label>
          )}
          {!particular && (
            <label className={etiqueta}>
              Sector
              <input name="sector" maxLength={120} className={campo} placeholder="Por ejemplo: academia, gimnasio, pádel, hostelería" />
            </label>
          )}
          <label className={etiqueta}>
            Ciudad
            <input name="ciudad" autoComplete="address-level2" maxLength={120} className={campo} />
          </label>
          <label className={etiqueta}>
            Email *<input name="email" type="email" required autoComplete="email" maxLength={200} className={campo} />
          </label>
          <label className={etiqueta}>
            Teléfono o WhatsApp
            <input name="telefono" type="tel" autoComplete="tel" maxLength={40} className={campo} />
          </label>
          <fieldset className="sm:col-span-2">
            <legend className={etiqueta}>Cómo prefieres que te contactemos</legend>
            <div className="mt-2 flex flex-wrap gap-2">
              {CONTACTOS.map((c, i) => (
                <label key={c.id} className={chip}>
                  <input type="radio" name="contacto_preferido" value={c.id} defaultChecked={i === 0} className="sr-only" />
                  {c.nombre}
                </label>
              ))}
            </div>
          </fieldset>
        </Paso>

        <Paso numero={2} titulo="Qué necesitas">
          <div className="sm:col-span-2">
            <p className={etiqueta}>Productos</p>
            <p className="mt-1 text-sm text-moon-50">
              {items.length
                ? items
                    .map((i) => {
                      const donde = textoPosiciones(i);
                      return `${i.nombre} (${i.color.nombre}${donde ? `, ${donde.toLowerCase()}` : ''}, ${TRAMOS.find((t) => t.id === i.tramo)?.nombre.toLowerCase()})`;
                    })
                    .join(' · ')
                : 'Los que añadas a tu presupuesto, o cuéntanoslo abajo.'}
            </p>
          </div>
          <label className={`${etiqueta} sm:col-span-2`}>
            Otro producto que no está en el catálogo
            <input name="otro_producto" maxLength={300} className={campo} placeholder="Por ejemplo: toallas de microfibra" />
          </label>
          {!items.length && (
            <fieldset className="sm:col-span-2">
              <legend className={etiqueta}>Cantidad aproximada</legend>
              <div className="mt-2 flex flex-wrap gap-2">
                {TRAMOS.map((t) => (
                  <label key={t.id} className={chip}>
                    <input type="radio" name="tramo" value={t.id} defaultChecked={t.id === TRAMO_POR_DEFECTO} className="sr-only" />
                    {t.nombre}
                  </label>
                ))}
              </div>
            </fieldset>
          )}
          <p className="text-sm font-medium text-moon-50/90 sm:col-span-2">{TEXTOS.pedidoMinimo}</p>
          {particular ? (
            <label className={`${etiqueta} sm:col-span-2`}>
              ¿Cuál es la ocasión?
              <input name="ocasion" maxLength={200} className={campo} placeholder="Cumpleaños, despedida, boda, equipo, viaje de grupo…" />
            </label>
          ) : (
            <fieldset className="sm:col-span-2">
              <legend className={etiqueta}>Para qué es</legend>
              <div className="mt-2 flex flex-wrap gap-2">
                {USOS.map((u) => (
                  <label key={u.id} className={chip}>
                    <input type="checkbox" name="uso" value={u.id} className="sr-only" />
                    {u.nombre}
                  </label>
                ))}
              </div>
            </fieldset>
          )}
          {/* La fecha nunca es obligatoria: es una petición de presupuesto (fase 4.1) */}
          <label className={etiqueta}>
            ¿Para cuándo lo necesitas? <span className="font-normal text-mist-300/70">(opcional)</span>
            <input name="fecha_limite" type="date" className={campo} />
          </label>
          <label className={etiqueta}>
            Archivos (logo, diseño)
            <input
              name={CLAVE_ARCHIVOS}
              type="file"
              multiple
              accept=".png,.jpg,.jpeg,.svg,.pdf,.ai,image/png,image/jpeg,image/svg+xml,application/pdf"
              className={`${campo} file:mr-3 file:rounded-full file:border-0 file:bg-moon-50/10 file:px-3 file:py-1 file:text-sm file:text-moon-50`}
            />
            <span className="mt-1 block text-xs text-mist-300/80">PNG, JPG, SVG, PDF o AI; hasta {formatoBytes(MAX_ENVIO_BYTES)} en total por envío. Si pesa más, mándanoslo después por WhatsApp o email.</span>
          </label>
          {conDisenos && <p className="text-sm text-mist-300 sm:col-span-2">Tus diseños del estudio van adjuntos con sus capturas delantera y trasera y los archivos de tus logos.</p>}
          <label className={`${etiqueta} sm:col-span-2`}>
            Comentarios
            <textarea name="mensaje" rows={4} maxLength={4000} className={campo} placeholder="Si quieres, cuéntanos qué tienes en mente: prendas, colores, cantidades, fechas…" />
          </label>
        </Paso>

        {!particular && (
          <Paso numero={3} titulo="¿Quieres verlas en persona?">
            <fieldset className="sm:col-span-2">
              <legend className={etiqueta}>Vamos a tu local con el muestrario, en la ciudad de Valencia</legend>
              <div className="mt-2 flex flex-wrap gap-2">
                {CITAS.map((c) => (
                  <label key={c.id} className={chip}>
                    <input type="radio" name="cita" value={c.id} defaultChecked={c.id === 'no'} className="sr-only" />
                    {c.nombre}
                  </label>
                ))}
              </div>
            </fieldset>
            <label className={`${etiqueta} sm:col-span-2`}>
              Franja preferida
              <input name="franja" maxLength={200} className={campo} placeholder="Por ejemplo: martes o jueves por la mañana" />
            </label>
          </Paso>
        )}

        <div className="rounded-3xl border border-moon-50/10 p-6 sm:p-8">
          <label className="flex items-start gap-3 text-sm text-mist-300">
            <input type="checkbox" name="privacidad" required className="mt-1 h-4 w-4 accent-star-300" />
            <span>
              He leído la{' '}
              <Link href="/privacidad" className="text-nova-400 underline underline-offset-4 hover:text-star-300">
                política de privacidad
              </Link>
              . Usaremos tus datos solo para responderte y preparar el presupuesto. *
            </span>
          </label>
          <label className="mt-3 flex items-start gap-3 text-sm text-mist-300">
            <input type="checkbox" name="logo_permiso" className="mt-1 h-4 w-4 accent-star-300" />
            <span>Confirmo que puedo usar el logo o diseño que adjunto.</span>
          </label>

          {estado.fase === 'error' && (
            <div ref={avisoRef} tabIndex={-1} role="alert" className="mt-6 rounded-2xl border border-star-300/50 bg-space-950/70 p-4 text-sm text-moon-50 focus:outline-none sm:p-5">
              <p className="font-semibold">{estado.campos ? estado.mensaje : 'No se ha enviado.'}</p>
              {estado.campos ? (
                <ul className="mt-2 list-disc space-y-1 pl-5 text-mist-300">
                  {estado.campos.map((c) => (
                    <li key={c.campo}>
                      {NOMBRES_CAMPOS[c.campo] ? <span className="text-moon-50">{NOMBRES_CAMPOS[c.campo]}: </span> : null}
                      {c.mensaje}
                    </li>
                  ))}
                </ul>
              ) : (
                <p className="mt-1 text-mist-300">{estado.mensaje}</p>
              )}
              <a
                href={enlaceWhatsApp()}
                target="_blank"
                rel="noopener noreferrer"
                className={`${ESTILO_BOTON.secundario} mt-4`}
              >
                <IconoWhatsApp className="h-4 w-4" />
                Escríbenos por WhatsApp
              </a>
            </div>
          )}

          <div className="mt-6 flex flex-wrap items-center gap-4">
            <button type="submit" disabled={enviando} aria-busy={enviando} className={ESTILO_BOTON.principal + ' px-6 py-3 text-base'}>
              {enviando ? 'Enviando…' : 'Enviar mi proyecto'}
            </button>
            <p id={`${id}-estado`} aria-live="polite" className="text-sm text-mist-300">
              {enviando ? 'Preparando tus logos y tus capturas y enviando la solicitud…' : `${TEXTOS.plazoPresupuesto.replace('Presupuesto', 'Te respondemos con presupuesto')}.`}
            </p>
          </div>
          <p className="mt-2 text-xs text-mist-300/80">Si no ves nuestro correo de confirmación, revisa la carpeta de spam o promociones.</p>
          {particular && <p className="mt-3 text-sm text-mist-300">¿Dudas? Escríbenos por WhatsApp: es la vía rápida.</p>}
          <a href={enlaceWhatsApp()} target="_blank" rel="noopener noreferrer" className={`${ESTILO_BOTON.secundario} mt-4`}>
            <IconoWhatsApp className="h-4 w-4" />
            Escríbenos por WhatsApp
          </a>
        </div>
      </form>
    </section>
  );
}
