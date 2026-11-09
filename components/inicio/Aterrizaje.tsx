'use client';

// Escala 9, aterrizaje: formulario corto (nombre, negocio, email o teléfono, qué necesitas y cantidad aproximada).
// Al enviar guarda lo escrito en el navegador y abre /proyecto, donde se precarga y se hace el envío real (fase 6).

import { useId, useState, type FormEvent } from 'react';
import { useRouter } from 'next/navigation';
import { IconoWhatsApp } from '@/components/layout/Iconos';
import { Boton, ESTILO_BOTON } from '@/components/ui/Botones';
import { Seccion } from '@/components/ui/Seccion';
import { CLAVE_ATERRIZAJE, type DatosAterrizaje } from '@/lib/aterrizaje';
import { TRAMOS } from '@/lib/presupuesto';
import { TEXTOS, enlaceWhatsApp } from '@/lib/site';

const campo =
  'mt-1 w-full rounded-xl border border-moon-50/15 bg-space-950/60 px-3.5 py-2.5 text-moon-50 placeholder:text-mist-300/50 focus:border-star-300 focus:outline-none focus:ring-2 focus:ring-star-300/40';

export default function Aterrizaje() {
  const id = useId();
  const router = useRouter();
  const [enviando, setEnviando] = useState(false);

  function alEnviar(e: FormEvent<HTMLFormElement>) {
    e.preventDefault();
    const datos = Object.fromEntries(new FormData(e.currentTarget).entries()) as unknown as DatosAterrizaje;
    setEnviando(true);
    try {
      sessionStorage.setItem(CLAVE_ATERRIZAJE, JSON.stringify(datos));
    } catch {
      // sin almacenamiento: se abre /proyecto igualmente
    }
    router.push('/proyecto');
  }

  return (
    <Seccion id="proyecto" escala={9} nombre="Cuéntanos tu proyecto" etiqueta="Aterrizaje" titulo="Cuéntanos tu proyecto." intro="Dos minutos. Te respondemos con presupuesto en 24 h laborables.">
      <div className="mt-10 grid gap-6 lg:grid-cols-[1.3fr_1fr]">
        <form onSubmit={alEnviar} className="rounded-3xl border border-moon-50/10 bg-space-900/50 p-6 sm:p-8">
          <div className="grid gap-4 sm:grid-cols-2">
            <label className="block text-sm font-medium text-mist-300">
              Nombre
              <input name="nombre" required autoComplete="name" className={campo} />
            </label>
            <label className="block text-sm font-medium text-mist-300">
              Negocio
              <input name="negocio" required autoComplete="organization" className={campo} />
            </label>
            <label className="block text-sm font-medium text-mist-300 sm:col-span-2">
              Email o teléfono
              <input name="contacto" required autoComplete="email" className={campo} placeholder="Para enviarte el presupuesto" />
            </label>
            <label className="block text-sm font-medium text-mist-300 sm:col-span-2">
              Qué necesitas
              <textarea name="mensaje" required rows={3} className={campo} placeholder="Por ejemplo: 40 camisetas con nuestro logo para vender en la academia" />
            </label>
            <fieldset className="sm:col-span-2">
              <legend className="text-sm font-medium text-mist-300">Cantidad aproximada</legend>
              <div className="mt-2 flex flex-wrap gap-2">
                {TRAMOS.map((t, i) => (
                  <label key={t.id} className="cursor-pointer rounded-full border border-moon-50/20 px-3.5 py-1.5 text-sm text-mist-300 transition-colors has-[:checked]:border-star-300 has-[:checked]:bg-star-300/15 has-[:checked]:text-moon-50 has-[:focus-visible]:ring-2 has-[:focus-visible]:ring-star-300">
                    <input type="radio" name="tramo" value={t.id} defaultChecked={i === 1} className="sr-only" />
                    {t.nombre}
                  </label>
                ))}
              </div>
            </fieldset>
          </div>
          <div className="mt-6 flex flex-wrap items-center gap-4">
            <Boton type="submit" tamano="grande" disabled={enviando}>
              {enviando ? 'Abriendo…' : 'Seguir con mi proyecto'}
            </Boton>
            <p className="text-xs text-mist-300">{TEXTOS.plazoPresupuesto}. Sin compromiso.</p>
          </div>
          <p id={`${id}-nota`} className="mt-4 text-xs text-mist-300/80">
            Al seguir, completas los datos en «Tu proyecto»: productos, cantidades, archivos y si quieres que vayamos a tu local.
          </p>
        </form>
        <aside className="flex flex-col justify-center rounded-3xl border border-moon-50/10 p-6 sm:p-8">
          <p className="font-display text-xl font-semibold text-moon-50">¿Prefieres hablar?</p>
          <p className="mt-2 text-mist-300">Escríbenos por WhatsApp y te respondemos en horario de oficina.</p>
          <a href={enlaceWhatsApp()} target="_blank" rel="noopener noreferrer" className={`${ESTILO_BOTON.secundario} mt-5 self-start`}>
            <IconoWhatsApp className="h-4 w-4" />
            Escríbenos por WhatsApp
          </a>
        </aside>
      </div>
    </Seccion>
  );
}
