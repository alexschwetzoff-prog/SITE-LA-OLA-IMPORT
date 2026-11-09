import type { Metadata } from 'next';
import { IconoWhatsApp } from '@/components/layout/Iconos';
import { BotonEnlace, ESTILO_BOTON } from '@/components/ui/Botones';
import { SITE, TEXTOS, enlaceWhatsApp } from '@/lib/site';
import { MENSAJE_WHATSAPP_PROYECTO_ENVIADO } from '@/lib/whatsapp';

// Página de confirmación tras enviar el formulario (fase 6): sirve para medir conversiones y no se indexa.
export const metadata: Metadata = {
  title: 'Hemos recibido tu proyecto',
  description: 'Tu solicitud ha llegado. Te respondemos con presupuesto en 24 h laborables.',
  robots: { index: false, follow: false },
};

const PASOS = [
  { titulo: 'Revisamos tu proyecto', texto: 'Si nos falta algún dato, te escribimos por la vía que hayas elegido.' },
  { titulo: TEXTOS.plazoPresupuesto, texto: 'Te lo mandamos por email, sin compromiso y sin sorpresas.' },
  { titulo: 'Lo tienes en unas 2 semanas', texto: 'Desde que confirmas el pedido. Entregamos en toda España.' },
];

export default function Gracias() {
  return (
    <section className="mx-auto w-full max-w-4xl px-4 pt-28 pb-16 sm:px-6 lg:px-8 lg:pt-36">
      <div data-cielo-evitar>
        <p className="mb-3 text-xs font-semibold tracking-[0.2em] text-nova-400 uppercase">Recibido</p>
        <h1 className="font-display text-4xl font-semibold tracking-tight text-moon-50 sm:text-5xl">Hemos recibido tu proyecto.</h1>
        <p className="mt-4 max-w-2xl text-lg text-mist-300">
          Te hemos enviado un email de confirmación. Si no lo ves en unos minutos, revisa la carpeta de spam o escríbenos por WhatsApp.
        </p>
      </div>

      <h2 className="mt-12 font-display text-2xl font-semibold text-moon-50">Qué pasa ahora</h2>
      <ol className="mt-5 grid gap-4 sm:grid-cols-3">
        {PASOS.map((p, i) => (
          <li key={p.titulo} className="rounded-3xl border border-moon-50/10 bg-space-900/50 p-6">
            <span className="flex h-8 w-8 items-center justify-center rounded-full border border-star-300/60 bg-space-950 text-sm font-semibold text-moon-50">{i + 1}</span>
            <p className="mt-4 font-display text-lg font-semibold text-moon-50">{p.titulo}</p>
            <p className="mt-2 text-sm text-mist-300">{p.texto}</p>
          </li>
        ))}
      </ol>

      <div className="mt-10 flex flex-wrap gap-3">
        <a href={enlaceWhatsApp(MENSAJE_WHATSAPP_PROYECTO_ENVIADO)} target="_blank" rel="noopener noreferrer" className={`${ESTILO_BOTON.principal} px-6 py-3 text-base`}>
          <IconoWhatsApp className="h-4 w-4" />
          Escríbenos por WhatsApp
        </a>
        <BotonEnlace href="/catalogo" variante="secundario" tamano="grande">
          Volver al catálogo
        </BotonEnlace>
      </div>
      <p className="mt-6 max-w-2xl text-sm text-mist-300">
        También puedes escribirnos a {SITE.email}. {TEXTOS.plazoPresupuesto}.
      </p>
    </section>
  );
}
